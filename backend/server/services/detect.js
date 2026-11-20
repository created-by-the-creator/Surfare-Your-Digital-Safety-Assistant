import { assessContent } from '../../lib/content-assessment.js';

export async function detect(request) {
  const json = (body, status = 200) => Response.json(body, {
    status, headers: { 'Cache-Control': 'no-store' },
  });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const apiUrl = new URL(request.url);
      const localOrigin =
        originUrl.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(originUrl.hostname) &&
        ['localhost', '127.0.0.1'].includes(apiUrl.hostname);
      if (!localOrigin && origin !== apiUrl.origin) {
        return json({ error: 'Origin rejected.' }, 403);
      }
    } catch {
      return json({ error: 'Origin rejected.' }, 403);
    }
  }
  try {
    const raw = await request.text();
    if (raw.length > 30000) return json({ error: 'Input is too large.' }, 413);
    const input = JSON.parse(raw);
    if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 12000 ||
      (input.kind !== undefined && !['message', 'link', 'image', 'qr'].includes(input.kind)) ||
      (input.uncertain !== undefined && typeof input.uncertain !== 'boolean') ||
      (input.urls !== undefined && (!Array.isArray(input.urls) || input.urls.length > 10 ||
        input.urls.some(url => typeof url !== 'string' || url.length > 2048))))
      return json({ error: 'Provide text up to 12,000 characters and a supported input type.' }, 400);
    // Ignore user-supplied verification/provider results. This endpoint is local-only.
    return json(assessContent({ text: input.text, kind: input.kind, urls: input.urls, uncertain: input.uncertain }));
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
}
