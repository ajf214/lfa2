# Plan: Change StoreItems Primary Key from ItemName to Auto-Increment ID

## Context

The `StoreItems` table currently uses `ItemName` as its primary key. This prevents adding items with duplicate names, which happens in practice since different antique pieces can share the same name. The fix is to add an `INT IDENTITY` column (`Id`) as the new primary key, making `ItemName` a regular non-unique column.

## Current State

- **Primary key:** `ItemName` (NVarChar)
- **Columns:** `ItemName`, `Url`, `Image`, `Sold`, `DateAdded`
- The `Image` column (an integer stored as NVarChar) is already used as a de facto unique identifier for deletes (`DELETE WHERE Image=@p_image`) and for Cloudinary image paths
- The upsert logic (`POST /item`, `POST /item/set-status`) uses `WHERE ItemName = @p_name` to decide insert vs update — this is what breaks on duplicate names

## Files to Modify

1. **SQL migration** (run manually against `LFA-DEV` then `LFA`)
2. **`lfa2-backend/routes/index.js`** — update queries to use `Id`
3. **`lfa2/src/components/AdminStoreItem.vue`** — pass `Id` for set-status and delete
4. **`lfa2/src/views/admin/AddEditItem.vue`** — pass `Id` when editing an existing item

## Step 1: SQL Migration (one-time, run manually)

Run against `LFA-DEV` first, then `LFA` after verifying.

```sql
-- Add the new identity column
ALTER TABLE dbo.StoreItems ADD Id INT IDENTITY(1,1) NOT NULL;

-- Drop the existing primary key on ItemName
-- (constraint name may vary — check with: SELECT name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.StoreItems'))
ALTER TABLE dbo.StoreItems DROP CONSTRAINT <PK_constraint_name>;

-- Add the new primary key
ALTER TABLE dbo.StoreItems ADD CONSTRAINT PK_StoreItems PRIMARY KEY (Id);
```

`ItemName` remains as a regular column — no data is lost, duplicates are now allowed.

## Step 2: Update backend queries

**File: `lfa2-backend/routes/index.js`**

### GET /items (line 82)
Add `Id` to the SELECT:
```sql
SELECT Id, ItemName, Url, CAST(Image AS INT) AS Image, Sold
FROM dbo.StoreItems
```

### DELETE /item/:id (line 102-118)
Change route from `/item/:image` to `/item/:id` and query from `WHERE Image=@p_image` to `WHERE Id=@p_id`:
```js
router.delete('/item/:id', async (req, res, next) => {
  // ...auth check...
  const result = await pool.request()
    .input('p_id', sql.Int, parseInt(req.params.id))
    .query('DELETE FROM dbo.StoreItems WHERE Id=@p_id')
  res.send(result.recordset)
})
```

### POST /item (lines 188-222)
Replace the upsert-by-name with explicit insert-or-update-by-id. The request body will include an `id` field when editing an existing item, and omit it when creating a new one:
```js
let query;
if (req.body.id) {
  // Update existing item
  query = `
    UPDATE dbo.StoreItems
      SET ItemName=@p_name, Url=@p_firstDibsUrl, Image=@p_imageName, Sold=@p_sold, DateAdded=GETDATE()
    WHERE Id=@p_id;
  `
} else {
  // Insert new item
  query = `
    INSERT dbo.StoreItems (ItemName, Url, Image, Sold, DateAdded)
    VALUES (@p_name, @p_firstDibsUrl, @p_imageName, @p_sold, GETDATE())
  `
}
```
This eliminates the SERIALIZABLE transaction and UPDLOCK — no longer needed since we're not checking for name collisions.

### POST /item/set-status (lines 226-255)
Change from `WHERE ItemName = @p_name` to `WHERE Id = @p_id`:
```js
const query = `UPDATE dbo.StoreItems SET Sold=@p_newStatus WHERE Id=@p_id;`

const result = await pool.request()
  .input('p_id', sql.Int, req.body.id)
  .input('p_newStatus', sql.NVarChar, req.body.newStatus)
  .query(query)
```
This also eliminates the SERIALIZABLE/UPDLOCK pattern, which was overkill for a simple status update.

### GET /latest-image-reference (lines ~155-160)
No change needed — this returns the highest Image number and is unrelated to the primary key.

## Step 3: Update AdminStoreItem component

**File: `lfa2/src/components/AdminStoreItem.vue`**

### toggleSoldStatus (line 65-71)
Pass `id` instead of `name`:
```js
const result = await axios.post(
  `${this.API_ENDPOINT}/item/set-status`,
  {
    id: this.item.Id,
    newStatus: toggledStatus,
    token: this.$store.getters.getUserToken,
  }
);
```

### deleteItem (line 92-94)
Use `Id` instead of `Image` in the URL:
```js
const result = await axios.delete(
  `${this.API_ENDPOINT}/item/${this.item.Id}?token=${this.$store.getters.getUserToken}`
);
```

### startEdit (line 54-59)
No change needed — already passes the full `this.item` object, which will now include `Id`.

## Step 4: Update AddEditItem component

**File: `lfa2/src/views/admin/AddEditItem.vue`**

### submitItem (line 86-93)
Pass `id` when editing an existing item:
```js
await axios.post(`${this.API_ENDPOINT}/item`, {
  id: this.itemForEdit ? this.itemForEdit.Id : undefined,
  name: this.name,
  imageName: imageName,
  firstDibsUrl: this.firstDibsUrl,
  cdnUrl: this.cdnUrl,
  sold: this.sold,
  token: this.$store.getters.getUserToken
})
```

## Deployment Sequence

1. **Run the SQL migration** on `LFA-DEV` (Step 1)
2. **Deploy the code changes** (Steps 2-4) — the backend and frontend ship together via CI/CD
3. **Verify** on dev: create, edit, toggle sold, and delete items
4. **Run the SQL migration** on `LFA` (prod)
5. CI/CD has already deployed the code to prod; it starts working immediately once the migration is run

Note: There is a brief window between the code deploy and the SQL migration on prod where the backend will try to SELECT `Id` but the column won't exist yet. To avoid this, the SQL migration on prod should be run **before** or **immediately after** the code deploy. Alternatively, the SELECT can fall back gracefully (see Rollback).

## Rollback

If something goes wrong after the SQL migration:
- The `Id` column is additive — it doesn't break any existing data
- To revert the code, roll back the git commit; the old queries will work since `ItemName` is still there
- To fully revert the DB: drop the new PK, re-add the old PK on `ItemName`, drop the `Id` column
