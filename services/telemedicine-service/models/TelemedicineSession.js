const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  meetingLink: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  startTime: Date,
  endTime: Date,
  duration: Number,
  consultationNotes: String,
  prescription: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  participants: {
    patientJoined: { type: Boolean, default: false },
    doctorJoined: { type: Boolean, default: false },
    patientJoinTime: Date,
    doctorJoinTime: Date
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

// Indexes
telemedicineSessionSchema.index({ appointmentId: 1 });
telemedicineSessionSchema.index({ patientId: 1, status: 1 });
telemedicineSessionSchema.index({ doctorId: 1, status: 1 });
telemedicineSessionSchema.index({ roomName: 1 });

// Method to end session
telemedicineSessionSchema.methods.endSession = async function(notes, prescription) {
  this.status = 'ended';
  this.endTime = new Date();
  this.consultationNotes = notes;
  if (prescription) {
    this.prescription = prescription;
  }
  if (this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 60000);
  }
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);