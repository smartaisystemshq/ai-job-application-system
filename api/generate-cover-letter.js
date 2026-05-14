const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { cv, jobDescription } = req.body || {}
  if (!cv || !jobDescription) {
    return res.status(400).json({ error: 'Both cv and jobDescription are required.' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an expert cover letter writer. Using the candidate's CV and the job description below, write a cover letter that gets interviews.

=== CANDIDATE CV ===
${cv}

=== JOB DESCRIPTION ===
${jobDescription}

=== WRITING RULES (follow strictly) ===
WORD LIMIT: Under 250 words. Absolute maximum.
TONE: Conversational yet professional. Write like a confident human — not a robot, not a corporate drone.
STRUCTURE: Opening hook → Why this role/company specifically → 2 concrete examples from the CV that match job requirements → Brief, confident close with CTA.
BANNED PHRASES (never use these):
- "I am writing to express my interest"
- "I am a passionate and dedicated"
- "team player", "hard worker", "go-getter"
- "I believe I would be a great fit"
- "Please find attached my CV"
- "I look forward to hearing from you"
- "dynamic", "synergy", "leverage", "utilise"
REQUIREMENTS:
- Open with something specific and compelling, not generic
- Reference 1-2 specific things from the job description (a project, a technology, the company mission)
- Back up claims with brief, concrete evidence from the CV (numbers preferred)
- Sound like a real person wrote it
- No flattery toward the company
- End with a confident, direct close

Return ONLY the cover letter text. No subject line, no "Here is your cover letter:" preamble. Just the letter.`
        }
      ]
    })

    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: 'Failed to generate cover letter. Please try again.' })
  }
}
