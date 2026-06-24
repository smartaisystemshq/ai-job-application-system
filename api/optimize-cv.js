const Anthropic = require('@anthropic-ai/sdk')
const { CV_EXPERT_KNOWLEDGE } = require('../src/lib/expertKnowledge.js')
const { checkRateLimit } = require('../src/lib/rateLimit.js')
const { validateAndSanitize } = require('../src/lib/validation.js')
const { applySecurityHeaders } = require('../src/lib/securityHeaders.js')
const { runQualityAgent, validateStructure } = require('../src/lib/qualityAgent.js')

const sectionInstruction = `
SECTION DETECTION — CRITICAL:
Before writing the optimized CV, analyze the input CV and identify ALL sections present. Common sections include:
- Profil / Professional Summary
- Praktische Erfahrung / Work Experience
- Ausbildung / Education
- Kenntnisse / Skills (may include subsections like EDV, Sprachen/Languages)
- Sprachen / Languages — ALWAYS a separate section with its own heading
- Persönliche Stärken / Personal Strengths — ALWAYS a separate section with its own heading
- Projekte / Projects
- Ehrenamt / Volunteering
- Zertifikate / Certifications
- Hobbies / Interests

RULES:
1. Every section from the input must appear in the output with its own ALL-CAPS heading
2. Never merge sections — Sprachen and Persönliche Stärken are always separate
3. Never let a section heading appear at the bottom of a page with content starting on next page
4. Add proper spacing between sections
5. If a section would only have 1-2 lines on a new page, compress previous section slightly to keep it together
6. Subsections within Kenntnisse (like EDV, Persönliche Stärken, Sprachen) each get their own subheading
`

const languageInstruction = `LANGUAGE RULE — CRITICAL:
Detect the language of the JOB DESCRIPTION (not the CV).
- If job description is in English → write the ENTIRE optimized CV in English
- If job description is in German → write the ENTIRE optimized CV in German
- If job description is in another language → write in that language
- NEVER mix languages in the output
- The CV language must match the job description language so the candidate fits the role perfectly
This rule overrides everything else — output language = job description language always.`

const fitAssessmentInstruction = `After writing the optimized CV, add a SEPARATE section at the very end of your response using this exact format:

---JOB_FIT_ASSESSMENT---
SCORE: [number 1-10]
FIT: [STRONG/MODERATE/WEAK]
NOTE: [One sentence in the same language as the job description explaining the main strength or gap]
---END_ASSESSMENT---`

const systemPrompt = `${languageInstruction}

You are a world-class professional CV writer and career coach with 15+ years of experience helping candidates land jobs at top companies. You have deep expertise in ATS optimization, recruiter psychology, and industry-specific CV standards.

${CV_EXPERT_KNOWLEDGE}

${sectionInstruction}

YOUR TASK:
- Rewrite the candidate's CV to perfectly match the job description
- Apply every best practice from the knowledge base above
- Ensure grammatical perfection — especially in German (never create sentence fragments)
- Use strong action verbs and quantify achievements
- Mirror keywords from the job description naturally
- Output clean plain text with no markdown symbols (no #, **, *, --)
- Detect ALL sections from the input and preserve each as a separate ALL-CAPS heading
- Section headers in ALL CAPS
- Bullet points use • character only
- Fit content to one page worth of text
- Every sentence must be grammatically complete and correct

CONTACT DATA RULE — CRITICAL:
Extract ALL contact information from the original CV and include it at the top of the optimized CV. This includes:
- Full name
- Email address
- Phone number
- Full street address and house number
- Postal code and city
- Country (if present)
- LinkedIn URL (if present)
- Website/Portfolio (if present)

Never omit any contact information that exists in the original CV. Copy it exactly as provided — do not change, shorten or reformat contact details. Place all contact info directly below the name in the header section.

${fitAssessmentInstruction}`

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')
  applySecurityHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const rateLimit = checkRateLimit(req)
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: rateLimit.message, retryAfter: rateLimit.retryAfter })
  }

  const MAX_BODY_SIZE = 4000000
  const bodyStr = JSON.stringify(req.body)
  if (bodyStr.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request too large.' })
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const { cv, jobDescription, cvPdf, jdPdf } = req.body || {}
    if (!jobDescription && !jdPdf) return res.status(400).json({ error: 'jobDescription is required.' })
    if (!cv && !cvPdf) return res.status(400).json({ error: 'Either cv text or cvPdf is required.' })

    let sanitizedCv = cv
    let sanitizedJd = jobDescription

    if (cv) {
      const cvValidation = validateAndSanitize(cv, 'cvText')
      if (!cvValidation.valid) return res.status(400).json({ error: cvValidation.error })
      sanitizedCv = cvValidation.value
    }

    if (jobDescription) {
      const jdValidation = validateAndSanitize(jobDescription, 'jobDescription')
      if (!jdValidation.valid) return res.status(400).json({ error: jdValidation.error })
      sanitizedJd = jdValidation.value
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let userContent

    if (cvPdf) {
      const jdPart = jdPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } }
        : { type: 'text', text: `=== JOB DESCRIPTION ===\n${sanitizedJd}` }

      userContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cvPdf } },
        jdPart,
      ]
    } else {
      const jdSection = jdPdf
        ? [
            { type: 'text', text: `=== ORIGINAL CV ===\n${sanitizedCv}` },
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: jdPdf } },
          ]
        : `=== ORIGINAL CV ===\n${sanitizedCv}\n\n=== JOB DESCRIPTION ===\n${sanitizedJd}`

      userContent = jdSection
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawOutput = message.content[0].text

    let cvText = rawOutput
    let fitAssessment = null
    const assessmentMatch = rawOutput.match(/---JOB_FIT_ASSESSMENT---([\s\S]*?)---END_ASSESSMENT---/)
    if (assessmentMatch) {
      cvText = rawOutput.replace(/---JOB_FIT_ASSESSMENT---[\s\S]*?---END_ASSESSMENT---/, '').trim()
      const assessmentText = assessmentMatch[1]
      const scoreMatch = assessmentText.match(/SCORE:\s*(\d+)/)
      const fitMatch = assessmentText.match(/FIT:\s*(STRONG|MODERATE|WEAK)/)
      const noteMatch = assessmentText.match(/NOTE:\s*(.+)/)
      fitAssessment = {
        score: scoreMatch ? parseInt(scoreMatch[1]) : null,
        fit: fitMatch ? fitMatch[1] : null,
        note: noteMatch ? noteMatch[1].trim() : null
      }
    }

    const { text: cleanOutput, issues } = runQualityAgent(cvText, 'cv')
    const warnings = validateStructure(cleanOutput, 'cv')
    if (warnings.length > 0) { console.warn('[Quality Agent] CV warnings:', warnings) }
    return res.status(200).json({ result: cleanOutput, fitAssessment, qualityIssues: issues })
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key. Please contact support.' })
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' })
    return res.status(500).json({ error: err.message || 'Failed to optimise CV. Please try again.' })
  }
}
