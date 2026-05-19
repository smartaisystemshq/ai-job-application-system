const Anthropic = require('@anthropic-ai/sdk')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { cv, jobDescription, cvPdf, jdPdf } = req.body || {}
  if (!jobDescription && !jdPdf) return res.status(400).json({ error: 'jobDescription is required.' })
  if (!cv && !cvPdf) return res.status(400).json({ error: 'Either cv text or cvPdf is required.' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const rules = `
=== COVER LETTER RULES ===

WORD LIMIT: Under 250 words. Hard limit — stop at 250 if needed.

STRUCTURE (4 paragraphs max):
1. Opening hook — a specific, compelling reason you're right for THIS role at THIS company. Not "I am writing to apply." Mention something concrete from the JD or company that resonates.
2. Your strongest relevant achievement — one specific example from your CV that directly addresses the most critical requirement in the JD. Use a number or concrete outcome.
3. Second supporting point — another brief, specific example that addresses a secondary requirement. Show you've read the full JD, not just the headline.
4. Close — direct, confident, short. One sentence stating you'd welcome a conversation. No begging, no "I look forward to hearing from you."

VOICE: Write as if the candidate is a confident professional who knows their value. Not desperate, not arrogant. Like a brief, direct message from one professional to another.

ABSOLUTELY BANNED — never write these:
"I am writing to express my interest" / "I am passionate about" / "team player" / "hard worker" / "go-getter" / "I believe I would be a great fit" / "Please find attached my CV" / "I look forward to hearing from you" / "dynamic" / "synergy" / "leverage" / "results-driven" / "detail-oriented" / "fast-paced environment"

REQUIRED:
- Open with something specific and concrete, not a generic statement
- Name at least one real thing from the JD (a technology, a responsibility, the company's stated mission)
- Every claim must be backed by brief evidence from the CV
- Sounds like a real person, not AI-generated prose
- No flattery toward the company
- Varied sentence length — mix short punchy sentences with longer ones

IMPORTANT — PLAIN TEXT FORMATTING (MANDATORY):
- Return PLAIN TEXT ONLY — absolutely no markdown symbols
- No #, ##, **, *, __, _, `` in the output
- Use paragraph breaks between sections — no headers needed for a cover letter
- No bullet points in a cover letter — flowing paragraph prose only
- The output must look clean when pasted into any document editor

Return ONLY the cover letter text. No subject line, no "Dear Hiring Manager" salutation unless context clearly supports it, no preamble. Just the letter body.`

  try {
    let userContent

    if (cvPdf) {
      const jdPart = jdPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } }
        : { type: 'text', text: `=== JOB DESCRIPTION ===\n${jobDescription}` }

      userContent = [
        { type: 'text', text: 'You are an expert cover letter writer who knows how to get interviews. The first document is the candidate\'s CV. Write a cover letter that stands out.' },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cvPdf } },
        jdPart,
        { type: 'text', text: rules },
      ]
    } else {
      userContent = `You are an expert cover letter writer who knows how to get interviews. Write a cover letter that stands out — specific, evidence-backed, and human.\n\n=== CANDIDATE CV ===\n${cv}\n\n=== JOB DESCRIPTION ===\n${jobDescription}\n\n${rules}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userContent }],
    })

    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to generate cover letter. Please try again.' })
  }
}
