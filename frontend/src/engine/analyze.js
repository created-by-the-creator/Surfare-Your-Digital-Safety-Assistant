import { analyzeTextAndUrls } from './text.js';
import { analyzeUrl } from './url.js';
import { decideRisk } from './decision.js';
import { inspectImage } from './media.js';
import { validateImageFile } from './fileValidation.js';

async function checkUrlOnline(url) {
  const workerUrl = import.meta.env.VITE_WORKER_URL;
  if (!navigator.onLine || !workerUrl) {
    return { matched: false, unavailable: true };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${workerUrl.replace(/\/$/, '')}/check-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`online_check_${response.status}`);
    const result = await response.json();
    return { matched: Boolean(result.matched), unavailable: false };
  } catch (error) {
    console.error('Online URL check failed:', error);
    return { matched: false, unavailable: true };
  } finally {
    window.clearTimeout(timeout);
  }
}

function uniqueSignals(signals) {
  const seen = new Set();
  return signals.filter((signal) => {
    const key = `${signal.id}:${signal.evidence ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectTextSignals(content) {
  return analyzeTextAndUrls(content);
}

async function checkLocalDetector(tab, content, urls) {
  const kind = tab === 'links' ? 'link' : tab === 'qr' ? 'qr' : tab === 'image' ? 'image' : 'message';
  try {
    const response = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, kind, urls }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (!result || typeof result !== 'object') return null;
    return result;
  } catch {
    return null;
  }
}

function mergeDetectorResult(frontend, detector, content) {
  if (!detector) return frontend;
  const levelMap = {
    'High risk': 'high',
    'Suspicious': 'suspicious',
    'Low risk': 'low',
    'Insufficient evidence': 'unknown',
  };
  const mappedLevel = levelMap[detector.level];
  if (!mappedLevel) return frontend;

  const detectorSignals = (Array.isArray(detector.indicators) ? detector.indicators : [])
    .filter((indicator) => indicator?.id)
    .flatMap((indicator) => {
      const evidences = indicator.id.startsWith('dataset-')
        ? []
        : Array.isArray(indicator.evidence)
          ? indicator.evidence.map((item) => item?.text).filter(Boolean)
          : [];
      const explanation = indicator.message || indicator.title || '';
      if (!evidences.length) {
        return [{
          id: indicator.id,
          severity: indicator.weight >= 4 ? 3 : indicator.weight >= 2 ? 2 : 1,
          weight: Number(indicator.weight) || 0,
          evidence: '',
          explanation,
        }];
      }
      return evidences.map((evidence) => ({
        id: indicator.id,
        severity: indicator.weight >= 4 ? 3 : indicator.weight >= 2 ? 2 : 1,
        weight: Number(indicator.weight) || 0,
        evidence,
        explanation,
      }));
    });
  const mergedSignals = uniqueSignals([...frontend.signals, ...detectorSignals]);
  const levelPriority = { unknown: 0, low: 1, suspicious: 2, high: 3 };
  const level = levelPriority[mappedLevel] > levelPriority[frontend.level]
    ? mappedLevel
    : frontend.level;

  return {
    ...frontend,
    level: levelPriority[mappedLevel] > levelPriority[frontend.level]
      ? mappedLevel
      : level,
    score: Math.max(frontend.score, Number(detector.score) || 0),
    signals: mergedSignals,
    checkedText: content,
    detectorSummary: detector.summary,
    detectorRecommendation: detector.recommendation,
    detectorIndicators: (Array.isArray(detector.indicators) ? detector.indicators : [])
      .map((indicator) => ({
        id: indicator.id,
        title: indicator.title,
        message: indicator.message,
        evidence: Array.isArray(indicator.evidence)
          ? indicator.evidence.map((item) => item?.text).filter(Boolean).join(' ')
          : '',
      })),
    datasetIntent: detector.indicators?.find((indicator) => indicator.category === 'dataset')?.message
      ?.match(/labeled (.+?) message/i)?.[1] || '',
  };
}

async function checkGeminiText(kind, content) {
  try {
    const response = await fetch('/api/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, kind, consent: true, provider: 'gemini' }),
      signal: AbortSignal.timeout(28000),
    });
    const data = await response.json();
    return data?.status === 'completed' ? data : null;
  } catch {
    return null;
  }
}

async function resizeImageForGemini(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let image = canvas.toDataURL('image/jpeg', 0.82);
    if (image.length > 900000) image = canvas.toDataURL('image/jpeg', 0.55);
    if (image.length > 1000000) throw new Error('image_too_large');
    return image;
  } finally {
    bitmap.close();
  }
}

async function checkGeminiImage(file) {
  try {
    const image = await resizeImageForGemini(file);
    const response = await fetch('/api/image-assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, provider: 'gemini', mode: 'content', consent: true }),
      signal: AbortSignal.timeout(28000),
    });
    const data = await response.json();
    return data?.status === 'completed' ? data : null;
  } catch {
    return null;
  }
}

function applyGeminiResult(result, review) {
  const analysis = review?.analysis;
  if (!analysis) return result;
  const levelMap = {
    'High risk': 'high',
    Suspicious: 'suspicious',
    'Low risk': 'low',
    'Insufficient evidence': 'unknown',
  };
  const aiLevel = levelMap[analysis.level];
  const priority = { unknown: 0, low: 1, suspicious: 2, high: 3 };
  const keepLocal = priority[result.level] > priority[aiLevel];
  const level = keepLocal ? result.level : aiLevel || result.level;
  const findings = Array.isArray(analysis.findings) ? analysis.findings : [];
  const aiSignals = findings.map((finding, index) => ({
    id: `gemini-${index}`,
    severity: finding.level === 'High risk' ? 3 : 2,
    weight: finding.level === 'High risk' ? 6 : 2,
    evidence: finding.quote,
    explanation: finding.explanation,
  }));

  return {
    ...result,
    level,
    score: Math.max(result.score, ...aiSignals.map((signal) => signal.weight)),
    signals: [...aiSignals, ...result.signals],
    checkedText: review.extractedText?.trim() || result.checkedText,
    aiStatus: 'completed',
    aiProvider: review.provider,
    aiModel: review.model,
    geminiIndicators: aiSignals,
    aiSummary: keepLocal ? result.detectorSummary : analysis.summary,
    aiRecommendation: keepLocal ? result.detectorRecommendation : analysis.recommendation,
    detectorSummary: keepLocal ? result.detectorSummary : analysis.summary,
    detectorRecommendation: keepLocal ? result.detectorRecommendation : analysis.recommendation,
  };
}

export async function analyzeInput(tab, inputs, { onlineLookup = true, aiEnabled = false } = {}) {
  let content = '';
  let signals = [];
  let urls = [];
  let mediaInfo = null;

  if (tab === 'text') {
    content = inputs.message.trim();
    ({ signals, urls } = collectTextSignals(content));
  } else if (tab === 'links') {
    content = inputs.url.trim();
    const result = analyzeUrl(content);
    signals = result.signals;
    urls = result.normalized && /^https?:\/\//i.test(result.normalized) ? [result.normalized] : [];
  } else if (tab === 'image' || tab === 'qr') {
    const file = tab === 'image' ? inputs.image : inputs.qr;
    if (tab === 'qr' && inputs.qrValue) {
      mediaInfo = { text: '', qrValue: inputs.qrValue };
    } else {
      await validateImageFile(file);
      mediaInfo = await inspectImage(file, { includeOcr: tab === 'image' });
    }
    content = [mediaInfo.qrValue, mediaInfo.text].filter(Boolean).join('\n');

    if (mediaInfo.qrValue) {
      const decoded = collectTextSignals(mediaInfo.qrValue);
      signals.push(...decoded.signals);
      urls.push(...decoded.urls);
    }
    if (tab === 'image' && mediaInfo.text) {
      const ocr = collectTextSignals(mediaInfo.text);
      signals.push(...ocr.signals);
      urls.push(...ocr.urls);
    }
    if (tab === 'qr' && !mediaInfo.qrValue) {
      return {
        level: 'unknown',
        score: 0,
        signals: [],
        usedOnline: false,
        onlineUnavailable: false,
        checkedText: '',
        errorKey: 'error.qr_missing',
      };
    }
    if (tab === 'image' && !mediaInfo.text && !mediaInfo.qrValue) {
      return {
        level: 'unknown',
        score: 0,
        signals: [],
        usedOnline: false,
        onlineUnavailable: false,
        checkedText: '',
        errorKey: 'error.ocr_failed',
      };
    }
  }

  const detector = await checkLocalDetector(tab, content, urls);
  let onlineMatch = false;
  let onlineUnavailable = false;
  const firstUrl = urls[0];
  if (firstUrl && onlineLookup) {
    const online = await checkUrlOnline(firstUrl);
    onlineMatch = online.matched;
    onlineUnavailable = online.unavailable;
    if (onlineMatch) {
      signals.push({
        id: 'online_match',
        severity: 3,
        weight: 8,
        evidence: firstUrl,
      });
    }
  } else if (tab === 'links' && onlineLookup) {
    onlineUnavailable = true;
  }

  let result = {
    ...decideRisk(uniqueSignals(signals), content, { onlineMatch, onlineUnavailable }),
    mediaInfo,
    inputType: tab,
  };
  result = mergeDetectorResult(result, detector, content);

  const hasLocalEvidence = (Array.isArray(result.detectorIndicators)
    ? result.detectorIndicators
    : []).some((indicator) => indicator.evidence);
  const needsContextualReview =
    result.level === 'unknown' ||
    result.level === 'suspicious' ||
    (result.level === 'low' && !hasLocalEvidence) ||
    (result.level === 'high' && !hasLocalEvidence);

  if (aiEnabled && needsContextualReview && navigator.onLine) {
    const kind = tab === 'links' ? 'link' : tab === 'qr' ? 'qr' : tab === 'image' ? 'image' : 'message';
    const review = tab === 'image' && inputs.image
      ? await checkGeminiImage(inputs.image)
      : await checkGeminiText(kind, result.checkedText);
    if (review) {
      const analysis = review.analysis?.level ? review : { analysis: review.analysis };
      result = applyGeminiResult(result, analysis);
    } else {
      result.aiStatus = 'unavailable';
    }
  }
  return result;
}
