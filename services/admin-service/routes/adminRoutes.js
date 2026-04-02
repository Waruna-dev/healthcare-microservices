// services/admin-service/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const { protectAdmin } = require('../middleware/authAdmin');

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
    // FIX: Changed from /api/patients to just /
    const response = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
    res.status(200).json({ success: true, count: response.data.length, data: response.data });
  } catch (error) {
    console.error("MICROSERVICE CONNECTION FAILED!");
    console.error(error.message); 
    
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
    // EXPOSE THE ERROR:
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
    // EXPOSE THE ERROR:
    console.error("DELETE FAILED IN MICROSERVICE:", error.message);
    res.status(500).json({ message: "Failed to delete patient." });
  }
});

// ==========================================
// GET /demographics - Fetch dashboard stats
// ==========================================
router.get('/demographics', protectAdmin, async (req, res) => {
  try {
    // 1. Get Support Staff directly from the local Admin Database
    const supportStaffCount = await Admin.countDocuments();

    // 2. Get Patients from the Patient Microservice
    let patientsCount = 0;
    try {
      const patientRes = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
      patientsCount = patientRes.data.length; 
    } catch (err) {
      console.error("Demographics: Failed to fetch patients count", err.message);
    }

    // 3. Get Specialists from the Doctor Microservice (TEMPORARILY DISABLED)
    let specialistsCount = 0; // Keeping this at 0 prevents the frontend from breaking
    
    /* try {
      if (process.env.DOCTOR_SERVICE_URL) {
        const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/`);
        specialistsCount = doctorRes.data.length;
      }
    } catch (err) {
      console.error("Demographics: Failed to fetch specialists count", err.message);
    }
    */

    // 4. Calculate Totals
    const totalUsers = supportStaffCount + patientsCount + specialistsCount;

    // 5. Calculate Real Growth Percentage
    // Ideally, you query your DB for users created in the last 30 days. 
    // For now, we assume all current users are new this month (a placeholder until you add creation dates)
    let newUsersThisMonth = totalUsers; 
    let previousMonthUsers = totalUsers - newUsersThisMonth;
    
    let growthPercentage = 0;
    
    if (previousMonthUsers === 0 && totalUsers > 0) {
      // If you had 0 users last month, and now you have users, that is 100% growth!
      growthPercentage = 100; 
    } else if (previousMonthUsers > 0) {
      // The standard math formula for percentage growth
      growthPercentage = Math.round((newUsersThisMonth / previousMonthUsers) * 100);
    }

    // Send formatted response exactly how the React frontend expects it
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        growthPercentage,
        demographics: {
          patients: patientsCount,
          specialists: specialistsCount, // Will safely return 0
          supportStaff: supportStaffCount
        }
      }
    });

  } catch (error) {
    console.error("Error generating demographics:", error.message);
    res.status(500).json({ message: "Failed to generate demographics." });
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
    // 1. Find the admin and explicitly ask for the password field
    const admin = await Admin.findById(req.admin._id).select('+password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // 2. Update basic info (only if provided)
    if (req.body.name) admin.name = req.body.name;
    if (req.body.email) admin.email = req.body.email;

    // 3. Update Password ONLY IF they actually typed a new one
    // .trim() ensures we don't accidentally process spaces
    if (req.body.newPassword && req.body.newPassword.trim() !== '') {
      
      if (!req.body.currentPassword) {
        return res.status(400).json({ message: 'Please provide your current password to set a new one.' });
      }
      
      const isMatch = await admin.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }

      admin.password = req.body.newPassword;
    }

    // 4. Save the updated admin to the database
    const updatedAdmin = await admin.save();

    // 5. Send success response
    res.status(200).json({ 
      success: true, 
      data: { 
        _id: updatedAdmin._id, 
        name: updatedAdmin.name, 
        email: updatedAdmin.email, 
        role: updatedAdmin.role 
      }
    });

  } catch (error) {
    // EXPOSE THE ERROR IN YOUR TERMINAL:
    console.error("🔥 PROFILE UPDATE ERROR:", error);

    // If they tried to change their email to one that already exists in the database
    if (error.code === 11000) {
      return res.status(400).json({ message: 'That email is already in use by another admin.' });
    }

    res.status(500).json({ message: 'Failed to update profile. Check server console.' });
  }
});
// ==========================================
// DELETE /profile - Delete Current Admin
// ==========================================
router.delete('/profile', protectAdmin, async (req, res) => {
  try {
    const adminId = req.admin._id;

    // Safety Check: Don't let them delete the account if they are the last admin standing!
    const adminCount = await Admin.countDocuments();
    if (adminCount <= 1) {
      return res.status(400).json({ 
        message: 'Action denied. You are the last remaining administrator. Please create another admin account first.' 
      });
    }

    await Admin.findByIdAndDelete(adminId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Admin account deleted successfully.' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account.' });
  }
});

module.exports = router;