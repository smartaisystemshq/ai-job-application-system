const mammoth = require('mammoth')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fileData } = req.body || {}
  if (!fileData) return res.status(400).json({ error: 'fileData is required.' })

  try {
    const buffer = Buffer.from(fileData, 'base64')
    const result = await mammoth.extractRawText({ buffer })
    return res.status(200).json({ text: result.value })
  } catch (err) {
    console.error('DOCX extraction error:', err)
    return res.status(500).json({ error: 'Failed to extract text from DOCX file.' })
  }
}
