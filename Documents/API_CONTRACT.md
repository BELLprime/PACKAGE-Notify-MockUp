# เอกสารข้อกำหนดการเชื่อมต่อระบบและสัญญา API (API Contract Specification)
## ระบบติดตามและแจ้งเตือนพัสดุหอพัก (Package Notify Mockup)

**รหัสเอกสาร:** DOC-API-ENGSE205-02  
**เวอร์ชัน:** 2.0.0 (Official Release)  
**โครงการ:** ระบบติดตามและแจ้งเตือนพัสดุหอพัก Mockup (Sprint 3 — Task 16.3)  
**รายวิชา:** ENGSE205 Software Process and Quality Assurance  
**สถานะการเชื่อมต่อ:** ผ่านการทดสอบสัญญา API อัตโนมัติ 100% (Integration Contract Tests Passed)  
**วันที่ปรับปรุงล่าสุด:** 17 กันยายน 2569  

---

## 1. ข้อมูลทั่วไปและโครงสร้างพื้นฐาน

| หัวข้อ | รายละเอียดการตั้งค่า |
|---|---|
| **ชื่อระบบ** | ระบบติดตามและแจ้งเตือนพัสดุหอพัก (Dormitory Package Tracking & Notification System) |
| **เวอร์ชัน API** | 2.0.0 |
| **Base URL (Backend)** | `http://localhost:5000` |
| **Frontend Staff URL** | `http://localhost:5174` (Vite React + Tailwind CSS) |
| **Frontend Student URL** | `http://localhost:5173` (Vite React + Tailwind CSS) |
| **รูปแบบข้อมูล (Data Format)** | JSON (`Content-Type: application/json; charset=utf-8`) |
| **Payload Limit** | 10MB (รองรับ Base64 Data URL สำหรับภาพถ่ายพัสดุและลายเซ็นดิจิทัล FR-05) |
| **การจัดการ CORS** | รองรับ Preflight (`OPTIONS`), ระบุ Origin ชัดเจน และอนุญาต Credentials |
| **Database** | MongoDB (`Dormitory_parcel` database ผ่าน Mongoose ODM) |

---

## 2. สถาปัตยกรรมและบทบาทการทำงาน (System Architecture)

ระบบเชื่อมโยง 3 ส่วนหลักเข้าด้วยกันตามหลักการสถาปัตยกรรม Client-Server และ RESTful API:

```
+-------------------------------------------------------------------------------+
|                            SYSTEM ARCHITECTURE                                |
+-------------------------------------------------------------------------------+
|                                                                               |
|   [Staff Portal :5174]   <--- HTTP REST --->   [Backend API :5000]            |
|   - ตรวจชื่อ Exact Match (FR-01)                 (Express.js + Mongoose)      |
|   - บันทึกพัสดุ / แนบรูปภาพ                      - Central Error Handler      |
|   - สั่ง Broadcast พัสดุ (FR-04)                 - Business Logic & Database  |
|                                                          |                    |
|   [Student Portal :5173] <--- HTTP REST -----------------+                    |
|   - ค้นหาพัสดุของตนเอง                                   |                    |
|   - บอร์ดพัสดุไม่ทราบชื่อ (FR-04)                         v                    |
|   - เซ็นรับดิจิทัล Canvas (FR-05)              [Notification Mockup]          |
|                                                - ยิง LINE Notify ทันที (FR-02)|
|                                                - แจ้งเตือนซ้ำ 5 ชม. (FR-03)   |
+-------------------------------------------------------------------------------+
```

---

## 3. โครงสร้างข้อมูลหลัก (Database Schemas)

### 3.1 Package Schema (พัสดุหอพัก)

