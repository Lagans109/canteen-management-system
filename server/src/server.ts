import type { Server } from 'http';
import mongoose from 'mongoose';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function main(): Promise<void> {
  await connectDB();
  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      mongoose.connection
        .close()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
