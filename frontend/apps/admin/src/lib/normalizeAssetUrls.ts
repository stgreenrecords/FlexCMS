const AUTHOR_ASSET_PREFIX = '/api/author/assets/';

export function normalizeAssetUrl(value: string, apiBase: string): string {
  if (!value.startsWith(AUTHOR_ASSET_PREFIX)) {
    return value;
  }

  const normalizedBase = apiBase.replace(/\/$/, '');
  return `${normalizedBase}${value}`;
}

