/** Decode a canvas locally. An empty string means no QR was recovered. */
export async function decodeQr(canvas) {
  const sample = document.createElement('canvas');
  const scale = Math.min(1, 1400 / Math.max(canvas.width, canvas.height));
  sample.width = Math.max(1, Math.round(canvas.width * scale));
  sample.height = Math.max(1, Math.round(canvas.height * scale));
  const ctx = sample.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
  const pixels = ctx.getImageData(0, 0, sample.width, sample.height);
  const { default: jsQR } = await import('jsqr');
  const decoded = jsQR(pixels.data, sample.width, sample.height, { inversionAttempts: 'attemptBoth' })?.data || '';
  if (decoded || scale === 1) return decoded;
  const full = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(full.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' })?.data || '';
}

/** The caller owns and terminates the worker. Assets must be served at assetBase. */
export async function createOcrWorker({ assetBase = '/ocr', logger = () => {} } = {}) {
  const { createWorker } = await import('tesseract.js');
  const base = assetBase.replace(/\/$/, '');
  return createWorker('eng', 1, {
    workerPath: `${base}/worker.min.js`, workerBlobURL: false,
    corePath: base, langPath: base, cachePath: 'surfare-lstm-v2', logger,
  });
}

/** Return a cropped canvas using normalized coordinates from 0 to 1. */
export function cropCanvas(source, { left, top, right, bottom }) {
  if (![left, top, right, bottom].every(n => Number.isFinite(n) && n >= 0 && n <= 1) ||
    right <= left || bottom <= top) throw Error('Select a nonempty crop inside the image.');
  const result = document.createElement('canvas');
  const x = Math.round(left * source.width), y = Math.round(top * source.height);
  result.width = Math.max(1, Math.round((right - left) * source.width));
  result.height = Math.max(1, Math.round((bottom - top) * source.height));
  result.getContext('2d').drawImage(source, x, y, result.width, result.height, 0, 0, result.width, result.height);
  return result;
}
