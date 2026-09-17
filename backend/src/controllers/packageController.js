const Package = require('../models/Package');
const Student = require('../models/Student');
const { verifyStudentByName } = require('./studentController');
const { sendPersonalNotification } = require('../services/notificationService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { initialDatabasePackages } = require('../config/seedData');

// ตัวแปรติดตามเวลาที่มีการกดรีเซ็ตระบบ และเวลาที่มีการเปลี่ยนแปลงข้อมูลล่าสุด
let lastResetTime = Date.now();
let lastDataUpdateTime = Date.now();

const touchDataUpdate = () => {
  lastDataUpdateTime = Date.now();
};

/**
 * ดึงรายการ "พัสดุที่ไม่ทราบชื่อ" ทั้งหมด (สำหรับ Task 8)
 * GET /api/packages/unknown
 */
const getUnknownPackages = asyncHandler(async (req, res) => {
  const unknownPackages = await Package.find({ status: 'unknown' }).sort({ arrival_date: -1 });
  return res.status(200).json({
    success: true,
    count: unknownPackages.length,
    lastUpdateTime: lastDataUpdateTime,
    data: unknownPackages
  });
});

/**
 * ดึงรายการพัสดุทั้งหมด (รองรับ Filter ?status=...)
 * GET /api/packages
 */
const getAllPackages = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const packages = await Package.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    count: packages.length,
    lastUpdateTime: lastDataUpdateTime,
    resetTime: lastResetTime,
    data: packages
  });
});

/**
 * บันทึกพัสดุเข้าใหม่ พร้อมตรวจสอบชื่ออัตโนมัติ (FR-01) 
 * และส่งแจ้งเตือนส่วนตัวจำลองผ่าน LINE Bot ไปยังนักศึกษา (FR-02 / Task 13)
 * POST /api/packages
 */
const createPackage = asyncHandler(async (req, res) => {
  const { tracking, recipient, photo_url, note, student_id } = req.body;

  if (!recipient || !recipient.trim()) {
    throw new AppError('กรุณาระบุชื่อผู้รับพัสดุ', 400);
  }

  // สร้าง Tracking อัตโนมัติหากไม่ได้ระบุมา
  const finalTracking = tracking || `PKG-${Date.now().toString().slice(-6)}`;

  // 1. ตรวจสอบชื่อกับฐานข้อมูลนักศึกษา (Exact Match จาก Task 7)
  let matchResult = await verifyStudentByName(recipient);
  let matchedStudent = matchResult.isMatched ? matchResult.studentData : null;

  // หากส่ง student_id มา หรือค้นหาด้วยชื่อไม่เจอ ให้ตรวจสอบจาก student_id โดยตรง
  if (!matchedStudent && student_id && student_id !== '-') {
    const student = await Student.findOne({ student_id });
    if (student) {
      matchedStudent = student;
      matchResult = { isMatched: true, studentData: student };
    }
  }

  let packageStatus = matchResult.isMatched ? 'pending' : 'unknown';
  let matchedStudentId = matchedStudent ? matchedStudent.student_id : null;

  // 2. บันทึกลงฐานข้อมูล MongoDB
  const newPackage = new Package({
    tracking: finalTracking,
    recipient: recipient.trim(),
    photo_url: photo_url || '',
    note: note || (packageStatus === 'unknown' ? 'ชื่อไม่ตรงกับฐานข้อมูลนักศึกษาในหอพัก' : ''),
    student_id: matchedStudentId,
    status: packageStatus
  });

  await newPackage.save();
  touchDataUpdate();

  // 3. จำลองการส่งแจ้งเตือนรายบุคคล (Task 13 / FR-02) เมื่อจับคู่นักศึกษาสำเร็จ
  let notificationResult = null;
  if (matchResult.isMatched && matchedStudent) {
    try {
      notificationResult = await sendPersonalNotification(matchedStudent, newPackage);
    } catch (notifyErr) {
      console.warn('⚠️ ไม่สามารถส่งแจ้งเตือนจำลองได้:', notifyErr.message);
    }
  }

  return res.status(201).json({
    success: true,
    message: packageStatus === 'unknown' 
      ? '⚠️ บันทึกพัสดุแล้ว แต่ไม่พบชื่อในระบบ (จัดเข้าหมวดพัสดุไม่ทราบชื่อ)'
      : '✅ บันทึกพัสดุและส่งแจ้งเตือน LINE หานักศึกษาเรียบร้อยแล้ว (FR-02)',
    isMatched: matchResult.isMatched,
    notification: notificationResult,
    lastUpdateTime: lastDataUpdateTime,
    data: newPackage
  });
});

