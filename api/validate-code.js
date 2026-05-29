export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') return res.status(200).json({ valid: false });

  const codesEnv = process.env.VALID_ACCESS_CODES || '';
  const validCodes = codesEnv.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

  const valid = validCodes.includes(code.trim().toUpperCase());
  return res.status(200).json({ valid });
}
