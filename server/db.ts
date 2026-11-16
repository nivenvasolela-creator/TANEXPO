import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import {
  initialProviders,
  initialListings,
  initialLeads,
  initialBookings,
  initialReviews,
  initialTransactions
} from '../src/data/initialData.js';
import { hashPassword } from './auth.js';
import { isSeedDemoCatalogEnabled } from './config.js';
import { normalizePhone, maskPhone } from './phone.js';

let db: PGlite | null = null;
let dbPromise: Promise<PGlite> | null = null;

export async function getDb(): Promise<PGlite> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const isProd = process.env.NODE_ENV === 'production';
    const dataDir = process.env.PG_DATA_DIR || path.join(process.cwd(), '.data', 'pg');
    let instance: PGlite | undefined;
    try {
      fs.mkdirSync(path.dirname(dataDir), { recursive: true });
      instance = new PGlite(dataDir);
      await initSchemaAndSeed(instance);
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      const isCatalogOrDirErr =
        err?.code === '23505' ||
        msg.includes('pg_type_typname_nsp_index') ||
        msg.includes('postmaster.pid') ||
        msg.includes('PG_VERSION') ||
        msg.includes('failed to initialize') ||
        msg.toLowerCase().includes('corrupt');

      await instance?.close().catch(() => {});

      let canRenameDir = false;
      try {
        canRenameDir = Boolean(isCatalogOrDirErr && dataDir && fs.existsSync(dataDir) && fs.statSync(dataDir).isDirectory());
      } catch {
        canRenameDir = false;
      }

      if (canRenameDir) {
        const backupDir = `${dataDir}.corrupt-${Date.now()}`;
        console.error(
          `[DB CRITICAL] Damaged PGlite data directory detected (${msg}). Renaming to "${backupDir}" (preserving data, never deleting).`
        );
        try {
          fs.renameSync(dataDir, backupDir);
          fs.mkdirSync(path.dirname(dataDir), { recursive: true });
          instance = new PGlite(dataDir);
          await initSchemaAndSeed(instance);
        } catch (retryErr: any) {
          await instance?.close().catch(() => {});
          if (isProd) {
            console.error('[DB FATAL] Cannot recover PGlite in production:', retryErr);
            throw retryErr;
          }
          console.warn('Fallback to in-memory PGlite in non-production due to persistent error:', retryErr);
          instance = new PGlite();
          await initSchemaAndSeed(instance);
        }
      } else {
        if (isProd) {
          console.error('[DB FATAL] PGlite initialization failed in production:', err);
          throw err;
        }
        console.warn('Fallback to in-memory PGlite in non-production due to directory/init error:', err);
        instance = new PGlite();
        await initSchemaAndSeed(instance);
      }
    }

    db = instance;
    return instance;
  })().catch((err) => {
    dbPromise = null;
    throw err;
  });

  return dbPromise;
}

