const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// เริ่มต้นเชื่อมต่อฐานข้อมูลและเปิดเซิร์ฟเวอร์
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`^_____^ Server running on http://localhost:${PORT}`);
      console.log(`✓ Verify API ready: http://localhost:${PORT}/api/students/verify?name=...`);
    });
  } catch (error) {
    console.error('X Server startup error:', error);
  }
};

startServer();