const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const { protectAdmin } = require("../middleware/authAdmin");

// Fetch the Admin model we defined in server.js
const Admin = mongoose.model("Admin");

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ==========================================
// POST /login - Admin Login
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Please provide email and password" });

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
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// ==========================================
// GET /patients - Fetch all patients
// ==========================================
router.get("/patients", protectAdmin, async (req, res) => {
  try {
    const response = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
    res
      .status(200)
      .json({
        success: true,
        count: response.data.length,
        data: response.data,
      });
  } catch (error) {
    console.error("MICROSERVICE CONNECTION FAILED!", error.message);
    res.status(500).json({ message: "Failed to fetch patients." });
  }
});

// ==========================================
// PUT /patients/:id - Update a patient
// ==========================================
router.put("/patients/:id", protectAdmin, async (req, res) => {
  try {
    const response = await axios.put(
      `${process.env.PATIENT_SERVICE_URL}/admin/${req.params.id}`,
      req.body,
    );
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("UPDATE FAILED IN MICROSERVICE:", error.message);
    res.status(500).json({ message: "Failed to update patient." });
  }
});

// ==========================================
// DELETE /patients/:id - Delete a patient
// ==========================================
router.delete("/patients/:id", protectAdmin, async (req, res) => {
  try {
    await axios.delete(
      `${process.env.PATIENT_SERVICE_URL}/admin/${req.params.id}`,
    );
    res.status(200).json({ success: true, message: "Patient deleted." });
  } catch (error) {
    console.error("DELETE FAILED IN MICROSERVICE:", error.message);
    res.status(500).json({ message: "Failed to delete patient." });
  }
});

// ==========================================
// GET /demographics - Fetch dashboard stats
// ==========================================
router.get("/demographics", protectAdmin, async (req, res) => {
  try {
    const supportStaffCount = await Admin.countDocuments();

    let patientsCount = 0;
    try {
      const patientRes = await axios.get(`${process.env.PATIENT_SERVICE_URL}/`);
      if (patientRes.data.patients)
        patientsCount = patientRes.data.patients.length;
      else if (patientRes.data.data)
        patientsCount = patientRes.data.data.length;
      else if (Array.isArray(patientRes.data))
        patientsCount = patientRes.data.length;
    } catch (err) {
      console.error("Demographics: Failed to fetch patients count");
    }

    let specialistsCount = 0;
    let pendingDoctorsList = [];

    try {
      if (process.env.DOCTOR_SERVICE_URL) {
        const doctorRes = await axios.get(
          `${process.env.DOCTOR_SERVICE_URL}/api/doctors/`,
        );

        let allDoctors = [];

        // Target the specific "doctors" array from your service
        if (doctorRes.data.doctors && Array.isArray(doctorRes.data.doctors)) {
          allDoctors = doctorRes.data.doctors;
        } else if (doctorRes.data.data && Array.isArray(doctorRes.data.data)) {
          allDoctors = doctorRes.data.data;
        } else if (Array.isArray(doctorRes.data)) {
          allDoctors = doctorRes.data;
        }

        specialistsCount = allDoctors.length;

        // Extract the pending doctors
        pendingDoctorsList = allDoctors
          .filter((doc) => doc.status === "pending")
          .map((doc) => ({
            _id: doc._id,
            name: doc.name,
            email: doc.email,
          }));
      }
    } catch (err) {
      console.error(
        "Demographics: Failed to fetch specialists count",
        err.message,
      );
    }

    const totalUsers = supportStaffCount + patientsCount + specialistsCount;
    let newUsersThisMonth = totalUsers;
    let previousMonthUsers = totalUsers - newUsersThisMonth;

    let growthPercentage = 0;
    if (previousMonthUsers === 0 && totalUsers > 0) {
      growthPercentage = 100;
    } else if (previousMonthUsers > 0) {
      growthPercentage = Math.round(
        (newUsersThisMonth / previousMonthUsers) * 100,
      );
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        growthPercentage,
        demographics: {
          patients: patientsCount,
          specialists: specialistsCount,
          supportStaff: supportStaffCount,
        },
        pendingDoctors: pendingDoctorsList,
      },
    });
  } catch (error) {
    console.error("Error generating demographics:", error.message);
    res.status(500).json({ message: "Failed to generate demographics." });
  }
});

