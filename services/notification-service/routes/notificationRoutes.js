const express = require("express");
const {
  sendPaymentSuccessEmail,
  sendDoctorApprovalEmail,
  sendDoctorRejectionEmail
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/payment-success", sendPaymentSuccessEmail);
router.post("/doctor-approved", sendDoctorApprovalEmail);
router.post("/doctor-rejected", sendDoctorRejectionEmail);

module.exports = router;
