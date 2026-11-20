// Lightweight, on-device hints. These estimates never prevent using a photo.
export function assessCaptureQuality({ data, width, height }, previousGray = null) {
  const gray = new Uint8Array(width * height);
  let sum = 0;
  let squares = 0;
  let clipped = 0;
  let motion = 0;
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    const value = Math.round(data[offset] * .299 + data[offset + 1] * .587 + data[offset + 2] * .114);
    gray[index] = value;
    sum += value;
    squares += value * value;
    if (value > 248) clipped += 1;
    if (previousGray?.length === gray.length) motion += Math.abs(value - previousGray[index]);
  }
  const brightness = sum / gray.length;
  const contrast = Math.sqrt(Math.max(0, squares / gray.length - brightness ** 2));
  let edgeSum = 0;
  let edgeSquares = 0;
  let samples = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const edge = 4 * gray[index] - gray[index - 1] - gray[index + 1] - gray[index - width] - gray[index + width];
      edgeSum += edge;
      edgeSquares += edge * edge;
      samples += 1;
    }
  }
  const sharpness = samples ? Math.max(0, edgeSquares / samples - (edgeSum / samples) ** 2) : 0;
  const movement = motion / gray.length;
  let quality = 'ready';
  if (brightness < 55) quality = 'dark';
  else if (clipped / gray.length > .85 && contrast < 15) quality = 'glare';
  else if (movement > 14) quality = 'moving';
  else if (contrast < 10) quality = 'detail';
  else if (sharpness < 65) quality = 'soft';
  return { quality, gray, metrics: { brightness, contrast, sharpness, movement } };
}
