const app = require('./src/app');
const connectDB = require('./src/config/db');
const config = require('./src/config/config');

// เริ่มต้นเชื่อมต่อฐานข้อมูลและเปิดเซิร์ฟเวอร์
const startServer = async () => {
  try {
    // เชื่อมต่อ MongoDB
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('⚠️ Could not connect to MongoDB. Running in fallback mode.');
    }

    app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 [PACKAGE-NOTIFY API] Server running on http://localhost:${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🌐 Allowed CORS: ${config.corsOrigin.join(', ')}`);
      console.log(`✓ Verify API ready: http://localhost:${config.port}/api/students/verify?name=...`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
  }
};

startServer();
