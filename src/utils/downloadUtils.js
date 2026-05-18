// PDF generation via pdfmake (Roboto font via vfs_fonts)
// Word generation via docx

let _pdfMake = null

async function loadPdfMake() {
  if (_pdfMake) return _pdfMake
  const [pdfMakeMod, vfsMod] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  const pdfMake = pdfMakeMod.default || pdfMakeMod
  // vfs_fonts exports the font data object directly (no .default or .vfs wrapper)
  const vfs = vfsMod.default || vfsMod
  pdfMake.vfs = vfs
  _pdfMake = pdfMake
  return pdfMake
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

    if (!trimmed) {
      result.push({ type: 'empty' })
      continue
    }

    // Divider lines
    if (/^[─━═\-=]{3,}$/.test(trimmed)) {
      result.push({ type: 'divider' })
      continue
    }

    // First real line = name
    if (!nameFound) {
      nameFound = true
      result.push({ type: 'name', text: trimmed })
      continue
    }

    // Lines right after name that look like contact info
    // Key: do NOT use bare '|' as a contact indicator — job lines also use '|'
    const looksContact =
      contactCount < 3 &&
      !isSectionHeader(trimmed) &&
      (trimmed.includes('@') ||
        /^\+?[\d\s\-().]{7,}$/.test(trimmed) ||
        trimmed.toLowerCase().includes('linkedin') ||
        trimmed.toLowerCase().includes('http') ||
        trimmed.toLowerCase().includes('www') ||
        // Catch-all for first few raw lines only (no year numbers, no bullets)
        (i <= 4 && trimmed.length < 100 && !isSectionHeader(trimmed) &&
          !/^[•▸▌►\-*]/.test(trimmed) && !/\d{4}/.test(trimmed)))

    if (looksContact) {
      contactCount++
      result.push({ type: 'contact', text: trimmed })
      continue
    }

    // Section header
    if (isSectionHeader(trimmed)) {
      result.push({ type: 'header', text: trimmed.replace(/^[▌►▸]\s*/, '') })
      continue
    }

    // Bullet
    if (/^[•▸▌►]\s/.test(trimmed) || /^[-*]\s/.test(trimmed)) {
      result.push({ type: 'bullet', text: trimmed.replace(/^[•▸▌►\-*]\s+/, '') })
      continue
    }

    result.push({ type: 'body', text: trimmed })
  }

  return result
}

// ── Optimal font size estimate ───────────────────────────────────────────────

function getOptimalFontSize(text) {
  const lines = parseDocumentLines(text)
  let effective = 0
  const CPL = 90 // chars per line at 10.5pt in A4 with 40pt margins

  for (const l of lines) {
    if (l.type === 'empty') { effective += 0.3; continue }
    if (l.type === 'divider') continue
    if (l.type === 'name') { effective += 2.5; continue }
    if (l.type === 'contact') { effective += 1.1; continue }
    if (l.type === 'header') { effective += 2.0; continue }
    effective += Math.max(1, Math.ceil((l.text?.length || 0) / CPL))
  }

  // A4 at 10.5pt: ~53 lines fit
  if (effective <= 53) return 10.5
  if (effective <= 56) return 10.0
  if (effective <= 60) return 9.5
  if (effective <= 65) return 9.0
  return 8.5
}

// ── PDF document definition ──────────────────────────────────────────────────

