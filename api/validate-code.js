const { checkRateLimit } = require('./rateLimit.js')
const { validateCode } = require('./validation.js')
const { applySecurityHeaders } = require('./securityHeaders.js')

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: rateLimit.message, retryAfter: rateLimit.retryAfter });
  }

  const MAX_BODY_SIZE = 50000;
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request too large.' });
  }

  const { code } = req.body || {};

  const codeValidation = validateCode(code);
  if (!codeValidation.valid) return res.status(200).json({ valid: false });

  const codesEnv = process.env.VALID_ACCESS_CODES || '';
  const validCodes = codesEnv.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

  const valid = validCodes.includes(codeValidation.value);
  return res.status(200).json({ valid });
};
