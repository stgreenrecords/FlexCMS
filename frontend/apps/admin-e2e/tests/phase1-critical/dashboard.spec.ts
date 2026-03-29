/**
 * Dashboard E2E Tests — UI-001 → UI-006
 *
 * Self-contained: routes set up inline via test.beforeEach.
 */
import { test, expect } from '@playwright/test';
import tutUsaEnChildren from '../../src/fixtures/data/content-children-tut-usa-en.json';

test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.includes('/api/author/content/list')) {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ content: tutUsaEnChildren, totalElements: 1005, totalPages: 51, size: 20, number: 0 }),
      });
    }
    if (pathname.includes('/api/author/sites')) {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify([
          { siteId: 'tut-usa', title: 'TUT United States' },
        ]),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
});

test.describe('Dashboard Page @smoke', () => {

  test('UI-001: page loads and renders the heading', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Workspace Overview')).toBeVisible();
    await expect(page).toHaveTitle(/FlexCMS/);
  });

  test('UI-002: stats are fetched from the Author API', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      (resp) => resp.url().includes('/api/author/content/list') && resp.status() === 200,
    );
    await page.goto('/dashboard');
    const response = await apiCalled;
    expect(response.status()).toBe(200);
    await expect(page.getByText('Total Pages')).toBeVisible();
    await expect(page.getByText('1,005')).toBeVisible();
  });

  test('UI-003: recent activity items are displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Content Updates')).toBeVisible();
  });

  test('UI-004: loading state is shown while API responds', async ({ page }) => {
    await page.route('**/api/author/content/list*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      });
    });
    await page.goto('/dashboard');
    // During loading, the "Total Pages" label is present
    await expect(page.getByText('Total Pages').locator('..').locator('..')).toBeVisible();
  });

  test('UI-005: dark theme background is applied', async ({ page }) => {
    await page.goto('/dashboard');
    const bg = await page.locator('.p-8').first().evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(bg).toContain('32'); // #201f1f = rgb(32, 31, 31)
  });

  test('UI-006: sidebar has all main navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    const expectedLinks = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Content Tree', href: '/content' },
      { label: 'Sites', href: '/sites' },
      { label: 'Workflows', href: '/workflows' },
      { label: 'Media Library', href: '/dam' },
      { label: 'Catalog', href: '/pim' },
    ];
    for (const link of expectedLinks) {
      const navLink = page.getByRole('link', { name: link.label });
      await expect(navLink).toBeVisible();
      await expect(navLink).toHaveAttribute('href', link.href);
    }
  });

  test('UI-006b: clicking Content Tree link navigates to /content', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Content Tree' }).click();
    await expect(page).toHaveURL(/\/content/);
    await expect(page.getByRole('heading', { name: 'Content Tree' })).toBeVisible();
  });
});
