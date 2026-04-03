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
    res.status(200).json({
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

        // 🔥 THE FIX: Filter out pending/rejected doctors, count ONLY approved ones
        const approvedDoctors = allDoctors.filter(
          (doc) => doc.status === "approved",
        );
        specialistsCount = approvedDoctors.length;

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
      return res.status(400).json({
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
      await sendEmail({
        email: email,
        subject: "CareSync: Your Account is Approved!",
        message: `Welcome Dr. ${name}! Your account is approved. Your temporary password is: ${tempPassword}`,
        html: `
          <div style="background-color: #f9fafb; padding: 50px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <h1 style="font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 30px; letter-spacing: -0.025em;">
                CareSync
              </h1>

              <p style="font-size: 16px; color: #374151; margin-bottom: 24px; text-align: left;">
                Hello Dr. ${name},
              </p>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px; text-align: left;">
                We are pleased to inform you that your medical registration has been verified and approved. You are now a certified member of the CareSync network.
              </p>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                <p style="font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
                  Your Temporary Password
                </p>
                <p style="font-size: 24px; font-weight: 700; color: #111827; margin: 0; letter-spacing: 0.1em;">
                  ${tempPassword}
                </p>
              </div>

              <div style="margin-bottom: 35px;">
                <a href="http://localhost:5173/login" style="display: inline-block; padding: 16px 36px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 700; transition: background-color 0.2s;">
                  Access Dashboard
                </a>
              </div>

              <p style="font-size: 13px; color: #9ca3af; margin-bottom: 8px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; color: #4F46E5; word-break: break-all; margin-bottom: 40px;">
                <a href="http://localhost:5173/login" style="color: #4F46E5; text-decoration: underline;">http://localhost:5173/login</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #f3f4f6; margin-bottom: 30px;" />

              <footer style="text-align: center;">
                <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                  © ${new Date().getFullYear()} CareSync. Quality Care by Design.
                </p>
                <p style="font-size: 11px; color: #d1d5db; line-height: 1.4;">
                  If you did not expect this approval, please contact our support team immediately.
                </p>
              </footer>
            </div>
          </div>
        `,
      });
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
// PUT /doctors/:id/reject - Reject & Delete Doctor
// ==========================================
router.put("/doctors/:id/reject", protectAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { name, email } = req.body;

    if (!email || !name) {
      return res
        .status(400)
        .json({
          message:
            "Doctor email and name are required to send the rejection email.",
        });
    }

    // 1. Tell the Doctor Microservice to DELETE this doctor from the DB entirely
    try {
      await axios.delete(
        `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`,
      );
    } catch (err) {
      console.error(
        "Failed to delete doctor in Doctor Microservice:",
        err.message,
      );
      return res
        .status(500)
        .json({ message: "Failed to delete doctor from the database." });
    }

    // 2. Send Rejection & Reapply Email via Resend
    try {
      await sendEmail({
        email: email,
        subject: "CareSync: Application Update",
        message: `Dear Dr. ${name}, we regret to inform you that your application to join CareSync has been declined. You are welcome to reapply.`,
        html: `
          <div style="background-color: #f9fafb; padding: 50px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <h1 style="font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 30px; letter-spacing: -0.025em;">
                CareSync
              </h1>

              <p style="font-size: 16px; color: #374151; margin-bottom: 24px; text-align: left;">
                Hello Dr. ${name},
              </p>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px; text-align: left;">
                Thank you for your interest in joining the CareSync network. After careful review of your application and credentials by our administration team, we regret to inform you that we are unable to approve your registration at this time.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px; text-align: left;">
                To protect your privacy, any personal data, documents, and information submitted during your registration process has been <strong>permanently deleted</strong> from our systems.
              </p>

              <div style="background-color: #f3f4f6; border-left: 4px solid #4F46E5; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
                <p style="font-size: 15px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 10px;">
                  We invite you to reapply
                </p>
                <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 20px;">
                  If you have updated credentials, obtained a new medical license, or believe your application was rejected in error due to missing information, you are welcome to submit a new application.
                </p>
                <a href="http://localhost:5173/doctor/register" style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; transition: background-color 0.2s;">
                  Submit New Application
                </a>
              </div>

              <hr style="border: 0; border-top: 1px solid #f3f4f6; margin-bottom: 30px;" />

              <footer style="text-align: center;">
                <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                  © ${new Date().getFullYear()} CareSync. Quality Care by Design.
                </p>
              </footer>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Resend Email failed:", emailError);
      return res.status(200).json({
        success: true,
        message:
          "Doctor deleted from database, but failed to send the notification email.",
      });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Doctor rejected, data deleted, and email sent successfully.",
      });
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
      return res.status(400).json({
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

// ==========================================
// GET /doctors - Fetch all Doctors
// ==========================================
router.get("/doctors", protectAdmin, async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/`,
    );

    // Extract the array properly based on how the Doctor Service sends it
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
router.put("/doctors/:id", protectAdmin, async (req, res) => {
  try {
    // If they typed a password to reset, we must hash it first!
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    } else {
      delete req.body.password; // Don't send empty passwords
    }

    // Call the /admin/:id route so it accepts the password change if there is one
    const response = await axios.put(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/admin/${req.params.id}`,
      req.body,
    );
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("Failed to update doctor:", error.message);
    res.status(500).json({ message: "Failed to update doctor." });
  }
});

// ==========================================
// DELETE /doctors/:id - Delete a Doctor
// ==========================================
router.delete("/doctors/:id", protectAdmin, async (req, res) => {
  try {
    await axios.delete(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${req.params.id}`,
    );
    res.status(200).json({ success: true, message: "Doctor deleted." });
  } catch (error) {
    console.error("Failed to delete doctor:", error.message);
    res.status(500).json({ message: "Failed to delete doctor." });
  }
});

module.exports = router;
