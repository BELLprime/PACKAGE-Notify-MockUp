const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    // 1. เลขพัสดุ
    tracking: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    // 2. ชื่อผู้รับ (อ่านจากหน้ากล่อง)
    recipient: {
      type: String,
      required: true,
      trim: true
    },
    // 3. รูปถ่ายกล่องพัสดุ
    photo_url: {
      type: String,
      default: ''
    },
    // 4. หมายเหตุ (เช่น มีรอยบุบ, เก็บเงินปลายทาง)
    note: {
      type: String,
      default: ''
    },
    // รหัสนักศึกษา (ระบบจะดึงมาผูกให้อัตโนมัติเมื่อชื่อตรงกับฐานข้อมูล)
    student_id: {
      type: String,
      default: null
    },
    // สถานะ: 'pending' (รอรับพัสดุ), 'received' (รับแล้ว), 'unknown' (พัสดุไม่ทราบชื่อ)
    status: {
      type: String,
      enum: ['pending', 'received', 'unknown'],
      default: 'pending'
    },
    // สถานะการ Broadcast ประกาศหาเจ้าของ (สำหรับพัสดุไม่ทราบชื่อ FR-04)
    is_broadcasted: {
      type: Boolean,
      default: false
    },
    broadcast_at: {
      type: Date,
      default: null
    },
    arrival_date: {
      type: Date,
      default: Date.now
    },
    pickup_date: {
      type: Date,
      default: null
    },
    signature_data: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Package', PackageSchema);
