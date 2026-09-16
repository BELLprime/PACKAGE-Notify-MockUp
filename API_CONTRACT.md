# API Contract — ระบบติดตามและแจ้งเตือนพัสดุหอพัก (Package Notify Mockup)

---

## 1. ข้อมูลทั่วไป

| หัวข้อ | รายละเอียด |
|---|---|
| **ชื่อระบบ** | ระบบติดตามและแจ้งเตือนพัสดุหอพัก (Dormitory Package Tracking & Notification System) |
| **เวอร์ชัน** | 2.0.0 |
| **Base URL (พัฒนา)** | `http://localhost:5000` |
| **Frontend Staff URL** | `http://localhost:5174` |
| **Frontend Student URL** | `http://localhost:5173` |
| **รูปแบบข้อมูล** | JSON (`Content-Type: application/json`) |
| **การจัดการ CORS** | รองรับ Preflight (OPTIONS) และระบุ Origin ชัดเจน |
| **วันที่ปรับปรุงล่าสุด** | 16/09/2569 |

---

## 2. ภาพรวมระบบ

ระบบติดตามและแจ้งเตือนพัสดุหอพัก พัฒนาขึ้นเพื่อแก้ไขปัญหาพัสดุตกค้างและพัสดุสูญหายภายในหอพักนักศึกษา โดยเชื่อมโยง 3 ส่วนหลักเข้าด้วยกัน:
1. **Staff UI:** เจ้าหน้าที่หอพักใช้บันทึกพัสดุเข้าใหม่, ตรวจสอบชื่อนักศึกษาแบบ Exact Match (FR-01), จัดการพัสดุที่ไม่ทราบชื่อ (FR-04) และตรวจสอบหลักฐานลายเซ็นดิจิทัล
2. **Student UI:** นักศึกษาใช้ตรวจสอบสถานะพัสดุของตนเอง, ดูบอร์ดประกาศพัสดุไม่ทราบชื่อกลาง, รับข้อความแจ้งเตือน และลงลายมือชื่อดิจิทัล (Digital Signature - FR-05) เพื่อยืนยันการรับพัสดุ
3. **Notify Mockup:** จำลองการส่งข้อความแจ้งเตือนผ่าน LINE Official Account / LINE Notify ทันทีที่พัสดุเข้าสู่ระบบ (FR-02) และระบบตรวจเช็คแจ้งเตือนซ้ำเมื่อพัสดุค้างรับเกิน 5 ชั่วโมง (FR-03)

---

## 3. โครงสร้างข้อมูลหลัก (Database Schemas)

### 3.1 Package (พัสดุ)

| Field | ชนิด | จำเป็น | ข้อจำกัด / ค่าเริ่มต้น | ตัวอย่าง |
|---|---|:---:|---|---|
| `_id` | ObjectId | — | MongoDB Auto-generated | `"66e5a1b2c3d4e5f60718293a"` |
| `tracking` | string | ✓ | ไม่ซ้ำกัน · รหัสพัสดุ | `"PKG-20260901-001"` |
| `recipient` | string | ✓ | ชื่อ-นามสกุลผู้รับที่จ่าหน้ากล่อง | `"สมหญิง ใจดี"` |
| `photo_url` | string | — | URL หรือ Base64 ภาพถ่ายพัสดุ | `"https://images.unsplash.com/..."` |
| `note` | string | — | หมายเหตุเพิ่มเติม | `"กล่องขนาดเล็ก ห่อพลาสติก"` |
| `student_id` | string | — | รหัสนักศึกษา (null หากไม่ทราบชื่อ) | `"65000002"` |
| `status` | string | ✓ | `'pending'` \| `'received'` \| `'unknown'` \| `'claimed'` | `"pending"` |
| `is_broadcasted` | boolean | — | ค่าเริ่มต้น `false` (บอร์ดพัสดุไม่ทราบชื่อ) | `false` |
| `broadcast_at` | Date | — | เวลาที่กดประกาศ Broadcast | `2026-09-01T14:30:00.000Z` |
| `arrival_date` | Date | — | วันเวลาที่พัสดุเข้าสู่ระบบ (เริ่มต้นเป็นปัจจุบัน) | `2026-09-01T11:20:00.000Z` |
| `pickup_date` | Date | — | วันเวลาที่นักศึกษามารับพัสดุ | `2026-09-01T17:30:00.000Z` |
| `signature_data` | string | — | ภาพลายเซ็นดิจิทัล Base64 (PNG) | `"data:image/png;base64,iVBORw..."` |
| `claimed_by` | string | — | ข้อมูลผู้แจ้งสิทธิ์ว่าเป็นของตน | `"Natthakit Rodruean (65000001)"` |
| `claim_proof` | string | — | รายละเอียดหลักฐานการเคลมพัสดุ | `"สลิปสั่งของจาก Shopee เลขคำสั่งซื้อ..."` |
| `reminder_sent` | boolean | — | สถานะว่าส่งแจ้งเตือนซ้ำ 5 ชม. แล้วหรือไม่ | `false` |