| Field | ชนิดข้อมูล | จำเป็น | ค่าเริ่มต้น / ข้อจำกัด | คำอธิบาย |
|---|---|:---:|---|---|
| `_id` | ObjectId | — | MongoDB Auto-generated | รหัสประจำเอกสารในฐานข้อมูล |
| `tracking` | string | ✓ | Unique, Trimmed | รหัสพัสดุ (เช่น `TH1234567890`, `UNK-998877`) |
| `recipient` | string | ✓ | Trimmed | ชื่อ-นามสกุลผู้รับที่พบบนกล่องพัสดุ |
| `student_id` | string | — | null หากไม่ทราบชื่อ | รหัสนักศึกษาเจ้าของพัสดุ (เช่น `65000002`) |
| `status` | string | ✓ | `'pending'` | สถานะ: `'pending'`, `'received'`, `'unknown'`, `'claimed'` |
| `photo_url` | string | — | Optional | ภาพถ่ายพัสดุ (URL หรือ Base64 Data URL) |
| `note` | string | — | Optional | หมายเหตุสภาพกล่องหรือข้อความเพิ่มเติม |
| `is_broadcasted` | boolean | — | `false` | สถานะการประกาศขึ้นบอร์ดกลางพัสดุไม่ทราบชื่อ (FR-04) |
| `broadcast_at` | Date | — | null | วันและเวลาที่เจ้าหน้าที่กดส่งประกาศ Broadcast |
| `arrival_date` | Date | — | `Date.now()` | วันเวลาที่พัสดุถูกบันทึกเข้าสู่ระบบ |
| `pickup_date` | Date | — | null | วันเวลาที่นักศึกษามารับและเซ็นรับพัสดุ (FR-05) |
| `signature_data` | string | — | null | ข้อมูลภาพลายเซ็นดิจิทัล Base64 PNG (FR-05) |
| `claimed_by` | string | — | null | ชื่อและรหัสนักศึกษาที่ยื่นเคลมพัสดุ (FR-04) |
| `claim_proof` | string | — | null | รายละเอียดหลักฐานหรือสลิปคำสั่งซื้อที่ใช้เคลม |
| `reminder_sent` | boolean | — | `false` | สถานะว่าส่งการแจ้งเตือนซ้ำ 5 ชม. ไปแล้วหรือไม่ (FR-03) |

---

### 3.2 Student Schema (นักศึกษาในหอพัก)

| Field | ชนิดข้อมูล | จำเป็น | ตัวอย่าง | คำอธิบาย |
|---|---|:---:|---|---|
| `student_id` | string | ✓ | `"65000002"` | รหัสประจำตัวนักศึกษา (Unique) |
| `first_name` | string | ✓ | `"สมหญิง"` | ชื่อจริงภาษาไทย |
| `last_name` | string | ✓ | `"ใจดี"` | นามสกุลภาษาไทย |
| `building` | string | ✓ | `"S20"` | อาคารหอพักที่พำนัก |
| `room_number` | string | ✓ | `"202"` | หมายเลขห้องพัก |
| `phone` | string | — | `"0812345678"` | เบอร์โทรศัพท์ติดต่อ |
| `line_user_id` | string | — | `"@Pama"` | LINE User ID หรือ Account Handle สำหรับรับแจ้งเตือน |

---

### 3.3 Notification Schema (ประวัติการแจ้งเตือน)

| Field | ชนิดข้อมูล | จำเป็น | ตัวอย่าง | คำอธิบาย |
|---|---|:---:|---|---|
| `student_id` | string | ✓ | `"65000002"` | รหัสนักศึกษาผู้รับแจ้งเตือน |
| `line_user_id` | string | ✓ | `"@Pama"` | LINE Handle ที่ส่งข้อความถึง |
| `tracking` | string | ✓ | `"TH1234567890"` | รหัสพัสดุที่เกี่ยวข้อง |
| `type` | string | ✓ | `"personal_arrival"` | ประเภท: `'personal_arrival'` หรือ `'reminder_5h'` |
| `title` | string | ✓ | `"📦 พัสดุของคุณมาถึงหอพักแล้ว!"` | หัวข้อข้อความแจ้งเตือน |
| `message` | string | ✓ | ข้อความแจ้งเตือนเต็มรูปแบบ | เนื้อหาข้อความแจ้งเตือนพร้อมรายละเอียดวันเวลาและห้อง |
| `sent_at` | Date | ✓ | `2026-09-17T09:30:00.000Z` | วันและเวลาที่ระบบส่งแจ้งเตือนจำลอง |

