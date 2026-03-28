/**
 * Returns the base URL for FlexCMS API calls.
 *
 * Resolution order:
 * 1. Build-time NEXT_PUBLIC_FLEXCMS_API (set during `next build`)
 * 2. Runtime detection: uses empty string (relative URL) so requests
 *    go to the same origin and Nginx proxies them to the Author backend.
 *
 * Local dev: set NEXT_PUBLIC_FLEXCMS_API=http://localhost:8080 in .env.local
 * Production: Nginx proxies /api/* → author:8080 on the admin domain.
 */
export function getApiBase(): string {
  // Build-time env var (inlined by Next.js at compile time)
  const buildTimeApi = process.env.NEXT_PUBLIC_FLEXCMS_API;
  if (buildTimeApi) return buildTimeApi;

  // In the browser, use relative URLs (same origin → nginx proxy)
  if (typeof window !== 'undefined') return '';

  // Server-side fallback (SSR)
  return process.env.FLEXCMS_API_INTERNAL ?? 'http://localhost:8080';
}

