const express = require('express');
const router = express.Router();
const {
    createPrescription,
    getDoctorPrescriptions,
    getPrescriptionByAppointment,
    getPrescriptionById,
    updatePrescription,
    addMedicine,
    removeMedicine,
    addTest,
    removeTest,
    updatePrescriptionStatus,
    archivePrescription,
    getPrescriptionStats,
    searchPrescriptions,
    getPatientPrescriptionHistory,
    deletePrescription
} = require('../controllers/prescriptioncontroller');

// Middleware for authentication (add your auth middleware here)
// const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/prescriptions/create
// @desc    Create a new prescription
// @access   Private (Doctor)
router.post('/create', createPrescription);

// @route   GET /api/prescriptions/doctor/:doctorId
// @desc    Get all prescriptions for a doctor
// @access   Private (Doctor)
router.get('/doctor/:doctorId', getDoctorPrescriptions);

// @route   GET /api/prescriptions/doctor/:doctorId/stats
// @desc    Get prescription statistics for a doctor
// @access   Private (Doctor)
router.get('/doctor/:doctorId/stats', getPrescriptionStats);

// @route   GET /api/prescriptions/appointment/:appointmentId
// @desc    Get prescription by appointment ID
// @access   Private (Doctor/Patient)
router.get('/appointment/:appointmentId', getPrescriptionByAppointment);

// @route   GET /api/prescriptions/patient/:patientEmail
// @desc    Get patient prescription history
// @access   Private (Doctor/Patient)
router.get('/patient/:patientEmail', getPatientPrescriptionHistory);

// @route   GET /api/prescriptions/search
// @desc    Search prescriptions
// @access   Private (Doctor)
router.get('/search', searchPrescriptions);

// @route   GET /api/prescriptions/:id
// @desc    Get prescription by ID
// @access   Private (Doctor/Patient)
router.get('/:id', getPrescriptionById);

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access   Private (Doctor)
router.put('/:id', updatePrescription);

// @route   PATCH /api/prescriptions/:id/status
// @desc    Update prescription status
// @access   Private (Doctor)
router.patch('/:id/status', updatePrescriptionStatus);

// @route   PATCH /api/prescriptions/:id/archive
// @desc    Archive prescription
// @access   Private (Doctor)
router.patch('/:id/archive', archivePrescription);

// @route   POST /api/prescriptions/:id/medicines
// @desc    Add medicine to prescription
// @access   Private (Doctor)
router.post('/:id/medicines', addMedicine);

// @route   DELETE /api/prescriptions/:id/medicines/:medicineIndex
// @desc    Remove medicine from prescription
// @access   Private (Doctor)
router.delete('/:id/medicines/:medicineIndex', removeMedicine);

// @route   POST /api/prescriptions/:id/tests
// @desc    Add test to prescription
// @access   Private (Doctor)
router.post('/:id/tests', addTest);

// @route   DELETE /api/prescriptions/:id/tests/:test
// @desc    Remove test from prescription
// @access   Private (Doctor)
router.delete('/:id/tests/:test', removeTest);

// @route   DELETE /api/prescriptions/:id
// @desc    Delete prescription
// @access   Private (Doctor)
router.delete('/:id', deletePrescription);

module.exports = router;