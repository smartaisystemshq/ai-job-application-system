const Anthropic = require('@anthropic-ai/sdk')

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

    const rules = `
=== COVER LETTER RULES ===

WORD LIMIT: Under 300 words total (body content only, not counting the header). Hard limit.

FORMAT — Output as a proper business letter with this exact structure:

[Full Name extracted from CV]
[Email]  |  [Phone]  |  [Location]
(leave blank if info not available in the CV — use "[Your Contact Details]" as placeholder)

[Today's date in format: 19 May 2026]

Dear Hiring Manager,

[Opening hook — 2-3 sentences. A specific, compelling reason you're right for THIS role at THIS company. Not "I am writing to apply." Mention something concrete from the JD or company that resonates.]

[Body paragraph 1 — Your strongest relevant achievement. One specific example from the CV that directly addresses the most critical requirement in the JD. Use a number or concrete outcome.]

[Body paragraph 2 — Second supporting point. Another brief, specific example addressing a secondary requirement. Show you've read the full JD, not just the headline.]

[Close — Direct, confident, one sentence stating you'd welcome a conversation. No begging, no clichés.]

Best regards,
[Full Name]

VOICE: Write as if the candidate is a confident professional who knows their value. Not desperate, not arrogant. Like a brief, direct message from one professional to another.

ABSOLUTELY BANNED — never write these:
"I am writing to express my interest" / "I am passionate about" / "team player" / "hard worker" / "go-getter" / "I believe I would be a great fit" / "Please find attached my CV" / "I look forward to hearing from you" / "dynamic" / "synergy" / "leverage" / "results-driven" / "detail-oriented" / "fast-paced environment"

REQUIRED:
- Extract the candidate's name, email, phone, location from their CV for the header
- Open with something specific and concrete, not a generic statement
- Name at least one real thing from the JD (a technology, a responsibility, the company's stated mission)
- Every claim must be backed by brief evidence from the CV
- Sounds like a real person, not AI-generated prose
- No flattery toward the company
- Varied sentence length — mix short punchy sentences with longer ones

LANGUAGE: Detect the language of the candidate's CV and write the entire cover letter in that same language. If the CV is in German, write the letter in German. If in French, write in French. Do not mix languages.

IMPORTANT — PLAIN TEXT FORMATTING (MANDATORY):
- Return PLAIN TEXT ONLY — absolutely no markdown symbols
- No #, ##, **, *, __, _, backticks in the output
- Use blank lines between each section/paragraph
- No bullet points — flowing paragraph prose only
- The output must look clean when pasted into any document editor

Return ONLY the complete business letter as specified above. No extra commentary.`

    let userContent

    if (cvPdf) {
      const jdPart = jdPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } }
        : { type: 'text', text: `=== JOB DESCRIPTION ===\n${jobDescription}` }

      userContent = [
        { type: 'text', text: "You are an expert cover letter writer who knows how to get interviews. The first document is the candidate's CV. Write a cover letter that stands out." },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cvPdf } },
        jdPart,
        { type: 'text', text: rules },
      ]
    } else if (jdPdf) {
      userContent = [
        { type: 'text', text: "You are an expert cover letter writer who knows how to get interviews. Write a cover letter that stands out — specific, evidence-backed, and human." },
        { type: 'text', text: `=== CANDIDATE CV ===\n${cv}` },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
        { type: 'text', text: rules },
      ]
    } else {
      userContent = `You are an expert cover letter writer who knows how to get interviews. Write a cover letter that stands out — specific, evidence-backed, and human.\n\n=== CANDIDATE CV ===\n${cv}\n\n=== JOB DESCRIPTION ===\n${jobDescription}\n\n${rules}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
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
