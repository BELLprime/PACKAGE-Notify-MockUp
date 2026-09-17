# Software Design Document (SDD)
## ระบบติดตามและแจ้งเตือนพัสดุหอพัก (RMUTL Smart Dormitory Package Notification & Tracking System)

**รหัสโครงการ:** ENGSE205 Midterm Project  
**เวอร์ชันเอกสาร:** 2.0.0 (Updated Sprint 3 - System Integration & Refactoring)  
**วันที่ปรับปรุงล่าสุด:** 17 กันยายน 2569  
**ทีมผู้พัฒนา (76 Company):**
1. ธนโชติ จาติระดุก
2. ณัฏฐกิตติ์ รอดเรือน
3. มงคล อาษากิจ
4. วชิรวิชญ์ ปินะกาโร

---

### 1. บทนำ (Introduction)

#### 1.1 วัตถุประสงค์ (Purpose)
เอกสารฉบับนี้จัดทำขึ้นเพื่ออธิบายรายละเอียดการออกแบบสถาปัตยกรรมระบบ (System Architecture), โครงสร้างข้อมูล (Data Model), การออกแบบส่วนต่อประสานโปรแกรมประยุกต์ (API Architecture & Contracts), สถาปัตยกรรมการจัดการข้อผิดพลาด (Centralized Error Handling), และการเชื่อมต่อระหว่างระบบย่อย (Integration) ทั้งหมดตามมาตรฐานวิศวกรรมซอฟต์แวร์ (ISO 29110) เพื่อให้ทีมพัฒนาและผู้ตรวจประเมินใช้เป็นเอกสารอ้างอิงสถาปัตยกรรมฉบับสมบูรณ์

#### 1.2 ขอบเขตระบบ (Scope)
ระบบครอบคลุมฟังก์ชันการทำงานหลัก 5 ประการตาม Functional Requirements (FR-01 ถึง FR-05) และ Non-Functional Requirements (NFR-01, NFR-02):
* **FR-01 (บันทึกและตรวจสอบ):** เจ้าหน้าที่กรอกชื่อ/ถ่ายรูปพัสดุ ระบบตรวจสอบชื่อกับฐานข้อมูลนักศึกษาแบบ Exact Match อัตโนมัติ
* **FR-02 (แจ้งเตือนส่วนตัว):** ส่ง Notification จำลอง (LINE Notify Mockup) ตรงไปยังนักศึกษาเมื่อพัสดุเข้า
* **FR-03 (แจ้งเตือนซ้ำอัตโนมัติ):** สแกนและส่งแจ้งเตือนซ้ำสำหรับพัสดุที่ค้างรับเกิน 5 ชั่วโมง
* **FR-04 (บอร์ดประกาศพัสดุไม่ทราบชื่อ):** ส่งรายการพัสดุไม่ทราบชื่อขึ้น Broadcast Board ส่วนกลาง และเปิดให้นักศึกษาเคลมขอรับ
* **FR-05 (เซ็นรับดิจิทัล):** นักศึกษาลงลายมือชื่อดิจิทัล (Digital Signature Canvas) เพื่อยืนยันการรับพัสดุพร้อมบันทึกเวลาจริง

---

### 2. สถาปัตยกรรมระบบ (System Architecture)

ระบบใช้สถาปัตยกรรมแบบ **Multi-tier Client-Server with Layered Service Architecture**:

