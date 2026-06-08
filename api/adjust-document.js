const Anthropic = require('@anthropic-ai/sdk')

const systemPrompt = `You are an expert CV writer and career coach. When adjusting documents, maintain the same high professional standards: perfect grammar, strong action verbs, ATS-optimized keywords, and human-sounding language. Never introduce grammatical errors. Apply the user's requested change while improving overall quality.`

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

    const { documentText, instruction, documentType } = req.body || {}
    if (!documentText) return res.status(400).json({ error: 'documentText is required.' })
    if (!instruction) return res.status(400).json({ error: 'instruction is required.' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let typeLabel, formatInstructions

    if (documentType === 'cover-letter') {
      typeLabel = 'cover letter'
      formatInstructions = `IMPORTANT — PLAIN TEXT FORMATTING:
- Return PLAIN TEXT ONLY — no markdown symbols (no **, *, #, ##, __, _)
- For cover letter: preserve the exact business letter structure from the current document (sender header block at top, date, greeting, body paragraphs, closing). Use blank lines between each section. Flowing prose only — no bullets or markdown headers.`
    } else if (documentType === 'interview-questions') {
      typeLabel = 'interview preparation document'
      formatInstructions = `IMPORTANT — OUTPUT FORMAT (follow exactly):
- Return PLAIN TEXT ONLY — absolutely no markdown symbols (no **, *, #, ##, __, _)
- Output exactly 8 questions using this format for each:

1. [Question text here]
Answer Framework: [Framework text here]

2. [Question text here]
Answer Framework: [Framework text here]

(continue for all 8 questions)

- Each question MUST start on a new line with its number followed by a period and a space (e.g. "1. ")
- Do NOT use bold, headers, bullets, or any other formatting
- Keep exactly 8 questions unless the request explicitly asks for a different number`
    } else {
      typeLabel = 'CV'
      formatInstructions = `IMPORTANT — PLAIN TEXT FORMATTING:
- Return PLAIN TEXT ONLY — no markdown symbols (no **, *, #, ##, __, _)
- For CV: use ALL CAPS for section headers, • for bullets, ─── for dividers`
    }

    const prompt = `You are an expert ${typeLabel} writer. The user has a ${typeLabel} and wants a specific adjustment made to it.

=== CURRENT ${typeLabel.toUpperCase()} ===
${documentText}

=== USER'S ADJUSTMENT REQUEST ===
"${instruction}"

=== INSTRUCTIONS ===
Apply the requested adjustment while:
- Preserving the professional quality and tone of the document
- Keeping the same structure and format unless the request explicitly changes it
- Maintaining all factual information (dates, company names, achievements) unless asked to change them
- Ensuring the result still reads as natural, human-written content — no AI clichés
- If asked to shorten: remove the least impactful content first, never cut contact info or key achievements
- If asked to lengthen: add specific, substantive content — no padding or filler phrases
- If asked to change tone: adjust word choice and sentence structure while keeping the facts
- If asked to add keywords: weave them in naturally, never just append a keyword list

${formatInstructions}

Return ONLY the complete updated ${typeLabel} text — no commentary, no "Here is the updated version:", just the document itself.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Adjust document API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to apply adjustment.' })
  }
}
