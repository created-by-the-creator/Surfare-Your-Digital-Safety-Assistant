import { AlertCircle, Check, ImagePlus, RotateCw, ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Button from './ui/Button.jsx'
import { useI18n } from '../modules/i18n/useI18n.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg']

// Shared image picker used by both the image and QR checker tabs.
export default function UploadTab({ kind, onAnalyze, disabled }) {
  const inputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [rotated, setRotated] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const { t } = useI18n()
  const isQr = kind === 'qr'

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function chooseFile(event) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFile(null)
      setPreviewUrl('')
      setError('checker.fileErrorType')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setPreviewUrl('')
      setError('checker.fileErrorSize')
      return
    }
    setError('')
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setRotated(false)
    setCropMode(false)
  }

  function submit(event) {
    event.preventDefault()
    if (file) onAnalyze({ type: kind, value: file.name })
  }

  return (
    <form className="tab-panel upload-panel" id={`panel-${kind}`} role="tabpanel" aria-labelledby={`tab-${kind}`} onSubmit={submit}>
      <span className="field-label">{t('checker.uploadLabel')}</span>
      <input
        className="file-input-hidden"
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        aria-label={t('accessibility.selectImage')}
        onChange={chooseFile}
      />
      {kind === 'image' && (
        <input
          className="file-input-hidden"
          ref={cameraInputRef}
          type="file"
          accept="image/png,image/jpeg"
          capture="environment"
          aria-label={t('checker.takePhoto')}
          onChange={chooseFile}
        />
      )}
      {!file ? (
        <button className="drop-zone" type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault()
          chooseFile({ target: { files: event.dataTransfer.files, value: '' } })
        }}>
          <span className="drop-icon"><ImagePlus size={25} aria-hidden="true" /></span>
          <span className="drop-title">{t('checker.dropText')}</span>
          <span className="drop-help">{t('checker.supportedTypes')}</span>
        </button>
      ) : (
        <div className="preview-wrap">
          <img
            src={previewUrl}
            className={`image-preview ${rotated ? 'rotated' : ''} ${cropMode ? 'crop-mode' : ''}`}
            alt={t('checker.previewAlt')}
          />
          <div className="preview-actions">
            <Button type="button" variant="subtle" onClick={() => setCropMode(!cropMode)}>{t('checker.crop')}</Button>
            <Button type="button" variant="subtle" aria-label={t('accessibility.rotateImage')} onClick={() => setRotated(!rotated)}>
              <RotateCw size={15} aria-hidden="true" />{t('checker.rotate')}
            </Button>
            <Button type="button" variant="subtle" onClick={() => { setFile(null); setPreviewUrl('') }}>
              <X size={15} aria-label={t('accessibility.removeImage')} />{t('checker.removeOriginal')}
            </Button>
          </div>
          {cropMode && <p className="crop-note">{t('checker.crop')}</p>}
        </div>
      )}
      {!file && (
        <div className="file-picker-actions">
          <Button type="button" variant="subtle" className="desktop-file-button" onClick={() => inputRef.current?.click()}>{t('checker.chooseFile')}</Button>
          <div className="mobile-file-menu">
            <Button type="button" variant="subtle" onClick={() => inputRef.current?.click()}>{t('checker.photoLibrary')}</Button>
            {kind === 'image' && <Button type="button" variant="subtle" onClick={() => cameraInputRef.current?.click()}>{t('checker.takePhoto')}</Button>}
            <Button type="button" variant="subtle" onClick={() => inputRef.current?.click()}>{t('checker.chooseFile')}</Button>
          </div>
        </div>
      )}
      {error && <p className="form-error" role="alert"><AlertCircle size={16} aria-hidden="true" />{t(error)}</p>}
      <div className="camera-coach">
        <div className="coach-heading"><Check size={15} aria-hidden="true" />{t('checker.cameraCoach')}</div>
        <div className="coach-tips">
          <span>{t('checker.blurry')}</span><span>{t('checker.tooDark')}</span><span>{t('checker.glare')}</span>
        </div>
      </div>
      <Button type="submit" disabled={!file || disabled}>
        <ShieldCheck size={18} aria-hidden="true" />
        {isQr ? t('checker.checkQr') : t('checker.checkImage')}
      </Button>
    </form>
  )
}
