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

module.exports = router;