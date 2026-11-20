import { describe, expect, it } from 'vitest';
import { assessCaptureQuality } from './captureQuality.js';

function frame(pixel) {
  const width = 96;
  const height = 96;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      data.fill(pixel(x, y), index, index + 3);
      data[index + 3] = 255;
    }
  }
  return { data, width, height };
}

describe('capture guidance', () => {
  it('distinguishes poor lighting from missing detail', () => {
    expect(assessCaptureQuality(frame(() => 20)).quality).toBe('dark');
    expect(assessCaptureQuality(frame(() => 255)).quality).toBe('glare');
    expect(assessCaptureQuality(frame(() => 130)).quality).toBe('detail');
  });

  it('suggests focus for smooth edges and accepts sharp, contrasted detail', () => {
    expect(assessCaptureQuality(frame((x) => 60 + x * 1.5)).quality).toBe('soft');
    expect(assessCaptureQuality(frame((x, y) => (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 220 : 60)).quality).toBe('ready');
  });

  it('detects movement between successive frames without reusing a different frame size', () => {
    const first = assessCaptureQuality(frame((x, y) => (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 220 : 60));
    expect(assessCaptureQuality(frame((x, y) => (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 60 : 220), first.gray).quality).toBe('moving');
    expect(assessCaptureQuality(frame((x, y) => (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 220 : 60), new Uint8Array(10)).quality).toBe('ready');
  });
});
