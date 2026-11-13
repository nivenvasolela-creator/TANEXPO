import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from './db.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  getSessionExpiryIso,
  getAuthUser,
  requireAuth,
  requireRole,
  loginRateLimiter,
  registerRateLimiter
} from './auth.js';
import {
  initialProviders,
  initialListings,
  initialLeads,
  initialBookings,
  initialReviews,
  initialTransactions
} from '../src/data/initialData.js';

export const apiRouter = express.Router();

const VALID_CATEGORIES = new Set(['safari', 'beach', 'mountain', 'culture', 'city', 'marine']);
const VALID_LEAD_STATUSES = new Set(['New', 'Contacted', 'Negotiating', 'Booked', 'Lost']);
const VALID_BOOKING_STATUSES = new Set(['Upcoming', 'Completed', 'Cancelled']);
const VALID_PAYMENT_RAILS = new Set([
  'M-Pesa',
  'Tigo Pesa',
  'Airtel Money',
  'CRDB Bank',
  'NMB Bank'
]);
const VALID_VERIFICATION_STATUSES = new Set([
  'application_submitted',
  'under_review',
  'tanexpo_verified',
  'incomplete'
]);

function getCommissionRate(): number {
  const raw = process.env.COMMISSION_RATE;
  if (raw !== undefined && raw !== '') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }
  return 0.15;
}

function isNonEmptyString(val: unknown, maxLen = 500): val is string {
  return typeof val === 'string' && val.trim().length > 0 && val.trim().length <= maxLen;
}

function isOptionalString(val: unknown, maxLen = 2000): boolean {
  return val === undefined || val === null || (typeof val === 'string' && val.length <= maxLen);
}

