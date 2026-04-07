# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lawrence Farms Antiques 2 (LFA2) is a full-stack e-commerce app for an antique shop. It's a monorepo with a Vue 3 frontend, Node.js/Express backend, PostgreSQL database, and Azure Bicep infrastructure-as-code.

## Commands

### Frontend (`lfa2/`)
```bash
npm run serve        # Dev server with hot reload
npm run build        # Production build
npm run build-dev    # Development build
npm run lint         # ESLint
```

### Backend (`lfa2-backend/`)
```bash
npm run start        # Production server (port 3000)
npm run dev          # Dev server (loads .env automatically)
```

### Local Development
All local builds and runs should be done via Docker Compose — do not run `npm install`, `npm run build`, or `npm run serve` directly on the host.
```bash
docker-compose build  # Build both containers
docker-compose up     # Run frontend (port 80) + backend (port 3000)
```

Docker Compose loads env vars from `docker-compose.dev.env` by default (override with `ENV_FILE`). DB credentials come from host environment variables `LFA_DB_USERNAME`, `LFA_DB_PASSWORD`, and `CLOUDINARY_API_SECRET`.

## Architecture

### Frontend (Vue 3 SPA)
- `lfa2/src/main.js` — App entry point
- `lfa2/src/router.js` — Routes: `/` home, `/store` inventory, `/about`, `/contact`, `/admin` (Google OAuth required), `/admin/manage-item` CRUD
- `lfa2/src/store.js` — Vuex store for auth token/payload
- `lfa2/src/views/` — Page-level components
- `lfa2/src/components/` — Reusable components (`StoreItem`, `ImageCarousel`, `LfaPager`, `AdminHome`, `AddEditItem`)

The frontend uses an `entrypoint.sh` script to inject runtime environment variables into the nginx-served bundle (so the same Docker image works in dev and prod).

### Backend (Express.js)
- `lfa2-backend/app.js` — Express setup with CORS, cookie-parser, Morgan
- `lfa2-backend/routes/index.js` — All API endpoints
- `lfa2-backend/db-interface.js` — PostgreSQL connection pool (`pg` driver)
- `lfa2-backend/first-dibs-scraper.js` — Scrapes 1stDibs.com product images via Cheerio
- `lfa2-backend/image-uploader.js` — Cloudinary CDN upload integration

**Key API endpoints:**
- `GET /items?page=X&sort=recent|name&unsold=true|false&itemsPerPage=36` — Paginated inventory
- `POST /item` — Create/update item (triggers Cloudinary upload); uses `id` field to distinguish insert vs update
- `DELETE /item/:id` — Remove item by primary key
- `GET /get-hero-image?url=...` — Scrape image from 1stDibs URL
- `POST /token-signin` — Google OAuth verification (restricted to `lawrencefarmsantiques.com` G Suite domain)

### Database (PostgreSQL)

The backend uses the `pg` npm package with a connection pool (`lfa2-backend/db-interface.js`). Two auth modes are supported:
- **Managed Identity** (Azure): When `USE_MANAGED_IDENTITY=true`, acquires an Entra ID token via `@azure/identity` (`DefaultAzureCredential`). The PG username is the identity name (`AZURE_IDENTITY_NAME`, defaults to `lfa-backend-identity`).
- **Password** (local dev): When `USE_MANAGED_IDENTITY` is not `true`, uses `DB_USERNAME` and `DB_PASSWORD` env vars.

SSL is enabled when `DB_HOST` is set (i.e., connecting to a remote server) and disabled for localhost.

**Schema — `store_items` table:**
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

Column names are **snake_case** throughout the backend and frontend (e.g., `item.item_name`, `item.image`, `item.sold`). The `id` column is the primary key used for updates and deletes. Queries use PostgreSQL parameterized syntax (`$1`, `$2`, etc.).

### Database Setup

#### Azure (production)
The PostgreSQL Flexible Server is deployed independently from the app via a separate Bicep stack:

```bash
cd deploy/database
./deploy-postgres.sh    # Prompts for PG admin password, deploys to westus3
```

