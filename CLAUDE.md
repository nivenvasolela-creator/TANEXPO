# TANEXPO: project briefing for Claude Code

Read this first. It is the full context from the earlier chat sessions with Niven (founder/CTO). Treat the facts as true as of 2026-11-16; verify against the repo before relying on anything that may have changed (run `git log` and `git status`).

## 1. Who and what

- **Niven**, 19, solo technical founder in Dar es Salaam, Tanzania. Also builds ALERA (AI credit scoring for East African MFIs/SACCOs) and Forge (founder OS). TANEXPO is a separate venture.
- **TANEXPO**: tourism marketplace for Tanzania. Co-founders: Niven (CTO), Selemani (CEO), Harrison (COO).
- **Problem**: tourism service providers (tour operators, lodges, guides) struggle to reach clients because tech adoption in the sector is low.
- **Two engines**:
  1. **Provider side (build and win this first)**: a CRM/dashboard so useful and friction-free that operators depend on it, plus a **WhatsApp layer** (alerts, a Monday digest, commands) because operators live in WhatsApp, not dashboards.
  2. **Tourist marketplace (second)**: discover providers/packages/places, compare, request quotes, book, review. Runs on the provider side's live inventory.
- **Launch**: Dar es Salaam and Arusha, safaris from Arusha first. Long-term: Africa, then global, becoming the software/cloud layer for tourism.
- **Funding**: pitch investors/donors plus bootstrap.
- **Possible long-term tie-in** (do not build now): operator transaction data could feed ALERA for operator financing.

## 2. Decisions already made (do not re-litigate without a reason)

- Start with **providers**, then tourists.
- **No Flutter.** Make the existing React web app responsive and an installable **PWA**; wrap with Capacitor later only if app-store/push is needed.
- UI direction: iOS 26 "Liquid Glass"-inspired, but glass ONLY on floating/navigation layers (top bar, bottom tab bar, sheets, FABs, price pills). Content stays on solid high-contrast surfaces. Must degrade to no-blur on low-end Android (`perf-lite` mode). Most users are on cheap Android over slow networks, so performance beats effects.
- **WhatsApp design**: ONE TANEXPO WhatsApp Business number on Meta's Cloud API. Mode A: we message operators (alerts, reminders, digests); they reply with simple commands. Mode B: operators forward a customer's message to our number and AI (Gemini, structured output, text treated strictly as data) turns it into a lead. Out of scope: connecting operators' own numbers (Embedded Signup), customer-facing WhatsApp chat, payments over WhatsApp. Business-initiated messages outside the 24h window need pre-approved templates. Meta business verification and template approval take days, so use a mock adapter in dev.
- **Contact-leakage defense**: operator contact shown to tourists only after a confirmed booking (default ON); on-platform reviews and payments are the moat.
- Sequence: WhatsApp-first CRM with 10-20 Arusha operators, then marketplace on their live inventory, then payments/escrow, then AI itinerary planning, then expansion.
- **Show a thin demo to operators before over-building.** Success signals: they ask "when can I start?", offer their real WhatsApp number, or ask about price. Compliments do not count.

## 3. Repo and stack

- GitHub: `nivenvasolela-creator/TANEXPO`, branch `main` (public). Last state I reviewed: commit `cae7903` (2026-11-13), "improve database reliability and rate limiting".
- Stack: React 19 + Vite + Tailwind 4 frontend (`src/`); Express backend (`server.ts`, `server/api.ts`, `server/auth.ts`, `server/db.ts`); embedded Postgres via **PGlite**; Leaflet maps; Gemini SDK (server-side only).
- Features: tourist side (home, place/provider pages, compare, booking request, checkout, voucher, my requests, saved, reviews, compliance info). Provider side (overview, leads pipeline New/Contacted/Negotiating/Booked/Lost, bookings, financials, listings editor, quote builder, reviews, profile/verification). English + Swahili, TZS + USD, TALA license data, park fees, payment rails M-Pesa/Tigo Pesa/Airtel Money/CRDB/NMB, commission and net payout per booking.
- The code was built and changed mostly through **Google AI Studio (Gemini)**. Niven pastes prompts there. Two AI Studio apps exist: **FORGE** (a different project, never touch) and **TANEXPO**. Prompts pasted into the wrong one will say "FORGE" and "no server/ folder".
- Build/run: `npm run build` (vite build + esbuild `server.ts` to `dist/server.cjs`), `npx tsc --noEmit` for type check. `npm ci` FAILS because `package-lock.json` is out of sync (a `bun.lock` also exists); use `npm install` and decide which lockfile is authoritative.

## 4. What the earlier security pass already did (Gemini, on main)

scrypt password hashing with legacy migration; required passwords (min 8), generic login errors; role lockdown (register only tourist/provider; admin only via ADMIN_SEED_* env); session expiry + logout; helmet + express-rate-limit; requireAuth/requireRole and ownership checks on all write endpoints; GET /users removed; public `/api/catalog` vs authenticated `/api/leads|bookings|transactions|saved`; `/api/reset` gated (admin + ALLOW_DEMO_RESET + not production); admin-only provider verification; server-side providerId; server-computed commission (COMMISSION_RATE, default 0.15); reviews need the tourist's own Completed booking, one per booking; input validation; demo users only outside production; `.data/` in `.gitignore`.
I cloned it and confirmed: `tsc` clean, build passes, **47/47** checks in `scripts/security-test.sh` pass.

## 5. My patch (NOT on main as of last check)