/**
 * สั่ง Broadcast พัสดุไม่ทราบชื่อไปยังบอร์ดกลาง (FR-04)
 * PUT /api/packages/:id/broadcast
 */
const broadcastPackage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = [
    { tracking: id },
    { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
  ].filter(q => Object.values(q)[0] !== null);

  const pkg = await Package.findOne({ $or: query });
  if (!pkg) {
    throw new AppError('ไม่พบพัสดุที่ระบุ', 404);
  }

  pkg.is_broadcasted = true;
  pkg.broadcast_at = new Date();
  await pkg.save();
  touchDataUpdate();

  return res.status(200).json({
    success: true,
    message: `📢 จำลองการส่ง Broadcast ประกาศหาเจ้าของพัสดุ ${pkg.tracking} สำเร็จ!`,
    lastUpdateTime: lastDataUpdateTime,
    data: pkg
  });
});

/**
 * เจ้าหน้าที่จับคู่นักศึกษาด้วยตนเอง (Manual Match) เมื่อนักศึกษามาแสดงตัว
 * พร้อมสั่งยิงแจ้งเตือนส่วนบุคคลไปยัง LINE ทันทีที่จับคู่สำเร็จ!
 * PUT /api/packages/:id/match
 */
const manualMatchPackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  if (!student_id) {
    throw new AppError('กรุณาระบุรหัสนักศึกษา', 400);
  }

  const student = await Student.findOne({ student_id });
  if (!student) {
    throw new AppError('ไม่พบรหัสนักศึกษานี้ในฐานข้อมูล', 404);
  }

  const query = [
    { tracking: id },
    { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
  ].filter(q => Object.values(q)[0] !== null);

  const pkg = await Package.findOne({ $or: query });
  if (!pkg) {
    throw new AppError('ไม่พบพัสดุที่ระบุ', 404);
  }

  // อัปเดตข้อมูลพัสดุและเปลี่ยนสถานะเป็น 'pending' (รอรับพัสดุ)
  pkg.student_id = student.student_id;
  pkg.status = 'pending';
  pkg.note = `จับคู่กับนักศึกษา ${student.first_name} ${student.last_name} (${student.student_id}) เรียบร้อยแล้ว`;

  await pkg.save();
  touchDataUpdate();

  // ส่งแจ้งเตือนรายบุคคลไปยัง LINE ทันที
  let notificationResult = null;
  try {
    notificationResult = await sendPersonalNotification(student, pkg);
  } catch (notifyErr) {
    console.warn('⚠️ ไม่สามารถส่งแจ้งเตือนจำลองได้:', notifyErr.message);
  }

  return res.status(200).json({
    success: true,
    message: `✅ จับคู่พัสดุกับนักศึกษา ${student.first_name} สำเร็จ พร้อมส่งแจ้งเตือนทาง LINE`,
    notification: notificationResult,
    lastUpdateTime: lastDataUpdateTime,
    data: pkg
  });
});

/**
 * ส่ง Broadcast พัสดุไม่ทราบชื่อ (รับ tracking, recipient, photoUrl, note)
 * POST /api/packages/broadcast
 */
const postBroadcast = asyncHandler(async (req, res) => {
  const { tracking, recipient, photoUrl, note } = req.body;
  if (!tracking) {
    throw new AppError('กรุณาระบุเลขพัสดุ', 400);
  }

  let pkg = await Package.findOne({ tracking });
  if (!pkg) {
    pkg = new Package({
      tracking,
      recipient: recipient || 'พัสดุไม่ระบุชื่อชัดเจน',
      photo_url: photoUrl || '',
      note: note || '',
      status: 'unknown',
      is_broadcasted: true,
      broadcast_at: new Date()
    });
  } else {
    pkg.is_broadcasted = true;
    pkg.broadcast_at = new Date();
    if (photoUrl) pkg.photo_url = photoUrl;
  }

  await pkg.save();
  touchDataUpdate();

  return res.status(200).json({
    success: true,
    message: `📢 Broadcast พัสดุ ${pkg.tracking} ขึ้นบอร์ดนักศึกษาสำเร็จ`,
    lastUpdateTime: lastDataUpdateTime,
    data: pkg
  });
});

