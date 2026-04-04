# Plan: Migrate from Azure SQL to PostgreSQL Flexible Server

## Context

This plan merges three previously separate efforts into one migration:
1. **Switch from Azure SQL to Azure Database for PostgreSQL Flexible Server** — motivated by poor Azure SQL tooling (Azure Data Studio retired, mssql VS Code extension poorly maintained). PostgreSQL has excellent tooling (pgAdmin, DBeaver, psql CLI) and a stronger Node.js ecosystem (`pg` driver). Cost goes from ~$5/mo to ~$13-15/mo, which is acceptable.
2. **Change the primary key from `ItemName` to an auto-increment `Id`** — duplicate item names are currently blocked because `ItemName` is the PK. Since we're creating a new database anyway, we design the schema correctly from the start.
3. **Use Managed Identity for auth in Azure** — PostgreSQL Flexible Server supports Microsoft Entra authentication. Since we're rewriting `db-interface.js` anyway, we build in managed identity support from day one.

## Current State

- **Database:** Azure SQL Server (`cdc0uyw7bh.database.windows.net`), databases `LFA` (prod) and `LFA-DEV` (dev)
- **Driver:** `mssql` npm package with username/password auth
- **Schema:** Single `StoreItems` table with PK on `ItemName` (NVarChar). Columns: `ItemName`, `Url`, `Image` (NVarChar used as int), `Sold` (NVarChar, either `'isSold'` or null), `DateAdded`
- **Queries:** T-SQL with `OFFSET/FETCH`, `SERIALIZABLE` transactions for upserts, `GETDATE()`, `CONVERT(int, Image)`

## New Schema (PostgreSQL)

```sql
CREATE TABLE store_items (
  id            SERIAL PRIMARY KEY,
  item_name     TEXT NOT NULL,
  url           TEXT,
  image         INTEGER NOT NULL,
  sold          BOOLEAN NOT NULL DEFAULT FALSE,
  date_added    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_store_items_image ON store_items (image DESC);
CREATE INDEX idx_store_items_name ON store_items (item_name);
```

Key differences from current schema:
- `id` is a `SERIAL` auto-increment PK — `ItemName` is no longer unique
- `image` is a proper `INTEGER` instead of NVarChar-cast-to-int
- `sold` is a proper `BOOLEAN` instead of the `'isSold'`/null string convention
- Column names use `snake_case` (PostgreSQL convention)

## Files to Modify

### Phase 1 (database — deployed manually, verified before any code changes)
1. **`deploy/postgres.bicep`** *(new)* — subscription-scoped entry point; creates `lfa2-data` resource group
1. **`deploy/postgres-resources.bicep`** *(new)* — resource-group-scoped module with PostgreSQL server, databases, and user-assigned managed identity

### Phase 2 (application code — only after Phase 1 is verified)
2. **`lfa2-backend/package.json`** — swap `mssql` for `pg`; add `@azure/identity` for managed identity
3. **`lfa2-backend/db-interface.js`** — full rewrite: `pg.Pool` with Entra token auth (Azure) or password (local)
4. **`lfa2-backend/routes/index.js`** — rewrite all queries from T-SQL to PostgreSQL; update to use `id` PK and boolean `sold`
5. **`deploy/resources.bicep`** — accept `postgresHost` and identity params; update backend env vars
6. **`deploy/main.bicep`** — remove `dbPassword` Key Vault ref; add `postgresHost` and identity params
7. **`deploy/http-container.bicep`** — add user-assigned managed identity support
8. **`lfa2/src/components/AdminStoreItem.vue`** — pass `id` instead of `name`/`image` for mutations; adapt to boolean `sold`
9. **`lfa2/src/views/admin/AddEditItem.vue`** — pass `id` when editing existing item
10. **`docker-compose.yaml`** — add local PostgreSQL container; update backend env vars
11. **`db/init.sql`** *(new)* — schema file for local dev auto-init

---

## Phase 1: Database (no app code changes)

Complete and verify all of these before touching any application code.

### Step 1: Provision PostgreSQL Flexible Server + managed identity

