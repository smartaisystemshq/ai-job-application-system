import React, { useMemo } from 'react'
import { parseDocumentLines, buildSharpStructure } from './downloadUtils'

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
    bullet: { text: '•', color: GREEN },
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
    bullet: { text: '•', color: '#777' },
    bodyColor: '#2a2a2a',
    divider: { height: 1, background: '#ccc', margin: '5px 0 7px' },
  },
}

// ── Single-column page renderer ───────────────────────────────────────────────

function StandardPage({ lines, template, photo = null, showPlaceholder = false }) {
  const s = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.minimal

  // Split into header (name/contact) and body
  const headerLines = []
  const bodyLines = []
  let headerDone = false
  for (const line of lines) {
    if (!headerDone && (line.type === 'name' || line.type === 'contact')) {
      headerLines.push(line)
    } else {
      headerDone = true
      bodyLines.push(line)
    }
  }

  const showPhotoArea = photo || showPlaceholder

  const renderLine = (line, key) => {
    switch (line.type) {
      case 'name': {
        const nameText = template === 'executive' ? line.text.toUpperCase() : line.text
        return (
          <div key={key}>
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
      case 'contact': {
        const items = line.text.split('|').map(i => i.trim()).filter(Boolean)
        return (
          <div key={key} style={{
            ...s.contact,
            display: 'flex', flexWrap: 'wrap',
            gap: '4px 14px',
            alignItems: 'center',
            justifyContent: s.contactAlign === 'center' ? 'center' : 'flex-start',
          }}>
            {items.map((item, idx) => (
              <span key={idx} style={{ whiteSpace: 'nowrap', fontSize: item.length > 40 ? '0.85em' : undefined }}>
                {item}
              </span>
            ))}
          </div>
        )
      }
      case 'divider':
        return <div key={key} style={s.divider} />
      case 'header':
        return (
          <div key={key}>
            <div style={s.headerText}>{line.text}</div>
            <div style={s.headerLine} />
          </div>
        )
      case 'bullet':
        return (
          <div key={key} style={{ display: 'flex', gap: 7, marginBottom: 2.5, paddingLeft: 4 }}>
            <span style={{ color: s.bullet.color, flexShrink: 0, width: 10, fontSize: 12, lineHeight: '16px' }}>{s.bullet.text}</span>
            <span style={{ color: s.bodyColor, flex: 1, fontSize: 11 }}>{line.text}</span>
          </div>
        )
      case 'body':
        return <div key={key} style={{ color: s.bodyColor, marginBottom: 2, fontSize: 11 }}>{line.text}</div>
      case 'empty':
        return <div key={key} style={{ height: 5 }} />
      default:
        return null
    }
  }

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
      {showPhotoArea ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            {headerLines.map((line, i) => renderLine(line, i))}
          </div>
          {photo ? (
            <div style={{
              width: '90px',
              height: '115px',
              flexShrink: 0,
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.1)',
            }}>
              <img
                src={photo}
                alt="CV photo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 10%',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div style={{ width: 90, height: 115, flexShrink: 0, background: '#e8e8e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span style={{ fontSize: 8, color: '#bbb', marginTop: 4 }}>Photo</span>
            </div>
          )}
        </div>
      ) : (
        headerLines.map((line, i) => renderLine(line, i))
      )}
      {bodyLines.map((line, i) => renderLine(line, headerLines.length + i))}
    </div>
  )
}

// ── Two-column sharp page ─────────────────────────────────────────────────────

