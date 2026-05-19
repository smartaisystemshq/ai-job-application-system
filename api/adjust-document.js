const Anthropic = require('@anthropic-ai/sdk')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { documentText, instruction, documentType } = req.body || {}
  if (!documentText) return res.status(400).json({ error: 'documentText is required.' })
  if (!instruction) return res.status(400).json({ error: 'instruction is required.' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const typeLabel = documentType === 'cover-letter' ? 'cover letter' : 'CV'

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

IMPORTANT — PLAIN TEXT FORMATTING:
- Return PLAIN TEXT ONLY — no markdown symbols (no **, *, #, ##, __, _)
- For CV: use ALL CAPS for section headers, • for bullets, ─── for dividers
- For cover letter: preserve the exact business letter structure from the current document (sender header block at top, date, greeting, body paragraphs, closing). Use blank lines between each section. Flowing prose only — no bullets or markdown headers.

Return ONLY the complete updated ${typeLabel} text — no commentary, no "Here is the updated version:", just the document itself.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    return res.status(200).json({ result: message.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to apply adjustment.' })
  }
}
