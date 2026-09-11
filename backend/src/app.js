const express = require('express');
const cors = require('cors');

const studentsRoute = require('./routes/students');
const studentDashboardRoute = require('./routes/studentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentsRoute);
app.use('/api/student', studentDashboardRoute);

app.get('/', (req, res) => {
  res.send('📦 Package Notify Mockup API Server is Running!');
});

module.exports = app;
