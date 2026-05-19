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

  const instructions = `
=== OPTIMISATION INSTRUCTIONS ===

GOAL: Produce a CV that a senior recruiter reads and immediately thinks "this person fits the role." Every line must earn its place.

1. KEYWORD ALIGNMENT
   Extract the exact skills, tools, qualifications, and phrases from the job description. Weave them naturally into the CV — ATS systems do exact-match scanning. Prioritise keywords from the "Requirements" and "Responsibilities" sections.

2. PROFESSIONAL SUMMARY
   Rewrite the summary in 3 crisp sentences that directly mirror this role's language. Sentence 1: professional identity + years of relevant experience. Sentence 2: 2 specific strengths the JD explicitly asks for. Sentence 3: what the candidate delivers for organisations like this one. No "passionate about" or "results-driven" — use concrete, specific language.

3. EXPERIENCE BULLETS — TRANSFORM EVERY ONE
   - Lead with the strongest action verb available: Spearheaded, Architected, Slashed, Doubled, Launched, Negotiated, Automated, Mentored
   - Format: [Action verb] + [what you did] + [measurable outcome or scale]
   - Quantify relentlessly: percentages, £/$, headcount, time saved, revenue, NPS scores — if the original has numbers, keep them; if it doesn't, use reasonable proxies ("team of 4", "across 12 countries", "3-month timeline")
   - Cut bullets that have zero relevance to this job; strengthen bullets that directly match it
   - Maximum 18 words per bullet

4. SKILLS SECTION
   Lead with the skills the JD lists as requirements. Remove or deprioritise skills irrelevant to this role. Use exact terminology from the JD (e.g. if JD says "Salesforce CRM", don't write "CRM tools").

5. ATS COMPLIANCE
   Standard section headings: Professional Summary, Work Experience, Education, Skills. No tables, columns, text boxes, or graphics. Dates in consistent format (Jan 2021 – Mar 2024).

6. HONESTY & TONE
   Never fabricate achievements. If the original lacks metrics, write "[Achieved X — add your specific metric here]" as a placeholder. Confident and direct — no self-deprecation, no corporate fluff.

7. LENGTH
   Aim for exactly 1 page for candidates with under 8 years experience; 2 pages maximum for senior candidates. Cut ruthlessly — never pad.

8. HUMAN VOICE
   The result must sound like it was written by the candidate, not by an AI. Vary sentence structure. Use the candidate's existing voice as a baseline and elevate it — don't replace it with generic corporate prose.

IMPORTANT — PLAIN TEXT FORMATTING (MANDATORY):
- Return PLAIN TEXT ONLY — absolutely no markdown symbols
- No #, ##, ###, **, *, __, _, `` in the output
- Use ALL CAPS for section headers: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS
- Use • (Unicode bullet •) for bullet points — never use * or - for bullets
- Use ─── (repeated dashes) as section dividers if needed
- Dates: Jan 2021 – Mar 2024 (use – en-dash, never -- double-dash)
- The output must be ready to paste into a Word doc and look clean with no special characters

Return ONLY the optimised CV — no commentary, no preamble. Just the final polished CV text.`

  try {
    let userContent

    if (cvPdf) {
      const jdPart = jdPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } }
        : { type: 'text', text: `=== JOB DESCRIPTION ===\n${jobDescription}` }

      userContent = [
        { type: 'text', text: 'You are a world-class CV writer and career strategist. The first document is the candidate\'s current CV. Rewrite and optimise it to perfectly match the job description.' },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cvPdf } },
        jdPart,
        { type: 'text', text: instructions },
      ]
    } else {
      const jdSection = jdPdf
        ? [
            { type: 'text', text: `You are a world-class CV writer and career strategist. Rewrite and optimise the CV below for the job description in the attached PDF.\n\n=== ORIGINAL CV ===\n${cv}` },
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
            { type: 'text', text: instructions },
          ]
        : `You are a world-class CV writer and career strategist. Your task is to rewrite and optimise the provided CV so it is perfectly tailored for the job description below.\n\n=== ORIGINAL CV ===\n${cv}\n\n=== JOB DESCRIPTION ===\n${jobDescription}\n\n${instructions}`

      userContent = jdSection
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
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
