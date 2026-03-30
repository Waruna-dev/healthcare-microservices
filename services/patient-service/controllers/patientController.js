// controllers/patientController.js
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    // 1. Find patient by email
    const patient = await Patient.findOne({ email });

    // 2. Check password matches
    if (patient && (await bcrypt.compare(password, patient.password))) {
      res.json({
        _id: patient.id,
        name: patient.name,
        email: patient.email,
        token: generateToken(patient._id),
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

module.exports = { registerPatient, loginPatient, uploadMedicalReport };