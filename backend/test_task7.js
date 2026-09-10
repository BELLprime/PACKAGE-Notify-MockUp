const connectDB = require('./src/config/db');
const { verifyStudentByName } = require('./src/controllers/studentController');

const runTest = async () => {
  await connectDB();

  console.log('\n=============================================');
  console.log('🧪 เริ่มทดสอบ Task 7: Logic ตรวจสอบชื่อผู้รับ');
  console.log('=============================================\n');

  const testCases = [
    'สมหญิง ใจดี',
    'Natthakit Rodruean',
    'ธนโชติ จาติระดุก',
    'มงคล อาษากิจ',
    'คนแปลกหน้า ไม่มีในหอ',
    'สมหญิง',
    'Pama'
  ];

  for (const name of testCases) {
    console.log(`🔍 ค้นหาชื่อ: "${name}"`);
    const result = await verifyStudentByName(name);
    if (result.isMatched) {
      console.log(`   สถานะ: ${result.message}`);
      console.log(`   รหัสนักศึกษา: ${result.studentData.student_id} | ห้อง: ${result.studentData.room_number} | LINE ID: ${result.studentData.line_user_id}`);
      console.log(`   สถานะพัสดุ: [${result.status}]`);
    } else {
      console.log(`   สถานะ: ${result.message}`);
      console.log(`   สถานะพัสดุ: [${result.status}] -> ต้องนำส่งเข้าบอร์ดพัสดุไม่ทราบชื่อ`);
    }
    console.log('---------------------------------------------');
  }

  console.log('\n🎉 สรุปผล: การทดสอบ Logic Task 7 เสร็จสมบูรณ์!');
  process.exit(0);
};

runTest();
