const mongoose = require('mongoose');

// Medicine sub-schema
const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Medicine name is required'],
        trim: true,
        maxlength: [100, 'Medicine name cannot exceed 100 characters']
    },
    type: {
        type: String,
        required: [true, 'Medicine type is required'],
        enum: {
            values: ['tablet', 'syrup', 'injection', 'capsule', 'drops', 'ointment'],
            message: '{VALUE} is not a valid medicine type'
        },
        default: 'tablet'
    },
    dosage: {
        type: String,
        required: [true, 'Dosage is required'],
        trim: true,
        maxlength: [50, 'Dosage cannot exceed 50 characters']
    },
    frequency: {
        type: String,
        required: [true, 'Frequency is required'],
        trim: true,
        maxlength: [50, 'Frequency cannot exceed 50 characters']
    },
    duration: {
        type: String,
        required: [true, 'Duration is required'],
        trim: true,
        maxlength: [50, 'Duration cannot exceed 50 characters']
    },
    instructions: {
        type: String,
        trim: true,
        maxlength: [200, 'Instructions cannot exceed 200 characters']
    }
}, { _id: false });

// Attachment sub-schema
const attachmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Attachment name is required'],
        trim: true,
        maxlength: [255, 'Attachment name cannot exceed 255 characters']
    },
    size: {
        type: Number,
        required: [true, 'Attachment size is required'],
        min: [0, 'Attachment size cannot be negative']
    },
    type: {
        type: String,
        required: [true, 'Attachment type is required'],
        trim: true
    },
    url: {
        type: String,
        trim: true,
        maxlength: [500, 'Attachment URL cannot exceed 500 characters']
    }
}, { _id: false });

// Lifestyle sub-schema
const lifestyleSchema = new mongoose.Schema({
    diet: {
        type: String,
        trim: true,
        maxlength: [500, 'Diet instructions cannot exceed 500 characters']
    },
    exercise: {
        type: String,
        trim: true,
        maxlength: [500, 'Exercise instructions cannot exceed 500 characters']
    },
    restrictions: [{
        type: String,
        trim: true,
        maxlength: [100, 'Restriction cannot exceed 100 characters']
    }]
}, { _id: false });

// Main prescription schema
const prescriptionSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Appointment ID is required'],
        ref: 'Appointment'
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
        maxlength: [100, 'Patient name cannot exceed 100 characters']
    },
    patientEmail: {
        type: String,
        required: [true, 'Patient email is required'],
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Doctor ID is required'],
        ref: 'Doctor'
    },
    doctorName: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        maxlength: [100, 'Doctor name cannot exceed 100 characters']
    },
    diagnosis: {
        type: String,
        required: [true, 'Diagnosis is required'],
        trim: true,
        maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
    },
    symptoms: {
        type: String,
        trim: true,
        maxlength: [1000, 'Symptoms cannot exceed 1000 characters']
    },
    medicines: [medicineSchema],
    tests: [{
        type: String,
        trim: true,
        maxlength: [100, 'Test name cannot exceed 100 characters']
    }],
    lifestyle: {
        type: lifestyleSchema,
        default: () => ({
            diet: '',
            exercise: '',
            restrictions: []
        })
    },
    followUpDate: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > new Date();
            },
            message: 'Follow-up date must be in the future'
        }
    },
    followUpNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Follow-up notes cannot exceed 500 characters']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    attachments: [attachmentSchema],
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    prescriptionDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create indexes for better performance
prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientEmail: 1 });
prescriptionSchema.index({ prescriptionDate: -1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ isArchived: 1 });

// Compound indexes for common queries
prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctorId: 1, status: 1 });
prescriptionSchema.index({ patientEmail: 1, prescriptionDate: -1 });

// Text search index
prescriptionSchema.index({ 
    patientName: 'text', 
    doctorName: 'text', 
    diagnosis: 'text',
    symptoms: 'text'
});

// Method to check if prescription can be edited
prescriptionSchema.methods.isEditable = function() {
    const now = new Date();
    const prescriptionAge = now - this.prescriptionDate;
    const maxEditableAge = 24 * 60 * 60 * 1000; // 24 hours
    return prescriptionAge < maxEditableAge && this.status === 'active';
};

// Method to get medicines count
prescriptionSchema.methods.getMedicinesCount = function() {
    return this.medicines.length;
};

// Method to get tests count
prescriptionSchema.methods.getTestsCount = function() {
    return this.tests.length;
};

// Method to add medicine
prescriptionSchema.methods.addMedicine = function(medicine) {
    this.medicines.push(medicine);
    return this.save();
};

// Method to remove medicine
prescriptionSchema.methods.removeMedicine = function(medicineIndex) {
    if (medicineIndex >= 0 && medicineIndex < this.medicines.length) {
        this.medicines.splice(medicineIndex, 1);
        return this.save();
    }
    throw new Error('Invalid medicine index');
};

// Method to add test
prescriptionSchema.methods.addTest = function(test) {
    if (!this.tests.includes(test)) {
        this.tests.push(test);
        return this.save();
    }
    return this;
};

// Method to remove test
prescriptionSchema.methods.removeTest = function(test) {
    const index = this.tests.indexOf(test);
    if (index > -1) {
        this.tests.splice(index, 1);
        return this.save();
    }
    return this;
};

// Static method to find prescriptions by doctor
prescriptionSchema.statics.findByDoctor = function(doctorId, options = {}) {
    const query = { doctorId, isArchived: false };
    
    if (options.status) {
        query.status = options.status;
    }
    
    if (options.dateFrom || options.dateTo) {
        query.prescriptionDate = {};
        if (options.dateFrom) query.prescriptionDate.$gte = new Date(options.dateFrom);
        if (options.dateTo) query.prescriptionDate.$lte = new Date(options.dateTo);
    }
    
    return this.find(query)
        .sort({ prescriptionDate: -1 })
        .limit(options.limit || 50);
};

// Static method to find prescriptions by patient
prescriptionSchema.statics.findByPatient = function(patientEmail, options = {}) {
    const query = { patientEmail, isArchived: false };
    
    if (options.status) {
        query.status = options.status;
    }
    
    return this.find(query)
        .sort({ prescriptionDate: -1 })
        .limit(options.limit || 50);
};

// Static method to get prescription statistics
prescriptionSchema.statics.getStats = function(doctorId) {
    return this.aggregate([
        { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
        {
            $group: {
                _id: null,
                totalPrescriptions: { $sum: 1 },
                activePrescriptions: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                completedPrescriptions: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                cancelledPrescriptions: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                },
                totalMedicines: { $sum: { $size: '$medicines' } },
                totalTests: { $sum: { $size: '$tests' } },
                avgMedicinesPerPrescription: { $avg: { $size: '$medicines' } }
            }
        }
    ]);
};

// Pre-save middleware to update timestamps
prescriptionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Pre-remove middleware to handle related data
prescriptionSchema.pre('remove', function(next) {
    // Add any cleanup logic here if needed
    next();
});

// Virtual for formatted prescription date
prescriptionSchema.virtual('formattedPrescriptionDate').get(function() {
    return this.prescriptionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for formatted follow-up date
prescriptionSchema.virtual('formattedFollowUpDate').get(function() {
    if (!this.followUpDate) return null;
    return this.followUpDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Ensure virtuals are included in JSON output
prescriptionSchema.set('toJSON', { virtuals: true });
prescriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);