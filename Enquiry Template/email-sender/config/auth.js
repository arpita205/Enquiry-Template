'use strict';

require('dotenv').config();
const { ConfidentialClientApplication } = require('@azure/msal-node');

// ─── Validate required env vars ───────────────────────────────────────────────
const REQUIRED = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'];
REQUIRED.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`[auth] Missing required environment variable: ${key}`);
  }
});

// ─── MSAL Configuration ───────────────────────────────────────────────────────
const msalConfig = {
  auth: {
    clientId:     process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority:    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
  },
};

// ─── Token cache (in-memory, valid for ~1 hour) ───────────────────────────────
let _tokenCache = null;

/**
 * Returns a valid Microsoft Graph access token.
 * Automatically refreshes when the cached token is expired or missing.
 *
 * @returns {Promise<string>} Bearer access token
 */
async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer before expiry)
  if (_tokenCache && _tokenCache.expiresAt > now + 60_000) {
    return _tokenCache.accessToken;
  }

  const cca = new ConfidentialClientApplication(msalConfig);

  const result = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!result || !result.accessToken) {
    throw new Error('[auth] Failed to acquire access token from Azure AD.');
  }

  // Cache the token with its expiry timestamp
  _tokenCache = {
    accessToken: result.accessToken,
    expiresAt:   result.expiresOn ? new Date(result.expiresOn).getTime() : now + 3_500_000,
  };

  return _tokenCache.accessToken;
}

module.exports = { getAccessToken };
