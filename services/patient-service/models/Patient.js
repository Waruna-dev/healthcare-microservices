// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
    uploadDate: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);