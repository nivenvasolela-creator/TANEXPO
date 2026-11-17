import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000/api';
const ORIGIN_URL = BASE_URL.replace(/\/api\/?$/, '');
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || '';

let passCount = 0;

function pass(name) {
  passCount += 1;
  console.log(`PASS [${name}]`);
}

async function req(method, route, token = '', body = undefined, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${route}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, text, json };
}

function getDarDateOffset(daysOffset) {
  const target = new Date(Date.now() + daysOffset * 86400000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(target);
}

async function waitForServer(url, proc, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (proc.exitCode !== null) {
      throw new Error(`Child process exited early with code ${proc.exitCode}`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function runServerProcess(envOverrides) {
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    cwd: process.cwd(),
    env: { ...process.env, ...envOverrides },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  child.stdout.on('data', (d) => { logs += d.toString(); });
  child.stderr.on('data', (d) => { logs += d.toString(); });
  return { child, getLogs: () => logs };
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      resolve();
    }, 3000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function main() {
  console.log(`=== TANEXPO Integrity & Security Suite against ${BASE_URL} ===`);
  {
    // Over plain http the CSP must not force https sub-requests, or the page loads blank.
    const page = await fetch(ORIGIN_URL + '/');
    const csp = page.headers.get('content-security-policy') || '';
    assert.ok(csp, 'Expected a Content-Security-Policy header in production');
    assert.ok(!/upgrade-insecure-requests/i.test(csp), 'CSP must not contain upgrade-insecure-requests');
    pass('Page CSP does not force https sub-requests (plain-http demos render)');
  }
  const ts = Date.now();
  const suffix = String(ts).slice(-6);

  // 1. Health, config, security headers & X-Request-Id
  const healthRes = await req('GET', '/health');
  assert.equal(healthRes.status, 200, `Expected /health 200, got ${healthRes.status}: ${healthRes.text}`);
  assert.equal(healthRes.json?.status, 'ok');
  assert.ok(healthRes.headers.get('x-request-id'), 'Expected X-Request-Id header');
  const csp = healthRes.headers.get('content-security-policy') || '';
  assert.ok(csp.includes("frame-ancestors 'none'"), `Expected prod frame-ancestors 'none', got: ${csp}`);
  pass('Health endpoint, X-Request-Id, and prod frame-ancestors CSP');

  const configRes = await req('GET', '/config');
  assert.equal(configRes.status, 200);
  assert.ok(configRes.json?.paymentsMode === 'simulated' || configRes.json?.paymentsMode === 'live');
  assert.equal(typeof configRes.json?.seedDemoCatalog, 'boolean');
  pass('/api/config returns runtime flags without secrets');

  // Malformed JSON body -> clean 400 without stack trace
  const badJsonRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"broken": '
  });
  assert.equal(badJsonRes.status, 400);
  const badJsonText = await badJsonRes.text();
  assert.ok(!badJsonText.includes('at '), 'Must not leak stack trace on malformed JSON');
  pass('Malformed JSON returns clean 400 without stack trace');

  // 2. Phone normalization, uniqueness & cross-format login
  const t1PhoneRaw = `+255 712 ${suffix.slice(0, 3)} ${suffix.slice(3, 6)}`;
  const t1PhoneLocal = `0712${suffix}`;
  const t1Pass = 'SafePass#2026';
  const t1Reg = await req('POST', '/auth/register', '', {
    name: 'Normalized Tourist',
    phone: t1PhoneRaw,
    password: t1Pass,
    role: 'tourist'
  });
  assert.equal(t1Reg.status, 201, `Tourist register failed: ${t1Reg.text}`);
  assert.equal(t1Reg.json.user.phone, `+255712${suffix}`);
  const t1Token = t1Reg.json.token;
  const t1Id = t1Reg.json.user.id;
  pass('Tourist registration normalizes +255 spaced phone number');

  const dupPhoneReg = await req('POST', '/auth/register', '', {
    name: 'Duplicate Local Phone',
    phone: t1PhoneLocal,
    password: t1Pass,
    role: 'tourist'
  });
  assert.equal(dupPhoneReg.status, 409, `Expected 409 on duplicate normalized phone, got ${dupPhoneReg.status}: ${dupPhoneReg.text}`);
  pass('Duplicate registration with 07... format rejected with 409');

  const loginLocal = await req('POST', '/auth/login', '', {
    emailOrPhone: t1PhoneLocal,
    password: t1Pass
  });
  assert.equal(loginLocal.status, 200, `Login via 07... format failed: ${loginLocal.text}`);
  pass('Login succeeds using 07... local format for +255 registered phone');

  // Second tourist to test PUT /users/:id phone conflict
  const t2Phone = `+255713${suffix}`;
  const t2Reg = await req('POST', '/auth/register', '', {
    name: 'Second Tourist',
    phone: t2Phone,
    password: t1Pass,
    role: 'tourist'
  });
  assert.equal(t2Reg.status, 201);
  const t2Token = t2Reg.json.token;
  const t2Id = t2Reg.json.user.id;

  const conflictPut = await req('PUT', `/users/${t2Id}`, t2Token, { phone: t1PhoneLocal });
  assert.equal(conflictPut.status, 409, `Expected 409 on PUT /users phone conflict, got ${conflictPut.status}`);
  pass('PUT /users/:id rejects duplicate normalized phone with 409');

  // 3. Provider private contact isolation & reveal only after confirmed booking
  const provEmail = `integrity_prov_${ts}@example.com`;
  const provPrivatePhone = `+255754${suffix}`;
  const provPublicPhone = `+255766${suffix}`;
  const provReg = await req('POST', '/auth/register', '', {
    name: 'Private Contact Safaris',
    email: provEmail,
    phone: provPrivatePhone,
    password: 'ProviderPass#2026',
    role: 'provider',
    providerProfile: {
      businessName: 'Private Contact Safaris',
      primaryCategory: 'safari',
      location: 'Arusha',
      region: 'Northern Circuit',
      publicPhone: provPublicPhone,
      publicEmail: `bookings_${ts}@example.com`,
      showContactAfterBooking: true
    }
  });
  assert.equal(provReg.status, 201, `Provider register failed: ${provReg.text}`);
  const provToken = provReg.json.token;
  const provId = provReg.json.user.providerProfile.providerId;

  const guestCatalog = await req('GET', '/catalog');
  assert.equal(guestCatalog.status, 200);
  const guestProvView = guestCatalog.json.providers.find((p) => p.id === provId);
  assert.ok(guestProvView, 'Provider must appear in public catalog');
  assert.equal(guestProvView.phone, '', 'Guest must not see hidden provider phone');
  assert.equal(guestProvView.email, '', 'Guest must not see hidden provider email');
  pass('Guest /catalog strips provider contact when showContactAfterBooking is true');

  const ownerProvView = await req('GET', `/providers/${provId}`, provToken);
  assert.equal(ownerProvView.status, 200);
  assert.equal(ownerProvView.json.provider.phone, provPublicPhone);
  pass('Provider owner still sees own public contact details');

  // Create listing
  const listingRes = await req('POST', '/listings', provToken, {
    title: 'Integrity Safari Package',
    priceTZS: 900000,
    duration: '2 Days',
    category: 'safari',
    description: 'Testing booking guards',
    inclusions: ['Guide']
  });
  assert.equal(listingRes.status, 201);
  const listingId = listingRes.json.listing.id;

  // 4. bookingIntegrityGuard checks: Lost lead, expired quote, duplicate booking, cancelled rebook
  // 4a. Lost lead -> 409
  const lostLeadRes = await req('POST', '/leads', t1Token, {
    listingId,
    touristName: 'Normalized Tourist',
    touristContact: `255712${suffix}`,
    date: getDarDateOffset(10),
    groupSize: 2,
    message: 'Lost lead test'
  });
  assert.equal(lostLeadRes.status, 201);
  const lostLeadId = lostLeadRes.json.lead.id;
  await req('PUT', `/leads/${lostLeadId}`, provToken, { status: 'Lost' });
  const lostBookRes = await req('POST', '/bookings', t1Token, {
    leadId: lostLeadId,
    paymentMethod: 'M-Pesa'
  });
  assert.equal(lostBookRes.status, 409, `Expected 409 for Lost lead booking, got ${lostBookRes.status}`);
  pass('bookingIntegrityGuard blocks booking on Lost lead with 409');

  // 4b. Expired quote -> 409
  const expLeadRes = await req('POST', '/leads', t1Token, {
    listingId,
    touristName: 'Normalized Tourist',
    touristContact: `255712${suffix}`,
    date: getDarDateOffset(15),
    groupSize: 1,
    message: 'Expired quote test'
  });
  assert.equal(expLeadRes.status, 201);
  const expLeadId = expLeadRes.json.lead.id;
  const yesterdayStr = getDarDateOffset(-1);
  const quotePut = await req('PUT', `/leads/${expLeadId}`, provToken, {
    status: 'Negotiating',
    quote: {
      basePrice: 900000,
      extras: [],
      discount: 0,
      total: 900000,
      validUntil: yesterdayStr,
      note: 'Expired yesterday'
    }
  });
  assert.equal(quotePut.status, 200);
  const expBookRes = await req('POST', '/bookings', t1Token, {
    leadId: expLeadId,
    paymentMethod: 'M-Pesa'
  });
  assert.equal(expBookRes.status, 409, `Expected 409 for expired quote, got ${expBookRes.status}`);
  pass('bookingIntegrityGuard blocks booking on expired quote with 409');

  // 4c. Valid future booking -> 201; duplicate booking -> 409; after confirmed booking, tourist sees provider phone
  const futureLeadRes = await req('POST', '/leads', t1Token, {
    listingId,
    touristName: 'Normalized Tourist',
    touristContact: `255712${suffix}`,
    date: getDarDateOffset(30),
    groupSize: 2,
    message: 'Future trip'
  });
  assert.equal(futureLeadRes.status, 201);
  const futureLeadId = futureLeadRes.json.lead.id;

  const bookFuture = await req('POST', '/bookings', t1Token, {
    leadId: futureLeadId,
    paymentMethod: 'M-Pesa'
  });
  assert.equal(bookFuture.status, 201, `Valid booking failed: ${bookFuture.text}`);
  const futureBookingId = bookFuture.json.booking.id;
  pass('Valid booking succeeds with 201');

  const dupBooking = await req('POST', '/bookings', t1Token, {
    leadId: futureLeadId,
    paymentMethod: 'M-Pesa'
  });
  assert.equal(dupBooking.status, 409, `Expected 409 on duplicate booking for lead, got ${dupBooking.status}`);
  pass('bookingIntegrityGuard blocks duplicate booking on same lead with 409');

  const bookedTouristCatalog = await req('GET', `/providers/${provId}`, t1Token);
  assert.equal(bookedTouristCatalog.status, 200);
  assert.equal(bookedTouristCatalog.json.provider.phone, provPublicPhone);
  pass('Booked tourist receives provider contact after confirmed booking');

  const unbookedTouristCatalog = await req('GET', `/providers/${provId}`, t2Token);
  assert.equal(unbookedTouristCatalog.status, 200);
  assert.equal(unbookedTouristCatalog.json.provider.phone, '');
  pass('Unbooked tourist still cannot see provider contact');

  // 5. Future-date Completed booking guard
  const completeFuture = await req('PUT', `/bookings/${futureBookingId}`, provToken, { status: 'Completed' });
  assert.equal(completeFuture.status, 409, `Expected 409 completing future booking, got ${completeFuture.status}`);
  pass('PUT /bookings/:id rejects marking future booking Completed with 409');

  // Cancel futureBookingId -> allows re-booking the same leadId
  const cancelFuture = await req('PUT', `/bookings/${futureBookingId}`, provToken, { status: 'Cancelled' });
  assert.equal(cancelFuture.status, 200);
  const rebookRes = await req('POST', '/bookings', t1Token, {
    leadId: futureLeadId,
    paymentMethod: 'Tigo Pesa'
  });
  assert.equal(rebookRes.status, 201, `Expected 201 rebooking cancelled lead, got ${rebookRes.status}`);
  pass('Cancelled booking allows new booking for the same leadId');

  // Past/today booking CAN be marked Completed
  const pastLeadRes = await req('POST', '/leads', t2Token, {
    listingId,
    touristName: 'Second Tourist',
    touristContact: t2Phone,
    date: getDarDateOffset(-2),
    groupSize: 1
  });
  assert.equal(pastLeadRes.status, 201);
  const pastBookRes = await req('POST', '/bookings', t2Token, {
    leadId: pastLeadRes.json.lead.id,
    paymentMethod: 'M-Pesa'
  });
  assert.equal(pastBookRes.status, 201);
  const completeUnpaid = await req('PUT', `/bookings/${pastBookRes.json.booking.id}`, provToken, { status: 'Completed' });
  assert.equal(completeUnpaid.status, 409, `Expected 409 completing unpaid booking, got ${completeUnpaid.status}`);
  const payPast = await req('POST', '/transactions', t2Token, { bookingId: pastBookRes.json.booking.id, paymentRail: 'M-Pesa' });
  assert.equal(payPast.status, 201, `Expected 201 recording payment, got ${payPast.status}: ${payPast.text}`);
  pass('Unpaid booking cannot be marked Completed until the traveler pays');
  const completePast = await req('PUT', `/bookings/${pastBookRes.json.booking.id}`, provToken, { status: 'Completed' });
  assert.equal(completePast.status, 200, `Expected 200 completing past booking, got ${completePast.status}: ${completePast.text}`);
  pass('PUT /bookings/:id allows marking past-dated booking Completed');

  // 6. Admin backup endpoint & sanitization
  const unauthBackup = await req('GET', '/admin/backup');
  assert.equal(unauthBackup.status, 401);
  const touristBackup = await req('GET', '/admin/backup', t1Token);
  assert.equal(touristBackup.status, 403);
  pass('Non-admin denied /api/admin/backup (401/403)');

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const adminLogin = await req('POST', '/auth/login', '', {
      emailOrPhone: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    assert.equal(adminLogin.status, 200, `Admin login failed: ${adminLogin.text}`);
    const adminToken = adminLogin.json.token;

    const backupRes = await fetch(`${BASE_URL}/admin/backup`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(backupRes.status, 200);
    assert.ok((backupRes.headers.get('content-type') || '').includes('application/gzip'));
    const gzBuf = Buffer.from(await backupRes.arrayBuffer());
    const backupJson = JSON.parse(zlib.gunzipSync(gzBuf).toString('utf8'));
    assert.ok(Array.isArray(backupJson.tables?.users));
    assert.ok(!('app_sessions' in (backupJson.tables || {})), 'Backup must omit app_sessions');
    for (const u of backupJson.tables.users) {
      assert.equal(u.password_hash, undefined, 'Backup must omit password_hash');
    }
    pass('Admin /api/admin/backup exports valid gzip JSON without password_hash or app_sessions');
  }

  // 6b. Account deletion (DELETE /api/auth/account) requires password and invalidates token
  const delWrongPass = await req('DELETE', '/auth/account', t2Token, { password: 'WrongPassword!' });
  assert.equal(delWrongPass.status, 401, `Expected 401 on wrong delete password, got ${delWrongPass.status}`);
  const delOk = await req('DELETE', '/auth/account', t2Token, { password: t1Pass });
  assert.equal(delOk.status, 200, `Account deletion failed: ${delOk.text}`);
  const afterDelMe = await req('GET', '/auth/me', t2Token);
  assert.equal(afterDelMe.status, 401, 'Deleted account token must be rejected');
  pass('DELETE /api/auth/account verifies password, deletes user/sessions, and invalidates token');

  // 7. Per-account login rate limiter (10 failures -> 11th returns 429)
  const lockEmail = `ratelimit_${ts}@example.com`;
  const lockReg = await req('POST', '/auth/register', '', {
    name: 'Rate Limit Target',
    email: lockEmail,
    password: 'CorrectPassword#99',
    role: 'tourist'
  });
  assert.equal(lockReg.status, 201);

  for (let i = 0; i < 10; i++) {
    const failTry = await req(
      'POST',
      '/auth/login',
      '',
      { emailOrPhone: lockEmail, password: 'WrongPassword#11' },
      { 'X-Forwarded-For': `10.0.0.${i + 10}` }
    );
    assert.equal(failTry.status, 401, `Attempt ${i + 1} expected 401, got ${failTry.status}`);
  }
  const lockedTry = await req(
    'POST',
    '/auth/login',
    '',
    { emailOrPhone: lockEmail, password: 'WrongPassword#11' },
    { 'X-Forwarded-For': '10.0.0.250' }
  );
  assert.equal(lockedTry.status, 429, `Expected 429 on 11th bad login for same account, got ${lockedTry.status}`);
  pass('Per-account login rate limiter locks after 10 bad attempts even across IPs');

  // 8. Isolated child-process production DB & PAYMENTS_MODE=live checks
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tanexpo-int-'));
  try {
    // 8a. Empty production DB starts with 0 providers (no demo catalog seeded) & live payment guard blocks POST /transactions
    const emptyPgDir = path.join(tmpRoot, 'empty-pg');
    const portA = '3191';
    const srvA = runServerProcess({
      NODE_ENV: 'production',
      PORT: portA,
      PG_DATA_DIR: emptyPgDir,
      PAYMENTS_MODE: 'live'
    });
    try {
      await waitForServer(`http://127.0.0.1:${portA}/api/health`, srvA.child);
      const catA = await fetch(`http://127.0.0.1:${portA}/api/catalog`).then((r) => r.json());
      assert.equal(catA.providers.length, 0, `Expected 0 providers in unseeded prod DB, got ${catA.providers.length}`);

      const cfgA = await fetch(`http://127.0.0.1:${portA}/api/config`).then((r) => r.json());
      assert.equal(cfgA.paymentsMode, 'live');
      assert.equal(cfgA.seedDemoCatalog, false);

      // Register tourist & test POST /transactions returns 403 in live mode
      const regA = await fetch(`http://127.0.0.1:${portA}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Live Tester', email: `live_${ts}@example.com`, password: 'Password#1234', role: 'tourist' })
      }).then((r) => r.json());
      const txA = await fetch(`http://127.0.0.1:${portA}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regA.token}` },
        body: JSON.stringify({ amountTZS: 1000 })
      });
      assert.equal(txA.status, 403, `Expected 403 on POST /api/transactions in live mode, got ${txA.status}`);
      pass('Prod starts with 0 demo providers and PAYMENTS_MODE=live blocks simulated POST /transactions');
    } finally {
      await stopChild(srvA.child);
    }

    // 8b. Unusable PG_DATA_DIR (regular file path) in NODE_ENV=production fails fast instead of in-memory fallback
    const badPath = path.join(tmpRoot, 'not-a-directory');
    fs.writeFileSync(badPath, 'file-blocks-mkdir');
    const srvBad = runServerProcess({
      NODE_ENV: 'production',
      PORT: '3192',
      PG_DATA_DIR: badPath
    });
    const exitCode = await new Promise((resolve) => {
      const t = setTimeout(() => resolve(-1), 10000);
      srvBad.child.once('exit', (code) => {
        clearTimeout(t);
        resolve(code);
      });
    });
    await stopChild(srvBad.child);
    assert.notEqual(exitCode, 0, 'Production server must exit non-zero if PG_DATA_DIR fails');
    assert.notEqual(exitCode, -1, 'Production server must fail fast rather than hang');
    pass('Production server fails fast on unusable PG_DATA_DIR (no silent in-memory fallback)');

    // 8c. Corrupt PG_DATA_DIR is renamed to .corrupt-* (never deleted) and recovered cleanly
    const corruptDir = path.join(tmpRoot, 'corrupt-pg');
    fs.mkdirSync(corruptDir, { recursive: true });
    fs.writeFileSync(path.join(corruptDir, 'PG_VERSION'), 'CORRUPTED_DATA');
    fs.writeFileSync(path.join(corruptDir, 'sentinel.txt'), 'preserve-me');
    const portC = '3193';
    const srvC = runServerProcess({
      NODE_ENV: 'production',
      PORT: portC,
      PG_DATA_DIR: corruptDir
    });
    try {
      await waitForServer(`http://127.0.0.1:${portC}/api/health`, srvC.child);
      const entries = fs.readdirSync(tmpRoot);
      const backupDirs = entries.filter((e) => e.startsWith('corrupt-pg.corrupt-'));
      assert.equal(backupDirs.length, 1, `Expected 1 corrupt backup dir, found: ${entries.join(', ')}`);
      assert.ok(fs.existsSync(path.join(tmpRoot, backupDirs[0], 'sentinel.txt')), 'Corrupt dir contents must be preserved');
      pass('Damaged PG_DATA_DIR is renamed to .corrupt-* without deleting data');
    } finally {
      await stopChild(srvC.child);
    }
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  console.log(`=== ALL ${passCount} INTEGRITY CHECKS PASSED ===`);
}

main().catch((err) => {
  console.error('INTEGRITY TEST FAILED:', err);
  process.exit(1);
});