/**
 * ดึงรายการพัสดุที่ถูก Broadcast ทั้งหมด (สำหรับ Student UI Broadcast Board)
 * GET /api/packages/broadcasts
 */
const getBroadcastPackages = asyncHandler(async (req, res) => {
  const broadcasts = await Package.find({ is_broadcasted: true }).sort({ broadcast_at: -1 });
  return res.status(200).json({
    success: true,
    count: broadcasts.length,
    resetTime: lastResetTime,
    lastUpdateTime: lastDataUpdateTime,
    data: broadcasts
  });
});

/**
 * นักศึกษาเซ็นรับพัสดุแบบดิจิทัล (Task 12 & FR-05)
 * PUT /api/packages/:id/receive
 */
const receivePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { signature_data, student_id } = req.body;

  const query = [
    { tracking: id },
    { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
  ].filter(q => Object.values(q)[0] !== null);

  let pkg = await Package.findOne({ $or: query });
  if (!pkg) {
    throw new AppError('ไม่พบพัสดุที่ระบุ', 404);
  }

  pkg.status = 'received';
  pkg.pickup_date = new Date();
  if (signature_data) pkg.signature_data = signature_data;
  if (student_id && (!pkg.student_id || pkg.student_id === '-')) {
    pkg.student_id = student_id;
  }

  await pkg.save();
  touchDataUpdate();

  return res.status(200).json({
    success: true,
    message: `✅ ยืนยันการเซ็นรับพัสดุ ${pkg.tracking} สำเร็จและบันทึกลงฐานข้อมูลแล้ว`,
    lastUpdateTime: lastDataUpdateTime,
    data: pkg
  });
});

/**
 * นักศึกษาแจ้งสิทธิ์ความเป็นเจ้าของพัสดุไม่ทราบชื่อ (FR-04)
 * PUT /api/packages/:id/claim
 */
const claimPackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { claimed_by, claim_proof, student_id } = req.body;

  const query = [
    { tracking: id },
    { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
  ].filter(q => Object.values(q)[0] !== null);

  let pkg = await Package.findOne({ $or: query });
  if (!pkg) {
    throw new AppError('ไม่พบพัสดุที่ระบุ', 404);
  }

  pkg.status = 'claimed';
  if (claimed_by) pkg.claimed_by = claimed_by;
  if (claim_proof) pkg.claim_proof = claim_proof;
  if (student_id) pkg.student_id = student_id;

  await pkg.save();
  touchDataUpdate();

  return res.status(200).json({
    success: true,
    message: `🙋 บันทึกการแจ้งสิทธิ์พัสดุ ${pkg.tracking} ลงฐานข้อมูลแล้ว`,
    lastUpdateTime: lastDataUpdateTime,
    data: pkg
  });
});

/**
 * รีเซ็ตข้อมูลพัสดุและการแจ้งเตือนกลับสู่ค่าเริ่มต้น 6 รายการจริง
 * POST /api/packages/reset
 */
const resetPackages = asyncHandler(async (req, res) => {
  await Package.deleteMany({});
  await Package.insertMany(initialDatabasePackages);
  lastResetTime = Date.now();
  touchDataUpdate();

  return res.status(200).json({
    success: true,
    resetTime: lastResetTime,
    lastUpdateTime: lastDataUpdateTime,
    message: '🔄 รีเซ็ตฐานข้อมูลพัสดุกลับสู่ค่าเริ่มต้น 6 รายการเรียบร้อยแล้ว'
  });
});

module.exports = {
  getUnknownPackages,
  getAllPackages,
  createPackage,
  broadcastPackage,
  manualMatchPackage,
  postBroadcast,
  getBroadcastPackages,
  resetPackages,
  receivePackage,
  claimPackage
};
