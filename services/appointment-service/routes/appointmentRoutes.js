const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAvailableSlots,
  createAppointment,
  getAllAppointments,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  processPayment,
  cancelAppointment
} = require('../controllers/appointmentController');

// Public routes (no auth needed for testing)
router.get('/available-slots', getAvailableSlots);
router.get('/', getAllAppointments);
router.get('/:id', getAppointmentById);

// Protected routes (with auth)
router.post('/', protect, createAppointment);
router.get('/patient/:patientId', protect, getPatientAppointments);
router.get('/doctor/:doctorId', protect, getDoctorAppointments);
router.put('/:id/status', protect, updateAppointmentStatus);
router.post('/:id/payment', protect, processPayment);
router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;