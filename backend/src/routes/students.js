const express = require('express');
const router = express.Router();
const { verifyStudentHandler } = require('../controllers/studentController');
const Student = require('../models/Student');

// Endpoint สำหรับ Task 7: ตรวจสอบชื่อผู้รับ
// วิธีเรียกใช้งาน: GET /api/students/verify?name=สมหญิง ใจดี
router.get('/verify', verifyStudentHandler);

// Endpoint สำหรับดูรายชื่อนักศึกษาทั้งหมด
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
