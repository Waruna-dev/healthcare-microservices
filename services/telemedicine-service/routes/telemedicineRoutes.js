// routes/telemedicineRoutes.js
const express = require('express');
const router = express.Router();
const {
    createSession,
    getSessionByAppointment,
    markSessionActive,
    endSession
} = require('../controllers/telemedicineController');

// Create or get session
router.post('/sessions', createSession);
router.get('/sessions/:appointmentId', getSessionByAppointment);
router.post('/sessions/:appointmentId/active', markSessionActive);
router.post('/sessions/:appointmentId/end', endSession);

module.exports = router;