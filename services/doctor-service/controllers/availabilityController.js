const Availability = require('../models/Availability');

// ==================== CREATE ====================
// @desc    Create new availability slot
// @route   POST /api/doctors/availability
const createAvailability = async (req, res) => {
    try {
        const { dayOfWeek, dayName, startTime, endTime, slotDuration, breakStart, breakEnd } = req.body;
        const doctorId = req.user.id;

        // Check if slot already exists for this day
        const existingSlot = await Availability.findOne({ doctorId, dayOfWeek });
        
        if (existingSlot) {
            return res.status(400).json({
                success: false,
                message: `Availability for ${dayName} already exists. Please update instead.`
            });
        }

        const availability = new Availability({
            doctorId,
            dayOfWeek,
            dayName,
            startTime,
            endTime,
            slotDuration: slotDuration || 20,
            breakStart: breakStart || '',
            breakEnd: breakEnd || '',
            isActive: true
        });

        await availability.save();

        res.status(201).json({
            success: true,
            message: 'Availability created successfully',
            availability
        });
    } catch (error) {
        console.error('Create availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== READ ====================
// @desc    Get all availability for a doctor (Public)
// @route   GET /api/doctors/availability/:doctorId
const getAvailabilityByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const availability = await Availability.find({ 
            doctorId, 
            isActive: true 
        }).sort({ dayOfWeek: 1, startTime: 1 });

        res.json({
            success: true,
            count: availability.length,
            availability
        });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get my own availability (Doctor)
// @route   GET /api/doctors/availability/my
const getMyAvailability = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const availability = await Availability.find({ doctorId }).sort({ dayOfWeek: 1, startTime: 1 });

        res.json({
            success: true,
            count: availability.length,
            availability
        });
    } catch (error) {
        console.error('Get my availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single availability slot by ID
// @route   GET /api/doctors/availability/slot/:id
const getAvailabilityById = async (req, res) => {
    try {
        const { id } = req.params;
        const availability = await Availability.findById(id);

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: 'Availability slot not found'
            });
        }

        res.json({
            success: true,
            availability
        });
    } catch (error) {
        console.error('Get availability by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== UPDATE ====================
// @desc    Update availability slot
// @route   PUT /api/doctors/availability/:id
const updateAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id;
        
        const allowedUpdates = ['startTime', 'endTime', 'slotDuration', 'breakStart', 'breakEnd'];
        const updateData = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });
        
        updateData.updatedAt = Date.now();

        const availability = await Availability.findOneAndUpdate(
            { _id: id, doctorId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: 'Availability slot not found'
            });
        }

        res.json({
            success: true,
            message: 'Availability updated successfully',
            availability
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Toggle availability status (Active/Inactive)
// @route   PATCH /api/doctors/availability/:id/toggle
const toggleAvailabilityStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id;

        const availability = await Availability.findOne({ _id: id, doctorId });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: 'Availability slot not found'
            });
        }

        availability.isActive = !availability.isActive;
        availability.updatedAt = Date.now();
        await availability.save();

        res.json({
            success: true,
            message: `Availability ${availability.isActive ? 'activated' : 'deactivated'}`,
            isActive: availability.isActive,
            availability
        });
    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== DELETE ====================
// @desc    Delete availability slot
// @route   DELETE /api/doctors/availability/:id
const deleteAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id;

        const availability = await Availability.findOneAndDelete({ _id: id, doctorId });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: 'Availability slot not found'
            });
        }

        res.json({
            success: true,
            message: 'Availability deleted successfully'
        });
    } catch (error) {
        console.error('Delete availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== BULK OPERATIONS ====================
// @desc    Bulk create/update weekly schedule
// @route   POST /api/doctors/availability/bulk
const bulkUpdateAvailability = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { schedule } = req.body;

        // Delete all existing
        await Availability.deleteMany({ doctorId });

        // Create new
        const availabilitySlots = schedule.map(slot => ({
            doctorId,
            dayOfWeek: slot.dayOfWeek,
            dayName: slot.dayName,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration || 20,
            breakStart: slot.breakStart || '',
            breakEnd: slot.breakEnd || '',
            isActive: slot.isActive !== false
        }));

        const availability = await Availability.insertMany(availabilitySlots);

        res.status(201).json({
            success: true,
            message: 'Weekly schedule saved successfully',
            count: availability.length,
            availability
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createAvailability,
    getAvailabilityByDoctor,
    getMyAvailability,
    getAvailabilityById,
    updateAvailability,
    toggleAvailabilityStatus,
    deleteAvailability,
    bulkUpdateAvailability
};