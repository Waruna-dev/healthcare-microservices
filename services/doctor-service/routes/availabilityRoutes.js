const express = require('express');
const router = express.Router();
// const auth = require('../middleware/auth'); // ← COMMENT OUT FOR TESTING
const {
    createAvailability,
    getAvailabilityByDoctor,
    getMyAvailability,
    getAvailabilityById,
    updateAvailability,
    toggleAvailabilityStatus,
    deleteAvailability,
    bulkUpdateAvailability
} = require('../controllers/availabilityController');

// Public routes (no auth needed for testing)
router.get('/doctor/:doctorId', getAvailabilityByDoctor);
router.post('/', createAvailability);
router.get('/my', getMyAvailability);
router.get('/:id', getAvailabilityById);
router.put('/:id', updateAvailability);
router.patch('/:id/toggle', toggleAvailabilityStatus);
router.delete('/:id', deleteAvailability);
router.post('/bulk', bulkUpdateAvailability);

module.exports = router;