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
