const express = require('express');
const cors = require('cors');

const studentRoutes = require('./routes/students');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);

app.get('/', (req, res) => {
  res.send('Package Notify Mockup API Server is Running!');
});

module.exports = app;
