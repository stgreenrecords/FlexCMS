import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import rootChildren from './data/content-children-root.json';
import tutUsaChildren from './data/content-children-tut-usa.json';
import tutUsaEnChildren from './data/content-children-tut-usa-en.json';

/**
 * Registers API route mocks on a Playwright page.
 *
 * Call in your spec file's test.beforeEach:
 *
 *   import { test, expect, setupApiMocks } from '../../src/fixtures/base.fixture';
 *   test.beforeEach(async ({ page }) => { await setupApiMocks(page); });
 *
 * All /api/** requests are intercepted with deterministic fixture data unless
 * USE_LIVE_API=true (live integration runs).
 */
export async function setupApiMocks(page: Page): Promise<void> {
  if (process.env['USE_LIVE_API']) return;

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;

    // ── Content children ─────────────────────────────────────────────
    if (pathname.includes('/api/author/content/children')) {
      const path = searchParams.get('path') ?? 'content';
      let data: unknown[];
      switch (path) {
        case 'content':            data = rootChildren;      break;
        case 'content.tut-usa':    data = tutUsaChildren;   break;
        case 'content.tut-usa.en': data = tutUsaEnChildren; break;
        default:                  data = [];
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    }

    // ── Content list (dashboard stats) ───────────────────────────────
    if (pathname.includes('/api/author/content/list')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: tutUsaEnChildren,
          totalElements: 1005,
          totalPages: 51,
          size: 20,
          number: 0,
        }),
      });
    }

    // ── Author sites ─────────────────────────────────────────────────
    if (pathname.includes('/api/author/sites')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { siteId: 'tut-usa', title: 'TUT United States' },
        ]),
      });
    }

    // ── Admin sites ──────────────────────────────────────────────────
    if (pathname.includes('/api/admin/sites')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { siteId: 'tut-usa', title: 'TUT United States', defaultLocale: 'en', supportedLocales: 'en', active: true },
        ]),
      });
    }

    // ── Workflows ────────────────────────────────────────────────────
    if (pathname.includes('/api/author/workflow')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }

    // ── DAM / assets ─────────────────────────────────────────────────
    if (pathname.includes('/api/author/dam') || pathname.includes('/api/author/assets')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ assets: [], total: 0, page: 0, size: 20 }),
      });
    }

    // ── PIM ──────────────────────────────────────────────────────────
    if (pathname.includes('/api/pim')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], total: 0 }),
      });
    }

    // ── Catch-all ────────────────────────────────────────────────────
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

// Re-export test and expect so specs only need one import
export { test, expect };
