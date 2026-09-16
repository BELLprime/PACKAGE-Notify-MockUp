const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const studentsRoute = require('./routes/students');
const studentDashboardRoute = require('./routes/studentRoutes');
const packageRoutes = require('./routes/packages');
const notificationRoutes = require('./routes/notifications');

const app = express();

// 1. CORS Configuration - อยู่บนสุดเพื่อรองรับ Preflight OPTIONS Requests
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// 2. HTTP Request Logger (Morgan) - dev แสดงสีเข้าใจง่าย, prod เก็บ log ละเอียด
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// 3. Body Parser (รองรับ Base64 สำหรับลายเซ็นดิจิทัล FR-05)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. API Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '📦 Package Notify Mockup API Server is Running!',
    environment: config.nodeEnv,
    version: '2.0.0'
  });
});

// 5. Application API Routes
app.use('/api/students', studentsRoute);
app.use('/api/student', studentDashboardRoute);
app.use('/api/packages', packageRoutes);
app.use('/api/notifications', notificationRoutes);

// 6. Centralized Error Handlers (Task 16.1 Architecture)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
