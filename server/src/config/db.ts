import mongoose from 'mongoose';
import { env } from './env';

// Opens the Mongoose connection to MongoDB using the configured connection
// string (MONGODB_URI). Called once at server startup before the Express
// app starts accepting requests.
export async function connectDB(): Promise<typeof mongoose> {
  // Rejects queries that reference fields not defined in a model's schema —
  // catches typos in query filters instead of silently matching nothing.
  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    if (env.NODE_ENV !== 'test') {
      console.warn('MongoDB disconnected');
    }
  });

  return mongoose.connect(env.MONGODB_URI);
}
