/**
 * Service URLs used by the live test levels (api, e2e, ui-live).
 *
 * Defaults match `flex start local all`. Override with environment variables
 * when a service runs elsewhere.
 */
export const env = {
  /** Admin UI (Next.js). */
  adminUrl: process.env['ADMIN_URL'] ?? 'http://localhost:3000',
  /** Author tier — read-write APIs, root URL without a trailing `/api`. */
  authorUrl: process.env['AUTHOR_URL'] ?? 'http://localhost:8080',
  /** Publish tier — read-only delivery APIs. */
  publishUrl: process.env['PUBLISH_URL'] ?? 'http://localhost:8081',
  /** Reference site (site-nextjs) as started by `flex start local all`; reads live pages from author. */
  siteUrl: process.env['SITE_URL'] ?? 'http://localhost:3001',
  /**
   * Reference site instance backed by the publish tier — the only one that shows what a
   * visitor gets. Start it with:
   *   cd frontend/apps/site-nextjs
   *   NEXT_DIST_DIR=.next-publish FLEXCMS_API_URL=http://localhost:8081 \
   *     FLEXCMS_PREVIEW_API_URL=http://localhost:8080 pnpm exec next dev -p 3005
   */
  publishSiteUrl: process.env['PUBLISH_SITE_URL'] ?? 'http://localhost:3005',
  /** True when mocks are off and tests talk to the real stack. */
  liveApi: !!process.env['USE_LIVE_API'],
} as const;
