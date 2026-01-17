import dotenv from 'dotenv';
import path from 'path';
import app from './app';
import connectDB from './config/database';

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to database
connectDB();


// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});
