import { parse } from 'tldts';

const BRANDS = [
  'gcash',
  'maya',
  'bpi',
  'bdo',
  'metrobank',
  'landbank',
  'shopee',
  'lazada',
  'facebook',
  'google',
];

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly'];
const RISKY_TLDS = ['zip', 'xyz', 'top', 'click', 'work', 'support', 'rest', 'country'];

function editDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] =
        left[i - 1] === right[j - 1]
          ? previous
          : 1 + Math.min(previous, row[j - 1], row[j]);
      previous = current;
    }
  }
  return row[right.length];
}

function pushSignal(signals, id, evidence, weight = 2, severity = 2) {
  signals.push({ id, evidence, weight, severity });
}

export function normalizeUrl(value) {
  const trimmed = value.trim();
  return /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function analyzeUrl(value) {
  const signals = [];
  const normalized = normalizeUrl(value);
  let url;

  try {
    url = new URL(normalized);
  } catch {
    return {
      normalized,
      signals: [{ id: 'invalid_url', severity: 1, weight: 0, evidence: value }],
    };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    pushSignal(signals, 'data_or_javascript_scheme', url.protocol, 8, 3);
    return { normalized, signals, hostname: url.hostname, domain: url.hostname };
  }

  const parsed = parse(url.hostname);
  const domain = (parsed.domain ?? url.hostname).toLowerCase();
  const subdomain = (parsed.subdomain ?? '').toLowerCase();
  const registrableLabel = domain.split('.')[0];

  if (url.protocol !== 'https:') pushSignal(signals, 'no_https', url.protocol, 1, 1);
  if (parsed.isIp) pushSignal(signals, 'ip_host', url.hostname, 3, 3);
  if ((parsed.subdomain ?? '').split('.').filter(Boolean).length > 3) {
    pushSignal(signals, 'excessive_subdomains', url.hostname, 2, 2);
  }
  if (SHORTENERS.some((shortener) => url.hostname === shortener || url.hostname.endsWith(`.${shortener}`))) {
    pushSignal(signals, 'url_shortener', url.hostname, 2, 2);
  }
  if (/xn--/i.test(url.hostname)) pushSignal(signals, 'punycode_or_homoglyph', url.hostname, 3, 3);
  if (subdomain.split('.').some((label) => BRANDS.some((brand) => label.includes(brand)))) {
    pushSignal(signals, 'brand_in_subdomain_not_domain', url.hostname, 3, 3);
  }
  if (BRANDS.some((brand) => editDistance(registrableLabel, brand) <= 2 && registrableLabel !== brand)) {
    pushSignal(signals, 'lookalike_brand', domain, 3, 3);
  }
  if (parsed.publicSuffix && RISKY_TLDS.includes(parsed.publicSuffix.toLowerCase())) {
    pushSignal(signals, 'risky_tld', `.${parsed.publicSuffix}`, 2, 2);
  }
  if (url.username || url.password || value.includes('@')) {
    pushSignal(signals, 'at_symbol', value, 2, 2);
  }
  if (value.length > 180 || /%[0-9a-f]{2}/i.test(value)) {
    pushSignal(signals, 'long_or_encoded_url', value.slice(0, 100), 2, 2);
  }
  if (url.port && !['80', '443'].includes(url.port)) {
    pushSignal(signals, 'non_standard_port', url.port, 2, 2);
  }
  if (/[?&](?:url|redirect|next|return)=/i.test(url.search)) {
    pushSignal(signals, 'redirect_param', url.search, 2, 2);
  }

  return { normalized, signals, hostname: url.hostname, domain };
}

export { BRANDS };
