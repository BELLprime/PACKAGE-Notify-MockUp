const Student = require('../models/Student');

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
  if (lastName) {
    // กรณีมีทั้งชื่อและนามสกุล
    student = await Student.findOne({
      first_name: firstName,
      last_name: lastName
    });
  } else {
    // กรณีมีเฉพาะชื่อ
    student = await Student.findOne({
      first_name: firstName
    });
  }

  //FR-01
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
const verifyStudentHandler = async (req, res) => {
  try {
    const name = req.query.name || req.body?.name;
    const result = await verifyStudentByName(name);
    return res.status(200).json(result);
  } catch (error) {
    console.error('X Verify Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล',
      error: error.message
    });
  }
};

module.exports = {
  verifyStudentByName,
  verifyStudentHandler
};
