import type { Server } from 'http';
import mongoose from 'mongoose';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

// Entry point for the running server process: connects to MongoDB first,
// then starts the Express app listening on the configured port.
async function main(): Promise<void> {
  await connectDB();
  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // On shutdown signals (e.g. from a process manager or `docker stop`),
  // stop accepting new connections, let in-flight requests finish, then
  // close the MongoDB connection before exiting — avoids dropping requests
  // or leaving the DB connection dangling.
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

// Safety nets: if something throws outside of Express's request handling
// (e.g. a rejected Promise nobody awaited), log it and exit rather than
// keep running in a possibly corrupted state.
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
