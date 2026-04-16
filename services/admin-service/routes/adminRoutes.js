// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
// We don't need bcrypt here anymore because the Doctor Service handles its own hashing!

const { protectAdmin } = require('../middleware/authAdmin');

const { 
  submitMessage, 
  getAllMessages, 
  updateMessageStatus, 
  deleteMessage 
} = require('../controllers/messageController');

const Admin = mongoose.model('Admin');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ==========================================
// POST /login - Admin Login
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    const admin = await Admin.findOne({ email }).select('+password');

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ==========================================
// GET /patients - Fetch all patients
// ==========================================
router.get('/patients', protectAdmin, async (req, res) => {
  try {
    const targetUrl = `${process.env.PATIENT_SERVICE_URL}/`;
    const response = await axios.get(targetUrl);

    let patientsArray = [];
    if (Array.isArray(response.data)) patientsArray = response.data;
    else if (Array.isArray(response.data.data)) patientsArray = response.data.data;
    else if (Array.isArray(response.data.patients)) patientsArray = response.data.patients;

    res.status(200).json({ success: true, count: patientsArray.length, data: patientsArray });
  } catch (error) {
    console.error("🚨 GET /patients - MICROSERVICE FAILED:", error.message);
    res.status(500).json({ message: "Failed to fetch patients." });
  }
});

// ==========================================
// PUT /patients/:id - Update a patient
// ==========================================
router.put('/patients/:id', protectAdmin, async (req, res) => {
  try {
    const response = await axios.put(`${process.env.PATIENT_SERVICE_URL}/admin/${req.params.id}`, req.body);
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("UPDATE FAILED IN MICROSERVICE:", error.message);
    res.status(500).json({ message: "Failed to update patient." });
  }
});

// ==========================================
// DELETE /patients/:id - Delete a patient
// ==========================================
router.delete('/patients/:id', protectAdmin, async (req, res) => {
  try {
    await axios.delete(`${process.env.PATIENT_SERVICE_URL}/admin/${req.params.id}`);
    res.status(200).json({ success: true, message: "Patient deleted." });
  } catch (error) {
    console.error("DELETE FAILED IN MICROSERVICE:", error.message);
    res.status(500).json({ message: "Failed to delete patient." });
  }
});

// ==========================================
// GET /demographics - Fetch dashboard stats
// ==========================================
router.get('/demographics', protectAdmin, async (req, res) => {
  try {
    const supportStaffCount = await Admin.countDocuments();

    let patientsCount = 0;
    try {
      const patientRes = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
      if (Array.isArray(patientRes.data)) patientsCount = patientRes.data.length;
      else if (Array.isArray(patientRes.data.data)) patientsCount = patientRes.data.data.length;
      else if (Array.isArray(patientRes.data.patients)) patientsCount = patientRes.data.patients.length;
    } catch (err) {
      console.error("🚨 Demographics: Failed to fetch patients count. Reason:", err.message);
    }

    let specialistsCount = 0; 
    let pendingDoctorsList = []; 
    
    try {
      if (process.env.DOCTOR_SERVICE_URL) {
        // Correct path to fetch doctors
        const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/api/doctors?limit=1000`);
        
        let allDoctors = [];
        if (Array.isArray(doctorRes.data)) allDoctors = doctorRes.data;
        else if (Array.isArray(doctorRes.data.data)) allDoctors = doctorRes.data.data;
        else if (Array.isArray(doctorRes.data.doctors)) allDoctors = doctorRes.data.doctors;
        
        const approvedDoctors = allDoctors.filter(doc => doc.status === 'approved');
        specialistsCount = approvedDoctors.length;

        pendingDoctorsList = allDoctors
          .filter(doc => doc.status === 'pending')
          .map(doc => ({ _id: doc._id, name: doc.name, email: doc.email }));
      }
    } catch (err) {
      console.error("🚨 Demographics: Failed to fetch specialists count. Reason:", err.message);
    }

    const totalUsers = supportStaffCount + patientsCount + specialistsCount;
    let newUsersThisMonth = totalUsers; 
    let previousMonthUsers = totalUsers - newUsersThisMonth;
    
    let growthPercentage = 0;
    if (previousMonthUsers === 0 && totalUsers > 0) {
      growthPercentage = 100; 
    } else if (previousMonthUsers > 0) {
      growthPercentage = Math.round((newUsersThisMonth / previousMonthUsers) * 100);
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        growthPercentage,
        demographics: { 
          patients: patientsCount, 
          specialists: specialistsCount, 
          supportStaff: supportStaffCount 
        },
        pendingDoctors: pendingDoctorsList 
      }
    });

  } catch (error) {
    console.error("Error generating demographics:", error.message);
    res.status(500).json({ message: "Failed to generate demographics." });
  }
});

// ==========================================
// GET /doctors/:id - Fetch Single Doctor Details
// ==========================================
router.get('/doctors/:id', protectAdmin, async (req, res) => {
  try {
    const response = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/${req.params.id}`);
    const doctorData = response.data.data || response.data.doctor || response.data;
    res.status(200).json({ success: true, data: doctorData });
  } catch (error) {
    console.error("Failed to fetch doctor details:", error.message);
    res.status(500).json({ message: "Failed to fetch doctor details." });
  }
});

// ==========================================
// PUT /doctors/:id/approve
// ==========================================
router.put('/doctors/:id/approve', protectAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { name, email } = req.body; 

    if (!email || !name) return res.status(400).json({ message: "Doctor email and name are required." });

    // 🚨 FIX: Generate plain text password. Do NOT hash it here!
    const tempPassword = crypto.randomBytes(4).toString('hex');

    // 1. Update Database via Doctor Service (The Doctor Service will hash this securely)
    await axios.put(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/admin/${doctorId}`, {
      status: 'approved',
      password: tempPassword 
    });

    const targetUrl = `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/doctor-approved`;
    
    // 2. Trigger Email via Notification Service
    try {
      await axios.post(targetUrl, {
        email,
        name,
        tempPassword
      });
    } catch (emailError) {
      console.error("Notification Service Failed:", emailError.message);
      return res.status(200).json({ success: true, message: 'Doctor approved, but failed to reach notification service.', tempPassword });
    }

    res.status(200).json({ success: true, message: 'Doctor approved and email sent successfully!' });
  } catch (error) {
    console.error("Failed to approve doctor:", error.message);
    res.status(500).json({ message: 'Failed to approve doctor.' });
  }
});

// ==========================================
// PUT /doctors/:id/reject
// ==========================================
router.put('/doctors/:id/reject', protectAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { name, email } = req.body; 

    if (!email || !name) return res.status(400).json({ message: "Doctor email and name are required." });
    
    await axios.delete(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);

    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/doctor-rejected`, {
        email,
        name
      });
    } catch (emailError) {
      console.error("Notification Service Failed:", emailError.message);
      return res.status(200).json({ success: true, message: 'Doctor deleted, but failed to reach notification service.' });
    }

    res.status(200).json({ success: true, message: 'Doctor rejected, data deleted, and email sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject doctor.' });
  }
});

