import dotenv from 'dotenv';
import mongoose from 'mongoose';

function ensureEnvLoaded() {
  if (process.env.MONGODB_URI) return;
  dotenv.config();
}

let isConnected = false;

export async function connectToDatabase({ mongoUri } = {}) {
  ensureEnvLoaded();
  const uri = mongoUri ?? process.env.MONGODB_URI;

  if (!uri) {
    return { enabled: false, reason: 'MONGODB_URI not set' };
  }

  if (isConnected) {
    return { enabled: true, reused: true };
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
    isConnected = true;
    return { enabled: true, reused: false };
  } catch (err) {
    return {
      enabled: false,
      reason: typeof err?.message === 'string' ? err.message : 'MongoDB connection failed',
    };
  }
}

export async function disconnectFromDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
