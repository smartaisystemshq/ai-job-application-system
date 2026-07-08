import React, { useState } from 'react'
import { downloadAsPDF, downloadAsWord, generatePDFBlob, generateWordBlob, isMobile, supportsFileShare } from './downloadUtils'
import { useLang } from '../context/LanguageContext'
import { t } from '../translations'

function openBlobInTab(newTab, blob) {
  const url = URL.createObjectURL(blob)
  newTab.location.href = url
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// Hands the file to the OS share sheet (Save to Files, Mail, etc). Unlike
// navigating a tab to a blob: URL, this works for any file type — it doesn't
// require the browser to be able to render the content inline. Returns true
// if the file was handed off (share sheet opened or user cancelled it),
// false if this device/file can't use Web Share and the caller should fall
// back to the blob-tab method.
async function shareBlob(blob, filename) {
  const file = new File([blob], filename, { type: blob.type })
  if (!navigator.canShare({ files: [file] })) return false
  try {
    await navigator.share({ files: [file] })
  } catch (err) {
    if (err.name !== 'AbortError') throw err
  }
  return true
}

export default function DownloadButtons({ text, filename = 'document', template = 'minimal', isLetter = false, style = {}, photo = null }) {
  const { lang } = useLang()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [wordLoading, setWordLoading] = useState(false)
  const [error, setError] = useState('')
  const canShareFiles = supportsFileShare()

  const handlePDF = async () => {
    // On iOS Safari, saveAs()/anchor-click downloads silently no-op. Web
    // Share (below) is the reliable path there. For browsers without it, we
    // fall back to opening a blob: URL in a new tab — window.open must fire
    // synchronously inside the click handler (before the async PDF build) to
    // stay inside the user-gesture window, or Safari blocks it as a popup.
    // Must pass 'about:blank' explicitly — Safari silently blocks
    // window.open('') (empty string) even from a direct click handler.
    if (isMobile()) {
      const newTab = canShareFiles ? null : window.open('about:blank', '_blank')
      if (!canShareFiles && !newTab) {
        setError('Please allow pop-ups for this site, then try again.')
        return
      }
      setPdfLoading(true)
      setError('')
      try {
        const blob = await generatePDFBlob(text, template, isLetter, photo)
        if (canShareFiles) {
          const shared = await shareBlob(blob, filename + '.pdf')
          if (!shared) {
            const fallbackTab = window.open('about:blank', '_blank')
            if (!fallbackTab) throw new Error('Please allow pop-ups for this site, then try again.')
            openBlobInTab(fallbackTab, blob)
          }
        } else {
          openBlobInTab(newTab, blob)
        }
      } catch (err) {
        console.error('PDF error:', err)
        if (newTab) newTab.close()
        setError('PDF generation failed. Please try again.')
      } finally {
        setPdfLoading(false)
      }
      return
    }
    setPdfLoading(true)
    setError('')
    try {
      await downloadAsPDF(text, filename, template, isLetter, photo)
    } catch (err) {
      console.error('PDF error:', err)
      setError('PDF generation failed. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleWord = async () => {
    if (isMobile()) {
      const newTab = canShareFiles ? null : window.open('about:blank', '_blank')
      if (!canShareFiles && !newTab) {
        setError('Please allow pop-ups for this site, then try again.')
        return
      }
      setWordLoading(true)
      setError('')
      try {
        const blob = await generateWordBlob(text, template, isLetter, photo)
        if (canShareFiles) {
          const shared = await shareBlob(blob, filename + '.docx')
          if (!shared) {
            const fallbackTab = window.open('about:blank', '_blank')
            if (!fallbackTab) throw new Error('Please allow pop-ups for this site, then try again.')
            openBlobInTab(fallbackTab, blob)
          }
        } else {
          openBlobInTab(newTab, blob)
        }
      } catch (err) {
        console.error('Word error:', err)
        if (newTab) newTab.close()
        setError('Word generation failed. Please try again.')
      } finally {
        setWordLoading(false)
      }
      return
    }
    setWordLoading(true)
    setError('')
    try {
      await downloadAsWord(text, filename, template, isLetter, photo)
    } catch (err) {
      console.error('Word error:', err)
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
    {isMobile() && !canShareFiles && (
      <div style={{ fontSize: 11, color: 'rgba(226,237,232,0.4)', textAlign: 'center', marginTop: 6, width: '100%' }}>
        {t[lang].mobile_download_hint}
      </div>
    )}
    </>
  )
}
