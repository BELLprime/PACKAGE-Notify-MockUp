/**
 * mock-line-notify.js
 * โมดูลจำลองการทำงานของ LINE Bot / LINE Notify (TSK-04: Notify Mockup Developer)
 */

// รูปแบบ Template ข้อความจำลอง LINE Notify
function formatLineMessage({ type, studentName, tracking, room, building, lineId, hoursPassed = 0 }) {
  if (type === 'reminder_5h') {
    return `⚠️ [แจ้งเตือนซ้ำ: พัสดุค้างรับเกิน 5 ชม.]
สวัสดีคุณ ${studentName}
พัสดุของคุณ (เลขที่ ${tracking}) ค้างรับอยู่ที่ห้องธุรการนานกว่า ${hoursPassed} ชั่วโมงแล้ว
📅 กรุณาติดต่อรับพัสดุและลงลายมือชื่อดิจิทัลโดยเร็วครับ`;
  }

  // ค่าเริ่มต้น: แจ้งเตือนพัสดุมาถึงใหม่ (Task 13)
  return `🔔 [แจ้งเตือนพัสดุหอพัก]
สวัสดีคุณ ${studentName} (ห้อง ${room || '-'} ตึก ${building || '-'})
มีพัสดุใหม่มาถึงหอพักแล้ว!
-----------------------------------
เลขพัสดุ: ${tracking}
สถานที่รับ: ห้องธุรการหอพัก
ส่งตรงถึง LINE: @${lineId}
-----------------------------------
กรุณานำหลักฐานมารับพัสดุและเซ็นรับผ่านระบบดิจิทัล`;
}

// จำลองการส่งข้อความไปยัง LINE webhook / app
function mockSendNotification({ lineId, studentName, tracking, room, building, type = 'personal_arrival', hoursPassed = 0 }) {
  const message = formatLineMessage({ type, studentName, tracking, room, building, lineId, hoursPassed });
  
  console.log('\n=============================================');
  console.log(`💬 [LINE MOCKUP] แจ้งเตือนส่งถึง: @${lineId}`);
  console.log('=============================================');
  console.log(message);
  console.log('=============================================\n');

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
