const Notification = require('../models/Notification');

/**
 * Task 13: โมดูลจำลองการส่งแจ้งเตือนรายบุคคล (Personal Notification Mockup - FR-02)
 * จำลองการยิงข้อความไปยัง LINE Bot / LINE Notify ของนักศึกษาเจ้าของพัสดุ
 * 
 * @param {Object} student - ข้อมูลนักศึกษาจากฐานข้อมูล
 * @param {Object} packageItem - ข้อมูลพัสดุที่เพิ่งบันทึกเข้าระบบ
 * @returns {Promise<Object>} ข้อมูล Notification ที่ถูกสร้างและบันทึก
 */
const sendPersonalNotification = async (student, packageItem) => {
  try {
    const studentName = `${student.first_name} ${student.last_name}`;
    const lineId = student.line_user_id || 'UNKNOWN_LINE';
    const trackingNo = packageItem.tracking;

    const title = `📦 พัสดุของคุณมาถึงหอพักแล้ว! (${trackingNo})`;
    const message = 
`!!![แจ้งเตือนพัสดุหอพัก]
สวัสดีคุณ ${studentName} (ห้อง ${student.room_number || '-'} ตึก ${student.building || '-'})
มีพัสดุใหม่มาถึงหอพักแล้ว!
-----------------------------------
📦 เลขพัสดุ: ${trackingNo}
👤 ชื่อผู้รับบนกล่อง: ${packageItem.recipient}
🏢 สถานที่รับ: ห้องธุรการหอพัก
📅 เวลาบันทึกเข้า: ${new Date(packageItem.arrival_date || Date.now()).toLocaleString('th-TH')}
📲 ส่งไปยัง LINE ID: @${lineId}
-----------------------------------
⚠️ กรุณาเตรียมหลักฐานและเซ็นรับพัสดุผ่านระบบดิจิทัล`;

    // 1. บันทึกประวัติการส่งแจ้งเตือนลงฐานข้อมูล MongoDB
    const notification = new Notification({
      student_id: student.student_id,
      line_user_id: lineId,
      package_id: packageItem._id,
      tracking: trackingNo,
      type: 'personal_arrival',
      title: title,
      message: message,
      sent_at: new Date(),
      status: 'delivered'
    });

    await notification.save();

    // 2. จำลองการแสดงผล Log การส่งแจ้งเตือนออกทาง Console
    console.log('\n======================================================');
    console.log(`📱 [MOCK LINE BOT] ส่งการแจ้งเตือนไปยัง: @${lineId}`);
    console.log('======================================================');
    console.log(message);
    console.log('======================================================\n');

    return {
      success: true,
      deliveredTo: `@${lineId}`,
      student_id: student.student_id,
      tracking: trackingNo,
      notification
    };
  } catch (error) {
    console.error('❌ Error sending personal notification:', error);
    throw error;
  }
};

/**
 * ดึงรายการแจ้งเตือนของนักศึกษาเฉพาะราย (สำหรับ Task 12: UI แสดงสถานะแจ้งเตือน)
 */
const getNotificationsByStudent = async (studentId) => {
  return await Notification.find({ student_id: studentId }).sort({ sent_at: -1 });
};

/**
 * ดึงรายการแจ้งเตือนทั้งหมดในระบบ
 */
const getAllNotifications = async () => {
  return await Notification.find().sort({ sent_at: -1 });
};

module.exports = {
  sendPersonalNotification,
  getNotificationsByStudent,
  getAllNotifications
};
