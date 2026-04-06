/**
 * Visual Regression — Dark Theme Baselines
 */
import { test, expect } from '@playwright/test';
import rootChildren from '../../src/fixtures/data/content-children-root.json';
import assetsList from '../../src/fixtures/data/assets-list.json';
import sitesList from '../../src/fixtures/data/sites-list.json';
import componentRegistry from '../../src/fixtures/data/component-registry.json';

const editorPageFixture = {
  id: 'p1',
  path: 'content.tut-usa.en.home',
  name: 'home',
  resourceType: 'flexcms/page',
  status: 'DRAFT',
  modifiedBy: 'admin',
  modifiedAt: '2026-03-28T10:00:00Z',
  properties: { title: 'Home Page' },
  children: [
    {
      id: 'c1',
      path: 'content.tut-usa.en.home.hero-1',
      name: 'hero-1',
      resourceType: 'flexcms/hero',
      status: 'DRAFT',
      properties: { title: 'Drive the Future', ctaLabel: 'Discover Now', variant: 'dark' },
      children: [],
    },
  ],
};

async function mockVisualApis(page: import('@playwright/test').Page) {
  if (process.env['USE_LIVE_API']) return;

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.includes('/api/author/content/list')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: rootChildren, totalElements: rootChildren.length }),
      });
    }
    if (pathname.includes('/api/author/content/children')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rootChildren) });
    }
    if (pathname.includes('/api/author/assets')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(assetsList) });
    }
    if (pathname.includes('/api/admin/sites')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sitesList) });
    }
    if (pathname.includes('/api/author/sites')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sitesList.map((s) => ({ siteId: s.siteId, title: s.title }))),
      });
    }
    if (pathname.includes('/api/content/v1/component-registry')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(componentRegistry) });
    }
    if (pathname.includes('/api/author/content/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(editorPageFixture) });
    }
    if (pathname.includes('/api/author/content/node/properties')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    if (pathname.includes('/api/author/content/node/status')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

async function stabilizeUi(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

test.describe('Visual Regression Dark Theme @visual @regression', () => {
  test.beforeEach(async ({ page }) => {
    await mockVisualApis(page);
  });

  test('dashboard dark baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Workspace Overview')).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('dashboard-dark.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });

  test('content tree dark baseline', async ({ page }) => {
    await page.goto('/content');
    await expect(page.getByRole('heading', { name: /content tree/i })).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('content-tree-dark.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });

  test('page editor dark baseline', async ({ page }) => {
    await page.goto('/editor?path=/tut-usa/en/home');
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('page-editor-dark.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });

  test('dam browser dark baseline', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText('All Assets').first()).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('dam-browser-dark.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });

  test('sites manager dark baseline', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('sites-manager-dark.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });
});
