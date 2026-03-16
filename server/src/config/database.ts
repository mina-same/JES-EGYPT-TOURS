import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set');
    }

    // In serverless environments we may be invoked multiple times.
    // Reuse existing connection if it is already established.
    if (mongoose.connection.readyState === 1) {
      return;
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 20000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Do not exit the process in serverless (Vercel); allow the request to fail gracefully.
    // Throwing lets callers handle it and returns 500 instead of crashing the runtime.
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
