/**
 * Centralized API route interceptors for all 15 admin API endpoints.
 *
 * Usage:
 *   import { setupAllApiMocks } from '../../src/fixtures/api-mocks';
 *   test.beforeEach(async ({ page }) => { await setupAllApiMocks(page); });
 *
 * All /api/** requests are intercepted with deterministic fixture data
 * unless USE_LIVE_API=true (live integration mode).
 */
import type { Page } from '@playwright/test';
import rootChildren from './data/content-children-root.json';
import tutGbChildren from './data/content-children-tut-gb.json';
import tutGbEnChildren from './data/content-children-tut-gb-en.json';
import assetsList from './data/assets-list.json';
import workflowList from './data/workflow-list.json';
import componentRegistry from './data/component-registry.json';
import sitesList from './data/sites-list.json';
import pimProducts from './data/pim-products.json';
import pimCatalogs from './data/pim-catalogs.json';
import pimSchemas from './data/pim-schemas.json';

/**
 * Register mock routes for all FlexCMS Author API endpoints.
 * Call this in `test.beforeEach` for suites that need full mocking.
 */
export async function setupAllApiMocks(page: Page): Promise<void> {
  if (process.env['USE_LIVE_API']) return;

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;
    const method = route.request().method();

    // ── Content children ─────────────────────────────────────────────────
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

    // ── Content list (dashboard stats) ───────────────────────────────────
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

    // ── Content node (for editor) ────────────────────────────────────────
    if (pathname.includes('/api/author/content/node') && !pathname.includes('/properties') && !pathname.includes('/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tutGbEnChildren[0]),
      });
    }

    // ── Content node properties (save) ───────────────────────────────────
    if (pathname.includes('/api/author/content/node/properties')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }

    // ── Content node status (publish) ────────────────────────────────────
    if (pathname.includes('/api/author/content/node/status')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }

    // ── Component registry ───────────────────────────────────────────────
    if (pathname.includes('/api/content/v1/component-registry')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(componentRegistry) });
    }

    // ── Author sites (simple list) ───────────────────────────────────────
    if (pathname.includes('/api/author/sites')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sitesList.map((s) => ({ siteId: s.siteId, title: s.title }))),
      });
    }

    // ── Admin sites (full site objects) ─────────────────────────────────
    if (pathname.includes('/api/admin/sites')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sitesList) });
    }

    // ── Workflow actions ──────────────────────────────────────────────────
    if (pathname.includes('/api/author/workflow/advance') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }

    // ── Workflows list ───────────────────────────────────────────────────
    if (pathname.includes('/api/author/workflow')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: workflowList, totalElements: workflowList.length }),
      });
    }

    // ── DAM / assets ─────────────────────────────────────────────────────
    if (pathname.includes('/api/author/assets') && method === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(assetsList.items[0]) });
    }
    if (pathname.includes('/api/author/assets')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(assetsList) });
    }

    // ── PIM — products ───────────────────────────────────────────────────
    if (pathname.includes('/api/pim/v1/products') || pathname.match(/\/api\/pim\/v1\/catalogs\/[^/]+\/products/)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pimProducts) });
    }

    // ── PIM — catalogs ───────────────────────────────────────────────────
    if (pathname.includes('/api/pim/v1/catalogs')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pimCatalogs) });
    }

    // ── PIM — schemas ─────────────────────────────────────────────────────
    if (pathname.includes('/api/pim/v1/schemas')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pimSchemas) });
    }

    // ── Catch-all ────────────────────────────────────────────────────────
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

