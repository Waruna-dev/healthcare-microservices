const mongoose = require('mongoose');
const Availability = require('../models/Availability');

const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

function doctorIdFromUser(req) {
    if (!req.user) return null;
    const u = req.user._id || req.user.id;
    return u ? String(u) : null;
}

/** doctorId from body, query, or authenticated user (in that order). Any non-empty string. */
function resolveDoctorId(req) {
    const fromBody = req.body && req.body.doctorId;
    const fromQuery = req.query && req.query.doctorId;
    const raw = fromBody !== undefined && fromBody !== null && fromBody !== '' ? fromBody : fromQuery;
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        const str = String(raw).trim();
        // Try to convert to ObjectId, fallback to string if invalid
        try {
            return new mongoose.Types.ObjectId(str);
        } catch {
            return str;
        }
    }
    return doctorIdFromUser(req);
}

function requireDoctorId(req, res) {
    const id = resolveDoctorId(req);
    if (!id) {
        res.status(400).json({
            success: false,
            message: 'doctorId is required.'
        });
        return null;
    }
    return id;
}

/** YYYY-MM-DD → UTC midnight Date */
function utcDayFromYmd(ymd) {
    if (!ymd) return null;
    const [y, m, d] = String(ymd).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d));
}

const weeklySlotFilter = {
    date: { $exists: false }
};

// ==================== CREATE / UPSERT ====================
// @route   POST /api/doctors/availability
const createAvailability = async (req, res) => {
    try {
        const {
            date: dateInput,
            dayOfWeek: bodyDow,
            dayName: bodyDayName,
            startTime,
            endTime,
            slotDuration,
            breakStart,
            breakEnd,
            consultationFee
        } = req.body;
        const doctorId = requireDoctorId(req, res);
        if (!doctorId) return;

        if (dateInput) {
            const d = utcDayFromYmd(dateInput);
            if (!d) {
                return res.status(400).json({ success: false, message: 'Invalid date (use YYYY-MM-DD)' });
            }
            const dow = d.getUTCDay();
            const dayName = bodyDayName || DAY_NAMES[dow];

            const existing = await Availability.findOne({ doctorId, date: d });
            if (existing) {
                existing.startTime = startTime;
                existing.endTime = endTime;
                existing.slotDuration = slotDuration ?? existing.slotDuration;
                existing.breakStart = breakStart ?? existing.breakStart;
                existing.breakEnd = breakEnd ?? existing.breakEnd;
                existing.dayOfWeek = dow;
                existing.dayName = dayName;
                if (consultationFee !== undefined) {
                    existing.consultationFee =
                        consultationFee === '' || consultationFee === null
                            ? null
                            : Number(consultationFee);
                }
                existing.isActive = true;
                await existing.save();
                return res.json({
                    success: true,
                    message: 'Availability updated for this date',
                    availability: existing,
                    upserted: true
                });
            }

            const availability = new Availability({
                doctorId,
                date: d,
                dayOfWeek: dow,
                dayName,
                startTime,
                endTime,
                slotDuration: slotDuration || 20,
                breakStart: breakStart || '',
                breakEnd: breakEnd || '',
                consultationFee:
                    consultationFee === '' || consultationFee === undefined || consultationFee === null
                        ? null
                        : Number(consultationFee),
                isActive: true
            });
            await availability.save();
            return res.status(201).json({
                success: true,
                message: 'Availability created for this date',
                availability
            });
        }

        const dayOfWeek = bodyDow !== undefined ? Number(bodyDow) : null;
        const dayName = bodyDayName;
        if (dayOfWeek === null || Number.isNaN(dayOfWeek)) {
            return res.status(400).json({
                success: false,
                message: 'dayOfWeek is required when date is not provided'
            });
        }

        const existingSlot = await Availability.findOne({
            doctorId,
            dayOfWeek,
            ...weeklySlotFilter
        });

        if (existingSlot) {
            return res.status(400).json({
                success: false,
                message: `Weekly availability for ${dayName || DAY_NAMES[dayOfWeek]} already exists. Update instead.`
            });
        }

        const availability = new Availability({
            doctorId,
            dayOfWeek,
            dayName: dayName || DAY_NAMES[dayOfWeek],
            startTime,
            endTime,
            slotDuration: slotDuration || 20,
            breakStart: breakStart || '',
            breakEnd: breakEnd || '',
            consultationFee:
                consultationFee === '' || consultationFee === undefined || consultationFee === null
                    ? null
                    : Number(consultationFee),
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
const getAvailabilityByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';
        
        // Convert doctorId to ObjectId if it's a valid string
        let doctorIdFilter;
        try {
            doctorIdFilter = new mongoose.Types.ObjectId(doctorId);
        } catch {
            // If not a valid ObjectId, treat as string (for backward compatibility)
            doctorIdFilter = doctorId;
        }
        
        const filter = { doctorId: doctorIdFilter };
        if (!includeInactive) {
            filter.isActive = true;
        }

        const start = req.query.start && utcDayFromYmd(req.query.start);
        const end = req.query.end && utcDayFromYmd(req.query.end);
        if (start && end) {
            filter.date = { $gte: start, $lte: end };
        }

        const availability = await Availability.find(filter).sort({ date: 1, dayOfWeek: 1, startTime: 1 });

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

const getMyAvailability = async (req, res) => {
    try {
        const doctorId = requireDoctorId(req, res);
        if (!doctorId) return;
        const availability = await Availability.find({ doctorId }).sort({ date: 1, dayOfWeek: 1, startTime: 1 });

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
const updateAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = requireDoctorId(req, res);
        if (!doctorId) return;

        const allowedUpdates = [
            'startTime',
            'endTime',
            'slotDuration',
            'breakStart',
            'breakEnd',
            'consultationFee',
            'isActive'
        ];
        const updateData = {};

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                if (field === 'consultationFee' && (req.body[field] === '' || req.body[field] === null)) {
                    updateData[field] = null;
                } else {
                    updateData[field] = req.body[field];
                }
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

const toggleAvailabilityStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = requireDoctorId(req, res);
        if (!doctorId) return;

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

const deleteAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = requireDoctorId(req, res);
        if (!doctorId) return;

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

// ==================== BULK (weekly template only; no `date` field) ====================
const bulkUpdateAvailability = async (req, res) => {
    try {
        const doctorId = requireDoctorId(req, res);
        if (!doctorId) return;
        const { schedule } = req.body;
        if (!Array.isArray(schedule)) {
            return res.status(400).json({ success: false, message: 'schedule must be an array' });
        }

        await Availability.deleteMany({
            doctorId,
            ...weeklySlotFilter
        });

        const availabilitySlots = schedule.map((slot) => ({
            doctorId,
            dayOfWeek: slot.dayOfWeek,
            dayName: slot.dayName,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration || 20,
            breakStart: slot.breakStart || '',
            breakEnd: slot.breakEnd || '',
            isActive: slot.isActive !== false,
            consultationFee:
                slot.consultationFee === '' || slot.consultationFee === undefined || slot.consultationFee === null
                    ? null
                    : Number(slot.consultationFee)
        }));

        const availability = await Availability.insertMany(availabilitySlots);

        res.status(201).json({
            success: true,
            message: 'Weekly template saved successfully',
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