This creates:
- Resource group `lfa2-data`
- PostgreSQL Flexible Server `lfa-postgres` (v16, Standard_B1ms)
- Databases `lfa` (prod) and `lfa_dev` (dev)
- User-assigned managed identity `lfa-backend-identity`
- Firewall rule allowing Azure services

After deploying the server, connect via `psql` to create the `store_items` table (schema above) and grant the managed identity access:

```sql
SELECT * FROM pgaadauth_create_principal('lfa-backend-identity', false, false);
GRANT SELECT, INSERT, UPDATE, DELETE ON store_items TO "lfa-backend-identity";
GRANT USAGE, SELECT ON SEQUENCE store_items_id_seq TO "lfa-backend-identity";
```

#### Local development
For local dev, the Docker Compose backend connects to the Azure-hosted Postgres server using password auth. Set these host env vars before running `docker-compose up`:

```bash
export LFA_DB_USERNAME=<your-pg-username>
export LFA_DB_PASSWORD=<your-pg-password>
export CLOUDINARY_API_SECRET=<cloudinary-key>
```

The `docker-compose.dev.env` file sets `DB_HOST=lfa-postgres.postgres.database.azure.com` and `DB_NAME=lfa_dev`. There is no local Postgres container — dev connects to the remote Azure server.

### Infrastructure (`deploy/`)

**App infrastructure** (deployed via CI/CD):
- `main.bicep` — Subscription-scoped entry; accepts `postgresHost`, `backendIdentityId`, `backendIdentityClientId` params
- `main.bicepparam` — Parameter file; reads `BACKEND_IDENTITY_ID` and `BACKEND_IDENTITY_CLIENT_ID` from environment
- `resources.bicep` — Container App environment, frontend and backend container apps, Log Analytics
- `http-container.bicep` — Reusable template for HTTP container services; supports optional `userAssignedIdentityId`
- Images are pulled from ACR (`adotfrankpublic.azurecr.io`) tagged by 6-char git hash

**Database infrastructure** (`deploy/database/`, deployed manually):
- `postgres.bicep` — Subscription-scoped entry; creates resource group and delegates to resources module
- `postgres-resources.bicep` — PostgreSQL Flexible Server, databases, managed identity, firewall rules
- `deploy-postgres.sh` — Deploys the database stack via `az stack sub create`
- `teardown-postgres.sh` — Destroys the database stack (deletes all data)

The database and app are separate deployment stacks so the database lifecycle is independent of app deploys.

### CI/CD (`.github/workflows/build-and-deploy-to-acr.yml`)
On push to `main`:
1. Builds both Docker images via `docker-compose build`
2. Tags and pushes to ACR with short git hash
3. Deploys to Azure via `azure/bicep-deploy@v1` as stack "LFA2-Stack"

The deploy step reads `BACKEND_IDENTITY_ID` and `BACKEND_IDENTITY_CLIENT_ID` from GitHub repository variables (not secrets) and passes them to the Bicep deployment.

## Environment Variables

**Backend** (required at runtime):
- `DB_HOST` — PostgreSQL hostname (e.g., `lfa-postgres.postgres.database.azure.com`); omit for localhost
- `DB_NAME` — Database name (`lfa` for prod, `lfa_dev` for dev)
- `DB_PORT` — PostgreSQL port (default: `5432`)
- `USE_MANAGED_IDENTITY` — Set to `true` in Azure to use Entra ID token auth
- `AZURE_CLIENT_ID` — Client ID of the user-assigned managed identity (used by `@azure/identity` for token selection)
- `AZURE_IDENTITY_NAME` — Name of the managed identity used as PG username (default: `lfa-backend-identity`)
- `DB_USERNAME`, `DB_PASSWORD` — PostgreSQL credentials (used when `USE_MANAGED_IDENTITY` is not `true`)
- `CLOUDINARY_API_SECRET` — Image CDN key
- `IMAGE_FOLDER` — Cloudinary folder (`lfa-items` or `lfa-items-test`)
- `GSUITE_CLIENT_ID` — Google OAuth client ID
- `GIT_HASH` — Build version identifier
- `ALLOWED_ORIGINS` — Comma-separated list of allowed CORS origins

**Frontend:** Uses `.env`, `.env.development`, `.env.production` files per Vue CLI convention.
