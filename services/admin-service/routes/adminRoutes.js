// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { protectAdmin } = require('../middleware/authAdmin');
const sendEmail = require('../utils/sendEmail');

// --- NEW: Import Message Controllers ---
const { 
  submitMessage, 
  getAllMessages, 
  updateMessageStatus, 
  deleteMessage 
} = require('../controllers/messageController');

// Fetch the Admin model we defined in server.js
const Admin = mongoose.model('Admin');

// Helper to generate token
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
    const response = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
    res.status(200).json({ success: true, count: response.data.length, data: response.data });
  } catch (error) {
    console.error("MICROSERVICE CONNECTION FAILED!", error.message);
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
      if (patientRes.data.patients) patientsCount = patientRes.data.patients.length;
      else if (patientRes.data.data) patientsCount = patientRes.data.data.length;
      else if (Array.isArray(patientRes.data)) patientsCount = patientRes.data.length;
    } catch (err) {
      console.error("Demographics: Failed to fetch patients count");
    }

    let specialistsCount = 0; 
    let pendingDoctorsList = []; 
    
    try {
      if (process.env.DOCTOR_SERVICE_URL) {
        const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/?limit=1000`);
        
        let allDoctors = [];
        
        if (doctorRes.data.doctors && Array.isArray(doctorRes.data.doctors)) {
            allDoctors = doctorRes.data.doctors;
        } else if (doctorRes.data.data && Array.isArray(doctorRes.data.data)) {
            allDoctors = doctorRes.data.data; 
        } else if (Array.isArray(doctorRes.data)) {
            allDoctors = doctorRes.data; 
        }
        
        const approvedDoctors = allDoctors.filter(doc => doc.status === 'approved');
        specialistsCount = approvedDoctors.length;

        pendingDoctorsList = allDoctors
          .filter(doc => doc.status === 'pending')
          .map(doc => ({
            _id: doc._id,
            name: doc.name,
            email: doc.email
          }));
      }
    } catch (err) {
      console.error("Demographics: Failed to fetch specialists count", err.message);
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
// PUT /doctors/:id/approve - Approve & Email Doctor
// ==========================================
router.put('/doctors/:id/approve', protectAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { name, email } = req.body; 

    if (!email || !name) {
      return res.status(400).json({ message: "Doctor email and name are required to send the approval email." });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    try {
      await axios.put(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/admin/${doctorId}`, {
        status: 'approved',
        password: hashedPassword
      });
    } catch (err) {
      console.error("Failed to update doctor in Doctor Microservice:", err.message);
      return res.status(500).json({ message: "Failed to update doctor status in the database." });
    }

    // --- BEAUTIFUL APPROVAL EMAIL HTML ---
    const approvalHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; color: #374151;">
        <h1 style="text-align: center; color: #111827; margin-bottom: 30px; font-size: 28px;">CareSync</h1>
        
        <p style="font-size: 16px; color: #4b5563;">Hello Dr. ${name},</p>
        
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
          We are pleased to inform you that your medical registration has been verified and approved. You are now a certified member of the CareSync network.
        </p>

        <div style="background-color: #f3f4f6; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
          <p style="font-size: 12px; font-weight: bold; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">Your Temporary Password</p>
          <p style="font-size: 28px; font-weight: bold; color: #111827; margin: 0; font-family: monospace; letter-spacing: 2px;">${tempPassword}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:5173/login" style="background-color: #5454e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">Access Dashboard</a>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 13px; color: #9ca3af;">Or copy and paste this link into your browser:</p>
          <a href="http://localhost:5173/login" style="font-size: 13px; color: #5454e5;">http://localhost:5173/login</a>
        </div>

        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 40px 0 20px 0;" />
        
        <div style="text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
          <p>© 2026 CARESYNC. QUALITY CARE BY DESIGN.</p>
          <p style="text-transform: none;">If you did not expect this approval, please contact our support team immediately.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: email,
        subject: 'CareSync: Your Account is Approved!',
        message: `Welcome Dr. ${name}! Your account is approved. Your temporary password is: ${tempPassword}`,
        html: approvalHTML
      });
    } catch (emailError) {
      console.error("Email failed:", emailError);
      return res.status(200).json({
        success: true,
        message: 'Doctor approved, but failed to send the notification email.',
        tempPasswordForAdminToShare: tempPassword 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor approved and email sent successfully!'
    });

  } catch (error) {
    console.error("Error approving doctor:", error);
    res.status(500).json({ message: 'Failed to approve doctor.' });
  }
});

// ==========================================
// PUT /doctors/:id/reject - Reject & Delete Doctor
// ==========================================
router.put('/doctors/:id/reject', protectAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { name, email } = req.body; 

    if (!email || !name) {
      return res.status(400).json({ message: "Doctor email and name are required to send the rejection email." });
    }
    
    try {
      await axios.delete(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);
    } catch (err) {
      console.error("Failed to delete doctor in Doctor Microservice:", err.message);
      return res.status(500).json({ message: "Failed to delete doctor from the database." });
    }

    // --- BEAUTIFUL REJECTION EMAIL HTML ---
    const rejectionHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; color: #374151;">
        <h1 style="text-align: center; color: #111827; margin-bottom: 30px; font-size: 28px;">CareSync</h1>
        
        <p style="font-size: 16px; color: #4b5563;">Hello Dr. ${name},</p>
        
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
          Thank you for your interest in joining the CareSync network. After careful review of your application and credentials by our administration team, we regret to inform you that we are unable to approve your registration at this time.
        </p>

        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
          To protect your privacy, any personal data, documents, and information submitted during your registration process has been <strong>permanently deleted</strong> from our systems.
        </p>

        <div style="background-color: #f3f4f6; border-left: 4px solid #5454e5; padding: 24px; border-radius: 0 8px 8px 0; margin: 30px 0;">
          <h3 style="margin-top: 0; color: #111827; font-size: 16px;">We invite you to reapply</h3>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 20px;">
            If you have updated credentials, obtained a new medical license, or believe your application was rejected in error due to missing information, you are welcome to submit a new application.
          </p>
          <a href="http://localhost:5173/register" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Submit New Application</a>
        </div>

        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 40px 0 20px 0;" />
        
        <div style="text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
          <p>© 2026 CARESYNC. QUALITY CARE BY DESIGN.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: email,
        subject: 'CareSync: Application Update',
        message: `Dear Dr. ${name}, we regret to inform you that your application to join CareSync has been declined.`,
        html: rejectionHTML
      });
    } catch (emailError) {
      console.error("Email failed:", emailError);
      return res.status(200).json({
        success: true,
        message: 'Doctor deleted from database, but failed to send the notification email.'
      });
    }

    res.status(200).json({ success: true, message: 'Doctor rejected, data deleted, and email sent successfully.' });
  } catch (error) {
    console.error("Error rejecting doctor:", error);
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
    const response = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/?limit=1000`);
    
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
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    } else {
      delete req.body.password; 
    }

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
// SUPPORT INBOX ROUTES (NEW)
// ==========================================

// PUBLIC: Submit a message from the Contact Us page
router.post('/contact', submitMessage);

// PRIVATE: Admin message management
router.get('/messages', protectAdmin, getAllMessages);
router.put('/messages/:id', protectAdmin, updateMessageStatus);
router.delete('/messages/:id', protectAdmin, deleteMessage);

module.exports = router;