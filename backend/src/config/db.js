const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/package_notify_db';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('🔥 MongoDB Connected Successfully!');
  } catch (err) {
    console.error('X MongoDB Connection Error: ', err.message);
    throw err;
  }
};

module.exports = connectDB;