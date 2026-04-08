const express = require('express');
const router = express.Router();
const { uploadDoctorImage } = require('../middleware/upload');
const { cacheMiddleware } = require('../middleware/cache');
const doctorController = require('../controllers/doctorController');

// ==================== TEST ROUTE ====================
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Doctor service is running' });
});

// ==================== DOCTOR REGISTRATION ====================
router.post('/register', uploadDoctorImage.single('profileImage'), doctorController.registerDoctor);

// ==================== DOCTOR LOGIN ====================
router.post('/login', doctorController.loginDoctor);

// ==================== GET ALL DOCTORS (with caching) ====================
router.get('/', cacheMiddleware(60), doctorController.getAllDoctors); // Cache for 1 minute

// ==================== FIND DOCTORS BY SPECIALTY ====================
// Must be above /:id so "specialty" isn't treated as a doctor ID
router.get('/specialty/:specialty', cacheMiddleware(120), doctorController.findDoctorsBySpecialty); // Cache for 2 minutes

// ==================== ADMIN UPDATE DOCTOR ====================
// Must be above /:id so "admin" isn't treated as a doctor ID
router.put('/admin/:id', doctorController.adminUpdateDoctor);

// ==================== GET DOCTOR BY ID ====================
router.get('/:id', doctorController.getDoctorById);

// ==================== UPDATE DOCTOR ====================
router.put('/:id', doctorController.updateDoctor);

// ==================== DELETE DOCTOR ====================
router.delete('/:id', doctorController.deleteDoctor);

// ==================== TOGGLE DOCTOR AVAILABILITY ====================
router.patch('/:id/availability', doctorController.toggleDoctorAvailability);

module.exports = router;