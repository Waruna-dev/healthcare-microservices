const express = require('express');
const router = express.Router();
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

// Public — patient / booking views (add ?includeInactive=true for full week editor)
router.get('/doctor/:doctorId', getAvailabilityByDoctor);

// doctorId: query/body, or optional Bearer token — order matters before :id
router.get('/my', getMyAvailability);
router.post('/bulk', bulkUpdateAvailability);
router.post('/', createAvailability);

router.put('/:id', updateAvailability);
router.patch('/:id/toggle', toggleAvailabilityStatus);
router.delete('/:id', deleteAvailability);
router.get('/slot/:id', getAvailabilityById);

module.exports = router;