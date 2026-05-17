const Anthropic = require('@anthropic-ai/sdk')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, data } = req.body || {}
  if (!action) return res.status(400).json({ error: 'action is required.' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let prompt

  if (action === 'generate-bullets') {
    const { jobTitle, company, description, targetRole } = data || {}
    if (!description) return res.status(400).json({ error: 'description is required.' })
    prompt = `You are an expert CV writer. Generate exactly 4 strong, concise bullet points for this work experience entry.

Job Title: ${jobTitle || 'Not specified'}
Company: ${company || 'Not specified'}
Target Role (if relevant): ${targetRole || 'Not specified'}
Description of work: ${description}

Requirements:
- Start each bullet with a strong past-tense action verb (Led, Built, Increased, Reduced, Designed, Managed, Delivered, etc.)
- Quantify achievements with numbers, %, £/$, team sizes, or time saved wherever possible
- Maximum 15 words per bullet
- Focus on impact and outcomes, not just duties
- Tailor to the target role if specified

Return exactly 4 bullet points. Each must start with • on its own line. No preamble, no extra text.`

  } else if (action === 'suggest-skills') {
    const { targetRole, existingSkills } = data || {}
    if (!targetRole) return res.status(400).json({ error: 'targetRole is required.' })
    prompt = `You are a career expert. Suggest exactly 10 relevant skills for a "${targetRole}" role.

Skills the candidate already has: ${(existingSkills || []).join(', ') || 'none listed'}

Rules:
- Do NOT repeat any existing skills
- Mix technical skills and soft skills appropriate for the role
- Be specific (e.g. "Stakeholder Management" not just "Communication")
- Return ONLY a comma-separated list of 10 skills, nothing else`

  } else if (action === 'generate-summary') {
    const { name, targetRole, experience, education, skills } = data || {}
    const expText = (experience || [])
      .filter(e => e.jobTitle || e.company)
      .map(e => `${e.jobTitle || 'Role'} at ${e.company || 'Company'}`)
      .join(', ')
    const eduText = (education || [])
      .filter(e => e.degree || e.institution)
      .map(e => `${e.degree || 'Degree'} from ${e.institution || 'Institution'}`)
      .join(', ')
    prompt = `You are an expert CV writer. Write a professional CV summary (3-4 sentences).

Candidate: ${name || 'the candidate'}
Target Role: ${targetRole || 'not specified'}
Work Experience: ${expText || 'not provided'}
Education: ${eduText || 'not provided'}
Key Skills: ${(skills || []).join(', ') || 'not provided'}

Requirements:
- 3-4 sentences, under 80 words total
- Open with professional standing or years of experience (no "I")
- Mention 2-3 specific strengths relevant to the target role
- Close with what the candidate brings to an organisation
- No buzzwords: "passionate", "dynamic", "results-driven", "synergy"
- Professional, confident, third-person implied voice

Return ONLY the summary text.`

  } else {
    return res.status(400).json({ error: 'Invalid action.' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })
    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again.' })
    return res.status(500).json({ error: err.message || 'Failed to generate content.' })
  }
}
