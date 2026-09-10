import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from './db.js';
import {
  initialProviders,
  initialListings,
  initialLeads,
  initialBookings,
  initialReviews,
  initialTransactions
} from '../src/data/initialData.js';

export const apiRouter = express.Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return 'tanexpo_' + crypto.randomBytes(24).toString('hex');
}

// Helper to get authenticated user from bearer token
async function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const db = await getDb();
  const sessionRes = await db.query<any>(
    'SELECT user_id FROM app_sessions WHERE token = $1',
    [token]
  );
  if (!sessionRes.rows.length) return null;

  const userId = sessionRes.rows[0].user_id;
  const userRes = await db.query<any>(
    'SELECT id, email, phone, name, role, tourist_profile, provider_profile, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (!userRes.rows.length) return null;

  const row = userRes.rows[0];
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    role: row.role,
    touristProfile: row.tourist_profile,
    providerProfile: row.provider_profile,
    createdAt: row.created_at,
    token
  };
}

// --- AUTHENTICATION ROUTES ---

// Register Tourist or Provider
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, phone, password, name, role, touristProfile, providerProfile } = req.body;

    if (!name || !role) {
      res.status(400).json({ error: 'Name and role are required' });
      return;
    }

    const db = await getDb();

    // Check if user already exists
    if (email) {
      const existing = await db.query<any>('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const pwdHash = password ? hashPassword(password) : hashPassword('password123');
    const createdAt = new Date().toISOString();

    await db.query(
      `INSERT INTO users (id, email, phone, password_hash, name, role, tourist_profile, provider_profile, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        email ? email.toLowerCase() : null,
        phone || null,
        pwdHash,
        name,
        role,
        touristProfile ? JSON.stringify(touristProfile) : null,
        providerProfile ? JSON.stringify(providerProfile) : null,
        createdAt
      ]
    );

    // If provider registered, insert provider row into providers table
    if (role === 'provider' && providerProfile) {
      const pId = providerProfile.providerId || (Date.now() % 100000);
      const newProviderObj = {
        id: pId,
        category: providerProfile.primaryCategory || 'safari',
        name: providerProfile.businessName || name,
        tagline: `${providerProfile.region || 'Tanzania'} Tour Operator`,
        location: providerProfile.location || 'Arusha',
        region: providerProfile.region || 'Northern Circuit',
        rating: 5.0,
        reviewsCount: 1,
        tripsCompleted: 1,
        verified: providerProfile.verificationStatus === 'tanexpo_verified',
        talaLicense: providerProfile.talaLicense || 'MNRT/TALA/PENDING',
        languages: providerProfile.languages || ['English', 'Swahili'],
        about: providerProfile.about || '',
        phone: providerProfile.phone || phone || '',
        email: providerProfile.email || email || '',
        establishedYear: new Date().getFullYear(),
        badges: ['TALA Licensed', 'Verified Operator'],
        officeAddress: providerProfile.location || 'Tanzania'
      };
      await db.query(
        'INSERT INTO providers (id, category, name, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $4',
        [pId, newProviderObj.category, newProviderObj.name, JSON.stringify(newProviderObj)]
      );
    }

    const token = generateToken();
    await db.query('INSERT INTO app_sessions (token, user_id, created_at) VALUES ($1, $2, $3)', [
      token,
      userId,
      new Date().toISOString()
    ]);

    const user = {
      id: userId,
      email: email ? email.toLowerCase() : undefined,
      phone,
      name,
      role,
      touristProfile,
      providerProfile,
      createdAt
    };

    res.json({ token, user });
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login with email/phone + password
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password, role } = req.body;
    if (!emailOrPhone) {
      res.status(400).json({ error: 'Email or phone is required' });
      return;
    }

    const db = await getDb();
    const identifier = emailOrPhone.trim().toLowerCase();

    // Query user by email or phone
    const userRes = await db.query<any>(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2',
      [identifier, emailOrPhone.trim()]
    );

    if (!userRes.rows.length) {
      res.status(401).json({ error: 'Invalid credentials. User not found.' });
      return;
    }

    const row = userRes.rows[0];

    // Password validation (if password provided)
    if (password) {
      const hashed = hashPassword(password);
      if (row.password_hash && row.password_hash !== hashed) {
        res.status(401).json({ error: 'Invalid password. Please try again.' });
        return;
      }
    }

    const token = generateToken();
    await db.query('INSERT INTO app_sessions (token, user_id, created_at) VALUES ($1, $2, $3)', [
      token,
      row.id,
      new Date().toISOString()
    ]);

    const user = {
      id: row.id,
      email: row.email,
      phone: row.phone,
      name: row.name,
      role: role || row.role,
      touristProfile: row.tourist_profile,
      providerProfile: row.provider_profile,
      createdAt: row.created_at
    };

    res.json({ token, user });
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Get current user session
apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      res.status(401).json({ user: null });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const db = await getDb();
      await db.query('DELETE FROM app_sessions WHERE token = $1', [token]);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
apiRouter.put('/auth/profile', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { touristProfile, providerProfile } = req.body;
    const db = await getDb();

    if (touristProfile) {
      await db.query(
        'UPDATE users SET tourist_profile = $1 WHERE id = $2',
        [JSON.stringify(touristProfile), user.id]
      );
    }

    if (providerProfile) {
      await db.query(
        'UPDATE users SET provider_profile = $1 WHERE id = $2',
        [JSON.stringify(providerProfile), user.id]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CORE APPLICATION STATE ---

// GET complete initial application state from Postgres
apiRouter.get('/state', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    const [providersRes, listingsRes, leadsRes, bookingsRes, reviewsRes, transactionsRes, savedRes] = await Promise.all([
      db.query<any>('SELECT data FROM providers ORDER BY id ASC'),
      db.query<any>('SELECT data FROM listings ORDER BY id ASC'),
      db.query<any>('SELECT data FROM leads ORDER BY id DESC'),
      db.query<any>('SELECT data FROM bookings ORDER BY id DESC'),
      db.query<any>('SELECT data FROM reviews ORDER BY id DESC'),
      db.query<any>("SELECT data FROM transactions ORDER BY data->>'date' DESC NULLS LAST"),
      db.query<any>('SELECT provider_id FROM saved_providers')
    ]);

    const providers = providersRes.rows.map(r => r.data);
    const listings = listingsRes.rows.map(r => r.data);
    const leads = leadsRes.rows.map(r => r.data);
    const bookings = bookingsRes.rows.map(r => r.data);
    const reviews = reviewsRes.rows.map(r => r.data);
    const transactions = transactionsRes.rows.map(r => r.data);
    const savedProviderIds = Array.from(new Set(savedRes.rows.map(r => Number(r.provider_id))));

    res.json({
      providers,
      listings,
      leads,
      bookings,
      reviews,
      transactions,
      savedProviderIds
    });
  } catch (err: any) {
    console.error('Error fetching state:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch state' });
  }
});

// Create Lead (Inquiry)
apiRouter.post('/leads', async (req: Request, res: Response) => {
  try {
    const lead = req.body;
    const db = await getDb();
    await db.query(
      'INSERT INTO leads (id, provider_id, status, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $4, status = $3',
      [lead.id, lead.providerId, lead.status, JSON.stringify(lead)]
    );
    res.json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Lead (e.g. quote, status, negotiation)
apiRouter.put('/leads/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updatedLead = req.body;
    const db = await getDb();
    await db.query(
      'UPDATE leads SET data = $1, status = $2 WHERE id = $3',
      [JSON.stringify(updatedLead), updatedLead.status, id]
    );
    res.json({ success: true, lead: updatedLead });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Booking
apiRouter.post('/bookings', async (req: Request, res: Response) => {
  try {
    const booking = req.body;
    const db = await getDb();
    await db.query(
      'INSERT INTO bookings (id, provider_id, status, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $4, status = $3',
      [booking.id, booking.providerId, booking.status, JSON.stringify(booking)]
    );

    // If lead exists, update lead status to 'Booked'
    if (booking.leadId) {
      const leadRes = await db.query<any>('SELECT data FROM leads WHERE id = $1', [booking.leadId]);
      if (leadRes.rows.length > 0) {
        const ld = leadRes.rows[0].data;
        ld.status = 'Booked';
        await db.query('UPDATE leads SET status = $1, data = $2 WHERE id = $3', ['Booked', JSON.stringify(ld), booking.leadId]);
      }
    }

    res.json({ success: true, booking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Booking Status
apiRouter.put('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updatedBooking = req.body;
    const db = await getDb();
    await db.query(
      'UPDATE bookings SET status = $1, data = $2 WHERE id = $3',
      [updatedBooking.status, JSON.stringify(updatedBooking), id]
    );
    res.json({ success: true, booking: updatedBooking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create / Update Listing
apiRouter.post('/listings', async (req: Request, res: Response) => {
  try {
    const listing = req.body;
    const db = await getDb();
    await db.query(
      'INSERT INTO listings (id, provider_id, category, title, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $5, title = $4, category = $3',
      [listing.id, listing.providerId, listing.category, listing.title, JSON.stringify(listing)]
    );
    res.json({ success: true, listing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Listing
apiRouter.delete('/listings/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();
    await db.query('DELETE FROM listings WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Review
apiRouter.post('/reviews', async (req: Request, res: Response) => {
  try {
    const review = req.body;
    const db = await getDb();
    await db.query(
      'INSERT INTO reviews (id, provider_id, data) VALUES ($1, $2, $3)',
      [review.id, review.providerId, JSON.stringify(review)]
    );
    res.json({ success: true, review });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Provider Response to Review
apiRouter.post('/reviews/:id/response', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { responseText } = req.body;
    const db = await getDb();
    const revRes = await db.query<any>('SELECT data FROM reviews WHERE id = $1', [id]);
    if (!revRes.rows.length) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    const r = revRes.rows[0].data;
    r.providerResponse = responseText;
    await db.query('UPDATE reviews SET data = $1 WHERE id = $2', [JSON.stringify(r), id]);
    res.json({ success: true, review: r });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Provider Profile
apiRouter.post('/providers/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const provider = req.body;
    const db = await getDb();
    await db.query(
      'UPDATE providers SET data = $1, name = $2, category = $3 WHERE id = $4',
      [JSON.stringify(provider), provider.name, provider.category, id]
    );
    res.json({ success: true, provider });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record Transaction
apiRouter.post('/transactions', async (req: Request, res: Response) => {
  try {
    const tx = req.body;
    const db = await getDb();
    await db.query(
      'INSERT INTO transactions (id, booking_id, provider_id, data) VALUES ($1, $2, $3, $4)',
      [tx.id, tx.bookingId, tx.providerId, JSON.stringify(tx)]
    );
    res.json({ success: true, transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Saved Provider
apiRouter.post('/saved', async (req: Request, res: Response) => {
  try {
    const { providerId, userId = 'default-session' } = req.body;
    const db = await getDb();
    const existing = await db.query<any>(
      'SELECT * FROM saved_providers WHERE user_id = $1 AND provider_id = $2',
      [userId, providerId]
    );

    let isSaved = false;
    if (existing.rows.length > 0) {
      await db.query(
        'DELETE FROM saved_providers WHERE user_id = $1 AND provider_id = $2',
        [userId, providerId]
      );
      isSaved = false;
    } else {
      await db.query(
        'INSERT INTO saved_providers (user_id, provider_id) VALUES ($1, $2)',
        [userId, providerId]
      );
      isSaved = true;
    }

    const allSaved = await db.query<any>('SELECT provider_id FROM saved_providers WHERE user_id = $1', [userId]);
    const savedIds = allSaved.rows.map(r => Number(r.provider_id));
    res.json({ success: true, isSaved, savedProviderIds: savedIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Database back to original seed data
apiRouter.post('/reset', async (req: Request, res: Response) => {
  try {
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
      await db.query('INSERT INTO providers (id, category, name, data) VALUES ($1, $2, $3, $4)', [p.id, p.category, p.name, JSON.stringify(p)]);
    }
    for (const l of initialListings) {
      await db.query('INSERT INTO listings (id, provider_id, category, title, data) VALUES ($1, $2, $3, $4, $5)', [l.id, l.providerId, l.category, l.title, JSON.stringify(l)]);
    }
    for (const ld of initialLeads) {
      await db.query('INSERT INTO leads (id, provider_id, status, data) VALUES ($1, $2, $3, $4)', [ld.id, ld.providerId, ld.status, JSON.stringify(ld)]);
    }
    for (const b of initialBookings) {
      await db.query('INSERT INTO bookings (id, provider_id, status, data) VALUES ($1, $2, $3, $4)', [b.id, b.providerId, b.status, JSON.stringify(b)]);
    }
    for (const r of initialReviews) {
      await db.query('INSERT INTO reviews (id, provider_id, data) VALUES ($1, $2, $3)', [r.id, r.providerId, JSON.stringify(r)]);
    }
    for (const tx of initialTransactions) {
      await db.query('INSERT INTO transactions (id, booking_id, provider_id, data) VALUES ($1, $2, $3, $4)', [tx.id, tx.bookingId, tx.providerId, JSON.stringify(tx)]);
    }
    await db.query('INSERT INTO saved_providers (user_id, provider_id) VALUES ($1, 1), ($1, 2)', ['default-session']);

    res.json({ success: true, message: 'Database reset to verified seed state' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
