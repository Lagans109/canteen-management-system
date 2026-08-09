import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<typeof mongoose> {
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
