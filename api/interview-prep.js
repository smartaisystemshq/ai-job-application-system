const Anthropic = require('@anthropic-ai/sdk')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { jobDescription, jdPdf } = req.body || {}
  if (!jobDescription && !jdPdf) return res.status(400).json({ error: 'jobDescription is required.' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are an expert interview coach with deep experience in hiring for the role described below. Based on the job description, identify and prepare the candidate for the 8 most likely interview questions.

=== OUTPUT FORMAT ===
Return exactly 8 questions. For each question use this format:

1. [Question text]
Answer Framework: [2-4 sentence practical guide on how to answer this specific question — what structure to use, what interviewers are really testing for, what to include/avoid. Be specific to this role.]

2. [Question text]
Answer Framework: [...]

... continue for all 8 questions.

=== QUESTION SELECTION CRITERIA ===
Select questions that are actually likely to be asked, in this priority order:
1. Role-specific technical or competency questions (based on the listed requirements and responsibilities)
2. Behavioural questions that test the key competencies the role demands
3. Situational/hypothetical questions relevant to the role's challenges
4. One culture/motivation question relevant to this company type or sector

Make the answer frameworks genuinely useful — not generic advice like "use the STAR method." Explain WHAT to say for this specific question in this specific role.`

  try {
    let userContent

    if (jdPdf) {
      userContent = [
        { type: 'text', text: 'You are an expert interview coach. The document below is the job description. ' + prompt.replace('=== OUTPUT FORMAT ===', '=== JOB DESCRIPTION (see document above) ===\n\n=== OUTPUT FORMAT ===') },
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
      ]
    } else {
      userContent = `${prompt}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: userContent }],
    })

    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to generate interview questions. Please try again.' })
  }
}
