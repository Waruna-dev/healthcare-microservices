// Email configuration using Resend
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return resend;
};

module.exports = { getResendClient };
