const express = require('express');
const router = express.Router();
const { uploadDoctorImage } = require('../middleware/upload');
const { cacheMiddleware } = require('../middleware/cache');
const doctorController = require('../controllers/doctorController');

// ==================== DOCTOR REGISTRATION ====================
router.post('/register', uploadDoctorImage.single('profileImage'), doctorController.registerDoctor);

// ==================== GET ALL DOCTORS (with caching) ====================
router.get('/', cacheMiddleware(60), doctorController.getAllDoctors); // Cache for 1 minute

// ==================== GET DOCTOR BY ID ====================
router.get('/:id', doctorController.getDoctorById);

// ==================== FIND DOCTORS BY SPECIALTY ====================
router.get('/specialty/:specialty', cacheMiddleware(120), doctorController.findDoctorsBySpecialty); // Cache for 2 minutes

// ==================== UPDATE DOCTOR ====================
router.put('/:id', doctorController.updateDoctor);

// ==================== DELETE DOCTOR ====================
router.delete('/:id', doctorController.deleteDoctor);

// ==================== TOGGLE DOCTOR AVAILABILITY ====================
router.patch('/:id/availability', doctorController.toggleDoctorAvailability);

// ==================== TEST ROUTE ====================
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Doctor service is running' });
});

module.exports = router;
