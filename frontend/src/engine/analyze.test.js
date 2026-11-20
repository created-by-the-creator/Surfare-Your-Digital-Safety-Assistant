import { describe, expect, it, vi } from 'vitest';
import { analyzeInput } from './analyze.js';

describe('analyzeInput', () => {
  it('classifies a message with an OTP and account threat as high risk', async () => {
    const result = await analyzeInput(
      'text',
      { message: 'Send your OTP now. Your account will be blocked today.' },
      { onlineLookup: false },
    );

    expect(result.level).toBe('high');
    expect(result.signals.map((signal) => signal.id)).toContain('otp_request');
  });

  it('keeps ordinary, sufficiently detailed text at low risk', async () => {
    const result = await analyzeInput(
      'text',
      { message: 'The school meeting has moved to Thursday afternoon at two.' },
      { onlineLookup: false },
    );

    expect(result.level).toBe('low');
    expect(result.signals).toHaveLength(0);
  });

  it('does not make a URL request when offline-only checks are selected', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');

    try {
      const result = await analyzeInput(
        'links',
        { url: 'example.com/help' },
        { onlineLookup: false },
      );

      expect(result.usedOnline).toBe(false);
      expect(result.onlineUnavailable).toBe(false);
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/check-url'),
        expect.anything(),
      );
    } finally {
      fetch.mockRestore();
    }
  });

  it('returns an insufficient-information result for short text', async () => {
    const result = await analyzeInput(
      'text',
      { message: 'Hi.' },
      { onlineLookup: false },
    );

    expect(result.level).toBe('unknown');
  });
});
