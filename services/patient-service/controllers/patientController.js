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

    const patientExists = await Patient.findOne({ email });
    if (patientExists) {
      return res.status(400).json({ message: 'Patient already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const patient = await Patient.create({
      name,
      email,
      password: hashedPassword,
      contactNumber // Saves to database
    });

    if (patient) {
      res.status(201).json({
        _id: patient.id,
        name: patient.name,
        email: patient.email,
        contactNumber: patient.contactNumber, // <-- ADDED THIS!
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
        contactNumber: patient.contactNumber, // <-- ADDED THIS!
        token: generateToken(patient._id),
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

// @desc    Update patient profile details
// @route   PUT /api/patients/profile
// @access  Private
const updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.patient._id || req.patient.id; 
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if they are trying to use an email that belongs to someone else
    if (req.body.email && req.body.email !== patient.email) {
      const emailExists = await Patient.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: 'That email address is already in use.' });
      }
    }

    // Update fields
    patient.name = req.body.name || patient.name;
    patient.email = req.body.email || patient.email;
    patient.contactNumber = req.body.contactNumber || patient.contactNumber;

    const updatedPatient = await patient.save();

    res.json({
      _id: updatedPatient._id,
      name: updatedPatient.name,
      email: updatedPatient.email,
      contactNumber: updatedPatient.contactNumber,
      uploadedReports: updatedPatient.uploadedReports,
      token: generateToken(updatedPatient._id)
    });
    
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update patient password
// @route   PUT /api/patients/password
// @access  Private
const updatePatientPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Basic validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both passwords.' });
    }

    // 2. Find the patient
    const patient = await Patient.findById(req.patient._id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 3. Compare the entered password with the database hash
    const isMatch = await bcrypt.compare(currentPassword, patient.password);
    
    if (!isMatch) {
      // CRITICAL FIX: This MUST be 400. If it is 401, React will auto-logout!
      return res.status(400).json({ message: 'Incorrect current password. Please try again.' });
    }

    // 4. Hash the new password and save it
    const salt = await bcrypt.genSalt(10);
    patient.password = await bcrypt.hash(newPassword, salt);
    
    await patient.save();
    
    return res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error("Password Update Error:", error);
    return res.status(500).json({ message: 'Server error updating password' });
  }
};
// @desc    Delete patient account completely
// @route   DELETE /api/patients/account
// @access  Private
const deletePatientAccount = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient._id);

    if (patient) {
      // 1. Delete all of their uploaded PDFs from the server to save space
      if (patient.uploadedReports && patient.uploadedReports.length > 0) {
        patient.uploadedReports.forEach(report => {
          // Adjust path resolution based on where your uploads folder is
          const filePath = path.join(__dirname, '../', report.filePath); 
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
          }
        });
      }

      // 2. Delete the user from the database
      await patient.deleteOne();
      
      res.json({ message: 'Patient account and all associated records permanently deleted.' });
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    ADMIN: Update a patient by ID
// @route   PUT /api/patients/admin/:id
const updatePatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update the basic fields
    patient.name = req.body.name || patient.name;
    patient.email = req.body.email || patient.email;
    patient.contactNumber = req.body.contactNumber || patient.contactNumber;

    // NEW: If the Admin typed a new password, encrypt it and save it!
    if (req.body.password && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      patient.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedPatient = await patient.save();
    
    // We do NOT send the password back to the frontend for security
    updatedPatient.password = undefined; 
    
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    ADMIN: Delete a patient by ID
// @route   DELETE /api/patients/admin/:id
const deletePatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Clean up their uploaded PDFs to save server space
    if (patient.uploadedReports && patient.uploadedReports.length > 0) {
      patient.uploadedReports.forEach(report => {
        const filePath = path.join(__dirname, '../', report.filePath); 
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
      });
    }

    await patient.deleteOne();
    res.json({ message: 'Patient permanently deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    ADMIN: Get all patients
// @route   GET /api/patients/
// @access  Internal (Called by Admin Service)
const getAllPatients = async (req, res) => {
  try {
    // Fetch all patients from the database, sort by newest first, and hide passwords
    const patients = await Patient.find({}).select('-password').sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DON'T FORGET TO EXPORT THEM AT THE BOTTOM!
module.exports = { 
  registerPatient, 
  loginPatient, 
  uploadMedicalReport, 
  downloadMedicalReport,
  updatePatientProfile,
  updatePatientPassword,
  deletePatientAccount,
  updatePatientById,
  deletePatientById,
  getAllPatients
};