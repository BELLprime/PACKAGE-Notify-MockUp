const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/packageController');

// 1. ดึงเฉพาะรายการพัสดุที่ไม่ทราบชื่อ (สำหรับ Task 8)
// GET /api/packages/unknown
router.get('/unknown', getUnknownPackages);

// 2. ดึงรายการพัสดุทั้งหมด
// GET /api/packages
router.get('/', getAllPackages);

// 3. บันทึกพัสดุใหม่ (เช็ค Exact Match อัตโนมัติ ถ้าไม่เจอจะตั้งเป็น unknown)
// POST /api/packages
router.post('/', createPackage);

// 4. สั่งส่ง Broadcast พัสดุไม่ทราบชื่อ (FR-04)
router.post('/broadcast', postBroadcast);
router.get('/broadcasts', getBroadcastPackages);
router.put('/:id/broadcast', broadcastPackage);

// 5. จับคู่พัสดุไม่ทราบชื่อกับนักศึกษาด้วยตนเอง (Manual Match)
router.put('/:id/match', manualMatchPackage);

// 6. นักศึกษาเซ็นรับพัสดุแบบดิจิทัล (FR-03)
router.put('/:id/receive', receivePackage);

// 7. นักศึกษาแจ้งสิทธิ์ความเป็นเจ้าของพัสดุไม่ทราบชื่อ (FR-04)
router.put('/:id/claim', claimPackage);

// 8. รีเซ็ตข้อมูลพัสดุ
router.post('/reset', resetPackages);

module.exports = router;
