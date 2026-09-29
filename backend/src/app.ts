import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { allowedOrigins, env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { oauthRouter } from './routes/oauthRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origen no permitido por CORS.'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.post('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API activa.' });
});

app.use('/api/auth/oauth', oauthRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);

// En producción, backend y frontend comparten origen para conservar cookies y CORS simples.
if (env.NODE_ENV === 'production') {
  const frontendDirectory = fileURLToPath(new URL('../../frontend-router/dist', import.meta.url));
  app.use(express.static(frontendDirectory));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile('index.html', { root: frontendDirectory });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Este archivo exporta: app Express configurada.
// Se usa en: server.ts.
// Importa de: middlewares, rutas y configuración de CORS.
