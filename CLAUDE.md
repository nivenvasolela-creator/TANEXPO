# TANEXPO: project briefing for Claude Code

Read this first. Sections 1, 2 and 8 come from earlier chat sessions with Niven (founder/CTO); sections 3 to 7 describe the repo as of 2026-11-16. Verify against the repo before relying on anything that may have changed (run `git log` and `git status`).

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

- GitHub: `nivenvasolela-creator/TANEXPO`, branch `main` (public). State described here: branch `claude/trusting-ride-17euiv` on 2026-11-16, built on `3faf797`. Check whether it has been merged before relying on this.
- Stack: React 19 + Vite + Tailwind 4 frontend (`src/`), installable PWA (`vite-plugin-pwa`); Express backend (`server.ts`, `server/api.ts`, `server/auth.ts`, `server/db.ts`, `server/whatsapp.ts`, `server/scheduler.ts`, `server/guards.ts`, `server/phone.ts`, `server/config.ts`); embedded Postgres via **PGlite**; Leaflet maps; Gemini SDK (server-side only).
- Features: tourist side (home, place/provider pages, compare, booking request, checkout, voucher, my requests, saved, reviews, compliance info). Provider side (overview, leads pipeline, WhatsApp tab, bookings, financials, listings editor, quote builder, reviews, profile/verification). English + Swahili, TZS + USD, legal pages (drafts), account deletion, admin backup export.
- Much of the code was generated through **Google AI Studio (Gemini)**. Two AI Studio apps exist: **FORGE** (a different project, never touch) and **TANEXPO**. Gemini's own reports and tests describe its own work; verify by running.
- Build/test: `npm ci`, `npx tsc --noEmit`, `npm run build`, `npm test` (runs all three suites, each against a fresh production-mode server). npm is the only lockfile.
- Docs: `docs/MAPS.md`, `docs/LAUNCH.md` (launch checklist with links), `README.md`, `DEPLOYMENT.md`, `docs/WHATSAPP_SETUP.md`, `docs/DEMO.md`. Local demo: `npm run build && npm run demo` (or `npm run demo:public` for a Cloudflare Tunnel link; settings in the uncommitted `.env.demo`).

## 4. What is done (verified by running, 2026-11-16)

- Security pass: scrypt passwords, hashed session tokens, role lockdown, ownership checks on every write, server-computed money, rate limits, CSP with `frame-ancestors 'none'` by default in production.
- Integrity: booking guards (Lost lead, duplicate booking, expired quote), E.164 phone normalization with unique index, `PAYMENTS_MODE=simulated|live`, non-destructive DB recovery, fail-fast DB init, no demo catalog in production unless `SEED_DEMO_CATALOG=true`.
- Payments stay simulated, and the UI says so: demo banners, no fake control-number instructions, no "licensed payment partner" claims while `PAYMENTS_MODE=simulated`.
- Reviews: need the tourist's own Completed booking; a tourist's booking can only be completed after its trip date AND with a recorded payment; only the tourist (or admin) can record a simulated payment.
- WhatsApp layer per section 2: Mode A alerts + commands, Mode B forward-to-lead, fixed reply to unlinked numbers, HMAC-verified webhook (production rejects everything without `WHATSAPP_APP_SECRET`), OTP linking, scheduler (Monday digest, reminders, quiet hours), templates outside the 24h window, dashboard preview simulator behind `ALLOW_WHATSAPP_SIMULATOR`.
- Tourist **Map** tab: Leaflet with free OpenStreetMap / Esri satellite / OpenTopoMap tiles, photo pins, category filters, Google Maps directions, and "Near me" (browser location, never sent to the server). Details and tile-usage limits: `docs/MAPS.md`.
- Real destination photos from Wikimedia Commons, hosted in `public/photos` (credits in `public/photos/credits.json`, shown via the footer "Photo credits" link). Re-import with `node scripts/import-photos.mjs <slot>`.
- UI: Liquid Glass (`.glass`, `.glass-capsule`, `.tab-lens` in `src/index.css`) only on floating chrome: top bar, floating capsule tab bars (tourist and operator), map controls. Solid fallbacks under `perf-lite` and `prefers-reduced-transparency`. Tab changes scroll to top.
- Package photos and videos: operators upload in the package editor (`ListingMediaManager`; photos resized and stripped of GPS on the phone, upload progress, cover photo). Server `server/media.ts`: owner-only, type sniffed from file bytes (JPEG/PNG/WebP, MP4/WebM/MOV), 8 MB photo / 40 MB video, 12 photos + 3 videos per package, stored in `MEDIA_DIR` (default next to PG_DATA_DIR) and served from `/media` with nosniff + sandbox CSP. Travelers see a swipeable gallery and full-screen viewer (`shared/MediaGallery.tsx`) and cover photos on operator cards.
- Admin: account menu > **Verify operators** lists operators with their TALA licence and toggles verification (server re-checks the admin role).
- Suites: 50 security, 27 integrity, 23 WhatsApp, 10 media checks. Tourist and operator flows were also walked in a real browser, and every main screen was checked for overflow at 360, 768, 1024, 1280, 1440 and 1920px.

