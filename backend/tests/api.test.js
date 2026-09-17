const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const mongoose = require('mongoose');
const Package = require('../src/models/Package');
const Student = require('../src/models/Student');

before(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('MongoDB connection not active for tests. Continuing with memory/fallback.');
  }
});

after(async () => {
  try {
    // ลบพัสดุจำลองที่ถูกสร้างขึ้นระหว่างการทดสอบ เพื่อไม่ให้ปะปนกับฐานข้อมูลจริง
    await Package.deleteMany({
      tracking: { $regex: /^(TEST-PKG|SIGN-TEST|BCAST-TEST)/ }
    });
  } catch (err) {
    // ignore
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe('1. API Health Check & System Status', () => {
  test('GET / คืนสถานะ 200 OK และส่งข้อมูลเวอร์ชัน 2.0.0', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.version, '2.0.0');
  });

  test('GET /api/nonexistent-route-xyz ตอบกลับ 404 Not Found ด้วย Central Error Middleware', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('ไม่พบเส้นทาง API'));
  });
});

describe('2. Student Verification API (FR-01: Name Verification)', () => {
  test('GET /api/students/verify เมื่อชื่อตรงกับฐานข้อมูล (สมหญิง ใจดี) คืน 200 และ isMatched: true', async () => {
    const res = await request(app).get('/api/students/verify?name=สมหญิง ใจดี');
    assert.equal(res.status, 200);
    assert.equal(res.body.isMatched, true);
    assert.equal(res.body.status, 'pending');
    assert.equal(res.body.studentData.student_id, '65000002');
  });

  test('GET /api/students/verify เมื่อชื่อไม่ตรง (คนไม่มีในหอ) คืน 200 และ isMatched: false', async () => {
    const res = await request(app).get('/api/students/verify?name=คนไม่มีในหอ');
    assert.equal(res.status, 200);
    assert.equal(res.body.isMatched, false);
    assert.equal(res.body.status, 'unknown');
  });
});

describe('3. Package Management API (FR-01 & FR-02: Package Entry & Auto Notify)', () => {
  test('GET /api/packages คืนรายการพัสดุทั้งหมดพร้อมสถานะ 200 และเป็น Array', async () => {
    const res = await request(app).get('/api/packages');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('POST /api/packages บันทึกพัสดุใหม่ชื่อตรง คืน 201 Created และจับคู่นักศึกษาสำเร็จ (FR-01)', async () => {
    const trackingNo = `TEST-PKG-${Date.now().toString().slice(-4)}`;
    const res = await request(app)
      .post('/api/packages')
      .send({
        tracking: trackingNo,
        recipient: 'สมหญิง ใจดี',
        note: 'กล่องขนาดเล็ก',
        student_id: '65000002'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.isMatched, true);
    assert.equal(res.body.data.tracking, trackingNo);
    assert.equal(res.body.data.status, 'pending');
  });

  test('POST /api/packages เมื่อไม่ระบุชื่อผู้รับ ตอบกลับ 400 Bad Request ผ่าน AppError', async () => {
    const res = await request(app)
      .post('/api/packages')
      .send({
        tracking: 'TEST-INVALID',
        recipient: ''
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'กรุณาระบุชื่อผู้รับพัสดุ');
  });
});

describe('4. Broadcast & Claim API (FR-04: Unknown Package & Broadcast Board)', () => {
  test('POST /api/packages/broadcast ส่งประกาศพัสดุไม่ทราบชื่อ คืน 200 และ is_broadcasted: true', async () => {
    const trackingNo = `BCAST-TEST-${Date.now().toString().slice(-4)}`;
    const res = await request(app)
      .post('/api/packages/broadcast')
      .send({
        tracking: trackingNo,
        recipient: 'พัสดุไม่ระบุชื่อชัดเจน',
        note: 'วางอยู่หน้าห้องธุรการ'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.is_broadcasted, true);
  });

  test('GET /api/packages/broadcasts ดึงรายการพัสดุบนบอร์ดกลาง คืน 200 และเป็น Array', async () => {
    const res = await request(app).get('/api/packages/broadcasts');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });
});

describe('5. Digital Signature & Delivery Confirmation (FR-05)', () => {
  test('PUT /api/packages/:id/receive ยืนยันการเซ็นรับพัสดุ เปลี่ยนสถานะเป็น received (200 OK)', async () => {
    // สร้างพัสดุทดสอบ
    const testTracking = `SIGN-TEST-${Date.now().toString().slice(-4)}`;
    await request(app)
      .post('/api/packages')
      .send({
        tracking: testTracking,
        recipient: 'สมหญิง ใจดี',
        student_id: '65000002'
      });

    // ส่งลายเซ็นดิจิทัล
    const res = await request(app)
      .put(`/api/packages/${testTracking}/receive`)
      .send({
        signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        student_id: '65000002'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'received');
    assert.ok(res.body.data.pickup_date);
  });
});

describe('6. Reminder & Overdue Scanner (FR-03)', () => {
  test('GET /api/notifications/check-reminders สแกนพัสดุค้างรับเกิน 5 ชม. คืน 200 และรายงานผล', async () => {
    const res = await request(app).get('/api/notifications/check-reminders?hours=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(typeof res.body.scannedCount, 'number');
  });
});
