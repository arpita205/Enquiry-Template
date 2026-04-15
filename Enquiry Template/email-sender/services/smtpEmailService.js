'use strict';

require('dotenv').config();
const nodemailer = require('nodemailer');
const logger     = require('../utils/logger');

/**
 * Send an HTML email via Office 365 SMTP (STARTTLS on port 587).
 *
 * Use this approach when:
 *   • You don't have access to Microsoft Graph API / Azure AD
 *   • You are using basic SMTP authentication (app password / OAuth2 SMTP)
 *
 * Office 365 SMTP settings:
 *   Host: smtp.office365.com
 *   Port: 587
 *   Security: STARTTLS (tls upgrade after connect)
 *
 * NOTE: Microsoft is deprecating basic auth for SMTP on M365.
 * Prefer Graph API for new implementations. If you must use SMTP, enable
 * "Authenticated SMTP" under the mailbox settings in the M365 Admin Center.
 *
 * @param {Object}   options
 * @param {string[]} options.to          - Array of recipient email addresses
 * @param {string}   options.subject     - Email subject line
 * @param {string}   options.htmlBody    - Rendered HTML body
 * @param {string[]} [options.cc]        - Optional CC recipients
 * @param {string[]} [options.bcc]       - Optional BCC recipients
 * @param {string}   [options.senderEmail]
 * @param {string}   [options.senderName]
 *
 * @returns {Promise<{ success: boolean, messageId: string }>}
 */
async function sendEmailViaSMTP(options = {}) {
  const {
    to,
    subject,
    htmlBody,
    cc  = [],
    bcc = [],
    senderEmail = process.env.SENDER_EMAIL,
    senderName  = process.env.SENDER_NAME || senderEmail,
  } = options;

  // ─── Input Validation ──────────────────────────────────────────────────────
  if (!to || !Array.isArray(to) || to.length === 0) {
    throw new Error('[smtpEmail] "to" must be a non-empty array of email addresses.');
  }
  if (!subject || typeof subject !== 'string') {
    throw new Error('[smtpEmail] "subject" must be a non-empty string.');
  }
  if (!htmlBody || typeof htmlBody !== 'string') {
    throw new Error('[smtpEmail] "htmlBody" must be a non-empty string.');
  }

  // ─── Create transporter ────────────────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.office365.com',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',  // false = STARTTLS on 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: true,
    },
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
    socketTimeout:     15_000,
  });

  // ─── Build mail options ───────────────────────────────────────────────────
  const mailOptions = {
    from:    `"${senderName}" <${senderEmail}>`,
    to:      normaliseAddresses(to),
    subject,
    html:    htmlBody,
    ...(cc.length  && { cc:  normaliseAddresses(cc)  }),
    ...(bcc.length && { bcc: normaliseAddresses(bcc) }),
    headers: {
      'X-Mailer': 'Xecurra-RFQ-Sender/1.0',
    },
  };

  logger.info(`[smtpEmail] Sending "${subject}" → ${to.join(', ')}`);

  const info = await transporter.sendMail(mailOptions);

  logger.info(`[smtpEmail] ✅ Email sent. Message-ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}

/**
 * Normalise recipient list to a comma-separated string for nodemailer.
 * Accepts: string[], or {email, name}[]
 *
 * @param {Array<string|{email:string,name?:string}>} list
 * @returns {string}
 */
function normaliseAddresses(list = []) {
  return list
    .filter(Boolean)
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (typeof entry === 'object' && entry.email) {
        return entry.name ? `"${entry.name}" <${entry.email}>` : entry.email;
      }
      throw new TypeError(`[smtpEmail] Invalid recipient: ${JSON.stringify(entry)}`);
    })
    .join(', ');
}

module.exports = { sendEmailViaSMTP };
