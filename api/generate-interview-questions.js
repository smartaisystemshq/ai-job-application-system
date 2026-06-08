const Anthropic = require('@anthropic-ai/sdk')
const { INTERVIEW_EXPERT_KNOWLEDGE } = require('./expertKnowledge.js')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jobDescription, language } = req.body

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required' })
  }

  if (jobDescription.length > 5000) {
    return res.status(400).json({ error: 'Job description too long. Please shorten it.' })
  }

  const systemPrompt = `You are a senior recruiter and interview coach with expertise across all industries. You know exactly what hiring managers look for and what questions reveal the best candidates.

${INTERVIEW_EXPERT_KNOWLEDGE}

YOUR TASK:
- Generate exactly 8 interview questions tailored to the specific role and company in the job description
- Include all question types from the knowledge base
- Each question must be specific to this role — no generic questions
- Provide a detailed answer framework for each question using STAR method
- Match the seniority level and industry of the job description
- Write entirely in ${language === 'DE' ? 'German' : 'English'}
- Questions should be challenging but fair`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate 8 interview questions with STAR answer frameworks for this role:\n\n${jobDescription}`
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