## 5. Not verified / needs a human

- Nothing has been run against Meta: template sending and live delivery are untested until business verification and template approval.
- No live Gemini call has been made (no key in the test environment). `GEMINI_MODEL` defaults to `gemini-3.8-flash`; confirm the model name with a real key.
- Swahili bot copy was written by a non-native speaker; Selemani or Harrison should read it.
- Legal claims in the UI (Bank of Tanzania TZS rules, Tourism Act, PDPA, "Registered in Dar es Salaam & Arusha") and the draft privacy policy/terms need a lawyer.
- Not deployed anywhere yet. `render.yaml`, `fly.toml` and `docker-entrypoint.sh` are untested on a real host (no registry or host access from the build sandbox).

## 6. Known open issues

1. Payments are simulated. Real mobile-money integration is the next big build after operator demos.
2. Per-account login lockout (10 failures / 15 min, across IPs) can be abused to lock someone out. It also blocks distributed password guessing, so do not just key it by IP; use a progressive delay or a second factor instead.
3. Fake reviews are harder but not impossible: a colluding traveler account plus a simulated payment still works until payments are real.
4. PGlite is single-process: exactly ONE instance with a persistent disk (Fly.io/Render). Move to hosted Postgres with backups before real money. `wrangler.jsonc` is a leftover; Cloudflare Pages cannot run this server.
5. Rate limiters, WhatsApp sender limits and OTP attempt counters are in memory (reset on restart; fine for one instance).
6. The app polls five endpoints every 10 seconds while open, which is heavy on mobile data.
7. Operator sign-up is four steps; consider shortening it after watching operators use it.
8. No error monitoring. `.data/` files in git history from 2026-09-10 are demo data only (history purge optional).

## 7. Roadmap

Done: server integrity, deployment files, PWA shell, WhatsApp layer. Next, in order: (1) deploy a demo instance and show 10 Arusha operators (`docs/DEMO.md`); (2) Meta business verification + template approval, then switch on real WhatsApp; (3) lawyer review of legal pages; (4) real payments; (5) hosted Postgres; (6) AI itinerary planning; (7) expansion.
Out of scope for now: native apps, Embedded Signup, customer-facing WhatsApp chat.

## 8. How to work with Niven and this repo

- **Read-only unless he says otherwise.** He has said "go for it" for improvements before, but always state what you will change. Do not push to `main` without asking; prefer a branch + PR. Do not touch git history.
- Explain plainly; he is a fast-moving founder, not a security specialist. Lead with the decision or result, then the reasons. Be honest about gaps, including in AI-generated work (Gemini's reports describe its own work; verify by cloning and running).
- Never claim something is fixed or passing without running it.
- Testing: `npm install && npx tsc --noEmit && npm run build && npm test`. Rate limiters are in-memory, so each suite needs a FRESH server; `scripts/test-all.sh` does that.
- Shell gotcha: `pkill -f "server.cjs"` can match and kill your own shell. Use a bracket pattern like `pkill -f "dist/s[e]rver"` or kill by PID.
- Never put secrets in the frontend bundle; never log tokens/passwords/full phone numbers; do not add new dependencies without a one-line reason.
- Security rule of thumb for every feature: server decides money, ownership, verification, and roles; never trust client-supplied amounts, ids, or flags.
- Immediate next step: get the demo in front of operators (section 7).
