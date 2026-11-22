import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { getDb } from './db.js';
import { requireAuth, requireRole } from './auth.js';
import { getSupabaseStorage, type SupabaseStorageConfig } from './config.js';

/*
 * Photos and videos on tour packages.
 *
 * Files are stored on the same persistent disk as the database (MEDIA_DIR, default
 * <parent of PG_DATA_DIR>/media) under random names, and served from /media/<name>.
 * The file type is decided by reading the file's first bytes, never by the name or the
 * Content-Type the client claims, so nothing but real images and videos can be stored or served.
 * Photos are resized and stripped of location data on the phone before upload.
 *
 * With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set, files go to a public Supabase Storage bucket
 * instead (free hosts wipe their disk on restart) and the stored URL points there. The same
 * checks run first; only the bytes' destination changes.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
export const MAX_IMAGES_PER_LISTING = 12;
export const MAX_VIDEOS_PER_LISTING = 3;

export interface ListingMedia {
  id: string;
  kind: 'image' | 'video';
  url: string;
  mime: string;
  bytes: number;
  createdAt: string;
}

export function getMediaDir(): string {
  if (process.env.MEDIA_DIR?.trim()) return path.resolve(process.env.MEDIA_DIR.trim());
  const pgDir = path.resolve(process.env.PG_DATA_DIR?.trim() || './.data/pg');
  return path.join(path.dirname(pgDir), 'media');
}

/** Identify a file from its leading bytes. Returns null for anything that is not an allowed image/video. */
export function sniffMedia(buf: Buffer): { kind: 'image' | 'video'; mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { kind: 'image', mime: 'image/png', ext: 'png' };
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { kind: 'image', mime: 'image/webp', ext: 'webp' };
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { kind: 'video', mime: 'video/webm', ext: 'webm' };
  }
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    if (brand === 'qt  ') return { kind: 'video', mime: 'video/quicktime', ext: 'mov' };
    // HEIC/AVIF stills also use ftyp; only accept video brands.
    if (/^(heic|heix|hevc|heim|heis|mif1|msf1|avif|avis)$/.test(brand)) return null;
    return { kind: 'video', mime: 'video/mp4', ext: 'mp4' };
  }
  return null;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime'
};

/**
 * New Supabase secret keys (sb_secret_...) go on the `apikey` header only: sent as a Bearer token
 * too, Supabase parses them as a JWT and rejects the request. Legacy service_role keys are JWTs
 * (they start with "eyJ") and are also sent as a Bearer token. Legacy keys stop working at the
 * end of 2026, so use a secret key.
 */
function storageHeaders(cfg: SupabaseStorageConfig, extra: Record<string, string> = {}): Record<string, string> {
  const legacyJwt = cfg.serviceKey.startsWith('eyJ');
  return { apikey: cfg.serviceKey, ...(legacyJwt ? { Authorization: `Bearer ${cfg.serviceKey}` } : {}), ...extra };
}

let bucketReady: Promise<void> | null = null;

/** Creates the public bucket once (an existing bucket is fine). */
function ensureBucket(cfg: SupabaseStorageConfig): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const res = await fetch(`${cfg.url}/storage/v1/bucket`, {
        method: 'POST',
        headers: storageHeaders(cfg, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: cfg.bucket,
          name: cfg.bucket,
          public: true,
          file_size_limit: MAX_VIDEO_BYTES,
          allowed_mime_types: Object.values(MIME_BY_EXT)
        })
      });
      if (res.ok) return;
      const text = await res.text().catch(() => '');
      if (res.status === 409 || /already exists|Duplicate/i.test(text)) return;
      throw new Error(`Could not create storage bucket (${res.status})`);
    })().catch((err) => {
      bucketReady = null;
      throw err;
    });
  }
  return bucketReady;
}

/** Public URL of an object in the bucket. */
function publicUrl(cfg: SupabaseStorageConfig, name: string): string {
  return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${name}`;
}

async function storeFile(name: string, mime: string, buf: Buffer): Promise<string> {
  const cfg = getSupabaseStorage();
  if (!cfg) {
    const dir = getMediaDir();
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, name), buf, { flag: 'wx' });
    return `/media/${name}`;
  }
  await ensureBucket(cfg);
  const res = await fetch(`${cfg.url}/storage/v1/object/${cfg.bucket}/${name}`, {
    method: 'POST',
    headers: storageHeaders(cfg, {
      'Content-Type': mime,
      'Cache-Control': 'max-age=31536000',
      'x-upsert': 'false'
    }),
    body: new Uint8Array(buf)
  });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status})`);
  return publicUrl(cfg, name);
}

/** Serves /media/<random>.<ext> with safe headers. Names are generated by us, so nothing else matches. */
export function mediaStatic() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const m = req.path.match(/^\/([a-f0-9]{32})\.(jpg|png|webp|mp4|webm|mov)$/);
    if (!m || (req.method !== 'GET' && req.method !== 'HEAD')) {
      res.status(404).end();
      return;
    }
    const file = path.join(getMediaDir(), `${m[1]}.${m[2]}`);
    if (!fs.existsSync(file)) {
      res.status(404).end();
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    // sendFile handles Range requests, which phones need to stream video.
    res.sendFile(file, { headers: { 'Content-Type': MIME_BY_EXT[m[2]] } }, (err) => {
      if (err && !res.headersSent) next(err);
    });
  };
}

const FILE_NAME = /([a-f0-9]{32}\.(?:jpg|png|webp|mp4|webm|mov))$/;