function parsePositiveInt(val: unknown): number | null {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function isValidEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function getUserProviderId(user: NonNullable<Request['authUser']>): number | null {
  const pid = user.providerProfile?.providerId;
  return parsePositiveInt(pid);
}

// --- AUTHENTICATION ROUTES ---

// Register Tourist or Provider (never Admin)
apiRouter.post('/auth/register', registerRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, phone, password, name, role, touristProfile, providerProfile } = req.body ?? {};

    if (!isNonEmptyString(name, 120)) {
      res.status(400).json({ error: 'Name is required (max 120 characters)' });
      return;
    }

    if (role === 'admin') {
      res.status(403).json({ error: 'Admin accounts cannot be registered via API' });
      return;
    }

    if (role !== 'tourist' && role !== 'provider') {
      res.status(400).json({ error: 'Role must be either tourist or provider' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password is required and must be at least 8 characters' });
      return;
    }

    const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
    const normalizedPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    if (!normalizedEmail && !normalizedPhone) {
      res.status(400).json({ error: 'Email or phone number is required' });
      return;
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (normalizedPhone && normalizedPhone.length > 40) {
      res.status(400).json({ error: 'Phone number is too long' });
      return;
    }

    const db = await getDb();

    if (normalizedEmail) {
      const existing = await db.query<any>(
        'SELECT id FROM users WHERE LOWER(email) = $1',
        [normalizedEmail]
      );
      if (existing.rows.length > 0) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }
    }

    if (normalizedPhone) {
      const existingPhone = await db.query<any>(
        'SELECT id FROM users WHERE phone = $1',
        [normalizedPhone]
      );
      if (existingPhone.rows.length > 0) {
        res.status(409).json({ error: 'An account with this phone number already exists' });
        return;
      }
    }

    const userId = 'usr_' + crypto.randomUUID();
    const pwdHash = await hashPassword(password);
    const createdAt = new Date().toISOString();

    let sanitizedTouristProfile = null;
    let sanitizedProviderProfile = null;

    if (role === 'tourist') {
      const tp = touristProfile && typeof touristProfile === 'object' ? touristProfile : {};
      sanitizedTouristProfile = {
        touristType: tp.touristType === 'domestic' ? 'domestic' : 'international',
        homeCountry: isNonEmptyString(tp.homeCountry, 80) ? tp.homeCountry.trim() : 'Tanzania',
        preferredCurrency: tp.preferredCurrency === 'TZS' ? 'TZS' : 'USD',
        preferredLanguage: tp.preferredLanguage === 'sw' ? 'sw' : 'en',
        travelParty: ['solo', 'couple', 'family', 'group'].includes(tp.travelParty)
          ? tp.travelParty
          : 'couple',
        interests: Array.isArray(tp.interests) ? tp.interests.slice(0, 10) : ['safari'],
        ...(tp.budgetPreference && ['budget', 'midrange', 'luxury'].includes(tp.budgetPreference)
          ? { budgetPreference: tp.budgetPreference }
          : {})
      };
    }

    if (role === 'provider') {
      const pp = providerProfile && typeof providerProfile === 'object' ? providerProfile : {};
      const category = VALID_CATEGORIES.has(pp.primaryCategory) ? pp.primaryCategory : 'safari';
      const businessName = isNonEmptyString(pp.businessName, 120)
        ? pp.businessName.trim()
        : name.trim();
      const location = isNonEmptyString(pp.location, 100) ? pp.location.trim() : 'Arusha';
      const region = isNonEmptyString(pp.region, 120) ? pp.region.trim() : 'Northern Circuit';
      const talaLicense = isNonEmptyString(pp.talaLicense, 80)
        ? pp.talaLicense.trim()
        : undefined;

      // Server-generated unique provider ID; ignore any client-supplied providerId
      const nextIdRes = await db.query<any>(
        'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM providers'
      );
      const pId = Number(nextIdRes.rows[0]?.next_id || 1);

      // New providers ALWAYS start unverified; only admin can verify
      const initialVerificationStatus = talaLicense ? 'application_submitted' : 'incomplete';

      sanitizedProviderProfile = {
        businessName,
        legalName: isNonEmptyString(pp.legalName, 140) ? pp.legalName.trim() : `${businessName} Ltd.`,
        providerTypes: Array.isArray(pp.providerTypes)
          ? pp.providerTypes.filter((t: unknown) => typeof t === 'string').slice(0, 10)
          : ['Tour operator'],
        primaryCategory: category,
        location,
        region,
        phone: isNonEmptyString(pp.phone, 40) ? pp.phone.trim() : normalizedPhone || '',
        email: isNonEmptyString(pp.email, 120) ? pp.email.trim() : normalizedEmail || '',
        talaLicense,
        verificationStatus: initialVerificationStatus,
        setupCompleteness: talaLicense ? 85 : 65,
        about: isNonEmptyString(pp.about, 2000) ? pp.about.trim() : '',
        fleetInfo: isNonEmptyString(pp.fleetInfo, 300) ? pp.fleetInfo.trim() : undefined,
        languages:
          Array.isArray(pp.languages) && pp.languages.length > 0
            ? pp.languages.filter((l: unknown) => typeof l === 'string').slice(0, 10)
            : ['English', 'Swahili'],
        providerId: pId
      };

      const newProviderObj = {
        id: pId,
        category,
        name: businessName,
        tagline: `${region} Tour Operator`,
        location,
        region,
        rating: 5.0,
        reviewsCount: 0,
        tripsCompleted: 0,
        verified: false,
        talaLicense: talaLicense || 'TALA-PENDING-REVIEW',
        languages: sanitizedProviderProfile.languages,
        about:
          sanitizedProviderProfile.about ||
          `Welcome to ${businessName}. Licensed Tanzanian tourism operator.`,
        phone: sanitizedProviderProfile.phone,
        email: sanitizedProviderProfile.email,
        establishedYear: new Date().getFullYear(),
        badges: [
          'Newly Registered',
          talaLicense ? 'TALA Application Submitted' : 'Verification Pending'
        ],
        officeAddress: `${location}, ${region}, Tanzania`
      };

      await db.query(
        `INSERT INTO providers (id, category, name, owner_user_id, verified, verification_status, data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          pId,
          newProviderObj.category,
          newProviderObj.name,
          userId,
          false,
          initialVerificationStatus,
          JSON.stringify(newProviderObj)
        ]
      );
    }

    await db.query(
      `INSERT INTO users (id, email, phone, password_hash, name, role, tourist_profile, provider_profile, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        normalizedEmail,
        normalizedPhone,
        pwdHash,
        name.trim(),
        role,
        sanitizedTouristProfile ? JSON.stringify(sanitizedTouristProfile) : null,
        sanitizedProviderProfile ? JSON.stringify(sanitizedProviderProfile) : null,
        createdAt
      ]
    );

    const token = generateToken();
    const expiresAt = getSessionExpiryIso();
    await db.query(
      'INSERT INTO app_sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)',
      [token, userId, createdAt, expiresAt]
    );

    const user = {
      id: userId,
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
      name: name.trim(),
      role,
      touristProfile: sanitizedTouristProfile || undefined,
      providerProfile: sanitizedProviderProfile || undefined,
      createdAt
    };

    res.status(201).json({ token, user });
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with email/phone + required password
apiRouter.post('/auth/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body ?? {};

    if (!isNonEmptyString(emailOrPhone, 150) || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Email or phone and password are required' });
      return;
    }

    const db = await getDb();
    const trimmed = emailOrPhone.trim();
    const identifier = trimmed.toLowerCase();

    const userRes = await db.query<any>(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2',
      [identifier, trimmed]
    );

    if (!userRes.rows.length) {
      // Timing-safe dummy check
      await verifyPassword(password, null);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const row = userRes.rows[0];
    const { valid, needsRehash } = await verifyPassword(password, row.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Transparently migrate legacy unsalted SHA-256 hash to scrypt on successful login
    if (needsRehash) {
      const upgradedHash = await hashPassword(password);
      await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgradedHash, row.id]);
    }

    const token = generateToken();
    const nowIso = new Date().toISOString();
    const expiresAt = getSessionExpiryIso();
    await db.query(
      'INSERT INTO app_sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)',
      [token, row.id, nowIso, expiresAt]
    );

    const user = {
      id: row.id,
      email: row.email,
      phone: row.phone,
      name: row.name,
      role: row.role,
      touristProfile: row.tourist_profile,
      providerProfile: row.provider_profile,
      createdAt: row.created_at
    };

    res.json({ token, user });
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user session
apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      res.status(401).json({ user: null, error: 'Authentication required' });
      return;
    }
    const { token: _t, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load session' });
  }
});

// Logout & invalidate session
apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token) {
        const db = await getDb();
        await db.query('DELETE FROM app_sessions WHERE token = $1', [token]);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Update authenticated user's profile
apiRouter.put('/auth/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.authUser!;
    const { touristProfile, providerProfile } = req.body ?? {};
    const db = await getDb();

    if (touristProfile !== undefined) {
      if (typeof touristProfile !== 'object' || touristProfile === null) {
        res.status(400).json({ error: 'Invalid touristProfile payload' });
        return;
      }
      const mergedTourist = {
        ...(user.touristProfile || {}),
        ...touristProfile
      };
      await db.query('UPDATE users SET tourist_profile = $1 WHERE id = $2', [
        JSON.stringify(mergedTourist),
        user.id
      ]);
    }

    if (providerProfile !== undefined) {
      if (typeof providerProfile !== 'object' || providerProfile === null) {
        res.status(400).json({ error: 'Invalid providerProfile payload' });
        return;
      }
      const existingProviderProfile = user.providerProfile || {};
      const mergedProvider = {
        ...existingProviderProfile,
        ...providerProfile,
        // Never let non-admin overwrite providerId or verificationStatus
        providerId: existingProviderProfile.providerId,
        verificationStatus:
          user.role === 'admin' && VALID_VERIFICATION_STATUSES.has(providerProfile.verificationStatus)
            ? providerProfile.verificationStatus
            : existingProviderProfile.verificationStatus
      };
      await db.query('UPDATE users SET provider_profile = $1 WHERE id = $2', [
        JSON.stringify(mergedProvider),
        user.id
      ]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// --- PUBLIC CATALOG ENDPOINTS (Guest-Accessible) ---

apiRouter.get('/catalog', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const [providersRes, listingsRes, reviewsRes] = await Promise.all([
      db.query<any>('SELECT data FROM providers ORDER BY id ASC'),
      db.query<any>('SELECT data FROM listings ORDER BY id ASC'),
      db.query<any>('SELECT data FROM reviews ORDER BY id DESC')
    ]);

    res.json({
      providers: providersRes.rows.map((r) => r.data),
      listings: listingsRes.rows.map((r) => r.data),
      reviews: reviewsRes.rows.map((r) => r.data)
    });
  } catch (err: any) {
    console.error('Error fetching catalog:', err);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// Keep /state strictly scoped to public catalog data (no private leads/bookings/transactions/saved)
apiRouter.get('/state', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const [providersRes, listingsRes, reviewsRes] = await Promise.all([
      db.query<any>('SELECT data FROM providers ORDER BY id ASC'),
      db.query<any>('SELECT data FROM listings ORDER BY id ASC'),
      db.query<any>('SELECT data FROM reviews ORDER BY id DESC')
    ]);

    res.json({
      providers: providersRes.rows.map((r) => r.data),
      listings: listingsRes.rows.map((r) => r.data),
      reviews: reviewsRes.rows.map((r) => r.data)
    });
  } catch (err: any) {
    console.error('Error fetching state:', err);
    res.status(500).json({ error: 'Failed to fetch catalog state' });
  }
});

// --- USER ENTITY REST ENDPOINTS (Self or Admin only; GET /users removed) ---

apiRouter.get('/users/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const authUser = req.authUser!;
    if (authUser.id !== id && authUser.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: cannot access another user profile' });
      return;
    }

    const db = await getDb();
    const result = await db.query<any>(
      'SELECT id, email, phone, name, role, tourist_profile, provider_profile, created_at FROM users WHERE id = $1',
      [id]
    );
    if (!result.rows.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const row = result.rows[0];
    res.json({
      user: {
        id: row.id,
        email: row.email,
        phone: row.phone,
        name: row.name,
        role: row.role,
        touristProfile: row.tourist_profile,
        providerProfile: row.provider_profile,
        createdAt: row.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

apiRouter.put('/users/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const authUser = req.authUser!;
    if (authUser.id !== id && authUser.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: cannot modify another user profile' });
      return;
    }

    const { name, email, phone, touristProfile, providerProfile } = req.body ?? {};
    if (name !== undefined && !isNonEmptyString(name, 120)) {
      res.status(400).json({ error: 'Invalid name' });
      return;
    }
    if (email !== undefined && email !== null && (!isNonEmptyString(email, 150) || !isValidEmail(email))) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }
    if (!isOptionalString(phone, 40)) {
      res.status(400).json({ error: 'Invalid phone number' });
      return;
    }

    const db = await getDb();
    const existingRes = await db.query<any>('SELECT * FROM users WHERE id = $1', [id]);
    if (!existingRes.rows.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const existingRow = existingRes.rows[0];

    let nextTouristProfile = existingRow.tourist_profile;
    if (touristProfile !== undefined) {
      if (typeof touristProfile !== 'object' || touristProfile === null) {
        res.status(400).json({ error: 'Invalid touristProfile' });
        return;
      }
      nextTouristProfile = { ...(existingRow.tourist_profile || {}), ...touristProfile };
    }

    let nextProviderProfile = existingRow.provider_profile;
    if (providerProfile !== undefined) {
      if (typeof providerProfile !== 'object' || providerProfile === null) {
        res.status(400).json({ error: 'Invalid providerProfile' });
        return;
      }
      const existingPp = existingRow.provider_profile || {};
      nextProviderProfile = {
        ...existingPp,
        ...providerProfile,
        providerId: existingPp.providerId,
        verificationStatus:
          authUser.role === 'admin' && VALID_VERIFICATION_STATUSES.has(providerProfile.verificationStatus)
            ? providerProfile.verificationStatus
            : existingPp.verificationStatus
      };
    }

    await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           tourist_profile = $4,
           provider_profile = $5
       WHERE id = $6`,
      [
        name ? name.trim() : null,
        email ? email.trim().toLowerCase() : null,
        phone !== undefined ? (phone ? String(phone).trim() : null) : null,
        nextTouristProfile ? JSON.stringify(nextTouristProfile) : null,
        nextProviderProfile ? JSON.stringify(nextProviderProfile) : null,
        id
      ]
    );

    const userRes = await db.query<any>(
      'SELECT id, email, phone, name, role, tourist_profile, provider_profile, created_at FROM users WHERE id = $1',
      [id]
    );
    const row = userRes.rows[0];
    res.json({
      success: true,
      user: {
        id: row.id,
        email: row.email,
        phone: row.phone,
        name: row.name,
        role: row.role,
        touristProfile: row.tourist_profile,
        providerProfile: row.provider_profile,
        createdAt: row.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// --- PROVIDER ENTITY REST ENDPOINTS ---

apiRouter.get('/providers', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query<any>('SELECT data FROM providers ORDER BY id ASC');
    res.json({ providers: result.rows.map((r) => r.data) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

apiRouter.get('/providers/:id', async (req: Request, res: Response) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid provider ID' });
      return;
    }
    const db = await getDb();
    const result = await db.query<any>('SELECT data FROM providers WHERE id = $1', [id]);
    if (!result.rows.length) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
    res.json({ provider: result.rows[0].data });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

apiRouter.post(
  '/providers',
  requireAuth,
  requireRole('provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const authUser = req.authUser!;
      const body = req.body ?? {};

      if (!isNonEmptyString(body.name, 140)) {
        res.status(400).json({ error: 'Provider name is required (max 140 characters)' });
        return;
      }
      if (!VALID_CATEGORIES.has(body.category)) {
        res.status(400).json({ error: 'Valid category is required' });
        return;
      }
      if (!isNonEmptyString(body.location, 120) || !isNonEmptyString(body.region, 140)) {
        res.status(400).json({ error: 'Location and region are required' });
        return;
      }

      if (authUser.role === 'provider' && getUserProviderId(authUser)) {
        res.status(409).json({ error: 'Provider profile already exists for this account' });
        return;
      }

      const db = await getDb();
      const nextIdRes = await db.query<any>(
        'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM providers'
      );
      const id = Number(nextIdRes.rows[0]?.next_id || 1);

      const isAdmin = authUser.role === 'admin';
      const verified = isAdmin ? Boolean(body.verified) : false;
      const verificationStatus = verified ? 'tanexpo_verified' : 'application_submitted';

      const provider = {
        id,
        category: body.category,
        name: body.name.trim(),
        tagline: isNonEmptyString(body.tagline, 200)
          ? body.tagline.trim()
          : `${body.region.trim()} Tour Operator`,
        location: body.location.trim(),
        region: body.region.trim(),
        rating: 5.0,
        reviewsCount: 0,
        tripsCompleted: 0,
        verified,
        talaLicense: isNonEmptyString(body.talaLicense, 80)
          ? body.talaLicense.trim()
          : 'TALA-PENDING-REVIEW',
        languages: Array.isArray(body.languages)
          ? body.languages.filter((l: unknown) => typeof l === 'string').slice(0, 10)
          : ['English', 'Swahili'],
        about: isNonEmptyString(body.about, 2500) ? body.about.trim() : '',
        phone: isNonEmptyString(body.phone, 40) ? body.phone.trim() : '',
        email: isNonEmptyString(body.email, 140) ? body.email.trim() : '',
        establishedYear: Number(body.establishedYear) || new Date().getFullYear(),
        fleetInfo: isNonEmptyString(body.fleetInfo, 400) ? body.fleetInfo.trim() : undefined,
        badges: verified ? ['TALA Licensed', 'Verified Operator'] : ['Newly Registered', 'Verification Pending'],
        officeAddress: isNonEmptyString(body.officeAddress, 200)
          ? body.officeAddress.trim()
          : `${body.location.trim()}, Tanzania`
      };

      await db.query(
        `INSERT INTO providers (id, category, name, owner_user_id, verified, verification_status, data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          provider.category,
          provider.name,
          authUser.role === 'provider' ? authUser.id : null,
          verified,
          verificationStatus,
          JSON.stringify(provider)
        ]
      );

      res.status(201).json({ success: true, provider });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create provider' });
    }
  }
);

async function handleUpdateProvider(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid provider ID' });
      return;
    }

    const authUser = req.authUser!;
    const db = await getDb();
    const existingRes = await db.query<any>(
      'SELECT id, owner_user_id, verified, verification_status, data FROM providers WHERE id = $1',
      [id]
    );
    if (!existingRes.rows.length) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    const row = existingRes.rows[0];
    const userProviderId = getUserProviderId(authUser);
    const isOwner =
      row.owner_user_id === authUser.id || (!row.owner_user_id && userProviderId === id);

    if (authUser.role !== 'admin' && !isOwner) {
      res.status(403).json({ error: 'Forbidden: you can only modify your own provider profile' });
      return;
    }

    const body = req.body ?? {};
    const existing = row.data;

    if (body.name !== undefined && !isNonEmptyString(body.name, 140)) {
      res.status(400).json({ error: 'Invalid provider name' });
      return;
    }
    if (body.category !== undefined && !VALID_CATEGORIES.has(body.category)) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    // Only admin can modify verified status or reputation metrics
    const nextVerified = authUser.role === 'admin' && body.verified !== undefined
      ? Boolean(body.verified)
      : Boolean(existing.verified);
    const nextVerificationStatus = nextVerified
      ? 'tanexpo_verified'
      : row.verification_status || 'application_submitted';

    const updatedProvider = {
      ...existing,
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(isNonEmptyString(body.tagline, 200) ? { tagline: body.tagline.trim() } : {}),
      ...(isNonEmptyString(body.location, 120) ? { location: body.location.trim() } : {}),
      ...(isNonEmptyString(body.region, 140) ? { region: body.region.trim() } : {}),
      ...(isNonEmptyString(body.talaLicense, 80) ? { talaLicense: body.talaLicense.trim() } : {}),
      ...(isNonEmptyString(body.phone, 40) ? { phone: body.phone.trim() } : {}),
      ...(isNonEmptyString(body.email, 140) ? { email: body.email.trim() } : {}),
      ...(body.about !== undefined && typeof body.about === 'string' && body.about.length <= 2500
        ? { about: body.about.trim() }
        : {}),
      ...(body.fleetInfo !== undefined && typeof body.fleetInfo === 'string' && body.fleetInfo.length <= 400
        ? { fleetInfo: body.fleetInfo.trim() }
        : {}),
      ...(isNonEmptyString(body.officeAddress, 200) ? { officeAddress: body.officeAddress.trim() } : {}),
      ...(Array.isArray(body.languages)
        ? { languages: body.languages.filter((l: unknown) => typeof l === 'string').slice(0, 10) }
        : {}),
      id,
      verified: nextVerified,
      rating: existing.rating,
      reviewsCount: existing.reviewsCount,
      tripsCompleted: existing.tripsCompleted
    };

    await db.query(
      'UPDATE providers SET data = $1, name = $2, category = $3, verified = $4, verification_status = $5 WHERE id = $6',
      [
        JSON.stringify(updatedProvider),
        updatedProvider.name,
        updatedProvider.category,
        nextVerified,
        nextVerificationStatus,
        id
      ]
    );

    res.json({ success: true, provider: updatedProvider });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update provider' });
  }
}

apiRouter.put(
  '/providers/:id',
  requireAuth,
  requireRole('provider', 'admin'),
  handleUpdateProvider
);
apiRouter.post(
  '/providers/:id',
  requireAuth,
  requireRole('provider', 'admin'),
  handleUpdateProvider
);

// Admin-only verification endpoint
apiRouter.put(
  '/admin/providers/:id/verify',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid provider ID' });
        return;
      }
      const { verified, verificationStatus } = req.body ?? {};
      if (typeof verified !== 'boolean') {
        res.status(400).json({ error: 'verified boolean is required' });
        return;
      }
      const nextStatus = VALID_VERIFICATION_STATUSES.has(verificationStatus)
        ? verificationStatus
        : verified
        ? 'tanexpo_verified'
        : 'under_review';

      const db = await getDb();
      const provRes = await db.query<any>(
        'SELECT owner_user_id, data FROM providers WHERE id = $1',
        [id]
      );
      if (!provRes.rows.length) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      const row = provRes.rows[0];
      const updated = {
        ...row.data,
        verified,
        badges: verified
          ? Array.from(new Set([...(row.data.badges || []).filter((b: string) => b !== 'Verification Pending'), 'Verified Operator']))
          : (row.data.badges || []).filter((b: string) => b !== 'Verified Operator')
      };

      await db.query(
        'UPDATE providers SET verified = $1, verification_status = $2, data = $3 WHERE id = $4',
        [verified, nextStatus, JSON.stringify(updated), id]
      );

      if (row.owner_user_id) {
        const userRes = await db.query<any>('SELECT provider_profile FROM users WHERE id = $1', [
          row.owner_user_id
        ]);
        if (userRes.rows.length && userRes.rows[0].provider_profile) {
          const updatedProfile = {
            ...userRes.rows[0].provider_profile,
            verificationStatus: nextStatus
          };
          await db.query('UPDATE users SET provider_profile = $1 WHERE id = $2', [
            JSON.stringify(updatedProfile),
            row.owner_user_id
          ]);
        }
      }

      res.json({ success: true, provider: updated, verificationStatus: nextStatus });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update verification status' });
    }
  }
);

apiRouter.delete(
  '/providers/:id',
  requireAuth,
  requireRole('provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid provider ID' });
        return;
      }
      const authUser = req.authUser!;
      const db = await getDb();
      const existingRes = await db.query<any>(
        'SELECT owner_user_id FROM providers WHERE id = $1',
        [id]
      );
      if (!existingRes.rows.length) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }
      const row = existingRes.rows[0];
      const userProviderId = getUserProviderId(authUser);
      const isOwner =
        row.owner_user_id === authUser.id || (!row.owner_user_id && userProviderId === id);

      if (authUser.role !== 'admin' && !isOwner) {
        res.status(403).json({ error: 'Forbidden: cannot delete another provider' });
        return;
      }

      await db.query('DELETE FROM providers WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete provider' });
    }
  }
);