function SharpPage({ data, photo = null, showPlaceholder = false }) {
  const { name, contactLine, sections, skills } = data
  const G = GREEN

  return (
    <div style={{
      maxWidth: 680,
      margin: '0 auto',
      background: 'white',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#333',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 70px rgba(0,0,0,0.65)',
      borderRadius: 2,
      overflow: 'hidden',
      minHeight: 850,
    }}>
      {/* GREEN HEADER */}
      <div style={{
        background: G,
        padding: '20px 24px 18px',
        color: 'white',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          marginBottom: '5px',
          textTransform: 'uppercase',
        }}>{name}</div>
        <div style={{
          fontSize: '10px',
          opacity: 0.88,
          letterSpacing: '0.2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{contactLine}</div>
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>

        {/* LEFT SIDEBAR — 35% width */}
        <div style={{
          width: '35%',
          minWidth: '35%',
          maxWidth: '35%',
          padding: '20px 16px 20px 24px',
          borderRight: `2px solid ${G}`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '260mm',
        }}>
          {/* Photo */}
          {(photo || showPlaceholder) && (
            <div style={{
              width: '100px',
              height: '125px',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px',
              border: '1px solid rgba(0,0,0,0.08)',
              flexShrink: 0,
            }}>
              {photo ? (
                <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Skills as green pills */}
          {skills.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {skills.map((skill, i) => (
                  <span key={i} style={{ background: '#e8f5f0', color: G, fontSize: '8.5px', padding: '3px 8px', borderRadius: '3px', display: 'inline-block' }}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Other sidebar sections (Languages, etc.) */}
          {sections.filter(s => s.sidebar).map((section, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{section.title}</div>
              <div style={{ fontSize: '9px', color: '#555', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{section.content}</div>
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT */}
        <div style={{ flex: 1, padding: '20px 24px 20px 18px', minWidth: 0 }}>
          {sections.filter(s => !s.sidebar).map((section, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: G,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                borderBottom: `1px solid ${G}`,
                paddingBottom: '3px',
                marginBottom: '6px',
              }}>{section.title}</div>
              <div style={{ fontSize: '10px', color: '#444', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{section.content}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ── Cover letter renderer — business letter format ───────────────────────────

function LetterPage({ text, template = 'minimal' }) {
  const rawLines = (text || '').split('\n')
  const blocks = []
  let cur = []
  for (const line of rawLines) {
    if (!line.trim()) {
      if (cur.length) { blocks.push(cur); cur = [] }
    } else { cur.push(line.trim()) }
  }
  if (cur.length) blocks.push(cur)

  if (!blocks.length) return null

  const isModern = template === 'modern' || template === 'sharp'
  const isClassic = template === 'classic'
  const isExecutive = template === 'executive'
  const fontFamily = isClassic
    ? "'Times New Roman', Georgia, serif"
    : "'Inter', -apple-system, sans-serif"

  return (
    <div style={{
      background: '#fff',
      maxWidth: 680,
      margin: '0 auto',
      padding: '36px 48px',
      boxShadow: '0 20px 70px rgba(0,0,0,0.65), 0 4px 20px rgba(0,0,0,0.35)',
      borderRadius: 2,
      fontFamily,
      fontSize: 11.5,
      lineHeight: 1.7,
      color: '#2a2a2a',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Template-specific top decoration */}
      {isModern && (
        <div style={{ height: 6, background: GREEN, marginLeft: -48, marginRight: -48, marginTop: -36, marginBottom: 16 }} />
      )}

      {blocks.map((blockLines, i) => {
        const joined = blockLines.join(' ')

        // First block: sender info
        if (i === 0) {
          const name = blockLines[0]
          const contact = blockLines.slice(1).join('  |  ')

          if (isClassic) {
            return (
              <div key={i} style={{ marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 3 }}>{name}</div>
                <div style={{ height: 1.5, background: '#333', marginBottom: 1.5 }} />
                <div style={{ height: 0.5, background: '#999', marginBottom: 6 }} />
                {contact && <div style={{ fontSize: 10.5, color: '#666', marginBottom: 8 }}>{contact}</div>}
              </div>
            )
          }
          if (isExecutive) {
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>{name}</div>
                <div style={{ height: 2.5, background: GREEN, marginBottom: 6 }} />
                {contact && <div style={{ fontSize: 10.5, color: '#666', marginBottom: 4 }}>{contact}</div>}
                <div style={{ height: 0.6, background: '#ddd', marginTop: 6 }} />
              </div>
            )
          }
          // Minimal / Modern / Tech
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 3 }}>{name}</div>
              {contact && <div style={{ fontSize: 10.5, color: '#666' }}>{contact}</div>}
              <div style={{ height: isModern ? 1.5 : 0.8, background: isModern ? GREEN : '#ddd', marginTop: 10 }} />
            </div>
          )
        }

        // Date line
        if (joined.length < 40 && i <= 2 &&
          /\d{4}|january|february|march|april|may|june|july|august|september|october|november|december|\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|\boct\b|\bnov\b|\bdec\b/i.test(joined)) {
          return <div key={i} style={{ fontSize: 10.5, color: '#666', marginBottom: 18, textAlign: isClassic ? 'right' : 'left' }}>{joined}</div>
        }

        // Greeting / salutation
        if (/^dear\b|^to whom\b|^liebe[rs]?\b|^sehr geehrte[rs]?\b/i.test(joined)) {
          return <div key={i} style={{ marginBottom: 14 }}>{joined}</div>
        }

        // Closing line
        if ((i >= blocks.length - 2) && joined.length < 80 &&
          /^(best|kind|sincerely|yours|mit freundlichen|hochachtungsvoll|regards)/i.test(joined)) {
          return (
            <div key={i} style={{ marginTop: 20, lineHeight: 1.8 }}>
              {blockLines.map((l, j) => <div key={j}>{l}</div>)}
            </div>
          )
        }

        // Body paragraph
        return <p key={i} style={{ marginBottom: 14 }}>{joined}</p>
      })}
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export default function DocumentPreview({ text, template = 'minimal', maxHeight = 900, type = 'cv', photo = null, showPlaceholder = false }) {
  const lines = useMemo(() => parseDocumentLines(text || ''), [text])

  if (!text) return null

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0c0c1a 0%, #0f0f16 100%)',
      borderRadius: 14,
      padding: '28px 20px',
      boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 8px 40px rgba(0,0,0,0.4)',
      maxHeight,
      overflowY: 'auto',
    }}>
      {type === 'letter'
        ? <LetterPage text={text} template={template} />
        : template === 'sharp'
          ? <SharpPage data={buildSharpStructure(lines)} photo={photo} showPlaceholder={showPlaceholder} />
          : <StandardPage lines={lines} template={template} photo={photo} showPlaceholder={showPlaceholder} />
      }
    </div>
  )
}
