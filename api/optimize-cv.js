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
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an expert CV strategist and career coach. Your task is to rewrite and optimise the provided CV so it is perfectly tailored for the specific job description below.

=== ORIGINAL CV ===
${cv}

=== JOB DESCRIPTION ===
${jobDescription}

=== OPTIMISATION INSTRUCTIONS ===
1. KEYWORD ALIGNMENT: Extract all key skills, technologies, qualifications, and phrases from the job description. Weave these naturally into the CV — recruiters and ATS systems scan for exact matches.
2. PROFESSIONAL SUMMARY: Rewrite the summary/profile to directly mirror the language and priorities of this specific role.
3. EXPERIENCE BULLETS: Transform each bullet point to lead with strong action verbs. Quantify achievements wherever possible (%, £/$, time saved, team size). Reorder and emphasise responsibilities that align with the job requirements.
4. SKILLS SECTION: Restructure to surface the most relevant skills first; remove or deprioritise skills that are irrelevant to this role.
5. ATS OPTIMISATION: Use standard section headings (Work Experience, Education, Skills). Avoid tables, columns, or graphics that break parsing.
6. TAILORING: Minimise space given to experience unrelated to this role. Cut generic phrases like "hard-working team player" — replace with specific, evidenced claims.
7. LENGTH & FORMAT: Aim for 1-2 pages of dense, relevant content. Keep the same structural sections as the original unless a change clearly improves the document.
8. TONE: Professional, confident, and specific. No empty buzzwords.

Return ONLY the optimised CV — no commentary, no preamble, no explanation. Just the final CV text, formatted cleanly.`
        }
      ]
    })

    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: 'Failed to optimise CV. Please try again.' })
  }
}
