const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const data = await resend.emails.send({
      from: `CareSync Admin <${process.env.FROM_EMAIL}>`,
      to: [options.email],
      subject: options.subject,
      html: options.html,
      // Resend allows plain text fallback
      text: options.message, 
    });

    console.log(`Email sent via Resend:`, data.id);
    return data;
  } catch (error) {
    console.error("Resend Error:", error);
    throw new Error('Failed to send email via Resend');
  }
};

module.exports = sendEmail;