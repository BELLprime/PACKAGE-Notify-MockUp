#!/usr/bin/env node
/**
 * ENGSE205 Task 17 — Automated System Test Checker
 * รันชุดการทดสอบตามเอกสาร Documents/Test-Cases.md (DOC-TC-ENGSE205-01) แบบอัตโนมัติ
 * ยิง request จริงเข้า Backend (Express + MongoDB) ด้วย supertest และตรวจ log ของ Mock LINE Notify
 *
 * ต้องเปิด MongoDB ก่อน (mongodb://127.0.0.1:27017/package_notify_db หรือกำหนด MONGO_URI)
 *
 * ใช้:  node check-testcases.mjs
 *      node check-testcases.mjs --only=FR02     (แสดงเฉพาะหมวด FR01..FR05 / INT / NFR / EXTRA)
 *      node check-testcases.mjs --verbose       (แสดง log ของ Backend ระหว่างทดสอบด้วย)
 *      node check-testcases.mjs --keep          (ไม่ลบข้อมูลทดสอบออกจากฐานข้อมูลหลังรันเสร็จ)
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(ROOT, 'backend');
// ใช้ require ของ backend เพื่อให้ได้ mongoose / supertest ตัวเดียวกับที่ app ใช้
const require = createRequire(path.join(BACKEND, 'package.json'));

const ARGS = process.argv.slice(2);
const VERBOSE = ARGS.includes('--verbose');
const KEEP = ARGS.includes('--keep');
const ONLY = (ARGS.find((a) => a.startsWith('--only='))?.split('=')[1] ?? '').toUpperCase();

// ทุกเลขพัสดุที่สร้างในรอบนี้จะต่อท้ายด้วย RUN เพื่อไม่ชน unique และลบทิ้งได้ง่าย
const RUN = Date.now().toString(36).toUpperCase();
const T = (base) => `${base}-${RUN}`;

const results = [];
const groupOf = (tc) => (tc.startsWith('EXTRA') ? 'EXTRA'
  : tc.startsWith('TC-NFR') ? 'NFR' : tc.startsWith('TC-INT') ? 'INT' : tc.slice(3, 7)); // TC-FR01-01 → FR01
const rec = (tc, name, ok, detail = '') => results.push({ tc, group: groupOf(tc), name, ok: !!ok, detail });
const read = async (p) => { try { return await readFile(path.join(ROOT, p), 'utf8'); } catch { return ''; } };
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const has = (s, ...f) => f.every((x) => new RegExp(x, 'i').test(s));
const enc = encodeURIComponent;

// ── ชุดข้อมูลทดสอบ (Test Data Set ตามเอกสาร) ──
const SOMYING = { name: 'สมหญิง ใจดี', building: 'S20', room: '202', line: 'Pama' };
const SOMCHAI = { name: 'สมชาย รักเรียน', building: 'A1', room: '101', line: 'Somchai' };
const UNKNOWN_NAME = 'นายไม่มี ในระบบ';
const BLURRED_NAME = 'ชื่อเลือนราง อ่านไม่ออก';
const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const PHOTO = PNG_1PX;
const SIGNATURE = PNG_1PX;

const TITLES = {
  'TC-FR01-01': 'ตรวจสอบชื่อนักศึกษาที่มีในฐานข้อมูล (Exact Match)',
  'TC-FR01-02': 'ตรวจสอบชื่อนักศึกษาที่ไม่มีในฐานข้อมูล (Unmatched Name)',
  'TC-FR01-03': 'การบันทึกพัสดุกรณีชื่อตรง พร้อมอัปโหลดรูปถ่าย',
  'TC-FR01-04': 'การบันทึกพัสดุไม่ทราบชื่อ (Unknown Package)',
  'TC-FR01-05': 'ตรวจสอบความถูกต้องของฟอร์ม (Validation ป้องกันข้อมูลว่าง)',
  'TC-FR02-01': 'การส่ง LINE Notify จำลองอัตโนมัติทันทีเมื่อบันทึกพัสดุ',
  'TC-FR02-02': 'ความถูกต้องของเนื้อหาข้อความแจ้งเตือน (Message Contract)',
  'TC-FR02-03': 'พัสดุไม่ทราบชื่อต้องไม่ส่งแจ้งเตือนส่วนบุคคล',
  'TC-FR03-01': 'การตรวจสอบพัสดุที่ค้างรับเกิน 5 ชั่วโมง',
  'TC-FR03-02': 'ตรวจสอบข้อความเตือนเร่งรัดการรับพัสดุ',
  'TC-FR03-03': 'พัสดุที่รับไปแล้ว (received) ต้องไม่ถูกแจ้งเตือนซ้ำ',
  'TC-FR04-01': 'เจ้าหน้าที่กด Broadcast พัสดุไม่ทราบชื่อขึ้นบอร์ดกลาง',
  'TC-FR04-02': 'นักศึกษาเข้าดูพัสดุบนกระดานประกาศ (Broadcast Board)',
  'TC-FR04-03': 'นักศึกษากดยื่นขอเคลมพัสดุจากบอร์ดกลาง',
  'TC-FR04-04': 'ตรวจสอบความถูกต้องของการอัปเดตข้อมูล (Data Sync)',
  'TC-FR05-01': 'การค้นหาพัสดุของตนเองใน Student UI',
  'TC-FR05-02': 'การเปิด Modal เซ็นชื่อดิจิทัลและทดสอบวาดลายเซ็น',
  'TC-FR05-03': 'การกดยืนยันเซ็นรับพัสดุและการบันทึกลายเซ็น',
  'TC-FR05-04': 'ป้องกันการกดยืนยันหากยังไม่ได้ลงลายมือชื่อ (Validation)',
  'TC-INT-01': 'Full Lifecycle พัสดุปกติ (ชื่อตรง 100%)',
  'TC-INT-02': 'Full Lifecycle พัสดุไม่ทราบชื่อ (Unknown & Claim Workflow)',
  'TC-NFR01-01': 'ความเร็วในการส่งแจ้งเตือน (Notification Latency < 1 นาที)',
  'TC-NFR02-01': 'ความคงอยู่ของข้อมูล (Data Persistence & Historical Retrieval)',
};

// ── ดักจับ log ของ Backend (console.log ของ Mock LINE Notify / morgan) ──
const LOG = [];
const realOut = process.stdout.write.bind(process.stdout);
const realErr = process.stderr.write.bind(process.stderr);
const hook = (real) => (chunk, encoding, cb) => {
  LOG.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
  if (VERBOSE) return real(chunk, encoding, cb);
  if (typeof encoding === 'function') encoding(); else if (typeof cb === 'function') cb();
  return true;
};
const capture = () => { process.stdout.write = hook(realOut); process.stderr.write = hook(realErr); };
const release = () => { process.stdout.write = realOut; process.stderr.write = realErr; };
const mark = () => LOG.length;
const logSince = (m) => LOG.slice(m).join('');
const say = (msg = '') => realOut(msg + '\n');
const withTimeout = (p, ms, msg) => Promise.race([
  p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms).unref()),
]);

// ── เปิด API + เชื่อมต่อ MongoDB ──
let app = null, request = null, mongoose = null, connectDB = null, Package = null, Notification = null, Student = null;
async function setup() {
  try {
    if (!existsSync(path.join(BACKEND, 'node_modules'))) throw new Error('ยังไม่ได้ npm install ในโฟลเดอร์ backend');
    request = require('supertest');
    mongoose = require('mongoose');
    connectDB = require('./src/config/db');
    app = require('./src/app');
    Package = require('./src/models/Package');
    Notification = require('./src/models/Notification');
    Student = require('./src/models/Student');
    capture();
    await withTimeout(connectDB(), 10000, 'เชื่อมต่อ MongoDB ไม่สำเร็จภายใน 10 วินาที');
    await Student.updateOne(
      { student_id: '651234567-1' },
      {
        $set: {
          student_id: '651234567-1',
          first_name: 'สมชาย',
          last_name: 'รักเรียน',
          building: SOMCHAI.building,
          room_number: SOMCHAI.room,
          line_user_id: SOMCHAI.line,
        },
      },
      { upsert: true }
    );
    return true;
  } catch (e) {
    release();
    say(`\n❌ เปิด API ไม่ได้: ${e.message}`);
    say('   ตรวจว่าเปิด MongoDB แล้ว และรัน npm install ในโฟลเดอร์ backend แล้ว\n');
    return false;
  }
}
const safe = async (fn) => { try { return await fn(); } catch (e) { return { status: 0, body: {}, _e: e.message }; } };
const get = (url) => safe(() => request(app).get(url));
const post = (url, body = {}) => safe(() => request(app).post(url).send(body));
const put = (url, body = {}) => safe(() => request(app).put(url).send(body));
const findPkg = async (tracking) => (await get('/api/packages')).body?.data?.find((p) => p.tracking === tracking);
const sameLine = (a = '', b = '') => a.replace(/^@/, '') === b.replace(/^@/, '');

// ── อ่านไฟล์ Frontend สำหรับตรวจส่วนที่เป็น UI (Static check) ──
const staffForm = strip(await read('frontend/staff/src/components/PackageForm.jsx'));
const staffUnknown = strip(await read('frontend/staff/src/components/UnknownPackages.jsx'));
const studentBoard = strip(await read('frontend/student/src/components/BroadcastBoard.jsx'));
const studentApp = strip(await read('frontend/student/src/App.jsx'));

if (await setup()) {
  let r, m;

  // ════════════════════ หมวดที่ 1: FR-01 — บันทึกและตรวจสอบชื่อนักศึกษา ════════════════════

  // TC-FR01-01 · ชื่อตรงกับฐานข้อมูล
  r = await get(`/api/students/verify?name=${enc(SOMYING.name)}`);
  const sd = r.body?.studentData;
  rec('TC-FR01-01', `ตรวจชื่อ "${SOMYING.name}" → พบข้อมูลนักศึกษาในระบบ (isMatched: true)`,
    r.status === 200 && r.body?.isMatched === true, `ได้ ${r.status} · isMatched=${r.body?.isMatched}`);
  rec('TC-FR01-01', `Auto-fill อาคาร ${SOMYING.building} · ห้อง ${SOMYING.room} · LINE @${SOMYING.line}`,
    sd?.building === SOMYING.building && sd?.room_number === SOMYING.room && sameLine(sd?.line_user_id, SOMYING.line),
    sd ? `ได้ ตึก ${sd.building} ห้อง ${sd.room_number} LINE @${sd.line_user_id}` : 'ไม่มี studentData');
  const SOMYING_ID = sd?.student_id ?? '65000002';

  // TC-FR01-02 · ชื่อไม่มีในฐานข้อมูล
  r = await get(`/api/students/verify?name=${enc(UNKNOWN_NAME)}`);
  rec('TC-FR01-02', `ตรวจชื่อ "${UNKNOWN_NAME}" → ไม่พบข้อมูลนักศึกษา (isMatched: false)`,
    r.status === 200 && r.body?.isMatched === false, `ได้ ${r.status} · isMatched=${r.body?.isMatched}`);
  rec('TC-FR01-02', 'ระบบแนะนำให้จัดเข้าหมวดพัสดุไม่ทราบชื่อ (status: unknown)',
    r.body?.status === 'unknown', `ได้ status=${r.body?.status}`);

  // TC-FR01-03 · บันทึกพัสดุชื่อตรง + รูปถ่าย (ใช้วัดเวลา NFR-01 ด้วย)
  const TRK_MAIN = T('TH1234567890');
  m = mark();
  const t0 = performance.now();
  r = await post('/api/packages', { tracking: TRK_MAIN, recipient: SOMYING.name, photo_url: PHOTO });
  const createMs = performance.now() - t0;
  const createLog = logSince(m);
  const mainPkg = r.body?.data;
  const mainNotify = r.body?.notification;
  rec('TC-FR01-03', 'บันทึกพัสดุ TH1234567890 → 201 บันทึกพัสดุสำเร็จ',
    r.status === 201 && r.body?.success === true, `ได้ ${r.status}${r.body?.error ? ' · ' + r.body.error : ''}`);
  rec('TC-FR01-03', 'สถานะพัสดุเป็น pending และผูกกับรหัสนักศึกษาอัตโนมัติ',
    mainPkg?.status === 'pending' && mainPkg?.student_id === SOMYING_ID,
    `status=${mainPkg?.status} · student_id=${mainPkg?.student_id}`);
  rec('TC-FR01-03', 'รูปถ่ายพัสดุถูกบันทึกลงฐานข้อมูล (photo_url)', mainPkg?.photo_url === PHOTO);
  r = await get('/api/packages?status=pending');
  rec('TC-FR01-03', 'รายการไปปรากฏในแท็บจัดการพัสดุ สถานะรอรับ (GET /api/packages?status=pending)',
    r.body?.data?.some?.((p) => p.tracking === TRK_MAIN));

  // TC-FR01-04 · บันทึกพัสดุไม่ทราบชื่อ
  r = await get('/api/packages/unknown');
  const unkBefore = r.body?.count;
  const TRK_UNK = T('UNK-998877');
  m = mark();
  const unkRes = await post('/api/packages', { tracking: TRK_UNK, recipient: UNKNOWN_NAME, photo_url: PHOTO });
  const unkCreateLog = logSince(m);
  rec('TC-FR01-04', 'บันทึกพัสดุชื่อไม่ตรง → 201 และกำหนดสถานะเป็น unknown',
    unkRes.status === 201 && unkRes.body?.data?.status === 'unknown' && unkRes.body?.isMatched === false,
    `ได้ ${unkRes.status} · status=${unkRes.body?.data?.status}`);
  r = await get('/api/packages/unknown');
  rec('TC-FR01-04', 'พัสดุไปแสดงในแท็บพัสดุไม่ทราบชื่อ (GET /api/packages/unknown)',
    r.body?.data?.some?.((p) => p.tracking === TRK_UNK));
  rec('TC-FR01-04', 'ตัวเลข StatCard "พัสดุไม่ทราบชื่อ" เพิ่มขึ้น 1 ชิ้น',
    typeof unkBefore === 'number' && r.body?.count === unkBefore + 1, `ก่อน ${unkBefore} → หลัง ${r.body?.count}`);

  // TC-FR01-05 · Validation ข้อมูลว่าง
  r = await get('/api/packages');
  const totalBefore = r.body?.count;
  r = await post('/api/packages', {});
  rec('TC-FR01-05', 'กดบันทึกโดยไม่กรอกข้อมูล → 400 ไม่อนุญาตให้บันทึก',
    r.status === 400 && r.body?.success === false, `ได้ ${r.status}`);
  const errMsg = r.body?.error ?? r.body?.message ?? '';
  rec('TC-FR01-05', 'แสดงข้อความแจ้งเตือน "กรุณา...ชื่อผู้รับ"', /กรุณา.*ผู้รับ/.test(errMsg), `ได้ "${errMsg}"`);
  r = await post('/api/packages', { tracking: '   ', recipient: '   ' });
  rec('TC-FR01-05', 'กรอกเฉพาะช่องว่าง (whitespace) → 400', r.status === 400, `ได้ ${r.status}`);
  r = await get('/api/packages');
  rec('TC-FR01-05', 'ไม่มีระเบียนข้อมูลเปล่าถูกสร้างในฐานข้อมูล',
    typeof totalBefore === 'number' && r.body?.count === totalBefore, `ก่อน ${totalBefore} → หลัง ${r.body?.count}`);
  rec('TC-FR01-05', 'ฟอร์ม Staff บังคับกรอก "เลขพัสดุ" และ "ชื่อผู้รับ" (required)',
    /name="tracking"[\s\S]{0,250}?required/.test(staffForm) && /name="recipient"[\s\S]{0,300}?required/.test(staffForm),
    'ตรวจที่ frontend/staff/src/components/PackageForm.jsx');

  // ════════════════════ หมวดที่ 2: FR-02 — แจ้งเตือนส่วนตัว (Mock LINE Notify) ════════════════════

  // TC-FR02-01
  rec('TC-FR02-01', `ยิง Mock LINE Notify ทันทีหลังบันทึกพัสดุ ส่งถึง @${SOMYING.line}`,
    mainNotify?.success === true && sameLine(mainNotify?.deliveredTo, SOMYING.line),
    `deliveredTo=${mainNotify?.deliveredTo ?? '-'}`);
  rec('TC-FR02-01', `Terminal แสดง "📱 [MOCK LINE NOTIFY: พัสดุมาถึงใหม่] ส่งถึง: @${SOMYING.line}"`,
    createLog.includes(`[MOCK LINE NOTIFY: พัสดุมาถึงใหม่] ส่งถึง: @${SOMYING.line}`));
  rec('TC-FR02-01', `Terminal แสดง "🔔 [แจ้งเตือนพัสดุหอพัก] สวัสดีคุณ ${SOMYING.name} (ห้อง ${SOMYING.room} ตึก ${SOMYING.building})"`,
    createLog.includes('[แจ้งเตือนพัสดุหอพัก]')
      && createLog.includes(`สวัสดีคุณ ${SOMYING.name} (ห้อง ${SOMYING.room} ตึก ${SOMYING.building})`));
  r = await get(`/api/notifications/student/${enc(SOMYING_ID)}`);
  const nMain = r.body?.data?.find?.((n) => n.tracking === TRK_MAIN);
  rec('TC-FR02-01', 'บันทึกประวัติการแจ้งเตือนประเภท arrival ลงฐานข้อมูล',
    !!nMain && /arrival/.test(nMain.type), nMain ? `type=${nMain.type}` : 'ไม่พบระเบียนแจ้งเตือน');

  // TC-FR02-02 · Message Contract 5 รายการ
  const msg = nMain?.message ?? mainNotify?.lineMock?.message ?? '';
  for (const [label, ok] of [
    [`1) ชื่อ-นามสกุลนักศึกษา (${SOMYING.name})`, msg.includes(SOMYING.name)],
    [`2) หมายเลขห้องและตึก (ห้อง ${SOMYING.room} ตึก ${SOMYING.building})`, msg.includes(`ห้อง ${SOMYING.room} ตึก ${SOMYING.building}`)],
    ['3) หมายเลขพัสดุตรงกับที่บันทึก', msg.includes(TRK_MAIN)],
    ['4) วันและเวลาที่พัสดุมาถึง', /เวลา[^\n]*\d{4}[^\n]*\d{1,2}:\d{2}/.test(msg)],
    ['5) คำแนะนำให้นำหลักฐานมาเซ็นรับพัสดุ', /หลักฐาน/.test(msg) && /เซ็นรับ/.test(msg)],
  ]) rec('TC-FR02-02', `ข้อความแจ้งเตือนมี ${label}`, ok, msg ? '' : 'ไม่มีข้อความแจ้งเตือนให้ตรวจ');

  // TC-FR02-03 · Unknown ต้องไม่ส่งแจ้งเตือนรายบุคคล
  rec('TC-FR02-03', 'บันทึกพัสดุ Unknown แล้วไม่มีการยิง Mock LINE Notify รายบุคคล',
    unkRes.status === 201 && unkRes.body?.notification == null && !/MOCK LINE NOTIFY/.test(unkCreateLog));
  r = await get('/api/notifications');
  rec('TC-FR02-03', 'ไม่มีระเบียนแจ้งเตือนผูกกับพัสดุ Unknown',
    r.status === 200 && !r.body?.data?.some?.((n) => n.tracking === TRK_UNK));
  rec('TC-FR02-03', 'ไม่เกิด Error ใน Backend Terminal', !/❌|\bError\b/.test(unkCreateLog));

  // ════════════════════ หมวดที่ 3: FR-03 — แจ้งเตือนซ้ำพัสดุค้างรับเกิน 5 ชม. ════════════════════
  const TRK_OVERDUE = T('OVERDUE-PENDING');
  const TRK_OLD_RECEIVED = T('OVERDUE-RECEIVED');
  const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000);
  let preOk = true;
  try {
    await Package.create([
      { tracking: TRK_OVERDUE, recipient: SOMYING.name, student_id: SOMYING_ID, status: 'pending', arrival_date: sixHoursAgo },
      { tracking: TRK_OLD_RECEIVED, recipient: SOMYING.name, student_id: SOMYING_ID, status: 'received',
        arrival_date: sixHoursAgo, pickup_date: new Date(Date.now() - 5.5 * 3600 * 1000) },
    ]);
  } catch (e) { preOk = false; }

  m = mark();
  r = await get('/api/notifications/check-reminders?hours=5');
  const remLog = logSince(m);
  const remResults = r.body?.results ?? [];
  const myRem = remResults.find((x) => x.tracking === TRK_OVERDUE);

  // TC-FR03-01
  rec('TC-FR03-01', 'GET /api/notifications/check-reminders?hours=5 → 200 success: true',
    r.status === 200 && r.body?.success === true, `ได้ ${r.status}`);
  rec('TC-FR03-01', 'ตอบกลับพร้อมจำนวนพัสดุที่ถูกแจ้งเตือนซ้ำ',
    typeof r.body?.remindersSentCount === 'number' && r.body.remindersSentCount >= 1,
    `remindersSentCount=${r.body?.remindersSentCount}`);
  rec('TC-FR03-01', 'พัสดุ pending ที่ค้างเกิน 5 ชม. ถูกหยิบมาแจ้งเตือนซ้ำ',
    preOk && !!myRem, preOk ? 'ไม่พบพัสดุทดสอบในผลลัพธ์' : 'สร้างพัสดุทดสอบ (Preconditions) ไม่สำเร็จ');
  rec('TC-FR03-01', 'Terminal แสดง "[MOCK LINE NOTIFY: ...5 ชม.]"', /\[MOCK LINE NOTIFY:[^\]]*5 ชม\.?\]/.test(remLog));

  // TC-FR03-02
  const remMsg = myRem?.lineMock?.message ?? myRem?.notification?.message ?? '';
  rec('TC-FR03-02', 'หัวข้อระบุชัดเจนว่า "แจ้งเตือนซ้ำ: พัสดุ...เกิน 5 ชั่วโมง"',
    /แจ้งเตือนซ้ำ[^\n]*เกิน 5 ชั่วโมง/.test(remMsg), remMsg ? `หัวข้อ: ${remMsg.split('\n')[0]}` : 'ไม่มีข้อความ');
  rec('TC-FR03-02', 'เตือนให้รีบติดต่อรับพัสดุที่ห้องธุรการ',
    /ห้องธุรการ/.test(remMsg) && /(โดยเร็ว|รีบ)/.test(remMsg));
  r = await get(`/api/notifications/student/${enc(SOMYING_ID)}`);
  rec('TC-FR03-02', 'บันทึกประวัติแจ้งเตือนซ้ำประเภท reminder_5h',
    r.body?.data?.some?.((n) => n.tracking === TRK_OVERDUE && n.type === 'reminder_5h'));

  // TC-FR03-03
  rec('TC-FR03-03', 'พัสดุสถานะ received (เกิน 5 ชม.) ไม่ถูกแจ้งเตือนซ้ำ',
    preOk && r.status === 200 && !remResults.some((x) => x.tracking === TRK_OLD_RECEIVED) && !remLog.includes(TRK_OLD_RECEIVED));
  const oldRecv = preOk ? await Package.findOne({ tracking: TRK_OLD_RECEIVED }).lean() : null;
  rec('TC-FR03-03', 'พัสดุที่รับแล้วไม่ถูกตั้งค่า reminder_sent', !!oldRecv && oldRecv.reminder_sent !== true);

  // ════════════════════ หมวดที่ 4: FR-04 — Broadcast Board & Claim ════════════════════

  // TC-FR04-01
  r = await get('/api/packages/unknown');
  const unkBeforeClaim = r.body?.count;
  r = await put(`/api/packages/${enc(TRK_UNK)}/broadcast`);
  rec('TC-FR04-01', 'กด "ประกาศขึ้นบอร์ด (Broadcast)" → 200 พร้อมข้อความยืนยัน',
    r.status === 200 && r.body?.success === true && !!r.body?.message, `ได้ ${r.status}`);
  rec('TC-FR04-01', 'สถานะเปลี่ยนเป็น "ประกาศแล้ว" (is_broadcasted: true + broadcast_at)',
    r.body?.data?.is_broadcasted === true && !!r.body?.data?.broadcast_at);
  rec('TC-FR04-01', 'หน้า Staff มีปุ่ม Broadcast ในแท็บพัสดุไม่ทราบชื่อ', has(staffUnknown, 'onBroadcast'),
    'ตรวจที่ frontend/staff/src/components/UnknownPackages.jsx');

  // TC-FR04-02
  r = await get('/api/packages/broadcasts');
  const bc = r.body?.data?.find?.((p) => p.tracking === TRK_UNK);
  rec('TC-FR04-02', 'พัสดุที่ถูก Broadcast ปรากฏบนบอร์ดของ Student Portal', r.status === 200 && !!bc);
  rec('TC-FR04-02', 'การ์ดพัสดุมีรูปถ่าย · วันเวลา · เลขพัสดุ',
    !!bc?.photo_url && !!(bc?.arrival_date || bc?.broadcast_at) && !!bc?.tracking);
  rec('TC-FR04-02', 'Student UI มีปุ่มยื่นเคลม / แจ้งเป็นเจ้าของพัสดุใต้การ์ด',
    /onClick=\{\(\)\s*=>\s*onClaim\(/.test(studentBoard) && /(เคลม|เจ้าของพัสดุ|แจ้งสิทธิ์)/.test(studentBoard),
    'ตรวจที่ frontend/student/src/components/BroadcastBoard.jsx');

  // TC-FR04-03
  r = await put(`/api/packages/${enc(TRK_UNK)}/claim`, {
    claimed_by: SOMYING.name, claim_proof: 'รหัสนักศึกษา 651234567-8 / โทร 081-234-5678', student_id: SOMYING_ID,
  });
  rec('TC-FR04-03', 'กด "ยืนยันการเคลม" → 200 ส่งคำขอเคลมพัสดุเรียบร้อย',
    r.status === 200 && r.body?.success === true, `ได้ ${r.status}`);
  rec('TC-FR04-03', `พัสดุถูกผูกเข้ากับชื่อ ${SOMYING.name}`,
    r.body?.data?.claimed_by === SOMYING.name && r.body?.data?.student_id === SOMYING_ID,
    `claimed_by=${r.body?.data?.claimed_by} · student_id=${r.body?.data?.student_id}`);
  r = await get(`/api/student/dashboard/${enc(SOMYING_ID)}`);
  const inDash = r.body?.packages?.find?.((p) => p.tracking === TRK_UNK);
  rec('TC-FR04-03', 'พัสดุย้ายเข้าสู่รายการพัสดุรอรับของนักศึกษา',
    inDash?.status === 'รอรับ', inDash ? `สถานะ: ${inDash.status}` : 'ไม่พบใน dashboard ของนักศึกษา');

  // TC-FR04-04
  r = await get('/api/packages/unknown');
  rec('TC-FR04-04', 'จำนวนพัสดุไม่ทราบชื่อ (StatCard) ลดลง 1 ชิ้น',
    typeof unkBeforeClaim === 'number' && r.body?.count === unkBeforeClaim - 1, `ก่อน ${unkBeforeClaim} → หลัง ${r.body?.count}`);
  const synced = await findPkg(TRK_UNK);
  rec('TC-FR04-04', 'ตารางจัดการพัสดุฝั่ง Staff แสดงชื่อเจ้าของใหม่ตรงกับผู้เคลม',
    synced?.claimed_by === SOMYING.name && synced?.status !== 'unknown', `status=${synced?.status}`);

  // ════════════════════ หมวดที่ 5: FR-05 — Digital Signature ════════════════════

  // TC-FR05-01
  r = await get('/api/packages');
  const mine = r.body?.data?.filter?.((p) => p.recipient === SOMYING.name || p.student_id === SOMYING_ID) ?? [];
  const minePending = mine.find((p) => p.tracking === TRK_MAIN);
  rec('TC-FR05-01', `ค้นหาชื่อ "${SOMYING.name}" พบรายการพัสดุของตนเอง`, !!minePending, `พบ ${mine.length} รายการ`);
  rec('TC-FR05-01', 'พัสดุแสดงสถานะ รอรับของ (pending)', minePending?.status === 'pending', `status=${minePending?.status}`);
  rec('TC-FR05-01', 'Student UI มีหน้าเซ็นรับพัสดุ (Sign & Receive)', has(studentApp, 'SignatureCanvas', 'receivePackage'),
    'ตรวจที่ frontend/student/src/App.jsx');

  // TC-FR05-02 (UI ล้วน — ตรวจจากซอร์สโค้ด)
  rec('TC-FR05-02', 'ใช้กระดานวาดลายเซ็น react-signature-canvas', has(studentApp, 'react-signature-canvas'));
  rec('TC-FR05-02', 'Canvas กำหนดขนาด width/height ชัดเจน', /canvasProps=\{\{[^}]*width[^}]*height/.test(studentApp));
  rec('TC-FR05-02', 'มีปุ่ม "ล้างลายเซ็น (Clear)" เรียก clear()', /sigCanvas\.current\.clear\(\)/.test(studentApp));

  // TC-FR05-04 (ทำก่อน 05-03 เพราะต้องการพัสดุที่ยัง pending)
  rec('TC-FR05-04', 'ตรวจ Canvas ว่าง (isEmpty) ก่อนส่ง และหยุดการยืนยัน',
    /isEmpty\(\)\)\s*\{[\s\S]{0,250}?return/.test(studentApp));
  rec('TC-FR05-04', 'แสดงข้อความเตือนให้ลงลายมือชื่อก่อนกดยืนยัน',
    /isEmpty\(\)\)\s*\{[\s\S]{0,250}?(ลายมือชื่อ|ลายเซ็น|เซ็น)/.test(studentApp));
  rec('TC-FR05-04', 'สถานะพัสดุยังคงเป็น pending', (await findPkg(TRK_MAIN))?.status === 'pending');

  // TC-FR05-03
  const beforeSign = Date.now();
  r = await put(`/api/packages/${enc(TRK_MAIN)}/receive`, { signature_data: SIGNATURE, student_id: SOMYING_ID });
  const pickup = new Date(r.body?.data?.pickup_date ?? 0).getTime();
  rec('TC-FR05-03', 'กด "ยืนยันการรับพัสดุ" → 200 ยืนยันการรับพัสดุสำเร็จ',
    r.status === 200 && r.body?.success === true, `ได้ ${r.status}`);
  rec('TC-FR05-03', 'สถานะเปลี่ยนจาก pending → received', r.body?.data?.status === 'received');
  rec('TC-FR05-03', 'pickup_time เป็นเวลาปัจจุบัน', pickup >= beforeSign - 5000 && pickup <= Date.now() + 5000,
    `pickup_date=${r.body?.data?.pickup_date}`);
  rec('TC-FR05-03', 'บันทึกภาพลายเซ็น Base64 (signature_data)', r.body?.data?.signature_data === SIGNATURE);
  // ════════════════════ หมวดที่ 6: Integration — End-to-End ════════════════════

  // TC-INT-01 · พัสดุปกติ
  const TRK_E2E1 = T('E2E-TEST-001');
  m = mark();
  r = await post('/api/packages', { tracking: TRK_E2E1, recipient: SOMCHAI.name });
  const e2eLog = logSince(m);
  const somchaiId = r.body?.data?.student_id;
  rec('TC-INT-01', `[Staff UI] บันทึกพัสดุ ${SOMCHAI.name} (E2E-TEST-001) และจับคู่นักศึกษาได้`,
    r.status === 201 && r.body?.isMatched === true,
    r.body?.isMatched === false ? `ไม่พบ "${SOMCHAI.name}" ในฐานข้อมูลนักศึกษา (ระบบจัดเป็น unknown)` : `ได้ ${r.status}`);
  rec('TC-INT-01', `[Backend/Notify] ยิงแจ้งเตือนถึง @${SOMCHAI.line} ทันที`, e2eLog.includes(`ส่งถึง: @${SOMCHAI.line}`));
  r = await get('/api/packages');
  const e2eFound = r.body?.data?.find?.((p) => p.tracking === TRK_E2E1);
  rec('TC-INT-01', `[Student UI] ค้นหาชื่อ ${SOMCHAI.name} พบพัสดุ E2E-TEST-001`,
    e2eFound?.status === 'pending' && e2eFound?.student_id != null, `status=${e2eFound?.status ?? '-'}`);
  r = await put(`/api/packages/${enc(TRK_E2E1)}/receive`, { signature_data: SIGNATURE, student_id: somchaiId });
  rec('TC-INT-01', '[Student UI] เซ็นชื่อและกดยืนยันรับของ', r.status === 200 && r.body?.data?.status === 'received');
  const e2eFinal = await findPkg(TRK_E2E1);
  rec('TC-INT-01', '[Staff UI] สถานะเปลี่ยนเป็น received พร้อมแสดงลายเซ็น',
    e2eFinal?.status === 'received' && e2eFinal?.signature_data === SIGNATURE);

  // TC-INT-02 · พัสดุไม่ทราบชื่อ → Broadcast → Claim → Sign
  const TRK_E2E2 = T('E2E-UNK-002');
  r = await post('/api/packages', { tracking: TRK_E2E2, recipient: BLURRED_NAME, photo_url: PHOTO });
  rec('TC-INT-02', `[Staff UI] บันทึกพัสดุ "${BLURRED_NAME}" → จัดเข้าหมวด Unknown`,
    r.status === 201 && r.body?.data?.status === 'unknown', `ได้ ${r.status} · status=${r.body?.data?.status}`);
  r = await put(`/api/packages/${enc(TRK_E2E2)}/broadcast`);
  rec('TC-INT-02', '[Staff UI] กด Broadcast ขึ้นบอร์ด', r.status === 200 && r.body?.data?.is_broadcasted === true);
  r = await get('/api/packages/broadcasts');
  rec('TC-INT-02', '[Student UI] พบการ์ดพัสดุ E2E-UNK-002 บน Broadcast Board',
    r.body?.data?.some?.((p) => p.tracking === TRK_E2E2));
  r = await put(`/api/packages/${enc(TRK_E2E2)}/claim`, { claimed_by: SOMYING.name, claim_proof: 'E2E', student_id: SOMYING_ID });
  rec('TC-INT-02', `[Student UI] ยื่นเคลมระบุเป็นของ ${SOMYING.name}`,
    r.status === 200 && r.body?.data?.student_id === SOMYING_ID);
  r = await get(`/api/student/dashboard/${enc(SOMYING_ID)}`);
  rec('TC-INT-02', '[Student UI] พัสดุย้ายมาที่หน้ารอรับ',
    r.body?.packages?.find?.((p) => p.tracking === TRK_E2E2)?.status === 'รอรับ');
  r = await put(`/api/packages/${enc(TRK_E2E2)}/receive`, { signature_data: SIGNATURE, student_id: SOMYING_ID });
  rec('TC-INT-02', '[Student UI] เซ็นชื่อรับพัสดุ', r.status === 200 && r.body?.data?.status === 'received');
  const e2e2Final = await findPkg(TRK_E2E2);
  rec('TC-INT-02', '[Staff UI] สถานะเปลี่ยนเป็น received โดยสมบูรณ์',
    e2e2Final?.status === 'received' && e2e2Final?.student_id === SOMYING_ID && !!e2e2Final?.signature_data);

  // ════════════════════ หมวดที่ 7: NFR ════════════════════

  // TC-NFR01-01 · Latency (วัดจาก TC-FR01-03)
  const notified = createLog.includes('MOCK LINE NOTIFY');
  rec('TC-NFR01-01', 'ส่งแจ้งเตือนภายใน 1 นาทีหลังกดบันทึก (เกณฑ์ NFR-01)',
    notified && createMs < 60000, `ใช้เวลา ${(createMs / 1000).toFixed(2)} วินาที`);
  rec('TC-NFR01-01', 'ส่งแจ้งเตือนภายใน 3 วินาที (Expected Result)',
    notified && createMs < 3000, `ใช้เวลา ${(createMs / 1000).toFixed(2)} วินาที`);

  // TC-NFR02-01 · Persistence — ตัดการเชื่อมต่อฐานข้อมูลแล้วต่อใหม่ (จำลอง Restart Backend)
  let reconnected = false;
  try {
    await mongoose.connection.close();
    await withTimeout(connectDB(), 10000, 'reconnect timeout');
    reconnected = true;
  } catch { /* ignore */ }
  const persisted = reconnected ? await findPkg(TRK_MAIN) : null;
  rec('TC-NFR02-01', 'Restart การเชื่อมต่อฐานข้อมูลแล้วยังเรียกดูพัสดุที่รับแล้วได้',
    persisted?.status === 'received', reconnected ? `status=${persisted?.status}` : 'เชื่อมต่อใหม่ไม่สำเร็จ');
  rec('TC-NFR02-01', 'วันเวลาที่รับ (pickup_date) ยังคงอยู่', !!persisted?.pickup_date);
  rec('TC-NFR02-01', 'รูปถ่ายพัสดุยังคงอยู่', persisted?.photo_url === PHOTO);
  rec('TC-NFR02-01', 'ภาพลายมือชื่อดิจิทัลยังคงอยู่', persisted?.signature_data === SIGNATURE);

  // ── ล้างข้อมูลทดสอบ ──
  if (!KEEP) {
    try {
      const rx = new RegExp(`-${RUN}$`);
      await Package.deleteMany({ tracking: { $regex: rx } });
      await Notification.deleteMany({ tracking: { $regex: rx } });
    } catch { /* ignore */ }
  }
  try { await mongoose.connection.close(); } catch { /* ignore */ }
  release();
} else {
  for (const tc of Object.keys(TITLES)) rec(tc, 'รันชุดทดสอบ', false, 'เปิด API ไม่ได้');
}

