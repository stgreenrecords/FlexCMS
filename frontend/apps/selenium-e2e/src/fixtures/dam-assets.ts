/**
 * FlexCMS Selenium E2E — deterministic DAM test binaries (REB-21).
 *
 * The DAM suite uploads real bytes and then asserts the content stream returns
 * exactly those bytes back, so the fixtures must be byte-stable across runs —
 * hence literal base64 rather than anything generated at run time.
 *
 * The PNG is a genuine 1x1 image, not arbitrary bytes with a `.png` name: the
 * rendered-preview checks assert `naturalWidth > 0`, which only a decodable image
 * can satisfy.
 */

/** A valid 1x1 transparent PNG (67 bytes). */
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** A tiny valid PDF, for asserting a non-image asset keeps its own content type. */
const PDF_MINIMAL_BASE64 =
  'JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBl' +
  'L1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBS' +
  'L01lZGlhQm94WzAgMCA5OSA5OV0+PgplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSPj4K';

function decode(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/** Bytes of the 1x1 PNG fixture. */
export function testPngBytes(): Uint8Array {
  return decode(PNG_1X1_BASE64);
}

/** Bytes of the minimal PDF fixture. */
export function testPdfBytes(): Uint8Array {
  return decode(PDF_MINIMAL_BASE64);
}

/** Whether two byte arrays are identical, for content round-trip assertions. */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** First bytes as hex, so a mismatch reports something readable. */
export function bytesPreview(bytes: Uint8Array, count = 8): string {
  return Array.from(bytes.slice(0, count))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}
