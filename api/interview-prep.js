const Anthropic = require('@anthropic-ai/sdk')
const { checkRateLimit } = require('./rateLimit.js')
const { validateAndSanitize } = require('./validation.js')
const { applySecurityHeaders } = require('./securityHeaders.js')

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

    const { jobDescription, jdPdf, language } = req.body || {}
    if (!jobDescription && !jdPdf) return res.status(400).json({ error: 'jobDescription is required.' })

    let sanitizedJd = jobDescription

    if (jobDescription) {
      const jdValidation = validateAndSanitize(jobDescription, 'jobDescription')
      if (!jdValidation.valid) return res.status(400).json({ error: jdValidation.error })
      sanitizedJd = jdValidation.value
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const langName = language === 'DE' ? 'German' : 'English'

    const prompt = `You are an expert interview coach preparing a candidate for the role described in the job description.

LANGUAGE RULE: Generate all 8 questions AND all answer frameworks in ${langName}. Write entirely in ${langName}. Do not mix languages.

OUTPUT FORMAT — follow this exactly:

1. [Write the actual interview question here — a real question the interviewer would ask out loud]
Answer Framework: [2-4 sentences of specific, practical guidance for answering this exact question in this exact role. Say what content to include, what structure works, what the interviewer is really evaluating. Never say "use STAR method" without explaining what the S, T, A, R should contain for this specific question.]

2. [Another actual interview question]
Answer Framework: [...]

3. [Another actual interview question]
Answer Framework: [...]

4. [Another actual interview question]
Answer Framework: [...]

5. [Another actual interview question]
Answer Framework: [...]

6. [Another actual interview question]
Answer Framework: [...]

7. [Another actual interview question]
Answer Framework: [...]

8. [Another actual interview question]
Answer Framework: [...]

CRITICAL RULES:
- Items 1 through 8 must ALL be actual interview questions an interviewer would say out loud — never a category heading, section title, or label
- Every single item starts directly with the question text (no heading before it)
- Questions must be specific to the role described — not generic interview questions
- Answer frameworks must be specific to the question and role — not generic advice

SELECT the 8 most likely questions from these categories (pick the most relevant mix for this specific role):
- Technical skill or tool questions based on requirements listed in the job description
- Behavioural questions testing the key competencies the role demands
- Situational or case questions relevant to this role's main challenges
- One motivation or fit question relevant to this company type or sector

GRAMMAR: Write all questions and frameworks in grammatically correct, natural ${langName}. Every sentence must be complete and polished — no fragments.`

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
      max_tokens: 3500,
      temperature: 0,
      messages: [{ role: 'user', content: userContent }],
    })

    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to generate interview questions. Please try again.' })
  }
}
