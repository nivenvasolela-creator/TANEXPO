// Supabase Storage mode for package photos/videos, against a stand-in for Supabase's Storage API
// (the documented REST endpoints the server calls). Starts its own production server.
// Run: node scripts/storage-test.mjs   (npm test runs it; needs `npm run build` first)
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const APP_PORT = Number(process.env.STORAGE_TEST_PORT || 3098);
const KEY = 'sb_secret_test_key_not_real';
const BASE_URL = `http://127.0.0.1:${APP_PORT}/api`;

let passCount = 0;
const pass = (label) => { passCount += 1; console.log(`PASS [${label}]`); };

// --- stand-in Storage API ---
const buckets = new Map(); // id -> { public }
const objects = new Map(); // "bucket/name" -> { type, body }
const calls = [];
const storage = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, apikey: req.headers.apikey });
    const send = (status, data, type = 'application/json') => {
      res.writeHead(status, { 'Content-Type': type });
      res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
    };
    // Like Supabase: a new-style secret key must come on `apikey` only; as a Bearer token it is an invalid JWT.
    if (req.headers.authorization) return send(401, { error: 'Invalid JWT' });
    const authed = req.headers.apikey === KEY;
    let m;
    if (req.method === 'POST' && req.url === '/storage/v1/bucket') {
      if (!authed) return send(403, { error: 'Unauthorized' });
      const b = JSON.parse(body.toString());
      if (buckets.has(b.id)) return send(409, { error: 'Duplicate', message: 'The resource already exists' });
      buckets.set(b.id, { public: b.public, limit: b.file_size_limit, types: b.allowed_mime_types });
      return send(200, { name: b.id });
    }
    if (req.method === 'POST' && (m = req.url.match(/^\/storage\/v1\/object\/([^/]+)\/([^/?]+)$/))) {
      if (!authed) return send(403, { error: 'Unauthorized' });
      if (!buckets.has(m[1])) return send(404, { error: 'Bucket not found' });
      const key = `${m[1]}/${m[2]}`;
      if (objects.has(key)) return send(409, { error: 'Duplicate' });
      objects.set(key, { type: req.headers['content-type'], body });
      return send(200, { Key: key });
    }
    if (req.method === 'GET' && (m = req.url.match(/^\/storage\/v1\/object\/public\/([^/]+)\/([^/?]+)$/))) {
      const o = objects.get(`${m[1]}/${m[2]}`);
      if (!o || !buckets.get(m[1])?.public) return send(404, { error: 'not found' });
      return send(200, o.body, o.type);
    }
    if (req.method === 'DELETE' && (m = req.url.match(/^\/storage\/v1\/object\/([^/]+)$/))) {
      if (!authed) return send(403, { error: 'Unauthorized' });
      const { prefixes } = JSON.parse(body.toString());
      for (const p of prefixes) objects.delete(`${m[1]}/${p}`);
      return send(200, prefixes.map((p) => ({ name: p })));
    }
    send(404, { error: 'unknown route' });
  });
});

