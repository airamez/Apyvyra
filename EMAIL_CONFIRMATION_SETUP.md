# Email Confirmation System Setup Guide

This guide explains how to set up and configure the professional email confirmation system for Apyvyra registration.

## Overview

The email confirmation system ensures that users verify their email addresses before being able to log in, following security best practices and providing excellent user experience.

## Features

- **Email Verification**: Users must confirm their email before account activation
- **Professional Email Templates**: Beautiful, responsive HTML email templates
- **Token Security**: Secure confirmation tokens with 24-hour expiry
- **Resend Functionality**: Users can request new confirmation emails
- **User-Friendly Messages**: Clear instructions and feedback throughout the process
- **Security Best Practices**: Prevents enumeration attacks and follows industry standards

## Database Changes

The `app_user` table has been updated with the following fields:

```sql
status INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)),
confirmation_token VARCHAR(255),
confirmation_token_expires_at TIMESTAMPTZ,
email_confirmed_at TIMESTAMPTZ
```

**Status Values:**
- `0`: pending_confirmation (default for new users)
- `1`: active (confirmed users can log in)
- `2`: inactive (deactivated accounts)

## Email Configuration

### 1. Update appsettings.json

Configure your SMTP settings in `backend/appsettings.json`:

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com",
    "FromName": "Apyvyra",
    "EnableSsl": true
  },
  "BaseUrl": "http://localhost:5000"
}
```

### 2. Gmail Setup (if using Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Apyvyra"
   - Use this app password in the configuration (NOT your regular password)

### 3. Other Email Providers

For other email providers, update the SMTP settings accordingly:

**Outlook/Hotmail:**
```json
{
  "SmtpServer": "smtp-mail.outlook.com",
  "SmtpPort": 587
}
```

**SendGrid:**
```json
{
  "SmtpServer": "smtp.sendgrid.net",
  "SmtpPort": 587,
  "Username": "apikey",
  "Password": "your-sendgrid-api-key"
}
```

## Database Migration

### Option 1: Run the Updated Database Schema
```bash
psql -U apyvyra -d apyvyra -f database.sql
```

### Option 2: Regenerate Models from Database (Recommended)
After updating the database schema, regenerate the Entity Framework models:

```bash
# Install EF tools (if not already installed)
dotnet tool install --global dotnet-ef

# Scaffold models from database
cd backend
dotnet ef dbcontext scaffold "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra" Npgsql.EntityFrameworkCore.PostgreSQL -o Models -f
```

This will regenerate all model classes with the correct column mappings, including the new email confirmation fields.

## Email Templates

Professional email templates are located in the `email-templates/` folder:

- `confirmation.html`: Initial registration confirmation email
- `resend-confirmation.html`: Resend confirmation email template

### Customizing Templates

You can customize the templates by editing the HTML files. The following placeholders are available:

- `{{user_name}}`: User's email address (or name if available)
- `{{confirmation_url}}`: The unique confirmation link

## API Endpoints

### New Endpoints Added

1. **POST** `/api/app_user/resend-confirmation`
   - Resend confirmation email
   - Request body: `{ "email": "user@example.com" }`

2. **GET** `/api/app_user/confirm?token={token}`
   - Confirm email address
   - Can be accessed directly via email link

### Updated Endpoints

1. **POST** `/api/app_user` (Register)
   - Now creates users with `status = 0` (pending_confirmation)
   - Sends confirmation email automatically
   - Returns updated success message

2. **POST** `/api/app_user/login` (Login)
   - Checks user status before allowing login
   - Returns appropriate error for unconfirmed emails

## Frontend Changes

### Registration Flow
- Users see updated success message after registration
- Clear instructions about email confirmation
- Guidance to check spam folder

### Login Flow
- Detects pending confirmation status
- Shows dialog with resend email option
- Professional error messages and user guidance

## Security Features

### Token Security
- UUID-based confirmation tokens
- 24-hour token expiry
- Tokens are cleared after successful confirmation

### Anti-Enumeration
- Resend endpoint doesn't reveal if email exists
- Consistent responses for security

### Rate Limiting (Recommended)
Consider implementing rate limiting for:
- Registration attempts per IP
- Resend confirmation requests
- Login attempts

## Testing the System

### 1. Test Registration
```bash
curl -X POST http://localhost:5000/api/app_user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 2. Test Login (Should Fail)
```bash
curl -X POST http://localhost:5000/api/app_user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 3. Test Confirmation
Visit the confirmation link from your email or:
```bash
curl "http://localhost:5000/api/app_user/confirm?token=YOUR_TOKEN"
```

### 4. Test Resend
```bash
curl -X POST http://localhost:5000/api/app_user/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Production Considerations

### 1. Environment Variables
For production, use environment variables instead of hardcoded values:

```bash
export EmailSettings__SmtpServer="smtp.gmail.com"
export EmailSettings__Username="your-email@gmail.com"
export EmailSettings__Password="your-app-password"
export BaseUrl="https://yourdomain.com"
```

### 2. Email Service Providers
For production, consider using dedicated email services:
- **SendGrid**: Reliable delivery, analytics
- **Mailgun**: Developer-friendly API
- **AWS SES**: Cost-effective for high volume

### 3. Monitoring
Monitor email delivery rates and failures:
- Log email send attempts
- Track confirmation rates
- Monitor bounce rates

### 4. Security
- Use HTTPS in production
- Implement CSRF protection
- Consider adding CAPTCHA to registration
- Monitor for abuse patterns

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP credentials
   - Verify app password (for Gmail)
   - Check firewall/SMTP port access

2. **Confirmation links not working**
   - Verify `BaseUrl` configuration
   - Check token format in database
   - Ensure tokens haven't expired

3. **Users not receiving emails**
   - Check spam folders
   - Verify sender reputation
   - Check email bounce logs

### Debug Mode

Enable detailed logging in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Debug"
    }
  }
}
```

## Support

For issues with the email confirmation system:

1. Check application logs for detailed error messages
2. Verify SMTP configuration with a test email client
3. Ensure database schema is properly updated
4. Check email provider's delivery status and reputation

This system provides a professional, secure, and user-friendly email confirmation process that follows industry best practices for security and usability.
