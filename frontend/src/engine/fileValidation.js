const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 10000;
const MAX_IMAGE_PIXELS = 40000000;

const SIGNATURES = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

export async function validateImageFile(file) {
  if (!file || file.size === 0) throw new Error('file_empty');
  if (file.size > MAX_FILE_SIZE) throw new Error('file_too_large');

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const signature = SIGNATURES.find(({ bytes, offset = 0 }) =>
    bytes.every((byte, index) => header[offset + index] === byte),
  );
  const isWebp =
    signature?.mime === 'image/webp' &&
    String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  const mime = isWebp ? 'image/webp' : signature?.mime;

  if (!mime || !['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
    throw new Error('file_unsupported');
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  bitmap.close();
  if (
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new Error('image_dimensions');
  }

  return { file, mime, width, height };
}
