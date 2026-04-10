const axios = require("axios");

/**
 * Format and validate phone number for text.lk API
 * @param {string} phoneNumber - Phone number (with or without + or country code)
 * @returns {string} Formatted phone number for API (without + sign)
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters except leading +
  let formatted = phoneNumber.replace(/[\s\-()]/g, "");
  
  // Remove leading + if present
  if (formatted.startsWith("+")) {
    formatted = formatted.substring(1);
  }
  
  // If number doesn't start with country code, assume Sri Lanka (94)
  if (!formatted.startsWith("94") && formatted.length === 9) {
    formatted = "94" + formatted;
  } else if (!formatted.startsWith("94") && formatted.length === 10 && formatted.startsWith("0")) {
    // Handle numbers starting with 0 (remove 0 and add 94)
    formatted = "94" + formatted.substring(1);
  }
  
  // Validate Sri Lanka number format (44-10 digits total with 94 prefix)
  if (!/^94\d{9}$/.test(formatted)) {
    return null;
  }
  
  return formatted;
};

/**
 * Send SMS using text.lk API (OAuth 2.0)
 * @param {Object} options - SMS options
 * @param {string} options.phoneNumber - Recipient phone number (with or without country code)
 * @param {string} options.message - SMS message content
 * @param {string} options.senderId - Sender ID (defaults to TEXT_LK_SENDER_ID env or "careSynclk")
 * @returns {Promise<Object>} Response from text.lk API
 */
const sendSMS = async ({ phoneNumber, message, senderId }) => {
  try {
    if (!phoneNumber || !message) {
      throw new Error("Phone number and message are required");
    }

    const apiKey = process.env.TEXT_LK_API_KEY;
    if (!apiKey) {
      throw new Error("TEXT_LK_API_KEY is not configured");
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      throw new Error(`Invalid phone number format. Please use format like +94704832346 or 0704832346`);
    }

    // Use provided sender ID or fallback to env or default demo ID
    const senderIdToUse = senderId || process.env.TEXT_LK_SENDER_ID || "TextLKDemo";

    // text.lk API endpoint - OAuth 2.0
    const url = "https://app.text.lk/api/v3/sms/send";

    const payload = {
      recipient: formattedPhone,
      sender_id: senderIdToUse,
      type: "plain",
      message: message,
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log(`SMS sent successfully to ${formattedPhone}:`, response.data);

    return {
      success: true,
      messageId: response.data.data?.sms_id || response.data.sms_id,
      status: response.data.status,
      data: response.data,
    };
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    
    // Handle specific error types
    let errorMessage = error.message;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    return {
      success: false,
      error: errorMessage,
      statusCode: error.response?.status || 500,
    };
  }
};

/**
 * Send payment confirmation SMS
 * @param {Object} options - Payment details
 * @param {string} options.phoneNumber - Recipient phone number
 * @param {string} options.patientName - Patient name
 * @param {string} options.orderId - Order/Payment ID
 * @param {number} options.amount - Payment amount
 * @param {string} options.currency - Currency code
 * @returns {Promise<Object>} SMS send result
 */
const sendPaymentConfirmationSMS = async ({
  phoneNumber,
  patientName,
  orderId,
  amount,
  currency = "LKR",
}) => {
  const message = `Dear ${patientName}, Your payment of ${amount} ${currency} (Order #${orderId}) has been successfully confirmed. Thank you for choosing CareSync. For support, contact us anytime.`;

  return sendSMS({
    phoneNumber,
    message,
  });
};

/**
 * Send appointment confirmation SMS
 * @param {Object} options - Appointment details
 * @param {string} options.phoneNumber - Recipient phone number
 * @param {string} options.patientName - Patient name
 * @param {string} options.doctorName - Doctor name
 * @param {string} options.appointmentDate - Appointment date
 * @param {string} options.appointmentTime - Appointment time
 * @returns {Promise<Object>} SMS send result
 */
const sendAppointmentConfirmationSMS = async ({
  phoneNumber,
  patientName,
  doctorName,
  appointmentDate,
  appointmentTime,
}) => {
  const message = `Hi ${patientName}, Your appointment with Dr. ${doctorName} is confirmed for ${appointmentDate} at ${appointmentTime}. Please arrive 10 min early. Reply STOP to unsubscribe.`;

  return sendSMS({
    phoneNumber,
    message,
  });
};

module.exports = {
  sendSMS,
  sendPaymentConfirmationSMS,
  sendAppointmentConfirmationSMS,
  formatPhoneNumber,
};
