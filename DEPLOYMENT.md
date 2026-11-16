# TANEXPO Production Deployment Guide

## Architecture Constraints (Read Before Deploying)

1. **Cloudflare Workers & Cloudflare Pages Are Not Supported for the Full App**
   - `wrangler.jsonc` targets static `./dist` Pages output, which only builds the React frontend and does **not** run the Node.js Express server (`dist/server.cjs`) or `@electric-sql/pglite`.
   - Deploy TANEXPO as a **containerized Node.js (>= 22) service** with persistent disk storage (or an external managed Postgres database).

2. **Single-Instance Requirement for Embedded PGlite (`replicas = 1`)**
   - Embedded PGlite writes directly to `PG_DATA_DIR` on local disk and holds an exclusive lock.
   - **Never run more than 1 replica** against PGlite. To scale horizontally (`replicas > 1`), follow the [Migrating from PGlite to Managed Postgres](#migrating-from-pglite-to-managed-postgres) section below.

3. **Lockfile Standardization**
   - `package-lock.json` is the only lockfile and the `Dockerfile` runs `npm ci`. If a tool regenerates `bun.lock`, delete it before committing.

---

## Container Build & Local Smoke Test

```bash
docker build -t tanexpo:latest .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PAYMENTS_MODE=simulated \
  -e SEED_DEMO_CATALOG=false \
  -e ADMIN_SEED_EMAIL="admin@yourdomain.co.tz" \
  -e ADMIN_SEED_PASSWORD="replace-with-strong-password" \
  -v tanexpo_pg:/data/pg \
  tanexpo:latest
```

Verify health:

```bash
curl -f http://127.0.0.1:3000/api/health
```

---

## Deploying to Fly.io (Recommended Single-Instance Setup)

1. Install `flyctl` and initialize without overwriting `Dockerfile`:
   ```bash
   fly launch --no-deploy --copy-config=false
   ```
2. Create a persistent volume for PGlite (1 GB initial, in Johannesburg `jnb` or nearest region):
   ```bash
   fly volumes create tanexpo_pg --region jnb --size 1
   ```
3. Configure `fly.toml`:
   ```toml
   app = "tanexpo"
   primary_region = "jnb"

   [build]
     dockerfile = "Dockerfile"

   [env]
     NODE_ENV = "production"
     PORT = "3000"
     PG_DATA_DIR = "/data/pg"
     PAYMENTS_MODE = "simulated"
     SEED_DEMO_CATALOG = "false"

   [mounts]
     source = "tanexpo_pg"
     destination = "/data/pg"

   [[services]]
     internal_port = 3000
     protocol = "tcp"
     auto_stop_machines = "off"
     min_machines_running = 1

     [[services.ports]]
       handlers = ["http"]
       port = 80
     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

     [[services.http_checks]]
       interval = "30s"
       timeout = "5s"
       method = "GET"
       path = "/api/health"
   ```
4. Set secrets and deploy with **exactly 1 machine** (`--ha=false`):
   ```bash
   fly secrets set \
     ADMIN_SEED_EMAIL="admin@yourdomain.co.tz" \
     ADMIN_SEED_PASSWORD="replace-with-strong-password" \
     GEMINI_API_KEY="your-gemini-api-key"
   fly deploy --ha=false
   ```

---

## Deploying to Render

1. Create a **Web Service** connected to your repository with **Environment: Docker** (`Dockerfile`).
2. Add a **Persistent Disk** mounted at `/data/pg` (minimum 1 GB).
3. Set **Instance Count = 1** (scaling is unavailable for PGlite local disk).
4. Set **Health Check Path** to `/api/health`.
5. Add Environment Variables:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `PG_DATA_DIR=/data/pg`
   - `PAYMENTS_MODE=simulated`
   - `SEED_DEMO_CATALOG=false`
   - `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`
   - `GEMINI_API_KEY` (if AI inquiry parsing / WhatsApp mode is enabled)

---

## Backups & Restore

### Exporting a Sanitized Database Backup

Authenticated `admin` users can download a gzipped JSON snapshot of all application tables (`users` without `password_hash`, `providers`, `listings`, `leads`, `bookings`, `reviews`, `transactions`, `saved_providers`):

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-domain.com/api/admin/backup \
  -o "tanexpo-backup-$(date +%F).json.gz"
```

Verify archive integrity:

```bash
gzip -t tanexpo-backup-*.json.gz && zcat tanexpo-backup-*.json.gz | head -c 300
```

### Volume Snapshot Recovery (PGlite)

For full disaster recovery (including password hashes and active sessions), rely on Fly/Render daily persistent volume snapshots of `/data/pg`. If PGlite encounters catalog corruption on startup, TANEXPO automatically renames the damaged folder to `<PG_DATA_DIR>.corrupt-<timestamp>` without deleting any files.

---

## Migrating from PGlite to Managed Postgres (Neon / Supabase / Cloud SQL)

1. Provision a PostgreSQL 16+ database and add `pg` (`npm install pg && npm install -D @types/pg`).
2. Replace `new PGlite(dataDir)` in `server/db.ts` with a `pg.Pool({ connectionString: process.env.DATABASE_URL })` wrapper implementing `.query(sql, params)` and `.exec(sql)`.
3. Keep the schema SQL in `initSchemaAndSeed()` (standard Postgres `CREATE TABLE IF NOT EXISTS ...` and `JSONB` columns).
4. Migrate existing data by exporting from `/api/admin/backup` (or dumping from PGlite via `pg_dump` / script) and inserting into the managed Postgres tables.
5. Remove the single-instance (`replicas=1`) restriction once `DATABASE_URL` points to managed Postgres.

---

## Pre-Go-Live Security & Compliance Checklist

- [ ] `NODE_ENV=production` and `SEED_DEMO_CATALOG=false` verified on `/api/config`.
- [ ] `PAYMENTS_MODE=live` **only** after integrating real mobile-money / card partner webhooks (currently out of scope — simulated checkout is blocked in `live` mode).
- [ ] `ALLOW_DEMO_RESET` unset or `false`.
- [ ] `ALLOW_FRAME_ANCESTORS` unset (defaults to `'none'` in production) unless intentionally embedded on a trusted domain.
- [ ] `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` set to strong unique credentials; demo passwords removed.
- [ ] `/privacy` and `/terms` reviewed and approved by Tanzanian legal counsel (Personal Data Protection Act, 2022 & Tourism Act No. 29 of 2008).
- [ ] Daily persistent volume snapshots enabled for `/data/pg` and `/api/admin/backup` tested.
