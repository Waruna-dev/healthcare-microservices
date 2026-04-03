// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'patient' }, 
  contactNumber: { type: String },
  address: { type: String },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  uploadedReports: [{
    fileName: String,
    filePath: String,
    uploadDate: { type: Date, default: Date.now },
    // --- NEW: AI Analysis Data ---
    aiAnalysis: {
      status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
      summaryTitle: { type: String },
      summaryDescription: { type: String },
      abnormalitiesFound: [{ type: String }],
      recommendedSpecialization: { type: String },
      urgencyLevel: { type: String, enum: ['low', 'medium', 'high'] }
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);