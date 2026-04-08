const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    doctorId: {
        type: String,
        required: true,
        index: true
    },
    patientName: {
        type: String,
        default: ''
    },
    patientEmail: {
        type: String,
        default: ''
    },
    doctorName: {
        type: String,
        default: ''
    },
    doctorEmail: {
        type: String,
        default: ''
    },
    doctorSpecialty: {
        type: String,
        default: ''
    },
    slotId: {
        type: String,
        required: true
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
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed', 'no_show', 'doctor_no_show'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDeadline: {
        type: Date,
        default: null
    },
    paymentId: {
        type: String,
        default: null
    },
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: null
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
        uploadDate: { type: Date, default: Date.now }
    }],
    telemedicineLink: {
        type: String,
        default: null
    },
    telemedicineRoomId: {
        type: String,
        default: null
    },
    consultationNotes: {
        type: String,
        default: ''
    },
    prescription: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    },
    // NEW FIELDS FOR NO-SHOW TRACKING
    callDuration: {
        type: Number,
        default: 0
    },
    hasDoctorJoined: {
        type: Boolean,
        default: false
    },
    hasPatientJoined: {
        type: Boolean,
        default: false
    },
    callStartTime: {
        type: Date,
        default: null
    },
    callEndTime: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);