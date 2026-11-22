# TANEXPO Production Deployment Guide

## Architecture Constraints (Read Before Deploying)

1. **Cloudflare Workers & Cloudflare Pages Are Not Supported for the Full App**
   - `wrangler.jsonc` targets static `./dist` Pages output, which only builds the React frontend and does **not** run the Node.js Express server (`dist/server.cjs`) or `@electric-sql/pglite`.
   - Deploy TANEXPO as a **Node.js (>= 22) web service** with persistent disk storage (or an external managed Postgres database).

2. **Single-Instance Requirement for Embedded PGlite (`replicas = 1`)**
   - Embedded PGlite writes directly to `PG_DATA_DIR` on local disk and holds an exclusive lock.
   - **Never run more than 1 replica** against PGlite. To scale horizontally (`replicas > 1`), follow the [Migrating from PGlite to Managed Postgres](#migrating-from-pglite-to-managed-postgres) section below.

3. **Lockfile Standardization**
   - `package-lock.json` is the only lockfile and the build runs `npm ci`. If a tool regenerates `bun.lock`, delete it before committing.

---

## Production Build & Local Smoke Test

This is what the host runs. Use bash (Git Bash on Windows):

```bash
npm ci --include=dev && npm run build
```

```bash
NODE_ENV=production PAYMENTS_MODE=simulated SEED_DEMO_CATALOG=true PG_DATA_DIR=./.data/smoke-pg ADMIN_SEED_EMAIL="admin@yourdomain.co.tz" ADMIN_SEED_PASSWORD="replace-with-strong-password" node dist/server.cjs
```

Verify health in a second terminal:

```bash
curl -f http://127.0.0.1:3000/api/health
```

---

## Deploying the demo

**Free option (recommended now): Supabase + Koyeb. Follow `docs/FREE_HOSTING.md`.** With `DATABASE_URL` set, the app uses hosted Postgres (tables in the `tanexpo` schema) instead of the embedded database, so it runs on hosts that wipe their disk, and with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` package photos/videos go to Supabase Storage. The section below is the paid alternative with an embedded database on a persistent disk.


Render runs the app as a plain Node.js web service (`render.yaml`: `npm ci --include=dev && npm run build`, then `node dist/server.cjs`) with exactly one instance and a persistent disk mounted at `/var/data`. The database lives in `/var/data/pg`.

`render.yaml` has not been deployed yet. If Render rejects a field, its error message names it; the settings to keep are listed under "What must stay true".

### Option A: Render (no command line)

1. Push this code to GitHub. In Render choose **New > Blueprint**, pick the repository and the `main` branch.
2. Render reads `render.yaml` and asks for:
   - `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` (your admin login; use a strong password)
   - `APP_URL` (leave empty the first time, then set it to the `https://...onrender.com` address)
   - `GEMINI_API_KEY` (optional)
   - `GEOAPIFY_API_KEY` (optional; map tiles, see `docs/MAPS.md`)
3. Click **Apply**. The first build takes a few minutes. Open the address Render shows.

A persistent disk needs a paid instance (`plan: starter` in the file). Do not switch to a free instance: the database would be wiped on every restart.

### Photos and videos

Operators' package photos and videos are stored next to the database, in the `media` folder beside `PG_DATA_DIR`, so they live on the same persistent disk (`/var/data/media` on Render; override with `MEDIA_DIR`). Size the disk for them: up to 12 photos (about 0.5 MB each after phone-side resizing) and 3 videos (up to 40 MB each) per package. `render.yaml` asks for 5 GB. The admin backup export covers the database only; back up the media folder with a disk snapshot.

### What must stay true on any host

- One instance only, never autoscaled, with a persistent disk (Render: mounted at `/var/data`, `PG_DATA_DIR=/var/data/pg`).
- `NODE_ENV=production`, port `3000`, health check `GET /api/health`.
- Demo flags: `PAYMENTS_MODE=simulated`, `SEED_DEMO_CATALOG=true`, `ALLOW_WHATSAPP_SIMULATOR=true`, `WHATSAPP_ENABLED=false`. For a site real travelers use, set `SEED_DEMO_CATALOG=false`, and turn the simulator off once real WhatsApp is live.
- HTTPS (Render provides it). The app installs as a phone app (PWA) only over HTTPS.

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

For full disaster recovery (including password hashes and active sessions), rely on Render's daily disk snapshots of `/var/data`. If PGlite encounters catalog corruption on startup, TANEXPO automatically renames the damaged folder to `<PG_DATA_DIR>.corrupt-<timestamp>` without deleting any files.

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
- [ ] Daily disk snapshots enabled for `/var/data` and `/api/admin/backup` tested.
