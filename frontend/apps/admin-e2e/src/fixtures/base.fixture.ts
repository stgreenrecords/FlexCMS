import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import rootChildren from './data/content-children-root.json';
import tutGbChildren from './data/content-children-tut-gb.json';
import tutGbEnChildren from './data/content-children-tut-gb-en.json';

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
        case 'content':           data = rootChildren;      break;
        case 'content.tut-gb':    data = tutGbChildren;     break;
        case 'content.tut-gb.en': data = tutGbEnChildren;   break;
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
          content: tutGbEnChildren,
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
          { siteId: 'tut-gb', title: 'TUT Motors UK' },
          { siteId: 'tut-de', title: 'TUT Motors DE' },
          { siteId: 'tut-fr', title: 'TUT Motors FR' },
          { siteId: 'tut-ca', title: 'TUT Motors CA' },
        ]),
      });
    }

    // ── Admin sites ──────────────────────────────────────────────────
    if (pathname.includes('/api/admin/sites')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { siteId: 'tut-gb', title: 'TUT Motors UK', defaultLocale: 'en', supportedLocales: 'en',    active: true },
          { siteId: 'tut-de', title: 'TUT Motors DE', defaultLocale: 'de', supportedLocales: 'de',    active: true },
          { siteId: 'tut-fr', title: 'TUT Motors FR', defaultLocale: 'fr', supportedLocales: 'fr',    active: true },
          { siteId: 'tut-ca', title: 'TUT Motors CA', defaultLocale: 'en', supportedLocales: 'en,fr', active: true },
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