```
+-------------------------------------------------------------------------------+
|                                CLIENT TIER                                    |
|  +-----------------------------------+     +-------------------------------+  |
|  |     Staff Portal (React + Vite)   |     |  Student Portal (React + Vite)|  |
|  |       Port: 5174                  |     |    Port: 5173 (Responsive)    |  |
|  |  [Dashboard, PackageForm, Modals] |     | [BroadcastBoard, Signature]   |  |
|  +-----------------+-----------------+     +---------------+---------------+  |
|                    |                                       |                  |
|                    v                                       v                  |
|  +-------------------------------------------------------------------------+  |
|  |             Frontend API Client Layer (Unified apiClient.js)            |  |
|  |         - BaseURL via import.meta.env.VITE_API_BASE_URL (Default: 5000) |  |
|  |         - Centralized HTTP Methods & Standard Error Normalization       |  |
|  +-------------------------------------+-----------------------------------+  |
+----------------------------------------|--------------------------------------+
                                         | HTTP / JSON REST
                                         v
+-------------------------------------------------------------------------------+
|                               SERVER TIER                                     |
|  +-------------------------------------------------------------------------+  |
|  |                       Node.js + Express Server (Port: 5000)             |  |
|  |  - Central Config: src/config/config.js (PORT, MONGO_URI, CORS_ORIGIN)  |  |
|  |  - HTTP Request Logger: Morgan middleware                               |  |
|  |  - Security & Parsing: cors(whitelist), express.json(limit: 10mb)       |  |
|  +-------------------------------------+-----------------------------------+  |
|                                        |                                      |
|  +-------------------------------------+-----------------------------------+  |
|  |                         Express Routes & Middlewares                    |  |
|  |  - /api/packages         -> packageController.js (CRUD, Broadcast)      |  |
|  |  - /api/students         -> studentController.js (Exact Match Verify)   |  |
|  |  - /api/notifications    -> notificationService.js (Mock LINE Notify)   |  |
|  |  - Central Error Handler -> errorHandler.js (AppError, notFoundHandler) |  |
|  +-------------------------------------+-----------------------------------+  |
|                                        |                                      |
|  +-------------------------------------+-----------------------------------+  |
|  |                       Service & Business Logic Layer                    |  |
|  |  - Notification Service: mockSendNotification integration               |  |
|  |  - Signature & Claim Processor: Status transition & persistence         |  |
|  +-------------------------------------+-----------------------------------+  |
+----------------------------------------|--------------------------------------+
                                         | Mongoose ODM
                                         v
+-------------------------------------------------------------------------------+
|                               DATABASE TIER                                   |
|  MongoDB (port: 27017)                                                        |
|  - Collection: students      (Mock student profiles & LINE user IDs)          |
|  - Collection: packages      (Package lifecycle, status, signature, image)    |
|  - Collection: notifications (History of sent LINE notifications)             |
+-------------------------------------------------------------------------------+
```

---

### 3. โครงสร้างซอร์สโค้ดและโฟลเดอร์ (Directory Structure)

