const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Patient Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
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
  patientContact: {
    type: String,
    required: true
  },
  
  // Doctor Information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialty: {
    type: String,
    required: true
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 1500
  },
  
  // Availability Information
  availabilityId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: String,
    end: String
  },
  
  // Appointment Details
  reason: {
    type: String,
    required: true
  },
  additionalNotes: {
    type: String,
    default: ''
  },
  symptoms: {
    type: String,
    default: ''
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentId: String,
  paymentDate: Date,
  
  // Telemedicine
  telemedicineLink: String,
  consultationNotes: String,
  prescription: Object,
  
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

// Indexes
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);