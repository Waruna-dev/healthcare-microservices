# Message Service - Centralized Email & Messaging Service

This service handles all email and messaging operations for the healthcare microservices platform.

## Features

- **Doctor Approval Emails**: Send approval emails with temporary passwords to approved doctors
- **Doctor Rejection Emails**: Send rejection notifications to doctors
- **Centralized Email Logic**: All email templates and sending logic in one place
- **Easy to Extend**: Add more email types as needed

## API Endpoints

### 1. Send Doctor Approval Email

**POST** `/api/email/doctor-approval`

Request body:

```json
{
  "email": "doctor@example.com",
  "name": "Dr. John Doe",
  "tempPassword": "abc123"
}
```

Response:

```json
{
  "success": true,
  "message": "Doctor approval email sent successfully",
  "data": {
    "success": true,
    "messageId": "message-id",
    "message": "Email sent successfully"
  }
}
```

### 2. Send Doctor Rejection Email

**POST** `/api/email/doctor-rejection`

Request body:

```json
{
  "email": "doctor@example.com",
  "name": "Dr. John Doe",
  "reason": "Optional rejection reason"
}
```

Response:

```json
{
  "success": true,
  "message": "Doctor rejection email sent successfully",
  "data": {
    "success": true,
    "messageId": "message-id",
    "message": "Rejection email sent successfully"
  }
}
```

### 3. Health Check

**GET** `/api/email/health`

Response:

```json
{
  "success": true,
  "message": "Email service is operational"
}
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file with Resend configuration:

```
MESSAGE_SERVICE_PORT=5007
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@yourdomain.com
DOCTOR_LOGIN_URL=http://localhost:3000/doctor/login
```

3. Start the service:

```bash
npm run dev
```

## Environment Variables

- `MESSAGE_SERVICE_PORT`: Port on which the service runs (default: 5007)
- `RESEND_API_KEY`: Your Resend API key (get from [resend.com](https://resend.com))
- `RESEND_FROM_EMAIL`: Email address to send from (must be verified in Resend)
- `DOCTOR_LOGIN_URL`: URL for doctor login (used in email template)

## Integration

To integrate with other services, call the endpoints via HTTP requests. Example:

```javascript
const response = await axios.post(
  `${process.env.MESSAGE_SERVICE_URL}/api/email/doctor-approval`,
  {
    email: doctor.email,
    name: doctor.name,
    tempPassword: generatedPassword,
  },
);
```

## Notes

- Get your Resend API key at [resend.com](https://resend.com)
- Verify your sender email domain in Resend dashboard before sending emails
- All emails are sent as HTML formatted emails
- The service includes proper error handling and logging
- Email templates can be customized in `controllers/emailController.js`
