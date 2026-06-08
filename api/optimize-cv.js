const Anthropic = require('@anthropic-ai/sdk')
const { CV_EXPERT_KNOWLEDGE } = require('./expertKnowledge.js')

const systemPrompt = `You are a world-class professional CV writer and career coach with 15+ years of experience helping candidates land jobs at top companies. You have deep expertise in ATS optimization, recruiter psychology, and industry-specific CV standards.

${CV_EXPERT_KNOWLEDGE}

YOUR TASK:
- Rewrite the candidate's CV to perfectly match the job description
- Apply every best practice from the knowledge base above
- Ensure grammatical perfection — especially in German (never create sentence fragments)
- Use strong action verbs and quantify achievements
- Mirror keywords from the job description naturally
- Output clean plain text with no markdown symbols (no #, **, *, --)
- Structure: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS (and LANGUAGES if present)
- Section headers in ALL CAPS
- Bullet points use • character only
- Fit content to one page worth of text
- Detect the language of the CV and respond entirely in that language
- Every sentence must be grammatically complete and correct`

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
    } else {
      const jdSection = jdPdf
        ? [
            { type: 'text', text: `=== ORIGINAL CV ===\n${cv}` },
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
          ]
        : `=== ORIGINAL CV ===\n${cv}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`

      userContent = jdSection
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to optimise CV. Please try again.' })
  }
}
