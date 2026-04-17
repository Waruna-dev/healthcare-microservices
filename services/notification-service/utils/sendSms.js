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

    // Use requested sender first; fallback sender can be used for auto-retry if unauthorized.
    const senderIdToUse = senderId || process.env.TEXT_LK_SENDER_ID || "TextLKDemo";
    const fallbackSenderId = process.env.TEXT_LK_FALLBACK_SENDER_ID || "TextLKDemo";

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

    const apiStatus = `${response.data?.status || ""}`.toLowerCase();
    const isApiSuccess = apiStatus === "success" || apiStatus === "ok";

    if (!isApiSuccess) {
      const apiMessage =
        response.data?.message || "SMS provider rejected the request";
      const isUnauthorizedSender =
        /sender id/i.test(apiMessage) && /not authorized/i.test(apiMessage);

      // Auto-retry once with fallback sender when configured sender is unauthorized.
      if (
        isUnauthorizedSender &&
        fallbackSenderId &&
        fallbackSenderId !== senderIdToUse
      ) {
        console.warn(
          `Sender "${senderIdToUse}" unauthorized. Retrying with fallback sender "${fallbackSenderId}".`,
        );

        const retryPayload = {
          ...payload,
          sender_id: fallbackSenderId,
        };

        const retryResponse = await axios.post(url, retryPayload, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });

        const retryStatus = `${retryResponse.data?.status || ""}`.toLowerCase();
        const retrySuccess = retryStatus === "success" || retryStatus === "ok";

        if (retrySuccess) {
          console.log(
            `SMS sent successfully to ${formattedPhone} with fallback sender "${fallbackSenderId}":`,
            retryResponse.data,
          );
          return {
            success: true,
            messageId: retryResponse.data.data?.sms_id || retryResponse.data.sms_id,
            status: retryResponse.data.status,
            data: retryResponse.data,
            senderIdUsed: fallbackSenderId,
            fallbackUsed: true,
          };
        }

        const retryMessage =
          retryResponse.data?.message || "Fallback sender attempt failed";
        console.error(
          `Fallback sender "${fallbackSenderId}" also failed for ${formattedPhone}:`,
          retryResponse.data,
        );
        return {
          success: false,
          error: retryMessage,
          statusCode: retryResponse.status || 500,
          data: retryResponse.data,
        };
      }

      console.error(`SMS provider returned error for ${formattedPhone}:`, response.data);
      return {
        success: false,
        error: apiMessage,
        statusCode: response.status || 500,
        data: response.data,
      };
    }

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
 *
 * Template sample:
 * CareSync: Hi Kasun,
 * Your payment of LKR 7,500 was successful.
 *
 * Doctor: Dr. Malithi Jayawardenaa
 * Date: 15 April 2026
 * Time: 09:30 AM
 *
 * Ref: CS12345
 */
const sendPaymentConfirmationSMS = async ({
  phoneNumber,
  patientName,
  orderId,
  amount,
  currency = "LKR",
  doctorName,
  appointmentDate,
  appointmentTime,
  referenceId,
}) => {
  const numericAmount = Number(amount || 0);
  const formattedAmount = new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: Number.isInteger(numericAmount) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(numericAmount) ? 0 : 2,
  }).format(numericAmount);

  const safeDoctorName = `${doctorName || "CareSync Doctor"}`
    .replace(/^dr\.?\s*/i, "")
    .trim();

  const formattedDate = appointmentDate
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(appointmentDate))
    : "TBD";

  const formattedTime = (() => {
    if (!appointmentTime) return "TBD";
    const [hours, minutes] = `${appointmentTime}`.split(":");
    if (hours === undefined || minutes === undefined) return appointmentTime;

    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  })();

  const ref = referenceId || orderId || "N/A";

  const message = `CareSync: Hi ${patientName},
Your payment of ${currency} ${formattedAmount} was successful.

Doctor: Dr. ${safeDoctorName}
Date: ${formattedDate}
Time: ${formattedTime}

Ref: ${ref}`;

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
 *
 * Template sample:
 * Hi Kasun, Your appointment with Dr. Malithi Jayawardenaa
 * is confirmed for 15 April 2026 at 09:30 AM.
 * Please arrive 10 min early. Reply STOP to unsubscribe.
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
