const express = require('express');
const router = express.Router();
const { uploadDoctorImage } = require('../middleware/upload');
const doctorController = require('../controllers/doctorController');

// ==================== TEST ROUTE ====================
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Doctor service is running' });
});

// ==================== DOCTOR REGISTRATION ====================
router.post('/register', uploadDoctorImage.single('profileImage'), doctorController.registerDoctor);

// ==================== GET ALL DOCTORS ====================
router.get('/', doctorController.getAllDoctors);

// ==================== FIND DOCTORS BY SPECIALTY ====================
// Must be above /:id so "specialty" isn't treated as a doctor ID
router.get('/specialty/:specialty', doctorController.findDoctorsBySpecialty);

// ==================== ADMIN UPDATE DOCTOR ====================
// NEW ROUTE: Allows Admin to approve and set generated passwords
// Must be above /:id so "admin" isn't treated as a doctor ID
router.put('/admin/:id', doctorController.adminUpdateDoctor);

// ==================== GET DOCTOR BY ID ====================
router.get('/:id', doctorController.getDoctorById);

// ==================== STANDARD UPDATE DOCTOR ====================
// Used by doctors to update their own profiles (ignores password)
router.put('/:id', doctorController.updateDoctor);

// ==================== DELETE DOCTOR ====================
router.delete('/:id', doctorController.deleteDoctor);

// ==================== TOGGLE DOCTOR AVAILABILITY ====================
router.patch('/:id/availability', doctorController.toggleDoctorAvailability);

module.exports = router;