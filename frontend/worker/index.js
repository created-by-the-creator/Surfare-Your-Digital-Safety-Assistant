const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 10;
const rateLimits = new Map();
const THREAT_TYPES = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION',
];

function response(body, status, origin) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowCors(responseValue, origin) {
  const headers = new Headers(responseValue.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return new Response(responseValue.body, {
    status: responseValue.status,
    headers,
  });
}

function allowRequest(ip, now = Date.now()) {
  const current = rateLimits.get(ip);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(ip, { startedAt: now, count: 1 });
    if (rateLimits.size > 1000) {
      for (const [key, value] of rateLimits) {
        if (now - value.startedAt >= RATE_LIMIT_WINDOW_MS) rateLimits.delete(key);
      }
    }
    return true;
  }
  if (current.count >= RATE_LIMIT_REQUESTS) return false;
  current.count += 1;
  return true;
}

function parseUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN;
    const requestOrigin = request.headers.get('Origin');
    if (!allowedOrigin || requestOrigin !== allowedOrigin) {
      return response({ error: 'origin_not_allowed' }, 403);
    }

    if (request.method === 'OPTIONS') {
      return allowCors(new Response(null, { status: 204 }), allowedOrigin);
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return allowCors(response({ ok: true }, 200), allowedOrigin);
    }
    if (request.method !== 'POST' || url.pathname !== '/check-url') {
      return allowCors(response({ error: 'not_found' }, 404), allowedOrigin);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!allowRequest(ip)) {
      return allowCors(response({ error: 'rate_limited' }, 429), allowedOrigin);
    }
    if (!env.SAFE_BROWSING_API_KEY) {
      return allowCors(response({ error: 'service_unavailable' }, 503), allowedOrigin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return allowCors(response({ error: 'invalid_json' }, 400), allowedOrigin);
    }
    const checkedUrl = parseUrl(payload?.url);
    if (!checkedUrl) {
      return allowCors(response({ error: 'invalid_url' }, 400), allowedOrigin);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const upstream = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(env.SAFE_BROWSING_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: { clientId: 'surfare', clientVersion: '0.1.0' },
            threatInfo: {
              threatTypes: THREAT_TYPES,
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url: checkedUrl }],
            },
          }),
          signal: controller.signal,
        },
      );
      if (!upstream.ok) {
        return allowCors(response({ error: 'upstream_unavailable' }, 502), allowedOrigin);
      }
      const result = await upstream.json();
      const threatTypes = Array.isArray(result.matches)
        ? [...new Set(result.matches.map((match) => match.threatType).filter(Boolean))]
        : [];
      return allowCors(
        response({ matched: threatTypes.length > 0, threatTypes }, 200),
        allowedOrigin,
      );
    } catch {
      return allowCors(response({ error: 'upstream_unavailable' }, 502), allowedOrigin);
    } finally {
      clearTimeout(timeout);
    }
  },
};
