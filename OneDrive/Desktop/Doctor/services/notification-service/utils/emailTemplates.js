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

module.exports = {
  buildPaymentSuccessEmail,
};
