import { getDb } from './db.js';
import { getDarDateStr, getDarHour, getDarWeekday, isDarQuietHours } from './config.js';
import {
  digestTemplate,
  formatDigest,
  getDigestStats,
  notifyOperatorNewLead,
  notifyProviderOnce
} from './whatsapp.js';

/*
 * Business-initiated WhatsApp messages on a clock, all in Africa/Dar_es_Salaam time:
 *   - new-request alerts that arrived during quiet hours (sent in the morning)
 *   - a nudge when a new request has had no answer for 2 hours
 *   - a reminder the day before a quote expires
 *   - a reminder the day before a trip departs
 *   - the Monday digest
 * Every message is keyed in notification_log, so restarts and overlapping runs never double-send.
 * Runs inside the single app process (PGlite is single-process anyway).
 */

const TICK_MS = 5 * 60 * 1000;
const UNANSWERED_AFTER_MS = 2 * 60 * 60 * 1000;
const UNANSWERED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DIGEST_HOUR = 8;

export interface JobRunSummary {
  quietHours: boolean;
  deferredAlerts: number;
  unansweredReminders: number;
  quoteExpiryReminders: number;
  tripReminders: number;
  digests: number;
}

async function linkedProviderIds(): Promise<number[]> {
  const db = await getDb();
  const res = await db.query<any>(
    `SELECT id FROM providers
     WHERE whatsapp_number IS NOT NULL AND whatsapp_verified_at IS NOT NULL
       AND whatsapp_opt_in = TRUE AND whatsapp_paused = FALSE
     ORDER BY id ASC`
  );
  return res.rows.map((r: any) => Number(r.id));
}

export async function sendWeeklyDigest(providerId: number, weekKey: string): Promise<boolean> {
  const stats = await getDigestStats(providerId);
  if (!stats.hasAnyActivity) return false;
  const result = await notifyProviderOnce({
    notificationKey: `weekly_digest:${weekKey}:prov:${providerId}`,
    providerId,
    body: (lang) => formatDigest(stats, lang),
    template: (lang) => digestTemplate(stats, lang)
  });
  return result.sent;
}

