const Anthropic = require('@anthropic-ai/sdk')
const { COVER_LETTER_EXPERT_KNOWLEDGE } = require('./expertKnowledge.js')
const { checkRateLimit } = require('./rateLimit.js')
const { validateAndSanitize } = require('./validation.js')
const { applySecurityHeaders } = require('./securityHeaders.js')

const languageInstruction = `
CRITICAL LANGUAGE RULE:
- Read the CV language carefully
- If CV is in German → write the ENTIRE letter in German only. Use "Sehr geehrte/r" as salutation. Use "Mit freundlichen Grüßen" as closing. Zero English words.
- If CV is in English → write the ENTIRE letter in English only. Use "Dear" as salutation. Use "Best regards" as closing. Zero German words.
- NEVER mix languages. NEVER write salutation in one language and body in another.
- If unsure → default to German.
`

const systemPrompt = `You are an expert cover letter writer who has helped thousands of candidates land interviews at top companies. You write compelling, human-sounding cover letters that get responses.

${languageInstruction}

${COVER_LETTER_EXPERT_KNOWLEDGE}

YOUR TASK:
- Write a tailored cover letter for the specific role using the candidate's CV
- Maximum 250 words
- Follow the structure from the knowledge base
- Sound human and specific — never generic
- No clichés whatsoever
- Perfect grammar — especially in German, use grammatically complete sentences
- Output as clean formatted text, no markdown

CONTACT DATA RULE — CRITICAL:
Use ALL contact information from the candidate's CV in the sender block at the top of the cover letter. This includes:
- Full name
- Email address
- Phone number
- Full street address and house number
- Postal code and city
- Country (if present)
- LinkedIn URL (if present)
- Website/Portfolio (if present)

Never omit any contact information that exists in the original CV. Copy it exactly as provided — do not change, shorten or reformat contact details. Place all contact info in the sender block at the very top of the letter.`

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

    const { cv, jobDescription, cvPdf, jdPdf } = req.body || {}
    if (!jobDescription && !jdPdf) return res.status(400).json({ error: 'jobDescription is required.' })
    if (!cv && !cvPdf) return res.status(400).json({ error: 'Either cv text or cvPdf is required.' })

    let sanitizedCv = cv
    let sanitizedJd = jobDescription

    if (cv) {
      const cvValidation = validateAndSanitize(cv, 'cvText')
      if (!cvValidation.valid) return res.status(400).json({ error: cvValidation.error })
      sanitizedCv = cvValidation.value
    }

    if (jobDescription) {
      const jdValidation = validateAndSanitize(jobDescription, 'jobDescription')
      if (!jdValidation.valid) return res.status(400).json({ error: jdValidation.error })
      sanitizedJd = jdValidation.value
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let userContent

    if (cvPdf) {
      const jdPart = jdPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } }
        : { type: 'text', text: `=== JOB DESCRIPTION ===\n${sanitizedJd}` }

      userContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cvPdf } },
        jdPart,
      ]
    } else if (jdPdf) {
      userContent = [
        { type: 'text', text: `=== CANDIDATE CV ===\n${sanitizedCv}` },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
      ]
    } else {
      userContent = `=== CANDIDATE CV ===\n${sanitizedCv}\n\n=== JOB DESCRIPTION ===\n${sanitizedJd}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Cover letter API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to generate cover letter. Please try again.' })
  }
}