// ── รายงาน ──
const GROUPS = [
  ['FR01', 'FR-01', 'บันทึกและตรวจชื่อ'],
  ['FR02', 'FR-02', 'แจ้งเตือนส่วนตัว'],
  ['FR03', 'FR-03', 'แจ้งเตือนซ้ำ 5 ชม.'],
  ['FR04', 'FR-04', 'บอร์ดพัสดุไม่ทราบชื่อ'],
  ['FR05', 'FR-05', 'เซ็นรับพัสดุดิจิทัล'],
  ['INT',  'INT  ', 'เชื่อมโยงครบวงจร'],
  ['NFR',  'NFR  ', 'คุณภาพและประสิทธิภาพ'],
];
const tcIds = [...new Set(results.map((r) => r.tc))];
const tcPass = (tc) => results.filter((r) => r.tc === tc).every((r) => r.ok);

say('');
for (const [g, label] of GROUPS) {
  if (ONLY && ONLY !== g) continue;
  const ids = tcIds.filter((tc) => groupOf(tc) === g);
  if (!ids.length) continue;
  say(`── ${label} ${'─'.repeat(Math.max(4, 50 - label.length))}`);
  for (const tc of ids) {
    say(`${tcPass(tc) ? '✅ PASS' : '❌ FAIL'}  ${tc}  ${TITLES[tc] ?? ''}`);
    for (const r of results.filter((x) => x.tc === tc)) {
      say(`     ${r.ok ? '✓' : '✗'} ${r.name}${r.detail && !r.ok ? ' — ' + r.detail : ''}`);
    }
  }
  say('');
}

