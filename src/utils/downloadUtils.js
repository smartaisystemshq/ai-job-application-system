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
  return [{ columns: [{ stack: headerItems, width: '*' }, { image: photo, width: 68, height: 87, alignment: 'right', margin: [4, 0, 0, 0] }], margin: [0, 0, 0, 6] }]
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
      if (citems.length > 1) {
        headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      } else {
        headerItems.push({ text: line.text, fontSize: contactSize, color: '#555555', margin: [0, 0, 0, 1] })
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
        bodyContent.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); break
      case 'contact':
        bodyContent.push({ text: line.text, fontSize: contactSize, color: '#555555', margin: [0, 0, 0, 1] }); break
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.6, lineColor: '#888888' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
  }
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
      if (citems.length > 1) {
        headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#666666', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      } else {
        headerItems.push({ text: line.text, fontSize: contactSize, color: '#666666', margin: [0, 0, 0, 1] })
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
        bodyContent.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', margin: [0, 0, 0, 2] }); break
      case 'contact':
        bodyContent.push({ text: line.text, fontSize: contactSize, color: '#666666', margin: [0, 0, 0, 1] }); break
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: GREEN, margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.0, lineColor: GREEN }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 12, fontSize: bodySize, color: GREEN }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [topBar, ...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
  }
}

function buildClassicPDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const headerItems = []
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 8)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const pw = 515 - (40 - margins[0]) * 2
  const hw = pw / 2

  for (const line of lines) {
    if (!headerDone && line.type === 'name') {
      headerItems.push({ text: line.text, fontSize: nameSize, bold: true, color: '#111111', alignment: photo ? 'left' : 'center', margin: [0, 0, 0, 2] })
      headerItems.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: '#333333' }], margin: [0, 0, 0, 1] })
      headerItems.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.5, lineColor: '#333333' }], margin: [0, 2, 0, 2] })
      continue
    }
    if (!headerDone && line.type === 'contact') {
      const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
      if (citems.length > 1) {
        headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      } else {
        headerItems.push({ text: line.text, fontSize: contactSize, color: '#555555', alignment: photo ? 'left' : 'center', margin: [0, 0, 0, 1] })
      }
      continue
    }
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
      case 'contact':
        bodyContent.push({ text: line.text, fontSize: contactSize, color: '#555555', alignment: 'center', margin: [0, 0, 0, 1] }); break
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.8, lineColor: '#555555' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#333333' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [8, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
  }
}

function buildExecutivePDF(text, sp, photo = null) {
  const { bodySize, margins, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const headerItems = []
  const bodyContent = []
  let headerDone = false
  const nameSize = Math.round(bodySize + 8)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5
  const GREEN = '#1D9E75'
  const pw = 515 - (40 - margins[0]) * 2

  for (const line of lines) {
    if (!headerDone && line.type === 'name') {
      headerItems.push({ text: line.text.toUpperCase(), fontSize: nameSize, bold: true, color: '#111111', letterSpacing: 2, margin: [0, 0, 0, 3] })
      headerItems.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: GREEN }], margin: [0, 0, 0, 4] })
      continue
    }
    if (!headerDone && line.type === 'contact') {
      const citems = line.text.split('|').map(i => i.trim()).filter(Boolean)
      if (citems.length > 1) {
        headerItems.push({ columns: citems.map(ci => ({ text: ci, fontSize: ci.length > 35 ? 7.5 : contactSize, color: '#555555', width: 'auto', noWrap: true })), columnGap: 8, margin: [0, 0, 0, 1] })
      } else {
        headerItems.push({ text: line.text, fontSize: contactSize, color: '#555555', margin: [0, 0, 0, 1] })
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
        bodyContent.push({ text: line.text.toUpperCase(), fontSize: nameSize, bold: true, color: '#111111', letterSpacing: 2, margin: [0, 0, 0, 3] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 1.5, lineColor: GREEN }], margin: [0, 0, 0, 4] }); break
      case 'contact':
        bodyContent.push({ text: line.text, fontSize: contactSize, color: '#555555', margin: [0, 0, 0, 1] }); break
      case 'header':
        bodyContent.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', characterSpacing: 0.5, margin: [0, hSpB, 0, 1] })
        bodyContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: pw, y2: 0, lineWidth: 0.6, lineColor: '#aaaaaa' }], margin: [0, 0, 0, hSpA] }); break
      case 'bullet':
        bodyContent.push({ columns: [{ text: '•', width: 12, fontSize: bodySize, color: '#666666' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] }); break
      case 'body':
        bodyContent.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] }); break
    }
  }

  return {
    pageSize: 'A4', pageMargins: margins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [...wrapHeaderWithPhoto(headerItems, photo), ...bodyContent],
  }
}

