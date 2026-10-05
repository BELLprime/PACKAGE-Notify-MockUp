/**
 * Centralized Configuration (Task 16.1 - Refactored based on Software Engineering Best Practice)
 * รวมการตั้งค่าสภาพแวดล้อมทั้งหมดไว้ที่เดียว ป้องกันการอ่าน process.env กระจัดกระจาย
 */
const config = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/package_notify_db',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ],
  nodeEnv: process.env.NODE_ENV ?? 'development',
  get isProduction() {
    return this.nodeEnv === 'production';
  }
};

module.exports = config;
