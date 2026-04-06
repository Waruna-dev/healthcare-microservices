# Doctor Approval Email Logic - Centralization Summary

## Overview

The doctor approval email logic has been successfully centralized from `admin-service` to a new dedicated `message-service`. This follows the microservices architecture pattern and makes email handling more maintainable and reusable.

## Changes Made

### 1. Created New Message Service (`services/message-service/`)

**Structure:**

```
message-service/
├── server.js                    # Main Express server
├── package.json                 # Dependencies
├── README.md                    # Service documentation
├── .env.example                 # Environment template
├── controllers/
│   └── emailController.js       # Email sending logic
├── routes/
│   └── emailRoutes.js          # Email API endpoints
└── utils/
    └── emailConfig.js          # Nodemailer configuration
```

**Key Features:**

- Centralized email templates
- Separated concerns (email logic in dedicated service)
- Easy to extend with more email types
- Reusable across all microservices

### 2. Updated Admin Service (`services/admin-service/routes/adminRoutes.js`)

**Changes:**

- Removed inline email sending logic from `/doctors/:id/approve` endpoint
- Removed `sendEmail` import (no longer used)
- Added axios call to message-service endpoint
- Kept password generation and doctor status update logic in admin-service

**Before:**

```javascript
// Email sent directly using sendEmail utility
await sendEmail({
  email: email,
  subject: "CareSync: Your Account is Approved!",
  message: `Welcome Dr. ${name}! ...`,
  html: `<html>...</html>`,
});
```

**After:**

```javascript
// Email sent via Message Service
await axios.post(
  `${process.env.MESSAGE_SERVICE_URL}/api/email/doctor-approval`,
  {
    email,
    name,
    tempPassword,
  },
);
```

## API Endpoints

### Message Service - Email Endpoints

#### 1. Doctor Approval Email

- **Endpoint:** `POST /api/email/doctor-approval`
- **Body:** `{ email, name, tempPassword }`
- **Used By:** Admin Service after doctor approval
- **Response:** Sends formatted approval email with login link

#### 2. Doctor Rejection Email

- **Endpoint:** `POST /api/email/doctor-rejection`
- **Body:** `{ email, name, reason? }`
- **Used By:** Can be called when rejecting doctor applications
- **Response:** Sends rejection notification email

## Setup Instructions

### 1. Install Dependencies

```bash
cd services/message-service
npm install
```

### 2. Configure Environment Variables

Create `.env` file in message-service:

```
MESSAGE_SERVICE_PORT=5005
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
DOCTOR_LOGIN_URL=http://localhost:3000/doctor/login
```

### 3. Update Admin Service Environment

Add to admin-service `.env`:

```
MESSAGE_SERVICE_URL=http://localhost:5005
```

### 4. Start Services

```bash
# Terminal 1: Message Service
cd services/message-service
npm run dev

# Terminal 2: Admin Service (already running)
cd services/admin-service
npm run dev
```

## Benefits of Centralization

1. **Single Responsibility**: Email logic in dedicated service
2. **Reusability**: Other services can send emails without duplication
3. **Maintainability**: Email templates in one place
4. **Scalability**: Easy to add new email types
5. **Testing**: Easier to mock email service in tests
6. **Configuration**: Centralized email configuration

## Future Enhancements

Consider adding:

- Email templating engine (EJS, Handlebars)
- Email queue/scheduling (Bull, RabbitMQ)
- Email analytics/logging
- SMS notifications
- Push notifications
- Doctor rejection notifications (already code ready)
- Appointment reminders
- Patient registration confirmations

## Error Handling

The admin-service gracefully handles email failures:

```javascript
try {
  await axios.post(`${process.env.MESSAGE_SERVICE_URL}/api/email/doctor-approval`, ...);
} catch (emailError) {
  console.error("Message Service email sending failed:", emailError.message);
  return res.status(200).json({
    success: true,
    message: 'Doctor approved, but failed to send the notification email.',
    tempPasswordForAdminToShare: tempPassword
  });
}
```

Even if email sending fails, the doctor is still approved and the admin gets the password to share manually.