export async function runScheduledJobs(
  options: { forceDigest?: boolean; now?: Date } = {}
): Promise<JobRunSummary> {
  const now = options.now ?? new Date();
  const summary: JobRunSummary = {
    quietHours: isDarQuietHours(now),
    deferredAlerts: 0,
    unansweredReminders: 0,
    quoteExpiryReminders: 0,
    tripReminders: 0,
    digests: 0
  };
  if (summary.quietHours) return summary;

  const providerIds = await linkedProviderIds();
  if (!providerIds.length) return summary;

  const db = await getDb();
  const tomorrow = getDarDateStr(1, now);

  const leadsRes = await db.query<any>(
    `SELECT id, provider_id, status, data FROM leads
     WHERE provider_id = ANY($1::int[]) AND status IN ('New', 'Negotiating')
     ORDER BY id ASC`,
    [providerIds]
  );

  for (const row of leadsRes.rows) {
    const lead = row.data || {};
    const providerId = Number(row.provider_id);
    const createdMs = Date.parse(lead.createdAt);
    const ageMs = now.getTime() - createdMs;

    if (row.status === 'New' && Number.isFinite(ageMs) && ageMs <= UNANSWERED_MAX_AGE_MS) {
      // Requests created by forwarding were just seen by the operator; no alert needed.
      // ...and only fresh ones get a late alert, so linking a number never floods it with old requests.
      if (
        lead.sourceChannel !== 'whatsapp_forward' &&
        ageMs <= 24 * 60 * 60 * 1000 &&
        (await notifyOperatorNewLead(providerId, lead))
      ) {
        summary.deferredAlerts += 1;
        continue;
      }
      if (ageMs >= UNANSWERED_AFTER_MS) {
        const hours = Math.floor(ageMs / 3600000);
        const waited = hours >= 48 ? `${Math.floor(hours / 24)} days` : `${hours} hours`;
        const waitedSw = hours >= 48 ? `siku ${Math.floor(hours / 24)}` : `saa ${hours}`;
        const result = await notifyProviderOnce({
          notificationKey: `lead_unanswered:${row.id}`,
          providerId,
          leadId: Number(row.id),
          body: (lang) =>
            lang === 'sw'
              ? `Ombi #${row.id} la ${lead.touristName} limesubiri ${waitedSw} bila jibu.\nBEI ${row.id} <kiasi TZS> au JIBU ${row.id} <ujumbe>`
              : `Request #${row.id} from ${lead.touristName} has waited ${waited} without a reply.\nQUOTE ${row.id} <amount TZS> or REPLY ${row.id} <message>`,
          template: (lang) => ({
            name: 'tanexpo_reminder',
            lang,
            params: [
              lang === 'sw'
                ? `ombi #${row.id} la ${lead.touristName} linasubiri jibu lako`
                : `request #${row.id} from ${lead.touristName} is waiting for your reply`
            ]
          })
        });
        if (result.sent) summary.unansweredReminders += 1;
      }
    }

    if (row.status === 'Negotiating' && lead.quote?.validUntil === tomorrow) {
      const result = await notifyProviderOnce({
        notificationKey: `quote_expiring:${row.id}:${tomorrow}`,
        providerId,
        leadId: Number(row.id),
        body: (lang) =>
          lang === 'sw'
            ? `Bei yako kwa ombi #${row.id} (${lead.touristName}) inaisha kesho. Mkumbushe mteja, au tuma bei mpya: BEI ${row.id} <kiasi TZS>`
            : `Your quote on request #${row.id} (${lead.touristName}) expires tomorrow. Nudge the customer, or send a new one: QUOTE ${row.id} <amount TZS>`,
        template: (lang) => ({
          name: 'tanexpo_reminder',
          lang,
          params: [
            lang === 'sw'
              ? `bei yako kwa ombi #${row.id} inaisha kesho`
              : `your quote on request #${row.id} expires tomorrow`
          ]
        })
      });
      if (result.sent) summary.quoteExpiryReminders += 1;
    }
  }

  const tripsRes = await db.query<any>(
    `SELECT id, provider_id, data FROM bookings
     WHERE provider_id = ANY($1::int[]) AND status = 'Upcoming' AND data->>'date' = $2
     ORDER BY id ASC`,
    [providerIds, tomorrow]
  );
  for (const row of tripsRes.rows) {
    const b = row.data || {};
    const result = await notifyProviderOnce({
      notificationKey: `trip_tomorrow:${row.id}`,
      providerId: Number(row.provider_id),
      body: (lang) =>
        lang === 'sw'
          ? `Kesho: ${b.listingTitle} na ${b.touristName} (${b.referenceCode}). Thibitisha dereva na gari.`
          : `Tomorrow: ${b.listingTitle} with ${b.touristName} (${b.referenceCode}). Confirm your driver and vehicle.`,
      template: (lang) => ({
        name: 'tanexpo_reminder',
        lang,
        params: [
          lang === 'sw'
            ? `safari ya ${b.touristName} (${b.listingTitle}) ni kesho`
            : `the trip for ${b.touristName} (${b.listingTitle}) departs tomorrow`
        ]
      })
    });
    if (result.sent) summary.tripReminders += 1;
  }

  const isDigestTime = getDarWeekday(now) === 1 && getDarHour(now) >= DIGEST_HOUR;
  if (isDigestTime || options.forceDigest) {
    // Keyed by date, so a normal Monday sends once; a forced run gets its own key.
    const weekKey = options.forceDigest ? `forced-${now.toISOString()}` : getDarDateStr(0, now);
    for (const providerId of providerIds) {
      if (await sendWeeklyDigest(providerId, weekKey)) summary.digests += 1;
    }
  }

  return summary;
}

let timer: NodeJS.Timeout | null = null;
let running = false;

export function startScheduler(): void {
  if (timer || process.env.SCHEDULER_ENABLED === 'false') return;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const summary = await runScheduledJobs();
      const sent =
        summary.deferredAlerts +
        summary.unansweredReminders +
        summary.quoteExpiryReminders +
        summary.tripReminders +
        summary.digests;
      if (sent > 0) {
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), event: 'scheduler_run', ...summary }));
      }
    } catch (err: any) {
      console.error('[Scheduler] run failed:', err?.message || err);
    } finally {
      running = false;
    }
  };
  timer = setInterval(tick, TICK_MS);
  timer.unref();
  setTimeout(tick, 20 * 1000).unref();
}
