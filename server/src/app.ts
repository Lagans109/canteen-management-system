import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import { apiRouter } from './routes';
import { notFound, errorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimit';

// Builds and configures the Express application.
// Kept as a factory function (instead of a module-level singleton) so tests
// can create a fresh app instance without starting a real server/listener.
export function createApp(): Express {
  const app = express();

  // Express sits behind a reverse proxy (e.g. a load balancer) in production,
  // so this tells Express to trust the `X-Forwarded-*` headers it sets.
  // Without this, rate limiting and secure cookies would see the proxy's IP/protocol instead of the real client's.
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Sets a range of security-related HTTP response headers (e.g. disables
  // some legacy browser features that could be abused for attacks).
  app.use(helmet());

  // Only allow the configured frontend origin to call this API, and allow
  // credentials (cookies) to be sent cross-origin — required because the
  // JWT auth cookie must travel with every request from the React app.
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  // Parses incoming JSON request bodies into `req.body`.
  // The size limit guards against excessively large payloads.
  app.use(express.json({ limit: '100kb' }));

  // Parses the `Cookie` header into `req.cookies` so middleware/handlers can
  // read the JWT auth cookie by name.
  app.use(cookieParser());

  // Request logging is skipped in tests to keep test output clean.
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Simple liveness/readiness probe used by deployment tooling or manual checks.
  // Reports 503 if Mongoose isn't currently connected to MongoDB.
  app.get('/api/health', (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({ status: dbConnected ? 'ok' : 'degraded', db: dbConnected });
  });

  // All feature routes (auth, menu, sales, inventory, suppliers, reports)
  // are mounted under /api, protected by a shared request-rate limiter.
  app.use('/api', apiRateLimiter, apiRouter);

  // Order matters: `notFound` catches any request that didn't match a route
  // above, and `errorHandler` must be registered last so Express treats it
  // as the central error-handling middleware (it has 4 arguments).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
