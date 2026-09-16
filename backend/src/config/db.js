const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('🔥 MongoDB Connected Successfully!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error: ', err.message);
    throw err;
  }
};

module.exports = connectDB;