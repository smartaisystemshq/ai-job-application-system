const LIMITS = {
  cvText: 15000,
  jobDescription: 8000,
  adjustRequest: 500,
  accessCode: 20,
  skillText: 200,
  summaryText: 2000,
  nameField: 100,
  generalText: 1000
};

function validateAndSanitize(input, type = 'generalText') {
  if (input === null || input === undefined) return { valid: true, value: '' };

  if (typeof input !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }

  const limit = LIMITS[type] || LIMITS.generalText;

  if (input.length > limit) {
    return {
      valid: false,
      error: `Input too long. Maximum ${limit} characters allowed.`
    };
  }

  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  return { valid: true, value: sanitized };
}

function validateCode(code) {
  if (!code || typeof code !== 'string') return { valid: false };
  if (code.length > 20) return { valid: false };
  if (!/^[A-Z0-9]+$/i.test(code)) return { valid: false };
  return { valid: true, value: code.trim().toUpperCase() };
}

module.exports = { validateAndSanitize, validateCode };
