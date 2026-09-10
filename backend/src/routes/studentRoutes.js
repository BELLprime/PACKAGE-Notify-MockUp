const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Get student dashboard data (mock data for now)
router.get('/dashboard/:id', studentController.getDashboardData);

// Get all students (from DB)
router.get('/', studentController.getAllStudents);

module.exports = router;