// ==========================================
// POST /register - Add New Admin
// ==========================================
router.post('/register', protectAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const newAdmin = await Admin.create({ name, email, password, role });

    res.status(201).json({ 
      success: true, 
      message: 'Admin created successfully',
      data: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create new admin' });
  }
});

// ==========================================
// PUT /profile - Update Current Admin
// ==========================================
router.put('/profile', protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('+password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (req.body.name) admin.name = req.body.name;
    if (req.body.email) admin.email = req.body.email;

    if (req.body.newPassword && req.body.newPassword.trim() !== '') {
      if (!req.body.currentPassword) return res.status(400).json({ message: 'Please provide your current password.' });
      
      const isMatch = await admin.matchPassword(req.body.currentPassword);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

      admin.password = req.body.newPassword;
    }

    const updatedAdmin = await admin.save();

    res.status(200).json({ 
      success: true, 
      data: { _id: updatedAdmin._id, name: updatedAdmin.name, email: updatedAdmin.email, role: updatedAdmin.role }
    });
  } catch (error) {
    console.error("🔥 PROFILE UPDATE ERROR:", error);
    if (error.code === 11000) return res.status(400).json({ message: 'That email is already in use.' });
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// ==========================================
// DELETE /profile - Delete Current Admin
// ==========================================
router.delete('/profile', protectAdmin, async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Action denied. You are the last remaining administrator.' });
    }

    await Admin.findByIdAndDelete(req.admin._id);
    res.status(200).json({ success: true, message: 'Admin account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account.' });
  }
});

// ==========================================
// GET /doctors - Fetch all Doctors
// ==========================================
router.get('/doctors', protectAdmin, async (req, res) => {
  try {
    const response = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/api/doctors?limit=1000`);
    
    let allDoctors = [];
    if (response.data.doctors && Array.isArray(response.data.doctors)) {
        allDoctors = response.data.doctors;
    } else if (response.data.data && Array.isArray(response.data.data)) {
        allDoctors = response.data.data; 
    } else if (Array.isArray(response.data)) {
        allDoctors = response.data; 
    }
    
    res.status(200).json({ success: true, data: allDoctors });
  } catch (error) {
    console.error("Failed to fetch doctors list:", error.message);
    res.status(500).json({ message: "Failed to fetch doctors list." });
  }
});

// ==========================================
// PUT /doctors/:id - Update a Doctor
// ==========================================
router.put('/doctors/:id', protectAdmin, async (req, res) => {
  try {
    // 🚨 FIX: Removed bcrypt logic here. Just forward the body, let Doctor Service hash it!
    const response = await axios.put(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/admin/${req.params.id}`, req.body);
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("Failed to update doctor:", error.message);
    res.status(500).json({ message: "Failed to update doctor." });
  }
});

// ==========================================
// DELETE /doctors/:id - Delete a Doctor
// ==========================================
router.delete('/doctors/:id', protectAdmin, async (req, res) => {
  try {
    await axios.delete(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/${req.params.id}`);
    res.status(200).json({ success: true, message: "Doctor deleted." });
  } catch (error) {
    console.error("Failed to delete doctor:", error.message);
    res.status(500).json({ message: "Failed to delete doctor." });
  }
});

// ==========================================
// SUPPORT INBOX ROUTES
// ==========================================
router.post('/contact', submitMessage);
router.get('/messages', protectAdmin, getAllMessages);
router.put('/messages/:id', protectAdmin, updateMessageStatus);
router.delete('/messages/:id', protectAdmin, deleteMessage);

module.exports = router;