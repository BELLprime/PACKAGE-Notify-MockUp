const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// เริ่มต้นเชื่อมต่อฐานข้อมูลและเปิดเซิร์ฟเวอร์
const startServer = async () => {
  try {
    // พยายามเชื่อมต่อ MongoDB (ถ้าเชื่อมต่อไม่ได้ เซิร์ฟเวอร์ยังสามารถเปิดทำงานต่อได้สำหรับ Mock Data)
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('⚠️ Could not connect to MongoDB. Running without DB.');
    }

    app.listen(PORT, () => {
      console.log(`^_____^ Server running on http://localhost:${PORT}`);
      console.log(`✓ Verify API ready: http://localhost:${PORT}/api/students/verify?name=...`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
  }
};

startServer();
