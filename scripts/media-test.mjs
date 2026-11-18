// Package photo/video upload checks. Run against a fresh production server (npm test does).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3099/api';
const ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(path.dirname(path.resolve(process.env.PG_DATA_DIR || './.data/pg')), 'media');

let passCount = 0;
const pass = (label) => { passCount += 1; console.log(`PASS [${label}]`); };

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
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': type },
    body: bytes
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

const jpeg = (size = 2048) => { const b = Buffer.alloc(size); b.set([0xff, 0xd8, 0xff, 0xe0]); return b; };
const mp4 = (size = 4096) => { const b = Buffer.alloc(size); b.write('ftypisom', 4, 'ascii'); return b; };
const heic = () => { const b = Buffer.alloc(2048); b.write('ftypheic', 4, 'ascii'); return b; };

async function provider(tag) {
  const sfx = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const reg = await json('POST', '/auth/register', '', {
    name: `Media ${tag}`, email: `media_${tag}_${sfx}@example.com`, password: 'ProviderPass#2026', role: 'provider',
    providerProfile: { businessName: `Media ${tag} Safaris`, primaryCategory: 'safari', location: 'Arusha' }
  });
  assert.equal(reg.status, 201, reg.text);
  const listing = await json('POST', '/listings', reg.data.token, {
    title: 'Photo Safari', priceTZS: 1000000, duration: '2 Days', category: 'safari', description: 'x', inclusions: []
  });
  assert.equal(listing.status, 201, listing.text);
  return { token: reg.data.token, listingId: listing.data.listing.id };
}

async function main() {
  console.log(`=== TANEXPO media upload checks against ${BASE_URL} ===`);
  const A = await provider('a');
  const B = await provider('b');
  const tourist = await json('POST', '/auth/register', '', { name: 'Media Tourist', email: `media_t_${Date.now()}@example.com`, password: 'TouristPass#2026', role: 'tourist' });

  const ok = await upload(A.listingId, A.token, jpeg(), 'image/jpeg');
  assert.equal(ok.status, 201, JSON.stringify(ok.data));
  assert.match(ok.data.media.url, /^\/media\/[a-f0-9]{32}\.jpg$/);
  const served = await fetch(ORIGIN + ok.data.media.url);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/jpeg');
  assert.equal(served.headers.get('x-content-type-options'), 'nosniff');
  assert.match(served.headers.get('content-security-policy') || '', /sandbox/);
  pass('Owner uploads a photo; it is served as image/jpeg with nosniff and a sandbox CSP');

  const disguised = await upload(A.listingId, A.token, Buffer.from('<html><script>alert(1)</script></html>'.padEnd(200, ' ')), 'image/jpeg');
  assert.equal(disguised.status, 415);
  assert.equal((await upload(A.listingId, A.token, heic(), 'video/mp4')).status, 415);
  pass('Files are typed by their bytes: HTML labelled image/jpeg and HEIC stills are refused (415)');

  assert.equal((await upload(A.listingId, B.token, jpeg(), 'image/jpeg')).status, 403);
  assert.equal((await upload(A.listingId, tourist.data.token, jpeg(), 'image/jpeg')).status, 403);
  assert.equal((await upload(A.listingId, '', jpeg(), 'image/jpeg')).status, 401);
  assert.equal((await json('DELETE', `/listings/${A.listingId}/media/${ok.data.media.id}`, B.token)).status, 403);
  pass("Only the package's owner can add or remove its media (other operator 403, traveler 403, anonymous 401)");

  assert.equal((await upload(A.listingId, A.token, jpeg(9 * 1024 * 1024), 'image/jpeg')).status, 413);
  assert.equal((await upload(A.listingId, A.token, mp4(41 * 1024 * 1024), 'video/mp4')).status, 413);
  pass('Size limits: photo over 8 MB and video over 40 MB are refused with 413');

  const vids = [];
  for (let i = 0; i < 3; i++) {
    const v = await upload(A.listingId, A.token, mp4(), 'video/mp4');
    assert.equal(v.status, 201, JSON.stringify(v.data));
    vids.push(v.data.media);
  }
  assert.equal(vids[0].kind, 'video');
  assert.equal((await upload(A.listingId, A.token, mp4(), 'video/mp4')).status, 409);
  const ranged = await fetch(ORIGIN + vids[0].url, { headers: { Range: 'bytes=0-99' } });
  assert.equal(ranged.status, 206);
  pass('Videos upload, stream with range requests (206), and a 4th video is refused (409)');

  const second = await upload(A.listingId, A.token, jpeg(), 'image/jpeg');
  const cover = await json('PUT', `/listings/${A.listingId}/media/${second.data.media.id}/cover`, A.token);
  assert.equal(cover.status, 200);
  assert.equal(cover.data.listing.media[0].id, second.data.media.id);
  const catalog = await json('GET', '/catalog', '');
  const inCatalog = catalog.data.listings.find((l) => l.id === A.listingId);
  assert.equal(inCatalog.media[0].id, second.data.media.id);
  pass('Set cover moves the photo first, and travelers see the media in the public catalog');

  // Editing the package text keeps its media; the client cannot inject media URLs.
  const edit = await json('POST', '/listings', A.token, {
    id: A.listingId, title: 'Photo Safari Updated', priceTZS: 1000000, duration: '2 Days', category: 'safari',
    media: [{ id: 'x', kind: 'image', url: 'https://evil.example/x.jpg' }]
  });
  assert.equal(edit.status, 200);
  assert.ok(edit.data.listing.media.every((m) => m.url.startsWith('/media/')));
  assert.equal(edit.data.listing.media.length, 5);
  pass('Editing a package keeps its media and ignores media sent by the client');

  const file = path.join(MEDIA_DIR, ok.data.media.url.split('/').pop());
  assert.ok(fs.existsSync(file), `expected ${file}`);
  assert.equal((await json('DELETE', `/listings/${A.listingId}/media/${ok.data.media.id}`, A.token)).status, 200);
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(!fs.existsSync(file));
  assert.equal((await fetch(ORIGIN + ok.data.media.url)).status, 404);
  pass('Removing a photo deletes the file from disk');

  const remaining = cover.data.listing.media.map((m) => path.join(MEDIA_DIR, m.url.split('/').pop()));
  assert.equal((await json('DELETE', `/listings/${A.listingId}`, A.token)).status, 200);
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(remaining.every((f) => !fs.existsSync(f)));
  pass("Deleting a package deletes all of its files");

  for (const p of ['/media/%2e%2e/.data/pg', '/media/..%2f..%2fserver.ts', '/media/' + 'a'.repeat(32) + '.html', '/media/x.jpg', '/media/%2e%2e%2fserver.cjs']) {
    // node:http sends the path exactly as written (fetch would normalise the dot segments away).
    const status = await new Promise((resolve, reject) => {
      const u = new URL(ORIGIN);
      http.get({ host: u.hostname, port: u.port, path: p }, (r) => { r.resume(); resolve(r.statusCode); }).on('error', reject);
    });
    assert.equal(status, 404, p);
  }
  pass('Only generated media names are served (traversal and other names are 404)');

  console.log(`=== ALL ${passCount} MEDIA CHECKS PASSED ===`);
}

main().catch((err) => {
  console.error('MEDIA TEST FAILED:', err);
  process.exit(1);
});
