const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
        enum: [0, 1, 2, 3, 4, 5, 6] // 0=Sunday, 1=Monday...
    },
    dayName: {
        type: String,
        required: true,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    breakEnd: {
        type: String,
        default: '',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });
availabilitySchema.index({ doctorId: 1, isActive: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);