import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './server/db.ts';
import { apiRouter } from './server/routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Initialize DB and Seed data
  initDatabase();

  // Basic security and parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger in dev
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!isProduction) {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn('Production build directory "dist" not found. Running in fallback mode.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clinic server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