// ==========================================
// GET /doctors/:id - Fetch Single Doctor Details
// ==========================================
router.get("/doctors/:id", protectAdmin, async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${req.params.id}`,
    );

    // Accommodate different potential response structures
    const doctorData =
      response.data.data || response.data.doctor || response.data;

    res.status(200).json({ success: true, data: doctorData });
  } catch (error) {
    console.error("Failed to fetch doctor details:", error.message);
    res.status(500).json({ message: "Failed to fetch doctor details." });
  }
});

// ==========================================
// PUT /doctors/:id/approve - Approve & Email Doctor
// ==========================================
router.put("/doctors/:id/approve", protectAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { name, email } = req.body;

    if (!email || !name) {
      return res
        .status(400)
        .json({
          message:
            "Doctor email and name are required to send the approval email.",
        });
    }

    const tempPassword = crypto.randomBytes(4).toString("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update doctor status in Doctor Microservice
    try {
      await axios.put(
        `${process.env.DOCTOR_SERVICE_URL}/api/doctors/admin/${doctorId}`,
        {
          status: "approved",
          password: hashedPassword,
        },
      );
    } catch (err) {
      console.error(
        "Failed to update doctor in Doctor Microservice:",
        err.message,
      );
      return res
        .status(500)
        .json({ message: "Failed to update doctor status in the database." });
    }

    // Send approval email via Message Service
    try {
      await axios.post(
        `${process.env.MESSAGE_SERVICE_URL}/api/email/doctor-approval`,
        {
          email,
          name,
          tempPassword,
        },
      );
    } catch (emailError) {
      console.error(
        "Message Service email sending failed:",
        emailError.message,
      );
      return res.status(200).json({
        success: true,
        message: "Doctor approved, but failed to send the notification email.",
        tempPasswordForAdminToShare: tempPassword,
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor approved and email sent successfully!",
    });
  } catch (error) {
    console.error("Error approving doctor:", error);
    res.status(500).json({ message: "Failed to approve doctor." });
  }
});

// ==========================================
// PUT /doctors/:id/reject - Reject Doctor
// ==========================================
router.put("/doctors/:id/reject", protectAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;

    try {
      // FIX: Point exactly to the /api/doctors/:id route
      await axios.put(
        `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`,
        {
          status: "rejected",
        },
      );
    } catch (err) {
      console.error(
        "Failed to update doctor in Doctor Microservice:",
        err.message,
      );
      return res
        .status(500)
        .json({ message: "Failed to update doctor status in the database." });
    }

    res
      .status(200)
      .json({ success: true, message: "Doctor rejected successfully." });
  } catch (error) {
    console.error("Error rejecting doctor:", error);
    res.status(500).json({ message: "Failed to reject doctor." });
  }
});

// ==========================================
// POST /register - Add New Admin
// ==========================================
router.post("/register", protectAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exists" });
    }

    const newAdmin = await Admin.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create new admin" });
  }
});

// ==========================================
// PUT /profile - Update Current Admin
// ==========================================
router.put("/profile", protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("+password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (req.body.name) admin.name = req.body.name;
    if (req.body.email) admin.email = req.body.email;

    if (req.body.newPassword && req.body.newPassword.trim() !== "") {
      if (!req.body.currentPassword)
        return res
          .status(400)
          .json({ message: "Please provide your current password." });

      const isMatch = await admin.matchPassword(req.body.currentPassword);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });

      admin.password = req.body.newPassword;
    }

    const updatedAdmin = await admin.save();

    res.status(200).json({
      success: true,
      data: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
      },
    });
  } catch (error) {
    console.error("🔥 PROFILE UPDATE ERROR:", error);
    if (error.code === 11000)
      return res.status(400).json({ message: "That email is already in use." });
    res.status(500).json({ message: "Failed to update profile." });
  }
});

// ==========================================
// DELETE /profile - Delete Current Admin
// ==========================================
router.delete("/profile", protectAdmin, async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount <= 1) {
      return res
        .status(400)
        .json({
          message: "Action denied. You are the last remaining administrator.",
        });
    }

    await Admin.findByIdAndDelete(req.admin._id);
    res
      .status(200)
      .json({ success: true, message: "Admin account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete account." });
  }
});

module.exports = router;
