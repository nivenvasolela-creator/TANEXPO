import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import helmet from 'helmet';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.js';
import { getDb } from './server/db.js';
import { getPaymentsMode } from './server/config.js';
import { bookingIntegrityGuard } from './server/guards.js';

function getFrameAncestors(): string[] {
  if (process.env.NODE_ENV === 'production') {
    const raw = process.env.ALLOW_FRAME_ANCESTORS;
    if (raw && raw.trim()) {
      const parsed = raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return ["'none'"];
  }
  return ["'self'", 'https://aistudio.google.com', 'https://*.google.com'];
}

async function startServer() {
  if (!process.env.NODE_ENV) {
    console.warn('[STARTUP WARNING] NODE_ENV is not set; defaulting to development behavior.');
  }
  if (process.env.NODE_ENV === 'production' && getPaymentsMode() !== 'live') {
    console.warn(
      '[STARTUP WARNING] Running in production with PAYMENTS_MODE=simulated. Do not accept real customer funds until PAYMENTS_MODE=live.'
    );
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[STARTUP NOTICE] Embedded PGlite requires a single instance (replicas=1) with persistent PG_DATA_DIR. See DEPLOYMENT.md for hosted Postgres migration.'
    );
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              fontSrc: ["'self'", 'data:'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              connectSrc: ["'self'", 'https:'],
              manifestSrc: ["'self'"],
              workerSrc: ["'self'"],
              frameAncestors: getFrameAncestors()
            }
          }
        : false,
      crossOriginEmbedderPolicy: false,
      xFrameOptions: false
    })
  );

  // Attach requestId and emit structured JSON request logs for /api without bodies or PII
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    const start = Date.now();

    res.on('finish', () => {
      if (req.originalUrl.startsWith('/api')) {
        const cleanPath = req.originalUrl.split('?')[0];
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            path: cleanPath,
            status: res.statusCode,
            durationMs: Date.now() - start
          })
        );
      }
    });
    next();
  });

  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      }
    })
  );

  // Clean 400 on malformed JSON bodies
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err && err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON request body' });
      return;
    }
    next(err);
  });

  // Initialize Postgres DB on boot (fail fast if unavailable)
  try {
    console.log('Initializing PostgreSQL database...');
    await getDb();
    console.log('PostgreSQL database connected and ready.');
  } catch (e: any) {
    console.error('[FATAL] Database initialization failed:', e?.message || e);
    process.exit(1);
  }

  // Integrity guard BEFORE apiRouter for POST /api/bookings
  app.post('/api/bookings', bookingIntegrityGuard);

  // API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express 4-arg error handler (never leaks stack traces)
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as any).requestId || 'unknown';
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        level: 'error',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        message: err?.message || 'Unhandled server error'
      })
    );
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error', requestId });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TANEXPO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TANEXPO server:', err?.message || err);
  process.exit(1);
});
