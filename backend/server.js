const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const studentRoutes = require('./src/routes/studentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (we'll log the error but not crash if it fails for now so mock data still works)
const connectToDB = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('Could not connect to MongoDB. Running without DB.');
  }
};
connectToDB();

// Routes
app.use('/api/student', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});