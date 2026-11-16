import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { checkContent, assessContent } from '../index.js';
import { createDetectorServer } from '../server/local.js';
import worker from '../worker/index.js';

const threat = 'tanginamo pare yang kapatid mo na yan di pako binabayaran, pag ako nainis tanggal ang ulo nya';
const normal = 'Our meeting is tomorrow afternoon.';
const noFetch = () => { throw Error('Unexpected network request'); };

test('default and offline checks require no network or provider keys', async () => {
  const result = await checkContent({ text: threat }, { fetcher: noFetch });
  assert.equal(result.assessment.level, assessContent({ text: threat }).level);
  const offline = await checkContent({ text: normal }, {
    ai: true, reputation: true, provider: 'openrouter', online: false, fetcher: noFetch,
  });
  assert.equal(offline.assessment.level, 'Insufficient evidence');
  assert.equal(offline.semantic.status, 'not_checked');
});

test('strong local threats skip AI even when online review is selected', async () => {
  const result = await checkContent({ text: threat }, { ai: true, provider: 'openrouter', fetcher: noFetch });
  assert.equal(result.assessment.level, 'High risk');
  assert.equal(result.semantic.status, 'not_checked');
});

test('explicit AI selection forwards the disclosed provider and validates merged meaning', async () => {
  let calls = 0;
  const result = await checkContent({ text: normal }, {
    ai: true, provider: 'openrouter',
    fetcher: async (url, options) => {
      calls++;
      assert.equal(url, '/api/assess');
      assert.deepEqual(JSON.parse(options.body), { text: normal, kind: 'message', consent: true, provider: 'openrouter' });
      return Response.json({ status: 'completed', analysis: {
        level: 'Low risk', summary: 'An ordinary meeting reminder.', recommendation: 'Confirm through a known contact if unsure.', findings: [],
      } });
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.assessment.level, 'Low risk');
});

test('invalid provider output and network failure cannot certify benign meaning', async () => {
  for (const fetcher of [async () => { throw Error('Offline'); }, async () => Response.json({ status: 'completed', analysis: {} })]) {
    const result = await checkContent({ text: normal }, { ai: true, provider: 'openrouter', fetcher });
    assert.equal(result.assessment.level, 'Insufficient evidence');
    assert.equal(result.assessment.semanticStatus, 'unavailable');
  }
});

test('selected URL reputation preserves a reported threat and URL query', async () => {
  const url = 'https://example.com/check?token=test';
  const result = await checkContent({ text: url, kind: 'link' }, {
    reputation: true, fetcher: async (endpoint, options) => {
      assert.equal(endpoint, '/api/verify');
      assert.deepEqual(JSON.parse(options.body), { urls: [url] });
      return Response.json({ status: 'completed', results: [{ url, threats: ['SOCIAL_ENGINEERING'] }] });
    },
  });
  assert.equal(result.assessment.level, 'High risk');
});

test('image upload helper requires explicit consent before accessing canvas or network', async () => {
  const { imageRequest } = await import('../browser.js');
  await assert.rejects(imageRequest(null, 'openrouter', 'origin'), /Opt in/);
});

test('API-only Worker routes local detection and returns 404 without static assets', async () => {
  const request = new Request('https://surfare.example/api/detect', {
    method: 'POST', body: JSON.stringify({ text: threat }),
  });
  assert.equal((await (await worker.fetch(request, {})).json()).level, 'High risk');
  assert.equal((await worker.fetch(new Request('https://surfare.example/'), {})).status, 404);
});

test('standalone HTTP server validates local input and keeps provider services separate', async () => {
  // No provider keys are used by this integration test.
  const server = createDetectorServer(() => ({}));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual(await (await fetch(base + '/api/health')).json(), { status: 'ok' });
    const post = (body, headers = {}) => fetch(base + '/api/detect', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
    });
    const response = await post({ text: threat }, { origin: base });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).level, 'High risk');
    const forged = await post({ text: normal, verification: { status: 'completed', results: [{ threats: ['MALWARE'] }] } });
    assert.equal((await forged.json()).level, 'Insufficient evidence');
    assert.equal((await post({ text: threat }, { origin: 'https://other.example' })).status, 403);
    assert.equal((await post({ text: '' })).status, 400);
    assert.equal((await post({ text: 'x'.repeat(12001) })).status, 400);
    assert.equal((await post({ text: threat, uncertain: 'false' })).status, 400);
    assert.equal((await post({ text: threat, urls: ['x'.repeat(61000)] })).status, 413);
    assert.equal((await fetch(base + '/api/verify')).status, 200);
    assert.deepEqual(await (await fetch(base + '/api/verify')).json(), { configured: false });
    const ai = await fetch(base + '/api/assess', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: normal, kind: 'message', consent: true, provider: 'gemini' }),
    });
    assert.equal(ai.status, 503);
    assert.equal((await fetch(base + '/missing')).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
