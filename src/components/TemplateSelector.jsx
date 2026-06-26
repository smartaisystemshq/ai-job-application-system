import React from 'react'
import { useLang } from '../context/LanguageContext'
import { t } from '../translations'

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

function TemplatePreviewSharp() {
  const G = '#1D9E75'
  return (
    <div style={{ height: 88, overflow: 'hidden', borderRadius: 6, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Green header */}
      <div style={{ background: G, padding: '5px 8px 4px', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: 0.3, textTransform: 'uppercase' }}>John Smith</div>
        <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.85)' }}>john@email.com · London · +44 7000 000</div>
      </div>
      {/* Two-column body */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left sidebar */}
        <div style={{ width: '35%', padding: '6px 5px 6px 8px', borderRight: `1.5px solid ${G}`, background: '#fff' }}>
          <div style={{ fontSize: 5.5, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {['React', 'TypeScript', 'AWS'].map((s, i) => (
              <span key={i} style={{ background: '#e8f5f0', color: G, fontSize: 4.5, padding: '1px 3px', borderRadius: 2 }}>{s}</span>
            ))}
          </div>
        </div>
        {/* Right content */}
        <div style={{ flex: 1, padding: '6px 8px' }}>
          <div style={{ fontSize: 6, fontWeight: 700, color: G, borderBottom: `0.8px solid ${G}`, paddingBottom: 1, marginBottom: 3 }}>WORK EXPERIENCE</div>
          <div style={{ fontSize: 5, color: '#333', marginBottom: 2 }}>Senior Engineer | FinTech | 2021–2023</div>
          {['Built fraud detection saving £800K/yr', 'Led 5 engineers across 3 teams'].map((txt, i) => (
            <div key={i} style={{ fontSize: 5, color: '#444', marginBottom: 1.5 }}>• {txt}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const TEMPLATES = [
  { id: 'minimal',   name: 'Minimal',   descKey: 'template_minimal_desc',   Preview: TemplatePreviewMinimal },
  { id: 'modern',    name: 'Modern',    descKey: 'template_modern_desc',    Preview: TemplatePreviewModern  },
  { id: 'classic',   name: 'Classic',   descKey: 'template_classic_desc',   Preview: TemplatePreviewClassic },
  { id: 'executive', name: 'Executive', descKey: 'template_executive_desc', Preview: TemplatePreviewExecutive },
  { id: 'sharp',     name: 'Sharp',     descKey: 'template_sharp_desc',     Preview: TemplatePreviewSharp   },
]

export function TemplateSelector({ selectedTemplate, onSelect, className = '' }) {
  const { lang } = useLang();
  return (
    <div className={`scroll-reveal ${className}`} style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        {t[lang].select_template}
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
                <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t[lang][tmpl.descKey]}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
