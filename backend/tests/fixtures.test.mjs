import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assessContent } from '../lib/content-assessment.js';

const fixturePath = resolve('tests/fixtures/context-cases.json');
const cases = JSON.parse(await readFile(fixturePath, 'utf8'));

for (const fixture of cases) {
  test(`fixture: ${fixture.name}`, () => {
    const result = assessContent({
      text: fixture.text,
      kind: fixture.kind,
      uncertain: fixture.uncertain,
    });
    assert.equal(result.level, fixture.expected);
  });
}

test('fixture files feed image, text, and QR kinds through extracted text', async () => {
  const text = (await readFile(
    resolve('tests/fixtures/content/tagalog-threat.txt'),
    'utf8',
  )).trim();
  const qrText = (await readFile(
    resolve('tests/fixtures/content/tagalog-threat-qr.txt'),
    'utf8',
  )).trim();

  assert.equal(assessContent({ text, kind: 'image' }).level, 'High risk');
  assert.equal(assessContent({ text, kind: 'message' }).level, 'High risk');
  assert.equal(assessContent({ text: qrText, kind: 'qr' }).level, 'High risk');
});
