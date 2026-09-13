const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    student_id: {
      type: String,
      required: true
    },
    line_user_id: {
      type: String,
      default: ''
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true
    },
    tracking: {
      type: String,
      required: true
    },
    // ประเภท: 'personal_arrival' (แจ้งเตือนพัสดุมาถึง - Task 13), 'reminder_5h' (เตือนซ้ำ 5 ชม. - Task 14), 'broadcast' (ประกาศพัสดุไม่ทราบชื่อ)
    type: {
      type: String,
      enum: ['personal_arrival', 'reminder_5h', 'broadcast'],
      default: 'personal_arrival'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    sent_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'delivered'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);
