const express = require("express");
const router = express.Router();
const {
  sendDoctorApprovalEmail,
  sendDoctorRejectionEmail,
} = require("../controllers/emailController");

/**
 * POST /api/email/doctor-approval
 * Send doctor approval email with temporary password
 * Body: { email, name, tempPassword }
 */
router.post("/doctor-approval", async (req, res) => {
  try {
    const { email, name, tempPassword } = req.body;

    if (!email || !name || !tempPassword) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: email, name, tempPassword",
      });
    }

    const result = await sendDoctorApprovalEmail({
      email,
      name,
      tempPassword,
    });

    res.status(200).json({
      success: true,
      message: "Doctor approval email sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error sending doctor approval email:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send doctor approval email",
      error: error.message,
    });
  }
});

/**
 * POST /api/email/doctor-rejection
 * Send doctor rejection email
 * Body: { email, name, reason? }
 */
router.post("/doctor-rejection", async (req, res) => {
  try {
    const { email, name, reason } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: email, name",
      });
    }

    const result = await sendDoctorRejectionEmail({
      email,
      name,
      reason,
    });

    res.status(200).json({
      success: true,
      message: "Doctor rejection email sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error sending doctor rejection email:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send doctor rejection email",
      error: error.message,
    });
  }
});

/**
 * GET /api/email/health
 * Health check for email service
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Email service is operational",
  });
});

module.exports = router;
