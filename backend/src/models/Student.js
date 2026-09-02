const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  building: { type: String },
  room_number: { type: String },
  line_user_id: { type: String }
});

//ผูกSchemaนี้เข้ากับ Collection 'students' ในฐานข้อมูล
module.exports = mongoose.model('Student', StudentSchema);