import { test as base, Page } from '@playwright/test';
import rootChildren from './data/content-children-root.json';
import tutGbChildren from './data/content-children-tut-gb.json';
import tutGbEnChildren from './data/content-children-tut-gb-en.json';

/**
 * Extended Playwright test with automatic API mocking.
 *
 * Usage in spec files:
 *   import { test, expect } from '../src/fixtures/base.fixture';
 *
 * In mock mode (default): All /api/* calls are intercepted with fixture data.
 * In live mode (USE_LIVE_API=true): No mocking, real API calls go through.
 */
export const test = base.extend<{ mockPage: Page }>({
  mockPage: async ({ page }, use) => {
    if (process.env.USE_LIVE_API) {
      await use(page);
      return;
    }

    // ------ Content children API ------
    await page.route('**/api/author/content/children*', async (route) => {
      const url = new URL(route.request().url());
      const path = url.searchParams.get('path') ?? 'content';

      let data: unknown[];
      switch (path) {
        case 'content':
          data = rootChildren;
          break;
        case 'content.tut-gb':
          data = tutGbChildren;
          break;
        case 'content.tut-gb.en':
          data = tutGbEnChildren;
          break;
        default:
          data = []; // Empty folder
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });

    // ------ Content list (for dashboard stats) ------
    await page.route('**/api/author/content/list*', async (route) => {
      await route.fulfill({
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
    });

    // ------ Sites API ------
    await page.route('**/api/author/sites', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { siteId: 'tut-gb', title: 'TUT Motors UK' },
          { siteId: 'tut-de', title: 'TUT Motors DE' },
          { siteId: 'tut-fr', title: 'TUT Motors FR' },
          { siteId: 'tut-ca', title: 'TUT Motors CA' },
        ]),
      });
    });

    // ------ Admin Sites API ------
    await page.route('**/api/admin/sites', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { siteId: 'tut-gb', title: 'TUT Motors UK', defaultLocale: 'en', supportedLocales: 'en', active: true },
          { siteId: 'tut-de', title: 'TUT Motors DE', defaultLocale: 'de', supportedLocales: 'de', active: true },
          { siteId: 'tut-fr', title: 'TUT Motors FR', defaultLocale: 'fr', supportedLocales: 'fr', active: true },
          { siteId: 'tut-ca', title: 'TUT Motors CA', defaultLocale: 'en', supportedLocales: 'en,fr', active: true },
        ]),
      });
    });

    // ------ Catch-all: return empty for any unhandled API call ------
    await page.route('**/api/**', async (route) => {
      // Let routes already handled above pass through;
      // this catches anything else (workflow, pim, etc.)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';

