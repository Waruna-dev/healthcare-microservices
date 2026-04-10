const express = require("express");
const {
  sendPaymentSuccessEmail,
  sendDoctorApprovalEmail,
  sendDoctorRejectionEmail,
  sendPaymentConfirmationSMSController,
  sendAppointmentConfirmationSMSController,
} = require("../controllers/notificationController");

const router = express.Router();

// Email endpoints
router.post("/payment-success", sendPaymentSuccessEmail);
router.post("/doctor-approved", sendDoctorApprovalEmail);
router.post("/doctor-rejected", sendDoctorRejectionEmail);

// SMS endpoints
router.post("/payment-confirmation-sms", sendPaymentConfirmationSMSController);
router.post("/appointment-confirmation-sms", sendAppointmentConfirmationSMSController);

module.exports = router;