// --- LISTING ENTITY REST ENDPOINTS ---

apiRouter.get('/listings', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query<any>('SELECT data FROM listings ORDER BY id ASC');
    res.json({ listings: result.rows.map((r) => r.data) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

apiRouter.post(
  '/listings',
  requireAuth,
  requireRole('provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const authUser = req.authUser!;
      const body = req.body ?? {};

      if (!isNonEmptyString(body.title, 200)) {
        res.status(400).json({ error: 'Listing title is required (max 200 characters)' });
        return;
      }
      const priceTZS = Number(body.priceTZS);
      if (!Number.isFinite(priceTZS) || priceTZS <= 0 || priceTZS > 1_000_000_000) {
        res.status(400).json({ error: 'priceTZS must be a positive number' });
        return;
      }
      if (!isNonEmptyString(body.duration, 100)) {
        res.status(400).json({ error: 'Listing duration is required' });
        return;
      }
      if (!VALID_CATEGORIES.has(body.category)) {
        res.status(400).json({ error: 'Valid category is required' });
        return;
      }
      if (!isOptionalString(body.description, 4000)) {
        res.status(400).json({ error: 'Description is too long' });
        return;
      }

      const db = await getDb();
      const userProviderId = getUserProviderId(authUser);

      // Update existing listing if id provided (never ON CONFLICT DO UPDATE)
      if (body.id !== undefined && body.id !== null) {
        const existingId = parsePositiveInt(body.id);
        if (!existingId) {
          res.status(400).json({ error: 'Invalid listing ID' });
          return;
        }
        const existingRes = await db.query<any>(
          'SELECT id, provider_id, data FROM listings WHERE id = $1',
          [existingId]
        );
        if (!existingRes.rows.length) {
          res.status(404).json({ error: 'Listing not found' });
          return;
        }
        const existingRow = existingRes.rows[0];
        if (authUser.role !== 'admin' && existingRow.provider_id !== userProviderId) {
          res.status(403).json({ error: 'Forbidden: you can only modify your own listings' });
          return;
        }

        const updatedListing = {
          ...existingRow.data,
          id: existingId,
          providerId: existingRow.provider_id,
          title: body.title.trim(),
          priceTZS: Math.round(priceTZS),
          duration: body.duration.trim(),
          unit: isNonEmptyString(body.unit, 50) ? body.unit.trim() : existingRow.data.unit || 'per person',
          description: typeof body.description === 'string' ? body.description.trim() : existingRow.data.description || '',
          inclusions: Array.isArray(body.inclusions)
            ? body.inclusions.filter((i: unknown) => typeof i === 'string').slice(0, 30)
            : existingRow.data.inclusions || [],
          exclusions: Array.isArray(body.exclusions)
            ? body.exclusions.filter((i: unknown) => typeof i === 'string').slice(0, 30)
            : existingRow.data.exclusions,
          category: body.category,
          active: body.active !== undefined ? Boolean(body.active) : existingRow.data.active ?? true,
          maxGroupSize: body.maxGroupSize ? Math.max(1, Math.min(100, Number(body.maxGroupSize))) : existingRow.data.maxGroupSize
        };

        await db.query(
          'UPDATE listings SET data = $1, title = $2, category = $3 WHERE id = $4',
          [JSON.stringify(updatedListing), updatedListing.title, updatedListing.category, existingId]
        );
        res.json({ success: true, listing: updatedListing });
        return;
      }

      // Create new listing with server-generated ID
      const targetProviderId =
        authUser.role === 'admin' ? parsePositiveInt(body.providerId) : userProviderId;
      if (!targetProviderId) {
        res.status(400).json({ error: 'Valid provider profile is required to create a listing' });
        return;
      }

      const provExists = await db.query<any>('SELECT id FROM providers WHERE id = $1', [
        targetProviderId
      ]);
      if (!provExists.rows.length) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      const nextIdRes = await db.query<any>(
        'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM listings'
      );
      const id = Number(nextIdRes.rows[0]?.next_id || 1);

      const newListing = {
        id,
        providerId: targetProviderId,
        title: body.title.trim(),
        priceTZS: Math.round(priceTZS),
        duration: body.duration.trim(),
        unit: isNonEmptyString(body.unit, 50) ? body.unit.trim() : 'per person',
        description: typeof body.description === 'string' ? body.description.trim() : '',
        inclusions: Array.isArray(body.inclusions)
          ? body.inclusions.filter((i: unknown) => typeof i === 'string').slice(0, 30)
          : [],
        exclusions: Array.isArray(body.exclusions)
          ? body.exclusions.filter((i: unknown) => typeof i === 'string').slice(0, 30)
          : undefined,
        category: body.category,
        active: body.active !== undefined ? Boolean(body.active) : true,
        maxGroupSize: body.maxGroupSize ? Math.max(1, Math.min(100, Number(body.maxGroupSize))) : undefined
      };

      await db.query(
        'INSERT INTO listings (id, provider_id, category, title, data) VALUES ($1, $2, $3, $4, $5)',
        [id, targetProviderId, newListing.category, newListing.title, JSON.stringify(newListing)]
      );

      res.status(201).json({ success: true, listing: newListing });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save listing' });
    }
  }
);

apiRouter.delete(
  '/listings/:id',
  requireAuth,
  requireRole('provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid listing ID' });
        return;
      }
      const authUser = req.authUser!;
      const db = await getDb();
      const existingRes = await db.query<any>(
        'SELECT provider_id FROM listings WHERE id = $1',
        [id]
      );
      if (!existingRes.rows.length) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
      if (
        authUser.role !== 'admin' &&
        existingRes.rows[0].provider_id !== getUserProviderId(authUser)
      ) {
        res.status(403).json({ error: 'Forbidden: you can only delete your own listings' });
        return;
      }

      await db.query('DELETE FROM listings WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete listing' });
    }
  }
);

