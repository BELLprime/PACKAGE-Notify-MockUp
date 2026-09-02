# Software Design Document (SDD)
## ระบบติดตามและแจ้งเตือนพัสดุหอพัก Mockup

### 1. บทนำ (Introduction)
*วัตถุประสงค์:* 
เอกสารฉบับนี้จัดทำขึ้นเพื่ออธิบายการออกแบบสถาปัตยกรรม (Architecture) โครงสร้างข้อมูล และส่วนประกอบต่างๆ ของ "ระบบติดตามและแจ้งเตือนพัสดุหอพัก Mockup" เพื่อให้ทีมพัฒนา (Staff UI, Student UI, Notify Mockup Developer) ใช้เป็นแนวทางร่วมกันในการพัฒนาโค้ดใน Sprint 2 และ 3

### 2. สถาปัตยกรรมระบบ (System Architecture)
ระบบถูกออกแบบโดยใช้รูปแบบ Client-Server แบบลูกผสม (Hybrid) โดยใช้เทคโนโลยี (Tech Stack) ดังนี้:
* *Frontend:* React (สร้างด้วย Vite) จัดการ UI Component และ Routing ด้วย react-router-dom 
* *Backend:* Node.js + Express สำหรับสร้าง REST API
* *Database:* MongoDB (จัดการผ่าน MongoDB Compass และเชื่อมต่อกับ Backend ด้วย Mongoose)
* *API Communication:* ใช้ axios ในการรับส่งข้อมูลระหว่าง Frontend และ Backend
* *Notification & Signature:* 
  * การแจ้งเตือนจะใช้ UI จำลองการทำงานแทนระบบ LINE ของจริง
  * ลายเซ็นดิจิทัลใช้ไลบรารี react-signature-canvas

*แผนภาพการทำงานเบื้องต้น (Data Flow):*
1. *Staff UI* ส่งข้อมูลพัสดุใหม่ (ชื่อ, รูปภาพ) ผ่าน API ไปยัง *Backend*
2. *Backend* ค้นหาชื่อเปรียบเทียบกับ mock_students.json ใน *MongoDB* (Exact Match) และบันทึกข้อมูลพัสดุ
3. *Notify Mockup* จำลองการยิงแจ้งเตือนไปให้นักศึกษา
4. *Student UI* สามารถเข้ามาตรวจสอบพัสดุที่หน้า Broadcast Board หรือหน้าค้นหาพัสดุส่วนตัว
5. นักศึกษาทำการเซ็นรับผ่าน *Notify Mockup* ซึ่งจะส่งลายเซ็นกลับไปบันทึกที่ *Backend*

### 3. โครงสร้างโฟลเดอร์ (Directory Structure)
เพื่อให้การทำงานร่วมกันในทีมเป็นไปอย่างมีประสิทธิภาพและลดปัญหาการรวมโค้ด (Merge Conflict) ระบบจึงถูกแบ่งโครงสร้างโฟลเดอร์ตามความรับผิดชอบหลัก ดังนี้:


```PACKAGE-Notify-MockUp/
├── docs/                   # เอกสารประกอบโครงการ (PM + SI) เช่น requirements-spec.md
├── backend/                # Server ฝั่ง Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js       # ไฟล์เชื่อมต่อฐานข้อมูล MongoDB
│   │   ├── models/         # Schema ของฐานข้อมูล (Student.js, Package.js)
│   │   ├── routes/         # API Routes (students.js, packages.js)
│   │   ├── controllers/    # ควบคุมการทำงานของ API
│   │   └── app.js          # ไฟล์หลักในการรัน Express Server
│   ├── package.json
│   └── .env.example
├── frontend/               # UI หน้าบ้าน (React + Vite)
│   ├── staff/              # หน้าจอสำหรับเจ้าหน้าที่ (Staff UI Developer)
│   ├── student/            # หน้าจอสำหรับนักศึกษา (Student UI Developer)
│   └── shared/             # Components และ Assets ที่ใช้งานร่วมกัน
├── notify-mockup/          # ระบบจำลองการแจ้งเตือน (Notify Mockup Developer)
│   ├── mock-line-notify.js # ไฟล์จำลองการส่งแจ้งเตือน
│   └── signature-mockup/   # ไฟล์จำลองหน้าจอเซ็นรับดิจิทัล
└── mock-data/              
    └── mock_students.json  # ข้อมูลนักศึกษาจำลองจาก Task 4
```

