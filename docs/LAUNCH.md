# TANEXPO launch checklist

Everything needed to take TANEXPO from this repository to operators' phones, in the order to do it. Steps 1 and 2 get a demo in front of operators. Step 4 (Meta) takes days of waiting, so start it today alongside them.

The links were written without being able to open them from the build environment. If one has moved, search for the page name given next to it.

## What to have ready

- [ ] A laptop with **Node.js 22** and **Git** (step 1)
- [ ] A **Visa or Mastercard** for hosting (step 2) and, later, WhatsApp message charges (step 4)
- [ ] **Company documents** for Meta: business registration certificate (BRELA), TIN, registered address, and a phone number or email on the company's own domain
- [ ] A **new SIM card** for the TANEXPO WhatsApp line. It must not already be on WhatsApp or WhatsApp Business.
- [ ] A list of **10 Arusha operators** to visit (Selemani and Harrison)
- [ ] A native Swahili speaker to read the bot replies and the Swahili template wording in `docs/WHATSAPP_SETUP.md`

## 1. Free demo from your laptop (today, no card)

Runs TANEXPO on your laptop and gives it a public `https://...trycloudflare.com` link that works on any phone. It stays up only while the laptop is on, online, and the window is open, and the link changes on each restart. Good for sitting next to an operator; not for leaving a link with them.

Install:

| What | Link |
| :--- | :--- |
| Node.js 22 (LTS) | https://nodejs.org/en/download |
| Git | https://git-scm.com/downloads |
| cloudflared (Cloudflare Tunnel) | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ |

cloudflared can also be installed from a terminal: `winget install --id Cloudflare.cloudflared` on Windows, `brew install cloudflared` on a Mac.

Then, in a terminal:

```bash
git clone https://github.com/nivenvasolela-creator/TANEXPO.git
```

```bash
cd TANEXPO
```

```bash
git checkout claude/trusting-ride-17euiv
```

```bash
npm ci
```

```bash
npm run build
```

```bash
npm run demo:public
```

The first run prints your admin login and saves it in `.env.demo` (never committed). The public link appears in a box a few seconds later. Data is kept in `.data/demo-pg`, so it survives restarts. Without cloudflared, `npm run demo` runs it on `http://localhost:3000` only.

## 2. Always-on demo, free: Supabase + Koyeb

Follow `docs/FREE_HOSTING.md`. The database and package photos live in Supabase, the app runs on a free Koyeb instance, and the link stays the same.

### Paid alternative: Render (about USD 7 to 10 a month)

A permanent link operators can keep. Uses `render.yaml` from this repository.

| What | Link |
| :--- | :--- |
| Create a Render account (sign in with GitHub) | https://dashboard.render.com/register |
| Create from the blueprint | https://dashboard.render.com/blueprints |
| Pricing (check the current starter instance and disk price) | https://render.com/pricing |
| Blueprint reference, if a field is rejected | https://render.com/docs/blueprint-spec |

1. In Render choose **New > Blueprint** and connect the GitHub repository `nivenvasolela-creator/TANEXPO`.
2. Pick the `main` branch.
3. Fill in `ADMIN_SEED_EMAIL` and a strong `ADMIN_SEED_PASSWORD`. Paste your `GEOAPIFY_API_KEY` (optional). Leave `APP_URL` and `GEMINI_API_KEY` empty for now.
4. Click **Apply** and wait for the first build (several minutes). Open the `https://...onrender.com` address it shows.
5. Set `APP_URL` to that address in the service's **Environment** settings.
6. Check: sign in as admin, register a test operator, then **Manual Deploy > Restart service** and confirm the operator is still there.

Keep the **starter** plan. A free instance has no persistent disk and would wipe every account on each restart.


## 3. Your own domain, with Cloudflare in front (when you are ready)

| What | Link |
| :--- | :--- |
| `.co.tz` domains (accredited registrars are listed by tzNIC) | https://www.tznic.or.tz |
| `.com` and other domains at cost | https://domains.cloudflare.com |
| Cloudflare account (free plan is enough) | https://dash.cloudflare.com/sign-up |
| Render custom domains | https://render.com/docs/custom-domains |

1. Buy the domain. Add it to Cloudflare (**Add a site**, free plan) and change the domain's nameservers at the registrar to the two Cloudflare gives you.
2. In Render, **Settings > Custom Domains**, add `app.yourdomain` (or the bare domain). Render shows the DNS record to create.
3. In Cloudflare **DNS**, create that record. Set **SSL/TLS** to **Full (strict)**.
4. Change `APP_URL` in Render to the new address.

