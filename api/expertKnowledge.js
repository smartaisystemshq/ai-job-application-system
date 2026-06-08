// Knowledge Base Version: 2025.06
// Last updated: June 2025
// Sources: LinkedIn Talent Insights, Indeed Hiring Trends, XING Career Reports, Glassdoor Interview Data

const CV_EXPERT_KNOWLEDGE = `
EXPERT CV WRITING KNOWLEDGE BASE — Updated 2025/2026 Best Practices

CORE PRINCIPLES:
- A CV is a marketing document, not a biography. Every word must earn its place.
- Tailor every CV to the specific job description — generic CVs get rejected.
- ATS (Applicant Tracking Systems) scan CVs before humans see them. Keywords from the job description must appear naturally in the CV.
- Recruiters spend 6-10 seconds on initial CV scan. The top third of the CV is critical.

PROFESSIONAL SUMMARY — Best Practices:
- 3-4 sentences maximum. Opens with professional identity, adds 2-3 key strengths, closes with value proposition.
- Never start with "I am" or "Ich bin" — start with the professional profile directly.
- CORRECT German example: "Kaufmännisch ausgebildete Nachwuchskraft mit praktischer Erfahrung in..."
- WRONG: "Kaufmännisch ausgebildeter Nachwuchskraft mit..." (grammatically incorrect fragment)
- Include years of experience, core skills, and what the candidate brings to THIS specific role.
- Mirror language from the job description naturally.

WORK EXPERIENCE — Best Practices:
- Use strong action verbs: managed, developed, increased, reduced, coordinated, implemented, achieved
- German action verbs: verwaltete, entwickelte, steigerte, reduzierte, koordinierte, implementierte, erzielte
- Quantify achievements wherever possible: "Increased sales by 23%", "Managed team of 8", "Reduced processing time by 40%"
- If no specific numbers available, use relative terms: "significantly improved", "substantially reduced"
- Never use "responsible for" or "verantwortlich für" — replace with what was actually achieved
- Bullet points: 3-5 per role maximum. Most impactful first.
- Format: Job Title | Company | Location | Month Year – Month Year (or Present)

EDUCATION — Best Practices:
- List in reverse chronological order (most recent first)
- Include: Institution name, Degree/Qualification, Field of study, Dates
- For ongoing education: "seit [Year]" or "Since [Year] — ongoing"
- Only include grades if excellent (above 80% or equivalent)
- Skip elementary school unless relevant

SKILLS — Best Practices:
- Group into categories: Technical Skills, Languages, Soft Skills, Certifications
- Match skill level to reality — do not overstate
- Include software, tools, languages with proficiency levels
- Prioritize skills mentioned in the job description

ATS OPTIMIZATION:
- Use exact keywords from the job description
- Avoid tables, graphics, text boxes — ATS cannot read them
- Use standard section headings
- Save as PDF for human readers, but ensure text is selectable

COVER LETTER — Best Practices 2025:
- Maximum 250 words / one page
- Opening: specific hook related to the company or role — NOT "I am writing to apply for..."
- Paragraph 1: Why THIS company, why THIS role specifically
- Paragraph 2: 2-3 specific achievements that directly match the job requirements
- Paragraph 3: What you bring that others don't — your unique value
- Closing: confident call to action, not "I hope to hear from you"
- Tone: professional but human — not stiff, not overly casual
- Never use: "I am a passionate team player", "I think outside the box", "I am a fast learner"
- Always: reference specific aspects of the job description

INTERVIEW QUESTIONS — Best Practices:
- Use STAR method for behavioral questions: Situation, Task, Action, Result
- Questions should be role-specific, not generic
- Include: competency questions, behavioral questions, situational questions, culture-fit questions
- Answer frameworks should be specific to the role and industry mentioned in the job description
- Difficulty should match the seniority level implied by the job description

LANGUAGE QUALITY STANDARDS:
- German: formal Sie-form for all professional documents unless specified otherwise
- Perfect grammar is non-negotiable — proofread every sentence
- Vary sentence structure — avoid repetitive openings
- Use industry-specific terminology from the job description
- Avoid anglicisms in German documents unless industry standard
`

const COVER_LETTER_EXPERT_KNOWLEDGE = `
EXPERT COVER LETTER WRITING — 2025/2026 Standards

STRUCTURE:
1. Sender info (extracted from CV)
2. Date
3. Company address (if available from job description)
4. Subject line: Application for [Position] — [Your Name]
5. Salutation: "Dear [Hiring Manager Name]," if known, otherwise "Dear Hiring Team,"
6. Body: 3 paragraphs maximum
7. Professional closing: "Best regards," / "Mit freundlichen Grüßen,"
8. Full name

OPENING HOOKS THAT WORK:
- Reference a specific company achievement or product
- Connect your background directly to their need
- Lead with your strongest relevant achievement

WHAT NEVER TO WRITE:
- "I hereby apply for..." / "Hiermit bewerbe ich mich..."
- "I am a passionate..."
- "I believe I would be a great fit..."
- Long lists of skills (save for CV)
- Repetition of the entire CV

GERMAN COVER LETTER SPECIFICS:
- More formal than English equivalent
- Use "Sie" form consistently
- Subject line is standard in German applications
- Closing: "Mit freundlichen Grüßen" (standard) or "Mit besten Grüßen" (slightly warmer)
- Date format: [City], den [Day]. [Month] [Year]
`

const INTERVIEW_EXPERT_KNOWLEDGE = `
EXPERT INTERVIEW PREPARATION — 2025/2026

QUESTION TYPES TO ALWAYS INCLUDE:
1. Competency/Skills question (tests specific ability for the role)
2. Behavioral question (past experience predicts future performance)
3. Situational question (hypothetical scenario relevant to the role)
4. Motivation question (why this company/role)
5. Weakness/challenge question (self-awareness)
6. Culture fit question
7. Technical/role-specific question
8. Closing question (do you have questions for us)

ANSWER FRAMEWORK FORMAT:
- State the key point the interviewer is testing
- Give a STAR framework tailored to the specific role
- Include industry-specific examples where possible
- Warn about common mistakes for that question

LANGUAGE: Match the language of the job description exactly.
`

module.exports = { CV_EXPERT_KNOWLEDGE, COVER_LETTER_EXPERT_KNOWLEDGE, INTERVIEW_EXPERT_KNOWLEDGE }
