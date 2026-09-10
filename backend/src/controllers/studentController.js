const Student = require('../models/Student');

// Mock Data from frontend
const mockPackages = [
  {
    id: 'TH12345678',
    sender: 'ร้าน ABC Shop (Shopee)',
    arrivedAt: '2 ก.ย. 2568 14:30',
    status: 'รอรับ',
    image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'TH98765432',
    sender: 'คุณแม่ สมศรี',
    arrivedAt: '1 ก.ย. 2568 09:15',
    status: 'รอรับ',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'TH55443322',
    sender: 'Lazada Mall Official',
    arrivedAt: '30 ส.ค. 2568 16:45',
    status: 'รับแล้ว',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=150&q=80'
  }
];

const mockNotifications = [
  { time: 'เมื่อ 2 นาทีที่แล้ว', message: 'พัสดุใหม่ของคุณเลขที่ TH12345678 จัดส่งสำเร็จที่ห้องพัสดุตึก B แล้ว กรุณามาเซ็นรับ' },
  { time: 'เมื่อวานนี้ 09:16', message: 'พัสดุเลขที่ TH98765432 มาถึงที่หอพักแล้ว' }
];

const mockAnnouncements = [
  { 
    title: 'ซองพัสดุสีขาว จ่าหน้าไม่ชัดเจน', 
    date: 'พบเมื่อ: 1 ก.ย. - ตึก B',
    image: 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=100&q=80'
  },
  { 
    title: 'กล่องรองเท้า Nike ตกหล่น', 
    date: 'พบเมื่อ: 28 ส.ค. - ตึก A',
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=100&q=80'
  }
];

exports.getDashboardData = async (req, res) => {
  const studentId = req.params.id;
  try {
    // If DB is connected, we might look up the student:
    // const student = await Student.findOne({ student_id: studentId });
    // For now, we will return the mock data for the student
    
    res.json({
      student: {
        name: 'สมชาย ดีใจ',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
      },
      packages: mockPackages,
      notifications: mockNotifications,
      announcements: mockAnnouncements
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
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
  getDashboardData: exports.getDashboardData,
  getAllStudents: exports.getAllStudents,
  verifyStudentByName,
  verifyStudentHandler
};