Cloudflare only sits in front here. The app itself stays on Render (Cloudflare Pages and Workers cannot run it; see `DEPLOYMENT.md`).

## 4. Real WhatsApp (start today; Meta takes days)

Until this is done, the dashboard's WhatsApp tab shows a preview chat instead. Full technical detail: `docs/WHATSAPP_SETUP.md`.

| Step | Link |
| :--- | :--- |
| 1. Business portfolio (Meta Business Suite) | https://business.facebook.com |
| 2. Business verification (Security Center: upload BRELA certificate, TIN, address) | https://business.facebook.com/settings/security |
| 3. Developer app: **Create app > Business**, then add the **WhatsApp** product | https://developers.facebook.com/apps |
| Cloud API getting started guide | https://developers.facebook.com/docs/whatsapp/cloud-api/get-started |
| 4. Add the new SIM's number and request the display name "TANEXPO" | https://business.facebook.com/wa/manage/phone-numbers/ |
| 5. System user with a permanent access token (`whatsapp_business_messaging`, `whatsapp_business_management`) | https://business.facebook.com/settings/system-users |
| 6. Submit the four message templates (names and wording in `docs/WHATSAPP_SETUP.md`) | https://business.facebook.com/wa/manage/message-templates/ |
| 7. Add a payment method for business-initiated messages | https://business.facebook.com/billing_hub |
| Message pricing by country | https://developers.facebook.com/docs/whatsapp/pricing |

When verification and the templates are approved:

1. In the developer app, **WhatsApp > Configuration > Webhook**: callback `https://<your address>/api/whatsapp/webhook`, a verify token you choose, subscribe to `messages`.
2. In Render, set `WHATSAPP_ENABLED=true`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (developer app **Settings > Basic**), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`. Then set `ALLOW_WHATSAPP_SIMULATOR=false`.
3. Link your own number in the dashboard's WhatsApp tab and send `HELP` from your phone. Then forward a real customer message.

Meta asks for a privacy policy URL: use `https://<your address>/privacy` (still a draft; see step 6).

## 5. Gemini key for reading forwarded messages (optional)

Without a key, forwarded customer messages are read by a built-in keyword parser, which handles the common cases. A key gives better extraction from messy messages.

| What | Link |
| :--- | :--- |
| Create an API key | https://aistudio.google.com/apikey |
| Model names (check `gemini-3.8-flash` exists; otherwise set `GEMINI_MODEL`) | https://ai.google.dev/gemini-api/docs/models |
| Terms, including how prompts on the free tier may be used | https://ai.google.dev/gemini-api/terms |

Forwarded messages contain customers' names and phone numbers. Read the terms on how free-tier data is used before turning this on with real customers; a paid tier may be needed.

Put the key in Render as `GEMINI_API_KEY`, or in `.env.demo` for the laptop demo.

## 6. Before real customers and real money (later)

| What | Link |
| :--- | :--- |
| Personal Data Protection Commission (data-controller registration under the PDPA) | https://www.pdpc.go.tz |
| A Tanzanian lawyer to review `/privacy`, `/terms` and the legal claims in the app | — |
| Hosted Postgres with backups (replaces the built-in database) | https://neon.tech or https://supabase.com |
| Error alerts | https://sentry.io |
| Uptime alerts (free) | https://uptimerobot.com |
| Mobile-money payment gateways to compare | https://www.selcom.net, https://azampay.co.tz, https://clickpesa.com, https://www.pesapal.com, https://openapiportal.m-pesa.com |

Order and reasons are in `CLAUDE.md` (sections 6 and 7).

## Secrets: where each one lives

Never put these in GitHub, in chat, or in the app's code. Each goes in Render's **Environment** settings (or `.env.demo` on the laptop).

| Secret | Where it comes from |
| :--- | :--- |
| `ADMIN_SEED_PASSWORD` | You choose it |
| `GEMINI_API_KEY` | Google AI Studio (step 5) |
| `WHATSAPP_APP_SECRET` | Meta developer app, Settings > Basic |
| `WHATSAPP_ACCESS_TOKEN` | Meta system user (step 4.5) |
| `WHATSAPP_VERIFY_TOKEN` | You choose it (any long random string) |
