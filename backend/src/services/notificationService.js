const Notification = require('../models/Notification');
const Package = require('../models/Package');
const Student = require('../models/Student');

/**
 * Task 13: โมดูลจำลองการส่งแจ้งเตือนรายบุคคล (Personal Notification Mockup - FR-02)
 * จำลองการยิงข้อความไปยัง LINE Bot / LINE Notify ของนักศึกษาเจ้าของพัสดุเมื่อพัสดุมาถึง
 */
const sendPersonalNotification = async (student, packageItem) => {
  try {
    const studentName = `${student.first_name} ${student.last_name}`;
    const lineId = student.line_user_id || 'UNKNOWN_LINE';
    const trackingNo = packageItem.tracking;

    const title = `📦 พัสดุของคุณมาถึงหอพักแล้ว! (${trackingNo})`;
    const message = 
`🔔 [แจ้งเตือนพัสดุหอพัก]
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

    console.log('\n======================================================');
    console.log(`📱 [MOCK LINE BOT: พัสดุมาถึงใหม่] ส่งถึง: @${lineId}`);
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
 * Task 14: ส่งแจ้งเตือนซ้ำเมื่อพัสดุค้างรับเกิน 5 ชั่วโมง (FR-03)
 */
const sendReminderNotification = async (student, packageItem, hoursPassed = 5) => {
  try {
    const studentName = `${student.first_name} ${student.last_name}`;
    const lineId = student.line_user_id || 'UNKNOWN_LINE';
    const trackingNo = packageItem.tracking;

    const title = `⚠️ แจ้งเตือนซ้ำ: พัสดุ ${trackingNo} ค้างรับเกิน ${hoursPassed} ชั่วโมง`;
    const message = 
`⚠️ [แจ้งเตือนซ้ำ: พัสดุค้างรับเกิน 5 ชั่วโมง]
สวัสดีคุณ ${studentName} (ห้อง ${student.room_number || '-'} ตึก ${student.building || '-'})
-----------------------------------
📦 เลขพัสดุ: ${trackingNo}
📅 เวลาที่รับเข้า: ${new Date(packageItem.arrival_date).toLocaleString('th-TH')}
⏳ ค้างรับมาแล้วกว่า: ${hoursPassed} ชั่วโมง
🏢 สถานที่รับ: ห้องธุรการหอพัก
📲 ส่งตรงถึง LINE: @${lineId}
-----------------------------------
⚠️ พัสดุของท่านยังไม่ได้รับการติดต่อขอรับ กรุณาติดต่อรับพัสดุและลงลายมือชื่อดิจิทัลโดยเร็วครับ`;

    // 1. บันทึกประวัติการแจ้งเตือนซ้ำลง Collection notifications
    const notification = new Notification({
      student_id: student.student_id,
      line_user_id: lineId,
      package_id: packageItem._id,
      tracking: trackingNo,
      type: 'reminder_5h',
      title: title,
      message: message,
      sent_at: new Date(),
      status: 'delivered'
    });

    await notification.save();

    // 2. อัปเดตสถานะในพัสดุว่าแจ้งเตือนซ้ำแล้ว
    packageItem.reminder_sent = true;
    packageItem.reminder_sent_at = new Date();
    await packageItem.save();

    console.log('\n======================================================');
    console.log(`⏰ [MOCK LINE BOT: แจ้งเตือนซ้ำ 5 ชม.] ส่งถึง: @${lineId}`);
    console.log('======================================================');
    console.log(message);
    console.log('======================================================\n');

    return {
      success: true,
      deliveredTo: `@${lineId}`,
      tracking: trackingNo,
      hoursPassed,
      notification
    };
  } catch (error) {
    console.error('❌ Error sending reminder notification:', error);
    throw error;
  }
};

/**
 * Task 14: ฟังก์ชันสแกนและส่งแจ้งเตือนซ้ำอัตโนมัติ (Automated 5-Hour Overdue Scanner)
 * @param {number} thresholdHours - เกณฑ์เวลาที่นับว่าค้างรับ (ค่าเริ่มต้นตามสเปก FR-03 คือ 5 ชั่วโมง)
 * @param {boolean} force - บังคับส่งซ้ำแม้เคยส่งไปแล้ว
 */
const checkAndSendOverdueReminders = async (thresholdHours = 5, force = false) => {
  try {
    const now = new Date();
    const thresholdMs = thresholdHours * 60 * 60 * 1000;

    // ค้นหาพัสดุที่:
    // 1. ยังไม่ได้รับ (status: 'pending')
    // 2. ผูกกับนักศึกษาแล้ว (student_id != null)
    // 3. ยังไม่เคยส่งเตือนซ้ำ (หรือ force = true)
    const query = {
      status: 'pending',
      student_id: { $ne: null }
    };

    if (!force) {
      query.reminder_sent = { $ne: true };
    }

    const pendingPackages = await Package.find(query);
    const reminderResults = [];

    for (const pkg of pendingPackages) {
      const arrivalTime = new Date(pkg.arrival_date).getTime();
      const timeDiffMs = now.getTime() - arrivalTime;
      const hoursPassed = (timeDiffMs / (1000 * 60 * 60)).toFixed(1);

      // ถ้าค้างรับเกินเกณฑ์เวลาที่กำหนด (>= 5 ชม.)
      if (timeDiffMs >= thresholdMs) {
        const student = await Student.findOne({ student_id: pkg.student_id });
        if (student) {
          const sent = await sendReminderNotification(student, pkg, Math.floor(hoursPassed) || thresholdHours);
          reminderResults.push(sent);
        }
      }
    }

    return {
      success: true,
      scannedCount: pendingPackages.length,
      remindersSentCount: reminderResults.length,
      thresholdHours,
      results: reminderResults
    };
  } catch (error) {
    console.error('❌ Error checking overdue reminders:', error);
    throw error;
  }
};

/**
 * ดึงรายการแจ้งเตือนของนักศึกษาเฉพาะราย (สำหรับ Task 12)
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
  sendReminderNotification,
  checkAndSendOverdueReminders,
  getNotificationsByStudent,
  getAllNotifications
};