Delivered to Niven as `tanexpo-integrity-fixes.patch` and `tanexpo-integrity-fixes-files.zip`, based on `cae7903`. My GitHub access is read-only, so he must apply it (`git apply`). It adds `server/guards.ts`, `server/phone.ts`, `scripts/integrity-test.mjs` (14 checks) and edits `server.ts`, `server/auth.ts`, `server/db.ts`, `.env.example`:
- Booking guards: Lost lead cannot be booked; no second booking per lead; expired `quote.validUntil` rejected (409).
- Rate limits: per-IP login 30/15min failures only; per-ACCOUNT failed-login 10/15min; register 20/15min; successful logins never counted (Tanzanian phones share carrier IPs).
- Phone normalization to E.164 (`+255...`) on register/login/update, startup migration, unique partial index on `users(phone)`.
- `PAYMENTS_MODE=simulated|live` (live blocks client-created transactions) with a startup warning in production.
- DB safety: replaced the destructive "recovery" that `rmSync`'d the data dir and silently fell back to in-memory. Now: rename damaged dir to `*.corrupt-<ts>`, never delete; production never falls back to in-memory; `server.ts` exits code 1 if DB init fails.
Check `server/guards.ts` exists before assuming any of this is applied.

## 6. Known open issues (not fixed)

1. Payments are fully simulated: the Pay button writes a "Paid" record with no money moving. Do not present Financials as real.
2. Production still seeds ~7 fictional "verified" operators with fake license numbers and reviews into the public catalog.
3. New providers' login email/phone default to PUBLIC contact; new providers show 5.0 stars with 0 reviews.
4. A provider can mark any booking Completed, which unlocks reviews (fake-review path). Tie to trip date/payment.
5. `package-lock.json` drift (`npm ci` fails); two lockfiles.
6. If `NODE_ENV` is unset the app runs in dev mode (headers off). Always set `NODE_ENV=production` in deploys.
7. Per-account lockout can be abused to lock someone out for 15 minutes.
8. Production CSP allows the AI Studio iframe in `frame-ancestors`; make configurable, default none in production.
9. Session tokens likely stored in plaintext in DB; hash them.
10. Quote tampering: confirm a tourist can only append messages to their own lead and only the provider can set quote/status/price. Add tests.
11. **Hosting mismatch**: Gemini configured Cloudflare Pages (`wrangler.jsonc`), but this is a long-running Node server with an on-disk DB. Pages/Workers cannot run it. Use Fly.io or Render with a persistent disk (exactly ONE instance, since PGlite is single-process). Move to hosted Postgres (Neon/Supabase) with backups before real money.
12. Need privacy policy + terms (draft, lawyer review), consent checkbox, account deletion, error monitoring.
13. History: `.data/` PGlite files were committed on 2026-09-10 and deleted later. I scanned them: demo data only, no real users, no API keys. History purge optional; no key rotation needed.

## 7. Roadmap (the master prompt `tanexpo-master-prompt.md` has the full spec)

Phase 1 server integrity (everything in sections 5-6) -> Phase 2 deployment readiness (Dockerfile, DEPLOYMENT.md, /api/health, legal pages) -> Phase 3 responsive + PWA + performance (bottom tab bar, bottom sheets, service worker that never caches private data, code-splitting, dark mode, a11y) -> Phase 4 glass UI + chat bubbles (design tokens, `.glass` with fallbacks) -> Phase 5 WhatsApp layer (webhook with HMAC signature verification, provider linking via OTP, Gemini lead parsing, commands, notification_log, scheduler in Africa/Dar_es_Salaam, mock adapter) -> Phase 6 QA and docs.
Out of scope for now: real mobile-money integration, PGlite -> hosted Postgres migration, native apps, Embedded Signup.

## 8. How to work with Niven and this repo

- **Read-only unless he says otherwise.** He has said "go for it" for improvements before, but always state what you will change. Do not push to `main` without asking; prefer a branch + PR. Do not touch git history.
- Explain plainly; he is a fast-moving founder, not a security specialist. Lead with the decision or result, then the reasons. Be honest about gaps, including in AI-generated work (Gemini's reports describe its own work; verify by cloning and running).
- Never claim something is fixed or passing without running it.
- Testing recipe (rate limiters are in-memory, so use a FRESH server each suite):
  ```
  npm install && npx tsc --noEmit && npm run build
  NODE_ENV=production PORT=3099 COMMISSION_RATE=0.15 PG_DATA_DIR=$(mktemp -d)/pg node dist/server.cjs &
  BASE_URL=http://127.0.0.1:3099/api bash scripts/security-test.sh
  # then restart fresh, and:
  BASE_URL=http://127.0.0.1:3099/api node scripts/integrity-test.mjs   (only if my patch is applied)
  ```
- Shell gotcha: `pkill -f "server.cjs"` can match and kill your own shell. Use a bracket pattern like `pkill -f "dist/s[e]rver"` or kill by PID.
- Never put secrets in the frontend bundle; never log tokens/passwords/full phone numbers; do not add new dependencies without a one-line reason.
- Security rule of thumb for every feature: server decides money, ownership, verification, and roles; never trust client-supplied amounts, ids, or flags.
- Immediate next steps, in order: (1) confirm what is on `main` now; (2) apply or recreate my patch; (3) fix open issues 1-12; (4) responsive/PWA; (5) WhatsApp layer; (6) get a thin demo in front of 10 Arusha operators.
