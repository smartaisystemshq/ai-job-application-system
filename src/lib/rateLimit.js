const ipRequestCounts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || 'unknown';

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, []);
  }

  const requests = ipRequestCounts.get(ip).filter(time => time > windowStart);
  requests.push(now);
  ipRequestCounts.set(ip, requests);

  if (requests.length > MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      message: 'Too many requests. Please wait a minute before trying again.',
      retryAfter: 60
    };
  }

  return { allowed: true };
}

module.exports = { checkRateLimit };
