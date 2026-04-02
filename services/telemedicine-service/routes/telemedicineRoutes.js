const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrCreateSession,
  startSession,
  endSession,
  getPrescription
} = require('../controllers/telemedicineController');

// All routes require authentication
router.use(protect);

router.get('/:appointmentId', getOrCreateSession);
router.post('/:appointmentId/start', startSession);
router.post('/:appointmentId/end', endSession);
router.get('/:appointmentId/prescription', getPrescription);

module.exports = router;