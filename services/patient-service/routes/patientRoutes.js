const express = require('express');
const router = express.Router();

const { 
  registerPatient,
  loginPatient,
  uploadMedicalReport,
  downloadMedicalReport,
  deleteMedicalReport, 
  updatePatientProfile,
  updatePatientPassword,
  deletePatientAccount,
  updateProfilePicture, 
  getAllPatients,
  updatePatientById,
  deletePatientById 
} = require('../controllers/patientController');

// 2. Import your middlewares
const { protect } = require('../middleware/patientAuth');

// We rename the imports here so the Report uploader and Profile Pic uploader don't clash!
const reportUpload = require('../middleware/reportUploader'); 
const profilePicUpload = require('../middleware/upload'); 

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/register', registerPatient);
router.post('/login', loginPatient);

// ==========================================
// PRIVATE ROUTES (Require Authentication)
// ==========================================

// Medical Records 
router.post('/upload-report', protect, reportUpload.single('reportFile'), uploadMedicalReport);
router.get('/reports/:filename', protect, downloadMedicalReport);
router.delete('/reports/:filename', protect, deleteMedicalReport); 

// Profile Management
router.put('/profile', protect, updatePatientProfile);
router.put('/password', protect, updatePatientPassword);
router.delete('/account', protect, deletePatientAccount);

// Profile Picture 
router.put('/profile/picture', protect, profilePicUpload.single('profileImage'), updateProfilePicture);

// ==========================================
// ADMIN INTERNAL ROUTES
// ==========================================
router.get('/', getAllPatients);
router.put('/admin/:id', updatePatientById);
router.delete('/admin/:id', deletePatientById);

module.exports = router;