async function json(method, route, token, body) {
  const res = await fetch(`${BASE_URL}${route}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = null; }
  return { status: res.status, data, text };
}
async function upload(listingId, token, bytes, type) {
  const res = await fetch(`${BASE_URL}/listings/${listingId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': type },
    body: bytes
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}
const jpeg = (size = 2048) => { const b = Buffer.alloc(size); b.set([0xff, 0xd8, 0xff, 0xe0]); return b; };
const mp4 = (size = 4096) => { const b = Buffer.alloc(size); b.write('ftypisom', 4, 'ascii'); return b; };

async function main() {
  await new Promise((r) => storage.listen(0, '127.0.0.1', r));
  const storageUrl = `http://127.0.0.1:${storage.address().port}`;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tanexpo-storage-'));
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(APP_PORT),
    PG_DATA_DIR: path.join(work, 'pg'),
    SUPABASE_URL: storageUrl,
    SUPABASE_SERVICE_ROLE_KEY: KEY,
    SUPABASE_STORAGE_BUCKET: 'listing-media',
    ADMIN_SEED_EMAIL: 'admin@tanexpo.tz',
    ADMIN_SEED_PASSWORD: 'AdminStrongPassword123!'
  };
  delete env.DATABASE_URL;
  const server = spawn(process.execPath, ['dist/server.cjs'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  try {
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      up = await fetch(`${BASE_URL}/health`).then((r) => r.ok).catch(() => false);
      if (!up) await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(up, `server did not start:\n${log}`);
    console.log(`=== TANEXPO Supabase Storage checks (stand-in at ${storageUrl}) ===`);

    const sfx = Date.now();
    const reg = await json('POST', '/auth/register', '', {
      name: 'Storage Op', email: `storage_${sfx}@example.com`, password: 'ProviderPass#2026', role: 'provider',
      providerProfile: { businessName: 'Storage Safaris', primaryCategory: 'safari', location: 'Arusha' }
    });
    assert.equal(reg.status, 201, reg.text);
    const listing = await json('POST', '/listings', reg.data.token, {
      title: 'Photo Safari', priceTZS: 1000000, duration: '2 Days', category: 'safari', description: 'x', inclusions: []
    });
    assert.equal(listing.status, 201, listing.text);
    const id = listing.data.listing.id;

    const photo = await upload(id, reg.data.token, jpeg(), 'image/jpeg');
    assert.equal(photo.status, 201, JSON.stringify(photo.data));
    const publicPrefix = `${storageUrl}/storage/v1/object/public/listing-media/`;
    assert.ok(photo.data.media.url.startsWith(publicPrefix), photo.data.media.url);
    assert.match(photo.data.media.url, /\/[a-f0-9]{32}\.jpg$/);
    const bucket = buckets.get('listing-media');
    assert.ok(bucket?.public, 'bucket created as public');
    assert.ok(bucket.types.includes('image/jpeg') && bucket.types.includes('video/mp4'), 'bucket limited to allowed types');
    pass('First upload creates a public bucket limited to photo/video types, with the service key');

    const name = photo.data.media.url.slice(publicPrefix.length);
    const stored = objects.get(`listing-media/${name}`);
    assert.equal(stored?.type, 'image/jpeg');
    assert.equal(stored.body.length, 2048);
    const served = await fetch(photo.data.media.url);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get('content-type'), 'image/jpeg');
    assert.equal(fs.existsSync(path.join(work, 'media')), false, 'nothing written to the local disk');
    pass('Photo goes to Supabase Storage as image/jpeg (typed from its bytes) and nothing touches the local disk');

    const video = await upload(id, reg.data.token, mp4(), 'video/mp4');
    assert.equal(video.status, 201);
    assert.equal(objects.get(`listing-media/${video.data.media.url.slice(publicPrefix.length)}`)?.type, 'video/mp4');
    const second = await upload(id, reg.data.token, jpeg(), 'image/jpeg');
    assert.equal(second.status, 201);
    assert.equal(calls.filter((c) => c.url === '/storage/v1/bucket').length, 1, 'bucket created once, not per upload');
    pass('Videos upload too, and the bucket is created only once');

    const disguised = await upload(id, reg.data.token, Buffer.from('<html><script>alert(1)</script></html>'.padEnd(200, ' ')), 'image/jpeg');
    assert.equal(disguised.status, 415);
    assert.equal(objects.size, 3, 'refused file never reaches storage');
    pass('A disguised HTML file is refused before anything is sent to storage');

    const del = await json('DELETE', `/listings/${id}/media/${photo.data.media.id}`, reg.data.token);
    assert.equal(del.status, 200);
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(objects.has(`listing-media/${name}`), false, 'deleted from storage');
    assert.equal(objects.size, 2);
    pass('Removing a photo deletes it from Supabase Storage');

    const page = await fetch(`http://127.0.0.1:${APP_PORT}/`);
    const csp = page.headers.get('content-security-policy') || '';
    const mediaSrc = csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('media-src')) || '';
    assert.ok(mediaSrc.includes(storageUrl), csp);
    assert.ok(!/\bhttps:(\s|$)/.test(mediaSrc), 'media-src stays limited to the storage origin');
    pass('Browser policy allows videos from the Supabase Storage origin only');

    assert.ok(calls.every((c) => !c.url.includes(KEY)), 'key never in a URL');
    assert.ok(calls.filter((c) => c.method !== 'GET').every((c) => c.apikey === KEY && !c.auth), 'secret key sent on apikey only');
    pass('The sb_secret_ key goes on the apikey header only (as a Bearer token Supabase rejects it)');
    console.log(`=== ALL ${passCount} STORAGE CHECKS PASSED ===`);
  } finally {
    server.kill();
    storage.close();
    fs.rmSync(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('FAIL:', err?.message || err);
  process.exit(1);
});