### 4. โครงสร้างฐานข้อมูล (Database Schema)
ระบบใช้ MongoDB (NoSQL) โดยแบ่งออกเป็น Collection หลักๆ ดังนี้:

#### 4.1 Collection: students (ข้อมูลนักศึกษาจำลอง)
สร้างจากไฟล์ mock_students.json ใน Task 4
* student_id (String): รหัสนักศึกษา (Primary identifier)
* first_name (String): ชื่อ
* last_name (String): นามสกุล
* building (String):อาคาร
* room_number (String): หมายเลขห้อง
* line_user_id (String): ID จำลองสำหรับดึงข้อมูลการแจ้งเตือน

#### 4.2 Collection: packages (ข้อมูลพัสดุ)
* _id (ObjectId): รหัสพัสดุ (Auto-generated)
* receiver_name_on_box (String): ชื่อผู้รับพัสดุที่เขียนหน้ากล่อง
* image_path (String): เส้นทางไฟล์รูปถ่ายพัสดุ
* status (String): สถานะพัสดุ เช่น pending (ค้างรับ), received (รับแล้ว), unknown (ไม่ทราบชื่อ)
* arrival_time (Date): วันเวลาที่บันทึกพัสดุเข้าระบบ
* pickup_time (Date): วันเวลาที่พัสดุถูกรับไป
* signature_data (String): ข้อมูลภาพลายเซ็นในรูปแบบ Base64

### 5. โครงสร้างการทำงานของ Frontend (UI Modules)
ส่วน Frontend แบ่งออกเป็น 3 โมดูลตามผู้รับผิดชอบ:

#### 5.1 Staff UI (ส่วนของเจ้าหน้าที่หอพัก)
* *หน้าบันทึกพัสดุเข้า:* มีแบบฟอร์มกรอกชื่อผู้รับและอัปโหลดรูปถ่ายพัสดุ
* *หน้าจัดการสถานะพัสดุ:* แสดงรายการพัสดุทั้งหมด เปลี่ยนสถานะการรับของได้
* *หน้าพัสดุที่ไม่ทราบชื่อ:* ตารางแสดงพัสดุที่ระบบเช็คชื่อไม่ตรงกับฐานข้อมูลนักศึกษา (FR-04)

#### 5.2 Student UI (ส่วนของนักศึกษา)
* *หน้าค้นหาพัสดุ/สถานะ:* แสดงสถานะพัสดุของตนเอง (มาถึงแล้ว / ค้างรับ) 
* *หน้า Broadcast Board:* บอร์ดประกาศแสดงรายการพัสดุที่ไม่ทราบชื่อ เพื่อให้นักศึกษาเข้ามาตรวจสอบ (FR-04)

#### 5.3 Notify Mockup (ส่วนจำลองการแจ้งเตือน)
* *หน้าจำลองแชทแจ้งเตือน:* จำลองหน้าต่างแจ้งเตือนรายบุคคล และระบบจำลองแจ้งเตือนซ้ำ (เมื่อพัสดุค้างรับเกิน 5 ชั่วโมง คำนวณโดยใช้ dayjs)
* *หน้าเซ็นรับดิจิทัล (Digital Signature):* Canvas สำหรับเซ็นชื่อรับพัสดุและส่งภาพกลับไปยังเซิร์ฟเวอร์

### 6. การออกแบบ API (API Endpoints เบื้องต้น)
กำหนดโครงสร้าง API เพื่อให้ Frontend เรียกใช้:

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/packages | บันทึกข้อมูลพัสดุเข้าใหม่ พร้อมรูปถ่าย |
| GET | /api/packages | ดึงรายการพัสดุทั้งหมด (รองรับ Query filter สถานะ) |
| PUT | /api/packages/:id/status | อัปเดตสถานะพัสดุ (เช่น เปลี่ยนเป็น 'received') |
| GET | /api/students/verify | ส่งชื่อไปตรวจสอบกับฐานข้อมูล students (Exact Match) |
| POST | /api/packages/:id/sign | บันทึกลายเซ็นดิจิทัลพร้อมอัปเดตเวลา pickup_time |