const express = require('express');
const router = express.Router();
const {
  getAllNotifications,
  getNotificationsByStudent,
  sendPersonalNotification
} = require('../services/notificationService');
const Student = require('../models/Student');
const Package = require('../models/Package');

// ดึงประวัติการแจ้งเตือนทั้งหมด
// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await getAllNotifications();
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ดึงประวัติการแจ้งเตือนของนักศึกษาเฉพาะราย (สำหรับ Task 12)
// GET /api/notifications/student/:studentId
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const notifications = await getNotificationsByStudent(studentId);
    res.json({ success: true, studentId, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ยิงทดสอบจำลองการส่งแจ้งเตือนรายบุคคล (สำหรับ Task 13 Test)
// POST /api/notifications/test-personal
router.post('/test-personal', async (req, res) => {
  try {
    const { student_id, tracking } = req.body;
    const student = await Student.findOne({ student_id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'ไม่พบรหัสนักศึกษานี้' });
    }

    const mockPkg = {
      _id: '000000000000000000000000',
      tracking: tracking || `PKG-TEST-${Date.now().toString().slice(-4)}`,
      recipient: `${student.first_name} ${student.last_name}`,
      arrival_date: new Date()
    };

    const result = await sendPersonalNotification(student, mockPkg);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
