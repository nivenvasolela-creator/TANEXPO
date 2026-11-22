export type PaymentsMode = 'simulated' | 'live';

export function getPaymentsMode(): PaymentsMode {
  return process.env.PAYMENTS_MODE === 'live' ? 'live' : 'simulated';
}

export function isSeedDemoCatalogEnabled(): boolean {
  if (process.env.SEED_DEMO_CATALOG === 'true') return true;
  if (process.env.SEED_DEMO_CATALOG === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED === 'true';
}

export function getDarTodayStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function getDarHour(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Dar_es_Salaam',
    hour: '2-digit',
    hour12: false
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '12';
  return Number(hourPart) % 24;
}

/**
 * The dashboard WhatsApp preview/simulator. Only meaningful while the real Meta connection is
 * off; in production it must be switched on explicitly (demo deployments).
 */
export function isWhatsAppSimulatorAllowed(): boolean {
  if (isWhatsAppEnabled()) return false;
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.ALLOW_WHATSAPP_SIMULATOR === 'true';
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
}

export function getDarDateStr(offsetDays = 0, from: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(from.getTime() + offsetDays * 86400000));
}

/** 0 = Sunday ... 6 = Saturday, in Africa/Dar_es_Salaam. */
export function getDarWeekday(date: Date = new Date()): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Dar_es_Salaam',
    weekday: 'short'
  }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
}

/**
 * Quiet hours for business-initiated WhatsApp messages, Dar es Salaam time.
 * WHATSAPP_QUIET_HOURS="21-7" (default) or "off".
 */
export function isDarQuietHours(date: Date = new Date()): boolean {
  const raw = (process.env.WHATSAPP_QUIET_HOURS || '21-7').trim().toLowerCase();
  if (raw === 'off') return false;
  const m = raw.match(/^(\d{1,2})-(\d{1,2})$/);
  const start = m ? Number(m[1]) % 24 : 21;
  const end = m ? Number(m[2]) % 24 : 7;
  const hour = getDarHour(date);
  if (start === end) return false;
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

/**
 * Geoapify map tiles key (optional). Map tile keys are public by design: every tile URL the
 * browser loads carries it. Restrict it to your domain in the Geoapify dashboard. Without a key the
 * maps use the free OpenStreetMap-based tiles, which are fine for demos but not for heavy traffic.
 */
export function getGeoapifyKey(): string | null {
  const key = process.env.GEOAPIFY_API_KEY?.trim() || '';
  return /^[A-Za-z0-9]{20,64}$/.test(key) ? key : null;
}

/**
 * Supabase Storage for operators' package photos and videos (optional). Needed on hosts whose
 * disk is wiped on restart. SUPABASE_SERVICE_ROLE_KEY is a server-only secret: never send it to
 * the browser. Files are served from a public bucket on Supabase's own domain.
 */
export interface SupabaseStorageConfig {
  url: string;
  serviceKey: string;
  bucket: string;
}
export function getSupabaseStorage(): SupabaseStorageConfig | null {
  const rawUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '') || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  if (!rawUrl || !serviceKey) return null;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocal) return null;
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'listing-media').toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{1,62}$/.test(bucket)) return null;
  return { url: url.origin, serviceKey, bucket };
}
