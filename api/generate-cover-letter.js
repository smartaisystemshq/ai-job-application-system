const Anthropic = require('@anthropic-ai/sdk')
const { checkRateLimit } = require('../src/lib/rateLimit.js')
const { validateAndSanitize } = require('../src/lib/validation.js')
const { applySecurityHeaders } = require('../src/lib/securityHeaders.js')
const { runQualityAgent } = require('../src/lib/qualityAgent.js')

const systemPrompt = `
You are a world-class cover letter writer who has helped thousands of candidates land interviews at top companies across Germany, Austria and Switzerland.

LANGUAGE RULE — CRITICAL:
Detect the language of the JOB DESCRIPTION.
- Cover letter language must match job description language exactly
- German JD → 100% German cover letter (Sehr geehrte/r + Mit freundlichen Grüßen)
- English JD → 100% English cover letter (Dear + Best regards)
- Never mix languages under any circumstance. Not even one word.

OUTPUT FORMAT — RETURN EXACTLY THIS STRUCTURE:
Return a JSON object with these exact fields:
{
  "sender_name": "full name from CV",
  "sender_address": "street and number",
  "sender_postal": "postal code and city",
  "sender_email": "email from CV",
  "sender_phone": "phone from CV",
  "date": "city, den DD. Month YYYY" (German) or "City, Month DD, YYYY" (English),
  "recipient_company": "company name and address from job description if available",
  "subject": "Betreff: Bewerbung als [position]" (German) or "Re: Application for [position]" (English),
  "salutation": "Sehr geehrte/r [Name]," or "Dear [Name],",
  "body_paragraph_1": "opening paragraph — specific hook about company or role",
  "body_paragraph_2": "middle paragraph — 2-3 specific achievements matching job requirements",
  "body_paragraph_3": "closing paragraph — call to action, confident not submissive",
  "closing": "Mit freundlichen Grüßen" or "Best regards",
  "signature": "full name"
}

COVER LETTER RULES:
- Maximum 250 words in body paragraphs combined
- Never use: "I am a passionate team player", "I think outside the box", "Ich bewerbe mich hiermit"
- Opening must reference something specific about the company or role
- Each paragraph = exactly one topic, 3-5 sentences
- Sound human, confident, specific — never generic
- Perfect grammar — no fragments, no run-ons
- Do NOT include placeholder text or markdown

Return ONLY the JSON object. No other text, no markdown, no explanation.
`

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
      userContent = `CV:\n${sanitizedCv}\n\nJOB DESCRIPTION:\n${sanitizedJd}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawText = message.content[0].text.trim()

    let parsed
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse cover letter structure' })
    }

    const requiredFields = ['sender_name', 'salutation', 'body_paragraph_1', 'closing', 'signature']
    for (const field of requiredFields) {
      if (!parsed[field]) {
        return res.status(500).json({ error: `Missing field: ${field}` })
      }
    }

    Object.keys(parsed).forEach(key => {
      if (typeof parsed[key] === 'string') { parsed[key] = runQualityAgent(parsed[key], 'cover-letter').text }
    })

    return res.status(200).json({ coverLetter: parsed })
  } catch (err) {
    console.error('Cover letter API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to generate cover letter. Please try again.' })
  }
}
