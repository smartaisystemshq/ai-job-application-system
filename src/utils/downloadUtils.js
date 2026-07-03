// PDF via pdfmake, Word via docx

function validatePDFStructure(docDef) {
  const issues = []
  function findCanvasRects(node, path = '') {
    if (!node || typeof node !== 'object') return
    if (node.canvas) {
      node.canvas.forEach(shape => {
        if (shape.type === 'rect' && shape.h > 700)
          issues.push(`Large canvas rect at ${path} — height ${shape.h}pt may cause empty page overflow`)
        if (shape.type === 'line' && shape.y2 > 700)
          issues.push(`Long vertical line at ${path} — may overflow to empty page`)
      })
    }
    Object.entries(node).forEach(([key, val]) => {
      if (Array.isArray(val)) val.forEach((v, i) => findCanvasRects(v, `${path}.${key}[${i}]`))
      else if (val && typeof val === 'object') findCanvasRects(val, `${path}.${key}`)
    })
  }
  findCanvasRects(docDef)
  if (issues.length > 0) console.warn('[Quality Agent] PDF structure issues:', issues)
  return { valid: issues.length === 0, issues }
}

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
  if (effective <= 50)  return { bodySize: 11,   margins: [40,50,40,36], lineHeight: 1.55, hSpB: 8, hSpA: 3 }
  if (effective <= 54)  return { bodySize: 10.0, margins: [40,50,40,34], lineHeight: 1.26, hSpB: 7, hSpA: 2 }
  if (effective <= 58)  return { bodySize: 9.5,  margins: [38,50,38,32], lineHeight: 1.24, hSpB: 6, hSpA: 2 }
  if (effective <= 63)  return { bodySize: 9.0,  margins: [36,50,36,28], lineHeight: 1.22, hSpB: 5, hSpA: 2 }
  if (effective <= 69)  return { bodySize: 8.5,  margins: [34,50,34,24], lineHeight: 1.20, hSpB: 4, hSpA: 1 }
  if (effective <= 76)  return { bodySize: 8.0,  margins: [32,50,32,20], lineHeight: 1.18, hSpB: 3, hSpA: 1 }
  return                       { bodySize: 7.5,  margins: [30,50,30,18], lineHeight: 1.16, hSpB: 2, hSpA: 1 }
}

function getOptimalFontSize(text) {
  return getScalingParams(text).bodySize
}

// ── Helper: wrap header items with photo column ──────────────────────────────

function wrapHeaderWithPhoto(headerItems, photo) {
  if (!photo || !headerItems.length) return headerItems
  return [{
    columns: [
      { stack: headerItems, width: '*' },
      {
        stack: [{ image: photo, fit: [68, 87], alignment: 'right' }],
        width: 75,
        margin: [8, 0, 0, 0],
      },
    ],
    columnGap: 8,
    margin: [0, 0, 0, 14],
  }]
}

// ── Template-specific PDF builders ──────────────────────────────────────────

function buildMinimalPDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const headerItems = []
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 7)
  const contactSize = Math.min(9, bodySize - 1.5)
  const headerSize = bodySize + 0.5
  const pw = 515 - (40 - margins[0]) * 2

  for (const line of lines) {
    if (!headerDone && line.type === 'name') {
      headerItems.push({ text: line.text || '', fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); continue
    }
    if (!headerDone && line.type === 'contact') {
      const citems = (line.text || '').split('|').map(i => i.trim()).filter(Boolean)
      if (photo) {
        citems.forEach(ci => headerItems.push({ text: ci, fontSize: 9, color: '#555555', margin: [0, 0, 0, 2], lineHeight: 1.3 }))
      } else {
        headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      }
      continue
    }
    headerDone = true
    switch (line.type) {
      case 'empty':
        bodyContent.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] }); break
      case 'divider':
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: pw, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 2, 0, 2] }); break
      case 'name':
        bodyContent.push({ text: line.text || '', fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); break
      case 'contact': {
        const citems = (line.text || '').split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text || '', fontSize: headerSize, bold: true, color: '#111111', margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.6, lineColor: '#888888' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text || '', fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text || '', fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  const docDef = {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
    pageBreakBefore: function(currentNode, followingNodesOnPage) {
      return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
    },
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
  const contactSize = Math.min(9, bodySize - 1.5)
  const headerSize = bodySize + 0.5
  const GREEN = '#1D9E75'
  const pw = 515 - (40 - margins[0]) * 2
  const topBar = { canvas: [{ type: 'rect', x: 0, y: 0, w: pw, h: 4, r: 0, color: GREEN }], margin: [0, 0, 0, 6] }

  for (const line of lines) {
    if (!headerDone && line.type === 'name') {
      headerItems.push({ text: line.text || '', fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); continue
    }
    if (!headerDone && line.type === 'contact') {
      const citems = (line.text || '').split('|').map(i => i.trim()).filter(Boolean)
      if (photo) {
        citems.forEach(ci => headerItems.push({ text: ci, fontSize: 9, color: '#666666', margin: [0, 0, 0, 2], lineHeight: 1.3 }))
      } else {
        headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#666666', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      }
      continue
    }
    headerDone = true
    switch (line.type) {
      case 'empty':
        bodyContent.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] }); break
      case 'divider':
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: pw, y2: 1, lineWidth: 0.4, lineColor: '#dddddd' }], margin: [0, 2, 0, 2] }); break
      case 'name':
        bodyContent.push({ text: line.text || '', fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); break
      case 'contact': {
        const citems = (line.text || '').split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#666666', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text || '', fontSize: headerSize, bold: true, color: GREEN, margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.0, lineColor: GREEN }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 12, fontSize: bodySize, color: GREEN }, { text: line.text || '', fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text || '', fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  const docDef = {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [topBar, ...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
    pageBreakBefore: function(currentNode, followingNodesOnPage) {
      return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
    },
  }
  return autoFitToOnePage(docDef, text)
}

function buildClassicPDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 8)
  const contactSize = Math.min(9, bodySize - 1.5)
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
        bodyContent.push({ text: line.text || '', fontSize: nameSize, bold: true, color: '#111111', alignment: 'center', margin: [0, 0, 0, 2] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: '#333333' }], margin: [0, 0, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.5, lineColor: '#333333' }], margin: [0, 2, 0, 2] }); break
      case 'contact': {
        const citems = (line.text || '').split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true, alignment: 'center' })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text || '', fontSize: headerSize, bold: true, color: '#111111', margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.8, lineColor: '#555555' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text || '', fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [8, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text || '', fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
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
      allContactItems.forEach(ci => textStack.push({ text: ci, fontSize: 9, color: '#555555', margin: [0, 0, 0, 2], lineHeight: 1.3 }))
      headerContent = [{ columns: [{ stack: textStack, width: '*' }, { stack: [{ image: photo, fit: [68, 87], alignment: 'right' }], width: 75, margin: [8, 0, 0, 0] }], columnGap: 8, margin: [0, 0, 0, 14] }]
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
    pageBreakBefore: function(currentNode, followingNodesOnPage) {
      return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
    },
  }
  return autoFitToOnePage(docDef, text)
}

function buildExecutivePDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 8)
  const contactSize = Math.min(9, bodySize - 1.5)
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
        bodyContent.push({ text: (line.text || '').toUpperCase(), fontSize: nameSize, bold: true, color: '#111111', letterSpacing: 2, margin: [0, 0, 0, 3] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: GREEN }], margin: [0, 0, 0, 4] }); break
      case 'contact': {
        const citems = (line.text || '').split('|').map(i => i.trim()).filter(Boolean)
        bodyContent.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] }); break
      }
      case 'header':
        bodyContent.push({ text: line.text || '', fontSize: headerSize, bold: true, color: '#111111', characterSpacing: 0.5, margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.6, lineColor: '#aaaaaa' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 12, fontSize: bodySize, color: '#666666' }, { text: line.text || '', fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text || '', fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
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
      allContactItems.forEach(ci => textStack.push({ text: ci, fontSize: 9, color: '#666666', margin: [0, 0, 0, 2], lineHeight: 1.3 }))
      headerContent = [{ columns: [{ stack: textStack, width: '*' }, { stack: [{ image: photo, fit: [68, 87], alignment: 'right' }], width: 75, margin: [8, 0, 0, 0] }], columnGap: 8, margin: [0, 0, 0, 14] }]
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
    pageBreakBefore: function(currentNode, followingNodesOnPage) {
      return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
    },
  }
  return autoFitToOnePage(docDef, text)
}

// ── Structured data extractor for Sharp/Option A template ────────────────────

