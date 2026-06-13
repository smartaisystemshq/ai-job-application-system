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

    const { action, data } = req.body || {}
    if (!action) return res.status(400).json({ error: 'action is required.' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let prompt

    if (action === 'generate-bullets') {
      const { jobTitle, company, description, targetRole } = data || {}
      if (!description) return res.status(400).json({ error: 'description is required.' })
      prompt = `You are an elite CV writer. Generate exactly 4 CV bullet points for this work experience entry.

Job Title: ${jobTitle || 'Not specified'}
Company: ${company || 'Not specified'}
Target Role (candidate is applying for): ${targetRole || 'Not specified'}
Candidate's description of their work: ${description}

REQUIREMENTS FOR EACH BULLET:
- Start with the strongest possible action verb: Spearheaded, Architected, Doubled, Slashed, Launched, Negotiated, Automated, Secured, Mentored, Overhauled, Streamlined, Drove
- Format: [Action verb] + [what/how] + [measurable result or scale]
- Quantify aggressively: percentages, revenue, headcount, time saved, volume — if the description doesn't have numbers, make a realistic inference based on the role level and write "[add your specific metric]" at the end
- Maximum 18 words per bullet
- Each bullet must demonstrate impact, not just describe a task
- Tailor to the target role if one is specified

Return exactly 4 bullet points. Each starts with • on its own line. No preamble, no extra text, no numbering.`

    } else if (action === 'suggest-skills') {
      const { targetRole, existingSkills } = data || {}
      if (!targetRole) return res.status(400).json({ error: 'targetRole is required.' })
      prompt = `You are a senior recruiter and career expert. Suggest exactly 10 highly relevant skills for a "${targetRole}" position.

Skills the candidate already has listed: ${(existingSkills || []).join(', ') || 'none listed'}

RULES:
- Do NOT repeat any existing skills
- Mix: 60% technical/hard skills specific to this role, 40% high-value soft skills that actually matter for this role
- Be specific and searchable: "Stakeholder Management" not "Communication"; "Agile/Scrum" not "Project Management"
- For technical roles: include specific tools, languages, frameworks, or methodologies
- These should be skills that would impress a recruiter reading the CV for this exact role
- Return ONLY a comma-separated list of 10 skills, nothing else. No numbering, no bullets, no explanation.`

    } else if (action === 'generate-summary') {
      const { name, targetRole, jobDescription, experience, projects, education, skills } = data || {}
      const expText = (experience || [])
        .filter(e => e.jobTitle || e.company)
        .map(e => `${e.jobTitle || 'Role'} at ${e.company || 'Company'} (${e.startDate || ''}${e.endDate ? ' – ' + e.endDate : ''})`)
        .join('; ')
      const eduText = (education || [])
        .filter(e => e.institution?.trim())
        .map(e => [e.degree, e.field, e.institution].filter(s => s?.trim()).join(' — '))
        .join(', ')
      const projText = (projects || [])
        .filter(p => p.title?.trim())
        .map(p => [p.title, p.year, p.description].filter(s => s?.trim()).join(' — '))
        .join('; ')
      prompt = `You are an elite CV writer. Write a professional summary section (3 sentences, under 75 words).

Candidate name: ${name || 'the candidate'}
Target role: ${targetRole || 'not specified'}
${jobDescription ? `Job description to tailor to:\n${jobDescription}\n` : ''}Work experience: ${expText || 'not provided'}
Education: ${eduText || 'not provided'}
Key skills: ${(skills || []).join(', ') || 'not provided'}
${projText ? `Projects & achievements: ${projText}` : ''}

REQUIREMENTS:
- Sentence 1: Professional identity + years/level of experience relevant to the target role (implied third-person, no "I")
- Sentence 2: Two specific strengths or areas of expertise — make these concrete and aligned with the target role
- Sentence 3: What the candidate delivers for organisations — quantified if possible, otherwise outcome-focused
- Zero banned phrases: "passionate", "dynamic", "results-driven", "synergy", "team player", "motivated", "detail-oriented"
- Reads like it was written by a skilled human — specific, confident, direct
- Under 75 words total
${jobDescription ? '- Tailor keywords and focus areas naturally to match the job description\n' : ''}
PLAIN TEXT ONLY — no markdown, no **, no #. Just the paragraph text.

GRAMMAR: Review the summary for grammatical correctness — complete sentences, natural phrasing, professional tone.

Return ONLY the summary text. No heading, no "Here is your summary:", just the paragraph.`

    } else {
      return res.status(400).json({ error: 'Invalid action.' })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      temperature: 0,
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
