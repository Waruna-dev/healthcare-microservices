const express = require("express");
const {
  sendPaymentSuccessEmail,
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/payment-success", sendPaymentSuccessEmail);

module.exports = router;
