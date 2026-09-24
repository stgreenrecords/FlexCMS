import type { PageResponse } from '@flexcms/sdk';

const MISSING_DAM_PREFIX = '/dam/tut-usa/missing/';
export const TUT_IMAGE_FALLBACK =
  '/tut-usa/assets/images/57842e3aa2214c12-ab6axudqj78i-hchlovzt8msscx-elxwrzr3xeyr0u98zghv.png';

/** Canonical asset URL prefix served by both API tiers (`AssetUrls` on the backend). */
export const LIVE_ASSET_PREFIX = '/dam/renditions/';
/** Preview-only prefix; `next.config.js` proxies it to the author API. */
export const DRAFT_ASSET_PREFIX = '/draft-dam/renditions/';

export type AssetUrlMode = 'live' | 'preview';

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

/**
 * The author-only streaming URL content used to hold, relative or on any host. The
 * backend already rewrites these in delivery JSON; handling them here as well keeps the
 * site correct against an older API.
 */
const LEGACY_AUTHOR_URL = new RegExp(`(?:https?://[^\\s"'/]+)?/api/author/assets/(${UUID})/content`, 'g');

/** A canonical URL made absolute with some API host; the host is dropped so the site proxy serves it. */
const ABSOLUTE_CANONICAL_URL = new RegExp(`https?://[^\\s"'/]+(/dam/renditions/${UUID}(?:/[a-z0-9-]+)?)`, 'g');

/** A relative canonical URL that is not already part of a longer path (e.g. `/draft-dam/...`). */
const RELATIVE_CANONICAL_URL = new RegExp(`(^|[^\\w/-])/dam/renditions/(?=${UUID})`, 'g');

/**
 * Normalise every asset URL in a page so the browser loads it through the site.
 *
 * - legacy `/api/author/assets/{id}/content` (relative or absolute) → `/dam/renditions/{id}`
 * - absolute `http(s)://host/dam/renditions/...` → relative
 * - in `preview` mode, `/dam/renditions/...` → `/draft-dam/renditions/...`, which the site
 *   proxies to author so unpublished assets show in a draft
 *
 * URLs embedded in strings (rich-text `<img src="...">`) are rewritten too.
 */
export function normalizePageAssetUrls(pageData: PageResponse, mode: AssetUrlMode = 'live'): PageResponse {
  return {
    page: pageData.page,
    components: pageData.components.map((component) => normalizeComponent(component, mode)),
  };
}

function normalizeComponent(
  component: PageResponse['components'][number],
  mode: AssetUrlMode,
): PageResponse['components'][number] {
  return {
    ...component,
    data: normalizeValue(component.data, mode) as Record<string, unknown>,
    children: component.children?.map((child) => normalizeComponent(child, mode)),
  };
}

/** Rewrite the asset URLs inside one string. Exported for unit tests. */
export function normalizeAssetUrlString(value: string, mode: AssetUrlMode = 'live'): string {
  if (value.startsWith(MISSING_DAM_PREFIX)) {
    return TUT_IMAGE_FALLBACK;
  }
  if (!value.includes('/api/author/assets/') && !value.includes(LIVE_ASSET_PREFIX)) {
    return value;
  }
  let out = value
    .replace(LEGACY_AUTHOR_URL, (_match, id: string) => `${LIVE_ASSET_PREFIX}${id}`)
    .replace(ABSOLUTE_CANONICAL_URL, (_match, path: string) => path);
  if (mode === 'preview') {
    out = out.replace(RELATIVE_CANONICAL_URL, (_match, before: string) => `${before}${DRAFT_ASSET_PREFIX}`);
  }
  return out;
}

function normalizeValue(value: unknown, mode: AssetUrlMode): unknown {
  if (typeof value === 'string') {
    return normalizeAssetUrlString(value, mode);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, mode));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested, mode)]),
    );
  }

  return value;
}
