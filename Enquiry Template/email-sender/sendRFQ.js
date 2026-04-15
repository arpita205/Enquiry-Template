'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  sendRFQ.js  —  Xecurra Infinity LLP
 *  Batch Send script: Send separate RFQ emails to multiple vendors
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const { sendOutlookEmail } = require('./index');
const { injectVariables } = require('./utils/templateEngine');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

// ─── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--test');
const methodOverride = (() => {
  const idx = args.indexOf('--method');
  return idx !== -1 ? args[idx + 1] : undefined;
})();

// ═══════════════════════════════════════════════════════════
//  CONFIGURE YOUR RFQ DETAILS & RECIPIENTS HERE
// ═══════════════════════════════════════════════════════════

const recipients = [
  'Ei@cargoon.in',
  'Seacubelogistics@gmail.com'
  //'execution@xecurra.com'
];

const sharedData = {
  subject: 'RFQ-2604-00011 | Marine Freight, Custom Clearance | Dalian → New Delhi',
  cc: [],
  bcc: [],

  // ── Template variables ────────────────────────────────────
  variables: {
    RFQ_NUMBER: 'RFQ-2604-00011',
    RFQ_DATE: '12 Apr 2026',
    SERVICE_TYPE: 'Marine Freight, Custom Clearance',
    SHIPMENT_REF: 'XEC-2604-00011',
    IMPORT_EXPORT: 'Import',
    PICKUP_ADDRESS: 'N/A',
    POL: 'Dalian',
    POD: 'New Delhi',
    ROUTE_PICKUP: 'N/A',
    ROUTE_POL: 'Dalian',
    ROUTE_POD: 'New Delhi',
    COMMODITY: '2 pallets',
    QUANTITY: '1.00 Cubic Cubic Metric',
    CONTAINERS: "1250.0 kg",
    DIMENSIONS: "100 x 100 x 100 cm",
    CARGO_READINESS_DATE: 'Sat, 18 Apr 2026',
    ADDITIONAL_REMARKS: 'Along with Ocean Freight, Local Charges of Loading port and Discharge port should be included.',
  },
  method: methodOverride,
};

// ═══════════════════════════════════════════════════════════
//  SEND
// ═══════════════════════════════════════════════════════════

async function main() {
  logger.info('═══════════════════════════════════════════');
  logger.info('  Xecurra RFQ Email Sender - Batch Mode');
  logger.info('═══════════════════════════════════════════');

  if (isDryRun) {
    logger.info('[sendRFQ] DRY RUN — rendering template only');
    const templatePath = path.join(__dirname, '..', 'rfq-template.html');
    const rawHtml = fs.readFileSync(templatePath, 'utf8');
    const rendered = injectVariables(rawHtml, sharedData.variables);
    const outPath = path.join(__dirname, 'preview-output.html');
    fs.writeFileSync(outPath, rendered, 'utf8');
    logger.info(`[sendRFQ] ✅ Rendered HTML saved to: ${outPath}`);
    return;
  }

  for (const recipient of recipients) {
    try {
      logger.info(`[sendRFQ] Processing recipient: ${recipient}`);
      const result = await sendOutlookEmail({
        ...sharedData,
        to: [recipient]
      });

      logger.info(`[sendRFQ] ✅ SUCCESS for ${recipient} via ${result.method}`);
      // Small pause between emails to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      logger.error(`[sendRFQ] ❌ FAILED for ${recipient}: ${err.message}`);
      if (err.response) {
        logger.error(`[sendRFQ]    HTTP Status: ${err.response.status}`);
        logger.error(`[sendRFQ]    Error Data: ${JSON.stringify(err.response.data)}`);
      }
    }
  }

  logger.info('═══════════════════════════════════════════');
  logger.info('  All tasks completed.');
  logger.info('═══════════════════════════════════════════');
}

main();
