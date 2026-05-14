const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jobDescription } = req.body

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required' })
  }

  if (jobDescription.length > 5000) {
    return res.status(400).json({ error: 'Job description too long. Please shorten it.' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: `You are an expert interview coach who helps candidates prepare for job interviews. You analyse job descriptions to identify the key competencies, challenges, and skills being assessed, then generate targeted interview questions with detailed STAR framework guidance.

STAR framework: Situation, Task, Action, Result

For each question you provide:
1. The likely interview question
2. Why interviewers ask it (what they're really assessing)
3. A STAR answer framework with specific guidance on what to cover in each section

Format your response as exactly 8 questions using this structure for each:

**Question [N]: [The question]**
*Why they ask this:* [Brief explanation]

**STAR Framework:**
- **Situation:** [What context to set up]
- **Task:** [What challenge or responsibility to describe]
- **Action:** [What specific actions to highlight — be concrete]
- **Result:** [What outcome metrics and learnings to mention]

---

Generate a mix of: behavioural questions, technical/role-specific questions, and situational questions based on the job description.`,
      messages: [
        {
          role: 'user',
          content: `Generate 8 interview questions with STAR answer frameworks for this role:

${jobDescription}`
        }
      ]
    })

    const result = message.content[0].type === 'text' ? message.content[0].text : ''
    return res.status(200).json({ result })
  } catch (error) {
    if (error.status === 401) {
      return res.status(500).json({ error: 'Invalid API key configuration. Please contact support.' })
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' })
    }
    if (error.status === 529) {
      return res.status(503).json({ error: 'AI service is overloaded. Please try again shortly.' })
    }
    console.error('Interview questions error:', error.message)
    return res.status(500).json({ error: 'Failed to generate questions. Please try again.' })
  }
}
