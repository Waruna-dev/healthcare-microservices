# Resend Setup Guide

## Getting Started with Resend

Resend is a modern email service for developers. Follow these steps to integrate it with the message service:

### 1. Create Resend Account

- Visit [resend.com](https://resend.com)
- Sign up for a free account
- Verify your email address

### 2. Get API Key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `re_`)

### 3. Verify Your Domain (Optional but Recommended)

For production use:

1. Go to Domains in Resend dashboard
2. Add your domain
3. Follow DNS verification steps
4. This allows you to send from custom domains

For testing, you can use the default `onboarding@resend.dev` sender domain.

### 4. Configure Environment Variables

Update `.env` in `services/message-service/`:

```env
MESSAGE_SERVICE_PORT=5005

# Your Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# Email to send from (use your verified domain)
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Or for testing, use:
# RESEND_FROM_EMAIL=onboarding@resend.dev

DOCTOR_LOGIN_URL=http://localhost:3000/doctor/login
```

### 5. Install Dependencies

```bash
cd services/message-service
npm install
```

This automatically installs the `resend` package from your updated `package.json`.

### 6. Start the Service

```bash
npm run dev
```

You should see:

```
Message Service running on port 5005
```

## Testing the Email Service

### Test Doctor Approval Email

```bash
curl -X POST http://localhost:5005/api/email/doctor-approval \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "name": "Dr. John Doe",
    "tempPassword": "abc123"
  }'
```

### Test Doctor Rejection Email

```bash
curl -X POST http://localhost:5005/api/email/doctor-rejection \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "name": "Dr. Jane Smith",
    "reason": "Credentials verification pending"
  }'
```

### Health Check

```bash
curl http://localhost:5005/api/email/health
```

## Resend Features

- ✅ **Free Tier**: Send up to 100 emails per day
- ✅ **Reliable Delivery**: 99.9% uptime SLA
- ✅ **Rich Email Templates**: HTML and text support
- ✅ **Webhooks**: Track delivery and open events
- ✅ **API**: Simple REST API
- ✅ **React Email**: Optional component-based email builder

## Pricing

- **Free Tier**: 100 emails/day
- **Pro**: $20/month for 50,000 emails/month
- **Scale**: Custom pricing for higher volumes

See [resend.com/pricing](https://resend.com/pricing) for details.

## Troubleshooting

### "RESEND_API_KEY is not set"

- Ensure `.env` file exists with `RESEND_API_KEY`
- Restart the service after updating `.env`

### "Email failed to send"

- Check Resend dashboard for API limits
- Verify sender email is configured in Resend
- Check that recipient email is valid

### "Invalid API Key"

- Copy the key correctly from [resend.com/api-keys](https://resend.com/api-keys)
- API keys start with `re_`

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Node.js SDK Guide](https://resend.com/docs/send-with-nodejs)
- [Webhooks & Events](https://resend.com/docs/webhooks)
