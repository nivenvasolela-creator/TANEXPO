import { Request, Response, NextFunction } from 'express';
import { getDb } from './db.js';
import { getAuthUser } from './auth.js';
import { getDarTodayStr } from './config.js';

function parsePositiveInt(val: unknown): number | null {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function isQuoteExpired(validUntil: unknown): boolean {
  if (typeof validUntil !== 'string') return false;
  const trimmed = validUntil.trim();
  if (!trimmed) return false;

  // YYYY-MM-DD date string: valid through the end of that day in Africa/Dar_es_Salaam
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const todayStr = getDarTodayStr();
    return todayStr > trimmed;
  }

  const parsedMs = Date.parse(trimmed);
  if (Number.isNaN(parsedMs)) return false;
  return parsedMs < Date.now();
}

export async function bookingIntegrityGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.method !== 'POST') {
      next();
      return;
    }

    const body = req.body ?? {};
    if (body.leadId === undefined || body.leadId === null) {
      next();
      return;
    }

    // Only inspect lead state after confirming caller is authenticated & permitted for this lead
    const authUser = await getAuthUser(req);
    if (!authUser) {
      next();
      return;
    }

    const leadId = parsePositiveInt(body.leadId);
    if (!leadId) {
      next();
      return;
    }

    const db = await getDb();
    const leadRes = await db.query<any>(
      'SELECT id, provider_id, tourist_user_id, status, data FROM leads WHERE id = $1',
      [leadId]
    );
    if (!leadRes.rows.length) {
      next();
      return;
    }

    const leadRow = leadRes.rows[0];
    const userProviderId = parsePositiveInt(authUser.providerProfile?.providerId);
    const isAllowedLead =
      authUser.role === 'admin' ||
      (authUser.role === 'provider' && leadRow.provider_id === userProviderId) ||
      (authUser.role === 'tourist' && leadRow.tourist_user_id === authUser.id);

    if (!isAllowedLead) {
      next();
      return;
    }

    const leadStatus = leadRow.data?.status || leadRow.status;
    if (leadStatus === 'Lost') {
      res.status(409).json({ error: 'This request was closed. Please send a new request.' });
      return;
    }

    const existingBookingRes = await db.query<any>(
      `SELECT id FROM bookings
       WHERE (lead_id = $1 OR data->>'leadId' = $2)
         AND status <> 'Cancelled'
       LIMIT 1`,
      [leadId, String(leadId)]
    );
    if (existingBookingRes.rows.length > 0) {
      res.status(409).json({ error: 'A booking already exists for this request.' });
      return;
    }

    const validUntil = leadRow.data?.quote?.validUntil;
    if (validUntil && isQuoteExpired(validUntil)) {
      res.status(409).json({ error: 'This quote has expired' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
