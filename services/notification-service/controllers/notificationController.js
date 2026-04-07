const sendEmail = require("../utils/sendEmail");
const { buildPaymentSuccessEmail } = require("../utils/emailTemplates");

const sendPaymentSuccessEmail = async (req, res) => {
  try {
    const {
      email,
      patientName,
      orderId,
      amount,
      currency = "LKR",
      appointmentDate,
      appointmentTime,
    } = req.body;

    if (!email || !orderId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "email, orderId and amount are required",
      });
    }

    const { subject, html, text } = buildPaymentSuccessEmail({
      patientName,
      orderId,
      amount,
      currency,
      appointmentDate,
      appointmentTime,
    });

    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    return res.status(200).json({
      success: true,
      message: "Payment success email sent",
      emailId: result?.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send payment success email",
      error: error.message,
    });
  }
};

module.exports = {
  sendPaymentSuccessEmail,
};