const SHARP_SIDEBAR_HEADERS_RE = /^(SKILLS|CORE COMPETENCIES|TECHNICAL SKILLS|KEY SKILLS|TECHNOLOGIES|PERSONAL STRENGTHS|STRENGTHS|PERSÖNLICHE STÄRKEN|STÄRKEN|SOFT SKILLS|KEY STRENGTHS)$/

function buildSharpPDF(text, sp, photo = null) {
  const { bodySize, lineHeight, hSpB, hSpA } = sp
  const lines = parseDocumentLines(text)
  const GREEN = '#1D9E75'
  const DARK = '#1a1a1a'
  const nameSize = Math.round(bodySize + 5)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5

  // Fixed tight margins for two-column layout
  const pageMargins = [20, 20, 20, 20]
  const totalW = 555          // 595 - 40
  const leftW = Math.round(totalW * 0.25)   // 139
  const rightW = totalW - leftW              // 416

  // Split: sidebar = name, contact, skills, personal strengths; main = everything else
  const sideLines = []
  const mainLines = []
  let inSidebarSection = false

  for (const line of lines) {
    if (line.type === 'name' || line.type === 'contact') {
      sideLines.push(line)
    } else if (line.type === 'header' && SHARP_SIDEBAR_HEADERS_RE.test(line.text)) {
      inSidebarSection = true
      sideLines.push(line)
    } else if (inSidebarSection && (line.type === 'body' || line.type === 'bullet' || line.type === 'empty')) {
      sideLines.push(line)
    } else {
      inSidebarSection = false
      mainLines.push(line)
    }
  }

  // Left (sidebar) stack
  const sideInnerW = leftW - 16
  const sideStack = []
  let lastSideType = null
  let sharpPhotoInserted = false
  for (const line of sideLines) {
    // Inject photo after last contact line (before first header)
    if (!sharpPhotoInserted && photo && lastSideType === 'contact' && line.type !== 'contact') {
      sideStack.push({ image: photo, width: sideInnerW * 0.75, height: Math.round(sideInnerW * 0.75 * 1.28), alignment: 'center', margin: [0, 5, 0, 5] })
      sharpPhotoInserted = true
    }
    switch (line.type) {
      case 'name':
        sideStack.push({ text: line.text, fontSize: nameSize, bold: true, color: '#ffffff', margin: [0, 0, 0, 3] })
        sideStack.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: sideInnerW, y2: 0, lineWidth: 1, lineColor: GREEN }], margin: [0, 0, 0, 5] })
        lastSideType = 'name'
        break
      case 'contact':
        sideStack.push({ text: line.text, fontSize: contactSize, color: '#aaaaaa', margin: [0, 0, 0, 2] })
        lastSideType = 'contact'
        break
      case 'header':
        if (lastSideType && lastSideType !== 'name') {
          sideStack.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: sideInnerW, y2: 0, lineWidth: 0.5, lineColor: GREEN }], margin: [0, 5, 0, 4] })
        }
        sideStack.push({ text: line.text, fontSize: bodySize, bold: true, color: '#ffffff', margin: [0, lastSideType === 'name' ? (hSpB || 6) : 1, 0, 2] })
        sideStack.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: sideInnerW, y2: 0, lineWidth: 0.6, lineColor: GREEN }], margin: [0, 0, 0, hSpA || 2] })
        lastSideType = 'header'
        break
      case 'bullet':
        sideStack.push({ text: '• ' + line.text, fontSize: bodySize - 0.5, color: '#cccccc', margin: [0, 1, 0, 1] })
        lastSideType = 'bullet'
        break
      case 'body':
        sideStack.push({ text: line.text, fontSize: bodySize - 0.5, color: '#cccccc', margin: [0, 1, 0, 1] })
        lastSideType = 'body'
        break
      case 'empty':
        sideStack.push({ text: ' ', fontSize: bodySize * 0.3, margin: [0, 0, 0, 0] })
        lastSideType = 'empty'
        break
    }
  }
  // If photo not yet inserted (no headers in sidebar), add at end
  if (!sharpPhotoInserted && photo) {
    sideStack.push({ image: photo, width: sideInnerW * 0.75, height: Math.round(sideInnerW * 0.75 * 1.28), alignment: 'center', margin: [0, 5, 0, 5] })
  }
  if (sideStack.length === 0) sideStack.push({ text: '' })

  // Right (main) stack
  const mainInnerW = rightW - 18
  const mainStack = []
  for (const line of mainLines) {
    switch (line.type) {
      case 'empty':
        mainStack.push({ text: ' ', fontSize: bodySize * 0.4, margin: [0, 0, 0, 0] })
        break
      case 'divider':
        mainStack.push({ canvas: [{ type: 'line', x1: 0, y1: 1, x2: mainInnerW, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 2, 0, 2] })
        break
      case 'header':
        // Monochrome: dark bold text with thin green underline
        mainStack.push({ text: line.text, fontSize: headerSize, bold: true, color: '#111111', margin: [0, hSpB || 6, 0, 1] })
        mainStack.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: mainInnerW, y2: 0, lineWidth: 0.8, lineColor: GREEN }], margin: [0, 0, 0, hSpA || 2] })
        break
      case 'bullet':
        mainStack.push({ columns: [{ text: '•', width: 10, fontSize: bodySize, color: '#444444' }, { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' }], margin: [4, 1, 0, 1] })
        break
      case 'body':
        mainStack.push({ text: line.text, fontSize: bodySize, color: '#2a2a2a', margin: [0, 1, 0, 1] })
        break
    }
  }
  if (mainStack.length === 0) mainStack.push({ text: '' })

  return {
    pageSize: 'A4',
    pageMargins,
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight },
    content: [{
      table: {
        widths: [leftW, rightW],
        body: [[
          { stack: sideStack, fillColor: DARK, margin: [8, 10, 8, 10] },
          { stack: mainStack, margin: [10, 10, 8, 10] },
        ]],
      },
      layout: 'noBorders',
    }],
  }
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

// ── Cover letter PDF builder ─────────────────────────────────────────────────

function buildCoverLetterPDFDocDef(text, bodySize, template = 'minimal') {
  const rawLines = text.split('\n')
  const blocks = []
  let cur = []
  for (const line of rawLines) {
    if (!line.trim()) {
      if (cur.length) { blocks.push(cur); cur = [] }
    } else { cur.push(line.trim()) }
  }
  if (cur.length) blocks.push(cur)

  const content = []
  const headerSize = bodySize + 1
  const smallSize = bodySize - 1
  const GREEN = '#1D9E75'
  const isModern = template === 'modern' || template === 'sharp'
  const isClassic = template === 'classic'
  const isExecutive = template === 'executive'

  // Template-specific top bar
  if (isModern) {
    content.push({ canvas: [{ type: 'rect', x: 0, y: 0, w: 455, h: 4, r: 0, color: GREEN }], margin: [0, 0, 0, 8] })
  }

  for (let i = 0; i < blocks.length; i++) {
    const blockLines = blocks[i]
    const joined = blockLines.join(' ')
    if (!joined) continue

    // First block: sender / name / contact info
    if (i === 0) {
      const name = blockLines[0]
      const contact = blockLines.slice(1).join('  |  ')

      if (isClassic) {
        content.push({ text: name, fontSize: headerSize + 2, bold: true, color: '#111111', alignment: 'center', margin: [0, 0, 0, 2] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 1.2, lineColor: '#333333' }], margin: [0, 0, 0, 1] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 0.4, lineColor: '#999999' }], margin: [0, 2, 0, 6] })
        if (contact) content.push({ text: contact, fontSize: smallSize, color: '#555555', alignment: 'center', margin: [0, 0, 0, 12] })
      } else if (isExecutive) {
        content.push({ text: name.toUpperCase(), fontSize: headerSize + 2, bold: true, color: '#111111', characterSpacing: 1.5, margin: [0, 0, 0, 4] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 2.5, lineColor: GREEN }], margin: [0, 0, 0, 6] })
        if (contact) content.push({ text: contact, fontSize: smallSize, color: '#555555', margin: [0, 0, 0, 8] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 0.4, lineColor: '#cccccc' }], margin: [0, 0, 0, 12] })
      } else if (isModern) {
        content.push({ text: name, fontSize: headerSize + 2, bold: true, color: '#111111', margin: [0, 0, 0, 4] })
        if (contact) content.push({ text: contact, fontSize: smallSize, color: '#555555', margin: [0, 0, 0, 6] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 1.2, lineColor: GREEN }], margin: [0, 0, 0, 12] })
      } else {
        // Minimal
        content.push({ text: name, fontSize: headerSize + 2, bold: true, color: '#111111', margin: [0, 0, 0, 4] })
        if (contact) content.push({ text: contact, fontSize: smallSize, color: '#555555', margin: [0, 0, 0, 8] })
        content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 0, 0, 12] })
      }
      continue
    }

    // Date line
    if (joined.length < 40 && i <= 2 &&
      /\d{4}|january|february|march|april|may|june|july|august|september|october|november|december|\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b/i.test(joined)) {
      content.push({ text: joined, fontSize: smallSize, color: '#555555', alignment: isClassic ? 'right' : 'left', margin: [0, 0, 0, 14] })
      continue
    }

    // Greeting / salutation
    if (/^dear\b|^to whom\b|^liebe[rs]?\b|^sehr geehrte[rs]?\b/i.test(joined)) {
      content.push({ text: joined, fontSize: bodySize, color: '#1a1a1a', margin: [0, 0, 0, bodySize], lineHeight: 1.55 })
      continue
    }

    // Closing
    if (i >= blocks.length - 2 && joined.length < 80 &&
      /^(best|kind|sincerely|yours|mit freundlichen|hochachtungsvoll|regards)/i.test(joined)) {
      for (const l of blockLines) {
        content.push({ text: l, fontSize: bodySize, color: '#1a1a1a', margin: [0, 2, 0, 2], lineHeight: 1.4 })
      }
      content.push({ text: ' ', fontSize: bodySize * 0.3, margin: [0, 0, 0, 0] })
      continue
    }

    // Body paragraph
    content.push({ text: joined, fontSize: bodySize, color: '#2a2a2a', margin: [0, 0, 0, bodySize * 1.1], lineHeight: 1.6 })
  }

  return {
    pageSize: 'A4',
    pageMargins: [60, 50, 60, 50],
    defaultStyle: { font: 'Roboto', fontSize: bodySize, lineHeight: 1.6 },
    content,
  }
}

