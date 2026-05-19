import React, { useMemo } from 'react'
import { parseDocumentLines } from './downloadUtils'

const GREEN = '#1D9E75'
const SIDEBAR_DARK = '#1a1a1a'

// ── Per-template style maps ───────────────────────────────────────────────────

const TEMPLATE_STYLES = {
  minimal: {
    page: { fontFamily: "'Inter', -apple-system, sans-serif", color: '#2a2a2a' },
    name: { fontSize: 21, fontWeight: 700, color: '#111', marginBottom: 4, letterSpacing: 0 },
    nameAccent: null,
    contact: { fontSize: 10, color: '#666', marginBottom: 2 },
    contactAlign: 'left',
    headerText: { fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 3, marginTop: 14 },
    headerLine: { height: 0.8, background: '#888', marginBottom: 5 },
    headerColor: '#111',
    bullet: { text: '•', color: '#666' },
    bodyColor: '#2a2a2a',
    divider: { height: 1, background: '#ccc', margin: '5px 0 7px' },
  },
  modern: {
    page: { fontFamily: "'Inter', -apple-system, sans-serif", color: '#2a2a2a' },
    name: { fontSize: 21, fontWeight: 700, color: '#111', marginBottom: 4 },
    nameAccent: { height: 2, background: GREEN, marginBottom: 8 },
    contact: { fontSize: 10, color: '#666', marginBottom: 2 },
    contactAlign: 'left',
    headerText: { fontSize: 11, fontWeight: 700, color: GREEN, marginBottom: 3, marginTop: 14 },
    headerLine: { height: 1.5, background: GREEN, marginBottom: 5 },
    headerColor: GREEN,
    bullet: { text: '▸', color: GREEN },
    bodyColor: '#2a2a2a',
    divider: { height: 1, background: '#e0e0e0', margin: '5px 0 7px' },
  },
  classic: {
    page: { fontFamily: "'Times New Roman', Georgia, serif", color: '#2a2a2a' },
    name: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 3, textAlign: 'center' },
    nameAccent: 'classic-double',
    contact: { fontSize: 10, color: '#555', marginBottom: 2 },
    contactAlign: 'center',
    headerText: { fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 3, marginTop: 14 },
    headerLine: { height: 0.8, background: '#666', marginBottom: 5 },
    headerColor: '#111',
    bullet: { text: '•', color: '#444' },
    bodyColor: '#2a2a2a',
    divider: { height: 1, background: '#bbb', margin: '5px 0 7px' },
  },
  executive: {
    page: { fontFamily: "'Inter', -apple-system, sans-serif", color: '#2a2a2a' },
    name: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4, letterSpacing: 1.5 },
    nameAccent: { height: 2, background: GREEN, marginBottom: 10 },
    contact: { fontSize: 10, color: '#555', marginBottom: 2 },
    contactAlign: 'left',
    headerText: { fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 3, marginTop: 14, letterSpacing: 0.4 },
    headerLine: { height: 0.6, background: '#aaa', marginBottom: 5 },
    headerColor: '#111',
    bullet: { text: '—', color: '#777' },
    bodyColor: '#2a2a2a',
    divider: { height: 1, background: '#ccc', margin: '5px 0 7px' },
  },
}

// ── Single-column page renderer ───────────────────────────────────────────────

function StandardPage({ lines, template }) {
  const s = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.minimal

  return (
    <div style={{
      background: '#fff',
      maxWidth: 680,
      margin: '0 auto',
      padding: '32px 40px',
      boxShadow: '0 20px 70px rgba(0,0,0,0.65), 0 4px 20px rgba(0,0,0,0.35)',
      borderRadius: 2,
      ...s.page,
      fontSize: 11,
      lineHeight: 1.55,
    }}>
      {template === 'modern' && (
        <div style={{ height: 6, background: GREEN, marginLeft: -40, marginRight: -40, marginTop: -32, marginBottom: 20 }} />
      )}
      {lines.map((line, i) => {
        switch (line.type) {
          case 'name': {
            const nameText = template === 'executive' ? line.text.toUpperCase() : line.text
            return (
              <div key={i}>
                <div style={{ ...s.name, textAlign: s.contactAlign }}>{nameText}</div>
                {s.nameAccent === 'classic-double' && (
                  <>
                    <div style={{ height: 1.5, background: '#333', marginBottom: 1.5 }} />
                    <div style={{ height: 0.5, background: '#999', marginBottom: 8 }} />
                  </>
                )}
                {s.nameAccent && s.nameAccent !== 'classic-double' && (
                  <div style={s.nameAccent} />
                )}
              </div>
            )
          }

          case 'contact':
            return (
              <div key={i} style={{ ...s.contact, textAlign: s.contactAlign }}>
                {line.text}
              </div>
            )

          case 'divider':
            return <div key={i} style={s.divider} />

          case 'header':
            return (
              <div key={i}>
                <div style={s.headerText}>{line.text}</div>
                <div style={s.headerLine} />
              </div>
            )

          case 'bullet':
            return (
              <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 2.5, paddingLeft: 4 }}>
                <span style={{ color: s.bullet.color, flexShrink: 0, width: 10, fontSize: 12, lineHeight: '16px' }}>
                  {s.bullet.text}
                </span>
                <span style={{ color: s.bodyColor, flex: 1, fontSize: 11 }}>{line.text}</span>
              </div>
            )

          case 'body':
            return (
              <div key={i} style={{ color: s.bodyColor, marginBottom: 2, fontSize: 11 }}>
                {line.text}
              </div>
            )

          case 'empty':
            return <div key={i} style={{ height: 5 }} />

          default:
            return null
        }
      })}
    </div>
  )
}