---

## 4. ตารางสรุป Endpoint ทั้งหมดในระบบ (Master Endpoint Matrix)

| # | Method | Endpoint Path | คำอธิบายการทำงาน | Functional Requirement | สำเร็จ | ผิดพลาด |
|:---:|---|---|---|:---:|:---:|:---:|
| 1 | `GET` | `/` | ตรวจสอบสถานะการทำงานของ API Server | NFR | `200` | — |
| 2 | `GET` | `/api/students/verify` | ตรวจสอบชื่อผู้รับแบบ Exact Match | FR-01 | `200` | — |
| 3 | `POST` | `/api/packages` | บันทึกพัสดุเข้าใหม่และส่งแจ้งเตือนอัตโนมัติ | FR-01, FR-02 | `201` | `400` |
| 4 | `GET` | `/api/packages` | ดึงรายการพัสดุทั้งหมด (รองรับ Query `?status=`) | FR-01 | `200` | `500` |
| 5 | `GET` | `/api/packages/unknown` | ดึงรายการพัสดุที่ไม่ทราบชื่อทั้งหมด | FR-04 | `200` | `500` |
| 6 | `POST` | `/api/packages/broadcast` | สั่งส่ง Broadcast พัสดุไม่ทราบชื่อขึ้นบอร์ด | FR-04 | `200` | `400` |
| 7 | `GET` | `/api/packages/broadcasts` | ดึงรายการพัสดุที่อยู่บนกระดานบอร์ดกลาง | FR-04 | `200` | `500` |
| 8 | `PUT` | `/api/packages/:id/broadcast` | สั่ง Broadcast พัสดุรายชิ้น | FR-04 | `200` | `404` |
| 9 | `PUT` | `/api/packages/:id/claim` | นักศึกษายื่นขอเคลมพัสดุจากบอร์ดกลาง | FR-04 | `200` | `404` |
| 10 | `PUT` | `/api/packages/:id/match` | เจ้าหน้าที่จับคู่นักศึกษากับพัสดุด้วยตนเอง | FR-01, FR-02 | `200` | `400`, `404` |
| 11 | `PUT` | `/api/packages/:id/receive` | นักศึกษาเซ็นรับพัสดุดิจิทัล (บันทึกลายเซ็น) | FR-05 | `200` | `404` |
| 12 | `GET/POST` | `/api/notifications/check-reminders` | สแกนและส่งแจ้งเตือนซ้ำพัสดุค้างรับ 5 ชม. | FR-03 | `200` | `500` |
| 13 | `GET` | `/api/notifications/student/:studentId` | ดึงประวัติการแจ้งเตือนของนักศึกษาเฉพาะราย | FR-02 | `200` | `500` |
| 14 | `GET` | `/api/students` | ดึงรายชื่อนักศึกษาทั้งหมดในหอพัก | Support | `200` | `500` |
| 15 | `GET` | `/api/student/dashboard/:id` | ดึงข้อมูลสรุป Dashboard รายบุคคลของนักศึกษา | Support | `200` | `404` |
| 16 | `POST` | `/api/packages/reset` | รีเซ็ตฐานข้อมูลพัสดุกลับสู่ค่าเริ่มต้น | Support | `200` | `500` |

---

## 5. รายละเอียดข้อกำหนดแต่ละ Endpoint (Detailed Specifications)