async function initSchemaAndSeed(database: PGlite) {
  // Create base tables in Postgres
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      tourist_profile JSONB,
      provider_profile JSONB,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      owner_user_id TEXT,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_status TEXT NOT NULL DEFAULT 'application_submitted',
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      tourist_user_id TEXT,
      status TEXT NOT NULL,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      tourist_user_id TEXT,
      listing_id INTEGER,
      lead_id INTEGER,
      status TEXT NOT NULL,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      tourist_user_id TEXT,
      booking_id INTEGER,
      booking_ref TEXT,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_providers (
      user_id TEXT NOT NULL,
      provider_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, provider_id)
    );
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY,
      wamid TEXT UNIQUE,
      direction TEXT NOT NULL,
      wa_phone TEXT NOT NULL,
      phone_masked TEXT NOT NULL,
      role TEXT,
      provider_id INTEGER,
      lead_id INTEGER,
      body TEXT NOT NULL,
      parsed_intent JSONB,
      status TEXT NOT NULL DEFAULT 'received',
      last_inbound_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS whatsapp_pending_otps (
      provider_id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      wa_phone TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_log (
      id TEXT PRIMARY KEY,
      notification_key TEXT UNIQUE NOT NULL,
      channel TEXT NOT NULL,
      recipient_masked TEXT NOT NULL,
      lead_id INTEGER,
      provider_id INTEGER,
      sent_at TEXT NOT NULL
    );
  `);

  // Idempotent migrations for existing .data/pg databases
  await database.exec(`
    ALTER TABLE app_sessions ADD COLUMN IF NOT EXISTS expires_at TEXT;

    ALTER TABLE providers ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'application_submitted';
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp_paused BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp_verified_at TEXT;

    ALTER TABLE leads ADD COLUMN IF NOT EXISTS tourist_user_id TEXT;

    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tourist_user_id TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS listing_id INTEGER;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lead_id INTEGER;

    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tourist_user_id TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INTEGER;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_ref TEXT;

    CREATE INDEX IF NOT EXISTS idx_providers_whatsapp_number
      ON providers (whatsapp_number) WHERE whatsapp_number IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_created
      ON whatsapp_messages (wa_phone, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id_unique
      ON reviews (booking_id) WHERE booking_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_ref_unique
      ON reviews (booking_ref) WHERE booking_ref IS NOT NULL;
  `);

  // Backfill bookings.lead_id idempotently
  await database.query(
    `UPDATE bookings
     SET lead_id = (data->>'leadId')::integer
     WHERE lead_id IS NULL AND (data->>'leadId') ~ '^[0-9]+$'`
  );

  // Invalidate any legacy sessions missing expires_at or containing unhashed raw tokens
  await database.query(
    `DELETE FROM app_sessions WHERE expires_at IS NULL OR token !~ '^[0-9a-f]{64}$'`
  );

  // Seed admin account strictly via environment variables (never hardcoded, never via API)
  const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (adminEmail && adminPassword && adminPassword.length >= 8) {
    const existingAdmin = await database.query<any>(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [adminEmail]
    );
    if (existingAdmin.rows.length === 0) {
      const adminHash = await hashPassword(adminPassword);
      await database.query(
        `INSERT INTO users (id, email, phone, password_hash, name, role, tourist_profile, provider_profile, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'usr-admin-seed-1',
          adminEmail,
          null,
          adminHash,
          'TANEXPO Admin',
          'admin',
          null,
          null,
          new Date().toISOString()
        ]
      );
    }
  }

  const seedDemo = isSeedDemoCatalogEnabled();

  // Seed demo users ONLY in non-production environments when demo seeding is enabled and passwords come from env
  if (process.env.NODE_ENV !== 'production' && seedDemo) {
    const demoTouristPwd = process.env.DEMO_TOURIST_PASSWORD;
    const demoProviderPwd = process.env.DEMO_PROVIDER_PASSWORD;

    if (demoTouristPwd && demoTouristPwd.length >= 8) {
      const existingTourist = await database.query<any>(
        'SELECT id FROM users WHERE id = $1 OR LOWER(email) = $2',
        ['usr-tourist-demo-1', 'tourist@tanexpo.co.tz']
      );
      if (existingTourist.rows.length === 0) {
        const touristHash = await hashPassword(demoTouristPwd);
        await database.query(
          `INSERT INTO users (id, email, phone, password_hash, name, role, tourist_profile, provider_profile, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            'usr-tourist-demo-1',
            'tourist@tanexpo.co.tz',
            '+255700123456',
            touristHash,
            'Sarah Jenkins',
            'tourist',
            JSON.stringify({
              touristType: 'international',
              homeCountry: 'United Kingdom',
              preferredCurrency: 'USD',
              preferredLanguage: 'en',
              travelParty: 'couple',
              interests: ['safari', 'beach', 'mountain'],
              budgetPreference: 'midrange'
            }),
            null,
            new Date().toISOString()
          ]
        );
      }
    }

    if (demoProviderPwd && demoProviderPwd.length >= 8) {
      const existingProvider = await database.query<any>(
        'SELECT id FROM users WHERE id = $1 OR LOWER(email) = $2',
        ['usr-provider-demo-1', 'info@kiliwildsafaris.co.tz']
      );
      if (existingProvider.rows.length === 0) {
        const providerHash = await hashPassword(demoProviderPwd);
        await database.query(
          `INSERT INTO users (id, email, phone, password_hash, name, role, tourist_profile, provider_profile, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            'usr-provider-demo-1',
            'info@kiliwildsafaris.co.tz',
            '+255754882109',
            providerHash,
            'Baraka Mushi',
            'provider',
            null,
            JSON.stringify({
              businessName: 'Kilimanjaro Wild Safaris',
              legalName: 'Kilimanjaro Wild Safaris Ltd.',
              providerTypes: ['tour_operator'],
              primaryCategory: 'safari',
              location: 'Arusha',
              region: 'Arusha Region (Northern Safari Circuit)',
              phone: '+255 754 882 109',
              email: 'info@kiliwildsafaris.co.tz',
              talaLicense: 'MNRT/TALA/2021/0491',
              verificationStatus: 'tanexpo_verified',
              setupCompleteness: 100,
              about:
                'Based at the foot of Mount Meru in Arusha, we are a 100% Tanzanian family-owned safari specialist.',
              languages: ['English', 'Swahili', 'German', 'French'],
              providerId: 1
            }),
            new Date().toISOString()
          ]
        );
      }
    }
  }

  // Idempotent phone normalization migration for existing users
  const usersWithPhones = await database.query<any>(
    'SELECT id, phone FROM users WHERE phone IS NOT NULL'
  );
  for (const row of usersWithPhones.rows) {
    const norm = normalizePhone(row.phone);
    if (norm && norm !== row.phone) {
      const conflict = await database.query<any>(
        'SELECT id FROM users WHERE phone = $1 AND id <> $2',
        [norm, row.id]
      );
      if (conflict.rows.length === 0) {
        await database.query('UPDATE users SET phone = $1 WHERE id = $2', [norm, row.id]);
      } else {
        console.warn(
          `[DB Migration] Skipped phone normalization for user ${row.id} (${maskPhone(row.phone)}) due to duplicate phone conflict.`
        );
      }
    }
  }

  try {
    await database.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users (phone) WHERE phone IS NOT NULL'
    );
  } catch (idxErr) {
    console.warn('[DB Migration] Could not create unique index on users.phone:', idxErr);
  }

  // Seed public catalog and demo operational records ONLY when SEED_DEMO_CATALOG is enabled
  if (seedDemo) {
    const provCheck = await database.query<any>('SELECT COUNT(*) as count FROM providers');
    if (Number(provCheck.rows[0]?.count || 0) === 0) {
      for (const p of initialProviders) {
        const ownerId = p.id === 1 && process.env.NODE_ENV !== 'production' ? 'usr-provider-demo-1' : null;
        await database.query(
          `INSERT INTO providers (id, category, name, owner_user_id, verified, verification_status, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            p.id,
            p.category,
            p.name,
            ownerId,
            Boolean(p.verified),
            p.verified ? 'tanexpo_verified' : 'application_submitted',
            JSON.stringify(p)
          ]
        );
      }
    } else if (process.env.NODE_ENV !== 'production') {
      await database.query(
        `UPDATE providers SET owner_user_id = $1 WHERE id = 1 AND owner_user_id IS NULL`,
        ['usr-provider-demo-1']
      );
    }

    const listCheck = await database.query<any>('SELECT COUNT(*) as count FROM listings');
    if (Number(listCheck.rows[0]?.count || 0) === 0) {
      for (const l of initialListings) {
        await database.query(
          'INSERT INTO listings (id, provider_id, category, title, data) VALUES ($1, $2, $3, $4, $5)',
          [l.id, l.providerId, l.category, l.title, JSON.stringify(l)]
        );
      }
    }

    const revCheck = await database.query<any>('SELECT COUNT(*) as count FROM reviews');
    if (Number(revCheck.rows[0]?.count || 0) === 0) {
      for (const r of initialReviews) {
        await database.query(
          'INSERT INTO reviews (id, provider_id, data) VALUES ($1, $2, $3)',
          [r.id, r.providerId, JSON.stringify(r)]
        );
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      const leadCheck = await database.query<any>('SELECT COUNT(*) as count FROM leads');
      if (Number(leadCheck.rows[0]?.count || 0) === 0) {
        for (const ld of initialLeads) {
          await database.query(
            'INSERT INTO leads (id, provider_id, tourist_user_id, status, data) VALUES ($1, $2, $3, $4, $5)',
            [ld.id, ld.providerId, null, ld.status, JSON.stringify(ld)]
          );
        }
      }

      const bkCheck = await database.query<any>('SELECT COUNT(*) as count FROM bookings');
      if (Number(bkCheck.rows[0]?.count || 0) === 0) {
        for (const b of initialBookings) {
          const touristUid = b.id === 1001 ? 'usr-tourist-demo-1' : null;
          await database.query(
            'INSERT INTO bookings (id, provider_id, tourist_user_id, status, data) VALUES ($1, $2, $3, $4, $5)',
            [b.id, b.providerId, touristUid, b.status, JSON.stringify(b)]
          );
        }
      }

      const txCheck = await database.query<any>('SELECT COUNT(*) as count FROM transactions');
      if (Number(txCheck.rows[0]?.count || 0) === 0) {
        for (const tx of initialTransactions) {
          await database.query(
            'INSERT INTO transactions (id, booking_id, provider_id, data) VALUES ($1, $2, $3, $4)',
            [tx.id, tx.bookingId, tx.providerId, JSON.stringify(tx)]
          );
        }
      }

      const savedCheck = await database.query<any>('SELECT COUNT(*) as count FROM saved_providers');
      if (Number(savedCheck.rows[0]?.count || 0) === 0) {
        await database.query(
          'INSERT INTO saved_providers (user_id, provider_id) VALUES ($1, 1), ($1, 2), ($1, 3)',
          ['usr-tourist-demo-1']
        );
      }
    }
  }
}
