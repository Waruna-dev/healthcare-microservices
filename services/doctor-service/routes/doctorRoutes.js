const express = require('express');
const router = express.Router();
const {
    registerDoctor,
    getAllDoctors,
    getDoctorById
} = require('../controllers/doctorController');

// Public routes
router.post('/register', registerDoctor);
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

module.exports = router;