### 5.1 `GET /` — API Health Check & System Status
* **คำอธิบาย:** ตรวจสอบความพร้อมของ API Server
* **Headers:** `Accept: application/json`
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "📦 Package Notify Mockup API Server is Running!",
  "environment": "development",
  "version": "2.0.0"
}
```

---

### 5.2 `GET /api/students/verify` — ตรวจสอบชื่อผู้รับแบบ Exact Match (FR-01)
* **คำอธิบาย:** เจ้าหน้าที่กรอกชื่อ-นามสกุลที่พบบนกล่อง เพื่อค้นหาว่าตรงกับนักศึกษาในหอพักหรือไม่
* **Query Parameters:** `name` (string, required) — เช่น `?name=สมหญิง ใจดี`
* **Response `200 OK` (กรณีพบข้อมูลนักศึกษา):**
```json
{
  "isMatched": true,
  "studentData": {
    "student_id": "65000002",
    "first_name": "สมหญิง",
    "last_name": "ใจดี",
    "building": "S20",
    "room_number": "202",
    "line_user_id": "@Pama"
  },
  "status": "pending",
  "message": "✓ ตรวจสอบพบข้อมูลนักศึกษาในหอพัก"
}
```
* **Response `200 OK` (กรณีไม่พบข้อมูลนักศึกษา):**
```json
{
  "isMatched": false,
  "studentData": null,
  "status": "unknown",
  "message": "X ไม่พบข้อมูลนักศึกษา (จัดเข้าหมวดพัสดุที่ไม่ทราบชื่อ)"
}
```

---

### 5.3 `POST /api/packages` — บันทึกพัสดุเข้าใหม่พร้อมแจ้งเตือนอัตโนมัติ (FR-01, FR-02)
* **คำอธิบาย:** บันทึกข้อมูลพัสดุชิ้นใหม่ หากชื่อตรงจะส่ง Mock LINE Notify ถึงนักศึกษาทันทีในระดับ Millisecond
* **Request Body:**
```json
{
  "tracking": "TH1234567890",
  "recipient": "สมหญิง ใจดี",
  "photo_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "note": "กล่อง Kerry วางหน้าห้อง",
  "student_id": "65000002"
}
```
* **Response `201 Created`:**
```json
{
  "success": true,
  "message": "✅ บันทึกพัสดุและส่งแจ้งเตือน LINE หานักศึกษาเรียบร้อยแล้ว (FR-02)",
  "isMatched": true,
  "data": {
    "_id": "66e5a1b2c3d4e5f60718293a",
    "tracking": "TH1234567890",
    "recipient": "สมหญิง ใจดี",
    "student_id": "65000002",
    "status": "pending",
    "is_broadcasted": false,
    "arrival_date": "2026-09-17T09:30:00.000Z"
  }
}
```
* **Response `400 Bad Request`:**
```json
{
  "success": false,
  "error": "กรุณาระบุชื่อผู้รับพัสดุ"
}
```

---

### 5.4 `GET /api/packages` — ดึงรายการพัสดุทั้งหมด (FR-01)
* **คำอธิบาย:** ดึงรายการพัสดุในระบบ สามารถกรองตามสถานะได้
* **Query Parameters:** `status` (string, optional) — เช่น `?status=pending`, `?status=received`
* **Response `200 OK`:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "_id": "66e5a1b2c3d4e5f60718293a",
      "tracking": "TH1234567890",
      "recipient": "สมหญิง ใจดี",
      "status": "pending",
      "arrival_date": "2026-09-17T09:30:00.000Z"
    }
  ]
}
```

---

### 5.5 `GET /api/packages/unknown` — ดึงรายการพัสดุไม่ทราบชื่อทั้งหมด (FR-04)
* **คำอธิบาย:** ดึงเฉพาะพัสดุที่มีสถานะ `unknown` เพื่อให้เจ้าหน้าที่ตรวจสอบและจัดการ
* **Response `200 OK`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "66e5a1b2c3d4e5f60718293b",
      "tracking": "UNK-998877",
      "recipient": "นายไม่มี ในระบบ",
      "status": "unknown",
      "is_broadcasted": false,
      "arrival_date": "2026-09-17T08:15:00.000Z"
    }
  ]
}
```

---

### 5.6 `POST /api/packages/broadcast` — ส่งประกาศพัสดุไม่ทราบชื่อขึ้นบอร์ดกลาง (FR-04)
* **คำอธิบาย:** บันทึกพัสดุไม่ทราบชื่อและสั่งให้แสดงบนกระดานบอร์ดกลางทันที
* **Request Body:**
```json
{
  "tracking": "BCAST-9901",
  "recipient": "อ่านชื่อไม่ออก",
  "note": "กล่องสีน้ำตาล วางหน้าห้องธุรการ"
}
```
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "📢 ประกาศพัสดุไม่ทราบชื่อขึ้นบอร์ดกลางเรียบร้อยแล้ว",
  "data": {
    "tracking": "BCAST-9901",
    "status": "unknown",
    "is_broadcasted": true,
    "broadcast_at": "2026-09-17T10:00:00.000Z"
  }
}
```

