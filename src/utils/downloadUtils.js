// PDF via pdfmake, Word via docx

const PDF_FONTS = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
}

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

  pdfMake.fonts = PDF_FONTS
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

      // Convert horizontal rules --- / === / ___ → section divider
      if (/^\s*[-=_]{3,}\s*$/.test(line)) return '──────────────────────────────────────────────────────'

      let l = line
      // Remove bold markers **text** → text (do this before italic to avoid interference)
      l = l.replace(/\*\*\*([^*\n]+)\*\*\*/g, '$1')
      l = l.replace(/\*\*([^*\n]+)\*\*/g, '$1')
      // Remove __bold__ → text
      l = l.replace(/___([^_\n]+)___/g, '$1')
      l = l.replace(/__([^_\n]+)__/g, '$1')
      // Convert "* bullet" at start → "• bullet"
      l = l.replace(/^\s*\*\s+/, '• ')
      // Convert "- bullet" at start → "• bullet"
      l = l.replace(/^\s*-\s+/, '• ')
      // Convert numbered list "1. item" → "• item"
      l = l.replace(/^\s*\d+[.)]\s+/, '• ')
      // Remove remaining *italic* markers (not bullets)
      if (!l.startsWith('•')) {
        l = l.replace(/\*([^*\n]+)\*/g, '$1')
      }
      // Remove _italic_ but not mid-word underscores
      l = l.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '$1')
      // Remove backtick code markers
      l = l.replace(/`([^`\n]+)`/g, '$1')
      // Remove blockquote markers
      l = l.replace(/^\s*>\s?/, '')
      // Convert -- to – (en-dash) for cleaner typography
      l = l.replace(/(?<![─])--(?![-─])/g, '–')
      return l
    })
    .join('\n')
}

// -- PDF text sanitizer ---

function sanitizeTextForPDF(text) {
  if (!text || typeof text !== 'string') return '';
  return text.split('').filter(function(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x09 && c <= 0x0A) || c === 0x0D ||
           (c >= 0x20 && c <= 0x7E) ||
           (c >= 0xA0 && c <= 0xFF) ||
           (c >= 0x0100 && c <= 0x024F);
  }).join('').trim();
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

function getScalingParams(text) {
  const lines = parseDocumentLines(text)
  let effective = 0
  const CPL = 90

  for (const l of lines) {
    if (l.type === 'empty') { effective += 0.25; continue }
    if (l.type === 'divider') continue
    if (l.type === 'name') { effective += 2.2; continue }
    if (l.type === 'contact') { effective += 1.0; continue }
    if (l.type === 'header') { effective += 1.8; continue }
    effective += Math.max(1, Math.ceil((l.text?.length || 0) / CPL))
  }

  // Returns { bodySize, margins, lineHeight, headerSpacingBefore, headerSpacingAfter }
  if (effective <= 50)  return { bodySize: 10.5, margins: [40,36,40,36], lineHeight: 1.28, hSpB: 8, hSpA: 3 }
  if (effective <= 54)  return { bodySize: 10.0, margins: [40,34,40,34], lineHeight: 1.26, hSpB: 7, hSpA: 2 }
  if (effective <= 58)  return { bodySize: 9.5,  margins: [38,32,38,32], lineHeight: 1.24, hSpB: 6, hSpA: 2 }
  if (effective <= 63)  return { bodySize: 9.0,  margins: [36,28,36,28], lineHeight: 1.22, hSpB: 5, hSpA: 2 }
  if (effective <= 69)  return { bodySize: 8.5,  margins: [34,24,34,24], lineHeight: 1.20, hSpB: 4, hSpA: 1 }
  if (effective <= 76)  return { bodySize: 8.0,  margins: [32,20,32,20], lineHeight: 1.18, hSpB: 3, hSpA: 1 }
  return                       { bodySize: 7.5,  margins: [30,18,30,18], lineHeight: 1.16, hSpB: 2, hSpA: 1 }
}

function getOptimalFontSize(text) {
  return getScalingParams(text).bodySize
}

// ── Helper: wrap header items with photo column ──────────────────────────────

function wrapHeaderWithPhoto(headerItems, photo) {
  if (!photo || !headerItems.length) return headerItems
  return [{ columns: [{ stack: headerItems, width: '*' }, { image: photo, fit: [68, 87], alignment: 'right', margin: [4, 0, 0, 0] }], margin: [0, 0, 0, 6] }]
}

// ── Template-specific PDF builders ──────────────────────────────────────────

function buildMinimalPDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const headerItems = []
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 7)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const pw = 515 - (40 - margins[0]) * 2

  for (const line of lines) {
    if (!headerDone && line.type === 'name') {
      headerItems.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); continue
    }
    if (!headerDone && line.type === 'contact') {
      const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
      headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      continue
    }
    headerDone = true
    switch (line.type) {
      case 'empty':
        bodyContent.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] }); break
      case 'divider':
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: pw, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 2, 0, 2] }); break
      case 'name':
        bodyContent.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); break
      case 'contact': {
        const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.6, lineColor: '#888888' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  const docDef = {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
  }
  return autoFitToOnePage(docDef, text)
}

function buildModernPDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const headerItems = []
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 7)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const GREEN = '#1D9E75'
  const pw = 515 - (40 - margins[0]) * 2
  const topBar = { canvas: [{ type: 'rect', x: 0, y: 0, w: pw, h: 4, r: 0, color: GREEN }], margin: [0, 0, 0, 6] }

  for (const line of lines) {
    if (!headerDone && line.type === 'name') {
      headerItems.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); continue
    }
    if (!headerDone && line.type === 'contact') {
      const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
      headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#666666', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      continue
    }
    headerDone = true
    switch (line.type) {
      case 'empty':
        bodyContent.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] }); break
      case 'divider':
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: pw, y2: 1, lineWidth: 0.4, lineColor: '#dddddd' }], margin: [0, 2, 0, 2] }); break
      case 'name':
        bodyContent.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); break
      case 'contact': {
        const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#666666', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: GREEN, margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.0, lineColor: GREEN }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 12, fontSize: bodySize, color: GREEN }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  const docDef = {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [topBar, ...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
  }
  return autoFitToOnePage(docDef, text)
}

function buildClassicPDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 8)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const pw = 515 - (40 - margins[0]) * 2
  const hw = pw / 2

  let nameLine = null
  const contactLines = []

  for (const line of lines) {
    if (!headerDone && line.type === 'name') { nameLine = line; continue }
    if (!headerDone && line.type === 'contact') { contactLines.push(line); continue }
    headerDone = true
    switch (line.type) {
      case 'empty':
        bodyContent.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] }); break
      case 'divider':
        bodyContent.push({
          columns: [
            { canvas: [{ type: 'line', x1: 0, y1: 1, x2: hw, y2: 1, lineWidth: 0.5, lineColor: '#999999' }] },
            { canvas: [{ type: 'line', x1: 0, y1: 1, x2: hw, y2: 1, lineWidth: 0.5, lineColor: '#999999' }] },
          ],
          margin: [0, 2, 0, 2],
        }); break
      case 'name':
        bodyContent.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', alignment: 'center', margin: [0, 0, 0, 2] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: '#333333' }], margin: [0, 0, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.5, lineColor: '#333333' }], margin: [0, 2, 0, 2] }); break
      case 'contact': {
        const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true, alignment: 'center' })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.8, lineColor: '#555555' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [8, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  const allContactItems = contactLines.flatMap(cl => cl.text.split('|').map(i => i.trim()).filter(Boolean))
  let headerContent = []
  if (nameLine) {
    if (photo) {
      const textColW = pw - 83
      const textStack = [
        { text: nameLine.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: textColW, y2: 0, lineWidth: 1.5, lineColor: '#333333' }], margin: [0, 2, 0, 1] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: textColW, y2: 0, lineWidth: 0.5, lineColor: '#999999' }], margin: [0, 0, 0, 4] },
      ]
      if (allContactItems.length) {
        textStack.push({ columns: allContactItems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8 })
      }
      headerContent = [{ columns: [{ stack: textStack, width: '*' }, { image: photo, fit: [65, 83], alignment: 'right', width: 75, margin: [8, 0, 0, 0] }], margin: [0, 0, 0, 12] }]
    } else {
      headerContent.push({ text: nameLine.text, fontSize: nameSize, bold: true, color: '#111111', alignment: 'center', margin: [0, 0, 0, 2] })
      headerContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: '#333333' }], margin: [0, 0, 0, 1] })
      headerContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.5, lineColor: '#333333' }], margin: [0, 2, 0, 2] })
      if (allContactItems.length) {
        headerContent.push({ columns: allContactItems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true, alignment: 'center' })), columnGap: 8, margin: [0, 0, 0, 1] })
      }
    }
  }

  const docDef = {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [...headerContent, ...bodyContent],
  }
  return autoFitToOnePage(docDef, text)
}

function buildExecutivePDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 8)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const GREEN = '#1D9E75'
  const pw = 515 - (40 - margins[0]) * 2

  let nameLine = null
  const contactLines = []

  for (const line of lines) {
    if (!headerDone && line.type === 'name') { nameLine = line; continue }
    if (!headerDone && line.type === 'contact') { contactLines.push(line); continue }
    headerDone = true
    switch (line.type) {
      case 'empty':
        bodyContent.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] }); break
      case 'divider':
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: pw, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 2, 0, 2] }); break
      case 'name':
        bodyContent.push({ text: line.text.toUpperCase(), fontSize: nameSize, bold: true, color: '#111111', letterSpacing: 2, margin: [0, 0, 0, 3] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: GREEN }], margin: [0, 0, 0, 4] }); break
      case 'contact': {
        const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', characterSpacing: 0.5, margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.6, lineColor: '#aaaaaa' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 12, fontSize: bodySize, color: '#666666' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  const allContactItems = contactLines.flatMap(cl => cl.text.split('|').map(i => i.trim()).filter(Boolean))
  let headerContent = []
  if (nameLine) {
    if (photo) {
      const textColW = pw - 83
      const textStack = [
        { text: nameLine.text.toUpperCase(), fontSize: nameSize, bold: true, color: '#111111', characterSpacing: 2, margin: [0, 0, 0, 3] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: textColW, y2: 0, lineWidth: 1.5, lineColor: GREEN }], margin: [0, 0, 0, 7] },
      ]
      if (allContactItems.length) {
        textStack.push({ columns: allContactItems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#666666', width: 'auto', noWrap: true })), columnGap: 10 })
      }
      headerContent = [{ columns: [{ stack: textStack, width: '*' }, { image: photo, fit: [65, 83], alignment: 'right', width: 75, margin: [8, 0, 0, 0] }], margin: [0, 0, 0, 14] }]
    } else {
      headerContent.push({ text: nameLine.text.toUpperCase(), fontSize: nameSize, bold: true, color: '#111111', letterSpacing: 2, margin: [0, 0, 0, 3] })
      headerContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: GREEN }], margin: [0, 0, 0, 4] })
      if (allContactItems.length) {
        headerContent.push({ columns: allContactItems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      }
    }
  }

  const docDef = {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [...headerContent, ...bodyContent],
  }
  return autoFitToOnePage(docDef, text)
}

// ── Structured data extractor for Sharp/Option A template ────────────────────

export function buildSharpStructure(lines) {
  const name = lines.find(l => l.type === 'name')?.text || ''

  const contactItems = []
  for (const line of lines) {
    if (line.type !== 'contact') continue
    line.text.split('|').map(s => s.trim()).filter(Boolean).forEach(item => contactItems.push(item))
  }
  const contactLine = contactItems.join(' · ')

  const SKILLS_RE = /^(SKILLS|CORE COMPETENCIES|TECHNICAL SKILLS|KEY SKILLS|TECHNOLOGIES|SOFT SKILLS|KEY STRENGTHS|FÄHIGKEITEN|KENNTNISSE)$/
  const SIDEBAR_RE = /^(LANGUAGES|SPRACHEN|INTERESTS|INTERESSEN|HOBBIES|CERTIFICATES|CERTIFICATIONS|ZERTIFIKATE|PERSONAL STRENGTHS|PERSÖNLICHE STÄRKEN|STÄRKEN|AWARDS|VOLUNTEERING|REFERENCES|REFERENZEN)$/

  const skills = []
  const sections = []
  let currentSection = null
  let inSkillsSection = false

  for (const line of lines) {
    if (line.type === 'name' || line.type === 'contact') continue
    if (line.type === 'header') {
      if (SKILLS_RE.test(line.text)) { inSkillsSection = true; currentSection = null; continue }
      inSkillsSection = false
      currentSection = { title: line.text, content: '', sidebar: SIDEBAR_RE.test(line.text) }
      sections.push(currentSection)
      continue
    }
    if (inSkillsSection) {
      if (line.type === 'body' || line.type === 'bullet') { skills.push(line.text); continue }
      if (line.type === 'empty') continue
      inSkillsSection = false
    }
    if (currentSection && line.type !== 'empty') {
      const prefix = line.type === 'bullet' ? '• ' : ''
      if (currentSection.content) currentSection.content += '\n'
      currentSection.content += prefix + line.text
    }
  }

  return { name, contactLine, sections, skills }
}

function buildSharpPDF(text, sp, photo = null) {
  const lines = parseDocumentLines(text)
  const { name, contactLine, sections, skills } = buildSharpStructure(lines)
  const GREEN = '#1D9E75'

  // Sidebar stack
  const sidebarChildren = []
  if (photo) {
    sidebarChildren.push({ image: photo, width: 100, fit: [100, 125], margin: [0, 0, 0, 14] })
  }
  if (skills.length > 0) {
    sidebarChildren.push({ text: 'SKILLS', fontSize: 8, bold: true, color: GREEN, margin: [0, 0, 0, 5] })
    skills.forEach(skill => {
      sidebarChildren.push({ text: '· ' + skill, fontSize: 8.5, color: '#444444', margin: [0, 0, 0, 3], lineHeight: 1.4 })
    })
  }
  sections.filter(s => s.sidebar).forEach(section => {
    sidebarChildren.push({ text: section.title.toUpperCase(), fontSize: 8, bold: true, color: GREEN, margin: [0, 12, 0, 4] })
    sidebarChildren.push({ text: section.content, fontSize: 8.5, color: '#444444', lineHeight: 1.5 })
  })
  if (sidebarChildren.length === 0) sidebarChildren.push({ text: '' })

  // Main content stack
  const mainChildren = []
  sections.filter(s => !s.sidebar).forEach((section, i) => {
    mainChildren.push({
      text: section.title.toUpperCase(),
      fontSize: 9,
      bold: true,
      color: GREEN,
      margin: [0, i === 0 ? 0 : 12, 0, 3],
      decoration: 'underline',
      decorationColor: GREEN,
      decorationStyle: 'solid',
    })
    mainChildren.push({ text: section.content, fontSize: 9.5, color: '#333333', lineHeight: 1.6, margin: [0, 2, 0, 0] })
  })
  if (mainChildren.length === 0) mainChildren.push({ text: '' })

  return {
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 0],
    content: [
      // Green header — full-width table cell with green fill
      {
        table: {
          widths: ['100%'],
          body: [[{
            stack: [
              { text: sanitizeTextForPDF((name || '').toUpperCase()), fontSize: 22, bold: true, color: '#FFFFFF', characterSpacing: 0.5, margin: [24, 18, 24, 5] },
              { text: sanitizeTextForPDF(contactLine || ''), fontSize: 8.5, color: '#FFFFFF', margin: [24, 0, 24, 16], lineHeight: 1.4 },
            ],
            fillColor: GREEN,
            border: [false, false, false, false],
          }]],
        },
        layout: {
          defaultBorder: false,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
      // Two-column body — vLineWidth draws the green border from row top to bottom
      {
        table: {
          widths: ['36%', '*'],
          heights: [680],
          body: [[
            {
              stack: sidebarChildren,
              border: [false, false, true, false],
              borderColor: ['white', 'white', GREEN, 'white'],
              margin: [24, 16, 14, 16],
              fillColor: '#FFFFFF',
            },
            {
              stack: mainChildren,
              border: [false, false, false, false],
              margin: [16, 16, 24, 16],
              fillColor: '#FFFFFF',
            },
          ]],
        },
        layout: {
          defaultBorder: false,
          hLineWidth: () => 0,
          vLineWidth: (i) => i === 1 ? 2 : 0,
          vLineColor: () => GREEN,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 9.5, lineHeight: 1.5 },
  }
}

// ── Auto-fit to one A4 page ──────────────────────────────────────────────────

function estimatedPageCount(text, fontSize) {
  const totalChars = text.length
  const charsPerPage = fontSize > 9.5 ? 3000 : fontSize > 8.5 ? 3600 : 4200
  return Math.ceil(totalChars / charsPerPage)
}

function applyFontScale(docDef, baseFontSize) {
  const savedBackground = typeof docDef.background === 'function' ? docDef.background : undefined
  const toClone = { ...docDef }
  if (savedBackground) delete toClone.background
  const clone = JSON.parse(JSON.stringify(toClone))
  if (savedBackground) clone.background = savedBackground

  function scaleNode(node) {
    if (!node || typeof node !== 'object') return
    if (node.fontSize && node.fontSize >= 8.5 && node.fontSize <= 11) {
      node.fontSize = baseFontSize
    }
    if (node.lineHeight) node.lineHeight = 1.3
    if (Array.isArray(node.margin)) {
      node.margin = node.margin.map((m, i) =>
        (i === 1 || i === 3) ? Math.max(1, Math.floor(m * 0.8)) : m
      )
    }
    Object.values(node).forEach(v => {
      if (Array.isArray(v)) v.forEach(scaleNode)
      else if (v && typeof v === 'object') scaleNode(v)
    })
  }
  scaleNode(clone)
  return clone
}

function autoFitToOnePage(docDefinition, text) {
  const FONT_STEPS = [10.5, 10, 9.5, 9, 8.5, 8, 7.5]
  for (const fontSize of FONT_STEPS) {
    if (estimatedPageCount(text, fontSize) <= 1) {
      return applyFontScale(docDefinition, fontSize)
    }
  }
  return applyFontScale(docDefinition, 7.5)
}

function buildPDFDocDef(text, sp, template, photo = null) {
  switch (template) {
    case 'modern':    return buildModernPDF(text, sp, photo)
    case 'classic':   return buildClassicPDF(text, sp, photo)
    case 'executive': return buildExecutivePDF(text, sp, photo)
    case 'sharp':     return buildSharpPDF(text, sp, photo)
    default:          return buildMinimalPDF(text, sp, photo)
  }
}

// ── Cover letter PDF builder (structured data) ───────────────────────────────

export function buildCoverLetterPDF(data, template = 'minimal') {
  if (!data || typeof data !== 'object') throw new Error('Invalid cover letter data')

  const ACCENT = '#1D9E75'

  const templates = {
    minimal:   { nameColor: '#1a1a1a', lineColor: '#cccccc', lineWidth: 0.5, subjectColor: '#1a1a1a', margins: [70, 60, 70, 60] },
    modern:    { nameColor: '#1a1a1a', lineColor: ACCENT,    lineWidth: 1,   subjectColor: ACCENT,    margins: [70, 60, 70, 60] },
    classic:   { nameColor: '#1a1a1a', lineColor: '#333333', lineWidth: 1,   subjectColor: '#1a1a1a', margins: [70, 60, 70, 60] },
    executive: { nameColor: '#1a1a1a', lineColor: ACCENT,    lineWidth: 2,   subjectColor: '#1a1a1a', margins: [60, 55, 60, 55] },
    sharp:     { nameColor: '#ffffff', lineColor: '#ffffff', lineWidth: 0.5, subjectColor: '#1a1a1a', margins: [0, 0, 60, 60] },
  }

  const style = templates[template] || templates.minimal

  const safeLine = (text) => ({
    text: text || '',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333333',
    margin: [0, 1, 0, 0],
  })

  const senderBlock = [
    { text: data.sender_name || '', fontSize: 14, bold: true, color: style.nameColor || '#1a1a1a', margin: [0, 0, 0, 4] },
    safeLine(data.sender_address),
    safeLine(data.sender_postal),
    safeLine(data.sender_email),
    safeLine(data.sender_phone),
  ]

  const dividerLine = {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 475, y2: 0, lineWidth: style.lineWidth, lineColor: style.lineColor }],
    margin: [0, 10, 0, 14],
  }

  const metaBlock = [
    { text: data.date || '', fontSize: 10, color: '#555555', margin: [0, 0, 0, 10] },
    { text: data.recipient_company || '', fontSize: 10, color: '#333333', margin: [0, 0, 0, 14] },
    { text: data.subject || '', fontSize: 10, bold: true, color: style.subjectColor || '#1a1a1a', margin: [0, 0, 0, 14] },
    { text: data.salutation || '', fontSize: 10.5, margin: [0, 0, 0, 10] },
  ]

  const bodyBlock = [
    { text: data.body_paragraph_1 || '', fontSize: 10.5, lineHeight: 1.65, margin: [0, 0, 0, 10] },
    { text: data.body_paragraph_2 || '', fontSize: 10.5, lineHeight: 1.65, margin: [0, 0, 0, 10] },
    { text: data.body_paragraph_3 || '', fontSize: 10.5, lineHeight: 1.65, margin: [0, 0, 0, 24] },
    { text: data.closing || '', fontSize: 10.5, margin: [0, 0, 0, 28] },
    { text: data.signature || '', fontSize: 10.5, bold: true },
  ]

  let content = []

  if (template === 'sharp') {
    content.push({
      table: {
        widths: ['100%'],
        body: [[{
          stack: [
            { text: data.sender_name || '', fontSize: 16, bold: true, color: '#ffffff', margin: [24, 16, 24, 4] },
            { text: [data.sender_email, data.sender_phone, data.sender_address].filter(Boolean).join('   ·   '), fontSize: 8.5, color: 'rgba(255,255,255,0.85)', margin: [24, 0, 24, 14] },
          ],
          fillColor: ACCENT,
          border: [false, false, false, false],
        }]],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 0],
    })
    content.push({ text: '', margin: [0, 20, 0, 0] })
    content.push(...metaBlock.map(b => ({ ...b, margin: [60, b.margin?.[1] || 0, 60, b.margin?.[3] || 0] })))
    content.push(...bodyBlock.map(b => ({ ...b, margin: [60, b.margin?.[1] || 0, 60, b.margin?.[3] || 0] })))
  } else {
    content.push(...senderBlock)
    content.push(dividerLine)
    content.push(...metaBlock)
    content.push(...bodyBlock)
  }

  return {
    pageSize: 'A4',
    pageMargins: template === 'sharp' ? [0, 0, 0, 50] : style.margins,
    content,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10.5,
      lineHeight: 1.6,
      color: '#1a1a1a',
    },
  }
}

// ── Cover letter Word builder (structured data) ──────────────────────────────

export async function buildCoverLetterWord(data, template = 'minimal') {
  if (!data || typeof data !== 'object') throw new Error('Invalid cover letter data')

  const { Document, Paragraph, TextRun, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } = await import('docx')

  const ACCENT = '1D9E75'
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

  const makeP = (text, opts = {}) => new Paragraph({
    children: [new TextRun({
      text: text || '',
      size: opts.size || 20,
      bold: opts.bold || false,
      color: opts.color || '1a1a1a',
      font: 'Arial',
    })],
    spacing: { before: opts.before || 0, after: opts.after !== undefined ? opts.after : 80 },
  })

  const children = []

  if (template === 'sharp') {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [new TableCell({
          children: [
            makeP(data.sender_name, { size: 28, bold: true, color: 'FFFFFF', after: 60 }),
            makeP([data.sender_email, data.sender_phone, data.sender_address].filter(Boolean).join('   ·   '), { size: 16, color: 'E8F5F0', after: 0 }),
          ],
          shading: { fill: ACCENT, type: ShadingType.CLEAR, color: ACCENT },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          margins: { top: 200, bottom: 200, left: 400, right: 400 },
        })],
      })],
    }))
    children.push(makeP('', { after: 200 }))
  } else {
    children.push(makeP(data.sender_name, { size: 26, bold: true, after: 40 }))
    children.push(makeP(data.sender_address, { size: 18, after: 40 }))
    children.push(makeP(data.sender_postal, { size: 18, after: 40 }))
    children.push(makeP(data.sender_email, { size: 18, after: 40 }))
    children.push(makeP(data.sender_phone, { size: 18, after: 120 }))
    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: template === 'executive' ? 12 : 6, color: template === 'classic' ? '333333' : ACCENT } },
      spacing: { after: 160 },
    }))
  }

  children.push(makeP(data.date, { size: 19, color: '555555', after: 120 }))
  children.push(makeP(data.recipient_company, { size: 19, after: 160 }))
  children.push(makeP(data.subject, { size: 20, bold: true, after: 160 }))
  children.push(makeP(data.salutation, { size: 20, after: 120 }))
  children.push(makeP(data.body_paragraph_1, { size: 20, after: 120 }))
  children.push(makeP(data.body_paragraph_2, { size: 20, after: 120 }))
  children.push(makeP(data.body_paragraph_3, { size: 20, after: 360 }))
  children.push(makeP(data.closing, { size: 20, after: 400 }))
  children.push(makeP(data.signature, { size: 20, bold: true, after: 0 }))

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 854, right: 1134, bottom: 854, left: 1134 } },
      },
      children,
    }],
  })
}

// ── Public: download as PDF ──────────────────────────────────────────────────

export async function downloadAsPDF(text, filename, template = 'minimal', isLetter = false, photo = null) {
  const pdfMake = await loadPdfMake()
  let docDef
  if (isLetter) {
    docDef = buildCoverLetterPDF(text, template || 'minimal')
  } else {
    const cleanText = sanitizeTextForPDF(stripMarkdown(text))
    const sp = getScalingParams(cleanText)
    docDef = buildPDFDocDef(cleanText, sp, template, photo)
  }

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

export async function downloadAsWord(text, filename, template = 'minimal', isLetter = false, photo = null) {
  if (isLetter) {
    const { Packer } = await import('docx')
    const doc = await buildCoverLetterWord(text, template || 'minimal')
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename + '.docx'; a.style.display = 'none'
    document.body.appendChild(a); a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 200)
    return
  }

  const cleanText = stripMarkdown(text)
  const {
    Document, Packer, Paragraph, TextRun, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, ImageRun, HeightRule,
  } = await import('docx')

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
            border: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
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
        case 'contact': {
          const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
          if (isDarkBg) {
            citems.forEach(item => {
              children.push(new Paragraph({
                children: [new TextRun({ text: item, size: item.length > 25 ? 13 : 15, color: 'CCCCCC', noProof: true, font: 'Calibri' })],
                spacing: { after: 40 },
              }))
            })
          } else {
            const contactRuns = citems.flatMap((ci, idx) => {
              const r = [new TextRun({ text: ci, size: ci.length > 30 ? 14 : 16, font: 'Calibri', color: subColor, noProof: true })]
              if (idx < citems.length - 1) r.push(new TextRun({ text: '  |  ', size: 14, font: 'Calibri', color: subColor }))
              return r
            })
            children.push(new Paragraph({
              children: contactRuns,
              spacing: { after: 30 },
              alignment: template === 'classic' ? 'center' : 'left',
            }))
          }
          break
        }
        case 'divider':
          children.push(new Paragraph({
            children: [new TextRun({ text: '' })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: isDarkBg ? '444444' : 'cccccc', space: 1 } },
            spacing: { before: 60, after: 60 },
          })); break
        case 'header': {
          const headerColor = isDarkBg ? (template === 'sharp' ? 'ffffff' : accentColor) : (template === 'modern' ? GREEN : headingColor)
          const borderColor = isDarkBg ? accentColor : ((template === 'modern' || template === 'sharp') ? GREEN : '888888')
          children.push(new Paragraph({
            children: [new TextRun({ text: line.text, bold: true, size: headerHalfPt, font: 'Calibri', color: headerColor })],
            border: { bottom: { style: BorderStyle.SINGLE, size: (template === 'modern' || isDarkBg) ? 10 : 6, color: borderColor, space: 1 } },
            spacing: { before: 200, after: 80 },
          })); break
        }
        case 'bullet':
          children.push(new Paragraph({
            children: [new TextRun({ text: '•  ' + line.text, size: bodyHalfPt, font: 'Calibri', color: textColor })],
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

  // Convert photo data URL to Uint8Array for ImageRun
  let photoBytes = null
  let photoType = 'jpg'
  if (photo && !isLetter) {
    try {
      const mimeMatch = photo.match(/^data:image\/(jpeg|jpg|png);base64,/)
      photoType = (mimeMatch && mimeMatch[1] === 'png') ? 'png' : 'jpg'
      const base64 = photo.split(',')[1]
      const binaryStr = atob(base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      photoBytes = bytes
    } catch (_) { photoBytes = null }
  }

  let sections

  if (template === 'sharp') {
    const { name: sName, contactLine: sContact, sections: sSections, skills: sSkills } = buildSharpStructure(lines)
    const GREEN_WORD = '1D9E75'
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

    // Green header row spanning both columns
    const headerRow = new TableRow({
      children: [new TableCell({
        columnSpan: 2,
        children: [
          new Paragraph({
            children: [new TextRun({ text: (sName || '').toUpperCase(), bold: true, size: 40, color: 'FFFFFF', font: 'Calibri' })],
            spacing: { before: 200, after: 100 },
            indent: { left: 280 },
          }),
          new Paragraph({
            children: [new TextRun({ text: sContact || '', size: 18, color: 'E8F5F0', font: 'Calibri' })],
            spacing: { before: 0, after: 200 },
            indent: { left: 280 },
          }),
        ],
        shading: { fill: GREEN_WORD, type: ShadingType.CLEAR, color: GREEN_WORD },
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
      })],
    })

    // Sidebar children
    const sidebarChildren = []
    if (photoBytes) {
      sidebarChildren.push(new Paragraph({
        children: [new ImageRun({ data: photoBytes, transformation: { width: 113, height: 142 }, type: photoType })],
        spacing: { before: 0, after: 160 },
      }))
    }
    if (sSkills.length > 0) {
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: 'SKILLS', bold: true, size: 18, color: GREEN_WORD, font: 'Calibri' })],
        spacing: { before: 0, after: 80 },
      }))
      sSkills.forEach(skill => {
        sidebarChildren.push(new Paragraph({
          children: [new TextRun({ text: '· ' + skill, size: 20, color: '444444', font: 'Calibri' })],
          spacing: { before: 0, after: 100, line: 276 },
        }))
      })
    }
    sSections.filter(s => s.sidebar).forEach(section => {
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 18, color: GREEN_WORD, font: 'Calibri' })],
        spacing: { before: 160, after: 80 },
      }))
      section.content.split('\n').forEach(ln => {
        sidebarChildren.push(new Paragraph({
          children: [new TextRun({ text: ln, size: 20, color: '444444', font: 'Calibri' })],
          spacing: { before: 0, after: 100, line: 276 },
        }))
      })
    })
    if (sidebarChildren.length === 0) sidebarChildren.push(new Paragraph({ children: [] }))

    // Main content children
    const mainChildren = []
    sSections.filter(s => !s.sidebar).forEach((section, i) => {
      mainChildren.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 18, color: GREEN_WORD, font: 'Calibri' })],
        spacing: { before: i === 0 ? 0 : 240, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN_WORD } },
      }))
      section.content.split('\n').forEach(ln => {
        mainChildren.push(new Paragraph({
          children: [new TextRun({ text: ln, size: 20, color: '333333', font: 'Calibri' })],
          spacing: { before: 0, after: 100, line: 276 },
        }))
      })
    })
    if (mainChildren.length === 0) mainChildren.push(new Paragraph({ children: [] }))

    const sidebarCell = new TableCell({
      width: { size: 36, type: WidthType.PERCENTAGE },
      children: sidebarChildren,
      margins: { top: 280, bottom: 280, left: 280, right: 280 },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: { style: BorderStyle.SINGLE, size: 16, color: GREEN_WORD } },
    })
    const mainCell = new TableCell({
      width: { size: 64, type: WidthType.PERCENTAGE },
      children: mainChildren,
      margins: { top: 280, bottom: 280, left: 280, right: 280 },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
    })
    const bodyRow = new TableRow({
      children: [sidebarCell, mainCell],
      height: { value: 12500, rule: HeightRule.AT_LEAST },
    })

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, bodyRow],
    })

    sections = [{ properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } }, children: [table] }]
  } else {
    let children
    if (photoBytes) {
      // Split into header (name/contact) and body lines
      const headerLines = []
      const bodyLines = []
      let hDone = false
      for (const line of lines) {
        if (!hDone && (line.type === 'name' || line.type === 'contact')) { headerLines.push(line) }
        else { hDone = true; bodyLines.push(line) }
      }
      const headerParas = buildParagraphs(headerLines)
      const photoImageRun = new ImageRun({ data: photoBytes, transformation: { width: 68, height: 87 }, type: photoType })
      const photoPara = new Paragraph({ children: [photoImageRun], spacing: { after: 0 } })
      const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: 80, type: WidthType.PERCENTAGE },
              children: headerParas.length ? headerParas : [new Paragraph({ children: [] })],
              borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
              margins: { top: 0, bottom: 0, left: 0, right: 200 },
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [photoPara],
              borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
            }),
          ],
        })],
      })
      children = [headerTable, ...buildParagraphs(bodyLines)]
    } else {
      children = buildParagraphs(lines)
    }
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
