const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientEmail: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    doctorSpecialty: {
        type: String
    },
    slotId: {
        type: String
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    consultationFee: {
        type: Number,
        required: true,
        min: 0
    },
    symptoms: {
        type: String,
        required: true
    },
    medicalHistory: {
        type: String,
        default: ''
    },
    uploadedReports: [{
        fileName: String,
        filePath: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'completed', 'rejected', 'cancelled', 'no_show', 'doctor_no_show', 'partial'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDeadline: {
        type: Date
    },
    paymentId: {
        type: String
    },
    paymentDetails: {
        type: Object,
        default: {}
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    cancellationReason: {
        type: String,
        default: ''
    },
    cancellationTime: {
        type: Date
    },
    consultationNotes: {
        type: String,
        default: ''
    },
    prescription: {
        type: String,
        default: ''
    },
    telemedicineLink: {
        type: String,
        default: ''
    },
    telemedicineRoomId: {
        type: String,
        default: ''
    },
    // New fields for dual confirmation
    doctorConfirmed: {
        type: Boolean,
        default: false
    },
    patientConfirmed: {
        type: Boolean,
        default: false
    },
    doctorConfirmationTime: {
        type: Date
    },
    patientConfirmationTime: {
        type: Date
    },
    completionStatus: {
        type: String,
        enum: ['pending', 'partial', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date
    }
});


appointmentSchema.pre('save', function() {
    this.updatedAt = new Date();
});


appointmentSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;