```
PACKAGE-Notify-MockUp/
├── .gitignore                      # กรอง node_modules, dist, .env, .vscode, coverage
├── package.json                    # Root Unified Runner (concurrently, dev, test, build)
├── package-lock.json
├── README.md                       # รายละเอียดโครงการ และ Quick Start คู่มือรันระบบ
├── API_CONTRACT.md                 # สัญญาข้อมูล REST API ครบทั้ง 16 Endpoints
├── start-dev.bat                   # Windows One-Click Dev Launcher (เปิด 3 จอพร้อมเบราว์เซอร์)
├── stop-dev.bat                    # Windows Utility สำหรับสั่งหยุด Services ทั้งหมด
├── test.bat                        # Windows One-Click Automated Integration Test
│
├── Documents/                      # เอกสารประกอบโครงการตามมาตรฐาน ISO 29110
│   ├── requirements-spec.md        # ข้อกำหนดความต้องการ FR-01 ถึง FR-05, NFR
│   ├── Software-Design-Document.md # เอกสารการออกแบบสถาปัตยกรรมระบบ (ฉบับนี้)
│   ├── Test-Cases.md               # เอกสารรายละเอียดชุดการทดสอบสำหรับ Task 17
│   ├── API_CONTRACT.md             # สำเนาสัญญา API สำหรับทีมงาน
│   └── images/                     # ภาพ UI Mockups และสถาปัตยกรรม
│
├── backend/                        # เซิร์ฟเวอร์ API (Node.js, Express, MongoDB, Supertest)
│   ├── server.js                   # จุดเริ่มต้นระบบ (Bootstrap & Database Connection)
│   ├── package.json                # สคริปต์ start, test และ dependencies
│   ├── .env.example                # แม่แบบ Environment Variables (PORT, MONGO_URI, CORS)
│   ├── tests/
│   │   └── api.test.js             # Automated Integration Tests (11 test cases)
│   └── src/
│       ├── app.js                  # Express App Config, Middlewares, Route Registry
│       ├── config/
│       │   ├── config.js           # Centralized Configuration (Singleton Pattern)
│       │   └── db.js               # การเชื่อมต่อ MongoDB ผ่าน Mongoose
│       ├── middleware/
│       │   └── errorHandler.js     # AppError, asyncHandler, notFound, errorHandler
│       ├── models/                 # Mongoose Data Schemas
│       │   ├── Student.js          # ข้อมูลนักศึกษา
│       │   ├── Package.js          # ข้อมูลพัสดุ
│       │   └── Notification.js     # ข้อมูลประวัติการแจ้งเตือน
│       ├── controllers/
│       │   ├── packageController.js# ตรรกะจัดการพัสดุ บันทึก เบิกจ่าย เคลม ประกาศ
│       │   └── studentController.js# ตรรกะตรวจสอบชื่อและดึงข้อมูลนักศึกษา
│       ├── routes/
│       │   ├── packages.js         # REST Endpoints สำหรับ /api/packages
│       │   ├── students.js         # REST Endpoints สำหรับ /api/students
│       │   ├── studentRoutes.js    # Alias routes รองรับความเข้ากันได้
│       │   └── notifications.js    # REST Endpoints สำหรับระบบแจ้งเตือน
│       └── services/
│           └── notificationService.js # ผสานการทำงานกับ mock-line-notify.js
│
├── frontend/                       # หน้าต่าง UI ฝั่งผู้ใช้งาน (React 19 + Vite)
│   ├── staff/                      # พอร์ทัลเจ้าหน้าที่หอพัก (Port: 5174)
│   │   ├── index.html
│   │   ├── vite.config.js          # Server port: 5174
│   │   ├── .env.example            # VITE_API_BASE_URL
│   │   ├── style.css
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx             # จัดการสถานะรวม, Navigation, Auto Refresh
│   │       ├── services/
│   │       │   └── apiClient.js    # Unified API Service Layer สำหรับ Staff
│   │       ├── data/
│   │       │   └── mockData.js     # ข้อมูลสำรองกรณีออฟไลน์
│   │       └── components/
│   │           ├── Navbar.jsx
│   │           ├── StatCard.jsx    # แสดงจำนวนพัสดุ รอรับ/รับแล้ว/ไม่ทราบชื่อ
│   │           ├── PackageForm.jsx # แบบฟอร์มบันทึกพัสดุและตรวจชื่อนักศึกษา
│   │           ├── PackageManagement.jsx # ตารางรายการพัสดุและเปลี่ยนสถานะ
│   │           ├── UnknownPackages.jsx   # รายการพัสดุไม่ทราบชื่อและปุ่ม Broadcast
│   │           ├── Dashboard.jsx         # หน้าสรุปภาพรวม
│   │           ├── Toast.jsx             # การแจ้งเตือนสถานะการทำงาน
│   │           └── ConfirmDeleteModal.jsx# กล่องยืนยันการลบ
│   │
│   ├── student/                    # พอร์ทัลนักศึกษา (Port: 5173)
│   │   ├── index.html
│   │   ├── vite.config.js          # Server port: 5173, host: true
│   │   ├── .env.example            # VITE_API_BASE_URL
│   │   ├── style.css
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx             # ค้นหาพัสดุ, รับแจ้งเตือน, ลงนามดิจิทัล
│   │       ├── services/
│   │       │   └── apiClient.js    # Unified API Service Layer สำหรับ Student
│   │       ├── data/
│   │       │   └── mockData.js
│   │       └── components/
│   │           └── BroadcastBoard.jsx # กระดานพัสดุไม่ทราบชื่อและฟังก์ชันเคลม
│   └── shared/
│       └── rmutl-logo.png          # โลโก้มหาวิทยาลัยที่ใช้ร่วมกัน
│
├── notify-mockup/                  # โมดูลจำลองการส่งแจ้งเตือนและระบบภายนอก
│   └── mock-line-notify.js         # ฟังก์ชันจำลองการส่ง LINE Notify สวยงามผ่าน Console/Logger
│
└── mockup-data/
    └── mock_students.json          # ชุดข้อมูลนักศึกษาตั้งต้นสำหรับทดสอบ (Seed Data)
```

---

### 4. โครงสร้างฐานข้อมูล (Database Schemas)

#### 4.1 Collection: `students`
| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ข้อกำหนด (Constraints) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `student_id` | String | Required, Unique, Trimmed | รหัสนักศึกษา (เช่น "651234567-8") |
| `first_name` | String | Required, Trimmed | ชื่อจริงภาษาไทย |
| `last_name` | String | Required, Trimmed | นามสกุลภาษาไทย |
| `building` | String | Required | อาคารหอพัก (เช่น "S20", "หอพักชาย 1") |
| `room_number` | String | Required | หมายเลขห้องพัก (เช่น "202", "314") |
| `line_user_id` | String | Optional | LINE User ID หรือ Account Handle (เช่น "@Pama") |
| `phone_number` | String | Optional | เบอร์โทรศัพท์ติดต่อ |

