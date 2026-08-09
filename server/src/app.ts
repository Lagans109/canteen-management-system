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

export function createApp(): Express {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  app.get('/api/health', (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({ status: dbConnected ? 'ok' : 'degraded', db: dbConnected });
  });

  app.use('/api', apiRateLimiter, apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
