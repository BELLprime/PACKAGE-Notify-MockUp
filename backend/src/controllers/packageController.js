const Package = require('../models/Package');
const Student = require('../models/Student');
const { verifyStudentByName } = require('./studentController');
const { sendPersonalNotification } = require('../services/notificationService');

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
    const { tracking, recipient, photo_url, note } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุชื่อผู้รับพัสดุ'
      });
    }

    // สร้าง Tracking อัตโนมัติหากไม่ได้ระบุมา
    const finalTracking = tracking || `PKG-${Date.now().toString().slice(-6)}`;

    // 1. ตรวจสอบชื่อกับฐานข้อมูลนักศึกษา (Exact Match จาก Task 7)
    const matchResult = await verifyStudentByName(recipient);

    let packageStatus = 'unknown';
    let matchedStudentId = null;

    if (matchResult.isMatched) {
      packageStatus = 'pending'; // พบชื่อ -> รอรับพัสดุ
      matchedStudentId = matchResult.studentData.student_id;
    } else {
      packageStatus = 'unknown'; // ไม่พบชื่อ -> พัสดุไม่ทราบชื่อ (FR-01)
    }

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

    // 3. จำลองการส่งแจ้งเตือนรายบุคคล (Task 13 / FR-02) เมื่อจับคู่นักศึกษาสำเร็จ
    let notificationResult = null;
    if (matchResult.isMatched && matchResult.studentData) {
      try {
        notificationResult = await sendPersonalNotification(matchResult.studentData, newPackage);
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

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'ไม่พบพัสดุที่ระบุ' });
    }

    pkg.is_broadcasted = true;
    pkg.broadcast_at = new Date();
    await pkg.save();

    return res.status(200).json({
      success: true,
      message: `📢 จำลองการส่ง Broadcast ประกาศหาเจ้าของพัสดุ ${pkg.tracking} สำเร็จ!`,
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

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'ไม่พบพัสดุที่ระบุ' });
    }

    // อัปเดตข้อมูลพัสดุและเปลี่ยนสถานะเป็น 'pending' (รอรับพัสดุ)
    pkg.student_id = student.student_id;
    pkg.status = 'pending';
    pkg.note = `จับคู่กับนักศึกษา ${student.first_name} ${student.last_name} (${student.student_id}) เรียบร้อยแล้ว`;

    await pkg.save();

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

module.exports = {
  getUnknownPackages,
  getAllPackages,
  createPackage,
  broadcastPackage,
  manualMatchPackage
};
