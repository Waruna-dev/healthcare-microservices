const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `CareSync <${process.env.FROM_EMAIL}>`,
      to: [options.email],
      subject: options.subject,
      html: options.html,
      text: options.message, 
    });

    // If Resend returns an error object, handle it here
    if (error) {
      console.error("Resend API Error:", error);
      throw new Error(error.message);
    }

    // Now 'data.id' will correctly exist!
    console.log(`Email sent via Resend. ID:`, data.id);
    
    return data; // Returns { id: "..." } back to your adminRoutes.js
  } catch (error) {
    console.error("Internal SendEmail Error:", error);
    throw new Error('Failed to send email via Resend');
  }
};

module.exports = sendEmail;