The PostgreSQL infrastructure is split across two Bicep files, following the same pattern as `main.bicep` / `resources.bicep`. Deployed manually via CLI — not through CI/CD.

- **`deploy/postgres.bicep`** — subscription-scoped entry point. Creates the `lfa2-data` resource group, then delegates to the module.
- **`deploy/postgres-resources.bicep`** — resource-group-scoped module with the actual resources (identity, server, databases, firewall rule).

Deploy with:
```bash
az deployment sub create \
  --location eastus \
  --template-file deploy/postgres.bicep \
  --parameters administratorLogin=<admin-user> administratorPassword=<admin-pass>
```

After deploying, note the outputs — `postgresHost`, `backendIdentityId`, and `backendIdentityClientId` are all needed by the main deployment later in Phase 2.

### Step 2: Create schema

Connect via psql using the admin credentials from Step 1 and run the schema on both databases:

```bash
psql "host=lfa-postgres.postgres.database.azure.com dbname=lfa_dev user=<admin> sslmode=require"
```

Run the SQL from the "New Schema" section above. Repeat for the `lfa` database.

### Step 3: Set up managed identity access

The user-assigned identity (`lfa-backend-identity`) already exists from Step 1, so this can be done immediately — no need to wait for any app deploy.

```sql
-- In PostgreSQL (connected as admin), run on BOTH lfa_dev and lfa:
SELECT * FROM pgaadauth_create_principal('lfa-backend-identity', false, false);
GRANT SELECT, INSERT, UPDATE, DELETE ON store_items TO "lfa-backend-identity";
GRANT USAGE, SELECT ON SEQUENCE store_items_id_seq TO "lfa-backend-identity";
```

Verify the identity can connect and query the tables.

### Step 4: Migrate data

Export from Azure SQL, transform, and import to PostgreSQL:

```sql
-- In Azure SQL, export data:
SELECT ItemName, Url, CAST(Image AS INT) AS Image,
       CASE WHEN Sold = 'isSold' THEN TRUE ELSE FALSE END AS Sold,
       DateAdded
FROM dbo.StoreItems
```

This can be done via a simple script or CSV export/import. The `id` column auto-populates via `SERIAL`.

Verify row counts match and data looks correct.

### Phase 1 Checkpoint

At this point, the PostgreSQL server is fully set up with schema, data, and identity permissions — all independently verified. The existing app is still running against Azure SQL, completely unaffected.

---

## Phase 2: Application code

Only begin after Phase 1 is complete and verified.

### Step 5: Rewrite `db-interface.js`

**File: `lfa2-backend/package.json`**

- Remove `mssql` dependency
- Add `pg` (e.g., `^8.13.0`)
- Add `@azure/identity` (e.g., `^4.0.0`)

**File: `lfa2-backend/db-interface.js`** — full rewrite:

```js
const { Pool } = require('pg')
require('dotenv').config()

const useManagedIdentity = process.env.USE_MANAGED_IDENTITY === 'true'

async function createPool() {
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lfa_dev',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : false,
    max: 5,
    min: 1,
  }

  if (useManagedIdentity) {
    const { DefaultAzureCredential } = require('@azure/identity')
    // AZURE_CLIENT_ID env var tells DefaultAzureCredential which user-assigned identity to use
    const credential = new DefaultAzureCredential()
    const token = await credential.getToken('https://ossrdbms-aad.database.windows.net/.default')
    baseConfig.user = process.env.AZURE_CLIENT_ID  // for Entra auth, the "user" is the identity's client ID
    baseConfig.password = token.token
    console.log('Auth mode: managed-identity')
  } else {
    baseConfig.user = process.env.DB_USERNAME
    baseConfig.password = process.env.DB_PASSWORD
    console.log('Auth mode: password')
  }

  return new Pool(baseConfig)
}

const poolPromise = createPool()
poolPromise.then(p => p.query('SELECT 1')).then(() => console.log('connected')).catch(err => console.log('DB connection failed:', err))

module.exports = { poolPromise }
```

> **Note:** For managed identity with PostgreSQL, the access token expires. For a production-grade setup, we should refresh the token periodically. This can be done later — with a single admin user and low traffic, token expiration (~1 hour) is unlikely to be hit frequently. A simple approach is to recreate the pool on auth error.

