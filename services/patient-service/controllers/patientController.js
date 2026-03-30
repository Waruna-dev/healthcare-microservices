// controllers/patientController.js
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Generate JWT Token function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new patient
// @route   POST /api/patients/register
const registerPatient = async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;

    // 1. Check if patient already exists
    const patientExists = await Patient.findOne({ email });
    if (patientExists) {
      return res.status(400).json({ message: 'Patient already exists' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the patient
    const patient = await Patient.create({
      name,
      email,
      password: hashedPassword,
      contactNumber
    });

    // 4. Send response with token
    if (patient) {
      res.status(201).json({
        _id: patient.id,
        name: patient.name,
        email: patient.email,
        token: generateToken(patient._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid patient data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a patient (Login)
// @route   POST /api/patients/login
const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ email });

    if (patient && (await bcrypt.compare(password, patient.password))) {
      res.json({
        _id: patient.id,
        name: patient.name,
        email: patient.email,
        token: generateToken(patient._id),
        
        // ---> ADD THIS ONE LINE RIGHT HERE <---
        uploadedReports: patient.uploadedReports 
        
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadMedicalReport = async (req, res) => {
  try {
    // req.patient comes from the 'protect' middleware!
    const patient = await Patient.findById(req.patient._id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // Add the new file to the patient's uploadedReports array
    const newReport = {
      fileName: req.file.originalname,
      filePath: req.file.path
    };

    patient.uploadedReports.push(newReport);
    await patient.save();

    res.status(200).json({ 
      message: 'Report uploaded successfully', 
      reports: patient.uploadedReports 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadMedicalReport = async (req, res) => {
  try {
    const filename = req.params.filename;
    const patient = await Patient.findById(req.patient._id);

    // 1. Zero-Trust Check: Does this patient actually own this file?
    // Multer saves paths as 'uploads/12345.pdf' or 'uploads\12345.pdf' (on Windows)
    const ownsFile = patient.uploadedReports.some(
      report => report.filePath.includes(filename)
    );

    if (!ownsFile) {
      return res.status(403).json({ message: 'Unauthorized access to this medical record.' });
    }

    // 2. Locate the file on the server
    const filePath = path.join(__dirname, '../uploads', filename);

    // 3. Verify it exists physically
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File no longer exists on the server.' });
    }

    // 4. Send the file securely
    res.download(filePath);

  } catch (error) {
    res.status(500).json({ message: 'Error retrieving file.' });
  }
};

module.exports = { registerPatient, loginPatient, uploadMedicalReport, downloadMedicalReport };