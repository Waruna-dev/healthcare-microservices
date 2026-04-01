const mongoose = require('mongoose');

const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const availabilitySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    /** When set, this row applies only to that calendar day (UTC midnight anchor). Omit for weekly recurring. */
    date: {
        type: Date,
        required: false
    },
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
        enum: [0, 1, 2, 3, 4, 5, 6]
    },
    dayName: {
        type: String,
        required: true,
        enum: DAY_NAMES
    },
    startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    slotDuration: {
        type: Number,
        default: 20,
        min: 5,
        max: 120
    },
    breakStart: {
        type: String,
        default: '',
        validate: {
            validator(v) {
                if (!v || v === '') return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid break start time'
        }
    },
    breakEnd: {
        type: String,
        default: '',
        validate: {
            validator(v) {
                if (!v || v === '') return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Invalid break end time'
        }
    },
    /** Optional override for this slot/day (e.g. Rs.). Falls back to doctor profile when null. */
    consultationFee: {
        type: Number,
        default: null,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const weeklySlotFilter = {
    date: { $exists: false }
};

// Weekly template: one row per doctor per weekday (no `date` field stored)
availabilitySchema.index(
    { doctorId: 1, dayOfWeek: 1 },
    {
        unique: true,
        partialFilterExpression: weeklySlotFilter
    }
);

// Specific calendar day: at most one row per doctor per date
availabilitySchema.index(
    { doctorId: 1, date: 1 },
    {
        unique: true,
        partialFilterExpression: { date: { $type: 'date' } }
    }
);

availabilitySchema.index({ doctorId: 1, isActive: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
