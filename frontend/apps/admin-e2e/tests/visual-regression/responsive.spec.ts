/**
 * Visual Regression — Responsive Baselines
 */
import { test, expect } from '@playwright/test';
import sitesList from '../../src/fixtures/data/sites-list.json';
import rootChildren from '../../src/fixtures/data/content-children-root.json';

async function mockApis(page: import('@playwright/test').Page) {
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

test.describe('Visual Regression Responsive @visual @regression', () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
  });

  test('dashboard tablet baseline (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await expect(page.getByText('Workspace Overview')).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('dashboard-tablet.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });

  test('dashboard mobile baseline (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page.getByText('Workspace Overview')).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('dashboard-mobile.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });

  test('content tree tablet baseline (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/content');
    await expect(page.getByRole('heading', { name: /content tree/i })).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('content-tree-tablet.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });

  test('sites manager mobile baseline (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    await stabilizeUi(page);
    await expect(page).toHaveScreenshot('sites-mobile.png', { fullPage: true, maxDiffPixelRatio: 0.01 });
  });
});

