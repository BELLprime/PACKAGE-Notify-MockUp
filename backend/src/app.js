const express = require('express');
const cors = require('cors');

const studentsRoute = require('./routes/students');
const studentDashboardRoute = require('./routes/studentRoutes');
const packageRoutes = require('./routes/packages');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentsRoute);
app.use('/api/student', studentDashboardRoute);
app.use('/api/packages', packageRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('📦 Package Notify Mockup API Server is Running!');
});

module.exports = app;
