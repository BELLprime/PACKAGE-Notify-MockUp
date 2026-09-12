const Package = require('../models/Package');
const Student = require('../models/Student');
const { verifyStudentByName } = require('./studentController');
const { sendPersonalNotification } = require('../services/notificationService');

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
const getUnknownPackages = async (req, res) => {
  try {
    const unknownPackages = await Package.find({ status: 'unknown' }).sort({ arrival_date: -1 });
    return res.status(200).json({
      success: true,
      count: unknownPackages.length,
      lastUpdateTime: lastDataUpdateTime,
      data: unknownPackages
    });
  } catch (error) {
    console.error('❌ Error fetching unknown packages:', error);
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลพัสดุที่ไม่ทราบชื่อได้',
      error: error.message
    });
  }
};

/**
 * ดึงรายการพัสดุทั้งหมด (รองรับ Filter ?status=...)
 * GET /api/packages
 */
const getAllPackages = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('❌ Error fetching packages:', error);
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลพัสดุได้',
      error: error.message
    });
  }
};

/**
 * บันทึกพัสดุเข้าใหม่ พร้อมตรวจสอบชื่ออัตโนมัติ (FR-01) 
 * และส่งแจ้งเตือนส่วนตัวจำลองผ่าน LINE Bot ไปยังนักศึกษา (FR-02 / Task 13)
 * POST /api/packages
 */
const createPackage = async (req, res) => {
  try {
    const { tracking, recipient, photo_url, note, student_id } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุชื่อผู้รับพัสดุ'
      });
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
      note: note || (packageStatus === 'unknown' ? 'ชื่อไม่ตรงกับฐานข้อมูลนักศึกษาในหอ' : ''),
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

  } catch (error) {
    console.error('❌ Error creating package:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกพัสดุ',
      error: error.message
    });
  }
};

/**
 * สั่ง Broadcast พัสดุไม่ทราบชื่อไปยังบอร์ดกลาง (FR-04)
 * PUT /api/packages/:id/broadcast
 */
const broadcastPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const query = [
      { tracking: id },
      { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
    ].filter(q => Object.values(q)[0] !== null);

    const pkg = await Package.findOne({ $or: query });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'ไม่พบพัสดุที่ระบุ' });
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
  } catch (error) {
    console.error('❌ Broadcast error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการ Broadcast',
      error: error.message
    });
  }
};

/**
 * เจ้าหน้าที่จับคู่นักศึกษาด้วยตนเอง (Manual Match) เมื่อนักศึกษามาแสดงตัว
 * พร้อมสั่งยิงแจ้งเตือนส่วนบุคคลไปยัง LINE ทันทีที่จับคู่สำเร็จ!
 * PUT /api/packages/:id/match
 */
const manualMatchPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสนักศึกษา' });
    }

    const student = await Student.findOne({ student_id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'ไม่พบรหัสนักศึกษานี้ในฐานข้อมูล' });
    }

    const query = [
      { tracking: id },
      { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
    ].filter(q => Object.values(q)[0] !== null);

    const pkg = await Package.findOne({ $or: query });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'ไม่พบพัสดุที่ระบุ' });
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
  } catch (error) {
    console.error('❌ Manual match error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการจับคู่นักศึกษา',
      error: error.message
    });
  }
};

/**
 * ส่ง Broadcast พัสดุไม่ทราบชื่อ (รับ tracking, recipient, photoUrl, note)
 * POST /api/packages/broadcast
 */