---

### 3.2 Student (นักศึกษา)

| Field | ชนิด | จำเป็น | ตัวอย่าง |
|---|---|:---:|---|
| `student_id` | string | ✓ | `"65000001"` |
| `first_name` | string | ✓ | `"Natthakit"` |
| `last_name` | string | ✓ | `"Rodruean"` |
| `building` | string | ✓ | `"A"` |
| `room_number` | string | ✓ | `"302"` |
| `phone` | string | — | `"0891234567"` |
| `line_user_id` | string | — | `"Bell"` |

---

### 3.3 Notification (ประวัติการแจ้งเตือน)

| Field | ชนิด | จำเป็น | ตัวอย่าง |
|---|---|:---:|---|
| `student_id` | string | ✓ | `"65000002"` |
| `line_user_id` | string | ✓ | `"Pama"` |
| `tracking` | string | ✓ | `"PKG-20260901-002"` |
| `type` | string | ✓ | `'personal_arrival'` \| `'reminder_5h'` |
| `title` | string | ✓ | `"📦 พัสดุของคุณมาถึงหอพักแล้ว!"` |
| `message` | string | ✓ | ข้อความแจ้งเตือนเต็มรูปแบบของ LINE Bot |
| `sent_at` | Date | ✓ | `2026-09-16T22:30:00.000Z` |

---

## 4. สรุป Endpoint ทั้งหมด

| # | Method | Endpoint | คำอธิบาย | Functional Requirement | สำเร็จ | ผิดพลาด |
|:---:|---|---|---|:---:|:---:|:---:|
| 1 | `GET` | `/` | ตรวจสอบสถานะ API และเวอร์ชัน | NFR | `200` | — |
| 2 | `GET` | `/api/packages` | ดึงรายการพัสดุทั้งหมด (รองรับ `?status=`) | FR-01 | `200` | `500` |
| 3 | `POST` | `/api/packages` | บันทึกพัสดุใหม่และตรวจสอบชื่ออัตโนมัติ | FR-01, FR-02 | `201` | `400` |
| 4 | `GET` | `/api/packages/unknown` | ดึงรายการพัสดุที่ไม่ทราบชื่อทั้งหมด | FR-04 | `200` | `500` |
| 5 | `POST` | `/api/packages/broadcast` | ส่ง Broadcast พัสดุไม่ทราบชื่อขึ้นบอร์ดกลาง | FR-04 | `200` | `400` |
| 6 | `GET` | `/api/packages/broadcasts` | ดึงรายการพัสดุที่อยู่บนกระดานบอร์ดกลาง | FR-04 | `200` | `500` |
| 7 | `PUT` | `/api/packages/:id/broadcast` | สั่ง Broadcast พัสดุรายชิ้น | FR-04 | `200` | `404` |
| 8 | `PUT` | `/api/packages/:id/match` | เจ้าหน้าที่จับคู่นักศึกษากับพัสดุด้วยตนเอง | FR-01, FR-02 | `200` | `400`, `404` |
| 9 | `PUT` | `/api/packages/:id/receive` | นักศึกษาเซ็นรับพัสดุดิจิทัล (บันทึกลายเซ็น) | FR-05 | `200` | `404` |
| 10 | `PUT` | `/api/packages/:id/claim` | นักศึกษาแจ้งสิทธิ์ความเป็นเจ้าของพัสดุ | FR-04 | `200` | `404` |
| 11 | `POST` | `/api/packages/reset` | รีเซ็ตฐานข้อมูลพัสดุกลับสู่ค่าเริ่มต้น | Support | `200` | `500` |
| 12 | `GET` | `/api/students/verify` | ตรวจสอบชื่อผู้รับแบบ Exact Match | FR-01 | `200` | — |
| 13 | `GET` | `/api/students` | ดึงรายชื่อนักศึกษาทั้งหมด | Support | `200` | `500` |
| 14 | `GET` | `/api/student/dashboard/:id` | ดึงข้อมูล Dashboard รวมของนักศึกษา | FR-01, FR-02 | `200` | `404` |
| 15 | `GET` | `/api/notifications/student/:id`| ดึงประวัติการแจ้งเตือนของนักศึกษา | FR-02 | `200` | `500` |
| 16 | `GET` | `/api/notifications/check-reminders` | ตรวจสอบและส่งแจ้งเตือนซ้ำ 5 ชม. | FR-03 | `200` | `500` |

---

## 5. รายละเอียดแต่ละ Endpoint

