const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    tracking: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    recipient: {
      type: String,
      required: true,
      trim: true
    },
    student_id: {
      type: String,
      default: null
    },
    building: {
      type: String,
      default: ''
    },
    room_number: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    photo_url: {
      type: String,
      default: ''
    },
    // สถานะ: 'pending' (รอรับพัสดุ), 'received' (รับแล้ว), 'unknown' (พัสดุไม่ทราบชื่อ)
    status: {
      type: String,
      enum: ['pending', 'received', 'unknown'],
      default: 'pending'
    },
    // จำลองการ Broadcast ประกาศหาเจ้าของ (FR-04)
    is_broadcasted: {
      type: Boolean,
      default: false
    },
    broadcast_at: {
      type: Date,
      default: null
    },
    note: {
      type: String,
      default: ''
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
