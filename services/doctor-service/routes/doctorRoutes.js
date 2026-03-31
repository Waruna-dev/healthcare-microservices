const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');

// ==================== TEST ROUTE ====================
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Doctor service is running' });
});

// ==================== AVAILABILITY CRUD ROUTES ====================

// GET - Get all availability for the doctor (using fixed doctor ID)
router.get('/availability/my', async (req, res) => {
    try {
        // IMPORTANT: Replace this with an actual doctor ID from your database
        const doctorId = "67e8a1b2c3d4e5f6a7b8c9d0";
        
        const availability = await Availability.find({ doctorId }).sort({ dayOfWeek: 1 });
        res.json({ 
            success: true, 
            count: availability.length,
            availability 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new availability
router.post('/availability', async (req, res) => {
    try {
        const { dayOfWeek, dayName, startTime, endTime, slotDuration, breakStart, breakEnd } = req.body;
        const doctorId = "67e8a1b2c3d4e5f6a7b8c9d0"; // Same fixed doctor ID
        
        // Check if already exists
        const existing = await Availability.findOne({ doctorId, dayOfWeek });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: `Availability for ${dayName} already exists` 
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
        console.error('Create error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update availability
router.put('/availability/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime, slotDuration, breakStart, breakEnd } = req.body;
        
        const availability = await Availability.findByIdAndUpdate(
            id,
            { 
                startTime, 
                endTime, 
                slotDuration, 
                breakStart, 
                breakEnd,
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        if (!availability) {
            return res.status(404).json({ success: false, message: 'Availability not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Availability updated successfully',
            availability 
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH - Toggle active status
router.patch('/availability/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const availability = await Availability.findById(id);
        
        if (!availability) {
            return res.status(404).json({ success: false, message: 'Availability not found' });
        }
        
        availability.isActive = !availability.isActive;
        await availability.save();
        
        res.json({ 
            success: true, 
            message: `Availability ${availability.isActive ? 'activated' : 'deactivated'}`,
            isActive: availability.isActive 
        });
    } catch (error) {
        console.error('Toggle error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete availability
router.delete('/availability/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const availability = await Availability.findByIdAndDelete(id);
        
        if (!availability) {
            return res.status(404).json({ success: false, message: 'Availability not found' });
        }
        
        res.json({ success: true, message: 'Availability deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;