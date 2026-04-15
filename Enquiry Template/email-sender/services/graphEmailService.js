'use strict';

require('dotenv').config();
const axios  = require('axios');
const { getAccessToken } = require('../config/auth');
const logger = require('../utils/logger');

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

/**
 * Send an HTML email using Microsoft Graph API (sendMail endpoint).
 *
 * Uses the Client Credentials (app-only) flow — no user interaction required.
 * The sending mailbox must have a Microsoft 365 licence and the app must have
 * the Mail.Send application permission granted + admin-consented in Azure.
 *
 * @param {Object}   options
 * @param {string[]} options.to          - Array of recipient email addresses
 * @param {string}   options.subject     - Email subject line
 * @param {string}   options.htmlBody    - Rendered HTML body (after placeholder injection)
 * @param {string[]} [options.cc]        - Optional CC recipients
 * @param {string[]} [options.bcc]       - Optional BCC recipients
 * @param {string}   [options.senderEmail] - Override sender (defaults to env SENDER_EMAIL)
 * @param {string}   [options.senderName]  - Override sender display name
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
async function sendEmailViaGraph(options = {}) {
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
    throw new Error('[graphEmail] "to" must be a non-empty array of email addresses.');
  }
  if (!subject || typeof subject !== 'string') {
    throw new Error('[graphEmail] "subject" must be a non-empty string.');
  }
  if (!htmlBody || typeof htmlBody !== 'string') {
    throw new Error('[graphEmail] "htmlBody" must be a non-empty string.');
  }
  if (!senderEmail) {
    throw new Error('[graphEmail] Sender email is required. Set SENDER_EMAIL in .env');
  }

  // ─── Build Graph API message payload ──────────────────────────────────────
  const toRecipients  = buildRecipientList(to);
  const ccRecipients  = buildRecipientList(cc);
  const bccRecipients = buildRecipientList(bcc);

  const message = {
    subject,
    importance: 'normal',
    body: {
      contentType: 'HTML',
      content:     htmlBody,
    },
    toRecipients,
    ...(ccRecipients.length  && { ccRecipients  }),
    ...(bccRecipients.length && { bccRecipients }),
    from: {
      emailAddress: {
        address: senderEmail,
        name:    senderName,
      },
    },
  };

  const payload = {
    message,
    saveToSentItems: true,   // mirror email in Sent folder
  };

  // ─── Acquire token & send ─────────────────────────────────────────────────
  logger.info(`[graphEmail] Sending "${subject}"`);
  logger.info(`[graphEmail]    TO:  ${to.join(', ')}`);
  if (ccRecipients.length)  logger.info(`[graphEmail]    CC:  ${cc.join(', ')}`);
  if (bccRecipients.length) logger.info(`[graphEmail]    BCC: ${bcc.join(', ')}`);
  logger.info(`[graphEmail]    CC recipients built: ${JSON.stringify(ccRecipients)}`);

  const accessToken = await getAccessToken();

  const url = `${GRAPH_ENDPOINT}/users/${encodeURIComponent(senderEmail)}/sendMail`;

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15_000,   // 15 second network timeout
  });

  // Graph returns 202 Accepted on success (no body)
  if (response.status === 202) {
    logger.info(`[graphEmail] ✅ Email delivered — TO: ${to.join(', ')}${ccRecipients.length ? ' | CC: ' + cc.join(', ') : ''}`);
    return { success: true };
  }

  throw new Error(`[graphEmail] Unexpected response status: ${response.status}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a mixed array of email strings / {email, name} objects
 * into the Graph API recipient format.
 *
 * @param {Array<string|{email:string,name?:string}>} list
 * @returns {Array<{emailAddress:{address:string,name?:string}}>}
 */
function buildRecipientList(list = []) {
  return list
    .filter(Boolean)
    .map((entry) => {
      if (typeof entry === 'string') {
        return { emailAddress: { address: entry } };
      }
      if (typeof entry === 'object' && entry.email) {
        return {
          emailAddress: {
            address: entry.email,
            ...(entry.name && { name: entry.name }),
          },
        };
      }
      throw new TypeError(`[graphEmail] Invalid recipient format: ${JSON.stringify(entry)}`);
    });
}

module.exports = { sendEmailViaGraph };
