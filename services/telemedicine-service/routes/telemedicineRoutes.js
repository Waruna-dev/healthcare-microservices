// routes/telemedicineRoutes.js
const express = require('express');
const router = express.Router();
const {
    startSession,
    endSession,
    getSession,
    getPrescription
} = require('../controllers/telemedicineController');
const { protect } = require('../middleware/auth');

router.get('/:appointmentId', protect, getSession);
router.post('/:appointmentId/start', protect, startSession);
router.post('/:appointmentId/end', protect, endSession);
router.get('/:appointmentId/prescription', protect, getPrescription);

module.exports = router;