# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lawrence Farms Antiques 2 (LFA2) is a full-stack e-commerce app for an antique shop. It's a monorepo with a Vue 2 frontend, Node.js/Express backend, and Azure Bicep infrastructure-as-code.

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
```bash
docker-compose build  # Build both containers
docker-compose up     # Run frontend (port 80) + backend (port 3000)
```

## Architecture

### Frontend (Vue 2 SPA)
- `lfa2/src/main.js` — App entry point; initializes Vue + Datadog RUM
- `lfa2/src/router.js` — Routes: `/` home, `/store` inventory, `/about`, `/contact`, `/admin` (Google OAuth required), `/admin/manage-item` CRUD
- `lfa2/src/store.js` — Vuex store for auth token/payload
- `lfa2/src/views/` — Page-level components
- `lfa2/src/components/` — Reusable components (`StoreItem`, `ImageCarousel`, `LfaPager`, `AdminHome`, `AddEditItem`)

The frontend uses an `entrypoint.sh` script to inject runtime environment variables into the nginx-served bundle (so the same Docker image works in dev and prod).

### Backend (Express.js)
- `lfa2-backend/app.js` — Express setup with CORS, cookie-parser, Morgan
- `lfa2-backend/routes/index.js` — All API endpoints
- `lfa2-backend/db-interface.js` — Azure SQL connection pool (tedious driver, dual connections)
- `lfa2-backend/first-dibs-scraper.js` — Scrapes 1stDibs.com product images via Cheerio
- `lfa2-backend/image-uploader.js` — Cloudinary CDN upload integration

**Key API endpoints:**
- `GET /items?page=X&sort=recent|name&unsold=true|false&itemsPerPage=36` — Paginated inventory
- `POST /item` — Create/update item (triggers Cloudinary upload)
- `DELETE /item/:image` — Remove item
- `GET /get-hero-image?url=...` — Scrape image from 1stDibs URL
- `POST /token-signin` — Google OAuth verification (restricted to `lawrencefarmsantiques.com` G Suite domain)

**Database:** Azure SQL Server via `tedious`. The `StoreItems` table has: `ItemName`, `Url` (1stDibs link), `Image` (int reference), `Sold`, `DateAdded`.

### Infrastructure (`deploy/`)
- `main.bicep` — Subscription-scoped entry; manages resource group and Key Vault secrets
- `resources.bicep` — Container App environment, frontend and backend container apps, Log Analytics
- `http-container.bicep` — Reusable template for HTTP container services
- Images are pulled from ACR (`adotfrankpublic.azurecr.io`) tagged by 6-char git hash

### CI/CD (`.github/workflows/build-and-deploy-to-acr.yml`)
On push to `main`:
1. Builds both Docker images via `docker-compose build`
2. Tags and pushes to ACR with short git hash
3. Deploys to Azure via `azure/bicep-deploy@v1` as stack "LFA2-Stack"

## Environment Variables

**Backend** (required at runtime):
- `DB_USERNAME`, `DB_PASSWORD` — Azure SQL credentials
- `DB` — Database name (`LFA` for prod, `LFA-DEV` for dev)
- `CLOUDINARY_API_SECRET` — Image CDN key
- `IMAGE_FOLDER` — Cloudinary folder (`lfa-items` or `lfa-items-test`)
- `GSUITE_CLIENT_ID` — Google OAuth client ID
- `GIT_HASH` — Build version identifier

**Frontend:** Uses `.env`, `.env.development`, `.env.production` files per Vue CLI convention.
