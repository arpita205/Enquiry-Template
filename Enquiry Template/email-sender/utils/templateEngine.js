'use strict';

/**
 * Simple but robust template engine.
 *
 * Replaces all occurrences of {{PLACEHOLDER_NAME}} in the HTML string
 * with the corresponding value from the `variables` object.
 *
 * Placeholder rules:
 *   - Delimiters: {{ and }}
 *   - Case-insensitive key matching
 *   - Unknown placeholders are left unchanged (safe default)
 *   - Values are HTML-escaped to prevent XSS / broken markup
 *
 * @example
 * const html = injectVariables(template, {
 *   RFQ_NUMBER:   'RFQ-2604-001',
 *   COMMODITY:    'Leather Goods',
 * });
 *
 * @param {string} template  - Raw HTML string containing {{PLACEHOLDERS}}
 * @param {Object} variables - Key-value map of placeholder → replacement value
 * @returns {string}         - Rendered HTML with placeholders replaced
 */
function injectVariables(template, variables = {}) {
  if (typeof template !== 'string') {
    throw new TypeError('[templateEngine] template must be a string');
  }
  if (typeof variables !== 'object' || variables === null) {
    throw new TypeError('[templateEngine] variables must be a plain object');
  }

  // Build a case-insensitive lookup map
  const lookup = {};
  for (const [key, val] of Object.entries(variables)) {
    lookup[key.toUpperCase()] = String(val ?? '');
  }

  // Replace each {{KEY}} with its escaped value
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/gi, (match, key) => {
    const upperKey = key.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(lookup, upperKey)) {
      return escapeHtml(lookup[upperKey]);
    }
    // Unknown placeholder — leave as-is so it's obvious in output
    return match;
  });
}

/**
 * Minimal HTML entity escaping for user-supplied values.
 * Prevents accidentally broken markup if values contain < > & " '
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

module.exports = { injectVariables, escapeHtml };
