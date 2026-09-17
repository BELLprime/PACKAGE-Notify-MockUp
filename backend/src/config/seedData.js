const fs = require('fs');
const path = require('path');
const Package = require('../models/Package');
const Student = require('../models/Student');

const initialDatabasePackages = [
  {
    tracking: 'PKG-20260901-001',
    recipient: 'สมชาย ใจดี',
    student_id: null,
    status: 'unknown',
    note: 'ชื่อไม่ตรงกับฐานข้อมูลนักศึกษาในหอพัก',
    photo_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-09-01T14:30:00Z')
  },
  {
    tracking: 'PKG-20260901-002',
    recipient: 'สมหญิง ใจดี',
    student_id: '65000002',
    status: 'pending',
    note: '',
    photo_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-09-01T11:20:00Z')
  },
  {
    tracking: 'PKG-20260831-014',
    recipient: 'ปกรณ์ มั่นคง',
    student_id: '65000005',
    status: 'received',
    note: 'ชื่อไม่ตรงกับรหัส 65000005 (ในระบบคือ Pama Confused)',
    photo_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-08-31T16:00:00Z'),
    pickup_date: new Date('2026-08-31T17:30:00Z')
  },
  {
    tracking: 'PKG-20260831-009',
    recipient: 'วินัย รัตนา',
    student_id: '65000003',
    status: 'received',
    note: 'ชื่อไม่ตรงกับรหัส 65000003 (ในระบบคือ ธนโชติ จาติระดุก) - ยืนยันสิทธิ์แล้ว',
    photo_url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-08-31T10:15:00Z'),
    pickup_date: new Date('2026-08-31T12:00:00Z')
  },
  {
    tracking: 'PKG-20260825-003',
    recipient: 'พัสดุไม่ระบุชื่อชัดเจน',
    student_id: null,
    status: 'unknown',
    note: 'จ่าหน้าไม่ชัดเจน',
    photo_url: 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: true,
    broadcast_at: new Date('2026-08-25T09:00:00Z'),
    arrival_date: new Date('2026-08-25T08:00:00Z')
  },
  {
    tracking: 'PKG-20260824-007',
    recipient: 'มงคล อาษากิจ',
    student_id: '65000004',
    status: 'pending',
    note: '',
    photo_url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-08-24T09:30:00Z')
  }
];

const seedDatabaseIfEmpty = async () => {
  try {
    // 1. ตรวจสอบข้อมูลนักศึกษา (Students)
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      const mockStudentsPath = path.resolve(__dirname, '../../../mockup-data/mock_students.json');
      if (fs.existsSync(mockStudentsPath)) {
        const raw = fs.readFileSync(mockStudentsPath, 'utf-8');
        const studentsData = JSON.parse(raw);
        await Student.insertMany(studentsData);
        console.log(`🌱 [Seed] บันทึกข้อมูลนักศึกษาเริ่มต้น ${studentsData.length} รายการลง MongoDB สำเร็จ`);
      }
    }

    // 2. ตรวจสอบข้อมูลพัสดุ (Packages)
    const packageCount = await Package.countDocuments();
    if (packageCount === 0) {
      await Package.insertMany(initialDatabasePackages);
      console.log(`🌱 [Seed] บันทึกข้อมูลพัสดุเริ่มต้น ${initialDatabasePackages.length} รายการลง MongoDB สำเร็จ`);
    }
  } catch (err) {
    console.warn('⚠️ [Seed] เกิดข้อผิดพลาดในการตรวจสอบ/บันทึกข้อมูลเริ่มต้น:', err.message);
  }
};

module.exports = {
  initialDatabasePackages,
  seedDatabaseIfEmpty
};
