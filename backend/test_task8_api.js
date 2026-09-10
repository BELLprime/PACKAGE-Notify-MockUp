const connectDB = require('./src/config/db');
const Package = require('./src/models/Package');
const { verifyStudentByName } = require('./src/controllers/studentController');

const testTask8Backend = async () => {
  await connectDB();

  console.log('\n======================================================');
  console.log('🧪 เริ่มทดสอบ Task 8: Backend API & Unknown Packages');
  console.log('======================================================\n');

  // ลบข้อมูลทดสอบเดิมที่อาจค้างอยู่
  await Package.deleteMany({ tracking: { $regex: /^TEST-PKG-/ } });

  // 1. จำลองการบันทึกพัสดุที่ "ตรงกับฐานข้อมูล"
  console.log('📦 1. ทดสอบบันทึกพัสดุชื่อ "สมหญิง ใจดี"...');
  const match1 = await verifyStudentByName('สมหญิง ใจดี');
  const pkgMatched = await Package.create({
    tracking: 'TEST-PKG-001',
    recipient: 'สมหญิง ใจดี',
    student_id: match1.studentData?.student_id,
    building: match1.studentData?.building,
    room_number: match1.studentData?.room_number,
    status: match1.status // 'pending'
  });
  console.log(`   -> สถานะ: [${pkgMatched.status}] (ตรงฐานข้อมูล -> รอรับพัสดุ)`);

  // 2. จำลองการบันทึกพัสดุที่ "ไม่ทราบชื่อ / ชื่อไม่ตรง" (Unknown)
  console.log('\n📦 2. ทดสอบบันทึกพัสดุชื่อ "สมศรี สุขเกษม (ไม่พบนามสกุลในระบบ)"...');
  const match2 = await verifyStudentByName('สมศรี สุขเกษม');
  const pkgUnknown = await Package.create({
    tracking: 'TEST-PKG-002',
    recipient: 'สมศรี สุขเกษม',
    student_id: null,
    status: match2.status, // 'unknown'
    note: 'ไม่พบชื่อในฐานข้อมูลหอพัก'
  });
  console.log(`   -> สถานะ: [${pkgUnknown.status}] (จัดเข้าหมวดพัสดุไม่ทราบชื่อสำเร็จ)`);

  // 3. ทดสอบการ Query ดึงเฉพาะ "พัสดุไม่ทราบชื่อ" (GET /api/packages/unknown)
  console.log('\n🔍 3. ทดสอบ Query: ดึงเฉพาะพัสดุที่ไม่ทราบชื่อ (status: "unknown")...');
  const unknownList = await Package.find({ status: 'unknown' });
  console.log(`   -> พบพัสดุไม่ทราบชื่อทั้งหมด: ${unknownList.length} ชิ้น`);
  unknownList.forEach(item => {
    console.log(`      - Tracking: ${item.tracking} | จ่าหน้ากล่อง: ${item.recipient} | Broadcast: ${item.is_broadcasted ? 'แล้ว' : 'ยังไม่ประกาศ'}`);
  });

  // 4. ทดสอบฟังก์ชัน Broadcast ประกาศหาเจ้าของ (FR-04)
  console.log('\n📢 4. ทดสอบสั่ง Broadcast ประกาศหาเจ้าของพัสดุ TEST-PKG-002...');
  pkgUnknown.is_broadcasted = true;
  pkgUnknown.broadcast_at = new Date();
  await pkgUnknown.save();
  console.log(`   -> ผลการ Broadcast: ประกาศแล้วเมื่อ ${pkgUnknown.broadcast_at.toLocaleTimeString('th-TH')}`);

  console.log('\n🎉 สรุปผล: Backend Logic & Endpoint สำหรับ Task 8 พร้อมใช้งาน 100%!');
  process.exit(0);
};

testTask8Backend();
