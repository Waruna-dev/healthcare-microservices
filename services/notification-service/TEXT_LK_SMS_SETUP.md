# text.lk SMS Integration - Payment Confirmation Setup Guide

## Overview
This guide explains how to integrate text.lk API for sending SMS payment confirmations in the healthcare microservices system.

## Features Implemented

### 1. SMS Notification Module
- **Location**: `services/notification-service/utils/sendSMS.js`
- **Functions**:
  - `sendSMS()` - Generic SMS sending function
  - `sendPaymentConfirmationSMS()` - Payment confirmation SMS
  - `sendAppointmentConfirmationSMS()` - Appointment confirmation SMS

### 2. Notification Service Endpoints
New SMS endpoints added to the notification service:

#### Payment Confirmation SMS
```
POST /api/notifications/payment-confirmation-sms
```
**Request Body**:
```json
{
  "phoneNumber": "+94771234567",
  "patientName": "John Doe",
  "orderId": "ORD-1234",
  "amount": 5000,
  "currency": "LKR"
}
```

#### Appointment Confirmation SMS
```
POST /api/notifications/appointment-confirmation-sms
```
**Request Body**:
```json
{
  "phoneNumber": "+94771234567",
  "patientName": "John Doe",
  "doctorName": "Dr. Smith",
  "appointmentDate": "2026-12-15",
  "appointmentTime": "10:30 AM"
}
```

### 3. Payment Service Integration
- Payment model updated to include:
  - `customerPhoneNumber` - Customer phone number for SMS
  - `successSMSSentAt` - Track when SMS was sent

- Payment controller updated:
  - `triggerPaymentSuccessSMS()` - New function to send SMS confirmations
  - Integrated SMS sending in the webhook handler for payment success

## Setup Instructions

### Step 1: Get text.lk API Credentials
1. Go to [text.lk](https://text.lk/) website
2. Sign up or log in to your account
3. Navigate to API settings
4. Copy your API key

### Step 2: Update Environment Variables

#### Notification Service (.env)
```env
PORT=5035
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=notifications@caresynclk.me
TEXT_LK_API_KEY=your_text_lk_api_key_from_step_1
TEXT_LK_SENDER_ID=CareSync
```

#### Payment Service (.env)
- No new environment variables needed (uses notification service URL)

### Step 3: Install Dependencies
```bash
# Navigate to notification service
cd services/notification-service

# Install packages including axios if not already installed
npm install
# or
npm install axios
```

### Step 4: Start Services
```bash
# Terminal 1 - Start notification service
cd services/notification-service
npm start

# Terminal 2 - Start payment service
cd services/payment-service
npm start
```

## Integration Flow

### Payment Confirmation SMS Flow
1. User completes payment via Stripe
2. Stripe webhook triggers `checkout.session.completed`
3. Payment status updates to SUCCESS
4. System sends payment success email (existing)
5. **[NEW]** System sends SMS confirmation with:
   - Payment amount
   - Order ID
   - Patient name
   - Currency

### API Request Format

When creating a payment/appointment, include the phone number:

```javascript
// From frontend/appointment booking
const paymentPayload = {
  orderId: "ORD-123",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  phoneNumber: "+94771234567",  // NEW: Include phone number
  amount: 5000,
  currency: "lkr",
  appointmentId: "APT-456",
  doctorName: "Dr. Smith",
  appointmentDate: "2026-12-15",
  appointmentTime: "10:30 AM"
};
```

## Error Handling

If SMS sending fails:
- Error is logged but doesn't block payment processing
- User still receives email confirmation
- `successSMSSentAt` field remains null if SMS fails
- Payment status is still marked as SUCCESS

## Monitoring

### Check SMS Sending Status
You can check if SMS was sent by querying the payment:
```javascript
GET /api/payments/{orderId}
// Response includes successSMSSentAt field
```

### Debug Logs
Monitor your logs for SMS activity:
```
SMS sent successfully to +94771234567: { messageId: "...", status: "sent" }
Failed to send SMS: Error message details
```

## SMS Message Templates

### Payment Confirmation
```
Dear {patientName}, Your payment of {amount} {currency} (Order #{orderId}) has been successfully confirmed. Thank you for choosing CareSync. For support, contact us anytime.
```

### Appointment Confirmation
```
Hi {patientName}, Your appointment with Dr. {doctorName} is confirmed for {appointmentDate} at {appointmentTime}. Please arrive 10 min early. Reply STOP to unsubscribe.
```

## Troubleshooting

### SMS Not Sending

**Issue**: `TEXT_LK_API_KEY is not configured`
- **Solution**: Ensure TEXT_LK_API_KEY is set in notification service .env file

**Issue**: `Failed to send SMS: timeout`
- **Solution**: Check text.lk API endpoint availability
- **Solution**: Verify internet connectivity and firewall rules

**Issue**: `statusCode: 401`
- **Solution**: Verify your text.lk API key is correct
- **Solution**: Check if API key has expired on text.lk dashboard

**Issue**: `statusCode: 400`
- **Solution**: Validate phone number format
- **Solution**: Ensure phone number includes country code (e.g., +94 for Sri Lanka)

### Testing SMS

Use Postman or cURL to test:
```bash
curl -X POST http://localhost:5035/api/notifications/payment-confirmation-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+94771234567",
    "patientName": "Test User",
    "orderId": "TEST-001",
    "amount": 1000,
    "currency": "LKR"
  }'
```

## Database Migration

If running with existing data, the new fields are optional:
- `customerPhoneNumber` - defaults to empty string
- `successSMSSentAt` - defaults to null

No migration script needed.

## API Documentation

### Complete Payment Creation with SMS
```bash
POST /api/payments/checkout

{
  "orderId": "ORD-12345",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "phoneNumber": "+94771234567",
  "amount": 5000,
  "currency": "lkr",
  "appointmentId": "APT-789",
  "doctorName": "Dr. Johnson",
  "appointmentDate": "2026-12-20",
  "appointmentTime": "14:00"
}
```

## Support

For text.lk API support, visit: https://text.lk/
For issues in this implementation, check service logs and error messages.
