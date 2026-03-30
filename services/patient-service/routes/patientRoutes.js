const express = require('express');
const router = express.Router();

// 1. Import your controllers
const { registerPatient, loginPatient, uploadMedicalReport } = require('../controllers/patientController');

// 2. Import your newly renamed middlewares!
const { protect } = require('../middleware/patientAuth');
const upload = require('../middleware/reportUploader');

// Public Routes
router.post('/register', registerPatient);
router.post('/login', loginPatient);

// Private Route 
router.post('/upload-report', protect, upload.single('reportFile'), uploadMedicalReport);

module.exports = router;