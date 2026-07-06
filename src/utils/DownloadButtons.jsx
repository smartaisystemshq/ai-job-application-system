import React, { useState } from 'react'
import { downloadAsPDF, downloadAsWord, generatePDFBlob, generateWordBlob, isMobile } from './downloadUtils'
import { useLang } from '../context/LanguageContext'
import { t } from '../translations'

function openBlobInTab(newTab, blob) {
  const url = URL.createObjectURL(blob)
  newTab.location.href = url
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export default function DownloadButtons({ text, filename = 'document', template = 'minimal', isLetter = false, style = {}, photo = null }) {
  const { lang } = useLang()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [wordLoading, setWordLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePDF = async () => {
    // On iOS Safari, saveAs()/anchor-click downloads silently no-op, so open
    // the file in a tab instead. window.open must fire synchronously inside
    // the click handler — opening it here, before the async PDF build, keeps
    // it inside the user-gesture window so Safari doesn't block it as a popup.
    const newTab = isMobile() ? window.open('', '_blank') : null
    setPdfLoading(true)
    setError('')
    try {
      if (newTab) {
        const blob = await generatePDFBlob(text, template, isLetter, photo)
        openBlobInTab(newTab, blob)
      } else {
        await downloadAsPDF(text, filename, template, isLetter, photo)
      }
    } catch (err) {
      console.error('PDF error:', err)
      if (newTab) newTab.close()
      setError('PDF generation failed. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleWord = async () => {
    const newTab = isMobile() ? window.open('', '_blank') : null
    setWordLoading(true)
    setError('')
    try {
      if (newTab) {
        const blob = await generateWordBlob(text, template, isLetter, photo)
        openBlobInTab(newTab, blob)
      } else {
        await downloadAsWord(text, filename, template, isLetter, photo)
      }
    } catch (err) {
      console.error('Word error:', err)
      if (newTab) newTab.close()
      setError('Word generation failed. Please try again.')
    } finally {
      setWordLoading(false)
    }
  }

  return (
    <>
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
            {t[lang].download_pdf}
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
            {t[lang].download_word}
          </>
        )}
      </button>
      {error && (
        <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
      )}
    </div>
    {isMobile() && (
      <div style={{ fontSize: 11, color: 'rgba(226,237,232,0.4)', textAlign: 'center', marginTop: 6, width: '100%' }}>
        {t[lang].mobile_download_hint}
      </div>
    )}
    </>
  )
}