function removeMediaFile(url: string): void {
  const local = url.match(/^\/media\/([a-f0-9]{32}\.(?:jpg|png|webp|mp4|webm|mov))$/);
  if (local) {
    fs.promises.unlink(path.join(getMediaDir(), local[1])).catch(() => {});
    return;
  }
  const cfg = getSupabaseStorage();
  const name = url.match(FILE_NAME)?.[1];
  // Only ever delete objects in our own bucket, named the way we name them.
  if (!cfg || !name || url !== publicUrl(cfg, name)) return;
  fetch(`${cfg.url}/storage/v1/object/${cfg.bucket}`, {
    method: 'DELETE',
    headers: storageHeaders(cfg, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefixes: [name] })
  }).catch(() => {});
}

/** Deletes every stored file of a listing (used when the listing itself is deleted). */
export function removeListingMediaFiles(listingData: any): void {
  const media: ListingMedia[] = Array.isArray(listingData?.media) ? listingData.media : [];
  for (const item of media) removeMediaFile(item.url);
}

async function loadOwnedListing(req: Request, res: Response): Promise<{ id: number; data: any } | null> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid listing ID' });
    return null;
  }
  const db = await getDb();
  const result = await db.query<any>('SELECT id, provider_id, data FROM listings WHERE id = $1', [id]);
  if (!result.rows.length) {
    res.status(404).json({ error: 'Listing not found' });
    return null;
  }
  const row = result.rows[0];
  const authUser = req.authUser!;
  const ownProviderId = Number(authUser.providerProfile?.providerId);
  if (authUser.role !== 'admin' && row.provider_id !== ownProviderId) {
    res.status(403).json({ error: 'Forbidden: you can only change your own packages' });
    return null;
  }
  return { id, data: row.data };
}

async function saveMedia(id: number, data: any, media: ListingMedia[]): Promise<any> {
  const db = await getDb();
  const updated = { ...data, media };
  await db.query('UPDATE listings SET data = $1 WHERE id = $2', [JSON.stringify(updated), id]);
  return updated;
}

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => `media:${req.authUser?.id || 'anon'}`,
  validate: { keyGeneratorIpFallback: false },
  message: { error: 'Too many uploads. Please try again in an hour.' }
});

export const mediaRouter = express.Router();

// Upload one photo or video. Body: the raw file bytes.
mediaRouter.post(
  '/listings/:id/media',
  requireAuth,
  requireRole('provider', 'admin'),
  uploadLimiter,
  express.raw({ type: () => true, limit: MAX_VIDEO_BYTES }),
  async (req: Request, res: Response) => {
    try {
      const listing = await loadOwnedListing(req, res);
      if (!listing) return;
      const buf: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const type = sniffMedia(buf);
      if (!type) {
        res.status(415).json({ error: 'Only JPEG, PNG or WebP photos and MP4, WebM or MOV videos can be uploaded.' });
        return;
      }
      if (type.kind === 'image' && buf.length > MAX_IMAGE_BYTES) {
        res.status(413).json({ error: 'Photos can be at most 8 MB.' });
        return;
      }
      const media: ListingMedia[] = Array.isArray(listing.data.media) ? listing.data.media : [];
      const sameKind = media.filter((m) => m.kind === type.kind).length;
      const max = type.kind === 'image' ? MAX_IMAGES_PER_LISTING : MAX_VIDEOS_PER_LISTING;
      if (sameKind >= max) {
        res.status(409).json({ error: `A package can have at most ${max} ${type.kind === 'image' ? 'photos' : 'videos'}.` });
        return;
      }

      const name = `${crypto.randomBytes(16).toString('hex')}.${type.ext}`;
      const url = await storeFile(name, type.mime, buf);

      const item: ListingMedia = {
        id: name.split('.')[0].slice(0, 12),
        kind: type.kind,
        url,
        mime: type.mime,
        bytes: buf.length,
        createdAt: new Date().toISOString()
      };
      const updated = await saveMedia(listing.id, listing.data, [...media, item]);
      res.status(201).json({ success: true, media: item, listing: updated });
    } catch {
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// Remove one item.
mediaRouter.delete(
  '/listings/:id/media/:mediaId',
  requireAuth,
  requireRole('provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const listing = await loadOwnedListing(req, res);
      if (!listing) return;
      const media: ListingMedia[] = Array.isArray(listing.data.media) ? listing.data.media : [];
      const target = media.find((m) => m.id === req.params.mediaId);
      if (!target) {
        res.status(404).json({ error: 'Photo or video not found' });
        return;
      }
      const updated = await saveMedia(listing.id, listing.data, media.filter((m) => m.id !== target.id));
      removeMediaFile(target.url);
      res.json({ success: true, listing: updated });
    } catch {
      res.status(500).json({ error: 'Could not remove it' });
    }
  }
);

// Make a photo the cover (first in the list).
mediaRouter.put(
  '/listings/:id/media/:mediaId/cover',
  requireAuth,
  requireRole('provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const listing = await loadOwnedListing(req, res);
      if (!listing) return;
      const media: ListingMedia[] = Array.isArray(listing.data.media) ? listing.data.media : [];
      const target = media.find((m) => m.id === req.params.mediaId);
      if (!target || target.kind !== 'image') {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }
      const updated = await saveMedia(listing.id, listing.data, [target, ...media.filter((m) => m.id !== target.id)]);
      res.json({ success: true, listing: updated });
    } catch {
      res.status(500).json({ error: 'Could not set the cover photo' });
    }
  }
);
