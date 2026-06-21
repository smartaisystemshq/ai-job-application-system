const Anthropic = require('@anthropic-ai/sdk')
const { checkRateLimit } = require('../src/lib/rateLimit.js')
const { validateAndSanitize } = require('../src/lib/validation.js')
const { applySecurityHeaders } = require('../src/lib/securityHeaders.js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')
  applySecurityHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const rateLimit = checkRateLimit(req)
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: rateLimit.message, retryAfter: rateLimit.retryAfter })
  }

  const MAX_BODY_SIZE = 4000000
  const bodyStr = JSON.stringify(req.body)
  if (bodyStr.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request too large.' })
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const { jobDescription, jdPdf } = req.body || {}
    if (!jobDescription && !jdPdf) return res.status(400).json({ error: 'jobDescription is required.' })

    let sanitizedJd = jobDescription

    if (jobDescription) {
      const jdValidation = validateAndSanitize(jobDescription, 'jobDescription')
      if (!jdValidation.valid) return res.status(400).json({ error: jdValidation.error })
      sanitizedJd = jdValidation.value
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Generate exactly 8 interview questions for this role.
Return ONLY valid JSON, no other text, no markdown fences.

Format:
{
  "en": [
    {"question": "question text in English", "framework": "answer framework in English (2-4 sentences)"},
    ... 8 items total
  ],
  "de": [
    {"question": "Frage auf Deutsch", "framework": "Antwort-Leitfaden auf Deutsch (formelles Sie, 2-4 Sätze)"},
    ... 8 items total
  ]
}

RULES:
- Both "en" and "de" arrays must each contain exactly 8 objects
- The "en" array is entirely in English
- The "de" array is entirely in German using formal Sie-form
- Both arrays cover the same 8 questions, just in different languages
- Questions must be specific to the role — never generic
- Frameworks must be specific to the question and role — not generic advice
- All 8 questions are actual interview questions an interviewer would say out loud
- Pick questions from: technical skills, behavioural, situational/case, motivation/fit
- Items 1 through 8 must ALL be actual questions (not category headings)`

    let userContent

    if (jdPdf) {
      userContent = [
        { type: 'text', text: prompt + '\n\nThe job description is in the document attached below.' },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
      ]
    } else {
      userContent = `${prompt}\n\n=== JOB DESCRIPTION ===\n${sanitizedJd}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      temperature: 0,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = message.content[0].text || ''
    let en = [], de = []
    try {
      const clean = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
      const parsed = JSON.parse(clean)
      en = Array.isArray(parsed.en) ? parsed.en : []
      de = Array.isArray(parsed.de) ? parsed.de : []
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse questions response. Please try again.' })
    }

    return res.status(200).json({ en, de })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to generate interview questions. Please try again.' })
  }
}