#### 4.2 Collection: `packages`
| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ข้อกำหนด (Constraints) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | รหัสเฉพาะของระเบียนพัสดุ |
| `tracking_number`| String | Required, Indexed | เลขพัสดุบนกล่องพัสดุ |
| `receiver_name_on_box`| String | Required, Trimmed | ชื่อผู้รับที่จ่าหน้าบนกล่อง |
| `matched_student`| ObjectId | Ref: 'Student', Nullable | เชื่อมโยง ID นักศึกษาเมื่อชื่อตรง |
| `status` | String | Enum: `['pending', 'received', 'unknown']` | สถานะพัสดุ (Default: 'pending') |
| `is_broadcasted` | Boolean | Default: false | สถานะการประกาศขึ้นบอร์ดกลาง (FR-04) |
| `image_path` | String | Optional (Base64/URL) | รูปถ่ายกล่องพัสดุ |
| `arrival_time` | Date | Default: Date.now | วันและเวลาที่พัสดุถูกบันทึกเข้าระบบ |
| `pickup_time` | Date | Default: null | วันและเวลาที่นักศึกษามารับพัสดุ |
| `signature_data` | String | Long String (Base64) | ข้อมูลภาพลายมือชื่อดิจิทัล (FR-05) |
| `reminded_at` | Date | Default: null | เวลาล่าสุดที่มีการส่งแจ้งเตือนซ้ำ (FR-03) |

#### 4.3 Collection: `notifications`
| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ข้อกำหนด (Constraints) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | รหัสบันทึกประวัติการส่งแจ้งเตือน |
| `recipient` | String | Required | ผู้รับการแจ้งเตือน (ชื่อ หรือ LINE ID) |
| `package_id` | ObjectId | Ref: 'Package' | อ้างอิงพัสดุที่เกี่ยวข้อง |
| `type` | String | Enum: `['arrival', 'reminder_5h', 'broadcast']` | ประเภทการแจ้งเตือน |
| `message` | String | Required | ข้อความแจ้งเตือนที่จัดรูปแบบแล้ว |
| `sent_at` | Date | Default: Date.now | เวลาที่ระบบทำการส่ง |

---

### 5. สถาปัตยกรรมการสื่อสารและการจัดการข้อผิดพลาด (Error & Logging Architecture)

#### 5.1 Centralized Error Handling Architecture
สถาปัตยกรรมจัดการ Error ถูกออกแบบตามหลัก Best Practice เพื่อให้ระบบมีความเสถียร ไม่เกิด Unhandled Promise Rejection และตอบกลับในโครงสร้าง JSON ที่สม่ำเสมอ:

```
[Incoming Request]
       |
       v
  [Route Controller] (ห่อหุ้มด้วย asyncHandler เพื่อดักจับ Async Error อัตโนมัติ)
       |
       +---> [Business Logic Error] ---> new AppError(message, statusCode)
       |
       v
 [Central Error Handler Middleware] (ดักจับทุก Error ที่ท้ายสุดของ Pipeline)
       |
       +---> แปลงสถานะ HTTP Status Code (400, 404, 500)
       +---> จัดรูปแบบ Standard JSON Response
       +---> ซ่อน Stack Trace ใน Production Mode (Security NFR)
```

**รูปแบบมาตรฐานของ Response เมื่อเกิดข้อผิดพลาด:**
```json
{
  "success": false,
  "status": "fail",
  "message": "ไม่พบพัสดุที่ระบุในระบบ"
}
```

#### 5.2 HTTP Request Logging (Morgan)
ระบบติดตั้ง Morgan Logger ที่ `backend/src/app.js` เพื่อบันทึก Request ที่เข้ามาในระบบแบบเรียลไทม์ พร้อม HTTP Method, URL Path, Status Code, Response Time (ms) และ Content Length เพื่อสนับสนุนการตรวจสอบระบบ (Auditability)

---

### 6. การออกแบบและเชื่อมต่อส่วนต่อประสาน (API Contracts)

ระบบมี REST Endpoints รวมทั้งสิ้น 16 รายการ ตามที่ได้ระบุไว้ใน `API_CONTRACT.md`:

