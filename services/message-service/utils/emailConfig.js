// Email configuration using Resend
const { Resend } = require("resend");

let resendClient;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const getSenderEmail = () => {
  const senderEmail = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL;

  if (!senderEmail) {
    throw new Error(
      "Sender email is not configured. Set RESEND_FROM_EMAIL or FROM_EMAIL.",
    );
  }

  return senderEmail;
};

module.exports = { getResendClient, getSenderEmail };
