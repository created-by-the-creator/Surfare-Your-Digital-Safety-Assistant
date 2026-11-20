import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import jsQR from 'jsqr';
import { Camera, Check, Focus, RotateCcw, X } from 'lucide-react';
import { assessCaptureQuality } from '../engine/captureQuality.js';
import './CameraModal.css';

const MAX_CAPTURE_DIMENSION = 1920;
const MAX_SCAN_DIMENSION = 1100;

export default function CameraModal({ t, target, onCapture, onClose }) {
  const videoRef = useRef(null);
  const dialogRef = useRef(null);
  const streamRef = useRef(null);
  const capturedRef = useRef(null);
  const activeRef = useRef(false);
  const qualityCheckRef = useRef(null);
  const [errorKey, setErrorKey] = useState('');
  const [decodedValue, setDecodedValue] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [quality, setQuality] = useState('starting');
  const [captured, setCaptured] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll('button:not([disabled])'));
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!captured) { setPreviewUrl(''); return undefined; }
    const url = URL.createObjectURL(captured.file);
    setPreviewUrl(url);
    dialogRef.current?.querySelector('.camera-review-actions button')?.focus({ preventScroll: true });
    return () => URL.revokeObjectURL(url);
  }, [captured]);

  useEffect(() => {
    let active = true;
    activeRef.current = true;
    let animationFrame = 0;
    let lastScan = 0;
    let lastQuality = 0;
    let lastDecoded = 0;
    let previousGray = null;
    const scanCanvas = document.createElement('canvas');
    const scanContext = scanCanvas.getContext('2d', { willReadFrequently: true });
    const qualityCanvas = document.createElement('canvas');
    const qualityContext = qualityCanvas.getContext('2d', { willReadFrequently: true });

    const inspectQuality = (video, compareMotion) => {
      if (!qualityContext) return 'ready';
      const cropWidth = video.videoWidth * .8;
      const cropHeight = video.videoHeight * .8;
      const scale = Math.min(1, 320 / Math.max(cropWidth, cropHeight));
      qualityCanvas.width = Math.max(3, Math.round(cropWidth * scale));
      qualityCanvas.height = Math.max(3, Math.round(cropHeight * scale));
      qualityContext.drawImage(video, video.videoWidth * .1, video.videoHeight * .1, cropWidth, cropHeight, 0, 0, qualityCanvas.width, qualityCanvas.height);
      const frame = qualityContext.getImageData(0, 0, qualityCanvas.width, qualityCanvas.height);
      const assessment = assessCaptureQuality(frame, compareMotion ? previousGray : null);
      previousGray = assessment.gray;
      return assessment.quality;
    };
    // Capture rechecks the current frame instead of relying on an older live hint.
    qualityCheckRef.current = inspectQuality;

    const scanFrame = () => {
      if (!active) return;
      const video = videoRef.current;
      const now = performance.now();
      try {
        if (!capturedRef.current && video?.readyState >= 2 && video.videoWidth && video.videoHeight) {
          if (now - lastQuality >= 500) {
            lastQuality = now;
            setQuality(inspectQuality(video, true));
          }
          if (target === 'qr' && scanContext && now - lastScan >= 120) {
            lastScan = now;
            const scale = Math.min(1, MAX_SCAN_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
            scanCanvas.width = Math.max(1, Math.round(video.videoWidth * scale));
            scanCanvas.height = Math.max(1, Math.round(video.videoHeight * scale));
            scanContext.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
            const image = scanContext.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
            const decoded = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
            if (decoded?.data) { lastDecoded = now; setDecodedValue(decoded.data); }
            else if (now - lastDecoded > 1500) setDecodedValue('');
          }
        }
      } catch {
        // Mobile cameras can briefly lose a frame when the phone rotates.
        previousGray = null;
      }
      animationFrame = window.requestAnimationFrame(scanFrame);
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorKey('camera.denied');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          if (!active) return;
          setIsReady(true);
          scanFrame();
        }
      } catch (error) {
        console.warn('Camera access unavailable:', error);
        if (active) setErrorKey('camera.denied');
      }
    };
    startCamera();
    return () => {
      active = false;
      activeRef.current = false;
      window.cancelAnimationFrame(animationFrame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [target]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight || isCapturing) return;
    setIsCapturing(true);
    setErrorKey('');
    try {
      const scale = Math.min(1, MAX_CAPTURE_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas_unavailable');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('capture_failed');
      const file = new File([blob], `surfare-camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (!activeRef.current) return;
      if (target === 'qr') onCapture(file, decodedValue);
      else {
        const photo = { file, quality: qualityCheckRef.current?.(video, false) ?? quality };
        capturedRef.current = photo;
        setCaptured(photo);
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
      setErrorKey('camera.captureFailed');
    } finally {
      setIsCapturing(false);
    }
  };

  const isQrMode = target === 'qr';
  const displayedQuality = captured?.quality ?? quality;
  const hasWarning = !(isQrMode && decodedValue) && !['ready', 'starting'].includes(displayedQuality);
  const guidanceKey = isQrMode && decodedValue ? 'camera.quality.qrReady' : `camera.quality.${displayedQuality}`;

  return createPortal(
    <div
      className="camera-catcher"
      data-camera-modal
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="camera-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('camera.title')}
      >
        <button className="camera-close" type="button" onClick={onClose} aria-label={t('camera.close')}>
          <X size={20} aria-hidden="true" />
        </button>
        <h2>{captured ? t('camera.review') : t('camera.title')}</h2>
        <p>{captured ? t('camera.reviewHelp') : isQrMode ? t('camera.scanning') : t('camera.permission')}</p>
        <div className="camera-preview">
          <video ref={videoRef} playsInline muted hidden={Boolean(captured)} aria-label={t('camera.title')} />
          {captured && previewUrl && <img className="camera-photo" src={previewUrl} alt={t('camera.photoAlt')} />}
          {!captured && !errorKey && <span className="camera-frame" aria-hidden="true" />}
        </div>
        {errorKey && <p className="camera-error" role="alert">{t(errorKey)}</p>}
        {!errorKey && (
          <div className={`camera-guidance${hasWarning ? ' needs-attention' : ''}`} role="status" aria-live="polite">
            {displayedQuality === 'ready' || (isQrMode && decodedValue) ? <Check aria-hidden="true" size={20} /> : <Focus aria-hidden="true" size={20} />}
            <p>{t(guidanceKey)}</p>
          </div>
        )}
        {!captured && !errorKey && <p className="camera-tips">{t('camera.tips')}</p>}
        {isQrMode && decodedValue && (
          <div className="camera-decoded" aria-live="polite">
            <strong>{t('camera.found')}</strong>
            <p>{decodedValue}</p>
          </div>
        )}
        {captured ? (
          <div className="camera-review-actions">
            <button className="camera-retake" type="button" onClick={() => {
              capturedRef.current = null;
              setCaptured(null);
              setErrorKey('');
              window.requestAnimationFrame(() => dialogRef.current?.querySelector('.camera-capture')?.focus());
            }}><RotateCcw size={18} aria-hidden="true" />{t('camera.retake')}</button>
            <button className="camera-use" type="button" onClick={() => onCapture(captured.file, '')}>
              <Check size={18} aria-hidden="true" />{t(hasWarning ? 'camera.useAnyway' : 'camera.usePhoto')}
            </button>
          </div>
        ) : <button
          className="camera-capture"
          type="button"
          disabled={errorKey === 'camera.denied' || !isReady || isCapturing || (isQrMode && !decodedValue)}
          onClick={capture}
        >
          <Camera size={19} aria-hidden="true" />
          {isQrMode ? t('camera.useQr') : t('camera.capture')}
        </button>}
      </section>
    </div>, document.body,
  );
}