### Step 6: Rewrite backend queries

**File: `lfa2-backend/routes/index.js`**

All queries change from T-SQL to PostgreSQL syntax. The `pool` import changes to:

```js
const { poolPromise } = require('../db-interface')
// At the top of each route handler:
const pool = await poolPromise
```

#### GET /items

```js
const dbSort = sort === 'recent' ? 'image' : 'item_name'
const sortDir = dbSort === 'item_name' ? 'ASC' : 'DESC'
const offset = (parseInt(page) - 1) * parseInt(itemsPerPage)

let query = `
  SELECT id, item_name, url, image, sold
  FROM store_items
  ${unsold === 'true' ? "WHERE sold = FALSE" : ""}
  ORDER BY ${dbSort} ${sortDir}
  LIMIT $1 OFFSET $2
`

const result = await pool.query(query, [parseInt(itemsPerPage), offset])
res.send(result.rows)
```

#### GET /all-items

```js
const query = `
  SELECT COUNT(*) AS item_count
  FROM store_items
  ${unsold === 'true' ? "WHERE sold = FALSE" : ""}
`
const result = await pool.query(query)
res.send(result.rows[0])
```

#### DELETE /item/:id

Route changes from `/item/:image` to `/item/:id`:

```js
const result = await pool.query('DELETE FROM store_items WHERE id = $1', [parseInt(req.params.id)])
res.send({ deleted: result.rowCount })
```

#### POST /item

Replace the SERIALIZABLE upsert with simple insert-or-update-by-id:

```js
let result
if (req.body.id) {
  result = await pool.query(
    `UPDATE store_items
     SET item_name = $1, url = $2, image = $3, sold = $4, date_added = NOW()
     WHERE id = $5`,
    [req.body.name, req.body.firstDibsUrl, req.body.imageName, !!req.body.sold, req.body.id]
  )
} else {
  result = await pool.query(
    `INSERT INTO store_items (item_name, url, image, sold, date_added)
     VALUES ($1, $2, $3, $4, NOW())`,
    [req.body.name, req.body.firstDibsUrl, req.body.imageName, !!req.body.sold]
  )
}
res.send({ rowCount: result.rowCount })
```

#### POST /item/set-status

```js
const result = await pool.query(
  'UPDATE store_items SET sold = $1 WHERE id = $2',
  [req.body.newStatus === 'isSold', req.body.id]
)
res.send({ rowCount: result.rowCount })
```

#### GET /latest-image-reference

```js
const result = await pool.query(
  'SELECT * FROM store_items ORDER BY image DESC LIMIT 1'
)
res.send(result.rows[0])
```

### Step 7: Update app Bicep files

#### `deploy/resources.bicep`

The main Bicep file does **not** own the PostgreSQL server or the identity. It receives them as parameters:

```bicep
param postgresHost string             // e.g. 'lfa-postgres.postgres.database.azure.com'
param backendIdentityId string        // resource ID of the user-assigned identity
param backendIdentityClientId string  // client ID, passed to the app so @azure/identity can use it
```

Remove the `@secure() param dbPassword string` parameter.

Update backend module env vars — remove `DB_USERNAME`, `DB_PASSWORD`, `DB`; add:

```bicep
{ name: 'DB_HOST',                    value: postgresHost }
{ name: 'DB_NAME',                    value: deploymentType == 'prod' ? 'lfa' : 'lfa_dev' }
{ name: 'USE_MANAGED_IDENTITY',       value: 'true' }
{ name: 'AZURE_CLIENT_ID',            value: backendIdentityClientId }
```

`AZURE_CLIENT_ID` tells `DefaultAzureCredential` which identity to use when the Container App has the user-assigned identity attached.

Pass identity info to the backend container module:

```bicep
userAssignedIdentityId: backendIdentityId
```

#### `deploy/http-container.bicep`

Add param and identity block for user-assigned identity:

