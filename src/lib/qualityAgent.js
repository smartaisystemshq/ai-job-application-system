const PERFECT_CV_KNOWLEDGE = `
PERFECT CV STANDARDS 2025:

STRUCTURE:
- Name always first, largest element (18-22pt)
- Contact info directly below name on one line
- Professional Summary: 3-5 sentences, no "I am" opener, starts with professional identity
- Work Experience: reverse chronological, company + role + dates + 3-5 bullet points each
- Education: reverse chronological, institution + degree + dates
- Skills: categorized (Technical, Languages, Soft Skills)
- Each section has ALL-CAPS heading with visual separator
- Consistent spacing throughout

GERMAN CV SPECIFICS:
- Formal Sie-form never used in CV itself
- "Lebenslauf" optional as title
- Photo common (top right, 4x5cm, professional)
- Date of birth sometimes included
- Nationality sometimes included
- Hobbies section common
- Perfect grammar mandatory — no sentence fragments
- WRONG: "Kaufmännisch ausgebildeter Nachwuchskraft" (fragment)
- CORRECT: "Kaufmännisch ausgebildete Nachwuchskraft" (complete adjective agreement)

CONTENT RULES:
- No markdown symbols (#, **, *, --)
- No placeholder text ([add metric], [insert], [your name])
- No mixed languages (German CV = 100% German)
- Bullet points use • character only
- Dates consistent format throughout (MM/YYYY or Month YYYY)
- Action verbs: verwaltete, koordinierte, entwickelte, steigerte, reduzierte
- Quantify achievements where possible

LAYOUT RULES:
- Never orphan a section heading at bottom of page
- Never start content on new page without heading
- Consistent margins (min 15mm all sides)
- Line height 1.4-1.6 for readability
- Font size 9.5-11pt for body text
`;

const PERFECT_COVER_LETTER_KNOWLEDGE = `
PERFECT COVER LETTER STANDARDS 2025:

STRUCTURE:
1. Sender name + full contact info
2. Date (city, den DD. Month YYYY for German)
3. Recipient company + address
4. Subject line (Betreff:)
5. Salutation (Sehr geehrte/r for German, Dear for English)
6. Opening paragraph: specific hook about company
7. Middle paragraph: 2-3 achievements matching role
8. Closing paragraph: confident call to action
9. Closing formula (Mit freundlichen Grüßen / Best regards)
10. Signature

LANGUAGE RULES:
- 100% German if CV is German — zero English words
- 100% English if CV is English — zero German words
- Never: "Ich bewerbe mich hiermit" (outdated)
- Never: "I am a passionate team player"
- Never: "I think outside the box"
- Max 250 words in body
- Specific to THIS company and THIS role

QUALITY CHECKS:
- No duplicate content
- No garbled characters (ñ, â, Ã)
- No markdown symbols
- No placeholder text
- Sender info matches CV exactly
`;

function runQualityAgent(text, type = 'cv') {
  if (!text || typeof text !== 'string') return { text: text || '', issues: ['Empty content'] };

  const issues = [];
  let result = text;

  const placeholderPatterns = [
    /\[spezifische Kennzahl.*?\]/gi,
    /\[add your specific metric\]/gi,
    /\[specific metric\]/gi,
    /\[Kennzahl.*?\]/gi,
    /\[insert.*?\]/gi,
    /\[add.*?\]/gi,
    /\[your.*?\]/gi,
    /\[füge.*?\]/gi,
    /\[Name\]/gi,
    /\[Company\]/gi,
    /\[Position\]/gi,
    /\[Datum\]/gi,
    /\[Date\]/gi,
    /\[X\]%/gi,
    /\[X\]/gi,
    /\[\d+%\]/gi,
    /\[.*?ergänzen.*?\]/gi,
    /\[.*?einfügen.*?\]/gi,
    /undefined/g,
  ];

  placeholderPatterns.forEach(pattern => {
    if (pattern.test(result)) {
      issues.push(`Placeholder removed: ${pattern}`);
      result = result.replace(pattern, '');
    }
  });

  result = result
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_{2}([^_]+)_{2}/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^\s*[-*+]\s/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.')
    .trim();

  if (/[#*_`]/.test(result)) {
    issues.push('Markdown symbols detected and removed');
  }

  if (/\[.*?\]/.test(result)) {
    issues.push('Placeholder text detected and removed');
  }

  if (type === 'cv') {
    const germanFragments = [
      [/^Kaufmännisch ausgebildeter\s+Nachwuchskraft/m, 'Kaufmännisch ausgebildete Nachwuchskraft'],
      [/^Erfahrener\s+Fachkraft/m, 'Erfahrene Fachkraft'],
      [/^Motivierter\s+Bewerber/m, 'Motivierter Bewerber'],
      [/^Engagierter\s+Mitarbeiter/m, 'Engagierter Mitarbeiter'],
      [/^Qualifizierter\s+Fachmann/m, 'Qualifizierter Fachmann'],
    ];

    germanFragments.forEach(([pattern, fix]) => {
      if (pattern.test(result)) {
        result = result.replace(pattern, fix);
        issues.push(`Grammar fragment fixed: ${fix}`);
      }
    });

    const requiredSections = ['PROFIL', 'PROFESSIONAL SUMMARY', 'ERFAHRUNG', 'EXPERIENCE', 'AUSBILDUNG', 'EDUCATION'];
    const hasRequiredSection = requiredSections.some(s => result.toUpperCase().includes(s));
    if (!hasRequiredSection) {
      issues.push('Warning: No main sections detected in CV output');
    }
  }

  if (type === 'cover-letter') {
    const hasGerman = /Sehr geehrte|Mit freundlichen|Bewerbung als/i.test(result);
    const hasEnglish = /Dear Hiring|Best regards|Application for/i.test(result);

    if (hasGerman && hasEnglish) {
      issues.push('CRITICAL: Mixed language detected in cover letter');
    }

    const lines = result.split('\n').filter(l => l.trim().length > 20);
    const seen = new Set();
    let hasDuplicate = false;
    for (const line of lines) {
      if (seen.has(line.trim())) { hasDuplicate = true; break; }
      seen.add(line.trim());
    }
    if (hasDuplicate) {
      issues.push('CRITICAL: Duplicate content detected in cover letter');
    }
  }

  if (/[ñâÃøŸœ]{2,}/.test(result)) {
    result = result.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFFĀ-ɏ]/g, '');
    issues.push('Garbled characters removed');
  }

  if (issues.length > 0) {
    console.log(`[Quality Agent] ${type} — ${issues.length} issue(s):`, issues);
  }

  return { text: result, issues };
}

