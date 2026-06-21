const Anthropic = require('@anthropic-ai/sdk')
const { checkRateLimit } = require('./rateLimit.js')
const { validateAndSanitize } = require('./validation.js')
const { applySecurityHeaders } = require('./securityHeaders.js')
const { runQualityAgent } = require('./qualityAgent.js')

const defaultSystemPrompt = `You are an expert CV writer and career coach. When adjusting documents, maintain the same high professional standards: perfect grammar, strong action verbs, ATS-optimized keywords, and human-sounding language. Never introduce grammatical errors. Apply the user's requested change while improving overall quality.`

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

  const MAX_BODY_SIZE = 50000
  const bodyStr = JSON.stringify(req.body)
  if (bodyStr.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request too large.' })
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const { documentText, instruction, documentType } = req.body || {}
    if (!documentText) return res.status(400).json({ error: 'documentText is required.' })
    if (!instruction) return res.status(400).json({ error: 'instruction is required.' })

    const docValidation = validateAndSanitize(documentText, 'cvText')
    if (!docValidation.valid) return res.status(400).json({ error: docValidation.error })

    const instrValidation = validateAndSanitize(instruction, 'adjustRequest')
    if (!instrValidation.valid) return res.status(400).json({ error: instrValidation.error })

    const sanitizedDoc = docValidation.value
    const sanitizedInstruction = instrValidation.value

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let typeLabel, formatInstructions
    let systemPrompt = defaultSystemPrompt

    if (documentType === 'cover-letter') {
      typeLabel = 'cover letter'
      systemPrompt = `You are an expert cover letter editor. The cover letter is provided as a JSON object. Apply the user's requested change ONLY to the body paragraphs (body_paragraph_1, body_paragraph_2, body_paragraph_3). Return the complete JSON object with ONLY those fields updated. Keep all other fields exactly the same. Return ONLY valid JSON, no other text.`
      formatInstructions = `IMPORTANT — JSON FORMAT:
The document is a JSON object. Return the complete JSON object with only body_paragraph_1, body_paragraph_2, and body_paragraph_3 updated. Keep all other fields unchanged. Return ONLY valid JSON — no commentary, no markdown.`
    } else if (documentType === 'interview-questions') {
      typeLabel = 'interview preparation document'
      formatInstructions = `IMPORTANT — OUTPUT FORMAT (follow exactly):
- Return PLAIN TEXT ONLY — absolutely no markdown symbols (no **, *, #, ##, __, _)
- Output exactly 8 questions using this format for each:

1. [Question text here]
Answer Framework: [Framework text here]

2. [Question text here]
Answer Framework: [Framework text here]

(continue for all 8 questions)

- Each question MUST start on a new line with its number followed by a period and a space (e.g. "1. ")
- Do NOT use bold, headers, bullets, or any other formatting
- Keep exactly 8 questions unless the request explicitly asks for a different number

CRITICAL — IMPACT REQUIREMENT:
You are a senior recruiter and interview coach. Make SIGNIFICANT and MEANINGFUL changes based on the user's request. If they ask for "more specific to the role", completely rewrite questions to be deeply tailored to the specific job title, industry, and company context mentioned. If they ask for "harder questions", substantially increase difficulty and specificity. Every adjustment must result in noticeably different, better questions — not minor wording changes.`
    } else {
      typeLabel = 'CV'
      formatInstructions = `IMPORTANT — PLAIN TEXT FORMATTING:
- Return PLAIN TEXT ONLY — no markdown symbols (no **, *, #, ##, __, _)
- For CV: use ALL CAPS for section headers, • for bullets, ─── for dividers`
    }

    const prompt = `You are an expert ${typeLabel} writer. The user has a ${typeLabel} and wants a specific adjustment made to it.

=== CURRENT ${typeLabel.toUpperCase()} ===
${sanitizedDoc}

=== USER'S ADJUSTMENT REQUEST ===
"${sanitizedInstruction}"

=== INSTRUCTIONS ===
Apply the requested adjustment while:
- Preserving the professional quality and tone of the document
- Keeping the same structure and format unless the request explicitly changes it
- Maintaining all factual information (dates, company names, achievements) unless asked to change them
- Ensuring the result still reads as natural, human-written content — no AI clichés
- If asked to shorten: remove the least impactful content first, never cut contact info or key achievements
- If asked to lengthen: add specific, substantive content — no padding or filler phrases
- If asked to change tone: adjust word choice and sentence structure while keeping the facts
- If asked to add keywords: weave them in naturally, never just append a keyword list

${formatInstructions}

Return ONLY the complete updated ${typeLabel} text — no commentary, no "Here is the updated version:", just the document itself.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    const rawResult = message.content[0].text
    const type = req.body.documentType === 'cover-letter' ? 'cover-letter' : 'cv'
    const { text: cleanResult } = runQualityAgent(rawResult, type)
    return res.status(200).json({ result: cleanResult })
  } catch (err) {
    console.error('Adjust document API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to apply adjustment.' })
  }
}
