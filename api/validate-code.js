const { applySecurityHeaders } = require('../src/lib/securityHeaders.js')

// ── Brute force & honeypot protection ───────────────────────────────────────

const codeAttempts = new Map()        // ip → [timestamps]
const honeypotCounts = new Map()      // ip → total failed count
const BLOCKED_IPS = new Map()         // ip → blockedAt timestamp
const PERMANENTLY_BLOCKED = new Set() // ips permanently blocked

const CODE_WINDOW_MS    = 60 * 60 * 1000       // 1 hour sliding window
const MAX_CODE_ATTEMPTS = 3                      // attempts before 24h block
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000  // 24 hour block
const HONEYPOT_THRESHOLD = 50                    // lifetime failures before permanent block

function isPermanentlyBlocked(ip) {
  return PERMANENTLY_BLOCKED.has(ip)
}

function checkHoneypot(ip) {
  const count = (honeypotCounts.get(ip) || 0) + 1
  honeypotCounts.set(ip, count)
  if (count > HONEYPOT_THRESHOLD) {
    PERMANENTLY_BLOCKED.add(ip)
    return true
  }
  return false
}

function checkCodeRateLimit(ip) {
  const now = Date.now()

  if (BLOCKED_IPS.has(ip)) {
    const blockedAt = BLOCKED_IPS.get(ip)
    if (now - blockedAt < BLOCK_DURATION_MS) {
      return {
        allowed: false,
        blocked: true,
        message: 'Too many failed attempts. Try again in 24 hours.',
        retryAfter: Math.ceil((BLOCK_DURATION_MS - (now - blockedAt)) / 1000)
      }
    } else {
      BLOCKED_IPS.delete(ip)
      codeAttempts.delete(ip)
    }
  }

  const windowStart = now - CODE_WINDOW_MS
  const attempts = (codeAttempts.get(ip) || []).filter(t => t > windowStart)

  if (attempts.length >= MAX_CODE_ATTEMPTS) {
    BLOCKED_IPS.set(ip, now)
    codeAttempts.delete(ip)
    return {
      allowed: false,
      blocked: true,
      message: 'Too many failed attempts. Try again in 24 hours.',
      retryAfter: 86400
    }
  }

  return { allowed: true, attempts }
}

function recordFailedAttempt(ip) {
  const now = Date.now()
  const windowStart = now - CODE_WINDOW_MS
  const attempts = (codeAttempts.get(ip) || []).filter(t => t > windowStart)
  attempts.push(now)
  codeAttempts.set(ip, attempts)
}

/*
 * ACCESS CODES — generated 2026-06-19
 * Set VALID_ACCESS_CODES in Vercel Environment Variables to:
 *
 * WQKT-WHYM-SDGU,E49G-PLPK-BCY9,SQPF-BLEE-WRBH,2BQP-LAMY-WJQF,
 * RHW4-VMVM-YW7U,4825-W9JU-3TJ4,UNUK-24E6-BP8S,2APN-GFTP-PXL6,
 * JQJP-AC5G-EVES,RXSR-ZNRG-49Y2,YTKX-YFSV-M397,V5YM-KM5V-FTTM,
 * M8RP-APM2-N4GS,WC38-CLFN-D9GN,VLG3-22YX-HM3U,8YME-ZU5Y-27YD,
 * UA4X-N49E-LYSM,HK65-EFW9-2FF9,RLTZ-K7YU-XWR8,2AEH-TKVB-QATA,
 * TA3D-5EAC-7XG9,LV9Q-D7GF-SV3M,2G9U-ET95-BCT7,EFTN-FT4H-BHD3,
 * W4AM-LEUA-YSST,PTVM-CRFF-TYES,E8L4-T5X4-AYMN,GQYN-VVFN-SPF7,
 * VRRT-65LT-2LP6,K3TD-ZX97-ZHPK,XQBL-RQCB-ETYV,SPAK-LMUG-NFMV,
 * FVUG-EEUG-QAUG,GFBQ-A54C-ZPLB,ZEGS-WDGS-92NG,E3KU-GEQQ-ZG22,
 * QWSV-K6U7-9P78,NNJE-MZ4T-N3L8,4CJX-84XU-2HBA,BD8B-KH7G-HKZW,
 * 59HV-JECV-CCCC,ZYSV-DXA3-C39X,3PPQ-3BFX-F9YU,QNB9-RPUR-TR6W,
 * RA2X-E7B8-Q7BB,4ZJ5-FKBD-MQHZ,E5GT-6WLM-7QF5,XBD2-YFQP-XAYM,
 * 472H-DQ4L-7ZML,PGBM-8HGE-KYXJ,
 * FAMILY-FREE-0001,FAMILY-FREE-0002,FAMILY-FREE-0003,FAMILY-FREE-0004
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')
  applySecurityHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const bodyStr = JSON.stringify(req.body || {})
  if (bodyStr.length > 100000) return res.status(413).json({ error: 'Request too large.' })

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown'

  if (isPermanentlyBlocked(ip)) {
    return res.status(403).json({ valid: false, error: 'Access denied.' })
  }

  const rateLimitCheck = checkCodeRateLimit(ip)
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      valid: false,
      error: rateLimitCheck.message,
      retryAfter: rateLimitCheck.retryAfter,
      blocked: true
    })
  }

  const { code } = req.body || {}

  if (!code || typeof code !== 'string' || !/^[A-Z0-9\-]{8,20}$/i.test(code)) {
    recordFailedAttempt(ip)
    if (checkHoneypot(ip)) {
      return res.status(403).json({ valid: false, error: 'Access denied.' })
    }
    return res.status(400).json({ valid: false, error: 'Invalid code format.' })
  }

  const validCodes = (process.env.VALID_ACCESS_CODES || '')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean)

  const codeUpper = code.trim().toUpperCase()

  const isValid = validCodes.includes(codeUpper)

  if (!isValid) {
    recordFailedAttempt(ip)
    if (checkHoneypot(ip)) {
      return res.status(403).json({ valid: false, error: 'Access denied.' })
    }
    const windowStart = Date.now() - CODE_WINDOW_MS
    const remaining = MAX_CODE_ATTEMPTS - (codeAttempts.get(ip) || []).filter(t => t > windowStart).length
    return res.status(200).json({
      valid: false,
      attemptsRemaining: Math.max(0, remaining)
    })
  }

  return res.status(200).json({ valid: true })
}
