'use strict';

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const { injectVariables }    = require('./utils/templateEngine');
const { sendEmailViaGraph }  = require('./services/graphEmailService');
const { sendEmailViaSMTP }   = require('./services/smtpEmailService');
const logger                 = require('./utils/logger');

// ─── Path to the HTML template ────────────────────────────────────────────────
const TEMPLATE_PATH = path.join(__dirname, '..', 'rfq-template.html');

// ─── Choose sending method from env ──────────────────────────────────────────
const EMAIL_METHOD = (process.env.EMAIL_METHOD || 'graph').toLowerCase();

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              sendOutlookEmail()                          ║
 * ║  Universal email sender for Xecurra RFQ emails          ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Loads the HTML template, injects dynamic variables, and sends
 * via Microsoft Graph API or Office 365 SMTP.
 *
 * @param {Object}   params
 * @param {string[]} params.to           - Recipient email addresses (required)
 * @param {string}   params.subject      - Email subject line (required)
 * @param {Object}   params.variables    - Template placeholder values (required)
 *   Keys must match {{PLACEHOLDER_NAME}} tokens in the HTML template.
 *   Common keys:
 *     RFQ_NUMBER, RFQ_DATE,
 *     SHIPMENT_REF, SERVICE_TYPE, IMPORT_EXPORT,
 *     PICKUP_ADDRESS, POL, POD,
 *     COMMODITY, QUANTITY, CONTAINERS, CARGO_READINESS_DATE,
 *     INCOTERM, ADDITIONAL_REMARKS,
 *     ROUTE_PICKUP, ROUTE_POL, ROUTE_POD
 * @param {string[]} [params.cc]         - CC recipients
 * @param {string[]} [params.bcc]        - BCC recipients
 * @param {string}   [params.templatePath] - Override template file path
 * @param {string}   [params.method]       - Override: 'graph' | 'smtp'
 *
 * @returns {Promise<{ success: boolean, messageId?: string, method: string }>}
 *
 * @example
 * await sendOutlookEmail({
 *   to:      ['vendor@shippingco.com'],
 *   subject: 'RFQ-2604-001 | Marine Freight | Nhava Sheva → Alger',
 *   cc:      ['ops@xecurra.com'],
 *   variables: {
 *     RFQ_NUMBER:            'RFQ-2604-001',
 *     RFQ_DATE:              '12 Apr 2026',
 *     SHIPMENT_REF:          'XEC-2604-001',
 *     SERVICE_TYPE:          'Marine Freight',
 *     IMPORT_EXPORT:         'EXPORT',
 *     PICKUP_ADDRESS:        'ICD Panki',
 *     POL:                   'Nhava Sheva',
 *     POD:                   'Alger, Algeria',
 *     ROUTE_PICKUP:          'ICD Panki',
 *     ROUTE_POL:             'Nhava Sheva',
 *     ROUTE_POD:             'Alger, Algeria',
 *     COMMODITY:             'Leather Goods',
 *     QUANTITY:              '1.00 Unit',
 *     CONTAINERS:            '20ft &times; 1',
 *     CARGO_READINESS_DATE:  'Mon, 20 Apr 2026',
 *     INCOTERM:              'CIF',
 *     ADDITIONAL_REMARKS:    'Along with Ocean Freight, local charges must be included.',
 *   },
 * });
 */
async function sendOutlookEmail(params = {}) {
  const {
    to,
    subject,
    variables    = {},
    cc           = [],
    bcc          = [],
    templatePath = TEMPLATE_PATH,
    method       = EMAIL_METHOD,
  } = params;

  // ─── Validate required params ───────────────────────────────────────────
  if (!to || !Array.isArray(to) || to.length === 0) {
    throw new Error('[sendOutlookEmail] "to" must be a non-empty array.');
  }
  if (!subject || typeof subject !== 'string') {
    throw new Error('[sendOutlookEmail] "subject" is required.');
  }

  // ─── Load & render template ─────────────────────────────────────────────
  logger.info(`[sendOutlookEmail] Loading template: ${templatePath}`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`[sendOutlookEmail] Template not found: ${templatePath}`);
  }

  const rawHtml    = fs.readFileSync(templatePath, 'utf8');
  const renderedHtml = injectVariables(rawHtml, variables);

  logger.info(`[sendOutlookEmail] Template rendered. Method: ${method.toUpperCase()}`);

  // ─── Send via chosen method ─────────────────────────────────────────────
  const sendOptions = { to, subject, htmlBody: renderedHtml, cc, bcc };

  let result;
  if (method === 'graph') {
    result = await sendEmailViaGraph(sendOptions);
  } else if (method === 'smtp') {
    result = await sendEmailViaSMTP(sendOptions);
  } else {
    throw new Error(`[sendOutlookEmail] Unknown method "${method}". Use "graph" or "smtp".`);
  }

  return { ...result, method: method.toUpperCase() };
}

module.exports = { sendOutlookEmail };