---

### 5.7 `GET /api/packages/broadcasts` — ดึงรายการพัสดุบนบอร์ดกลาง (FR-04)
* **คำอธิบาย:** ดึงรายการพัสดุที่ถูกกด Broadcast แล้วเพื่อนำไปแสดงผลบน Broadcast Board ของนักศึกษา
* **Response `200 OK`:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "66e5a1b2c3d4e5f60718293c",
      "tracking": "BCAST-9901",
      "recipient": "อ่านชื่อไม่ออก",
      "is_broadcasted": true,
      "broadcast_at": "2026-09-17T10:00:00.000Z"
    }
  ]
}
```

---

### 5.8 `PUT /api/packages/:id/broadcast` — สั่ง Broadcast พัสดุรายชิ้น (FR-04)
* **Path Parameter:** `id` (Tracking หรือ MongoDB ObjectId)
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "📢 อัปเดตสถานะการประกาศขึ้นบอร์ดสำเร็จ",
  "data": {
    "tracking": "UNK-998877",
    "is_broadcasted": true,
    "broadcast_at": "2026-09-17T10:05:00.000Z"
  }
}
```

---

### 5.9 `PUT /api/packages/:id/claim` — นักศึกษายื่นขอเคลมพัสดุจากบอร์ดกลาง (FR-04)
* **Path Parameter:** `id` (Tracking หรือ MongoDB ObjectId)
* **Request Body:**
```json
{
  "claimed_by": "สมหญิง ใจดี (651234567-8)",
  "claim_proof": "สลิปสั่งของจาก Shopee เลขคำสั่งซื้อ #240917-8899",
  "student_id": "651234567-8"
}
```
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "🙋 บันทึกการแจ้งสิทธิ์เคลมพัสดุลงฐานข้อมูลแล้ว",
  "data": {
    "tracking": "UNK-998877",
    "status": "claimed",
    "claimed_by": "สมหญิง ใจดี (651234567-8)",
    "claim_proof": "สลิปสั่งของจาก Shopee เลขคำสั่งซื้อ #240917-8899"
  }
}
```

---

### 5.10 `PUT /api/packages/:id/match` — เจ้าหน้าที่จับคู่นักศึกษากับพัสดุด้วยตนเอง (FR-01, FR-02)
* **Path Parameter:** `id` (Tracking หรือ MongoDB ObjectId)
* **Request Body:**
```json
{
  "student_id": "65000002",
  "recipient": "สมหญิง ใจดี"
}
```
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "🔗 จับคู่พัสดุกับนักศึกษาสำเร็จ และส่งแจ้งเตือน LINE เรียบร้อยแล้ว",
  "data": {
    "tracking": "UNK-998877",
    "recipient": "สมหญิง ใจดี",
    "student_id": "65000002",
    "status": "pending"
  }
}
```

---

