// PDF via pdfmake, Word via docx

let _pdfMake = null

async function loadPdfMake() {
  if (_pdfMake) return _pdfMake

  const [pdfMakeMod, vfsMod] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])

  const pdfMake = pdfMakeMod.default || pdfMakeMod
  // vfs_fonts exports a flat map: { "Roboto-Regular.ttf": base64, ... }
  const raw = vfsMod?.default || vfsMod

  // pdfmake 0.3.x uses addVirtualFileSystem() — not the legacy .vfs property
  if (typeof pdfMake.addVirtualFileSystem === 'function') {
    pdfMake.addVirtualFileSystem(raw)
  } else {
    // Fallback for older builds
    pdfMake.vfs = raw?.pdfMake?.vfs || raw?.vfs || raw
  }

  _pdfMake = pdfMake
  return pdfMake
}

// ── Markdown stripper ────────────────────────────────────────────────────────

export function stripMarkdown(text) {
  if (!text) return text
  return text
    .split('\n')
    .map(line => {
      // Convert ## HEADER → HEADER (uppercase, let parser recognise as section)
      const headingMatch = line.match(/^#{1,6}\s+(.+)$/)
      if (headingMatch) return headingMatch[1].toUpperCase()

      let l = line
      // Remove bold markers **text** → text
      l = l.replace(/\*\*([^*\n]+)\*\*/g, '$1')
      // Remove __bold__ → text
      l = l.replace(/__([^_\n]+)__/g, '$1')
      // Convert "* bullet" at start → "• bullet"
      l = l.replace(/^\s*\*\s+/, '• ')
      // Remove remaining *italic* markers (not bullets)
      if (!l.startsWith('•')) {
        l = l.replace(/\*([^*\n]+)\*/g, '$1')
      }
      // Remove _italic_ but not mid-word underscores
      l = l.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '$1')
      // Remove backtick code markers
      l = l.replace(/`([^`\n]+)`/g, '$1')
      // Convert -- to – (en-dash) for cleaner typography
      l = l.replace(/--/g, '–')
      return l
    })
    .join('\n')
}

// ── Line parser ──────────────────────────────────────────────────────────────

function isSectionHeader(text) {
  const clean = text.replace(/^[▌►▸•\-*]\s*/, '').trim()
  return (
    clean.length >= 3 &&
    clean.length <= 70 &&
    clean === clean.toUpperCase() &&
    !/^[\+\d]/.test(clean) &&
    !clean.includes('@') &&
    !/^[•▸▌►\-*]/.test(clean)
  )
}

export function parseDocumentLines(text) {
  const rawLines = text.split('\n')
  const result = []
  let nameFound = false
  let contactCount = 0

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i]
    const trimmed = raw.trim()

    if (!trimmed) { result.push({ type: 'empty' }); continue }

    if (/^[─━═\-=]{3,}$/.test(trimmed)) { result.push({ type: 'divider' }); continue }

    if (!nameFound) {
      nameFound = true
      result.push({ type: 'name', text: trimmed })
      continue
    }

    const looksContact =
      contactCount < 3 &&
      !isSectionHeader(trimmed) &&
      (trimmed.includes('@') ||
        /^\+?[\d\s\-().]{7,}$/.test(trimmed) ||
        trimmed.toLowerCase().includes('linkedin') ||
        trimmed.toLowerCase().includes('http') ||
        trimmed.toLowerCase().includes('www') ||
        (i <= 4 && trimmed.length < 100 && !isSectionHeader(trimmed) &&
          !/^[•▸▌►\-*]/.test(trimmed) && !/\d{4}/.test(trimmed)))

    if (looksContact) { contactCount++; result.push({ type: 'contact', text: trimmed }); continue }

    if (isSectionHeader(trimmed)) {
      result.push({ type: 'header', text: trimmed.replace(/^[▌►▸]\s*/, '') })
      continue
    }

    if (/^[•▸▌►]\s/.test(trimmed) || /^[-*]\s/.test(trimmed)) {
      result.push({ type: 'bullet', text: trimmed.replace(/^[•▸▌►\-*]\s+/, '') })
      continue
    }

    result.push({ type: 'body', text: trimmed })
  }

  return result
}

function getOptimalFontSize(text) {
  const lines = parseDocumentLines(text)
  let effective = 0
  const CPL = 90

  for (const l of lines) {
    if (l.type === 'empty') { effective += 0.3; continue }
    if (l.type === 'divider') continue
    if (l.type === 'name') { effective += 2.5; continue }
    if (l.type === 'contact') { effective += 1.1; continue }
    if (l.type === 'header') { effective += 2.0; continue }
    effective += Math.max(1, Math.ceil((l.text?.length || 0) / CPL))
  }

  if (effective <= 53) return 10.5
  if (effective <= 56) return 10.0
  if (effective <= 60) return 9.5
  if (effective <= 65) return 9.0
  return 8.5
}

// ── Template-specific PDF builders ──────────────────────────────────────────

function buildMinimalPDF(text, bodySize) {
  const lines = parseDocumentLines(text)
  const content = []
  const nameSize = Math.round(bodySize + 7)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5

  for (const line of lines) {
    switch (line.type) {
      case 'empty':
        content.push({ text: ' ', fontSize: bodySize * 0.5, margin: [0, 0, 0, 0] }); break
      case 'divider':
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: 515, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 2, 0, 3] }); break
      case 'name':
        content.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 3] }); break
      case 'contact':
        content.push({ text: line.text, fontSize: contactSize, color: '#555555', margin: [0, 0, 0, 1] }); break
      case 'header':
        content.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, 8, 0, 1] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: '#888888' }], margin: [0, 0, 0, 3] }); break
      case 'bullet':
        content.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        content.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: [40, 36, 40, 36],
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight: 1.28 },
    content,
  }
}

function buildModernPDF(text, bodySize) {
  const lines = parseDocumentLines(text)
  const content = []
  const nameSize = Math.round(bodySize + 7)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const GREEN = '#1D9E75'

  // Green top accent bar
  content.push({ canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 4, r: 0, color: GREEN }], margin: [0, 0, 0, 8] })

  for (const line of lines) {
    switch (line.type) {
      case 'empty':
        content.push({ text: ' ', fontSize: bodySize * 0.5, margin: [0, 0, 0, 0] }); break
      case 'divider':
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: 515, y2: 1, lineWidth: 0.4, lineColor: '#dddddd' }], margin: [0, 2, 0, 3] }); break
      case 'name':
        content.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 3] }); break
      case 'contact':
        content.push({ text: line.text, fontSize: contactSize, color: '#666666', margin: [0, 0, 0, 1] }); break
      case 'header':
        content.push({ text: line.text, fontSize: headerSize, bold: true, color: GREEN, margin: [0, 10, 0, 1] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.0, lineColor: GREEN }], margin: [0, 0, 0, 4] }); break
      case 'bullet':
        content.push({ columns: [{ text: '▸', width: 12, fontSize: bodySize, color: GREEN }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        content.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: [40, 36, 40, 36],
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight: 1.28 },
    content,
  }
}

function buildClassicPDF(text, bodySize) {
  const lines = parseDocumentLines(text)
  const content = []
  const nameSize = Math.round(bodySize + 8)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5

  for (const line of lines) {
    switch (line.type) {
      case 'empty':
        content.push({ text: ' ', fontSize: bodySize * 0.5, margin: [0, 0, 0, 0] }); break
      case 'divider':
        content.push({
          columns: [
            { canvas: [{ type: 'line', x1: 0, y1: 1, x2: 240, y2: 1, lineWidth: 0.5, lineColor: '#999999' }] },
            { canvas: [{ type: 'line', x1: 0, y1: 1, x2: 240, y2: 1, lineWidth: 0.5, lineColor: '#999999' }] },
          ],
          margin: [0, 2, 0, 3],
        }); break
      case 'name':
        content.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', alignment: 'center', margin: [0, 0, 0, 2] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#333333' }], margin: [0, 0, 0, 1] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#333333' }], margin: [0, 2, 0, 3] }); break
      case 'contact':
        content.push({ text: line.text, fontSize: contactSize, color: '#555555', alignment: 'center', margin: [0, 0, 0, 1] }); break
      case 'header':
        content.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, 10, 0, 2] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.8, lineColor: '#555555' }], margin: [0, 0, 0, 4] }); break
      case 'bullet':
        content.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [8, 1, 0, 1] }); break
      case 'body':
        content.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: [44, 38, 44, 38],
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight: 1.30 },
    content,
  }
}

function buildExecutivePDF(text, bodySize) {
  const lines = parseDocumentLines(text)
  const content = []
  const nameSize = Math.round(bodySize + 8)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const GREEN = '#1D9E75'

  for (const line of lines) {
    switch (line.type) {
      case 'empty':
        content.push({ text: ' ', fontSize: bodySize * 0.5, margin: [0, 0, 0, 0] }); break
      case 'divider':
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: 515, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 2, 0, 3] }); break
      case 'name':
        content.push({ text: line.text.toUpperCase(), fontSize: nameSize, bold: true, color: '#111111', letterSpacing: 2, margin: [0, 0, 0, 4] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: GREEN }], margin: [0, 0, 0, 6] }); break
      case 'contact':
        content.push({ text: line.text, fontSize: contactSize, color: '#555555', margin: [0, 0, 0, 1] }); break
      case 'header':
        content.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', characterSpacing: 0.5, margin: [0, 10, 0, 1] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: '#aaaaaa' }], margin: [0, 0, 0, 4] }); break
      case 'bullet':
        content.push({ columns: [{ text: '—', width: 12, fontSize: bodySize, color: '#666666' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        content.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: [46, 40, 46, 40],
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight: 1.32 },
    content,
  }
}

function buildTechPDF(text, bodySize) {
  const lines = parseDocumentLines(text)
  const GREEN = '#1D9E75'
  const SIDEBAR_BG = '#1a1a1a'
  const nameSize = Math.round(bodySize + 6)
  const contactSize = bodySize - 2
  const headerSize = bodySize + 0.5

  const leftLines = []
  const rightLines = []
  let inSkills = false

  for (const line of lines) {
    if (line.type === 'name' || line.type === 'contact') {
      leftLines.push(line)
    } else if (line.type === 'header' && (line.text === 'SKILLS' || line.text === 'CORE COMPETENCIES' || line.text === 'TECHNICAL SKILLS')) {
      inSkills = true
      leftLines.push(line)
    } else if (inSkills && (line.type === 'body' || line.type === 'bullet' || line.type === 'empty')) {
      leftLines.push(line)
    } else {
      inSkills = false
      rightLines.push(line)
    }
  }

  const leftContent = []
  for (const line of leftLines) {
    switch (line.type) {
      case 'name':
        leftContent.push({ text: line.text, fontSize: nameSize - 2, bold: true, color: '#ffffff', margin: [0, 0, 0, 4] }); break
      case 'contact':
        leftContent.push({ text: line.text, fontSize: contactSize, color: '#aaaaaa', margin: [0, 0, 0, 2] }); break
      case 'header':
        leftContent.push({ text: line.text, fontSize: bodySize - 0.5, bold: true, color: GREEN, margin: [0, 10, 0, 3] })
        leftContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 135, y2: 0, lineWidth: 0.8, lineColor: GREEN }], margin: [0, 0, 0, 4] }); break
      case 'bullet':
        leftContent.push({ text: '• ' + line.text, fontSize: bodySize - 1, color: '#cccccc', margin: [0, 1, 0, 1] }); break
      case 'body':
        leftContent.push({ text: line.text, fontSize: bodySize - 1, color: '#cccccc', margin: [0, 1, 0, 1] }); break
      case 'empty':
        leftContent.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] }); break
    }
  }

  const rightContent = []
  for (const line of rightLines) {
    switch (line.type) {
      case 'empty':
        rightContent.push({ text: ' ', fontSize: bodySize * 0.5, margin: [0, 0, 0, 0] }); break
      case 'divider':
        rightContent.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: 355, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 2, 0, 3] }); break
      case 'header':
        rightContent.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, 8, 0, 1] })
        rightContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 355, y2: 0, lineWidth: 0.8, lineColor: GREEN }], margin: [0, 0, 0, 3] }); break
      case 'bullet':
        rightContent.push({ columns: [{ text: '▸', width: 10, fontSize: bodySize, color: GREEN }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [2, 1, 0, 1] }); break
      case 'body':
        rightContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 0],
    background: [
      { canvas: [{ type: 'rect', x: 0, y: 0, w: 170, h: 842, color: SIDEBAR_BG }] }
    ],
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight: 1.28 },
    content: [
      {
        columns: [
          {
            width: 170,
            stack: leftContent,
            margin: [16, 32, 12, 32],
          },
          {
            width: '*',
            stack: rightContent,
            margin: [16, 32, 32, 32],
          },
        ],
      },
    ],
  }
}

function buildPDFDocDef(text, bodySize, template) {
  switch (template) {
    case 'modern':    return buildModernPDF(text, bodySize)
    case 'classic':   return buildClassicPDF(text, bodySize)
    case 'executive': return buildExecutivePDF(text, bodySize)
    case 'tech':      return buildTechPDF(text, bodySize)
    default:          return buildMinimalPDF(text, bodySize)
  }
}

// ── Cover letter PDF builder ─────────────────────────────────────────────────

function buildCoverLetterPDFDocDef(text, bodySize) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  const content = []

  for (const para of paragraphs) {
    const cleaned = para.replace(/\n/g, ' ').trim()
    if (!cleaned) continue
    content.push({
      text: cleaned,
      fontSize: bodySize,
      color: '#2a2a2a',
      margin: [0, 0, 0, bodySize * 1.2],
      lineHeight: 1.55,
    })
  }

  return {
    pageSize: 'A4',
    pageMargins: [60, 56, 60, 56],
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight: 1.55 },
    content,
  }
}

// ── Public: download as PDF ──────────────────────────────────────────────────

export async function downloadAsPDF(text, filename, template = 'minimal', isLetter = false) {
  const cleanText = stripMarkdown(text)
  const pdfMake = await loadPdfMake()
  const bodySize = isLetter ? 11 : getOptimalFontSize(cleanText)
  const docDef = isLetter
    ? buildCoverLetterPDFDocDef(cleanText, bodySize)
    : buildPDFDocDef(cleanText, bodySize, template)

  // pdfmake 0.3.x: getBlob() returns a Promise, not a callback
  const pdf = pdfMake.createPdf(docDef)
  const blob = await pdf.getBlob()
  if (!blob) throw new Error('PDF generation returned empty blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename + '.pdf'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
}

// ── Public: download as Word (.docx) ────────────────────────────────────────

export async function downloadAsWord(text, filename, template = 'minimal', isLetter = false) {
  const cleanText = stripMarkdown(text)
  const {
    Document, Packer, Paragraph, TextRun, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  } = await import('docx')

  // Cover letter: simple paragraphs
  if (isLetter) {
    const paras = cleanText.split(/\n\n+/).filter(p => p.trim()).map(para =>
      new Paragraph({
        children: [new TextRun({ text: para.replace(/\n/g, ' ').trim(), size: 22, font: 'Calibri', color: '2a2a2a' })],
        spacing: { after: 240, line: 360 },
      })
    )
    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1100, right: 1200, bottom: 1100, left: 1200 } } }, children: paras }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename + '.docx'; a.style.display = 'none'
    document.body.appendChild(a); a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 200)
    return
  }

  const lines = parseDocumentLines(cleanText)
  const GREEN = '1D9E75'
  const nameHalfPt = 44
  const contactHalfPt = 18
  const headerHalfPt = 22
  const bodyHalfPt = 20

  function buildParagraphs(linesToProcess, isDarkBg = false) {
    const children = []
    const textColor = isDarkBg ? 'ffffff' : '2a2a2a'
    const headingColor = isDarkBg ? 'ffffff' : '111111'
    const subColor = isDarkBg ? 'aaaaaa' : '555555'
    const accentColor = isDarkBg ? '1D9E75' : GREEN

    for (const line of linesToProcess) {
      switch (line.type) {
        case 'name': {
          const nameText = template === 'executive' ? line.text.toUpperCase() : line.text
          children.push(new Paragraph({
            children: [new TextRun({ text: nameText, bold: true, size: isDarkBg ? nameHalfPt - 4 : nameHalfPt, font: 'Calibri', color: isDarkBg ? 'ffffff' : '111111' })],
            spacing: { after: template === 'executive' ? 40 : 60 },
          }))
          if (template === 'executive' || template === 'modern') {
            children.push(new Paragraph({
              children: [new TextRun({ text: '' })],
              border: { bottom: { style: BorderStyle.SINGLE, size: template === 'executive' ? 8 : 12, color: GREEN, space: 1 } },
              spacing: { before: 0, after: 60 },
            }))
          } else if (template === 'classic') {
            children.push(new Paragraph({
              children: [new TextRun({ text: '' })],
              border: { bottom: { style: BorderStyle.DOUBLE, size: 8, color: '333333', space: 1 } },
              spacing: { before: 0, after: 40 },
            }))
          } else if (isDarkBg) {
            children.push(new Paragraph({
              children: [new TextRun({ text: '' })],
              border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GREEN, space: 1 } },
              spacing: { before: 0, after: 40 },
            }))
          }
          break
        }
        case 'contact':
          children.push(new Paragraph({
            children: [new TextRun({ text: line.text, size: contactHalfPt, font: 'Calibri', color: subColor })],
            spacing: { after: 30 },
            alignment: template === 'classic' ? 'center' : 'left',
          })); break
        case 'divider':
          children.push(new Paragraph({
            children: [new TextRun({ text: '' })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: isDarkBg ? '444444' : 'cccccc', space: 1 } },
            spacing: { before: 60, after: 60 },
          })); break
        case 'header': {
          const headerColor = isDarkBg ? accentColor : (template === 'modern' ? GREEN : headingColor)
          const borderColor = isDarkBg ? accentColor : (template === 'modern' ? GREEN : '888888')
          children.push(new Paragraph({
            children: [new TextRun({ text: line.text, bold: true, size: headerHalfPt, font: 'Calibri', color: headerColor })],
            border: { bottom: { style: BorderStyle.SINGLE, size: (template === 'modern' || isDarkBg) ? 10 : 6, color: borderColor, space: 1 } },
            spacing: { before: 200, after: 80 },
          })); break
        }
        case 'bullet':
          children.push(new Paragraph({
            children: [new TextRun({ text: (template === 'executive' ? '—  ' : '•  ') + line.text, size: bodyHalfPt, font: 'Calibri', color: textColor })],
            indent: { left: 280 },
            spacing: { after: 40 },
          })); break
        case 'body':
          children.push(new Paragraph({
            children: [new TextRun({ text: line.text, size: bodyHalfPt, font: 'Calibri', color: textColor })],
            spacing: { after: 40 },
          })); break
        case 'empty':
          children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 80 } })); break
      }
    }
    return children
  }

  let sections

  if (template === 'tech') {
    const leftLines = []
    const rightLines = []
    let inSkills = false

    for (const line of lines) {
      if (line.type === 'name' || line.type === 'contact') {
        leftLines.push(line)
      } else if (line.type === 'header' && (line.text === 'SKILLS' || line.text === 'CORE COMPETENCIES' || line.text === 'TECHNICAL SKILLS')) {
        inSkills = true
        leftLines.push(line)
      } else if (inSkills && (line.type === 'body' || line.type === 'bullet' || line.type === 'empty')) {
        leftLines.push(line)
      } else {
        inSkills = false
        rightLines.push(line)
      }
    }

    const leftChildren = buildParagraphs(leftLines, true)
    const rightChildren = buildParagraphs(rightLines, false)

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: leftChildren,
              shading: { fill: '1a1a1a', type: ShadingType.CLEAR },
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
            }),
            new TableCell({
              width: { size: 67, type: WidthType.PERCENTAGE },
              children: rightChildren,
              margins: { top: 200, bottom: 200, left: 300, right: 200 },
            }),
          ],
        }),
      ],
    })

    sections = [{ properties: { page: { margin: { top: 600, right: 600, bottom: 600, left: 600 } } }, children: [table] }]
  } else {
    const children = buildParagraphs(lines)
    sections = [{
      properties: { page: { margin: { top: 850, right: 1000, bottom: 850, left: 1000 } } },
      children,
    }]
  }

  const doc = new Document({ sections })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename + '.docx'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
}
