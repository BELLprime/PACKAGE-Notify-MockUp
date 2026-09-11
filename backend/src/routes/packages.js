const express = require('express');
const router = express.Router();
const {
  getUnknownPackages,
  getAllPackages,
  createPackage,
  broadcastPackage,
  manualMatchPackage
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
// PUT /api/packages/:id/broadcast
router.put('/:id/broadcast', broadcastPackage);

// 5. จับคู่พัสดุไม่ทราบชื่อกับนักศึกษาด้วยตนเอง (Manual Match)
// PUT /api/packages/:id/match
router.put('/:id/match', manualMatchPackage);

module.exports = router;
