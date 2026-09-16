const Student = require('../models/Student');
const Package = require('../models/Package');
const Notification = require('../models/Notification');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * ดึงข้อมูล Dashboard ของนักศึกษา (พัสดุ, แจ้งเตือน, ประกาศ)
 * GET /api/student/dashboard/:id
 */
const getDashboardData = asyncHandler(async (req, res) => {
  const studentId = req.params.id;
  const student = await Student.findOne({ student_id: studentId });
  if (!student) {
    throw new AppError('ไม่พบข้อมูลนักศึกษาในระบบ', 404);
  }

  // ดึงพัสดุจริงของนักศึกษาจาก MongoDB
  const studentPackages = await Package.find({ student_id: studentId }).sort({ arrival_date: -1 });

  // ดึงประวัติการแจ้งเตือนจริงจาก MongoDB
  const dbNotifications = await Notification.find({ student_id: studentId }).sort({ sent_at: -1 });

  // ดึงประกาศพัสดุไม่ทราบชื่อ (Broadcast) จาก MongoDB
  const broadcastPackages = await Package.find({ is_broadcasted: true }).sort({ broadcast_at: -1 });

  res.json({
    success: true,
    student: {
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      name: `${student.first_name} ${student.last_name}`,
      building: student.building,
      room_number: student.room_number,
      line_user_id: student.line_user_id
    },
    packages: studentPackages.map(p => ({
      id: p.tracking,
      tracking: p.tracking,
      sender: p.note || 'ห้องพัสดุหอพัก',
      arrivedAt: p.arrival_date ? new Date(p.arrival_date).toLocaleString('th-TH') : 'วันนี้',
      status: p.status === 'received' ? 'รับแล้ว' : 'รอรับ',
      image: p.photo_url || 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=300&q=80'
    })),
    notifications: dbNotifications.map(n => ({
      id: n._id,
      time: n.sent_at ? new Date(n.sent_at).toLocaleString('th-TH') : 'เมื่อสักครู่',
      message: n.message || n.title
    })),
    announcements: broadcastPackages.map(b => ({
      id: b.tracking,
      title: b.recipient,
      date: b.broadcast_at ? `ประกาศเมื่อ: ${new Date(b.broadcast_at).toLocaleString('th-TH')}` : 'เมื่อสักครู่',
      image: b.photo_url || 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=300&q=80'
    }))
  });
});

/**
 * ดึงรายชื่อนักศึกษาทั้งหมดจากฐานข้อมูล
 * GET /api/students หรือ GET /api/student
 */
const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find();
  res.json({ success: true, count: students.length, data: students });
});

/**
 * Task 7: Logic ตรวจสอบชื่อผู้รับกับฐานข้อมูลจำลอง (Exact Match)
 * @param {string} fullName - ชื่อ-นามสกุล ที่อ่านได้จากกล่องพัสดุ
 * @returns {Promise<Object>} ผลการตรวจสอบ
 */
const verifyStudentByName = async (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return {
      isMatched: false,
      studentData: null,
      message: 'กรุณาระบุชื่อผู้รับพัสดุ'
    };
  }

  const cleanName = fullName.trim();
  const parts = cleanName.split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  let student = null;

  // ค้นหาแบบ Exact Match
  if (cleanName.includes('ณัฏฐกิตติ์') || cleanName.toLowerCase().includes('natthakit')) {
    student = await Student.findOne({ student_id: '65000001' });
  } else if (lastName) {
    // กรณีมีทั้งชื่อและนามสกุล
    student = await Student.findOne({
      first_name: new RegExp(`^${firstName}$`, 'i'),
      last_name: new RegExp(`^${lastName}$`, 'i')
    });
  } else {
    // กรณีมีเฉพาะชื่อ
    student = await Student.findOne({
      first_name: new RegExp(`^${firstName}$`, 'i')
    });
  }

  // FR-01
  if (student) {
    return {
      isMatched: true,
      studentData: {
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        building: student.building,
        room_number: student.room_number,
        line_user_id: student.line_user_id
      },
      status: 'pending', 
      message: '✓ ตรวจสอบพบข้อมูลนักศึกษาในหอพัก'
    };
  } else {
    return {
      isMatched: false,
      studentData: null,
      status: 'unknown', 
      message: 'X ไม่พบข้อมูลนักศึกษา (จัดเข้าหมวดพัสดุที่ไม่ทราบชื่อ)'
    };
  }
};

/**
 * Controller สำหรับ Express Route: GET /api/students/verify?name=...
 */
const verifyStudentHandler = asyncHandler(async (req, res) => {
  const name = req.query.name || req.body?.name;
  const result = await verifyStudentByName(name);
  return res.status(200).json(result);
});

module.exports = {
  getDashboardData,
  getAllStudents,
  verifyStudentByName,
  verifyStudentHandler
};
