# TANEXPO WhatsApp layer

One TANEXPO WhatsApp Business number on Meta's Cloud API, used only by registered operators.

| Mode | What happens |
| :--- | :--- |
| **A. We message operators** | New-request alerts, reminders and a Monday digest go to the operator's linked number. They answer with short commands in English or Swahili. |
| **B. Operators forward customers** | An operator forwards (or pastes) a customer's WhatsApp message to the TANEXPO number. It becomes a request in that operator's own pipeline. |

Not built, on purpose: connecting operators' own numbers (Embedded Signup), chatting with travelers on WhatsApp, payments over WhatsApp. A number that is not linked to an operator gets one fixed signpost reply per day and nothing else: no AI call, no lead.

## Commands

| English | Swahili | Effect |
| :--- | :--- | :--- |
| `LEADS` | `MAOMBI` | List open requests |
| `ACCEPT 12` | `KUBALI 12` | Mark request 12 as contacted |
| `QUOTE 12 2500000 note` | `BEI 12 2500000 maelezo` | Send a price in TZS (`2.5M` and `2,500,000` also work), valid 7 days |
| `REPLY 12 message` | `JIBU 12 ujumbe` | Message the traveler (shown in their TANEXPO thread) |
| `LOST 12` | `FUTA 12` | Close a request |
| `DIGEST` | `MUHTASARI` | Weekly summary now |
| `PAUSE` / `RESUME` | `SIMAMISHA` / `ENDELEA` | Stop / restart alerts |
| `ENGLISH` | `KISWAHILI` | Language of alerts and replies |
| `NEW <text>` | `OMBI <maandishi>` | Save typed text as a request |
| `HELP` | `MSAADA` | List commands |

A forwarded message always becomes a request, whatever it says. Typed text becomes a request only if it is long enough to be a real inquiry (25+ characters, 5+ words) and does not start with a command word; otherwise the operator gets the help hint.

## How a forwarded message becomes a request

1. The text is stored as the first message of a new request owned by the forwarding operator.
2. Details are extracted: customer name, phone (only if written in the text), destination, date, group size, budget. With `GEMINI_API_KEY` set this uses Gemini structured output (`GEMINI_MODEL`, default `gemini-3.8-flash`); the forwarded text is passed as data and the model's output is validated field by field. Without a key, or if the call fails, a keyword parser is used.
3. The operator gets a summary that says what was missing ("Not in the message: date"), and can price it with `QUOTE`.
4. For these requests the customer is in the operator's own WhatsApp, so `QUOTE` answers with a ready-made message to forward to them.

Safeguards: text inside a forwarded message is never run as a command; the same message twice does not create a second request; several messages forwarded together join one request; Meta redeliveries are ignored by message id; 20 inbound messages per sender per 5 minutes.

## Scheduled messages

Checked every 5 minutes, in Africa/Dar_es_Salaam time. Nothing is sent during quiet hours (`WHATSAPP_QUIET_HOURS`, default 21:00 to 07:00); it goes out in the morning instead. Each message is recorded in `notification_log` and can never be sent twice.

| Message | When |
| :--- | :--- |
| New request alert | Immediately, or after quiet hours end |
| "Still waiting" nudge | A new request has had no reply for 2 hours (once) |
| Quote expiring | The day before a quote's valid-until date |
| Trip tomorrow | The day before a booked trip departs |
| Weekly digest | Mondays from 08:00, only for operators with any activity |

An admin can run the jobs on demand: `POST /api/admin/whatsapp/run-jobs` with `{"forceDigest": true}`.

## Meta setup (allow several days)

Business verification and template approval are Meta's process and take days. Until then, use the dashboard preview (below).

