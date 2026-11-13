import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.js';
import { getDb } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                connectSrc: ["'self'", 'https:'],
                frameAncestors: ["'self'", 'https://aistudio.google.com', 'https://*.google.com']
              }
            }
          : false,
      crossOriginEmbedderPolicy: false,
      xFrameOptions: false
    })
  );

  app.use(express.json({ limit: '2mb' }));

  // Clean 400 on malformed JSON bodies
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err && err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON request body' });
      return;
    }
    next(err);
  });

  // Initialize Postgres DB on boot
  try {
    console.log('Initializing PostgreSQL database...');
    await getDb();
    console.log('PostgreSQL database connected and ready.');
  } catch (e) {
    console.error('Database initialization warning:', e);
  }

  // API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TANEXPO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TANEXPO server:', err);
});
