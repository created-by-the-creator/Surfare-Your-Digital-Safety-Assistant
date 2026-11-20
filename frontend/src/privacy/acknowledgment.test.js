import { describe, expect, it } from 'vitest';
import { ACKNOWLEDGMENT_KEY, NOTICE_VERSION, clearAcknowledgment, readAcknowledgment, saveAcknowledgment } from './acknowledgment.js';

describe('privacy acknowledgment persistence', () => {
  it.each([
    null,
    '{invalid json',
    JSON.stringify({ version: 'previous', acceptedAt: new Date().toISOString() }),
    JSON.stringify({ version: NOTICE_VERSION, acceptedAt: 'not a date' }),
  ])('requires a new acknowledgment for absent, corrupt, or outdated records', (record) => {
    expect(readAcknowledgment({ getItem: () => record })).toBeNull();
  });

  it('stores only the current notice version and acknowledgment time, and can clear it', () => {
    const data = new Map();
    const storage = {
      getItem: (key) => data.get(key),
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    };
    saveAcknowledgment(storage);
    const record = readAcknowledgment(storage);
    expect(Object.keys(record).sort()).toEqual(['acceptedAt', 'version']);
    expect(record.version).toBe(NOTICE_VERSION);
    clearAcknowledgment(storage);
    expect(storage.getItem(ACKNOWLEDGMENT_KEY)).toBeUndefined();
  });

  it('does not block the app when browser storage is unavailable', () => {
    const blocked = () => { throw new Error('Storage unavailable'); };
    const storage = { getItem: blocked, setItem: blocked, removeItem: blocked };
    expect(readAcknowledgment(storage)).toBeNull();
    expect(() => saveAcknowledgment(storage)).not.toThrow();
    expect(() => clearAcknowledgment(storage)).not.toThrow();
  });
});
