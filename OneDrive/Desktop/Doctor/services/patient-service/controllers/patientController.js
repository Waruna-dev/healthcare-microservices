// controllers/patientController.js
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
      contactNumber 
    });

    if (patient) {
      res.status(201).json({
        _id: patient.id,
        name: patient.name,
        email: patient.email,
        contactNumber: patient.contactNumber,
        profilePicture: patient.profilePicture, // ADDED
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
        contactNumber: patient.contactNumber, 
        profilePicture: patient.profilePicture, // ADDED: So picture shows on login
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

// @desc    Upload report & run AI Analysis
// @route   POST /api/patients/upload-report
const uploadMedicalReport = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient._id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // 1. Save the initial report data
    const newReport = {
      fileName: req.file.originalname,
      filePath: req.file.path,
      aiAnalysis: { status: 'pending' }
    };
    
    patient.uploadedReports.push(newReport);
    const reportIndex = patient.uploadedReports.length - 1;
    await patient.save();

    // 2. Start the AI Analysis process using NATIVE Gemini PDF support
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0, 
          topK: 1,
          topP: 0.1
        } 
      });

      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfPart = {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf"
        }
      };

      const prompt = `
        You are a highly precise medical data extraction assistant. Your task is to analyze the attached medical lab report PDF and extract key clinical data objectively.
        Do NOT invent, hallucinate, or creatively rephrase information. Stick strictly to the text provided in the document.

        Return ONLY a JSON object with the following exact keys and strict formatting rules:
        - "summaryTitle": A clinical, 3-4 word title summarizing the primary test type or main finding (e.g., "Comprehensive Metabolic Panel", "Elevated Lipid Profile").
        - "summaryDescription": A direct, objective 1-2 sentence summary of the flagged or notable results. Do not provide medical advice.
        - "abnormalitiesFound": An array of strings listing ONLY the specific metrics marked as "High", "Low", "Elevated", "Abnormal", or "Flag" along with their values (e.g., ["Total Cholesterol: 245 mg/dL", "Fasting Glucose: 118 mg/dL"]). If everything is normal, return an empty array [].
        - "recommendedSpecialization": Based purely on the abnormalities, suggest ONE standard medical specialization for follow-up (e.g., "Cardiologist", "Endocrinologist", "General Physician"). If all is normal, output "General Physician".
        - "urgencyLevel": Must be exactly one of: "low", "medium", or "high". Evaluate strictly: High = critical/life-threatening out-of-range values, Medium = elevated/flagged chronic markers (like high cholesterol or prediabetes), Low = normal/healthy results.
      `;

      const result = await model.generateContent([prompt, pdfPart]);
      let rawText = result.response.text();

      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResponse = JSON.parse(rawText);

      // 3. Update the database with the AI results
      patient.uploadedReports[reportIndex].aiAnalysis = {
        status: 'completed',
        summaryTitle: aiResponse.summaryTitle,
        summaryDescription: aiResponse.summaryDescription,
        abnormalitiesFound: aiResponse.abnormalitiesFound,
        recommendedSpecialization: aiResponse.recommendedSpecialization,
        urgencyLevel: aiResponse.urgencyLevel
      };

      await patient.save();

    } catch (aiError) {
      console.error("AI Analysis Failed:", aiError);
      patient.uploadedReports[reportIndex].aiAnalysis.status = 'failed';
      await patient.save();
    }

    res.status(200).json({ 
      message: 'Report uploaded and analyzed successfully', 
      reports: patient.uploadedReports 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download a specific medical report
// @route   GET /api/patients/reports/:filename
const downloadMedicalReport = async (req, res) => {
  try {
    const filename = req.params.filename;
    const patient = await Patient.findById(req.patient._id);

    const ownsFile = patient.uploadedReports.some(
      report => report.filePath.includes(filename)
    );

    if (!ownsFile) {
      return res.status(403).json({ message: 'Unauthorized access to this medical record.' });
    }

    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File no longer exists on the server.' });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving file.' });
  }
};

// @desc    Update patient profile details
// @route   PUT /api/patients/profile
const updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.patient._id || req.patient.id; 
    const patient = await Patient.findById(patientId);

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.body.email && req.body.email !== patient.email) {
      const emailExists = await Patient.findOne({ email: req.body.email });
      if (emailExists) return res.status(400).json({ message: 'That email address is already in use.' });
    }

    patient.name = req.body.name || patient.name;
    patient.email = req.body.email || patient.email;
    patient.contactNumber = req.body.contactNumber || patient.contactNumber;

    const updatedPatient = await patient.save();

    res.json({
      _id: updatedPatient._id,
      name: updatedPatient.name,
      email: updatedPatient.email,
      contactNumber: updatedPatient.contactNumber,
      profilePicture: updatedPatient.profilePicture, // ADDED
      uploadedReports: updatedPatient.uploadedReports,
      token: generateToken(updatedPatient._id)
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update patient password
// @route   PUT /api/patients/password
const updatePatientPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both passwords.' });
    }

    const patient = await Patient.findById(req.patient._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const isMatch = await bcrypt.compare(currentPassword, patient.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password. Please try again.' });
    }

    const salt = await bcrypt.genSalt(10);
    patient.password = await bcrypt.hash(newPassword, salt);
    
    await patient.save();
    return res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
    return res.status(500).json({ message: 'Server error updating password' });
  }
};

// @desc    Delete patient account completely
// @route   DELETE /api/patients/account
const deletePatientAccount = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient._id);

    if (patient) {
      if (patient.uploadedReports && patient.uploadedReports.length > 0) {
        patient.uploadedReports.forEach(report => {
          const filePath = path.join(__dirname, '../', report.filePath); 
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
        });
      }

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

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    patient.name = req.body.name || patient.name;
    patient.email = req.body.email || patient.email;
    patient.contactNumber = req.body.contactNumber || patient.contactNumber;

    if (req.body.password && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      patient.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedPatient = await patient.save();
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

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

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
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({}).select('-password').sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture to Cloudinary
// @route   PUT /api/patients/profile/picture
const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        // 🔥 FIX: Correctly access the patient ID from your specific auth middleware
        const patientId = req.patient._id || req.patient.id;

        const updatedPatient = await Patient.findByIdAndUpdate(
            patientId, 
            { profilePicture: req.file.path }, 
            { new: true }
        ).select('-password');

        if (!updatedPatient) {
           return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.status(200).json({ success: true, patient: updatedPatient });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Image upload failed' });
    }
};

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
  getAllPatients,
  updateProfilePicture
};