### 5.11 `PUT /api/packages/:id/receive` — นักศึกษาเซ็นชื่อรับพัสดุดิจิทัล (FR-05)
* **Path Parameter:** `id` (Tracking หรือ MongoDB ObjectId)
* **Request Body:**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "student_id": "65000002"
}
```
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "✅ ยืนยันการเซ็นรับพัสดุสำเร็จและบันทึกลงฐานข้อมูลแล้ว",
  "data": {
    "tracking": "TH1234567890",
    "status": "received",
    "pickup_date": "2026-09-17T11:00:00.000Z",
    "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

---

### 5.12 `GET / POST /api/notifications/check-reminders` — สแกนและส่งแจ้งเตือนซ้ำพัสดุค้างรับ 5 ชม. (FR-03)
* **Query Parameters:**
  * `hours` (number, default: 5) — จำนวนชั่วโมงขั้นต่ำที่พัสดุค้างรับ
  * `force` (boolean, optional) — บังคับส่งซ้ำแม้เคยส่งไปแล้ว
* **Response `200 OK`:**
```json
{
  "success": true,
  "scannedCount": 4,
  "remindersSentCount": 2,
  "thresholdHours": 5,
  "results": [
    {
      "success": true,
      "deliveredTo": "@Pama",
      "tracking": "PKG-20260901-002",
      "hoursPassed": 6.2
    }
  ]
}
```

---

### 5.13 `GET /api/notifications/student/:studentId` — ประวัติแจ้งเตือนเฉพาะนักศึกษา (FR-02)
* **Path Parameter:** `studentId` (string, required)
* **Response `200 OK`:**
```json
{
  "success": true,
  "studentId": "65000002",
  "count": 2,
  "data": [
    {
      "type": "personal_arrival",
      "title": "📦 พัสดุของคุณมาถึงหอพักแล้ว!",
      "message": "🔔 [แจ้งเตือนพัสดุหอพัก] สวัสดีคุณ สมหญิง ใจดี (ห้อง 202 ตึก S20)...",
      "sent_at": "2026-09-17T09:30:00.000Z"
    }
  ]
}
```

---

### 5.14 `GET /api/students` — ดึงรายชื่อนักศึกษาทั้งหมดในหอพัก (Support)
* **Response `200 OK`:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "student_id": "65000001",
      "first_name": "สมชาย",
      "last_name": "รักเรียน",
      "building": "A1",
      "room_number": "101",
      "line_user_id": "@Somchai"
    }
  ]
}
```

---

### 5.15 `GET /api/student/dashboard/:id` — ดึงข้อมูลสรุป Dashboard นักศึกษา (Support)
* **Path Parameter:** `id` (student_id, required)
* **Response `200 OK`:**
```json
{
  "success": true,
  "student": {
    "student_id": "65000002",
    "name": "สมหญิง ใจดี",
    "building": "S20",
    "room_number": "202"
  },
  "stats": {
    "pending": 2,
    "received": 5,
    "total": 7
  },
  "packages": []
}
```

---

### 5.16 `POST /api/packages/reset` — รีเซ็ตฐานข้อมูลพัสดุกลับสู่ค่าเริ่มต้น (Support)
* **Request Body:** `{}` (Empty)
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "🔄 รีเซ็ตข้อมูลพัสดุกลับสู่ชุดข้อมูลมาตรฐานเรียบร้อยแล้ว",
  "count": 5
}
```

---

## 6. มาตรฐานการจัดการข้อผิดพลาดและรหัสสถานะ (Error Handling & HTTP Status Codes)

ระบบใช้ **Centralized Error Handling Middleware (Task 16.1)** เพื่อควบคุมโครงสร้างข้อผิดพลาดให้มีมาตรฐานเดียวกัน 100%:

```json
{
  "success": false,
  "error": "ข้อความอธิบายข้อผิดพลาดภาษาไทยที่ชัดเจน",
  "statusCode": 400
}
```

### ตารางรหัสสถานะ HTTP (HTTP Status Codes)

| HTTP Status | ความหมายตามมาตรฐาน | การนำไปใช้ในระบบนี้ |
|:---:|---|---|
| **200 OK** | Success | คำขอดึงข้อมูลสำเร็จ, ปรับปรุงสถานะเรียบร้อย, หรือสแกนสำเร็จ |
| **201 Created** | Created | บันทึกพัสดุชิ้นใหม่เข้าสู่ฐานข้อมูลสำเร็จ |
| **400 Bad Request** | Validation Error | กรอกข้อมูลไม่ครบถ้วน เช่น ไม่ระบุชื่อผู้รับ หรือเลขพัสดุว่างเปล่า |
| **404 Not Found** | Resource Not Found | ไม่พบพัสดุ, ไม่พบรหัสนักศึกษา, หรือเรียก Endpoint ที่ไม่มีในระบบ |
| **500 Internal Server Error** | Server Error | เกิดข้อผิดพลาดในฝั่ง Backend หรือฐานข้อมูล MongoDB ขัดข้อง |

---

## 7. ความปลอดภัยและการตั้งค่า CORS (Security & Cross-Origin Policy)

1. **CORS Policy:**
   * เซิร์ฟเวอร์อนุญาตการเรียกใช้งานจาก Frontend Client ที่ผ่านการรับรอง:
     * `http://localhost:5174` (Staff Portal)
     * `http://localhost:5173` (Student Portal)
   * รองรับการตรวจสอบแบบ Preflight (`OPTIONS Request`) อัตโนมัติ
   * เปิดใช้งาน `credentials: true` เพื่อความปลอดภัยในการส่งข้อมูล
