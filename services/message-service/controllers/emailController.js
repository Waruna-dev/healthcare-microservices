const { getResendClient } = require("../utils/emailConfig");

/**
 * Send doctor approval email
 * @param {Object} emailData - { email, name, tempPassword }
 */
const sendDoctorApprovalEmail = async (emailData) => {
  const { email, name, tempPassword } = emailData;

  if (!email || !name || !tempPassword) {
    throw new Error("Missing required fields: email, name, tempPassword");
  }

  const resend = getResendClient();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="color: #4F46E5;">CareSync Network</h2>
      <p>Welcome <strong>Dr. ${name}</strong>!</p>
      <p>Your medical registration has been verified and approved by our administration team. You can now access the CareSync platform.</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>Your Temporary Password:</strong></p>
        <h3 style="margin: 5px 0 0 0; color: #111827; letter-spacing: 2px;">${tempPassword}</h3>
      </div>
      <p style="color: #ef4444; font-size: 12px;"><strong>Important:</strong> You will be required to change this password immediately upon your first login.</p>
      <a href="${process.env.DOCTOR_LOGIN_URL || "http://localhost:3000/doctor/login"}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Go to Login</a>
      <p style="margin-top: 30px; color: #6B7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        This is an automated message. Please do not reply to this email. If you have any questions, contact our support team.
      </p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "CareSync: Your Account is Approved!",
      html: htmlContent,
    });

    console.log(`Doctor approval email sent to ${email}:`, data.id);
    return {
      success: true,
      messageId: data.id,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("Error sending doctor approval email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send doctor rejection email
 * @param {Object} emailData - { email, name, reason }
 */
const sendDoctorRejectionEmail = async (emailData) => {
  const { email, name, reason } = emailData;

  if (!email || !name) {
    throw new Error("Missing required fields: email, name");
  }

  const resend = getResendClient();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="color: #4F46E5;">CareSync Network</h2>
      <p>Dear <strong>Dr. ${name}</strong>,</p>
      <p>Thank you for your interest in joining the CareSync platform. After careful review of your registration, we regret to inform you that your application has not been approved at this time.</p>
      ${
        reason
          ? `<div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <p style="margin: 0; font-size: 14px;"><strong>Feedback:</strong></p>
        <p style="margin: 5px 0 0 0;">${reason}</p>
      </div>`
          : ""
      }
      <p>We encourage you to review your information and reapply in the future. If you have any questions or need further assistance, please contact our support team.</p>
      <p style="margin-top: 30px; color: #6B7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "CareSync Registration Update",
      html: htmlContent,
    });

    console.log(`Doctor rejection email sent to ${email}:`, data.id);
    return {
      success: true,
      messageId: data.id,
      message: "Rejection email sent successfully",
    };
  } catch (error) {
    console.error("Error sending doctor rejection email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  sendDoctorApprovalEmail,
  sendDoctorRejectionEmail,
};
