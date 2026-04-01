const express = require('express');
const router = express.Router();

// 1. Import your controllers (Updated with new profile functions)
const { 
  registerPatient,
  loginPatient,
  uploadMedicalReport,
  downloadMedicalReport,
  updatePatientProfile,
  updatePatientPassword,
  deletePatientAccount,
  getAllPatients,
  updatePatientById,
  deletePatientById 
} = require('../controllers/patientController');

// 2. Import your middlewares
const { protect } = require('../middleware/patientAuth');
const upload = require('../middleware/reportUploader');

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/register', registerPatient);
router.post('/login', loginPatient);

// ==========================================
// PRIVATE ROUTES (Require Authentication)
// ==========================================

// Medical Records
router.post('/upload-report', protect, upload.single('reportFile'), uploadMedicalReport);
router.get('/reports/:filename', protect, downloadMedicalReport);

// Profile Management (NEW)
router.put('/profile', protect, updatePatientProfile);
router.put('/password', protect, updatePatientPassword);
router.delete('/account', protect, deletePatientAccount);

// Add the Admin internal routes at the bottom
router.get('/', getAllPatients);
router.put('/admin/:id', updatePatientById);
router.delete('/admin/:id', deletePatientById);

module.exports = router;