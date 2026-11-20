import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const datasetsDir = path.join(backendRoot, 'datasets');
const textDatasetPath = path.join(datasetsDir, 'A.S.E.A Taglish scam Dataset.csv');
const urlDatasetPath = path.join(datasetsDir, 'PhiUSIIL_Phishing_URL_Dataset.csv');

let textRows = null;
let urlRows = null;
let urlIndex = null;
let textIndex = null;
const textMatchCache = new Map();

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field.replace(/\r$/, ''));
  if (row.some((value) => value.length > 0)) rows.push(row);
  const headers = rows.shift();
  if (!headers) return [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [
    header.trim(),
    values[index]?.trim() ?? '',
  ])));
}

function loadTextRows() {
  if (!textRows) {
    textRows = parseCsv(fs.readFileSync(textDatasetPath, 'utf8'))
      .filter((row) => row.text?.trim())
      .map((row) => ({
        text: normalizeText(row.text),
        intent: row.intent?.trim() || '',
        tokens: tokenSet(row.text),
      }));
    textIndex = new Map();
    for (const row of textRows) {
      const first = row.text.split(' ')[0];
      if (!first) continue;
      const bucket = textIndex.get(first) || [];
      bucket.push(row);
      textIndex.set(first, bucket);
    }
  }
  return textRows;
}

function loadUrlIndex() {
  if (!urlRows) {
    const lines = fs.readFileSync(urlDatasetPath, 'utf8').split('\n');
    lines.shift();
    urlRows = [];
    urlIndex = new Map();
    for (const line of lines) {
      const values = line.split(',');
      if (values.length < 2) continue;
      const url = normalizeUrl(values[1].trim().replace(/^"|"$/g, ''));
      const label = String(values.at(-1).trim().replace(/^"|"$/g, '')).trim();
      if (url && label && !urlIndex.has(url)) {
        urlIndex.set(url, label);
        urlRows.push({ URL: url, label });
      }
    }
  }
  return urlIndex;
}

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeUrl(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function tokenSet(value) {
  return new Set(normalizeText(value).split(' ').filter((token) => token.length >= 3));
}

function tokenSimilarity(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return (2 * intersection) / (a.size + b.size);
}

function textMatch(text) {
  const normalized = normalizeText(text);
  if (normalized.length < 12) return null;
  if (textMatchCache.has(normalized)) return textMatchCache.get(normalized);
  loadTextRows();
  const firstToken = normalized.split(' ')[0];
  const candidates = textIndex.get(firstToken) || [];
  const exact = candidates.find((row) =>
    row.text === normalized
  );
  if (exact) {
    const result = exact.intent === 'HAM'
      ? { kind: 'text', risk: 'low', similarity: 1, intent: exact.intent }
      : { kind: 'text', risk: 'high', similarity: 1, intent: exact.intent };
    textMatchCache.set(normalized, result);
    return result;
  }

  let best = null;
  for (const row of candidates) {
    if (row.text.length < 12) continue;
    const score = tokenSimilarity(normalized, row.text);
    const leftTokens = normalized.split(' ').filter(Boolean);
    const rightTokens = row.text.split(' ').filter(Boolean);
    let matchedPrefix = 0;
    while (
      matchedPrefix < leftTokens.length &&
      matchedPrefix < rightTokens.length &&
      leftTokens[matchedPrefix] === rightTokens[matchedPrefix]
    ) matchedPrefix += 1;
    const prefixRatio = leftTokens.length ? matchedPrefix / leftTokens.length : 0;
    const match = { ...row, similarity: score, prefixRatio };
    if (!best || score > best.similarity || (score === best.similarity && prefixRatio > best.prefixRatio)) {
      best = match;
    }
  }
  if (!best || best.intent === 'HAM') {
    textMatchCache.set(normalized, null);
    return null;
  }
  const strongPrefix =
    leftTokenCount(normalized) >= 8 &&
    best.prefixRatio >= 0.82 &&
    best.similarity >= 0.72;
  const strongSimilarity = best.similarity >= 0.94;
  if (!strongPrefix && !strongSimilarity) {
    textMatchCache.set(normalized, null);
    return null;
  }
  const result = {
    kind: 'text',
    risk: 'high',
    similarity: Math.max(best.similarity, best.prefixRatio),
    intent: best.intent,
  };
  textMatchCache.set(normalized, result);
  return result;
}

function leftTokenCount(value) {
  return normalizeText(value).split(' ').filter(Boolean).length;
}

function urlMatch(urls) {
  const index = loadUrlIndex();
  for (const raw of urls || []) {
    const normalized = normalizeUrl(raw);
    if (!normalized || !index.has(normalized)) continue;
    const label = String(index.get(normalized)).trim();
    // PhiUSIIL: label 1 is legitimate; label 0 is phishing.
    return label === '1'
      ? { kind: 'url', risk: 'low', similarity: 1, label }
      : { kind: 'url', risk: 'high', similarity: 1, label };
  }
  return null;
}

export function assessDatasets(text, urls = []) {
  const textResult = textMatch(text);
  const urlResult = urlMatch(urls);
  if (urlResult?.risk === 'high') return urlResult;
  if (textResult?.risk === 'high') return textResult;
  if (urlResult?.risk === 'medium') return urlResult;
  if (textResult?.risk === 'medium') return textResult;
  return urlResult?.risk === 'low' ? urlResult : textResult?.risk === 'low' ? textResult : null;
}