function validateStructure(text, type = 'cv') {
  const warnings = [];

  if (!text || text.length < 100) {
    warnings.push('Output too short — may be incomplete');
  }

  if (text.length > 8000 && type === 'cv') {
    warnings.push('CV too long — may exceed one A4 page significantly');
  }

  if (type === 'cover-letter' && text.length > 3000) {
    warnings.push('Cover letter too long — should be under 250 words');
  }

  return warnings;
}

function validatePDFStructure(docDef) {
  const issues = [];

  function findCanvasRects(node, path = '') {
    if (!node || typeof node !== 'object') return;
    if (node.canvas) {
      node.canvas.forEach(shape => {
        if (shape.type === 'rect' && shape.h > 700) {
          issues.push(`Large canvas rect found at ${path} — height ${shape.h}pt may cause empty page overflow`);
        }
        if (shape.type === 'line' && shape.y2 > 700) {
          issues.push(`Long vertical line found at ${path} — may overflow to empty page`);
        }
      });
    }
    Object.entries(node).forEach(([key, val]) => {
      if (Array.isArray(val)) val.forEach((v, i) => findCanvasRects(v, `${path}.${key}[${i}]`));
      else if (val && typeof val === 'object') findCanvasRects(val, `${path}.${key}`);
    });
  }

  findCanvasRects(docDef);

  if (issues.length > 0) {
    console.warn('[Quality Agent] PDF structure issues:', issues);
  }

  return { valid: issues.length === 0, issues };
}

function hrReviewOutput(text, type = 'cv') {
  if (!text || typeof text !== 'string') return { approved: false, text: '', issues: ['Empty content'] };

  const issues = [];
  let result = text;

  const { text: cleaned, issues: cleanIssues } = runQualityAgent(text, type);
  result = cleaned;
  issues.push(...cleanIssues);

  const hardFailPatterns = [
    { pattern: /\[.*?\]/g, name: 'Bracket placeholder' },
    { pattern: /undefined/gi, name: 'Undefined value' },
    { pattern: /Your Name/gi, name: 'Name placeholder' },
    { pattern: /Company Name/gi, name: 'Company placeholder' },
  ];

  hardFailPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(result)) {
      result = result.replace(pattern, '');
      issues.push(`HR Agent removed: ${name}`);
    }
  });

  if (type === 'cv') {
    const lines = result.split('\n').filter(l => l.trim());
    if (lines.length < 5) {
      issues.push('WARNING: CV output seems too short');
    }
  }

  if (type === 'cover-letter') {
    const hasGreeting = /Sehr geehrte|Dear/i.test(result);
    const hasClosing = /freundlichen|regards/i.test(result);
    if (!hasGreeting) issues.push('WARNING: No salutation found in cover letter');
    if (!hasClosing) issues.push('WARNING: No closing found in cover letter');
  }

  const emptyBullets = result.match(/^[•·]\s*$/gm);
  if (emptyBullets) {
    result = result.replace(/^[•·]\s*$/gm, '');
    issues.push('Removed empty bullet points');
  }

  result = result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .trim();

  if (issues.length > 0) {
    console.log(`[HR Agent] ${type} — fixed ${issues.length} issues:`, issues);
  }

  return { approved: true, text: result, issues };
}

module.exports = { runQualityAgent, hrReviewOutput, validateStructure, validatePDFStructure };
