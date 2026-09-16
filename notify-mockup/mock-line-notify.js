/**
 * mock-line-notify.js
 * โมดูลจำลองการทำงานของ LINE Bot / LINE Notify (TSK-04: Notify Mockup Developer)
 */

// รูปแบบ Template ข้อความจำลอง LINE Notify
function formatLineMessage({ type, studentName, tracking, recipient, room, building, lineId, arrivalDate, hoursPassed = 0 }) {
  if (type === 'reminder_5h') {
    return `⚠️ [แจ้งเตือนซ้ำ: พัสดุค้างรับเกิน 5 ชั่วโมง]
สวัสดีคุณ ${studentName} (ห้อง ${room || '-'} ตึก ${building || '-'})
-----------------------------------
📦 เลขพัสดุ: ${tracking}
📅 เวลาที่รับเข้า: ${arrivalDate ? new Date(arrivalDate).toLocaleString('th-TH') : 'ไม่ระบุ'}
⏳ ค้างรับมาแล้วกว่า: ${hoursPassed} ชั่วโมง
🏢 สถานที่รับ: ห้องธุรการหอพัก
📲 ส่งตรงถึง LINE: @${lineId}
-----------------------------------
⚠️ พัสดุของท่านยังไม่ได้รับการติดต่อขอรับ กรุณาติดต่อรับพัสดุและลงลายมือชื่อดิจิทัลโดยเร็วครับ`;
  }

  // ค่าเริ่มต้น: แจ้งเตือนพัสดุมาถึงใหม่ (Task 13 / FR-02)
  return `🔔 [แจ้งเตือนพัสดุหอพัก]
สวัสดีคุณ ${studentName} (ห้อง ${room || '-'} ตึก ${building || '-'})
มีพัสดุใหม่มาถึงหอพักแล้ว!
-----------------------------------
📦 เลขพัสดุ: ${tracking}
👤 ชื่อผู้รับบนกล่อง: ${recipient || studentName}
🏢 สถานที่รับ: ห้องธุรการหอพัก
📅 เวลาบันทึกเข้า: ${arrivalDate ? new Date(arrivalDate).toLocaleString('th-TH') : new Date().toLocaleString('th-TH')}
📲 ส่งไปยัง LINE ID: @${lineId}
-----------------------------------
⚠️ กรุณาเตรียมหลักฐานและเซ็นรับพัสดุผ่านระบบดิจิทัล`;
}

// จำลองการส่งข้อความไปยัง LINE webhook / app
function mockSendNotification({ lineId, studentName, tracking, recipient, room, building, arrivalDate, type = 'personal_arrival', hoursPassed = 0 }) {
  const message = formatLineMessage({ type, studentName, tracking, recipient, room, building, lineId, arrivalDate, hoursPassed });
  
  console.log('\n======================================================');
  console.log(`📱 [MOCK LINE NOTIFY: ${type === 'reminder_5h' ? 'แจ้งเตือนซ้ำ 5 ชม.' : 'พัสดุมาถึงใหม่'}] ส่งถึง: @${lineId}`);
  console.log('======================================================');
  console.log(message);
  console.log('======================================================\n');

  return {
    success: true,
    target: `@${lineId}`,
    type,
    tracking,
    sentAt: new Date().toISOString(),
    message
  };
}

module.exports = {
  formatLineMessage,
  mockSendNotification
};