2. **Payload Protection:**
   * จำกัดขนาด Payload ของคำขอไว้ที่ `10MB` เพื่อรองรับข้อมูลภาพถ่ายพัสดุและลายมือชื่อดิจิทัล Base64 โดยไม่ทำให้หน่วยความจำเซิร์ฟเวอร์ล้น
3. **Database Injection Protection:**
   * Mongoose ODM ทำการ Sanitize Query Parameters และตรวจสอบ Type ของข้อมูลอย่างเข้มงวด ป้องกัน NoSQL Injection

---

## 8. การลงนามรับรองสัญญา API ร่วมกัน (API Contract Endorsement & Sign-off)

ข้าพเจ้าในฐานะตัวแทนฝ่ายพัฒนา Backend, Staff Portal, Student Portal และ Notification Service ขอรับรองว่าข้อกำหนดสัญญา API ฉบับนี้ได้รับการตรวจสอบ ยอมรับ และนำไปปฏิบัติตามอย่างถูกต้องสมบูรณ์

#### 1. สถาปนิกและผู้อนุมัติสัญญา API กลาง (Backend Architecture & Integration Lead)
* **ลงชื่อ:** นายณัฏฐกิตติ์ รอดเรือน
* **บทบาทหน้าที่:** ผู้ออกแบบและดูแลสัญญา API กลาง, Database Schema, Central Middleware และ Automated Contract Tests
* **วันที่รับรอง:** 17 กันยายน 2569
* **สถานะ:** `[x] อนุมัติสัญญา API เวอร์ชัน 2.0.0 (Approved)`

#### 2. ตัวแทนฝั่งระบบเจ้าหน้าที่ (Staff Portal Client Lead)
* **ลงชื่อ:** นายธนโชติ จาติระดุก
* **บทบาทหน้าที่:** ผู้พัฒนาและเชื่อมต่อ API ระบบบันทึกพัสดุ, ตรวจสอบชื่อ (FR-01) และจัดการพัสดุ
* **วันที่รับรอง:** 17 กันยายน 2569
* **สถานะ:** `[x] ลงนามยอมรับสัญญา API (Endorsed)`

#### 3. ตัวแทนฝั่งระบบแจ้งเตือน (Notification Service Lead)
* **ลงชื่อ:** นายมงคล อาษากิจ
* **บทบาทหน้าที่:** ผู้พัฒนาและเชื่อมต่อ API บริการจำลองการแจ้งเตือน (FR-02) และระบบตรวจเช็คแจ้งเตือนซ้ำ 5 ชม. (FR-03)
* **วันที่รับรอง:** 17 กันยายน 2569
* **สถานะ:** `[x] ลงนามยอมรับสัญญา API (Endorsed)`

#### 4. ตัวแทนฝั่งระบบนักศึกษา (Student Portal Client Lead)
* **ลงชื่อ:** นายวชิรวิชญ์ ปินะกาโร
* **บทบาทหน้าที่:** ผู้พัฒนาและเชื่อมต่อ API ระบบนักศึกษา, บอร์ดพัสดุไม่ทราบชื่อ (FR-04) และลายมือชื่อดิจิทัล (FR-05)
* **วันที่รับรอง:** 17 กันยายน 2569
* **สถานะ:** `[x] ลงนามยอมรับสัญญา API (Endorsed)`