| หมวดหมู่ | Method | Endpoint | คำอธิบาย |
| :--- | :---: | :--- | :--- |
| **System** | `GET` | `/` | Health Check สถานะเซิร์ฟเวอร์ และเวอร์ชันระบบ |
| **Verification** | `GET` | `/api/students/verify` | ตรวจสอบชื่อนักศึกษา Exact Match (FR-01) |
| **Students** | `GET` | `/api/students` | ดึงรายชื่อนักศึกษาทั้งหมด |
| | `POST`| `/api/students` | เพิ่มข้อมูลนักศึกษาใหม่ |
| **Packages** | `GET` | `/api/packages` | รายการพัสดุทั้งหมด (รองรับ status filter) |
| | `POST`| `/api/packages` | บันทึกพัสดุเข้าใหม่ พร้อมตรวจชื่อและส่ง Notify (FR-01, FR-02) |
| | `GET` | `/api/packages/:id` | ดูรายละเอียดพัสดุรายชิ้น |
| | `PUT` | `/api/packages/:id` | แก้ไขข้อมูลพัสดุ |
| | `DELETE`| `/api/packages/:id` | ลบข้อมูลพัสดุออกจากระบบ |
| | `PUT` | `/api/packages/:id/status` | อัปเดตสถานะพัสดุ (`pending`, `received`, `unknown`) |
| | `PUT` | `/api/packages/:id/receive`| ยืนยันการรับพัสดุ พร้อมบันทึกลายเซ็นดิจิทัล (FR-05) |
| **Broadcast** | `POST`| `/api/packages/broadcast` | สั่งประกาศพัสดุไม่ทราบชื่อขึ้นบอร์ดกลาง (FR-04) |
| | `GET` | `/api/packages/broadcasts`| ดึงรายการพัสดุบนบอร์ดกลางสำหรับนักศึกษา |
| | `POST`| `/api/packages/:id/claim` | นักศึกษากดยื่นขอเคลมพัสดุจากบอร์ด |
| **Notification** | `GET` | `/api/notifications/check-reminders` | สแกนพัสดุค้างรับเกิน 5 ชม. และส่งแจ้งเตือนซ้ำ (FR-03) |
| **Maintenance** | `POST`| `/api/packages/reset-database` | รีเซ็ตข้อมูลฐานข้อมูลกลับสู่ชุดข้อมูลเริ่มต้น |

---

### 7. การเชื่อมโยงและผสานระบบ (System Integration Workflow)

#### Flow ที่ 1: พัสดุชื่อตรงกับฐานข้อมูล (Matched Package Flow)
```
[Staff UI]                          [Backend Server]                   [Notify Mockup]          [Student UI]
    |                                      |                                  |                       |
    |-- 1. กรอกชื่อ & ตรวจสอบ ------------>|                                  |                       |
    |<- 2. คืนผลพบชื่อ (Auto-Fill) --------|                                  |                       |
    |-- 3. บันทึกพัสดุ (POST /packages) -->|                                  |                       |
    |                                      |-- 4. บันทึกลง MongoDB           |                       |
    |                                      |-- 5. เรียก mockSendNotification ->|                       |
    |                                      |      (ส่ง LINE แจ้งเตือนทันที)   |                       |
    |<- 6. ตอบกลับ 201 Created ------------|                                  |                       |
    |                                                                         |                       |
    |                                      |<-- 7. นักศึกษาค้นหาพัสดุตนเอง --------------------------|
    |                                      |--- 8. ส่งรายการพัสดุสถานะ pending -------------------->|
    |                                      |                                                          |
    |                                      |<-- 9. เซ็นรับและกดยืนยัน (PUT /receive) -----------------|
    |                                      |-- 10. บันทึก Base64 Signature & เวลา pickup_time         |
    |<- 11. ตาราง Staff เปลี่ยนเป็น received|                                                          |
```

#### Flow ที่ 2: พัสดุไม่ทราบชื่อและการประกาศขึ้นบอร์ด (Unknown & Broadcast Flow)
```
[Staff UI]                          [Backend Server]                                            [Student UI]
    |                                      |                                                          |
    |-- 1. กรอกชื่อไม่พบในระบบ ----------->|                                                          |
    |<- 2. จัดเข้าหมวด 'unknown' ----------|                                                          |
    |-- 3. กด Broadcast ประกาศ ----------->|                                                          |
    |                                      |-- 4. อัปเดต is_broadcasted = true                        |
    |                                      |<-- 5. เปิดหน้า Broadcast Board --------------------------|
    |                                      |--- 6. แสดงกล่องพัสดุไม่ทราบชื่อ ------------------------>|
    |                                      |<-- 7. กดยื่นเคลมระบุตัวตน (POST /claim) -----------------|
    |                                      |-- 8. ผูกพัสดุเข้ากับนักศึกษา                             |
    |<- 9. รายการพัสดุอัปเดตตรงกัน --------|                                                          |
```

---

### 8. สรุปความพร้อมและแนวทางการส่งมอบ (Traceability & Next Tasks)
* สถาปัตยกรรมปัจจุบันได้ผ่านการ Refactor และ Integration ครบทุกโมดูลใน **Task 16**
* มี Automated Integration Test ยืนยันการทำงาน 11/11 Test Cases ใน `backend/tests/api.test.js`
* พร้อมรองรับการดำเนินการทดสอบทั้งระบบโดยทีมงานใน **Task 17 (System Testing by Test Cases)**
