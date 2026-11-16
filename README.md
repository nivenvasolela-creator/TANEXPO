# TANEXPO — Tanzania Tourism Marketplace & Operator OS

TANEXPO is a two-sided tourism marketplace and provider operating system built for Tanzanian tour operators, safari guides, and travelers.

- **Traveler Experience**: Guest catalog discovery, destination guides & interactive Leaflet maps, operator comparison, bilingual UI (**English / Swahili**), dual currency (**TZS / USD**), quote requests, simulated sandbox checkout, booking vouchers, saved operators, and verified post-trip reviews.
- **Operator OS**: Overview metrics & "Needs Reply" triage, inquiry leads pipeline, dynamic quote builder, booking management, financial ledgers, listings CRUD, review replies, TALA license & profile settings.
- **WhatsApp for operators** (one TANEXPO business number, Meta Cloud API):
  - **Alerts and commands**: linked operators get new-request alerts, reminders and a Monday digest, and answer with short commands in English or Swahili (`LEADS`/`MAOMBI`, `ACCEPT`/`KUBALI`, `QUOTE`/`BEI`, `REPLY`/`JIBU`, `LOST`/`FUTA`, `DIGEST`/`MUHTASARI`, `PAUSE`/`SIMAMISHA`, `RESUME`/`ENDELEA`).
  - **Forward to save**: an operator forwards a customer's WhatsApp message to the TANEXPO number and it becomes a request in their pipeline. Details are extracted server-side (Gemini structured output, keyword fallback); the text is treated strictly as data.
  - Numbers not linked to an operator get a fixed signpost reply only. There is no customer-facing WhatsApp chat.
  - Until Meta approval, the dashboard's WhatsApp tab has a chat preview that behaves the same way without sending anything.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet, `vite-plugin-pwa` (offline catalog caching & web app manifest)
- **Backend**: Express (`server.ts`, `server/api.ts`, `server/auth.ts`, `server/whatsapp.ts`), Helmet CSP, `express-rate-limit`
- **Database**: Embedded Postgres via `@electric-sql/pglite` (local disk persistence via `PG_DATA_DIR`)
- **AI**: Server-side `@google/genai` SDK (never bundled to the browser)

---

## Prerequisites & Lockfile Standard

- **Node.js**: `>= 22` (see `engines` in `package.json`)
- **Package Manager**: **npm**. `package-lock.json` is the only lockfile; the `Dockerfile` runs `npm ci`. If a tool regenerates `bun.lock`, delete it.

---

## Quick Start

### 1. Install Dependencies

```bash
npm ci
```

### 2. Configure Environment

Copy `.env.example` to `.env` for local development and fill in values as needed:

```bash
cp .env.example .env
```

### 3. Run in Development

Starts the Express API server + Vite dev middleware on port `3000`:

```bash
npm run dev
```

### 4. Build & Run in Production

```bash
npx tsc --noEmit
npm run build
NODE_ENV=production \
  SESSION_SECRET="replace-with-strong-32+-char-random-secret" \
  ADMIN_SEED_EMAIL="admin@yourdomain.co.tz" \
  ADMIN_SEED_PASSWORD="replace-with-strong-admin-password" \
  npm start
```

> **Note**: In `NODE_ENV=production`, `SEED_DEMO_CATALOG` defaults to `false`, `ALLOW_DEMO_RESET` is blocked unless explicitly enabled, `PG_DATA_DIR` fails fast if unusable (no silent in-memory fallback), and simulated checkout is blocked if `PAYMENTS_MODE=live`. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for container and single-instance deployment instructions.

---

## Environment Variables

All runtime variables are documented in [`.env.example`](./.env.example). Key variables:

| Variable | Purpose | Production Default / Notes |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `3000` |
| `PG_DATA_DIR` | PGlite persistence directory | `./.data/pg` (mount persistent disk in prod, e.g. `/data/pg`) |
| `SESSION_SECRET` | HMAC/session signing secret | Set a strong random secret in production |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Seeds the admin account at boot | Only way to create an `admin` user |
| `COMMISSION_RATE` | Server-computed platform commission | `0.15` (15%) |
| `SESSION_TTL_DAYS` | Auth session expiry in days | `7` |
| `PAYMENTS_MODE` | `"simulated"` or `"live"` | `"simulated"` allows sandbox checkout; `"live"` blocks simulated payment writes |
| `SEED_DEMO_CATALOG` | Seed sample catalog on empty DB | Defaults to `false` in production, `true` in non-production |
| `ALLOW_DEMO_RESET` | Enables `POST /api/reset` for admin | Keep `"false"` in production |
| `ALLOW_FRAME_ANCESTORS` | Extra CSP `frame-ancestors` | Defaults to `'none'` in production |
| `GEMINI_API_KEY` | Server-side Gemini API key | Optional. Without it forwarded messages are read by a keyword parser |
| `GEMINI_MODEL` | Gemini model for reading forwarded messages | `gemini-3.8-flash` |
| `WHATSAPP_ENABLED` | `"true"` sends through Meta's Cloud API | `"false"`: nothing is sent |
| `WHATSAPP_VERIFY_TOKEN` | Meta webhook verification token | Required when verifying webhook |
| `WHATSAPP_APP_SECRET` | Meta App Secret (`X-Hub-Signature-256`) | In production the webhook rejects everything until this is set |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Phone Number ID | Required for live outbound messages |
| `WHATSAPP_ACCESS_TOKEN` | Meta System User access token | Required for live outbound messages |
| `ALLOW_WHATSAPP_SIMULATOR` | Dashboard WhatsApp chat preview while WhatsApp is off | `"true"` on a demo deployment; off once real WhatsApp is live |
| `WHATSAPP_QUIET_HOURS` | Hours with no business-initiated messages (Dar time) | `21-7` |

---

## Tests

```bash
npx tsc --noEmit
npm run build
npm test
```

`npm test` starts a fresh production-mode server with an empty database for each suite and runs:

- `scripts/security-test.sh` (50 checks): roles, ownership, sessions, server-computed money, reviews.
- `scripts/integrity-test.mjs` (26 checks): phone normalization, contact gating, booking guards, backups, database fail-fast.
- `scripts/whatsapp-test.mjs` (23 checks): signed webhooks, linking, commands, forwarding, scheduler, log privacy.

---

## Documentation

- **Production Deployment, Backups & Managed Postgres Migration**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **WhatsApp layer, Meta setup and templates**: [`docs/WHATSAPP_SETUP.md`](./docs/WHATSAPP_SETUP.md)
- **Showing the product to operators**: [`docs/DEMO.md`](./docs/DEMO.md)
- **Legal Pages Served by the App**: `/privacy` (Tanzania PDPA 2022) and `/terms` (Tanzania Tourism Act No. 29 of 2008)

---

## Explicitly Out of Scope

The following items are intentionally **not** implemented in this release:
- Real mobile money (M-Pesa / Tigo Pesa / Airtel Money) or card payment gateway integrations and payment webhooks (`PAYMENTS_MODE=live` intentionally blocks simulated transactions until real rails are wired).
- Automated migration code from embedded PGlite to hosted PostgreSQL (documented step-by-step in [`DEPLOYMENT.md`](./DEPLOYMENT.md)).
- Native mobile applications (Flutter, React Native, Capacitor).
- Meta WhatsApp Embedded Signup (connecting operators' own numbers), customer-facing WhatsApp chat, and payments over WhatsApp.
