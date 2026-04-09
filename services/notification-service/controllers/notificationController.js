const sendEmail = require("../utils/sendEmail");
const { 
  buildPaymentSuccessEmail, 
  buildDoctorApprovalEmail, 
  buildDoctorRejectionEmail 
} = require("../utils/emailTemplates");

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

const sendDoctorApprovalEmail = async (req, res) => {
  try {
    const { email, name, tempPassword } = req.body;

    if (!email || !name || !tempPassword) {
      return res.status(400).json({ success: false, message: "email, name, and tempPassword are required" });
    }

    const { subject, html, text } = buildDoctorApprovalEmail({ name, tempPassword });
    const result = await sendEmail({ to: email, subject, html, text });

    return res.status(200).json({ success: true, message: "Approval email sent", emailId: result?.id });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send approval email", error: error.message });
  }
};

const sendDoctorRejectionEmail = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: "email and name are required" });
    }

    const { subject, html, text } = buildDoctorRejectionEmail({ name });
    const result = await sendEmail({ to: email, subject, html, text });

    return res.status(200).json({ success: true, message: "Rejection email sent", emailId: result?.id });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send rejection email", error: error.message });
  }
};

module.exports = {
  sendPaymentSuccessEmail,
  sendDoctorApprovalEmail,
  sendDoctorRejectionEmail
};
