import { afterEach, describe, expect, it, vi } from 'vitest';
import { probeConnection } from './useConnectionStatus.js';

afterEach(() => vi.unstubAllGlobals());

describe('connection probe', () => {
  it('requires a fresh response with the expected content', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://surfare.example' } });
    const fetch = vi.fn().mockResolvedValue(new Response('surfare-connected\n'));
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    expect(await probeConnection(controller.signal)).toBe(true);
    const [url, options] = fetch.mock.calls[0];
    expect(url.pathname).toBe('/connection.txt');
    expect(url.searchParams.has('check')).toBe(true);
    expect(options).toEqual({ cache: 'no-store', signal: controller.signal });
  });

  it.each([
    ['<html>Sign in to Wi-Fi</html>', 200],
    ['surfare-connected', 503],
  ])('does not count a captive portal or failed request as online', async (body, status) => {
    vi.stubGlobal('window', { location: { origin: 'https://surfare.example' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })));
    expect(await probeConnection(new AbortController().signal)).toBe(false);
  });
});
