/**
 * Shape helpers shared by every renderer in this package.
 *
 * These live apart from the renderers deliberately. `tutGroupedRenderers` depends on
 * `richGroupRenderers` for its layouts, so if the layouts imported their helpers back
 * from `tutGroupedRenderers` the two modules would form a cycle — and because the
 * group map calls the layout factory while the module is still evaluating, that cycle
 * throws at import time rather than merely looking untidy.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeLabel(label: string): string {
  return label
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim();
}

export function firstText(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return null;
}

export function toPrimitivePreview(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > 180 ? `${value.slice(0, 180)}...` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (isRecord(value)) {
    return firstText(value, ['label', 'title', 'name', 'text', 'value', 'description', 'url']) ?? 'Not provided';
  }
  return 'Not provided';
}

export function extractImageUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    const candidate = value.trim();
    if (/^(https?:\/\/|\/|data:image\/)/i.test(candidate)) {
      return /^\/dam\/tut-usa\/missing\//i.test(candidate)
        ? '/tut-usa/assets/images/57842e3aa2214c12-ab6axudqj78i-hchlovzt8msscx-elxwrzr3xeyr0u98zghv.png'
        : candidate;
    }
    return null;
  }

  if (isRecord(value)) {
    const candidates = [value.url, value.src, value.path, value.imageUrl, value.thumbnailUrl];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        const normalized = candidate.trim();
        if (/^(https?:\/\/|\/|data:image\/)/i.test(normalized)) {
          return /^\/dam\/tut-usa\/missing\//i.test(normalized)
            ? '/tut-usa/assets/images/57842e3aa2214c12-ab6axudqj78i-hchlovzt8msscx-elxwrzr3xeyr0u98zghv.png'
            : normalized;
        }
      }
    }
  }

  return null;
}

export function isImageField(fieldName: string): boolean {
  if (/(position|layout|variant|style)$/i.test(fieldName)) {
    return false;
  }
  return /(image|photo|thumbnail|poster|logo|icon|background)/i.test(fieldName);
}
