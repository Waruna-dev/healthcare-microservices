// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const { protectAdmin } = require('../middleware/authAdmin');

// --- Import Message Controllers ---
const {
  submitMessage,
  getAllMessages,
  updateMessageStatus,
  deleteMessage,
} = require("../controllers/messageController");

// Admin model
const Admin = mongoose.model("Admin");

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ==========================================
// POST /login
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please provide email and password" });

    const admin = await Admin.findOne({ email }).select("+password");

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch {
    res.status(500).json({ message: "Server error during login" });
  }
});

// ==========================================
// GET /patients
// ==========================================
router.get("/patients", protectAdmin, async (req, res) => {
  try {
    const response = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
    res.status(200).json({
      success: true,
      count: response.data.length,
      data: response.data,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch patients." });
  }
});

// ==========================================
// PUT /patients/:id
// ==========================================
router.put("/patients/:id", protectAdmin, async (req, res) => {
  try {
    const response = await axios.put(
      `${process.env.PATIENT_SERVICE_URL}/admin/${req.params.id}`,
      req.body
    );
    res.status(200).json({ success: true, data: response.data });
  } catch {
    res.status(500).json({ message: "Failed to update patient." });
  }
});

// ==========================================
// DELETE /patients/:id
// ==========================================
router.delete("/patients/:id", protectAdmin, async (req, res) => {
  try {
    await axios.delete(`${process.env.PATIENT_SERVICE_URL}/admin/${req.params.id}`);
    res.status(200).json({ success: true, message: "Patient deleted." });
  } catch {
    res.status(500).json({ message: "Failed to delete patient." });
  }
});

// ==========================================
// GET /demographics
// ==========================================
router.get("/demographics", protectAdmin, async (req, res) => {
  try {
    const supportStaffCount = await Admin.countDocuments();

    let patientsCount = 0;
    try {
      const patientRes = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
      if (Array.isArray(patientRes.data)) patientsCount = patientRes.data.length;
    } catch {}

    let specialistsCount = 0;
    let pendingDoctorsList = [];

    try {
      const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/`);
      const allDoctors = doctorRes.data.data || doctorRes.data || [];

      specialistsCount = allDoctors.filter(d => d.status === "approved").length;

      pendingDoctorsList = allDoctors
        .filter(d => d.status === "pending")
        .map(d => ({
          _id: d._id,
          name: d.name,
          email: d.email
        }));
    } catch {}

    const totalUsers = supportStaffCount + patientsCount + specialistsCount;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        demographics: {
          patients: patientsCount,
          specialists: specialistsCount,
          supportStaff: supportStaffCount,
        },
        pendingDoctors: pendingDoctorsList,
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to generate demographics." });
  }
});

// ==========================================
// PUT /doctors/:id/approve
// ==========================================
router.put("/doctors/:id/approve", protectAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    const doctorId = req.params.id;

    if (!email || !name)
      return res.status(400).json({ message: "Doctor email and name are required." });

    const tempPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update doctor
    await axios.put(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/admin/${doctorId}`, {
      status: "approved",
      password: hashedPassword,
    });

    // Send notification
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/doctor-approved`, {
        email,
        name,
        tempPassword,
      });
    } catch (err) {
      return res.status(200).json({
        success: true,
        message: "Doctor approved, but notification failed.",
        tempPassword,
      });
    }

    res.json({ success: true, message: "Doctor approved successfully!" });

  } catch {
    res.status(500).json({ message: "Failed to approve doctor." });
  }
});

// ==========================================
// PUT /doctors/:id/reject
// ==========================================
router.put("/doctors/:id/reject", protectAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    const doctorId = req.params.id;

    if (!email || !name)
      return res.status(400).json({ message: "Doctor email and name are required." });

    await axios.delete(`${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);

    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/doctor-rejected`, {
        email,
        name,
      });
    } catch {
      return res.status(200).json({
        success: true,
        message: "Doctor deleted, but notification failed.",
      });
    }

    res.json({ success: true, message: "Doctor rejected successfully!" });

  } catch {
    res.status(500).json({ message: "Failed to reject doctor." });
  }
});

// ==========================================
// SUPPORT MESSAGES
// ==========================================
router.post("/contact", submitMessage);
router.get("/messages", protectAdmin, getAllMessages);
router.put("/messages/:id", protectAdmin, updateMessageStatus);
router.delete("/messages/:id", protectAdmin, deleteMessage);

module.exports = router;