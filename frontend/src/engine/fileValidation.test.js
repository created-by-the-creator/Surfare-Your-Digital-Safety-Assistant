import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateImageFile } from './fileValidation.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('validateImageFile', () => {
  it('accepts a supported image signature and checks its dimensions', async () => {
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 800, height: 600, close }),
    );
    const png = new Blob([
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ]);

    await expect(validateImageFile(png)).resolves.toMatchObject({
      mime: 'image/png',
      width: 800,
      height: 600,
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it('rejects a file that has no supported magic-byte signature', async () => {
    const file = new Blob(['not an image'], { type: 'image/png' });
    await expect(validateImageFile(file)).rejects.toThrow('file_unsupported');
  });
});