// ── Two-column tech page ───────────────────────────────────────────────────────

function TechPage({ lines }) {
  const leftLines = []
  const rightLines = []
  let inSkills = false

  for (const line of lines) {
    if (line.type === 'name' || line.type === 'contact') {
      leftLines.push(line)
    } else if (
      line.type === 'header' &&
      (line.text === 'SKILLS' || line.text === 'CORE COMPETENCIES' || line.text === 'TECHNICAL SKILLS')
    ) {
      inSkills = true
      leftLines.push(line)
    } else if (inSkills && (line.type === 'body' || line.type === 'bullet' || line.type === 'empty')) {
      leftLines.push(line)
    } else {
      inSkills = false
      rightLines.push(line)
    }
  }

  return (
    <div style={{
      display: 'flex',
      maxWidth: 680,
      margin: '0 auto',
      boxShadow: '0 20px 70px rgba(0,0,0,0.65)',
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      {/* Dark sidebar */}
      <div style={{
        background: SIDEBAR_DARK,
        width: '36%',
        padding: '24px 16px',
        fontFamily: "'Inter', sans-serif",
        flexShrink: 0,
      }}>
        {leftLines.map((line, i) => {
          switch (line.type) {
            case 'name':
              return (
                <div key={i}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}>
                    {line.text}
                  </div>
                  <div style={{ height: 1.5, background: GREEN, marginBottom: 10 }} />
                </div>
              )
            case 'contact':
              return <div key={i} style={{ fontSize: 9, color: '#aaa', marginBottom: 2, lineHeight: 1.4 }}>{line.text}</div>
            case 'header':
              return (
                <div key={i} style={{ marginTop: 12, marginBottom: 5 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: GREEN, marginBottom: 2, letterSpacing: 0.3 }}>{line.text}</div>
                  <div style={{ height: 0.8, background: GREEN, opacity: 0.5, marginBottom: 5 }} />
                </div>
              )
            case 'bullet':
              return (
                <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 2 }}>
                  <span style={{ color: GREEN, fontSize: 10, flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: 9.5, color: '#ccc', lineHeight: 1.4 }}>{line.text}</span>
                </div>
              )
            case 'body':
              return <div key={i} style={{ fontSize: 9.5, color: '#ccc', marginBottom: 2, lineHeight: 1.4 }}>{line.text}</div>
            case 'empty':
              return <div key={i} style={{ height: 4 }} />
            default:
              return null
          }
        })}
      </div>

      {/* White main content */}
      <div style={{
        background: '#fff',
        flex: 1,
        padding: '24px 20px 24px 16px',
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        color: '#2a2a2a',
        lineHeight: 1.5,
      }}>
        {rightLines.map((line, i) => {
          switch (line.type) {
            case 'header':
              return (
                <div key={i} style={{ marginTop: 12, marginBottom: 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 3 }}>{line.text}</div>
                  <div style={{ height: 1, background: GREEN }} />
                </div>
              )
            case 'bullet':
              return (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2.5 }}>
                  <span style={{ color: GREEN, flexShrink: 0, fontSize: 12, lineHeight: '16px' }}>▸</span>
                  <span style={{ fontSize: 11 }}>{line.text}</span>
                </div>
              )
            case 'body':
              return <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>{line.text}</div>
            case 'empty':
              return <div key={i} style={{ height: 4 }} />
            case 'divider':
              return <div key={i} style={{ height: 1, background: '#ddd', margin: '5px 0' }} />
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

// ── Cover letter renderer (pure paragraphs, no CV structure) ─────────────────

function LetterPage({ text }) {
  let paragraphs = (text || '').split(/\n\n+/).filter(p => p.trim())
  // Fallback: if no double-newlines, treat each non-empty line as a paragraph
  if (paragraphs.length <= 1 && (text || '').includes('\n')) {
    paragraphs = (text || '').split(/\n/).filter(p => p.trim())
  }

  return (
    <div style={{
      background: '#fff',
      maxWidth: 680,
      margin: '0 auto',
      padding: '40px 48px',
      boxShadow: '0 20px 70px rgba(0,0,0,0.65), 0 4px 20px rgba(0,0,0,0.35)',
      borderRadius: 2,
      fontFamily: "'Inter', -apple-system, sans-serif",
      fontSize: 12,
      lineHeight: 1.75,
      color: '#2a2a2a',
    }}>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? 18 : 0 }}>
          {para.replace(/\n/g, ' ').trim()}
        </p>
      ))}
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export default function DocumentPreview({ text, template = 'minimal', maxHeight = 560, type = 'cv' }) {
  const lines = useMemo(() => parseDocumentLines(text || ''), [text])

  if (!text) return null

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0e0e1c 0%, #111118 100%)',
      borderRadius: 14,
      padding: '28px 20px',
      boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
      maxHeight,
      overflowY: 'auto',
    }}>
      {type === 'letter'
        ? <LetterPage text={text} />
        : template === 'tech'
          ? <TechPage lines={lines} />
          : <StandardPage lines={lines} template={template} />
      }
    </div>
  )
}