// ── Public: download as PDF ──────────────────────────────────────────────────

export async function downloadAsPDF(text, filename, template = 'minimal', isLetter = false, photo = null) {
  const cleanText = stripMarkdown(text)
  const pdfMake = await loadPdfMake()
  const sp = isLetter ? { bodySize: 11, margins: [60,50,60,50], lineHeight: 1.6, hSpB: 0, hSpA: 0 } : getScalingParams(cleanText)
  const docDef = isLetter
    ? buildCoverLetterPDFDocDef(cleanText, sp.bodySize, template)
    : buildPDFDocDef(cleanText, sp, template, photo)

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
  const cleanText = stripMarkdown(text)
  const {
    Document, Packer, Paragraph, TextRun, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, ImageRun,
  } = await import('docx')

  // Cover letter: business letter format
  if (isLetter) {
    const rawLines = cleanText.split('\n')
    const blocks = []
    let cur = []
    for (const line of rawLines) {
      if (!line.trim()) {
        if (cur.length) { blocks.push(cur); cur = [] }
      } else { cur.push(line.trim()) }
    }
    if (cur.length) blocks.push(cur)

    const GREEN_WORD = '1D9E75'
    const isModern = template === 'modern' || template === 'sharp'
    const isClassic = template === 'classic'
    const isExecutive = template === 'executive'
    const letterFont = isClassic ? 'Georgia' : 'Calibri'

    const paras = []
    for (let i = 0; i < blocks.length; i++) {
      const blockLines = blocks[i]
      const joined = blockLines.join(' ')
      if (!joined) continue

      // First block: sender name (first line) + contact info (remaining lines)
      if (i === 0) {
        const name = blockLines[0]
        const contact = blockLines.slice(1).join('  |  ')
        const nameText = isExecutive ? name.toUpperCase() : name
        const namePara = new Paragraph({
          children: [new TextRun({ text: nameText, bold: true, size: 28, font: letterFont, color: '111111', characterSpacing: isExecutive ? 30 : 0 })],
          spacing: { after: 40 },
          alignment: isClassic ? 'center' : 'left',
        })
        paras.push(namePara)

        if (isClassic) {
          paras.push(new Paragraph({ children: [new TextRun({ text: '' })], border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '333333', space: 1 } }, spacing: { after: 60 } }))
        } else if (isExecutive) {
          paras.push(new Paragraph({ children: [new TextRun({ text: '' })], border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: GREEN_WORD, space: 1 } }, spacing: { after: 60 } }))
        } else if (isModern) {
          paras.push(new Paragraph({ children: [new TextRun({ text: '' })], border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: GREEN_WORD, space: 1 } }, spacing: { after: 40 } }))
        }

        if (contact) {
          const contactProps = {
            children: [new TextRun({ text: contact, size: 18, font: letterFont, color: '666666' })],
            spacing: { after: isClassic || isExecutive || isModern ? 80 : 60 },
            alignment: isClassic ? 'center' : 'left',
          }
          if (!isClassic && !isExecutive && !isModern) {
            contactProps.border = { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc', space: 4 } }
          }
          paras.push(new Paragraph(contactProps))
        } else if (!isClassic && !isExecutive && !isModern) {
          paras.push(new Paragraph({ children: [new TextRun({ text: '' })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc', space: 1 } }, spacing: { after: 80 } }))
        }
        continue
      }
      // Date line
      if (joined.length < 40 && i <= 2 &&
        /\d{4}|january|february|march|april|may|june|july|august|september|october|november|december|\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b/i.test(joined)) {
        paras.push(new Paragraph({ children: [new TextRun({ text: joined, size: 18, font: letterFont, color: '666666' })], spacing: { after: 200 }, alignment: isClassic ? 'right' : 'left' }))
        continue
      }
      // Greeting
      if (/^dear\b|^to whom\b|^liebe[rs]?\b|^sehr geehrte[rs]?\b/i.test(joined)) {
        paras.push(new Paragraph({ children: [new TextRun({ text: joined, size: 22, font: letterFont, color: '1a1a1a' })], spacing: { after: 160 } }))
        continue
      }
      // Closing (toward end, starts with closing phrase)
      if (i >= blocks.length - 2 && joined.length < 80 &&
        /^(best|kind|sincerely|yours|mit freundlichen|hochachtungsvoll|regards)/i.test(joined)) {
        for (const l of blockLines) {
          paras.push(new Paragraph({ children: [new TextRun({ text: l, size: 22, font: letterFont, color: '1a1a1a' })], spacing: { before: i === blocks.length - 2 ? 200 : 0, after: 60 } }))
        }
        continue
      }
      // Body paragraph
      paras.push(new Paragraph({ children: [new TextRun({ text: joined, size: 22, font: letterFont, color: '2a2a2a' })], spacing: { after: 200 } }))
    }

    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1000, right: 1200, bottom: 1000, left: 1200 } } }, children: paras }] })
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
    const leftLines = []
    const rightLines = []
    let inSidebarSection = false

    for (const line of lines) {
      if (line.type === 'name' || line.type === 'contact') {
        leftLines.push(line)
      } else if (line.type === 'header' && SHARP_SIDEBAR_HEADERS_RE.test(line.text)) {
        inSidebarSection = true
        leftLines.push(line)
      } else if (inSidebarSection && (line.type === 'body' || line.type === 'bullet' || line.type === 'empty')) {
        leftLines.push(line)
      } else {
        inSidebarSection = false
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
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { top: 0, bottom: 0, left: 0, right: 200 },
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [photoPara],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
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
