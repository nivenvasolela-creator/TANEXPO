import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { initialProviders, initialListings, initialLeads, initialBookings, initialReviews, initialTransactions } from '../src/data/initialData.js';

let db: PGlite | null = null;

export async function getDb(): Promise<PGlite> {
  if (db) return db;

  const dataDir = path.join(process.cwd(), '.data', 'pg');
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
  // Create tables in Postgres
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
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
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
      status TEXT NOT NULL,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      provider_id INTEGER NOT NULL,
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

  // Seed default demo users if empty
  const userCheck = await database.query<any>('SELECT COUNT(*) as count FROM users');
  const userCount = Number(userCheck.rows[0]?.count || 0);

  if (userCount === 0) {
    // Tourist demo account: tourist@tanexpo.co.tz / password123
    // Hash: SHA256 of "password123" = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
    const defaultTourist = {
      id: 'usr-tourist-demo-1',
      email: 'tourist@tanexpo.co.tz',
      phone: '+255 700 123 456',
      password_hash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      name: 'Sarah Jenkins',
      role: 'tourist',
      tourist_profile: JSON.stringify({
        touristType: 'international',
        homeCountry: 'United Kingdom',
        preferredCurrency: 'USD',
        preferredLanguage: 'en',
        travelParty: 'couple',
        interests: ['safari', 'beach', 'mountain'],
        budgetPreference: 'midrange'
      }),
      provider_profile: null,
      created_at: new Date().toISOString()
    };

    // Provider demo account: info@kiliwildsafaris.co.tz / password123
    const defaultProvider = {
      id: 'usr-provider-demo-1',
      email: 'info@kiliwildsafaris.co.tz',
      phone: '+255 754 882 109',
      password_hash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      name: 'Baraka Mushi',
      role: 'provider',
      tourist_profile: null,
      provider_profile: JSON.stringify({
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
        about: 'Based at the foot of Mount Meru in Arusha, we are a 100% Tanzanian family-owned safari specialist.',
        languages: ['English', 'Swahili', 'German', 'French'],
        providerId: 1
      }),
      created_at: new Date().toISOString()
    };

    await database.query(
      `INSERT INTO users (id, email, phone, password_hash, name, role, tourist_profile, provider_profile, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9), ($10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        defaultTourist.id, defaultTourist.email, defaultTourist.phone, defaultTourist.password_hash,
        defaultTourist.name, defaultTourist.role, defaultTourist.tourist_profile, defaultTourist.provider_profile, defaultTourist.created_at,
        defaultProvider.id, defaultProvider.email, defaultProvider.phone, defaultProvider.password_hash,
        defaultProvider.name, defaultProvider.role, defaultProvider.tourist_profile, defaultProvider.provider_profile, defaultProvider.created_at
      ]
    );
  }

  // Seed providers
  const provCheck = await database.query<any>('SELECT COUNT(*) as count FROM providers');
  if (Number(provCheck.rows[0]?.count || 0) === 0) {
    for (const p of initialProviders) {
      await database.query(
        'INSERT INTO providers (id, category, name, data) VALUES ($1, $2, $3, $4)',
        [p.id, p.category, p.name, JSON.stringify(p)]
      );
    }
  }

  // Seed listings
  const listCheck = await database.query<any>('SELECT COUNT(*) as count FROM listings');
  if (Number(listCheck.rows[0]?.count || 0) === 0) {
    for (const l of initialListings) {
      await database.query(
        'INSERT INTO listings (id, provider_id, category, title, data) VALUES ($1, $2, $3, $4, $5)',
        [l.id, l.providerId, l.category, l.title, JSON.stringify(l)]
      );
    }
  }

  // Seed leads
  const leadCheck = await database.query<any>('SELECT COUNT(*) as count FROM leads');
  if (Number(leadCheck.rows[0]?.count || 0) === 0) {
    for (const ld of initialLeads) {
      await database.query(
        'INSERT INTO leads (id, provider_id, status, data) VALUES ($1, $2, $3, $4)',
        [ld.id, ld.providerId, ld.status, JSON.stringify(ld)]
      );
    }
  }

  // Seed bookings
  const bkCheck = await database.query<any>('SELECT COUNT(*) as count FROM bookings');
  if (Number(bkCheck.rows[0]?.count || 0) === 0) {
    for (const b of initialBookings) {
      await database.query(
        'INSERT INTO bookings (id, provider_id, status, data) VALUES ($1, $2, $3, $4)',
        [b.id, b.providerId, b.status, JSON.stringify(b)]
      );
    }
  }

  // Seed reviews
  const revCheck = await database.query<any>('SELECT COUNT(*) as count FROM reviews');
  if (Number(revCheck.rows[0]?.count || 0) === 0) {
    for (const r of initialReviews) {
      await database.query(
        'INSERT INTO reviews (id, provider_id, data) VALUES ($1, $2, $3)',
        [r.id, r.providerId, JSON.stringify(r)]
      );
    }
  }

  // Seed transactions
  const txCheck = await database.query<any>('SELECT COUNT(*) as count FROM transactions');
  if (Number(txCheck.rows[0]?.count || 0) === 0) {
    for (const tx of initialTransactions) {
      await database.query(
        'INSERT INTO transactions (id, booking_id, provider_id, data) VALUES ($1, $2, $3, $4)',
        [tx.id, tx.bookingId, tx.providerId, JSON.stringify(tx)]
      );
    }
  }

  // Seed default saved providers for guest/demo
  const savedCheck = await database.query<any>('SELECT COUNT(*) as count FROM saved_providers');
  if (Number(savedCheck.rows[0]?.count || 0) === 0) {
    await database.query(
      'INSERT INTO saved_providers (user_id, provider_id) VALUES ($1, 1), ($1, 2)',
      ['default-session']
    );
  }
}
