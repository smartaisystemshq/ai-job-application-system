import React, { useRef, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

export default function FileUploadField({
  label, value, onChange, onFileSelect, onFileRemove,
  file, placeholder, rows = 12,
}) {
  const { lang } = useLang();
  const fileInputRef = useRef(null);
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState('');

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';

    if (f.size > 10 * 1024 * 1024) {
      setFileError('File too large. Maximum 10 MB.');
      return;
    }

    setFileError('');
    const ext = f.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
      const buffer = await f.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      onFileSelect({ name: f.name, type: 'pdf' }, base64);
    } else if (ext === 'docx') {
      setExtracting(true);
      try {
        const buffer = await f.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        const res = await fetch('/api/extract-docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Extraction failed');
        onFileSelect({ name: f.name, type: 'docx' }, data.text);
      } catch (err) {
        setFileError(err.message || 'Failed to extract text from DOCX.');
      } finally {
        setExtracting(false);
      }
    } else {
      setFileError('Please upload a PDF or DOCX file.');
    }
  };

  const handleRemove = () => {
    setFileError('');
    onFileRemove();
  };

  const wordCount = value && value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      <label className="label">{label}</label>

      <div style={{ marginBottom: 10 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        {file ? (
          <div className="file-badge">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {file.name}
              {file.type === 'pdf' && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginLeft: 4 }}>PDF</span>}
              {file.type === 'docx' && <span style={{ fontSize: 11, color: 'var(--status-applied-color)', fontWeight: 600, marginLeft: 4 }}>{t[lang].cv_docx_extracted}</span>}
            </span>
            <button onClick={handleRemove} className="file-remove-btn" title="Remove file">✕</button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={extracting}
            className="upload-btn"
          >
            {extracting ? (
              <><span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'currentColor' }}></span> {t[lang].file_extracting}</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                {t[lang].file_upload_btn}
              </>
            )}
          </button>
        )}

        {fileError && <div style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{fileError}</div>}
      </div>

      {(!file || file.type === 'docx') && (
        <>
          {!file && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
              {t[lang].file_paste_hint}
            </div>
          )}
          <textarea
            className="textarea"
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ minHeight: rows * 22 }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            {wordCount > 0 && `${wordCount} ${t[lang].label_words}`}
          </div>
        </>
      )}

      {file?.type === 'pdf' && (
        <div className="pdf-ready-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{t[lang].cv_pdf_ready}</span>
        </div>
      )}
    </div>
  );
}
