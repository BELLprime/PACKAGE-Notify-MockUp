# PACKAGE-Notify-MockUp
ระบบติดตามและแจ้งเตือนพัสดุหอพัก Mockup (Midterm Project)

สำหรับรายวิชา ENGSE205 Software Process and Quality Assurance 
ระยะเวลาดำเนินการ: 4 สัปดาห์ (3 Sprints)

## 🛠 Tech Stack (เทคโนโลยีที่ใช้งาน)
* *Frontend:* React (สร้างด้วย Vite)
* *Backend:* Node.js + Express
* *Database:* MongoDB (เชื่อมต่อและจัดการด้วย Mongoose)
* *API Calls:* Axios
* *Routing:* react-router-dom (แยกหน้า Staff/Student)
* *Date Management:* Day.js (สำหรับจัดการเวลาแจ้งเตือนค้างรับ 5 ชม.)
* *Digital Signature:* react-signature-canvas

## 📁 โครงสร้างโปรเจกต์ (Project Structure)
โครงสร้างแบบแบ่งแยกสัดส่วนเพื่อรองรับการทำงานร่วมกันในทีม ตามแผนการแยก Branch ของ Git
```
PACKAGE-Notify-MockUp/
├── README.md
├── .gitignore
│
├── docs/                   # เอกสารฝั่ง ISO 29110 (PM + SI)
│   ├── requirements-spec.md        # FR-01 ถึง FR-05, NFR-01, NFR-02
│   ├── software-design-document.md # สถาปัตยกรรมและการออกแบบระบบ (Task 5)
│   ├── traceability-matrix.md      # SI.3
│   ├── test-report.md              # SI.5
│   └── user-manual.md              # SI.6
│
├── backend/                # Server ฝั่ง Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js       # ไฟล์เชื่อมต่อฐานข้อมูล MongoDB
│   │   ├── models/         # Schema ของฐานข้อมูล
│   │   │   ├── Student.js
│   │   │   └── Package.js
│   │   ├── routes/         # API Routes
│   │   │   ├── students.js
│   │   │   └── packages.js
│   │   ├── controllers/
│   │   └── app.js
│   ├── package.json
│   └── .env.example
│
├── frontend/               # UI หน้าบ้าน (React + Vite)
│   ├── staff/              # หน้าจอสำหรับเจ้าหน้าที่ (Staff UI Developer)
│   ├── student/            # หน้าจอสำหรับนักศึกษา (Student UI Developer)
│   └── shared/             # Components และ Assets ที่ใช้งานร่วมกัน
│
├── notify-mockup/          # ระบบจำลองการแจ้งเตือน (Notify Mockup Developer)
│   ├── mock-line-notify.js # ไฟล์จำลองการส่งแจ้งเตือน
│   └── signature-mockup/   # ไฟล์จำลองหน้าจอเซ็นรับดิจิทัล
│
└── mock-data/              
    └── mock_students.json  # ข้อมูลนักศึกษาจำลอง (สำหรับทดสอบ)
```
## 👥 การแบ่งงาน (Role & Responsibilities)
เพื่อหลีกเลี่ยงข้อขัดแย้งในการรวมโค้ด (Merge Conflict) โปรเจกต์นี้แบ่งผู้รับผิดชอบหลักและ Branch การทำงานดังนี้:
* *Staff UI Developer* (feature/staff-ui): รับผิดชอบหน้าบันทึกและจัดการพัสดุในโฟลเดอร์ frontend/staff/
* *Student UI Developer* (feature/student-ui): รับผิดชอบหน้าแสดงสถานะและบอร์ดประกาศในโฟลเดอร์ frontend/student/
* *Notify Mockup Developer* (feature/notify-mockup): รับผิดชอบระบบแจ้งเตือนและลายเซ็นในโฟลเดอร์ notify-mockup/
* *Backend Developer* (feature/backend-api): รับผิดชอบ API และฐานข้อมูลในโฟลเดอร์ backend/

---

## 🚀 การติดตั้งและรันโปรเจกต์ (Quick Start & Dev Runners)

### วิธีที่ 1: ดับเบิ้ลคลิกไฟล์ One-Click Runner (แนะนำสำหรับ Windows 🌟)
* `start-dev.bat` : ดับเบิ้ลคลิกเพื่อรัน Backend (5000), Staff UI (5174), และ Student UI (5173) พร้อมกัน 3 หน้าต่าง พร้อมตัวเลือกเปิดเว็บเบราว์เซอร์อัตโนมัติ
* `test.bat` : ดับเบิ้ลคลิกเพื่อรัน Automated Integration Test ทั้ง 11 การทดสอบ
* `stop-dev.bat` : ดับเบิ้ลคลิกเพื่อปิด Services ทั้งหมดที่รันอยู่บนพอร์ต 5000, 5173, 5174

---

### วิธีที่ 2: รันผ่าน Root NPM Scripts (Cross-Platform / VS Code Terminal)
รันคำสั่งจาก root directory ของโปรเจกต์ได้ทันที:

```bash
# ติดตั้ง dependencies ทั้งหมด
npm install

# รันทุก Services พร้อมกัน (Backend + Staff UI + Student UI)
npm run dev
# หรือ
npm start

# รัน Automated Integration Tests (11 test cases ครบทุก Functional Requirement)
npm test

# Build ตรวจสอบความถูกต้องของ Frontend ทั้ง Staff และ Student
npm run build
```

#### บริการและพอร์ตที่เปิดใช้งาน (URLs):
| บริการ | URL | คำอธิบาย |
| :--- | :--- | :--- |
| **Backend API** | `http://localhost:5000` | REST API Server, Health Check & Error Handling |
| **Staff Portal** | `http://localhost:5174` | หน้าจอเจ้าหน้าที่: ตรวจสอบชื่อ, บันทึกพัสดุ, ประกาศหาเจ้าของ |
| **Student Portal** | `http://localhost:5173` | หน้าจอนักศึกษา: ดูสถานะพัสดุ, บอร์ดกลาง, เคลมพัสดุ, เซ็นรับดิจิทัล |
| **API Contract** | [`API_CONTRACT.md`](./Documents/API_CONTRACT.md) | เอกสารสัญญาข้อมูล API ครบทั้ง 16 Endpoints |

