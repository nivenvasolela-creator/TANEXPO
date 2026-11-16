# Showing TANEXPO to operators

A 10-minute walkthrough on a phone. The goal is not compliments. Watch for: "when can I start?", an operator offering their real WhatsApp number, or a question about price.

## Demo server settings

Deploy as in `DEPLOYMENT.md` (one instance, persistent disk) with:

```env
NODE_ENV=production
ADMIN_SEED_EMAIL=<you>
ADMIN_SEED_PASSWORD=<strong password>
PAYMENTS_MODE=simulated
ALLOW_WHATSAPP_SIMULATOR=true     # WhatsApp chat preview in the dashboard
SEED_DEMO_CATALOG=true            # sample operators so the traveler side is not empty
APP_URL=https://<your-domain>
```

`SEED_DEMO_CATALOG=true` fills the public catalog with invented sample operators. Use it on the demo site only, never on the site real travelers use. The header shows a demo badge while it is on.

What is real and what is not on this build:

| Real | Demo only |
| :--- | :--- |
| Accounts, listings, requests, quotes, messages, bookings | Payments: nothing is charged or paid out |
| WhatsApp behaviour (commands, forwarding, digest) | WhatsApp delivery: shown in the dashboard preview until Meta approves the number |
| Verification by an admin | The sample operators in the catalog |

## The walkthrough

1. **Sign up as the operator** (their real business name) on their phone: Sign In > I'm a Service Provider. Add one package.
2. **Open the WhatsApp tab**, enter their number, tap Send code, enter the code from the preview chat. Say plainly: "today this chat is a preview; once Meta approves our number these messages arrive in your real WhatsApp."
3. **Forward a sample customer message** (orange button). A request appears with name, group, date and budget filled in. Then let them paste a real message from one of their own customers.
4. **Price it from the chat**: `QUOTE <id> 2.5M includes park fees`. Show the ready-to-forward quote that comes back.
5. **Show the Leads tab**: the same request is in the pipeline, marked "Forwarded from WhatsApp".
6. **Tap DIGEST**: this is what arrives every Monday morning.
7. **Traveler side, on a second phone**: find their company, send a request. The alert lands in the preview chat. Reply `ACCEPT`, then `QUOTE`. The traveler sees the quote and can book.
8. Ask: "Would you use this with your real WhatsApp number? What would you pay per month?"

## Before each demo

- `npm test` passes on the commit you deployed.
- You can sign in as admin (needed to verify an operator: their profile shows "Pending Review" until then).
- The demo site URL opens on mobile data, not just Wi-Fi.
