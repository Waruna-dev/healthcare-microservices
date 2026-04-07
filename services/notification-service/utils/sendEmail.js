const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const fromEmail = process.env.FROM_EMAIL || "no-reply@caresynclk.me";

  const { data, error } = await resend.emails.send({
    from: `CareSync <${fromEmail}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email via Resend");
  }

  return data;
};

module.exports = sendEmail;
