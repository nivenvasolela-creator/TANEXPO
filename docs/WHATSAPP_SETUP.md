# TANEXPO WhatsApp Operator OS & AI Concierge Setup

TANEXPO treats WhatsApp as a first-class operating channel for Tanzanian tour operators (`Mode A: Operator OS`) and a zero-app-download inquiry concierge for travelers (`Mode B: AI Booking Concierge`).

By default (`WHATSAPP_ENABLED=false`), all outbound messages run through the built-in simulator and are recorded safely in `whatsapp_messages` with masked phone numbers so you can test end-to-end flows locally without Meta credentials.

---

## 1. Architecture Overview

| Mode | Audience | Behavior |
| :--- | :--- | :--- |
| **Mode A: Operator OS** | Linked TALA operators | Receive instant lead alerts (`TANEXPO Lead #id`), then reply via WhatsApp in English or Swahili (`LEADS`/`MAOMBI`, `1` or `ACCEPT`, `QUOTE <id> <TZS> [note]` / `BEI`, `REPLY <id> <msg>` / `JIBU`, `PAUSE` / `SIMAMISHA`, `RESUME` / `ENDELEA`, `HELP` / `MSAADA`). |
| **Mode B: Tourist Concierge** | Travelers messaging TANEXPO | Server-side `@google/genai` (`gemini-4-hydrogen`) extracts destination, category, preferred date, group size, and budget in English or Swahili, creates a real lead in Postgres, replies with the Lead ID, and notifies the matched operator. Falls back cleanly to deterministic parsing if `GEMINI_API_KEY` is unset. |

### Guardrails & Compliance
- **HMAC-SHA256 Webhook Verification**: `POST /api/whatsapp/webhook` verifies `X-Hub-Signature-256` against raw request bytes (`req.rawBody`) using `crypto.timingSafeEqual` whenever `WHATSAPP_APP_SECRET` is set. In production the webhook rejects every request (401) until `WHATSAPP_APP_SECRET` is configured; unsigned posts are accepted only in local development.
- **Idempotency**: Inbound Meta `wamid` IDs are deduplicated in `whatsapp_messages`, and proactive operator alerts are deduplicated in `notification_log`.
- **24-Hour Customer Service Window & Dar Quiet Hours**: Outbound handlers track `last_inbound_at` per sender, and reminder notifications respect `Africa/Dar_es_Salaam` quiet hours (21:00–07:00 EAT).
- **PII Protection**: Server logs, `whatsapp_messages.phone_masked`, and `leads.touristContact` mask all phone digits except the last 3 characters (`maskPhone`).
- **Rate Limiting**: Inbound messages are rate-limited per normalized sender phone (max 20 messages per 5 minutes).

---

## 2. Connecting Meta WhatsApp Cloud API (Production)

1. In [Meta for Developers](https://developers.facebook.com/), create a **Business** app and add the **WhatsApp** product.
2. Under **WhatsApp > API Setup**, copy your **Phone Number ID** (`WHATSAPP_PHONE_NUMBER_ID`) and generate a permanent System User **Access Token** (`WHATSAPP_ACCESS_TOKEN`).
3. Under **App Settings > Basic**, copy the **App Secret** (`WHATSAPP_APP_SECRET`).
4. Choose a strong random string for `WHATSAPP_VERIFY_TOKEN`.
5. Set environment variables on your host:
   ```env
   WHATSAPP_ENABLED=true
   WHATSAPP_VERIFY_TOKEN=your_random_verify_token
   WHATSAPP_APP_SECRET=your_meta_app_secret
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   WHATSAPP_ACCESS_TOKEN=EAAG...
   GEMINI_API_KEY=your_server_side_gemini_key
   ```
6. In **WhatsApp > Configuration > Webhook**, set:
   - **Callback URL**: `https://<your-domain>/api/whatsapp/webhook`
   - **Verify Token**: exact value of `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the **`messages`** webhook field.

---

## 3. Operator Phone Linking Flow

1. Operator signs into the TANEXPO Operator Dashboard and opens **Profile & Licenses**.
2. In the **WhatsApp Operator OS** section, the operator enters their Tanzanian number (`+255 7XX XXX XXX` or `07XXXXXXXX`) and clicks **Send Verification Code**.
3. TANEXPO generates a 6-digit OTP (15-minute expiry, stored SHA-256 hashed in `whatsapp_pending_otps`) and sends it to that WhatsApp number.
4. Operator either enters the 6-digit code in the dashboard **or** replies `VERIFY <code>` (or `THIBITISHA <code>`) directly from their WhatsApp phone.
5. Once verified, the operator can manage leads, quotes, and notifications directly from WhatsApp.

---

## 4. Local & Automated Testing

Run the dedicated WhatsApp end-to-end suite against a production build:

```bash
node scripts/whatsapp-test.mjs
```

Note: `POST /api/whatsapp/simulate-inbound` is restricted in `NODE_ENV=production` to authenticated `admin` accounts (unless `ALLOW_WHATSAPP_SIMULATOR=true` is explicitly set for staging). Never enable `ALLOW_WHATSAPP_SIMULATOR=true` on a public production deployment.