export function buildSharpStructure(lines) {
  const name = lines.find(l => l.type === 'name')?.text || ''

  const contactItems = []
  const _yearOnly = /^\d{4}$/
  const _dateRange = /^\d{4}\s*[-–]\s*(\d{4}|heute|present|laufend)$/i
  const _doubleYear = /^\d{4}\s+\d{4}$/
  for (const line of lines) {
    if (line.type !== 'contact') continue
    line.text.split('|').map(s => s.trim()).filter(Boolean)
      .filter(item => !_yearOnly.test(item) && !_dateRange.test(item) && !_doubleYear.test(item))
      .forEach(item => contactItems.push(item))
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

function buildSharpSection(title, content, isFirst = false) {
  const lines = (content || '').split('\n')
  const contentItems = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isBullet = line.startsWith('• ')
    const prevIsBullet = i > 0 && lines[i - 1].startsWith('• ')
    if (!isBullet && prevIsBullet) {
      contentItems.push({ text: '', margin: [0, 6, 0, 0] })
    }
    if (isBullet) {
      contentItems.push({ text: line, fontSize: 11, color: '#444444', margin: [6, 0, 0, 1], lineHeight: 1.5 })
    } else {
      contentItems.push({ text: line, fontSize: 10, bold: true, color: '#1a1a1a', margin: [0, 0, 0, 2] })
    }
  }
  return [
    { text: title.toUpperCase(), fontSize: 10, bold: true, color: '#1D9E75', margin: [0, isFirst ? 0 : 12, 0, 3] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 350, y2: 0, lineWidth: 1, lineColor: '#1D9E75' }], margin: [0, 0, 0, 5] },
    contentItems.length ? { stack: contentItems } : { text: '' },
  ]
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
    sidebarChildren.push({ text: 'SKILLS', fontSize: 8, bold: true, color: GREEN, margin: [0, 0, 0, 3] })
    sidebarChildren.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 110, y2: 0, lineWidth: 0.8, lineColor: GREEN }], margin: [0, 0, 0, 5] })
    skills.forEach(skill => {
      const colonIdx = skill.indexOf(':')
      if (colonIdx > 0 && colonIdx < 30) {
        const label = skill.slice(0, colonIdx).trim()
        const items = skill.slice(colonIdx + 1).split(',').map(s => s.trim()).filter(Boolean)
        if (items.length > 0) {
          sidebarChildren.push({ text: label, fontSize: 8, bold: true, color: '#333333', margin: [0, 4, 0, 2] })
          items.forEach(item => {
            sidebarChildren.push({ columns: [{ canvas: [{ type: 'ellipse', x: 3, y: 4, r1: 2.5, r2: 2.5, color: '#1D9E75' }], width: 10 }, { text: item, fontSize: 8.5, color: '#444444' }], margin: [0, 0, 0, 3] })
          })
          return
        }
      }
      skill.split(',').map(s => s.trim()).filter(Boolean).forEach(item => {
        sidebarChildren.push({ columns: [{ canvas: [{ type: 'ellipse', x: 3, y: 4, r1: 2.5, r2: 2.5, color: '#1D9E75' }], width: 10 }, { text: item, fontSize: 8.5, color: '#444444' }], margin: [0, 0, 0, 3] })
      })
    })
  }
  sections.filter(s => s.sidebar).forEach(section => {
    sidebarChildren.push({ text: section.title.toUpperCase(), fontSize: 8, bold: true, color: GREEN, margin: [0, 12, 0, 3] })
    sidebarChildren.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 110, y2: 0, lineWidth: 0.8, lineColor: GREEN }], margin: [0, 0, 0, 4] })
    sidebarChildren.push({ text: section.content, fontSize: 8.5, color: '#444444', lineHeight: 1.5 })
  })
  if (sidebarChildren.length === 0) sidebarChildren.push({ text: '' })

  // Main content stack
  const mainChildren = []
  sections.filter(s => !s.sidebar).forEach((section, i) => {
    buildSharpSection(section.title, section.content, i === 0).forEach(item => mainChildren.push(item))
  })
  if (mainChildren.length === 0) mainChildren.push({ text: '' })

  return {
    pageSize: 'A4',
    pageMargins: [0, 55, 0, 40],
    header: function(currentPage) {
      if (currentPage === 1) return { text: '', margin: [0, 0, 0, 0] };
      return { text: '', margin: [0, 55, 0, 0] };
    },
    content: [
      // Green header — absolutePosition renders at y:0 over the margin area (page 1 only)
      {
        absolutePosition: { x: 0, y: 0 },
        table: {
          widths: ['100%'],
          body: [[{
            stack: [
              { text: sanitizeTextForPDF((name || '').toUpperCase()), fontSize: 22, bold: true, color: '#FFFFFF', characterSpacing: 0.5, margin: [24, 16, 24, 8] },
              {
                table: { widths: ['*'], body: [[{
                  text: sanitizeTextForPDF(contactLine || ''),
                  fontSize: 8.5, color: '#FFFFFF',
                  margin: [24, 6, 24, 6],
                  fillColor: '#0f6b45',
                  border: [false, false, false, false],
                }]] },
                layout: { defaultBorder: false, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
                margin: [0, 0, 0, 8],
              },
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
      // Spacer pushes body content below the green header on page 1
      // (pageMargins top=55 already provides page 2+ margin)
      { text: '', margin: [0, 25, 0, 0] },
      // Two-column body
      {
        table: {
          widths: ['36%', '*'],
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
    defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.55 },
  }
}

// ── Auto-fit to one A4 page ──────────────────────────────────────────────────

function estimatedPageCount(text, fontSize) {
  const totalChars = text.length
  const charsPerPage = fontSize > 10.5 ? 2700 : fontSize > 9.5 ? 3000 : fontSize > 8.5 ? 3600 : 4200
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
  const FONT_STEPS = [11, 10.5, 10, 9.5, 9, 8.5, 8, 7.5]
  for (const fontSize of FONT_STEPS) {
    if (estimatedPageCount(text, fontSize) <= 1) {
      return applyFontScale(docDefinition, fontSize)
    }
  }
  return applyFontScale(docDefinition, 7.5)
}

function shouldCompress(text) {
  const estimatedPages = text.length / 3200;
  return estimatedPages > 1.0 && estimatedPages < 1.15;
}

function applyCompression(docDef) {
  function scaleNode(node) {
    if (!node || typeof node !== 'object') return;
    if (node.fontSize && node.fontSize >= 9 && node.fontSize <= 11) {
      node.fontSize = node.fontSize - 0.5;
    }
    if (node.margin && Array.isArray(node.margin)) {
      node.margin = node.margin.map((m, i) =>
        (i === 1 || i === 3) ? Math.max(1, Math.floor(m * 0.75)) : m
      );
    }
    Object.values(node).forEach(v => {
      if (Array.isArray(v)) v.forEach(scaleNode);
      else if (v && typeof v === 'object') scaleNode(v);
    });
  }
  const compressed = JSON.parse(JSON.stringify(docDef));
  scaleNode(compressed);
  return compressed;
}

function applyMicroCompression(docDef) {
  function scaleNode(node) {
    if (!node || typeof node !== 'object') return;
    if (node.fontSize && node.fontSize >= 10 && node.fontSize <= 12) {
      node.fontSize = node.fontSize - 0.5;
    }
    if (node.margin && Array.isArray(node.margin)) {
      node.margin = node.margin.map((m, i) =>
        (i === 1 || i === 3) ? Math.max(1, Math.floor(m * 0.82)) : m
      );
    }
    if (node.lineHeight && node.lineHeight > 1.3) {
      node.lineHeight = Math.max(1.3, node.lineHeight - 0.1);
    }
    Object.values(node).forEach(v => {
      if (Array.isArray(v)) v.forEach(scaleNode);
      else if (v && typeof v === 'object') scaleNode(v);
    });
  }
  const compressed = JSON.parse(JSON.stringify(docDef));
  scaleNode(compressed);
  return compressed;
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

// ── Cover letter PDF builders — one per template ─────────────────────────────

function buildMinimalCoverLetterPDF(data) {
  const safe = (v) => v || ''
  return {
    pageSize: 'A4',
    pageMargins: [70, 65, 70, 65],
    content: [
      { text: safe(data.sender_name), fontSize: 16, bold: true, color: '#1a1a1a', margin: [0,0,0,4] },
      { text: [safe(data.sender_address), safe(data.sender_postal)].filter(Boolean).join(', '), fontSize: 9.5, color: '#555555', margin: [0,0,0,2] },
      { text: safe(data.sender_email), fontSize: 9.5, color: '#555555', margin: [0,0,0,2] },
      { text: safe(data.sender_phone), fontSize: 9.5, color: '#555555', margin: [0,0,0,10] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0,0,0,14] },
      { text: safe(data.date), fontSize: 10, color: '#555555', italics: true, alignment: 'right', margin: [0,0,0,12] },
      { text: safe(data.recipient_company), fontSize: 10, color: '#333333', margin: [0,0,0,14], lineHeight: 1.5 },
      { text: safe(data.subject), fontSize: 11, bold: true, color: '#1a1a1a', margin: [0,0,0,14] },
      { text: safe(data.salutation), fontSize: 11, margin: [0,0,0,12] },
      { text: safe(data.body_paragraph_1), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [0,0,0,12] },
      { text: safe(data.body_paragraph_2), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [0,0,0,12] },
      { text: safe(data.body_paragraph_3), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [0,0,0,24] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0,0,0,14] },
      { text: safe(data.closing), fontSize: 11, margin: [0,0,0,36] },
      { text: safe(data.signature), fontSize: 11, bold: true },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#1a1a1a' },
  }
}

function buildModernCoverLetterPDF(data) {
  const safe = (v) => v || ''
  const ACCENT = '#1D9E75'
  return {
    pageSize: 'A4',
    pageMargins: [0, 0, 60, 60],
    content: [
      {
        table: {
          widths: ['100%'],
          body: [[{
            stack: [
              { text: safe(data.sender_name), fontSize: 18, bold: true, color: '#FFFFFF', margin: [60, 28, 24, 6] },
              { text: [safe(data.sender_email), safe(data.sender_phone), safe(data.sender_address)].filter(Boolean).join('   ·   '), fontSize: 8.5, color: '#cccccc', margin: [60, 0, 24, 12] },
            ],
            fillColor: '#1a1a1a',
            border: [false, false, false, false],
          }]],
        },
        layout: { defaultBorder: false, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
      },
      {
        columns: [
          { canvas: [{ type: 'rect', x: 0, y: 0, w: 3, h: 680, color: ACCENT }], width: 3 },
          {
            width: '*',
            stack: [
              { text: safe(data.date), fontSize: 10, color: '#555555', italics: true, alignment: 'right', margin: [24, 20, 0, 12] },
              { text: safe(data.recipient_company), fontSize: 10, color: '#333333', margin: [24, 0, 0, 14], lineHeight: 1.5 },
              { text: safe(data.subject), fontSize: 11, bold: true, color: ACCENT, margin: [24, 0, 0, 14] },
              { text: safe(data.salutation), fontSize: 11, margin: [24, 0, 0, 12] },
              { text: safe(data.body_paragraph_1), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [24, 0, 0, 12] },
              { text: safe(data.body_paragraph_2), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [24, 0, 0, 12] },
              { text: safe(data.body_paragraph_3), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [24, 0, 0, 24] },
              { canvas: [{ type: 'line', x1: 24, y1: 0, x2: 480, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 0, 0, 14] },
              { text: safe(data.closing), fontSize: 11, margin: [24, 0, 0, 36] },
              { text: safe(data.signature), fontSize: 11, bold: true, margin: [24, 0, 0, 0] },
            ],
          },
        ],
        columnGap: 0,
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#1a1a1a' },
  }
}

function buildClassicCoverLetterPDF(data) {
  const safe = (v) => v || ''
  return {
    pageSize: 'A4',
    pageMargins: [70, 65, 70, 65],
    content: [
      { text: safe(data.sender_name), fontSize: 16, bold: true, color: '#1a1a1a', alignment: 'center', margin: [0,0,0,4] },
      { text: [safe(data.sender_address), safe(data.sender_postal)].filter(Boolean).join(' | '), fontSize: 9.5, color: '#555555', alignment: 'center', margin: [0,0,0,2] },
      { text: [safe(data.sender_email), safe(data.sender_phone)].filter(Boolean).join(' | '), fontSize: 9.5, color: '#555555', alignment: 'center', margin: [0,0,0,10] },
      { canvas: [{ type: 'line', x1: 100, y1: 0, x2: 355, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0,0,0,16] },
      { text: safe(data.date), fontSize: 10, color: '#555555', italics: true, alignment: 'right', margin: [0,0,0,14] },
      { text: safe(data.recipient_company), fontSize: 10, color: '#333333', margin: [0,0,0,16], lineHeight: 1.5 },
      { text: safe(data.subject), fontSize: 11, bold: true, color: '#1a1a1a', decoration: 'underline', margin: [0,0,0,16] },
      { text: safe(data.salutation), fontSize: 11, margin: [0,0,0,14] },
      { text: safe(data.body_paragraph_1), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [0,0,0,12] },
      { text: safe(data.body_paragraph_2), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [0,0,0,12] },
      { text: safe(data.body_paragraph_3), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [0,0,0,24] },
      { text: safe(data.closing), fontSize: 11, margin: [0,0,0,36] },
      { text: safe(data.signature), fontSize: 11, bold: true },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#1a1a1a' },
  }
}

function buildExecutiveCoverLetterPDF(data) {
  const safe = (v) => v || ''
  const ACCENT = '#1D9E75'
  return {
    pageSize: 'A4',
    pageMargins: [65, 60, 65, 60],
    content: [
      { text: safe(data.sender_name).toUpperCase(), fontSize: 20, bold: true, color: '#1a1a1a', margin: [0,0,0,6] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 465, y2: 0, lineWidth: 2, lineColor: ACCENT }], margin: [0,0,0,8] },
      { text: [safe(data.sender_email), safe(data.sender_phone), safe(data.sender_address), safe(data.sender_postal)].filter(Boolean).join('   ·   '), fontSize: 9, color: '#666666', margin: [0,0,0,18] },
      { text: safe(data.date), fontSize: 10, color: '#555555', italics: true, alignment: 'right', margin: [0,0,0,14] },
      { text: safe(data.recipient_company), fontSize: 10.5, color: '#333333', margin: [0,0,0,14], lineHeight: 1.5 },
      {
        table: { widths: ['100%'], body: [[{ text: safe(data.subject), fontSize: 11, bold: true, color: '#1a1a1a', fillColor: '#f0faf7', margin: [10,8,10,8], border: [false,false,false,false] }]] },
        layout: 'noBorders',
        margin: [0,0,0,16],
      },
      { text: safe(data.salutation), fontSize: 11, margin: [0,0,0,14] },
      { text: safe(data.body_paragraph_1), fontSize: 11, lineHeight: 1.75, color: '#333333', margin: [0,0,0,14] },
      { text: safe(data.body_paragraph_2), fontSize: 11, lineHeight: 1.75, color: '#333333', margin: [0,0,0,14] },
      { text: safe(data.body_paragraph_3), fontSize: 11, lineHeight: 1.75, color: '#333333', margin: [0,0,0,28] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 465, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0,0,0,16] },
      { text: safe(data.closing), fontSize: 11, margin: [0,0,0,40] },
      { text: safe(data.signature), fontSize: 11, bold: true },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#1a1a1a' },
  }
}

function buildSharpCoverLetterPDF(data) {
  const safe = (v) => v || ''
  const ACCENT = '#1D9E75'
  return {
    pageSize: 'A4',
    pageMargins: [0, 55, 55, 55],
    header: function(currentPage) {
      if (currentPage === 1) return { text: '', margin: [0, 0, 0, 0] }
      return { text: '', margin: [0, 55, 0, 0] }
    },
    content: [
      {
        absolutePosition: { x: 0, y: 0 },
        table: {
          widths: ['100%'],
          body: [[{
            stack: [
              { text: safe(data.sender_name).toUpperCase(), fontSize: 16, bold: true, color: '#FFFFFF', margin: [24, 16, 24, 8] },
              {
                table: { widths: ['100%'], body: [[{
                  text: [safe(data.sender_email), safe(data.sender_phone), safe(data.sender_address)].filter(Boolean).join('   ·   '),
                  fontSize: 8.5, color: '#FFFFFF', fillColor: '#0f6b45', margin: [24, 5, 24, 5],
                  border: [false, false, false, false],
                }]] },
                layout: { defaultBorder: false, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
              },
            ],
            fillColor: ACCENT,
            border: [false, false, false, false],
          }]],
        },
        layout: { defaultBorder: false, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
      },
      { text: '', margin: [0, 20, 0, 0] },
      {
        columns: [
          { canvas: [{ type: 'rect', x: 0, y: 0, w: 3, h: 680, color: ACCENT }], width: 3 },
          {
            width: '*',
            stack: [
              { text: safe(data.date), fontSize: 10, color: '#555555', italics: true, alignment: 'right', margin: [20, 0, 0, 12] },
              { text: safe(data.recipient_company), fontSize: 10, color: '#333333', margin: [20, 0, 0, 14], lineHeight: 1.5 },
              { canvas: [{ type: 'line', x1: 20, y1: 0, x2: 480, y2: 0, lineWidth: 0.5, lineColor: ACCENT }], margin: [0, 0, 0, 8] },
              {
                table: { widths: ['100%'], body: [[{ text: safe(data.subject), fontSize: 11, bold: true, color: '#1a1a1a', fillColor: '#f0faf7', margin: [8,6,8,6], border: [false,false,false,false] }]] },
                layout: 'noBorders',
                margin: [20, 0, 0, 14],
              },
              { text: safe(data.salutation), fontSize: 11, bold: true, margin: [20, 0, 0, 12] },
              { text: safe(data.body_paragraph_1), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [20, 0, 0, 12] },
              { text: safe(data.body_paragraph_2), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [20, 0, 0, 12] },
              { text: safe(data.body_paragraph_3), fontSize: 11, lineHeight: 1.7, color: '#333333', margin: [20, 0, 0, 24] },
              { canvas: [{ type: 'line', x1: 20, y1: 0, x2: 480, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 0, 0, 14] },
              { text: safe(data.closing), fontSize: 11, margin: [20, 0, 0, 36] },
              { text: safe(data.signature), fontSize: 11, bold: true, margin: [20, 0, 0, 0] },
            ],
          },
        ],
        columnGap: 0,
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#1a1a1a' },
  }
}

export function buildCoverLetterPDF(data, template = 'minimal') {
  if (!data || typeof data !== 'object') throw new Error('Invalid cover letter data')
  const builders = {
    minimal:   buildMinimalCoverLetterPDF,
    modern:    buildModernCoverLetterPDF,
    classic:   buildClassicCoverLetterPDF,
    executive: buildExecutiveCoverLetterPDF,
    sharp:     buildSharpCoverLetterPDF,
  }
  const builder = builders[template] || builders.minimal
  return builder(data)
}

// ── Cover letter Word builder (structured data) ──────────────────────────────

export async function buildCoverLetterWord(data, template = 'minimal') {
  if (!data || typeof data !== 'object') throw new Error('Invalid cover letter data')

  const { Document, Paragraph, TextRun, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType } = await import('docx')

  const ACCENT = '1D9E75'
  const safe = (v) => v || ''

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

  const makePara = (text, opts = {}) => new Paragraph({
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: { before: opts.before || 0, after: opts.after !== undefined ? opts.after : 80 },
    children: [new TextRun({
      text: safe(text),
      size: opts.size || 22,
      bold: opts.bold || false,
      italics: opts.italics || false,
      underline: opts.underline ? {} : undefined,
      color: opts.color || '1a1a1a',
      font: 'Arial',
    })],
  })

  const makeContactLine = (parts, opts = {}) => new Paragraph({
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: { before: 0, after: opts.after !== undefined ? opts.after : 60 },
    children: parts.filter(Boolean).map((part, i, arr) => new TextRun({
      text: i < arr.length - 1 ? part + '   ·   ' : part,
      size: opts.size || 18,
      color: opts.color || '555555',
      font: 'Arial',
    })),
  })

  const makeGreyDivider = (borderColor = 'cccccc', borderSize = 6, afterSpacing = 200) => new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: borderSize, color: borderColor } },
    spacing: { before: 0, after: afterSpacing },
    children: [],
  })

  const makeBodyParagraph = (text, afterSpacing = 160) => new Paragraph({
    spacing: { before: 0, after: afterSpacing },
    children: [new TextRun({ text: safe(text), size: 22, color: '333333', font: 'Arial' })],
  })

  let children = []

  if (template === 'minimal') {
    children.push(makePara(data.sender_name, { size: 30, bold: true, after: 60 }))
    children.push(makeContactLine(
      [safe(data.sender_address), safe(data.sender_postal)].filter(Boolean),
      { after: 60 }
    ))
    children.push(makeContactLine(
      [safe(data.sender_email), safe(data.sender_phone)].filter(Boolean),
      { after: 140 }
    ))
    children.push(makeGreyDivider('cccccc', 4, 200))
    children.push(makePara(data.date, { size: 18, color: '555555', italics: true, alignment: AlignmentType.RIGHT, after: 160 }))
    children.push(makePara(data.recipient_company, { size: 19, color: '333333', after: 200 }))
    children.push(makePara(data.subject, { size: 22, bold: true, after: 200 }))
    children.push(makePara(data.salutation, { size: 22, after: 160 }))
    children.push(makeBodyParagraph(data.body_paragraph_1, 160))
    children.push(makeBodyParagraph(data.body_paragraph_2, 160))
    children.push(makeBodyParagraph(data.body_paragraph_3, 320))
    children.push(makeGreyDivider('cccccc', 4, 200))
    children.push(makePara(data.closing, { size: 22, after: 480 }))
    children.push(makePara(data.signature, { size: 22, bold: true, after: 0 }))

  } else if (template === 'modern') {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [new TableCell({
          children: [
            makePara(data.sender_name, { size: 32, bold: true, color: 'FFFFFF', after: 80 }),
            makeContactLine(
              [safe(data.sender_email), safe(data.sender_phone), safe(data.sender_address)].filter(Boolean),
              { size: 17, color: 'CCCCCC', after: 60 }
            ),
          ],
          shading: { fill: '1a1a1a', type: ShadingType.CLEAR, color: '1a1a1a' },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          margins: { top: 240, bottom: 240, left: 600, right: 400 },
        })],
      })],
    }))
    children.push(makePara('', { after: 80 }))
    children.push(makePara(data.date, { size: 18, color: '555555', italics: true, alignment: AlignmentType.RIGHT, after: 160 }))
    children.push(makePara(data.recipient_company, { size: 19, color: '333333', after: 200 }))
    children.push(makePara(data.subject, { size: 22, bold: true, color: ACCENT, after: 200 }))
    children.push(makePara(data.salutation, { size: 22, after: 160 }))
    children.push(makeBodyParagraph(data.body_paragraph_1, 160))
    children.push(makeBodyParagraph(data.body_paragraph_2, 160))
    children.push(makeBodyParagraph(data.body_paragraph_3, 320))
    children.push(makeGreyDivider('cccccc', 4, 200))
    children.push(makePara(data.closing, { size: 22, after: 480 }))
    children.push(makePara(data.signature, { size: 22, bold: true, after: 0 }))

  } else if (template === 'classic') {
    children.push(makePara(data.sender_name, { size: 30, bold: true, alignment: AlignmentType.CENTER, after: 60 }))
    children.push(makeContactLine(
      [safe(data.sender_address), safe(data.sender_postal)].filter(Boolean),
      { after: 60, alignment: AlignmentType.CENTER }
    ))
    children.push(makeContactLine(
      [safe(data.sender_email), safe(data.sender_phone)].filter(Boolean),
      { after: 140, alignment: AlignmentType.CENTER }
    ))
    children.push(makeGreyDivider('cccccc', 4, 200))
    children.push(makePara(data.date, { size: 18, color: '555555', italics: true, alignment: AlignmentType.RIGHT, after: 180 }))
    children.push(makePara(data.recipient_company, { size: 19, color: '333333', after: 200 }))
    children.push(makePara(data.subject, { size: 22, bold: true, underline: true, after: 200 }))
    children.push(makePara(data.salutation, { size: 22, after: 160 }))
    children.push(makeBodyParagraph(data.body_paragraph_1, 160))
    children.push(makeBodyParagraph(data.body_paragraph_2, 160))
    children.push(makeBodyParagraph(data.body_paragraph_3, 320))
    children.push(makePara(data.closing, { size: 22, after: 480 }))
    children.push(makePara(data.signature, { size: 22, bold: true, after: 0 }))

  } else if (template === 'executive') {
    children.push(makePara((safe(data.sender_name)).toUpperCase(), { size: 36, bold: true, after: 0 }))
    children.push(makeGreyDivider(ACCENT, 18, 80))
    children.push(makeContactLine(
      [safe(data.sender_email), safe(data.sender_phone), safe(data.sender_address), safe(data.sender_postal)].filter(Boolean),
      { size: 17, color: '666666', after: 240 }
    ))
    children.push(makePara(data.date, { size: 18, color: '555555', italics: true, alignment: AlignmentType.RIGHT, after: 180 }))
    children.push(makePara(data.recipient_company, { size: 19, color: '333333', after: 200 }))
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [new TableCell({
          children: [makePara(data.subject, { size: 22, bold: true, after: 0 })],
          shading: { fill: 'f0faf7', type: ShadingType.CLEAR, color: 'f0faf7' },
          borders: { top: noBorder, bottom: noBorder, left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT }, right: noBorder },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
        })],
      })],
    }))
    children.push(makePara('', { after: 80 }))
    children.push(makePara(data.salutation, { size: 22, after: 180 }))
    children.push(makeBodyParagraph(data.body_paragraph_1, 160))
    children.push(makeBodyParagraph(data.body_paragraph_2, 160))
    children.push(makeBodyParagraph(data.body_paragraph_3, 320))
    children.push(makeGreyDivider('cccccc', 4, 200))
    children.push(makePara(data.closing, { size: 22, after: 500 }))
    children.push(makePara(data.signature, { size: 22, bold: true, after: 0 }))

  } else {
    // sharp
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [new TableCell({
          children: [
            makePara((safe(data.sender_name)).toUpperCase(), { size: 30, bold: true, color: 'FFFFFF', after: 80 }),
          ],
          shading: { fill: ACCENT, type: ShadingType.CLEAR, color: ACCENT },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          margins: { top: 180, bottom: 80, left: 400, right: 400 },
        })],
      }), new TableRow({
        children: [new TableCell({
          children: [
            makeContactLine(
              [safe(data.sender_email), safe(data.sender_phone), safe(data.sender_address)].filter(Boolean),
              { size: 16, color: 'FFFFFF', after: 0 }
            ),
          ],
          shading: { fill: '0f6b45', type: ShadingType.CLEAR, color: '0f6b45' },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          margins: { top: 80, bottom: 80, left: 400, right: 400 },
        })],
      })],
    }))
    children.push(makePara('', { after: 160 }))
    children.push(makePara(data.date, { size: 18, color: '555555', italics: true, alignment: AlignmentType.RIGHT, after: 160 }))
    children.push(makePara(data.recipient_company, { size: 19, color: '333333', after: 200 }))
    children.push(makeGreyDivider(ACCENT, 6, 120))
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [new TableCell({
          children: [makePara(data.subject, { size: 22, bold: true, after: 0 })],
          shading: { fill: 'f0faf7', type: ShadingType.CLEAR, color: 'f0faf7' },
          borders: { top: noBorder, bottom: noBorder, left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT }, right: noBorder },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
        })],
      })],
    }))
    children.push(makePara('', { after: 80 }))
    children.push(makePara(data.salutation, { size: 22, bold: true, after: 160 }))
    children.push(makeBodyParagraph(data.body_paragraph_1, 160))
    children.push(makeBodyParagraph(data.body_paragraph_2, 160))
    children.push(makeBodyParagraph(data.body_paragraph_3, 320))
    children.push(makeGreyDivider('cccccc', 4, 200))
    children.push(makePara(data.closing, { size: 22, after: 480 }))
    children.push(makePara(data.signature, { size: 22, bold: true, after: 0 }))
  }

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
    if (shouldCompress(cleanText)) {
      docDef = applyMicroCompression(docDef)
    }
  }

  const { valid, issues } = validatePDFStructure(docDef)
  if (!valid) {
    console.warn('PDF Quality Agent fixed issues:', issues)
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

// ── Structured parser for non-sharp Word builders ───────────────────────────

function parseDocWordStructure(lines) {
  const name = lines.find(l => l.type === 'name')?.text || ''

  const contactItems = []
  for (const line of lines) {
    if (line.type !== 'contact') continue
    line.text.split('|').map(s => s.trim()).filter(Boolean).forEach(item => contactItems.push(item))
  }

  const sections = []
  let currentSection = null

  for (const line of lines) {
    if (line.type === 'name' || line.type === 'contact') continue
    if (line.type === 'header') {
      currentSection = { title: line.text, content: '' }
      sections.push(currentSection)
      continue
    }
    if (currentSection && line.type !== 'empty' && line.type !== 'divider') {
      const prefix = line.type === 'bullet' ? '• ' : ''
      if (currentSection.content) currentSection.content += '\n'
      currentSection.content += prefix + line.text
    }
  }

  return { name, contactItems, sections }
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
  const DARK = '1a1a1a'

  const safe = (v) => {
    if (v === undefined || v === null) return ''
    const s = String(v).trim()
    return s.toLowerCase() === 'undefined' ? '' : s
  }

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

  // ── Photo conversion ──────────────────────────────────────────────────────
  let photoBytes = null
  let photoType = 'jpg'
  if (photo) {
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
    // ── Sharp: two-column, green header, dark sidebar ──────────────────────
    const { name: sName, contactLine: sContact, sections: sSections, skills: sSkills } = buildSharpStructure(lines)

    const headerRow = new TableRow({
      children: [new TableCell({
        columnSpan: 2,
        children: [
          new Paragraph({
            children: [new TextRun({ text: safe(sName).toUpperCase() || ' ', bold: true, size: 40, color: 'FFFFFF', font: 'Calibri' })],
            spacing: { before: 200, after: 100 },
            indent: { left: 280 },
          }),
          new Paragraph({
            children: [new TextRun({ text: safe(sContact) || ' ', size: 18, color: 'E8F5F0', font: 'Calibri' })],
            spacing: { before: 0, after: 200 },
            indent: { left: 280 },
          }),
        ],
        shading: { fill: GREEN, type: ShadingType.CLEAR, color: GREEN },
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
      })],
    })

    const sidebarChildren = []
    if (photoBytes) {
      sidebarChildren.push(new Paragraph({
        children: [new ImageRun({ data: photoBytes, transformation: { width: 113, height: 142 }, type: photoType })],
        spacing: { before: 0, after: 160 },
      }))
    }
    const safeSkills = sSkills.filter(s => safe(s))
    if (safeSkills.length > 0) {
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: 'SKILLS', bold: true, size: 18, color: GREEN, font: 'Calibri' })],
        spacing: { before: 0, after: 80 },
      }))
      safeSkills.forEach(skill => {
        sidebarChildren.push(new Paragraph({
          children: [new TextRun({ text: '· ' + safe(skill), size: 22, color: '444444', font: 'Calibri' })],
          spacing: { before: 0, after: 100, line: 276 },
        }))
      })
    }
    sSections.filter(s => s.sidebar).forEach(section => {
      const sTitle = safe(section.title)
      const sContent = safe(section.content)
      if (!sTitle) return
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: sTitle.toUpperCase(), bold: true, size: 18, color: GREEN, font: 'Calibri' })],
        spacing: { before: 160, after: 80 },
      }))
      if (sContent) {
        sContent.split('\n').forEach(ln => {
          const sl = safe(ln)
          if (!sl) return
          sidebarChildren.push(new Paragraph({
            children: [new TextRun({ text: sl, size: 22, color: '444444', font: 'Calibri' })],
            spacing: { before: 0, after: 100, line: 276 },
          }))
        })
      }
    })
    if (sidebarChildren.length === 0) sidebarChildren.push(new Paragraph({ children: [] }))

    const mainChildren = []
    sSections.filter(s => !s.sidebar).forEach((section, i) => {
      const sTitle = safe(section.title)
      const sContent = safe(section.content)
      if (!sTitle) return
      mainChildren.push(new Paragraph({
        children: [new TextRun({ text: sTitle.toUpperCase(), bold: true, size: 18, color: GREEN, font: 'Calibri' })],
        spacing: { before: i === 0 ? 0 : 240, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } },
      }))
      if (sContent) {
        sContent.split('\n').forEach(ln => {
          const sl = safe(ln)
          if (!sl) return
          mainChildren.push(new Paragraph({
            children: [new TextRun({ text: sl, size: 22, color: '333333', font: 'Calibri' })],
            spacing: { before: 0, after: 100, line: 276 },
          }))
        })
      }
    })
    if (mainChildren.length === 0) mainChildren.push(new Paragraph({ children: [] }))

    const sidebarCell = new TableCell({
      width: { size: 36, type: WidthType.PERCENTAGE },
      children: sidebarChildren,
      margins: { top: 280, bottom: 280, left: 280, right: 280 },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: { style: BorderStyle.SINGLE, size: 16, color: GREEN } },
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

    sections = [{
      properties: { page: { margin: { top: 720, right: 1134, bottom: 720, left: 0 } } },
      children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, bodyRow] })],
    }]

  } else {
    // ── Per-template builders: Minimal, Modern, Classic, Executive ────────
    const { name: pName, contactItems: pContact, sections: pSections } = parseDocWordStructure(lines)
    const safeContactItems = pContact.map(c => safe(c)).filter(Boolean)

    function contactRuns(opts = {}) {
      const runs = []
      safeContactItems.forEach((item, i) => {
        runs.push(new TextRun({ text: item, size: opts.size || 18, color: opts.color || '555555', font: 'Arial' }))
        if (i < safeContactItems.length - 1) {
          runs.push(new TextRun({ text: '   |   ', size: opts.size || 18, color: opts.sepColor || '888888', font: 'Arial' }))
        }
      })
      return runs
    }

    function photoCell(width = 20) {
      return new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new ImageRun({ data: photoBytes, transformation: { width: 65, height: 83 }, type: photoType })], spacing: { after: 0 } })],
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      })
    }

    function renderSections(children, sectionList, opts = {}) {
      sectionList.forEach(section => {
        const sTitle = safe(section.title)
        const sContent = safe(section.content)
        if (!sTitle || !sContent) return
        children.push(new Paragraph({
          children: [new TextRun({ text: sTitle.toUpperCase(), bold: true, size: 22, font: 'Arial', color: opts.titleColor || '1a1a1a', underline: opts.underline ? {} : undefined })],
          border: opts.border || undefined,
          spacing: { before: opts.spaceBefore || 240, after: 100 },
        }))
        sContent.split('\n').filter(Boolean).forEach(line => {
          const cl = safe(line)
          if (!cl) return
          children.push(new Paragraph({
            children: [new TextRun({ text: cl, size: 22, color: '333333', font: 'Arial' })],
            indent: cl.startsWith('•') ? { left: 220 } : undefined,
            spacing: { after: 80, line: 320 },
          }))
        })
      })
    }

    const children = []
    const safeName = safe(pName)

    if (template === 'modern') {
      // ── Modern: dark header bar, green section headings ──────────────────
      const headerNamePara = new Paragraph({
        children: [new TextRun({ text: safeName, bold: true, size: 36, color: 'FFFFFF', font: 'Arial' })],
        spacing: { after: 80 },
      })
      const headerContactPara = new Paragraph({
        children: contactRuns({ size: 17, color: 'CCCCCC', sepColor: '666666' }),
        spacing: { after: 60 },
      })
      const headerCellContent = [headerNamePara, headerContactPara]

      if (photoBytes) {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                children: headerCellContent,
                shading: { fill: DARK, type: ShadingType.CLEAR, color: DARK },
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                margins: { top: 240, bottom: 240, left: 560, right: 200 },
              }),
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new ImageRun({ data: photoBytes, transformation: { width: 65, height: 83 }, type: photoType })], spacing: { after: 0 } })],
                shading: { fill: DARK, type: ShadingType.CLEAR, color: DARK },
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                margins: { top: 240, bottom: 240, right: 400, left: 0 },
              }),
            ],
          })],
        }))
      } else {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            children: [new TableCell({
              children: headerCellContent,
              shading: { fill: DARK, type: ShadingType.CLEAR, color: DARK },
              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
              margins: { top: 240, bottom: 240, left: 560, right: 400 },
            })],
          })],
        }))
      }
      children.push(new Paragraph({ spacing: { after: 200 } }))
      renderSections(children, pSections, {
        titleColor: GREEN,
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GREEN } },
        spaceBefore: 280,
      })
      sections = [{ properties: { page: { margin: { top: 0, right: 900, bottom: 900, left: 900 } } }, children }]

    } else if (template === 'classic') {
      // ── Classic: centered name, underlined section headers ───────────────
      if (photoBytes) {
        const textStack = [
          new Paragraph({
            children: [new TextRun({ text: safeName, bold: true, size: 40, font: 'Arial', color: '1a1a1a' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: contactRuns(),
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }),
        ]
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                children: textStack,
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                margins: { top: 0, bottom: 0, left: 0, right: 200 },
              }),
              photoCell(),
            ],
          })],
        }))
      } else {
        if (safeName) children.push(new Paragraph({
          children: [new TextRun({ text: safeName, bold: true, size: 40, font: 'Arial' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }))
        if (safeContactItems.length) children.push(new Paragraph({
          children: contactRuns(),
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }))
      }
      children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc' } }, spacing: { after: 200 } }))
      renderSections(children, pSections, { underline: true })
      sections = [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]

    } else if (template === 'executive') {
      // ── Executive: uppercase name, thick green line ──────────────────────
      if (photoBytes) {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: safeName.toUpperCase(), bold: true, size: 44, font: 'Arial', color: '1a1a1a' })],
                    spacing: { after: 80 },
                  }),
                  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: GREEN } }, spacing: { after: 120 } }),
                  new Paragraph({ children: contactRuns({ color: '666666', sepColor: '888888' }), spacing: { after: 0 } }),
                ],
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                margins: { top: 0, bottom: 0, left: 0, right: 200 },
              }),
              photoCell(),
            ],
          })],
        }))
      } else {
        if (safeName) children.push(new Paragraph({
          children: [new TextRun({ text: safeName.toUpperCase(), bold: true, size: 44, font: 'Arial' })],
          spacing: { after: 80 },
        }))
        children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: GREEN } }, spacing: { after: 120 } }))
        if (safeContactItems.length) children.push(new Paragraph({
          children: contactRuns({ color: '666666', sepColor: '888888' }),
          spacing: { after: 120 },
        }))
      }
      children.push(new Paragraph({ spacing: { after: 160 } }))
      renderSections(children, pSections, {
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GREEN } },
        spaceBefore: 280,
      })
      sections = [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]

    } else {
      // ── Minimal (default): single column, grey dividers ──────────────────
      if (photoBytes) {
        const headerParas = []
        if (safeName) headerParas.push(new Paragraph({
          children: [new TextRun({ text: safeName, bold: true, size: 40, font: 'Arial', color: '1a1a1a' })],
          spacing: { after: 60 },
        }))
        if (safeContactItems.length) headerParas.push(new Paragraph({
          children: contactRuns(),
          spacing: { after: 0 },
        }))
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                children: headerParas.length ? headerParas : [new Paragraph({ children: [] })],
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                margins: { top: 0, bottom: 0, left: 0, right: 200 },
              }),
              photoCell(),
            ],
          })],
        }))
      } else {
        if (safeName) children.push(new Paragraph({
          children: [new TextRun({ text: safeName, bold: true, size: 40, font: 'Arial', color: '1a1a1a' })],
          spacing: { after: 60 },
        }))
        if (safeContactItems.length) children.push(new Paragraph({
          children: contactRuns(),
          spacing: { after: 120 },
        }))
      }
      children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc' } }, spacing: { after: 200 } }))
      renderSections(children, pSections, {
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'cccccc' } },
      })
      sections = [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]
    }
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
