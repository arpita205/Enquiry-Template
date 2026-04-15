# Enquiry Template

A professional **Request for Quotation (RFQ) Email Automation** system built for **Xecurra Infinity LLP**. This project enables dynamic, template-based RFQ emails to be sent to vendors and logistics contacts via Microsoft Graph API (Outlook) or SMTP.

## 📁 Project Structure

```
Enquiry Template/
├── rfq-template.html          # HTML email template for RFQ
└── email-sender/
    ├── sendRFQ.js             # Main script to send RFQ emails
    ├── index.js               # Entry point
    ├── config/
    │   └── auth.js            # Microsoft Graph authentication config
    ├── services/
    │   ├── graphEmailService.js   # Microsoft Graph API email service
    │   └── smtpEmailService.js    # SMTP email service (fallback)
    └── utils/
        ├── logger.js          # Logging utility
        └── templateEngine.js  # HTML template variable injection
```

## 🚀 Features

- 📧 **Dynamic RFQ Emails** — Injects variables into HTML templates at runtime
- 🔐 **Microsoft Graph API** — Sends emails via authenticated Outlook integration
- 📋 **SMTP Fallback** — Alternate email delivery via SMTP
- 📝 **Structured Logging** — Tracks email dispatch status and errors
- 🎨 **Professional HTML Template** — Branded, Outlook-compatible RFQ email layout

## ⚙️ Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/arpita205/Enquiry-Template.git
   cd Enquiry-Template/email-sender
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Fill in your Microsoft Graph API credentials in .env
   ```

4. **Run the RFQ sender**
   ```bash
   node sendRFQ.js
   ```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in the following:

| Variable | Description |
|----------|-------------|
| `TENANT_ID` | Microsoft Azure Tenant ID |
| `CLIENT_ID` | Azure App Client ID |
| `CLIENT_SECRET` | Azure App Client Secret |
| `SENDER_EMAIL` | Outlook email address to send from |

## 🏢 About

Built for **Xecurra Infinity LLP** to streamline procurement and vendor communication workflows.

---

> **Note:** Keep your `.env` file private. Never commit credentials to version control.
