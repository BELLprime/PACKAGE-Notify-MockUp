const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    // เลขพัสดุ
    tracking: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    // ชื่อผู้รับ (อ่านจากหน้ากล่อง)
    recipient: {
      type: String,
      required: true,
      trim: true
    },
    // รูปถ่ายกล่องพัสดุ
    photo_url: {
      type: String,
      default: ''
    },
    // หมายเหตุ (เช่น มีรอยบุบ, เก็บเงินปลายทาง)
    note: {
      type: String,
      default: ''
    },
    // รหัสนักศึกษา (ระบบจะดึงมาผูกให้อัตโนมัติเมื่อชื่อตรงกับฐานข้อมูล)
    student_id: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'received', 'unknown', 'claimed'],
      default: 'pending'
    },
    claimed_by: {
      type: String,
      default: null
    },
    claim_proof: {
      type: String,
      default: null
    },
    is_broadcasted: {
      type: Boolean,
      default: false
    },
    broadcast_at: {
      type: Date,
      default: null
    },
    // สถานะการแจ้งเตือนซ้ำเมื่อเกิน 5 ชม.
    reminder_sent: {
      type: Boolean,
      default: false
    },
    reminder_sent_at: {
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
