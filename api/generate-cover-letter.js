const Anthropic = require('@anthropic-ai/sdk')
const { COVER_LETTER_EXPERT_KNOWLEDGE } = require('./expertKnowledge.js')

const systemPrompt = `You are an expert cover letter writer who has helped thousands of candidates land interviews at top companies. You write compelling, human-sounding cover letters that get responses.

${COVER_LETTER_EXPERT_KNOWLEDGE}

YOUR TASK:
- Write a tailored cover letter for the specific role using the candidate's CV
- Maximum 250 words
- Follow the structure from the knowledge base
- Sound human and specific — never generic
- No clichés whatsoever
- Detect language from the CV and write entirely in that language
- Perfect grammar — especially in German, use grammatically complete sentences
- Output as clean formatted text, no markdown`

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const { cv, jobDescription, cvPdf, jdPdf } = req.body || {}
    if (!jobDescription && !jdPdf) return res.status(400).json({ error: 'jobDescription is required.' })
    if (!cv && !cvPdf) return res.status(400).json({ error: 'Either cv text or cvPdf is required.' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let userContent

    if (cvPdf) {
      const jdPart = jdPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } }
        : { type: 'text', text: `=== JOB DESCRIPTION ===\n${jobDescription}` }

      userContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cvPdf } },
        jdPart,
      ]
    } else if (jdPdf) {
      userContent = [
        { type: 'text', text: `=== CANDIDATE CV ===\n${cv}` },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
      ]
    } else {
      userContent = `=== CANDIDATE CV ===\n${cv}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
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
