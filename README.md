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