```bicep
param userAssignedIdentityId string = ''

// In the container app resource, add:
identity: !empty(userAssignedIdentityId) ? {
  type: 'UserAssigned'
  userAssignedIdentities: {
    '${userAssignedIdentityId}': {}
  }
} : null
```

#### `deploy/main.bicep`

- Remove `dbPassword: kv.getSecret('db-password')` from the stack module params
- Add `postgresHost`, `backendIdentityId`, and `backendIdentityClientId` params (can be hardcoded after initial provisioning, or passed via CI/CD pipeline variables)

### Step 8: Update frontend components

#### `lfa2/src/components/AdminStoreItem.vue`

**toggleSoldStatus:** Send `id` instead of `name`. Also adapt to boolean `sold` — the response will now have `sold: true/false` instead of `'isSold'/null`.

```js
const result = await axios.post(
  `${this.API_ENDPOINT}/item/set-status`,
  {
    id: this.item.id,
    newStatus: toggledStatus,
    token: this.$store.getters.getUserToken,
  }
)
```

**deleteItem:** Use `id` in URL:

```js
const result = await axios.delete(
  `${this.API_ENDPOINT}/item/${this.item.id}?token=${this.$store.getters.getUserToken}`
)
```

**Sold display logic:** Anywhere that checks `item.Sold === 'isSold'` changes to `item.sold === true`. The casing also changes from `item.ItemName` → `item.item_name`, `item.Image` → `item.image`, etc.

#### `lfa2/src/views/admin/AddEditItem.vue`

**submitItem:** Include `id` when editing:

```js
await axios.post(`${this.API_ENDPOINT}/item`, {
  id: this.itemForEdit ? this.itemForEdit.id : undefined,
  name: this.name,
  imageName: imageName,
  firstDibsUrl: this.firstDibsUrl,
  cdnUrl: this.cdnUrl,
  sold: this.sold,
  token: this.$store.getters.getUserToken
})
```

#### All frontend files referencing item properties

Column names change from PascalCase (SQL Server convention) to snake_case (PostgreSQL convention):
- `item.ItemName` → `item.item_name`
- `item.Image` → `item.image`
- `item.Url` → `item.url`
- `item.Sold` → `item.sold` (now boolean, not string)
- `item.DateAdded` → `item.date_added`
- New: `item.id`

> **Alternative:** To minimize frontend changes, the backend `SELECT` queries could use `AS` aliases to preserve PascalCase names (e.g., `SELECT id AS "Id", item_name AS "ItemName"`). This is a judgment call — it hides the real column names but reduces the blast radius on the frontend. **Recommend:** Just update the frontend. The codebase is small and this is a one-time change.

### Step 9: Set up local development (docker-compose)

Add a PostgreSQL container to `docker-compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: lfa_dev
      POSTGRES_USER: lfa_local
      POSTGRES_PASSWORD: localdev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql  # schema auto-runs on first start

volumes:
  pgdata:
```

Create `db/init.sql` with the schema from the "New Schema" section.

Update backend service env vars in docker-compose:

```yaml
backend:
  environment:
    DB_HOST: postgres
    DB_NAME: lfa_dev
    DB_USERNAME: lfa_local
    DB_PASSWORD: localdev
```

### Step 10: Test locally and deploy

1. **Test locally:** Run via docker-compose with local PostgreSQL container. Verify full CRUD.
2. **Deploy to dev:** Push to trigger CI/CD. Verify against `lfa_dev`.
3. **Deploy to prod:** Verify against `lfa`.
4. **Decommission Azure SQL:** Once confirmed working, delete the Azure SQL server to stop billing.

## Rollback

- The Azure SQL server stays running until we explicitly decommission it.
- To roll back: revert the code changes (git revert) and redeploy. The old backend talks to the old database.
- No data is lost — the PostgreSQL server can be deleted and we're back to the original state.

## Open Questions

- **Token refresh for managed identity:** The `@azure/identity` token for PostgreSQL expires after ~1 hour. For this low-traffic app, the simplest approach is to catch auth errors and recreate the pool. Worth revisiting if connection drops become noticeable.
- **Backup strategy:** PostgreSQL Flexible Server has built-in backups (7-day retention by default). Confirm this is sufficient.
