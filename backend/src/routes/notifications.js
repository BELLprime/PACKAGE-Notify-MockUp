const express = require('express');
const router = express.Router();
const {
  getAllNotifications,
  getNotificationsByStudent,
  sendPersonalNotification,
  checkAndSendOverdueReminders
} = require('../services/notificationService');
const Student = require('../models/Student');
const Package = require('../models/Package');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// ดึงประวัติการแจ้งเตือนทั้งหมด
// GET /api/notifications
router.get('/', asyncHandler(async (req, res) => {
  const notifications = await getAllNotifications();
  res.json({ success: true, count: notifications.length, data: notifications });
}));

// ดึงประวัติการแจ้งเตือนของนักศึกษาเฉพาะราย 
// GET /api/notifications/student/:studentId
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const notifications = await getNotificationsByStudent(studentId);
  res.json({ success: true, studentId, count: notifications.length, data: notifications });
}));

// POST /api/notifications/test-personal
router.post('/test-personal', asyncHandler(async (req, res) => {
  const { student_id, tracking } = req.body;
  const student = await Student.findOne({ student_id });
  if (!student) {
    throw new AppError('ไม่พบรหัสนักศึกษานี้', 404);
  }

  const mockPkg = {
    _id: '000000000000000000000000',
    tracking: tracking || `PKG-TEST-${Date.now().toString().slice(-4)}`,
    recipient: `${student.first_name} ${student.last_name}`,
    arrival_date: new Date()
  };

  const result = await sendPersonalNotification(student, mockPkg);
  res.json(result);
}));

// สั่งสแกนและส่งแจ้งเตือนซ้ำอัตโนมัติเมื่อพัสดุค้างรับเกิน 5 ชม. (Task 14 / FR-03)
// POST /api/notifications/check-reminders หรือ GET /api/notifications/check-reminders
const checkRemindersHandler = asyncHandler(async (req, res) => {
  const thresholdHours = parseFloat(req.query.hours || req.body?.hours || 5);
  const force = req.query.force === 'true' || req.body?.force === true;

  const result = await checkAndSendOverdueReminders(thresholdHours, force);
  res.status(200).json(result);
});

router.get('/check-reminders', checkRemindersHandler);
router.post('/check-reminders', checkRemindersHandler);

module.exports = router;
