import React, { useState } from 'react'
import { downloadAsPDF, downloadAsWord } from './downloadUtils'

export default function DownloadButtons({ text, filename = 'document', template = 'minimal', isLetter = false, style = {} }) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [wordLoading, setWordLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePDF = async () => {
    setPdfLoading(true)
    setError('')
    try {
      await downloadAsPDF(text, filename, template, isLetter)
    } catch (err) {
      console.error('PDF error:', err)
      setError('PDF generation failed. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleWord = async () => {
    setWordLoading(true)
    setError('')
    try {
      await downloadAsWord(text, filename, template, isLetter)
    } catch (err) {
      console.error('Word error:', err)
      setError('Word generation failed. Please try again.')
    } finally {
      setWordLoading(false)
    }
  }

  return (
    <div className="download-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', ...style }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={handlePDF}
        disabled={pdfLoading || wordLoading}
        title="Download as PDF"
      >
        {pdfLoading ? (
          <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'currentColor' }}></span> PDF…</>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            PDF
          </>
        )}
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={handleWord}
        disabled={pdfLoading || wordLoading}
        title="Download as Word (.docx)"
      >
        {wordLoading ? (
          <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'currentColor' }}></span> Word…</>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            Word
          </>
        )}
      </button>
      {error && (
        <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
      )}
    </div>
  )
}