### 5.1 `GET /` — API Health Check
* **คำอธิบาย:** ตรวจสอบความพร้อมของเซิร์ฟเวอร์
* **คำตอบสำเร็จ (`200 OK`):**
```json
{
  "success": true,
  "message": "📦 Package Notify Mockup API Server is Running!",
  "environment": "development",
  "version": "2.0.0"
}
```

---

### 5.2 `GET /api/students/verify` — ตรวจสอบชื่อผู้รับ (Exact Match - FR-01)
* **Query Parameters:** `name` (string) — ชื่อผู้รับที่อ่านได้จากหน้ากล่อง
* **ตัวอย่าง:** `GET /api/students/verify?name=สมหญิง ใจดี`
* **คำตอบสำเร็จ (`200 OK`):**
```json
{
  "isMatched": true,
  "studentData": {
    "student_id": "65000002",
    "first_name": "สมหญิง",
    "last_name": "ใจดี",
    "building": "B",
    "room_number": "202",
    "line_user_id": "Pama"
  },
  "status": "pending",
  "message": "✓ ตรวจสอบพบข้อมูลนักศึกษาในหอพัก"
}
```
* **กรณีไม่พบรายชื่อ (`200 OK`):**
```json
{
  "isMatched": false,
  "studentData": null,
  "status": "unknown",
  "message": "X ไม่พบข้อมูลนักศึกษา (จัดเข้าหมวดพัสดุที่ไม่ทราบชื่อ)"
}
```

---

### 5.3 `POST /api/packages` — บันทึกพัสดุเข้าใหม่ (FR-01 & FR-02)
* **Request Body:**
```json
{
  "tracking": "PKG-20260901-009",
  "recipient": "สมหญิง ใจดี",
  "photo_url": "https://example.com/photo.jpg",
  "note": "กล่อง Kerry",
  "student_id": "65000002"
}
```
* **คำตอบสำเร็จ (`201 Created`):**
```json
{
  "success": true,
  "message": "✅ บันทึกพัสดุและส่งแจ้งเตือน LINE หานักศึกษาเรียบร้อยแล้ว (FR-02)",
  "isMatched": true,
  "data": {
    "_id": "66e5a1b2c3d4e5f60718293a",
    "tracking": "PKG-20260901-009",
    "recipient": "สมหญิง ใจดี",
    "student_id": "65000002",
    "status": "pending",
    "is_broadcasted": false,
    "arrival_date": "2026-09-16T22:30:00.000Z"
  }
}
```
* **กรณีข้อมูลไม่ถูกต้อง (`400 Bad Request`):**
```json
{
  "success": false,
  "error": "กรุณาระบุชื่อผู้รับพัสดุ"
}
```

---

### 5.4 `PUT /api/packages/:id/receive` — เซ็นรับพัสดุดิจิทัล (FR-05)
* **URL Parameter:** `id` (Tracking หรือ MongoDB ObjectId)
* **Request Body:**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgo...",
  "student_id": "65000002"
}
```
* **คำตอบสำเร็จ (`200 OK`):**
```json
{
  "success": true,
  "message": "✅ ยืนยันการเซ็นรับพัสดุ PKG-20260901-009 สำเร็จและบันทึกลงฐานข้อมูลแล้ว",
  "data": {
    "tracking": "PKG-20260901-009",
    "status": "received",
    "pickup_date": "2026-09-16T22:35:00.000Z",
    "signature_data": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

---

### 5.5 `PUT /api/packages/:id/claim` — แจ้งสิทธิ์พัสดุไม่ทราบชื่อ (FR-04)
* **Request Body:**
```json
{
  "claimed_by": "Natthakit Rodruean (65000001)",
  "claim_proof": "มีหลักฐานสลิปขนส่ง Flash Express ตรงกับชื่อ",
  "student_id": "65000001"
}
```
* **คำตอบสำเร็จ (`200 OK`):**
```json
{
  "success": true,
  "message": "🙋 บันทึกการแจ้งสิทธิ์พัสดุ PKG-20260825-003 ลงฐานข้อมูลแล้ว",
  "data": {
    "tracking": "PKG-20260825-003",
    "status": "claimed",
    "claimed_by": "Natthakit Rodruean (65000001)",
    "claim_proof": "มีหลักฐานสลิปขนส่ง Flash Express ตรงกับชื่อ"
  }
}
```

---

### 5.6 `GET /api/notifications/check-reminders` — สแกนแจ้งเตือนซ้ำ 5 ชม. (FR-03)
* **Query Parameters:** `hours` (number, default: 5)
* **ตัวอย่าง:** `GET /api/notifications/check-reminders?hours=5`
* **คำตอบสำเร็จ (`200 OK`):**
```json
{
  "success": true,
  "scannedCount": 3,
  "remindersSentCount": 2,
  "thresholdHours": 5,
  "results": [
    {
      "success": true,
      "deliveredTo": "@Pama",
      "tracking": "PKG-20260901-002",
      "hoursPassed": 5
    }
  ]
}
```
