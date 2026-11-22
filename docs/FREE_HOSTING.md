# Free hosting: Supabase + Koyeb

A permanent link that works when your laptop is off, at no cost:

- **Supabase** (free plan) keeps the database and operators' package photos/videos.
- **Koyeb** (free instance) runs the app itself, built straight from GitHub. No Dockerfile needed.

Trade-offs of free plans (check the current limits on each pricing page):

- The free app instance can **sleep when nobody uses it**; the first visit after that takes noticeably longer while it wakes up.
- Supabase **pauses a free project after about a week with no activity**. Opening the site regularly keeps it awake; a paused project can be restored from the Supabase dashboard.
- Free storage is limited (roughly 500 MB database and 1 GB files on Supabase's free plan). Plenty for a demo with 10 to 20 operators.
- While the app is asleep, scheduled jobs (WhatsApp Monday digest, reminders) do not run. Real WhatsApp is off for the demo anyway.

| What | Link |
| :--- | :--- |
| Supabase dashboard | https://supabase.com/dashboard |
| Supabase pricing | https://supabase.com/pricing |
| Koyeb sign-up (sign in with GitHub) | https://app.koyeb.com |
| Koyeb pricing | https://www.koyeb.com/pricing |

## Step 1: Supabase (database + storage)

The `tanexpo` project already exists in your Supabase account (region eu-central-1, Frankfurt).
The app creates its own tables on first start, in a separate schema called `tanexpo` (not `public`),
so they are not exposed through Supabase's public web API. The existing `signups` table is untouched.

1. Open the project, click **Connect** (top of the page), choose **Connection string**, then the
   **Session pooler** tab. Copy that URI. Replace `[YOUR-PASSWORD]` with the database password
   (forgot it? **Project Settings > Database > Reset database password**).
   - Use the **Session pooler**, not "Direct connection" (needs IPv6, which free hosts usually lack)
     and not the "Transaction pooler" on port 6543.
   - This is your `DATABASE_URL`.
2. **Project Settings > API Keys**, tab **Publishable and secret API keys**. Create a **secret key**
   (`sb_secret_...`) if there is none, and copy it. This is your `SUPABASE_SERVICE_ROLE_KEY`.
   - Do not use the legacy `service_role` key: Supabase stops accepting legacy keys at the end of 2026.
   - It is a full-access server secret. Paste it only into Koyeb's settings, never into chat or code.
3. Your `SUPABASE_URL` is `https://tzucllooekayvrvprktr.supabase.co`.

The app creates a public storage bucket called `listing-media` on the first photo upload
(photos and videos only, 40 MB max). Package photos are public anyway.

## Step 2: Koyeb (the app)

1. Sign in at https://app.koyeb.com with GitHub and allow access to `nivenvasolela-creator/TANEXPO`.
2. **Create Web Service > GitHub**, pick the repository, branch **main**.
3. Builder: **Buildpack**. Override:
   - Build command: `npm ci --include=dev && npm run build`
   - Run command: `node dist/server.cjs`
4. Instance: the **free** one. Region: the one closest to Tanzania that the free tier offers.
5. Exposed port: **3000** (HTTP). Health check: HTTP path `/api/health` on port 3000.
6. Environment variables (mark the secret ones as **Secret**):

| Name | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | Session pooler URI from step 1 (**secret**) |
| `SUPABASE_URL` | `https://tzucllooekayvrvprktr.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | the `sb_secret_...` key (**secret**) |
| `ADMIN_SEED_EMAIL` | your admin email |
| `ADMIN_SEED_PASSWORD` | a strong password, 12+ characters (**secret**) |
| `GEOAPIFY_API_KEY` | your Geoapify key (optional) |
| `PAYMENTS_MODE` | `simulated` |
| `SEED_DEMO_CATALOG` | `true` |
| `ALLOW_WHATSAPP_SIMULATOR` | `true` |
| `WHATSAPP_ENABLED` | `false` |

7. **Deploy**. The first build takes a few minutes. Koyeb shows the address (`https://<name>.koyeb.app`).
8. Add `APP_URL` = that address, then redeploy.
9. In the Geoapify dashboard, restrict your map key to that address.

## Step 3: Check it

1. Open the address on a phone on mobile data. Operators and photos should load.
2. Sign in with `ADMIN_SEED_EMAIL`; the account menu shows **Verify operators**.
3. Register a test operator and upload a package photo (it goes to Supabase Storage).
4. In Koyeb, **Redeploy** the service, then confirm the operator and photo are still there.

If the app does not start, the Koyeb logs name the problem. `[DB FATAL] Cannot use DATABASE_URL`
usually means a wrong password, or the Direct/Transaction connection string instead of Session pooler.

## The same setup on another host

Nothing here is Koyeb-specific. Any Node.js 22 host works with the same build command, run command
and environment variables, because the database and files live in Supabase.
