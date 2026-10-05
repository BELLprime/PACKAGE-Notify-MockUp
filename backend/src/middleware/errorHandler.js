/**
 * Error Handling Architecture (Task 16.1 - Refactored based on Software Engineering Best Practice)
 * รวมการจัดการข้อผิดพลาดและคลาส Error สำหรับ API ทั้งหมด
 */
const config = require('../config/config');

/**
 * Custom AppError สำหรับระบุ HTTP Status Code ได้เองอย่างชัดเจน
 * เช่น throw new AppError('ไม่พบข้อมูลนักศึกษา', 404);
 */
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Wrapper สำหรับห่อ Controller ที่เป็น Async เพื่อลดการเขียน try/catch ซ้ำซ้อน
 * หากเกิด Error จะส่งต่อไปยัง Express Error Middleware (next) อัตโนมัติ
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * จัดการเมื่อเรียกมายัง Route ที่ไม่มีอยู่ในระบบ (404 Not Found)
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `ไม่พบเส้นทาง API: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Central Error Handling Middleware ดักจับ Error ทั้งหมดในแอปพลิเคชัน
 * - มี 4 พารามิเตอร์เพื่อให้ Express ทราบว่าเป็น Error Handler
 * - ซ่อน stack trace เมื่ออยู่ในสถานะ Production
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  if (status >= 500) {
    console.error('💥 [Server Internal Error]:', err.message);
    if (!config.isProduction && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(status).json({
    success: false,
    error: status >= 500 && config.isProduction
      ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
      : (err.message || 'Server Error'),
    ...(config.isProduction ? {} : { stack: err.stack?.split('\n').slice(0, 3) })
  });
};

module.exports = {
  AppError,
  asyncHandler,
  notFound,
  errorHandler
};
