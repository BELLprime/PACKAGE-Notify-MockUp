const connectDB = require('./src/config/db');
const Student = require('./src/models/Student');

const showData = async () => {
  //สั่งเชื่อมต่อฐานข้อมูล
  await connectDB();
  try {
    console.log('⏳ กำลังดึงข้อมูลนักศึกษา...');
    //ดึงข้อมูลทั้งหมดจาก collection students
    const students = await Student.find();
    console.log('✅ ข้อมูลนักศึกษาที่พบในระบบ:');
    console.log(students);
    // ดึงเสร็จแล้วสั่งปิดการรันอัตโนมัติ
    process.exit(0);
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err);
    process.exit(1);
  }
};

showData();