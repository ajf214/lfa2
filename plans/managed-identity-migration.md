# Plan: Migrate Azure SQL Auth to Managed Identity

## Context

The backend currently authenticates to Azure SQL with a username (`sonofdiesel`) and password. The password flows through a 3-hop chain: Key Vault → Bicep secure param → plaintext env var in the Container App. Managed Identity eliminates the password entirely in Azure — the Container App gets an identity that Azure SQL trusts directly. Local dev via docker-compose keeps using username/password.

## Files to Modify

1. **`lfa2-backend/package.json`** — add `@azure/identity` dependency
2. **`lfa2-backend/db-interface.js`** — conditional auth (managed identity vs password)
3. **`deploy/http-container.bicep`** — add optional system-assigned identity to Container App
4. **`deploy/resources.bicep`** — swap DB env vars for managed identity flag, remove `dbPassword` param
5. **`deploy/main.bicep`** — remove `dbPassword` Key Vault reference

## Step 1: Add `@azure/identity` dependency

**File: `lfa2-backend/package.json`**

Add `"@azure/identity": "^4.0.0"` to dependencies. Required by `mssql` v11 for AAD token auth.

## Step 2: Update DB connection config

**File: `lfa2-backend/db-interface.js`**

- Check `process.env.USE_MANAGED_IDENTITY === 'true'`
- If true: use `authentication: { type: 'azure-active-directory-default' }` (no user/password)
- If false: use current `user`/`password` from env vars (local dev path)
- Also add `DB_SERVER` env var with fallback to current hardcoded hostname, fixing the "DB hostname hardcoded" item from the audit

## Step 3: Add identity to Container App template

**File: `deploy/http-container.bicep`**

- Add param `param useSystemAssignedIdentity bool = false`
- Add `identity` block (top-level, alongside `properties`) that sets `type: 'SystemAssigned'` when true
- Add output `principalId` for reference

## Step 4: Update backend env vars in Bicep

**File: `deploy/resources.bicep`** (lines 110-143)

- Remove `DB_USERNAME` and `DB_PASSWORD` env var entries
- Add `USE_MANAGED_IDENTITY` = `'true'` and `DB_SERVER` = `'cdc0uyw7bh.database.windows.net'`
- Pass `useSystemAssignedIdentity: true` to the backend module
- Remove the `@secure() param dbPassword string` parameter (line 14-15)

**File: `deploy/main.bicep`** (line 31)

- Remove `dbPassword: kv.getSecret('db-password')` from the stack module params

## Step 5: Local dev — no changes needed

`docker-compose.yaml` keeps `DB_USERNAME` and `DB_PASSWORD`. Without `USE_MANAGED_IDENTITY`, the code falls back to password auth automatically.

**Important:** The `sonofdiesel` SQL login must remain active on the server for local dev to work. Server-level authentication must stay set to "Both" (SQL + Azure AD) in the Azure portal — do **not** switch to "Azure AD only", as that would block password auth on all databases including `LFA-DEV`.

## Step 6: One-time manual SQL setup (post-deploy, not in code)

The SQL server must have an Azure AD admin configured in the portal first.

**`LFA-DEV` (dev database):** Grant managed identity access alongside existing password auth. The `sonofdiesel` user stays so local dev can connect via username/password.

```sql
CREATE USER [lfa-backend-02] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [lfa-backend-02];
ALTER ROLE db_datawriter ADD MEMBER [lfa-backend-02];
```

**`LFA` (prod database):** Grant managed identity access and remove password-based user. Prod should only be accessible via managed identity.

```sql
CREATE USER [lfa-backend-02] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [lfa-backend-02];
ALTER ROLE db_datawriter ADD MEMBER [lfa-backend-02];
DROP USER [sonofdiesel];
```

## Deployment Sequence (to avoid downtime)

1. **Phase 1:** Deploy Bicep with identity enabled but keep `DB_USERNAME`/`DB_PASSWORD` env vars AND add `USE_MANAGED_IDENTITY=false`. This creates the identity without switching auth yet.
2. **Phase 2:** Run the SQL grant commands from Step 6.
3. **Phase 3:** Deploy again, flipping `USE_MANAGED_IDENTITY=true` and removing `DB_USERNAME`/`DB_PASSWORD`.

For simplicity, Steps 1 and 3 can be collapsed into one deploy if brief downtime is acceptable.

## Rollback

Set `USE_MANAGED_IDENTITY` to anything other than `'true'` and re-add `DB_USERNAME`/`DB_PASSWORD` env vars.

## Verification

1. `docker-compose build` — confirm backend image builds with new `@azure/identity` dep
2. `docker-compose up` — confirm local dev still connects via password auth
3. After Azure deploy + SQL grant: check Container App logs for "Auth mode: managed-identity" and "connected"