const postBroadcast = async (req, res) => {
  try {
    const { tracking, recipient, photoUrl, note, carrier, foundLocation } = req.body;
    if (!tracking) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเลขพัสดุ' });
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
  } catch (err) {
    console.error('❌ Broadcast Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ดึงรายการพัสดุที่ถูก Broadcast ทั้งหมด (สำหรับ Student UI Broadcast Board)
 * GET /api/packages/broadcasts
 */
const getBroadcastPackages = async (req, res) => {
  try {
    const broadcasts = await Package.find({ is_broadcasted: true }).sort({ broadcast_at: -1 });
    return res.status(200).json({
      success: true,
      count: broadcasts.length,
      resetTime: lastResetTime,
      lastUpdateTime: lastDataUpdateTime,
      data: broadcasts
    });
  } catch (err) {
    console.error('❌ Get Broadcasts Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const initialDatabasePackages = [
  {
    tracking: 'PKG-20260901-001',
    recipient: 'สมชาย ใจดี',
    student_id: '65000001',
    status: 'pending',
    note: 'ชื่อไม่ตรงกับรหัส 65000001 (ในระบบคือ Natthakit Rodruean)',
    photo_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-09-01T14:30:00Z')
  },
  {
    tracking: 'PKG-20260901-002',
    recipient: 'สมหญิง ใจดี',
    student_id: '65000002',
    status: 'pending',
    note: 'Watsons Online Thailand',
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
    photo_url: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-08-31T16:45:00Z'),
    pickup_date: new Date('2026-08-31T17:30:00Z')
  },
  {
    tracking: 'PKG-20260831-009',
    recipient: 'วินัย รัตนา',
    student_id: '65000003',
    status: 'received',
    note: 'ชื่อไม่ตรงกับรหัส 65000003 (ในระบบคือ ธนโชติ จาติระดุก) - ยืนยันสิทธิ์เรียบร้อย',
    photo_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: true,
    broadcast_at: new Date('2026-08-31T16:20:00Z'),
    arrival_date: new Date('2026-08-31T10:00:00Z'),
    pickup_date: new Date('2026-08-31T18:00:00Z')
  },
  {
    tracking: 'PKG-20260825-003',
    recipient: 'พัสดุไม่ระบุชื่อชัดเจน',
    student_id: null,
    status: 'unknown',
    note: 'จ่าหน้าไม่ชัดเจน (Flash Express - เด็กหอชั้น 3)',
    photo_url: 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: true,
    broadcast_at: new Date('2026-08-25T13:15:00Z'),
    arrival_date: new Date('2026-08-25T13:15:00Z')
  },
  {
    tracking: 'PKG-20260824-007',
    recipient: 'มงคล อาษากิจ',
    student_id: '65000004',
    status: 'pending',
    note: 'Central Online Store',
    photo_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=300&q=80',
    is_broadcasted: false,
    arrival_date: new Date('2026-08-24T09:30:00Z')
  }
];

/**
 * นักศึกษาเซ็นรับพัสดุแบบดิจิทัล (Task 12 & FR-03)
 * PUT /api/packages/:id/receive
 */
const receivePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature_data, student_id } = req.body;

    const query = [
      { tracking: id },
      { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
    ].filter(q => Object.values(q)[0] !== null);

    let pkg = await Package.findOne({ $or: query });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'ไม่พบพัสดุที่ระบุ' });
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
  } catch (error) {
    console.error('❌ Receive package error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกการเซ็นรับพัสดุ',
      error: error.message
    });
  }
};

/**
 * นักศึกษาแจ้งสิทธิ์ความเป็นเจ้าของพัสดุไม่ทราบชื่อ (FR-04)
 * PUT /api/packages/:id/claim
 */
const claimPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { claimed_by, claim_proof, student_id } = req.body;

    const query = [
      { tracking: id },
      { _id: id && id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
    ].filter(q => Object.values(q)[0] !== null);

    let pkg = await Package.findOne({ $or: query });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'ไม่พบพัสดุที่ระบุ' });
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
  } catch (error) {
    console.error('❌ Claim package error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแจ้งสิทธิ์พัสดุ',
      error: error.message
    });
  }
};

/**
 * รีเซ็ตข้อมูลพัสดุและการแจ้งเตือนกลับสู่ค่าเริ่มต้น 6 รายการจริง
 * POST /api/packages/reset
 */
const resetPackages = async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

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
