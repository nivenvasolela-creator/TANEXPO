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

## Deploying the demo

Both options use the root `Dockerfile` and run exactly one instance with a persistent disk mounted at `/data`. The container starts as root only to take ownership of that disk, then runs the app as the unprivileged `node` user (`docker-entrypoint.sh`).

The config files below were written without access to Render's and Fly's current documentation and have not been deployed yet. If a field name is rejected, the host's error message names it; the settings to keep are listed under "What must stay true".

### Option A: Render (no command line)

1. Push this code to GitHub. In Render choose **New > Blueprint**, pick the repository and the branch that contains `render.yaml`.
2. Render reads `render.yaml` and asks for:
   - `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` (your admin login; use a strong password)
   - `APP_URL` (leave empty the first time, then set it to the `https://...onrender.com` address)
   - `GEMINI_API_KEY` (optional)
3. Click **Apply**. The first build takes a few minutes. Open the address Render shows.

A persistent disk needs a paid instance (`plan: starter` in the file). Do not switch to a free instance: the database would be wiped on every restart.

### Option B: Fly.io (command line)

```bash
fly launch --copy-config --no-deploy
```

```bash
fly volumes create tanexpo_data --region jnb --size 1
```

```bash
fly secrets set ADMIN_SEED_EMAIL="you@example.com" ADMIN_SEED_PASSWORD="a-strong-password"
```

```bash
fly deploy --ha=false
```

`fly.toml` holds the rest (Johannesburg region, volume at `/data`, health check, one always-on machine).

### What must stay true on any host

- One instance only, never autoscaled, with a persistent disk mounted at `/data` and `PG_DATA_DIR=/data/pg`.
- `NODE_ENV=production`, port `3000`, health check `GET /api/health`.
- Demo flags: `PAYMENTS_MODE=simulated`, `SEED_DEMO_CATALOG=true`, `ALLOW_WHATSAPP_SIMULATOR=true`, `WHATSAPP_ENABLED=false`. For a site real travelers use, set `SEED_DEMO_CATALOG=false`, and turn the simulator off once real WhatsApp is live.
- HTTPS (both hosts provide it). The app installs as a phone app (PWA) only over HTTPS.

### After the first deploy

1. Open the site on a phone on mobile data. Sign in as the admin.
2. Register a test operator, open the WhatsApp tab, link a number and forward the sample message.
3. Restart the service once and confirm the operator still exists (this proves the disk is persistent).

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
