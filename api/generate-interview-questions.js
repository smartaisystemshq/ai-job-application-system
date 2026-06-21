const Anthropic = require('@anthropic-ai/sdk')
const { INTERVIEW_EXPERT_KNOWLEDGE } = require('./expertKnowledge.js')
const { checkRateLimit } = require('./rateLimit.js')
const { validateAndSanitize } = require('./validation.js')
const { applySecurityHeaders } = require('./securityHeaders.js')
const { runQualityAgent } = require('./qualityAgent.js')

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const { jobDescription, language } = req.body || {}

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required' })
  }

  const jdValidation = validateAndSanitize(jobDescription, 'jobDescription')
  if (!jdValidation.valid) {
    return res.status(400).json({ error: jdValidation.error })
  }

  const sanitizedJd = jdValidation.value

  const systemPrompt = `You are a senior recruiter and interview coach with expertise across all industries. You know exactly what hiring managers look for and what questions reveal the best candidates.

${INTERVIEW_EXPERT_KNOWLEDGE}

YOUR TASK:
- Generate exactly 8 interview questions tailored to the specific role and company in the job description
- Include all question types from the knowledge base
- Each question must be specific to this role — no generic questions
- Provide a detailed answer framework for each question using STAR method
- Match the seniority level and industry of the job description
- Write entirely in ${language === 'DE' ? 'German' : 'English'}
- Questions should be challenging but fair`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate 8 interview questions with STAR answer frameworks for this role:\n\n${sanitizedJd}`
        }
      ]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const { text: cleanResult } = runQualityAgent(raw, 'interview')
    return res.status(200).json({ result: cleanResult })
  } catch (error) {
    if (error.status === 401) {
      return res.status(500).json({ error: 'Invalid API key configuration. Please contact support.' })
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' })
    }
    if (error.status === 529) {
      return res.status(503).json({ error: 'AI service is overloaded. Please try again shortly.' })
    }
    console.error('Interview questions error:', error.message)
    return res.status(500).json({ error: 'Failed to generate questions. Please try again.' })
  }
}
