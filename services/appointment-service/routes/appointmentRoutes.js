const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    processPayment,
    getTelemedicineInfo,
    completeAppointment,
    cancelAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/appointments/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPEG, PNG are allowed.'));
        }
    }
});

// Public routes (with auth)
router.post('/', protect, upload.array('reports', 5), createAppointment);
router.get('/patient/:patientId', protect, getPatientAppointments);
router.get('/doctor/:doctorId', protect, getDoctorAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, updateAppointmentStatus);
router.post('/:id/payment', protect, processPayment);
router.get('/:id/telemedicine', protect, getTelemedicineInfo);
router.post('/:id/complete', protect, completeAppointment);
router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;