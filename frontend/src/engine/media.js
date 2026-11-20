import jsQR from 'jsqr';

const MAX_OCR_DIMENSION = 2200;
const WORKER_OPTIONS = {
  workerPath: '/tesseract/worker.min.js',
  corePath: '/tesseract/tesseract-core-simd-lstm.wasm.js',
  langPath: '/tessdata',
  gzip: true,
  workerBlobURL: false,
};

async function createLocalOcrWorker() {
  const { createWorker } = await import('tesseract.js');
  return createWorker('eng+fil', undefined, WORKER_OPTIONS);
}

function createAnalysisCanvas(bitmap) {
  const scale = Math.min(1, MAX_OCR_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('canvas_unavailable');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

export async function inspectImage(file, { includeOcr = true } = {}) {
  const bitmap = await createImageBitmap(file);
  try {
    const { canvas, context } = createAnalysisCanvas(bitmap);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    let text = '';
    if (includeOcr) {
      const worker = await createLocalOcrWorker();
      try {
        const recognition = await worker.recognize(canvas);
        text = recognition.data.text.trim();
      } finally {
        await worker.terminate();
      }
    }

    return {
      text,
      qrValue: qr?.data ?? '',
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}
