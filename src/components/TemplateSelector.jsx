import React from 'react'

const SCALE = 0.26
const DOC_W = 580

function MiniDocFrame({ children }) {
  return (
    <div style={{ height: 88, overflow: 'hidden', borderRadius: 6, position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: DOC_W, background: '#fff',
        transform: `scale(${SCALE})`, transformOrigin: 'top left',
        fontFamily: "'Inter', sans-serif", padding: '30px 36px 0',
      }}>
        {children}
      </div>
    </div>
  )
}

function TemplatePreviewMinimal() {
  return (
    <MiniDocFrame>
      <div style={{ fontSize: 46, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1 }}>JOHN SMITH</div>
      <div style={{ fontSize: 22, color: '#666', marginBottom: 14 }}>john@email.com | London | linkedin.com/in/john</div>
      <div style={{ height: 2, background: '#ccc', marginBottom: 18 }} />
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 6 }}>WORK EXPERIENCE</div>
      <div style={{ height: 1.5, background: '#888', marginBottom: 12 }} />
      <div style={{ fontSize: 22, color: '#333', marginBottom: 8 }}>Software Engineer | TechCorp | 2021 – 2023</div>
      {['Led payment system handling £2M/month revenue', 'Reduced deployment time 70% via CI/CD pipelines'].map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
          <span style={{ color: '#555', fontSize: 22, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 22, color: '#333' }}>{t}</span>
        </div>
      ))}
    </MiniDocFrame>
  )
}

function TemplatePreviewModern() {
  const G = '#1D9E75'
  return (
    <MiniDocFrame>
      <div style={{ height: 14, background: G, marginLeft: -36, marginRight: -36, marginTop: -30, marginBottom: 20 }} />
      <div style={{ fontSize: 46, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1 }}>JOHN SMITH</div>
      <div style={{ height: 4, background: G, marginBottom: 10 }} />
      <div style={{ fontSize: 22, color: '#666', marginBottom: 16 }}>john@email.com | London</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: G, marginBottom: 5 }}>WORK EXPERIENCE</div>
      <div style={{ height: 2.5, background: G, marginBottom: 12 }} />
      {['Led payment system handling £2M/month', 'Reduced deployment time 70%'].map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
          <span style={{ color: G, fontSize: 22, flexShrink: 0 }}>▸</span>
          <span style={{ fontSize: 22, color: '#333' }}>{t}</span>
        </div>
      ))}
    </MiniDocFrame>
  )
}

function TemplatePreviewClassic() {
  return (
    <MiniDocFrame>
      <div style={{ fontFamily: "'Times New Roman', serif" }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: '#111', marginBottom: 6, textAlign: 'center', lineHeight: 1 }}>JOHN SMITH</div>
        <div style={{ height: 3, background: '#333', marginBottom: 2 }} />
        <div style={{ height: 1, background: '#999', marginBottom: 10 }} />
        <div style={{ fontSize: 22, color: '#555', marginBottom: 14, textAlign: 'center' }}>john@email.com | +44 7000 | London</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 5 }}>PROFESSIONAL EXPERIENCE</div>
        <div style={{ height: 1.5, background: '#666', marginBottom: 12 }} />
        {['Managed team of 8 analysts across 3 regions', 'Delivered £4M project on time and under budget'].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
            <span style={{ color: '#555', fontSize: 22, flexShrink: 0 }}>•</span>
            <span style={{ fontSize: 22, color: '#333', fontFamily: "'Times New Roman', serif" }}>{t}</span>
          </div>
        ))}
      </div>
    </MiniDocFrame>
  )
}

function TemplatePreviewExecutive() {
  const G = '#1D9E75'
  return (
    <MiniDocFrame>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#111', marginBottom: 8, letterSpacing: 6, lineHeight: 1 }}>JOHN SMITH</div>
      <div style={{ height: 4, background: G, marginBottom: 12 }} />
      <div style={{ fontSize: 22, color: '#666', marginBottom: 18 }}>john@email.com | London | linkedin.com/in/john</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 5, letterSpacing: 1 }}>PROFESSIONAL EXPERIENCE</div>
      <div style={{ height: 1.5, background: '#bbb', marginBottom: 12 }} />
      {['Drove £40M revenue growth as VP Commercial', 'Led 120-person team across 6 markets globally'].map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
          <span style={{ color: '#777', fontSize: 22, flexShrink: 0 }}>—</span>
          <span style={{ fontSize: 22, color: '#333' }}>{t}</span>
        </div>
      ))}
    </MiniDocFrame>
  )
}

function TemplatePreviewTech() {
  const G = '#1D9E75'
  const DARK = '#1a1a1a'
  return (
    <div style={{ height: 88, overflow: 'hidden', borderRadius: 6, display: 'flex' }}>
      <div style={{ background: DARK, width: '36%', padding: '10px 9px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 3 }}>JOHN SMITH</div>
        <div style={{ height: 1, background: G, marginBottom: 5 }} />
        <div style={{ fontSize: 7, color: '#aaa', marginBottom: 4 }}>john@email.com</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: G, marginBottom: 2 }}>SKILLS</div>
        <div style={{ height: 0.5, background: G, opacity: 0.5, marginBottom: 3 }} />
        {['Python, TypeScript', 'AWS, Docker', 'PostgreSQL', 'Agile / TDD'].map((s, i) => (
          <div key={i} style={{ fontSize: 7, color: '#ccc', marginBottom: 2 }}>• {s}</div>
        ))}
      </div>
      <div style={{ background: '#fff', flex: 1, padding: '10px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#111', marginBottom: 3 }}>WORK EXPERIENCE</div>
        <div style={{ height: 0.8, background: G, marginBottom: 5 }} />
        <div style={{ fontSize: 7.5, color: '#333', marginBottom: 4 }}>Senior Engineer | FinTech | 2021–2023</div>
        {['Built fraud detection saving £800K/yr', 'Led 5 engineers across 3 services'].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
            <span style={{ color: G, fontSize: 8, flexShrink: 0 }}>▸</span>
            <span style={{ fontSize: 7.5, color: '#333' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const TEMPLATES = [
  { id: 'minimal',   name: 'Minimal',   description: 'Single column · clean black typography · timeless', Preview: TemplatePreviewMinimal },
  { id: 'modern',    name: 'Modern',    description: 'Green accents · bold dividers · contemporary',       Preview: TemplatePreviewModern  },
  { id: 'classic',   name: 'Classic',   description: 'Centred name · serif feel · universally accepted',  Preview: TemplatePreviewClassic },
  { id: 'executive', name: 'Executive', description: 'Uppercase name · premium spacing · senior roles',   Preview: TemplatePreviewExecutive },
  { id: 'tech',      name: 'Tech',      description: 'Dark sidebar for skills · white panel for XP',      Preview: TemplatePreviewTech    },
]

export function TemplateSelector({ selectedTemplate, onSelect, className = '' }) {
  return (
    <div className={`scroll-reveal ${className}`} style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        Select Template
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="template-row">
        {TEMPLATES.map(tmpl => {
          const isSelected = selectedTemplate === tmpl.id
          return (
            <div
              key={tmpl.id}
              onClick={() => onSelect(tmpl.id)}
              className={`template-card-h${isSelected ? ' selected' : ''}`}
            >
              <tmpl.Preview />
              <div style={{ padding: '8px 2px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 1 }}>{tmpl.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{tmpl.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