function buildPDFDocDef(text, bodySize) {
  const lines = parseDocumentLines(text)
  const content = []
  const nameSize = Math.round(bodySize + 7)
  const contactSize = bodySize - 1.5
  const headerSize = bodySize + 0.5

  for (const line of lines) {
    switch (line.type) {
      case 'empty':
        content.push({ text: ' ', fontSize: bodySize * 0.5, margin: [0, 0, 0, 0] })
        break
      case 'divider':
        content.push({
          canvas: [{ type: 'line', x1: 0, y1: 1, x2: 515, y2: 1, lineWidth: 0.4, lineColor: '#cccccc' }],
          margin: [0, 2, 0, 3],
        })
        break
      case 'name':
        content.push({
          text: line.text,
          fontSize: nameSize,
          bold: true,
          color: '#111111',
          margin: [0, 0, 0, 3],
        })
        break
      case 'contact':
        content.push({
          text: line.text,
          fontSize: contactSize,
          color: '#555555',
          margin: [0, 0, 0, 1],
        })
        break
      case 'header':
        content.push({
          text: line.text,
          fontSize: headerSize,
          bold: true,
          color: '#111111',
          margin: [0, 8, 0, 1],
        })
        content.push({
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: '#888888' }],
          margin: [0, 0, 0, 3],
        })
        break
      case 'bullet':
        content.push({
          columns: [
            { text: '•', width: 10, fontSize: bodySize, color: '#333333' },
            { text: line.text, fontSize: bodySize, color: '#2a2a2a', width: '*' },
          ],
          margin: [4, 1, 0, 1],
        })
        break
      case 'body':
        content.push({
          text: line.text,
          fontSize: bodySize,
          color: '#2a2a2a',
          margin: [0, 1, 0, 1],
        })
        break
      default:
        break
    }
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 36, 40, 36],
    defaultStyle: {
      font: 'Roboto',
      fontSize: bodySize,
      lineHeight: 1.28,
    },
    content,
  }
}

// ── Public: download as PDF ──────────────────────────────────────────────────

export async function downloadAsPDF(text, filename) {
  const pdfMake = await loadPdfMake()
  const bodySize = getOptimalFontSize(text)
  const docDef = buildPDFDocDef(text, bodySize)
  pdfMake.createPdf(docDef).download(filename + '.pdf')
}

// ── Public: download as Word (.docx) ────────────────────────────────────────

export async function downloadAsWord(text, filename) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    BorderStyle,
  } = await import('docx')

  const lines = parseDocumentLines(text)
  const children = []

  // twips: 1pt = 20 twips; 1mm ≈ 56.7 twips
  // Sizes in half-points: 10pt = 20, 11pt = 22, 22pt = 44

  const nameHalfPt = 44      // 22pt
  const contactHalfPt = 18   // 9pt
  const headerHalfPt = 22    // 11pt
  const bodyHalfPt = 20      // 10pt

  for (const line of lines) {
    switch (line.type) {
      case 'name':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.text,
                bold: true,
                size: nameHalfPt,
                font: 'Calibri',
                color: '111111',
              }),
            ],
            spacing: { after: 60 },
          })
        )
        break

      case 'contact':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.text,
                size: contactHalfPt,
                font: 'Calibri',
                color: '555555',
              }),
            ],
            spacing: { after: 30 },
          })
        )
        break

      case 'divider':
        // Add a thin horizontal rule via paragraph border
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: 'cccccc',
                space: 1,
              },
            },
            spacing: { before: 60, after: 60 },
          })
        )
        break

      case 'header':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.text,
                bold: true,
                size: headerHalfPt,
                font: 'Calibri',
                color: '111111',
              }),
            ],
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: '888888',
                space: 1,
              },
            },
            spacing: { before: 180, after: 80 },
          })
        )
        break

      case 'bullet':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '•  ' + line.text,
                size: bodyHalfPt,
                font: 'Calibri',
                color: '2a2a2a',
              }),
            ],
            indent: { left: 280 },
            spacing: { after: 40 },
          })
        )
        break

      case 'body':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.text,
                size: bodyHalfPt,
                font: 'Calibri',
                color: '2a2a2a',
              }),
            ],
            spacing: { after: 40 },
          })
        )
        break

      case 'empty':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 80 },
          })
        )
        break

      default:
        break
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 850,    // ~15mm
              right: 1000, // ~17.6mm
              bottom: 850,
              left: 1000,
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename + '.docx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
