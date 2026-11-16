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
