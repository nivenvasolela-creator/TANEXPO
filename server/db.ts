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

let db: PGlite | null = null;

export async function getDb(): Promise<PGlite> {
  if (db) return db;

  const dataDir = process.env.PG_DATA_DIR || path.join(process.cwd(), '.data', 'pg');
  try {
    fs.mkdirSync(path.dirname(dataDir), { recursive: true });
    db = new PGlite(dataDir);
  } catch (err) {
    console.warn('Fallback to in-memory PGlite due to directory error:', err);
    db = new PGlite();
  }

  await initSchemaAndSeed(db);
  return db;
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
  `);

  // Idempotent migrations for existing .data/pg databases
  await database.exec(`
    ALTER TABLE app_sessions ADD COLUMN IF NOT EXISTS expires_at TEXT;

    ALTER TABLE providers ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'application_submitted';

    ALTER TABLE leads ADD COLUMN IF NOT EXISTS tourist_user_id TEXT;

    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tourist_user_id TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS listing_id INTEGER;

    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tourist_user_id TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INTEGER;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_ref TEXT;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id_unique
      ON reviews (booking_id) WHERE booking_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_ref_unique
      ON reviews (booking_ref) WHERE booking_ref IS NOT NULL;
  `);

  // Invalidate any legacy sessions missing expires_at
  await database.query(`DELETE FROM app_sessions WHERE expires_at IS NULL`);

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

  // Seed demo users ONLY in non-production environments and ONLY with passwords from env
  if (process.env.NODE_ENV !== 'production') {
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
            '+255 700 123 456',
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
            '+255 754 882 109',
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

  // Seed public catalog: providers
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

  // Seed public catalog: listings
  const listCheck = await database.query<any>('SELECT COUNT(*) as count FROM listings');
  if (Number(listCheck.rows[0]?.count || 0) === 0) {
    for (const l of initialListings) {
      await database.query(
        'INSERT INTO listings (id, provider_id, category, title, data) VALUES ($1, $2, $3, $4, $5)',
        [l.id, l.providerId, l.category, l.title, JSON.stringify(l)]
      );
    }
  }

  // Seed public catalog: reviews
  const revCheck = await database.query<any>('SELECT COUNT(*) as count FROM reviews');
  if (Number(revCheck.rows[0]?.count || 0) === 0) {
    for (const r of initialReviews) {
      await database.query(
        'INSERT INTO reviews (id, provider_id, data) VALUES ($1, $2, $3)',
        [r.id, r.providerId, JSON.stringify(r)]
      );
    }
  }

  // Seed demo leads/bookings/transactions/saved only when non-production and empty
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