// --- LEAD ENTITY REST ENDPOINTS ---

apiRouter.get('/leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const db = await getDb();

    if (authUser.role === 'admin') {
      const result = await db.query<any>('SELECT data FROM leads ORDER BY id DESC');
      res.json({ leads: result.rows.map((r) => r.data) });
      return;
    }

    if (authUser.role === 'provider') {
      const providerId = getUserProviderId(authUser);
      if (!providerId) {
        res.json({ leads: [] });
        return;
      }
      const result = await db.query<any>(
        'SELECT data FROM leads WHERE provider_id = $1 ORDER BY id DESC',
        [providerId]
      );
      res.json({ leads: result.rows.map((r) => r.data) });
      return;
    }

    // Tourist: strictly own leads
    const result = await db.query<any>(
      'SELECT data FROM leads WHERE tourist_user_id = $1 ORDER BY id DESC',
      [authUser.id]
    );
    res.json({ leads: result.rows.map((r) => r.data) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

apiRouter.get('/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid lead ID' });
      return;
    }
    const authUser = req.authUser!;
    const db = await getDb();
    const result = await db.query<any>(
      'SELECT provider_id, tourist_user_id, data FROM leads WHERE id = $1',
      [id]
    );
    if (!result.rows.length) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    const row = result.rows[0];
    const isAllowed =
      authUser.role === 'admin' ||
      (authUser.role === 'provider' && row.provider_id === getUserProviderId(authUser)) ||
      (authUser.role === 'tourist' && row.tourist_user_id === authUser.id);

    if (!isAllowed) {
      res.status(403).json({ error: 'Forbidden: cannot access this lead' });
      return;
    }

    res.json({ lead: row.data });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

apiRouter.post(
  '/leads',
  requireAuth,
  requireRole('tourist', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const authUser = req.authUser!;
      const body = req.body ?? {};

      const listingId = parsePositiveInt(body.listingId);
      if (!listingId) {
        res.status(400).json({ error: 'Valid listingId is required' });
        return;
      }
      if (!isNonEmptyString(body.touristName, 120)) {
        res.status(400).json({ error: 'touristName is required' });
        return;
      }
      if (!isNonEmptyString(body.touristContact, 120)) {
        res.status(400).json({ error: 'touristContact is required' });
        return;
      }
      if (!isNonEmptyString(body.date, 40)) {
        res.status(400).json({ error: 'Preferred travel date is required' });
        return;
      }
      const groupSize = parsePositiveInt(body.groupSize);
      if (!groupSize || groupSize > 100) {
        res.status(400).json({ error: 'groupSize must be an integer between 1 and 100' });
        return;
      }
      if (!isOptionalString(body.budgetTZS, 80) || !isOptionalString(body.message, 2000)) {
        res.status(400).json({ error: 'Budget or message exceeds maximum length' });
        return;
      }

      const db = await getDb();
      const listingRes = await db.query<any>(
        'SELECT id, provider_id, title, data FROM listings WHERE id = $1',
        [listingId]
      );
      if (!listingRes.rows.length) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
      const listingRow = listingRes.rows[0];

      const provRes = await db.query<any>('SELECT id, name FROM providers WHERE id = $1', [
        listingRow.provider_id
      ]);
      if (!provRes.rows.length) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      const nextIdRes = await db.query<any>('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM leads');
      const id = Number(nextIdRes.rows[0]?.next_id || 1);
      const nowIso = new Date().toISOString();

      const initialMessages =
        typeof body.message === 'string' && body.message.trim()
          ? [
              {
                id: `msg-${Date.now()}`,
                sender: 'tourist',
                text: body.message.trim(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]
          : [];

      const newLead = {
        id,
        providerId: listingRow.provider_id,
        providerName: provRes.rows[0].name,
        listingId: listingRow.id,
        listingTitle: listingRow.title,
        touristName: body.touristName.trim(),
        touristContact: body.touristContact.trim(),
        date: body.date.trim(),
        groupSize,
        ...(typeof body.budgetTZS === 'string' && body.budgetTZS.trim()
          ? { budgetTZS: body.budgetTZS.trim() }
          : {}),
        ...(typeof body.message === 'string' && body.message.trim()
          ? { message: body.message.trim() }
          : {}),
        status: 'New',
        quote: null,
        createdAt: nowIso,
        messages: initialMessages
      };

      await db.query(
        'INSERT INTO leads (id, provider_id, tourist_user_id, status, data) VALUES ($1, $2, $3, $4, $5)',
        [id, newLead.providerId, authUser.id, newLead.status, JSON.stringify(newLead)]
      );

      res.status(201).json({ success: true, lead: newLead });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }
);

apiRouter.put('/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid lead ID' });
      return;
    }

    const authUser = req.authUser!;
    const db = await getDb();
    const existingRes = await db.query<any>(
      'SELECT provider_id, tourist_user_id, status, data FROM leads WHERE id = $1',
      [id]
    );
    if (!existingRes.rows.length) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const row = existingRes.rows[0];
    const isAdmin = authUser.role === 'admin';
    const isProviderOwner =
      authUser.role === 'provider' && row.provider_id === getUserProviderId(authUser);
    const isTouristOwner =
      authUser.role === 'tourist' && row.tourist_user_id === authUser.id;

    if (!isAdmin && !isProviderOwner && !isTouristOwner) {
      res.status(403).json({ error: 'Forbidden: you do not have access to this lead' });
      return;
    }

    const body = req.body ?? {};
    const existingData = row.data;
    const nowIso = new Date().toISOString();

    let nextStatus = existingData.status;
    let nextQuote = existingData.quote ?? null;
    let nextMessages = Array.isArray(existingData.messages) ? [...existingData.messages] : [];

    // Handle message append
    if (body.newMessage && typeof body.newMessage === 'string' && body.newMessage.trim()) {
      if (body.newMessage.trim().length > 2000) {
        res.status(400).json({ error: 'Message exceeds 2000 characters' });
        return;
      }
      nextMessages.push({
        id: `msg-${Date.now()}`,
        sender: isProviderOwner ? 'provider' : 'tourist',
        text: body.newMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else if (Array.isArray(body.messages) && body.messages.length > nextMessages.length) {
      // Compatibility with full messages array sent by UI: only accept the newly appended message(s), forced to caller role
      const appended = body.messages.slice(nextMessages.length);
      for (const m of appended) {
        if (m && typeof m.text === 'string' && m.text.trim() && m.text.trim().length <= 2000) {
          nextMessages.push({
            id: typeof m.id === 'string' ? m.id : `msg-${Date.now()}`,
            sender: isProviderOwner ? 'provider' : isAdmin && m.sender === 'provider' ? 'provider' : 'tourist',
            text: m.text.trim(),
            timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    }

    if (isTouristOwner && !isAdmin) {
      // Tourists can only decline a quote ('Lost')
      if (body.status !== undefined) {
        if (body.status !== 'Lost') {
          res.status(403).json({ error: 'Tourists can only decline a quote' });
          return;
        }
        nextStatus = 'Lost';
      }
      if (body.quote !== undefined) {
        res.status(403).json({ error: 'Tourists cannot modify quotes' });
        return;
      }
    } else {
      // Provider owner or admin
      if (body.status !== undefined) {
        if (!VALID_LEAD_STATUSES.has(body.status)) {
          res.status(400).json({ error: 'Invalid lead status' });
          return;
        }
        nextStatus = body.status;
      }
      if (body.quote !== undefined && body.quote !== null) {
        const q = body.quote;
        const basePrice = Number(q.basePrice);
        const discount = Number(q.discount || 0);
        if (!Number.isFinite(basePrice) || basePrice <= 0 || !Number.isFinite(discount) || discount < 0) {
          res.status(400).json({ error: 'Invalid quote pricing' });
          return;
        }
        const extras = Array.isArray(q.extras)
          ? q.extras
              .filter((ex: any) => ex && isNonEmptyString(ex.title, 120) && Number.isFinite(Number(ex.amount)) && Number(ex.amount) >= 0)
              .slice(0, 20)
              .map((ex: any, idx: number) => ({
                id: typeof ex.id === 'string' ? ex.id : `ex-${idx}`,
                title: ex.title.trim(),
                amount: Math.round(Number(ex.amount))
              }))
          : [];
        const extrasSum = extras.reduce((s: number, e: any) => s + e.amount, 0);
        const total = Math.max(0, Math.round(basePrice) + extrasSum - Math.round(discount));
        if (!isNonEmptyString(q.validUntil, 40)) {
          res.status(400).json({ error: 'Quote validUntil is required' });
          return;
        }
        nextQuote = {
          basePrice: Math.round(basePrice),
          extras,
          discount: Math.round(discount),
          total,
          validUntil: q.validUntil.trim(),
          ...(typeof q.note === 'string' && q.note.trim() ? { note: q.note.trim().slice(0, 1000) } : {}),
          sentAt: nowIso
        };
      }
    }

    const updatedLead = {
      ...existingData,
      status: nextStatus,
      quote: nextQuote,
      messages: nextMessages,
      lastUpdated: nowIso
    };

    await db.query('UPDATE leads SET data = $1, status = $2 WHERE id = $3', [
      JSON.stringify(updatedLead),
      nextStatus,
      id
    ]);

    res.json({ success: true, lead: updatedLead });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// --- BOOKING ENTITY REST ENDPOINTS ---

apiRouter.get('/bookings', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const db = await getDb();

    if (authUser.role === 'admin') {
      const { providerId } = req.query;
      if (providerId !== undefined) {
        const pid = parsePositiveInt(providerId);
        if (!pid) {
          res.status(400).json({ error: 'Invalid providerId query parameter' });
          return;
        }
        const result = await db.query<any>(
          'SELECT data FROM bookings WHERE provider_id = $1 ORDER BY id DESC',
          [pid]
        );
        res.json({ bookings: result.rows.map((r) => r.data) });
        return;
      }
      const result = await db.query<any>('SELECT data FROM bookings ORDER BY id DESC');
      res.json({ bookings: result.rows.map((r) => r.data) });
      return;
    }

    if (authUser.role === 'provider') {
      const providerId = getUserProviderId(authUser);
      if (!providerId) {
        res.json({ bookings: [] });
        return;
      }
      if (req.query.providerId !== undefined && Number(req.query.providerId) !== providerId) {
        res.status(403).json({ error: 'Forbidden: cannot query another provider bookings' });
        return;
      }
      const result = await db.query<any>(
        'SELECT data FROM bookings WHERE provider_id = $1 ORDER BY id DESC',
        [providerId]
      );
      res.json({ bookings: result.rows.map((r) => r.data) });
      return;
    }

    // Tourist: strictly own bookings
    const result = await db.query<any>(
      'SELECT data FROM bookings WHERE tourist_user_id = $1 ORDER BY id DESC',
      [authUser.id]
    );
    res.json({ bookings: result.rows.map((r) => r.data) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

apiRouter.get('/bookings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid booking ID' });
      return;
    }
    const authUser = req.authUser!;
    const db = await getDb();
    const result = await db.query<any>(
      'SELECT provider_id, tourist_user_id, data FROM bookings WHERE id = $1',
      [id]
    );
    if (!result.rows.length) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const row = result.rows[0];
    const isAllowed =
      authUser.role === 'admin' ||
      (authUser.role === 'provider' && row.provider_id === getUserProviderId(authUser)) ||
      (authUser.role === 'tourist' && row.tourist_user_id === authUser.id);

    if (!isAllowed) {
      res.status(403).json({ error: 'Forbidden: cannot access this booking' });
      return;
    }
    res.json({ booking: row.data });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

apiRouter.post(
  '/bookings',
  requireAuth,
  requireRole('tourist', 'provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const authUser = req.authUser!;
      const body = req.body ?? {};
      const db = await getDb();

      let leadRow: any = null;
      if (body.leadId !== undefined && body.leadId !== null) {
        const leadId = parsePositiveInt(body.leadId);
        if (!leadId) {
          res.status(400).json({ error: 'Invalid leadId' });
          return;
        }
        const leadRes = await db.query<any>(
          'SELECT id, provider_id, tourist_user_id, data FROM leads WHERE id = $1',
          [leadId]
        );
        if (!leadRes.rows.length) {
          res.status(404).json({ error: 'Lead not found' });
          return;
        }
        leadRow = leadRes.rows[0];

        const isAllowedLead =
          authUser.role === 'admin' ||
          (authUser.role === 'provider' && leadRow.provider_id === getUserProviderId(authUser)) ||
          (authUser.role === 'tourist' && leadRow.tourist_user_id === authUser.id);

        if (!isAllowedLead) {
          res.status(403).json({ error: 'Forbidden: cannot create booking for another user lead' });
          return;
        }
      }

      const listingId = leadRow ? parsePositiveInt(leadRow.data?.listingId) : parsePositiveInt(body.listingId);
      if (!listingId) {
        res.status(400).json({ error: 'Valid listingId (or leadId with valid listing) is required' });
        return;
      }

      const listingRes = await db.query<any>(
        'SELECT id, provider_id, title, data FROM listings WHERE id = $1',
        [listingId]
      );
      if (!listingRes.rows.length) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
      const listingRow = listingRes.rows[0];

      if (
        !leadRow &&
        authUser.role === 'provider' &&
        listingRow.provider_id !== getUserProviderId(authUser)
      ) {
        res.status(403).json({ error: 'Forbidden: cannot create booking for another provider listing' });
        return;
      }

      const provRes = await db.query<any>('SELECT id, name FROM providers WHERE id = $1', [
        listingRow.provider_id
      ]);
      if (!provRes.rows.length) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      const groupSize = leadRow
        ? parsePositiveInt(leadRow.data?.groupSize) || 1
        : parsePositiveInt(body.groupSize) || 1;
      if (groupSize > 100) {
        res.status(400).json({ error: 'groupSize must be between 1 and 100' });
        return;
      }

      const paymentMethod = body.paymentMethod
        ? String(body.paymentMethod)
        : 'M-Pesa';
      if (!VALID_PAYMENT_RAILS.has(paymentMethod)) {
        res.status(400).json({ error: 'Invalid paymentMethod' });
        return;
      }

      const date = leadRow?.data?.date || body.date;
      if (!isNonEmptyString(date, 40)) {
        res.status(400).json({ error: 'Booking date is required' });
        return;
      }

      const touristName = leadRow?.data?.touristName || body.touristName || authUser.name;
      const touristContact =
        leadRow?.data?.touristContact || body.touristContact || authUser.email || authUser.phone;
      if (!isNonEmptyString(touristName, 120) || !isNonEmptyString(touristContact, 120)) {
        res.status(400).json({ error: 'touristName and touristContact are required' });
        return;
      }

      // Compute pricing, commission, and net payout strictly on the server (ignore client amounts)
      const commissionRate = getCommissionRate();
      const listingBaseTotal = Math.round(Number(listingRow.data.priceTZS) * groupSize);
      const serverQuoteTotal =
        leadRow?.data?.quote && typeof leadRow.data.quote.total === 'number' && leadRow.data.quote.total > 0
          ? Math.round(leadRow.data.quote.total)
          : null;
      const amountTZS = serverQuoteTotal ?? listingBaseTotal;
      const commissionTZS = Math.round(amountTZS * commissionRate);
      const netPayoutTZS = amountTZS - commissionTZS;

      const nextIdRes = await db.query<any>(
        'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM bookings'
      );
      const bookingId = Number(nextIdRes.rows[0]?.next_id || 1);
      const refCode = `TNX-${new Date().getFullYear().toString().slice(-2)}-${crypto
        .randomInt(1000, 9999)}`;

      const touristUserId = leadRow?.tourist_user_id || (authUser.role === 'tourist' ? authUser.id : null);

      const newBooking = {
        id: bookingId,
        ...(leadRow ? { leadId: leadRow.id } : {}),
        providerId: listingRow.provider_id,
        providerName: provRes.rows[0].name,
        touristName: String(touristName).trim(),
        touristContact: String(touristContact).trim(),
        listingTitle: listingRow.title,
        date: String(date).trim(),
        amountTZS,
        commissionTZS,
        netPayoutTZS,
        status: 'Upcoming' as const,
        referenceCode: refCode,
        createdAt: new Date().toISOString().split('T')[0],
        paymentMethod,
        assignedDriver: 'Assigned on departure (TALA guide)',
        vehicleReg: 'TZS 4x4 Land Cruiser',
        ...(isNonEmptyString(body.specialRequests, 1000)
          ? { specialRequests: body.specialRequests.trim() }
          : leadRow?.data?.message
          ? { specialRequests: leadRow.data.message }
          : {})
      };

      await db.query(
        `INSERT INTO bookings (id, provider_id, tourist_user_id, listing_id, status, data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          bookingId,
          newBooking.providerId,
          touristUserId,
          listingId,
          newBooking.status,
          JSON.stringify(newBooking)
        ]
      );

      if (leadRow) {
        const ld = { ...leadRow.data, status: 'Booked', lastUpdated: new Date().toISOString() };
        await db.query('UPDATE leads SET status = $1, data = $2 WHERE id = $3', [
          'Booked',
          JSON.stringify(ld),
          leadRow.id
        ]);
      }

      res.status(201).json({ success: true, booking: newBooking });
    } catch (err: any) {
      console.error('Error in POST /api/bookings:', err);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

apiRouter.put('/bookings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid booking ID' });
      return;
    }

    const authUser = req.authUser!;
    const db = await getDb();
    const existingRes = await db.query<any>(
      'SELECT provider_id, tourist_user_id, status, data FROM bookings WHERE id = $1',
      [id]
    );
    if (!existingRes.rows.length) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const row = existingRes.rows[0];
    const isAdmin = authUser.role === 'admin';
    const isProviderOwner =
      authUser.role === 'provider' && row.provider_id === getUserProviderId(authUser);
    const isTouristOwner =
      authUser.role === 'tourist' && row.tourist_user_id === authUser.id;

    if (!isAdmin && !isProviderOwner && !isTouristOwner) {
      res.status(403).json({ error: 'Forbidden: cannot modify another user booking' });
      return;
    }

    const body = req.body ?? {};
    if (body.status !== undefined && !VALID_BOOKING_STATUSES.has(body.status)) {
      res.status(400).json({ error: 'Invalid booking status' });
      return;
    }

    if (isTouristOwner && !isAdmin) {
      if (body.status && body.status !== 'Cancelled') {
        res.status(403).json({ error: 'Tourists can only cancel their own bookings' });
        return;
      }
      if (body.assignedDriver !== undefined || body.vehicleReg !== undefined) {
        res.status(403).json({ error: 'Tourists cannot modify driver or vehicle logistics' });
        return;
      }
    }

    const updatedBooking = {
      ...row.data,
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(isNonEmptyString(body.assignedDriver, 120)
        ? { assignedDriver: body.assignedDriver.trim() }
        : {}),
      ...(isNonEmptyString(body.vehicleReg, 120)
        ? { vehicleReg: body.vehicleReg.trim() }
        : {})
    };

    await db.query('UPDATE bookings SET status = $1, data = $2 WHERE id = $3', [
      updatedBooking.status,
      JSON.stringify(updatedBooking),
      id
    ]);

    res.json({ success: true, booking: updatedBooking });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// --- TRANSACTION ENTITY REST ENDPOINTS ---

apiRouter.get('/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const db = await getDb();

    if (authUser.role === 'admin') {
      const result = await db.query<any>(
        "SELECT data FROM transactions ORDER BY data->>'date' DESC NULLS LAST"
      );
      res.json({ transactions: result.rows.map((r) => r.data) });
      return;
    }

    if (authUser.role === 'provider') {
      const providerId = getUserProviderId(authUser);
      if (!providerId) {
        res.json({ transactions: [] });
        return;
      }
      const result = await db.query<any>(
        "SELECT data FROM transactions WHERE provider_id = $1 ORDER BY data->>'date' DESC NULLS LAST",
        [providerId]
      );
      res.json({ transactions: result.rows.map((r) => r.data) });
      return;
    }

    // Tourist: transactions for their own bookings only
    const result = await db.query<any>(
      `SELECT t.data
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       WHERE b.tourist_user_id = $1
       ORDER BY t.data->>'date' DESC NULLS LAST`,
      [authUser.id]
    );
    res.json({ transactions: result.rows.map((r) => r.data) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

apiRouter.post('/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const body = req.body ?? {};
    const bookingId = parsePositiveInt(body.bookingId);
    if (!bookingId) {
      res.status(400).json({ error: 'Valid bookingId is required' });
      return;
    }

    const paymentRail = body.paymentRail;
    if (!VALID_PAYMENT_RAILS.has(paymentRail)) {
      res.status(400).json({ error: 'Valid paymentRail is required' });
      return;
    }

    const db = await getDb();
    const bookingRes = await db.query<any>(
      'SELECT id, provider_id, tourist_user_id, data FROM bookings WHERE id = $1',
      [bookingId]
    );
    if (!bookingRes.rows.length) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const bookingRow = bookingRes.rows[0];

    const isAllowed =
      authUser.role === 'admin' ||
      (authUser.role === 'provider' && bookingRow.provider_id === getUserProviderId(authUser)) ||
      (authUser.role === 'tourist' && bookingRow.tourist_user_id === authUser.id);

    if (!isAllowed) {
      res.status(403).json({ error: 'Forbidden: cannot record transaction for another user booking' });
      return;
    }

    const existingTx = await db.query<any>(
      'SELECT id FROM transactions WHERE booking_id = $1',
      [bookingId]
    );
    if (existingTx.rows.length > 0) {
      res.status(409).json({ error: 'Transaction already recorded for this booking' });
      return;
    }

    // Derive all monetary figures strictly from the server-computed booking
    const bookingData = bookingRow.data;
    const txId = `TX-${crypto.randomInt(10000, 99999)}`;
    const tx = {
      id: txId,
      bookingId,
      providerId: bookingRow.provider_id,
      touristName: bookingData.touristName,
      grossTZS: bookingData.amountTZS,
      platformFeeTZS: bookingData.commissionTZS,
      netTZS: bookingData.netPayoutTZS,
      paymentRail,
      status: 'Paid' as const,
      payoutRef: `PAYOUT-${bookingData.referenceCode}`,
      date: new Date().toISOString().split('T')[0]
    };

    await db.query(
      'INSERT INTO transactions (id, booking_id, provider_id, data) VALUES ($1, $2, $3, $4)',
      [tx.id, tx.bookingId, tx.providerId, JSON.stringify(tx)]
    );

    res.status(201).json({ success: true, transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// --- REVIEW ENTITY REST ENDPOINTS ---

apiRouter.get('/reviews', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query<any>('SELECT data FROM reviews ORDER BY id DESC');
    res.json({ reviews: result.rows.map((r) => r.data) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

apiRouter.post(
  '/reviews',
  requireAuth,
  requireRole('tourist', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const authUser = req.authUser!;
      const body = req.body ?? {};

      const providerId = parsePositiveInt(body.providerId);
      if (!providerId) {
        res.status(400).json({ error: 'Valid providerId is required' });
        return;
      }

      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        return;
      }

      if (!isNonEmptyString(body.comment, 2000)) {
        res.status(400).json({ error: 'Review comment is required (max 2000 characters)' });
        return;
      }

      if (!isNonEmptyString(body.bookingRef, 60)) {
        res.status(400).json({ error: 'bookingRef is required to submit a verified review' });
        return;
      }

      const bookingRef = body.bookingRef.trim();
      const db = await getDb();

      // Match completed booking by bookingRef + providerId
      const bookingRes = await db.query<any>(
        `SELECT id, provider_id, tourist_user_id, status, data
         FROM bookings
         WHERE data->>'referenceCode' = $1`,
        [bookingRef]
      );
      if (!bookingRes.rows.length) {
        res.status(404).json({ error: 'Booking reference not found' });
        return;
      }

      const bookingRow = bookingRes.rows[0];
      if (bookingRow.provider_id !== providerId) {
        res.status(400).json({ error: 'Booking does not belong to the specified provider' });
        return;
      }

      if (authUser.role !== 'admin' && bookingRow.tourist_user_id !== authUser.id) {
        res.status(403).json({ error: 'Forbidden: you can only review your own completed bookings' });
        return;
      }

      if (bookingRow.data?.status !== 'Completed') {
        res.status(400).json({ error: 'Reviews are only allowed for Completed bookings' });
        return;
      }

      // Enforce one review per booking
      const existingRev = await db.query<any>(
        'SELECT id FROM reviews WHERE booking_id = $1 OR booking_ref = $2',
        [bookingRow.id, bookingRef]
      );
      if (existingRev.rows.length > 0 || bookingRow.data?.hasReview) {
        res.status(409).json({ error: 'A review has already been submitted for this booking' });
        return;
      }

      const nextIdRes = await db.query<any>(
        'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM reviews'
      );
      const reviewId = Number(nextIdRes.rows[0]?.next_id || 1);

      const newReview = {
        id: reviewId,
        providerId,
        touristName: isNonEmptyString(body.touristName, 120)
          ? body.touristName.trim()
          : authUser.name,
        rating,
        comment: body.comment.trim(),
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        tripPackage: bookingRow.data.listingTitle,
        bookingRef
      };

      await db.query(
        `INSERT INTO reviews (id, provider_id, tourist_user_id, booking_id, booking_ref, data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          reviewId,
          providerId,
          authUser.id,
          bookingRow.id,
          bookingRef,
          JSON.stringify(newReview)
        ]
      );

      // Mark booking as reviewed
      const updatedBookingData = { ...bookingRow.data, hasReview: true };
      await db.query('UPDATE bookings SET data = $1 WHERE id = $2', [
        JSON.stringify(updatedBookingData),
        bookingRow.id
      ]);

      // Recalculate provider rating & reviewsCount on server
      const allProvReviews = await db.query<any>(
        'SELECT data FROM reviews WHERE provider_id = $1',
        [providerId]
      );
      if (allProvReviews.rows.length > 0) {
        const ratings = allProvReviews.rows.map((r) => Number(r.data.rating) || 5);
        const avg = Number(
          (ratings.reduce((sum, val) => sum + val, 0) / ratings.length).toFixed(1)
        );
        const provRes = await db.query<any>('SELECT data FROM providers WHERE id = $1', [providerId]);
        if (provRes.rows.length) {
          const provData = {
            ...provRes.rows[0].data,
            rating: avg,
            reviewsCount: ratings.length
          };
          await db.query('UPDATE providers SET data = $1 WHERE id = $2', [
            JSON.stringify(provData),
            providerId
          ]);
        }
      }

      res.status(201).json({ success: true, review: newReview });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
);

apiRouter.post(
  '/reviews/:id/response',
  requireAuth,
  requireRole('provider', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid review ID' });
        return;
      }

      const { responseText } = req.body ?? {};
      if (!isNonEmptyString(responseText, 2000)) {
        res.status(400).json({ error: 'responseText is required (max 2000 characters)' });
        return;
      }

      const authUser = req.authUser!;
      const db = await getDb();
      const revRes = await db.query<any>(
        'SELECT provider_id, data FROM reviews WHERE id = $1',
        [id]
      );
      if (!revRes.rows.length) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      const row = revRes.rows[0];
      if (authUser.role !== 'admin' && row.provider_id !== getUserProviderId(authUser)) {
        res.status(403).json({ error: 'Forbidden: you can only respond to reviews on your own profile' });
        return;
      }

      const updatedReview = { ...row.data, providerResponse: responseText.trim() };
      await db.query('UPDATE reviews SET data = $1 WHERE id = $2', [
        JSON.stringify(updatedReview),
        id
      ]);

      res.json({ success: true, review: updatedReview });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to respond to review' });
    }
  }
);

// --- SAVED PROVIDERS ENDPOINTS ---

apiRouter.get('/saved', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const db = await getDb();
    const result = await db.query<any>(
      'SELECT provider_id FROM saved_providers WHERE user_id = $1',
      [authUser.id]
    );
    res.json({ savedProviderIds: result.rows.map((r) => Number(r.provider_id)) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch saved providers' });
  }
});

apiRouter.post('/saved', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const providerId = parsePositiveInt(req.body?.providerId);
    if (!providerId) {
      res.status(400).json({ error: 'Valid providerId is required' });
      return;
    }

    const db = await getDb();
    const provCheck = await db.query<any>('SELECT id FROM providers WHERE id = $1', [providerId]);
    if (!provCheck.rows.length) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    const existing = await db.query<any>(
      'SELECT provider_id FROM saved_providers WHERE user_id = $1 AND provider_id = $2',
      [authUser.id, providerId]
    );

    let isSaved = false;
    if (existing.rows.length > 0) {
      await db.query('DELETE FROM saved_providers WHERE user_id = $1 AND provider_id = $2', [
        authUser.id,
        providerId
      ]);
      isSaved = false;
    } else {
      await db.query('INSERT INTO saved_providers (user_id, provider_id) VALUES ($1, $2)', [
        authUser.id,
        providerId
      ]);
      isSaved = true;
    }

    const allSaved = await db.query<any>(
      'SELECT provider_id FROM saved_providers WHERE user_id = $1',
      [authUser.id]
    );
    res.json({
      success: true,
      isSaved,
      savedProviderIds: allSaved.rows.map((r) => Number(r.provider_id))
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle saved provider' });
  }
});

// --- ADMIN-ONLY DEMO RESET (Blocked in production and unless ALLOW_DEMO_RESET=true) ---

apiRouter.post(
  '/reset',
  requireAuth,
  requireRole('admin'),
  async (_req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'Demo reset is disabled in production' });
        return;
      }
      if (process.env.ALLOW_DEMO_RESET !== 'true') {
        res.status(403).json({ error: 'Demo reset is disabled (ALLOW_DEMO_RESET!=true)' });
        return;
      }

      const db = await getDb();
      await db.exec(`
        DELETE FROM leads;
        DELETE FROM bookings;
        DELETE FROM reviews;
        DELETE FROM transactions;
        DELETE FROM listings;
        DELETE FROM providers;
        DELETE FROM saved_providers;
      `);

      for (const p of initialProviders) {
        const ownerId = p.id === 1 ? 'usr-provider-demo-1' : null;
        await db.query(
          'INSERT INTO providers (id, category, name, owner_user_id, verified, verification_status, data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
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
      for (const l of initialListings) {
        await db.query(
          'INSERT INTO listings (id, provider_id, category, title, data) VALUES ($1, $2, $3, $4, $5)',
          [l.id, l.providerId, l.category, l.title, JSON.stringify(l)]
        );
      }
      for (const ld of initialLeads) {
        await db.query(
          'INSERT INTO leads (id, provider_id, tourist_user_id, status, data) VALUES ($1, $2, $3, $4, $5)',
          [ld.id, ld.providerId, null, ld.status, JSON.stringify(ld)]
        );
      }
      for (const b of initialBookings) {
        const touristUid = b.id === 1001 ? 'usr-tourist-demo-1' : null;
        await db.query(
          'INSERT INTO bookings (id, provider_id, tourist_user_id, status, data) VALUES ($1, $2, $3, $4, $5)',
          [b.id, b.providerId, touristUid, b.status, JSON.stringify(b)]
        );
      }
      for (const r of initialReviews) {
        await db.query(
          'INSERT INTO reviews (id, provider_id, data) VALUES ($1, $2, $3)',
          [r.id, r.providerId, JSON.stringify(r)]
        );
      }
      for (const tx of initialTransactions) {
        await db.query(
          'INSERT INTO transactions (id, booking_id, provider_id, data) VALUES ($1, $2, $3, $4)',
          [tx.id, tx.bookingId, tx.providerId, JSON.stringify(tx)]
        );
      }
      await db.query(
        'INSERT INTO saved_providers (user_id, provider_id) VALUES ($1, 1), ($1, 2), ($1, 3)',
        ['usr-tourist-demo-1']
      );

      res.json({ success: true, message: 'Database reset to verified seed state' });
    } catch (err: any) {
      res.status(500).json({ error: 'Reset failed' });
    }
  }
);

apiRouter.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

