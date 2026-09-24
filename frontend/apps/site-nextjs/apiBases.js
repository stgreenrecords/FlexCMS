/**
 * Which FlexCMS API each route of the reference site reads from.
 *
 * Shared by `next.config.js` (asset proxy rewrites) and the page routes, so the proxy
 * for a route's asset URLs always points at the same tier as the route's content:
 *
 * - live pages   → `liveApiUrl()`    — the publish tier in a real deployment
 * - draft preview → `previewApiUrl()` — always the author tier, so editors see drafts
 *
 * CommonJS because `next.config.js` loads it with `require`.
 */

const DEFAULT_AUTHOR_API = 'http://localhost:8080';

/** @param {Record<string, string | undefined>} [env] */
function liveApiUrl(env = process.env) {
  return (
    env.NEXT_PUBLIC_FLEXCMS_API_URL ??
    env.NEXT_PUBLIC_FLEXCMS_API ??
    env.FLEXCMS_API_URL ??
    DEFAULT_AUTHOR_API
  );
}

/**
 * Preview reads the author API. `FLEXCMS_PREVIEW_API_URL` exists so a publish-backed
 * instance (live pages on `:8081`) can still point its preview route at author.
 *
 * @param {Record<string, string | undefined>} [env]
 */
function previewApiUrl(env = process.env) {
  return env.FLEXCMS_PREVIEW_API_URL ?? env.FLEXCMS_API_URL ?? DEFAULT_AUTHOR_API;
}

/**
 * API base handed to client components, which fetch from the browser. Empty means
 * "same origin", which is what the default local setup relies on.
 *
 * @param {Record<string, string | undefined>} [env]
 */
function publicApiUrl(env = process.env) {
  return env.NEXT_PUBLIC_FLEXCMS_API_URL ?? env.NEXT_PUBLIC_FLEXCMS_API ?? '';
}

/**
 * Rewrites that make canonical asset URLs resolve on the site's own host.
 *
 * Asset URLs in delivery JSON are relative (`/dam/renditions/{id}`), so the browser asks
 * the site for them. Live pages proxy to the live API; preview pages use
 * `/draft-dam/renditions/...` (set by `normalizePageAssetUrls`), which proxies to author,
 * so a draft shows assets that are not published yet while a live page never does.
 *
 * @param {Record<string, string | undefined>} [env]
 */
function assetRewrites(env = process.env) {
  return [
    { source: '/dam/renditions/:path*', destination: `${stripSlash(liveApiUrl(env))}/dam/renditions/:path*` },
    { source: '/draft-dam/renditions/:path*', destination: `${stripSlash(previewApiUrl(env))}/dam/renditions/:path*` },
  ];
}

/** @param {string} url */
function stripSlash(url) {
  return url.replace(/\/+$/, '');
}

module.exports = { liveApiUrl, previewApiUrl, publicApiUrl, assetRewrites };