1. In Meta for Developers, create a Business app and add the WhatsApp product. Register the TANEXPO number.
2. Copy the Phone Number ID and create a permanent System User access token. Copy the App Secret (App settings > Basic).
3. Set on the server:
   ```env
   WHATSAPP_ENABLED=true
   WHATSAPP_VERIFY_TOKEN=<random string you choose>
   WHATSAPP_APP_SECRET=<Meta app secret>
   WHATSAPP_PHONE_NUMBER_ID=<id>
   WHATSAPP_ACCESS_TOKEN=<token>
   APP_URL=https://<your-domain>
   ```
4. Webhook: callback `https://<your-domain>/api/whatsapp/webhook`, verify token as above, subscribe to the `messages` field.
5. Submit the message templates below in WhatsApp Manager, each in English (`en`) and Swahili (`sw`), with exactly these names and variable counts.

In production the webhook rejects every request until `WHATSAPP_APP_SECRET` is set, and then only accepts requests with a valid `X-Hub-Signature-256`.

### Templates to submit

Meta only allows free text within 24 hours of the operator's last message to us. Outside that window the server sends one of these templates; if a template is not approved the message fails and is logged, it is never sent as free text.

| Name | Category | Body (English) |
| :--- | :--- | :--- |
| `tanexpo_new_lead` | Utility | `New TANEXPO request #{{1}} from {{2}}: {{3}} guests, {{4}}, date {{5}}. Reply ACCEPT {{1}} to respond.` |
| `tanexpo_weekly_digest` | Utility | `Your TANEXPO week: {{1}} new requests, {{2}} waiting for your reply, {{3}} trips in the next 7 days. Reply LEADS to see them.` |
| `tanexpo_reminder` | Utility | `TANEXPO reminder: {{1}}. Reply LEADS to see your open requests.` |
| `tanexpo_otp` | Authentication | Meta's standard authentication template with a copy-code button; variable `{{1}}` is the code. |

Swahili bodies:

- `tanexpo_new_lead`: `Ombi jipya la TANEXPO #{{1}} kutoka kwa {{2}}: wageni {{3}}, {{4}}, tarehe {{5}}. Jibu KUBALI {{1}} kulishughulikia.`
- `tanexpo_weekly_digest`: `Wiki yako TANEXPO: maombi mapya {{1}}, {{2}} yanasubiri jibu lako, safari {{3}} ndani ya siku 7. Jibu MAOMBI kuyaona.`
- `tanexpo_reminder`: `Kumbusho la TANEXPO: {{1}}. Jibu MAOMBI kuona maombi yaliyo wazi.`

The template sending code follows Meta's documented payload format but has not been run against Meta yet. Send one test of each template after approval. The Swahili wording here and in the bot replies was written by a non-native speaker and should be read by a native speaker before operators see it.

## Linking an operator's number

1. Operator opens the **WhatsApp** tab in the dashboard, enters their number and taps **Send code**.
2. A 6-digit code (15 minutes, stored hashed, 5 wrong tries allowed) is sent to that number on WhatsApp.
3. They type the code in the dashboard, or reply `VERIFY 123456` from WhatsApp.

A number can be linked to one operator only.

## Preview mode (before Meta approval, and for demos)

With `WHATSAPP_ENABLED=false` no message leaves the server. Outside production, or in production with `ALLOW_WHATSAPP_SIMULATOR=true`, the WhatsApp tab shows a chat preview: the linking code appears there, alerts arrive there, and the operator can type commands or forward a sample customer message. Each operator can only act as their own number.

Turn `ALLOW_WHATSAPP_SIMULATOR` off once real WhatsApp is live: in preview mode the linking code is shown in the dashboard, so it does not prove the operator owns the number. (The flag has no effect while `WHATSAPP_ENABLED=true`.)

## Privacy

Logs and `notification_log` hold masked numbers only. `whatsapp_messages` stores the full number of the sender (needed to reply) and the message text. A customer's phone number is saved on a request only when it is written in the forwarded message.

## Tests

`npm test` runs the WhatsApp suite (23 checks): signed webhook handling, linking, commands in both languages, forwarding, duplicates, cross-operator isolation, scheduler once-only delivery, digest, and log privacy.
