import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3099/api';
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@tanexpo.tz';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'AdminStrongPassword123!';

let passCount = 0;

function pass(label) {
  passCount += 1;
  console.log(`PASS [${label}]`);
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

async function waitForServer(url, proc, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (proc.exitCode !== null) {
      throw new Error(`Child server exited early with code ${proc.exitCode}`);
    }
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  console.log(`=== TANEXPO WhatsApp & AI Concierge Verification Suite against ${BASE_URL} ===`);
  const ts = Date.now();
  const suffix = String(ts).slice(-6);

  // 1. Security: unauthenticated /simulate-inbound blocked in production (401)
  const unauthSim = await req('POST', '/whatsapp/simulate-inbound', '', {
    from: `+255711${suffix}`,
    body: 'Hello Serengeti'
  });
  assert.equal(unauthSim.status, 401, `Expected 401 on unauthenticated /simulate-inbound, got ${unauthSim.status}`);
  pass('Unauthenticated POST /whatsapp/simulate-inbound blocked with 401 in production');

  // Security: production without WHATSAPP_APP_SECRET must reject unsigned webhook posts
  const unsignedHook = await req('POST', '/whatsapp/webhook', '', {
    entry: [{ changes: [{ value: { messages: [{ id: `wamid_unsigned_${ts}`, from: '255712000999', type: 'text', text: { body: 'LEADS' } }] } }] }]
  });
  assert.equal(unsignedHook.status, 401, `Expected 401 on unsigned webhook in production, got ${unsignedHook.status}`);
  pass('Unsigned POST /whatsapp/webhook rejected with 401 in production when no app secret is set');

  // 2. Register Provider and check /whatsapp/status
  const provEmail = `wa_prov_${ts}@example.com`;
  const provReg = await req('POST', '/auth/register', '', {
    name: 'Savanna Operator',
    email: provEmail,
    phone: `+255755${suffix}`,
    password: 'ProviderPass#2026',
    role: 'provider',
    providerProfile: {
      businessName: 'Savanna Horizon Expeditions',
      primaryCategory: 'safari',
      location: 'Arusha',
      region: 'Northern Circuit'
    }
  });
  assert.equal(provReg.status, 201, `Provider register failed: ${provReg.text}`);
  const provToken = provReg.json.token;
  const provId = provReg.json.user.providerProfile.providerId;

  const listingRes = await req('POST', '/listings', provToken, {
    title: '3-Day Serengeti & Crater Safari',
    priceTZS: 2400000,
    duration: '3 Days / 2 Nights',
    category: 'safari',
    description: 'Private 4x4 safari',
    inclusions: ['4x4 Land Cruiser', 'Park fees']
  });
  assert.equal(listingRes.status, 201, `Create listing failed: ${listingRes.text}`);

  // Non-admin provider cannot call simulate-inbound in production
  const provSimBlocked = await req('POST', '/whatsapp/simulate-inbound', provToken, {
    from: `+255711${suffix}`,
    body: 'Hello'
  });
  assert.equal(provSimBlocked.status, 403, `Expected 403 for non-admin simulate-inbound, got ${provSimBlocked.status}`);
  pass('Non-admin provider rejected from /whatsapp/simulate-inbound in production (403)');

  // Admin login for simulator orchestration
  const adminLogin = await req('POST', '/auth/login', '', {
    emailOrPhone: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  assert.equal(adminLogin.status, 200, `Admin login failed: ${adminLogin.text}`);
  const adminToken = adminLogin.json.token;

  // Verify provider via admin so provider is eligible for matching
  const verifyProv = await req('PUT', `/admin/providers/${provId}/verify`, adminToken, {
    verified: true,
    verificationStatus: 'tanexpo_verified'
  });
  assert.equal(verifyProv.status, 200);

  // 3. Operator OTP linking flow via WhatsApp VERIFY <code>
  const operatorWaPhone = `+255744${suffix}`;
  const otpReq = await req('POST', '/whatsapp/link/request', provToken, {
    phone: operatorWaPhone
  });
  assert.equal(otpReq.status, 200, `OTP request failed: ${otpReq.text}`);
  assert.ok(otpReq.json.simulatedOtp, 'Expected simulatedOtp when WHATSAPP_ENABLED=false');
  assert.ok(otpReq.json.maskedPhone.endsWith(suffix.slice(-3)), 'Expected masked phone');
  pass('Operator WhatsApp OTP requested and masked correctly');

  const otpVerifyWa = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: operatorWaPhone,
    body: `VERIFY ${otpReq.json.simulatedOtp}`,
    wamid: `wamid_otp_${ts}`
  });
  assert.equal(otpVerifyWa.status, 200, `OTP WhatsApp verify failed: ${otpVerifyWa.text}`);
  assert.equal(otpVerifyWa.json.mode, 'otp_link');
  assert.equal(otpVerifyWa.json.providerId, provId);

  const statusAfterLink = await req('GET', '/whatsapp/status', provToken);
  assert.equal(statusAfterLink.status, 200);
  assert.equal(statusAfterLink.json.linked, true);
  assert.equal(statusAfterLink.json.optIn, true);
  assert.equal(statusAfterLink.json.paused, false);
  pass('Operator linked WhatsApp number via VERIFY <code> command');

  // 4. Mode B: Tourist Concierge (English & Swahili) creates real leads + masks phone + dedupes wamid
  const touristWaPhone = `+255788${suffix}`;
  const touristEn = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: touristWaPhone,
    senderName: 'Amina traveler',
    body: 'Hi! Looking for a Serengeti safari for 4 people on 2026-12-15 budget 3000000 TZS',
    wamid: `wamid_en_${ts}`
  });
  assert.equal(touristEn.status, 200, `Tourist EN inbound failed: ${touristEn.text}`);
  assert.equal(touristEn.json.mode, 'tourist');
  assert.ok(touristEn.json.leadId > 0, 'Expected real leadId created');
  const enLeadId = touristEn.json.leadId;
  pass(`Mode B Tourist Concierge (EN) created Lead #${enLeadId}`);

  // Dedupe check with identical wamid
  const dupWamid = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: touristWaPhone,
    body: 'Duplicate delivery',
    wamid: `wamid_en_${ts}`
  });
  assert.equal(dupWamid.status, 200);
  assert.equal(dupWamid.json.deduped, true);
  pass('Duplicate inbound wamid safely deduplicated');

  // Swahili inquiry
  const touristSwPhone = `+255789${suffix}`;
  const touristSw = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: touristSwPhone,
    senderName: 'Juma Bakari',
    body: 'Habari, nataka safari ya Serengeti kwa watu 3 tarehe 2026-12-20',
    wamid: `wamid_sw_${ts}`
  });
  assert.equal(touristSw.status, 200);
  assert.equal(touristSw.json.mode, 'tourist');
  assert.ok(touristSw.json.leadId > 0);
  pass(`Mode B Tourist Concierge (SW) created Lead #${touristSw.json.leadId}`);

  // Verify raw tourist WhatsApp phone is NOT leaked inside GET /leads JSON
  const provLeads = await req('GET', '/leads', provToken);
  assert.equal(provLeads.status, 200);
  const createdLead = provLeads.json.leads.find((l) => l.id === enLeadId);
  assert.ok(createdLead, 'Expected operator to see WhatsApp-created lead');
  assert.ok(!JSON.stringify(createdLead).includes(touristWaPhone), 'Must NOT expose unmasked WhatsApp phone in leads JSON');
  pass('Lead created via WhatsApp masks tourist phone in GET /leads');

  // 5. Mode A: Operator WhatsApp OS Commands (LEADS, ACCEPT, QUOTE, REPLY, PAUSE, RESUME)
  const opLeadsCmd = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: operatorWaPhone,
    body: 'LEADS',
    wamid: `wamid_leads_${ts}`
  });
  assert.equal(opLeadsCmd.status, 200);
  assert.equal(opLeadsCmd.json.mode, 'operator');
  assert.ok(opLeadsCmd.json.replies[0].body.includes(`#${enLeadId}`));
  pass('Operator LEADS command lists active lead');

  const opAcceptCmd = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: operatorWaPhone,
    body: `ACCEPT ${enLeadId}`,
    wamid: `wamid_acc_${ts}`
  });
  assert.equal(opAcceptCmd.status, 200);
  assert.equal(opAcceptCmd.json.leadId, enLeadId);

  const opQuoteCmd = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: operatorWaPhone,
    body: `QUOTE ${enLeadId} 2850000 Includes park fees and 4x4 cruiser`,
    wamid: `wamid_quote_${ts}`
  });
  assert.equal(opQuoteCmd.status, 200);
  assert.ok(opQuoteCmd.json.replies.some((r) => r.body.includes('2,850,000')));

  const opReplyCmd = await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: operatorWaPhone,
    body: `REPLY ${enLeadId} Karibu sana, driver ready!`,
    wamid: `wamid_reply_${ts}`
  });
  assert.equal(opReplyCmd.status, 200);

  const leadAfterOps = await req('GET', `/leads/${enLeadId}`, provToken);
  assert.equal(leadAfterOps.status, 200);
  assert.equal(leadAfterOps.json.lead.status, 'Negotiating');
  assert.equal(leadAfterOps.json.lead.quote.total, 2850000);
  assert.ok(leadAfterOps.json.lead.messages.some((m) => m.channel === 'whatsapp' && m.text.includes('Karibu sana')));
  pass('Operator ACCEPT, QUOTE, and REPLY commands update lead, quote, and WhatsApp message thread');

  // PAUSE / RESUME
  await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: operatorWaPhone,
    body: 'PAUSE',
    wamid: `wamid_pause_${ts}`
  });
  const pausedState = await req('GET', '/whatsapp/status', provToken);
  assert.equal(pausedState.json.paused, true);

  await req('POST', '/whatsapp/simulate-inbound', adminToken, {
    from: operatorWaPhone,
    body: 'RESUME',
    wamid: `wamid_resume_${ts}`
  });
  const resumedState = await req('GET', '/whatsapp/status', provToken);
  assert.equal(resumedState.json.paused, false);
  pass('Operator PAUSE and RESUME commands toggle WhatsApp alert status');

  // 6. Webhook GET verification & POST X-Hub-Signature-256 HMAC verification on isolated child server
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tanexpo-wa-hmac-'));
  const childPort = 3102;
  const appSecret = 'meta_test_app_secret_987654';
  const verifyToken = 'meta_test_verify_token_123';
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(childPort),
      PG_DATA_DIR: path.join(tmpDir, 'pg'),
      WHATSAPP_VERIFY_TOKEN: verifyToken,
      WHATSAPP_APP_SECRET: appSecret,
      WHATSAPP_ENABLED: 'false'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForServer(`http://127.0.0.1:${childPort}/api/health`, child);

    const badVerify = await fetch(
      `http://127.0.0.1:${childPort}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc`
    );
    assert.equal(badVerify.status, 403);

    const goodVerify = await fetch(
      `http://127.0.0.1:${childPort}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=challenge_ok_123`
    );
    assert.equal(goodVerify.status, 200);
    assert.equal(await goodVerify.text(), 'challenge_ok_123');
    pass('GET /whatsapp/webhook verifies Meta hub.verify_token using timing-safe check');

    const webhookBody = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ wa_id: '255712000111', profile: { name: 'Meta Webhook Guest' } }],
                messages: [
                  {
                    id: `wamid_hook_${ts}`,
                    from: '255712000111',
                    type: 'text',
                    text: { body: 'Interested in Zanzibar beach tour for 2 guests' }
                  }
                ]
              }
            }
          ]
        }
      ]
    });

    const badSigRes = await fetch(`http://127.0.0.1:${childPort}/api/whatsapp/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': 'sha256=0000000000000000000000000000000000000000000000000000000000000000'
      },
      body: webhookBody
    });
    assert.equal(badSigRes.status, 401);

    const validHmac = crypto
      .createHmac('sha256', appSecret)
      .update(Buffer.from(webhookBody, 'utf8'))
      .digest('hex');

    const goodSigRes = await fetch(`http://127.0.0.1:${childPort}/api/whatsapp/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': `sha256=${validHmac}`
      },
      body: webhookBody
    });
    assert.equal(goodSigRes.status, 200);
    pass('POST /whatsapp/webhook enforces X-Hub-Signature-256 HMAC verification and ACKs with 200');
  } finally {
    child.kill('SIGTERM');
    await new Promise((r) => child.once('exit', r));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log(`=== ALL ${passCount} WHATSAPP & AI CONCIERGE CHECKS PASSED ===`);
}

main().catch((err) => {
  console.error('WHATSAPP TEST FAILED:', err);
  process.exit(1);
});
