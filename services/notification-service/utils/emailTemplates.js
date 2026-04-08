const formatAmount = (amount, currency = "LKR") => {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) {
    return `${amount} ${currency}`;
  }

  return `${parsed.toFixed(2)} ${currency}`;
};

const buildPaymentSuccessEmail = ({
  patientName,
  orderId,
  amount,
  currency,
  appointmentDate,
  appointmentTime,
}) => {
  const safeName = patientName || "Patient";
  const paidAmount = formatAmount(amount, currency);

  const subject = "Payment Successful - CareSync";

  const text = [
    `Hello ${safeName},`,
    "",
    "Your payment was successful.",
    `Order ID: ${orderId}`,
    `Amount: ${paidAmount}`,
    appointmentDate ? `Appointment Date: ${appointmentDate}` : null,
    appointmentTime ? `Appointment Time: ${appointmentTime}` : null,
    "",
    "Thank you for choosing CareSync.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto;">
      <h2 style="margin-bottom: 8px; color: #0f766e;">Payment Successful</h2>
      <p>Hello ${safeName},</p>
      <p>Your payment has been received successfully.</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:16px;">
        <p style="margin:0 0 8px;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin:0 0 8px;"><strong>Amount:</strong> ${paidAmount}</p>
        ${appointmentDate ? `<p style="margin:0 0 8px;"><strong>Appointment Date:</strong> ${appointmentDate}</p>` : ""}
        ${appointmentTime ? `<p style="margin:0;"><strong>Appointment Time:</strong> ${appointmentTime}</p>` : ""}
      </div>
      <p style="margin-top:16px;">Thank you for choosing CareSync.</p>
      <p style="margin-top:24px; font-size: 12px; color: #6b7280;">This is an automated email from caresynclk.me</p>
    </div>
  `;

  return { subject, html, text };
};

// --- DOCTOR APPROVAL EMAIL ---
const buildDoctorApprovalEmail = ({ name, tempPassword }) => {
  const safeName = name || "Doctor";
  const subject = "CareSync: Your Account is Approved!";
  
  const text = `Welcome Dr. ${safeName}!\n\nYour account is approved. Your temporary password is: ${tempPassword}\n\nPlease log in to access your dashboard.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; color: #374151;">
      <h1 style="text-align: center; color: #111827; margin-bottom: 30px; font-size: 28px;">CareSync</h1>
      <p style="font-size: 16px; color: #4b5563;">Hello Dr. ${safeName},</p>
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
        We are pleased to inform you that your medical registration has been verified and approved. You are now a certified member of the CareSync network.
      </p>
      <div style="background-color: #f3f4f6; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
        <p style="font-size: 12px; font-weight: bold; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">Your Temporary Password</p>
        <p style="font-size: 28px; font-weight: bold; color: #111827; margin: 0; font-family: monospace; letter-spacing: 2px;">${tempPassword}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5173/login" style="background-color: #5454e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">Access Dashboard</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 40px 0 20px 0;" />
      <div style="text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
        <p>© 2026 CARESYNC. QUALITY CARE BY DESIGN.</p>
      </div>
    </div>
  `;

  return { subject, html, text };
};

// --- DOCTOR REJECTION EMAIL ---
const buildDoctorRejectionEmail = ({ name }) => {
  const safeName = name || "Doctor";
  const subject = "CareSync: Application Update";

  const text = `Dear Dr. ${safeName},\n\nWe regret to inform you that your application to join CareSync has been declined. Your data has been removed from our systems.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; color: #374151;">
      <h1 style="text-align: center; color: #111827; margin-bottom: 30px; font-size: 28px;">CareSync</h1>
      <p style="font-size: 16px; color: #4b5563;">Hello Dr. ${safeName},</p>
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
        Thank you for your interest in joining the CareSync network. After careful review of your application and credentials by our administration team, we regret to inform you that we are unable to approve your registration at this time.
      </p>
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
        To protect your privacy, any personal data, documents, and information submitted during your registration process has been <strong>permanently deleted</strong> from our systems.
      </p>
      <div style="background-color: #f3f4f6; border-left: 4px solid #5454e5; padding: 24px; border-radius: 0 8px 8px 0; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #111827; font-size: 16px;">We invite you to reapply</h3>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 20px;">
          If you have updated credentials, obtained a new medical license, or believe your application was rejected in error, you are welcome to submit a new application.
        </p>
        <a href="http://localhost:5173/doctor/register" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Submit New Application</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 40px 0 20px 0;" />
      <div style="text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
        <p>© 2026 CARESYNC. QUALITY CARE BY DESIGN.</p>
      </div>
    </div>
  `;

  return { subject, html, text };
};

module.exports = {
  buildPaymentSuccessEmail,
  buildDoctorApprovalEmail,
  buildDoctorRejectionEmail
};
