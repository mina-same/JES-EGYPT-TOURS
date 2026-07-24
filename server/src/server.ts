import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import app from './app';
import connectDB from './config/database';
import { initRealtime } from './realtime/socket';
import { startPublishingScheduler } from './services/publishingScheduler';

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Start server
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initRealtime(server);

let stopPublishingScheduler: (() => void) | undefined;

const startServer = async () => {
  await connectDB();
  stopPublishingScheduler = startPublishingScheduler();

  server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 JES EGYPT TOURS API SERVER                            ║
║                                                            ║
║   📍 Server running on port: ${PORT}                       ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'} ║
║   🔗 API Base URL: http://localhost:${PORT}/api            ║
║   ❤️  Health Check: http://localhost:${PORT}/health        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
};

void startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  stopPublishingScheduler?.();
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});