say('─'.repeat(64));
say('หมวดการทดสอบ                       เคส   ผ่าน   ไม่ผ่าน');
let total = 0, passed = 0;
for (const [g, code, title] of GROUPS) {
  const ids = tcIds.filter((tc) => groupOf(tc) === g);
  if (!ids.length) continue;
  const p = ids.filter(tcPass).length;
  const f = ids.length - p;
  total += ids.length;
  passed += p;
  const status = f === 0 ? '✅ PASS' : '❌ FAIL';
  const statCol = `[ ${p}/${ids.length} ]`;
  const failStr = f > 0 ? ` (ไม่ผ่าน ${f})` : '';
  say(`${status}  ${code}  ${statCol}  ·  ${title}${failStr}`);
}
say('─'.repeat(64));
say(`🎯 รวมตามเอกสาร Test Case: ผ่าน ${passed}/${total} เคส (${total ? Math.round((passed / total) * 100) : 0}%)` +
  ` · ตรวจย่อยผ่าน ${results.filter((r) => r.ok).length}/${results.length} รายการ`);
say('\nหมายเหตุ: TC-FR05-02 และส่วน UI บางข้อ ตรวจจากซอร์สโค้ด (static) — การวาดลายเซ็นจริงยังต้องทดสอบด้วยมือ');
say('         FR-03 จะส่งแจ้งเตือนซ้ำให้พัสดุ pending ที่ค้างเกิน 5 ชม. ทุกชิ้นในฐานข้อมูล (ตามพฤติกรรมจริงของ API)');
if (KEEP) say(`         ข้อมูลทดสอบถูกเก็บไว้ (เลขพัสดุลงท้ายด้วย -${RUN})`);

process.exit(passed === total ? 0 : 1);
