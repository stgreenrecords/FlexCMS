/**
 * Experience Fragments E2E Tests
 *
 * Tests the Experience Fragments management page (/experience-fragments).
 */
import { test, expect } from '@playwright/test';

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.includes('/api/author/xf/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'xf-1', name: 'Global Navigation', path: 'content.corporate.en.xf.global-nav',   modifiedAt: '2026-03-01T10:00:00Z', createdBy: 'admin' },
          { id: 'xf-2', name: 'Footer Legal',      path: 'content.corporate.en.xf.footer-legal', modifiedAt: '2026-03-02T10:00:00Z', createdBy: 'admin' },
          { id: 'xf-3', name: 'Cookie Banner',     path: 'content.corporate.en.xf.cookie-banner', modifiedAt: '2026-03-03T10:00:00Z', createdBy: 'editor' },
        ]),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Experience Fragments @regression', () => {

  test('XF-PAGE-001: experience fragments page loads with correct heading', async ({ page }) => {
    await page.goto('/experience-fragments');
    const heading = page.getByTestId('xf-heading');
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expect(heading).toHaveText('Experience Fragments');
  });

  test('XF-PAGE-002: page calls the XF list API on load', async ({ page }) => {
    const apiCall = page.waitForResponse(
      (r) => r.url().includes('/api/author/xf/') && r.status() === 200,
    );
    await page.goto('/experience-fragments');
    await apiCall;
    await expect(page.getByTestId('xf-heading')).toBeVisible({ timeout: 10_000 });
  });

  test('XF-PAGE-003: XF items from API are displayed in the table', async ({ page }) => {
    await page.goto('/experience-fragments');
    await expect(page.getByTestId('xf-heading')).toBeVisible({ timeout: 10_000 });
    const table = page.getByTestId('xf-table');
    await expect(table).toBeVisible();
    // Fixture returns 3 XF items — verify names are present
    await expect(page.getByText('Global Navigation')).toBeVisible();
    await expect(page.getByText('Footer Legal')).toBeVisible();
    await expect(page.getByText('Cookie Banner')).toBeVisible();
  });

  test('XF-PAGE-004: search input is present and filters the list', async ({ page }) => {
    await page.goto('/experience-fragments');
    await expect(page.getByTestId('xf-heading')).toBeVisible({ timeout: 10_000 });
    const searchInput = page.getByTestId('xf-search');
    await expect(searchInput).toBeVisible();
    // Type to filter
    await searchInput.fill('Footer');
    // Footer Legal should remain; Cookie Banner should disappear
    await expect(page.getByText('Footer Legal')).toBeVisible();
    await expect(page.getByText('Cookie Banner')).not.toBeVisible();
    // Clear and confirm all items return
    await searchInput.fill('');
    await expect(page.getByText('Cookie Banner')).toBeVisible();
  });

  test('XF-PAGE-005: Create Fragment button is visible', async ({ page }) => {
    await page.goto('/experience-fragments');
    await expect(page.getByTestId('xf-heading')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('xf-create-btn')).toBeVisible();
  });

  test('XF-PAGE-006: table columns include Name, Status, and Path', async ({ page }) => {
    await page.goto('/experience-fragments');
    await expect(page.getByTestId('xf-heading')).toBeVisible({ timeout: 10_000 });
    const table = page.getByTestId('xf-table');
    await expect(table.getByText('Name')).toBeVisible();
    await expect(table.getByText('Status')).toBeVisible();
    await expect(table.getByText('Path')).toBeVisible();
  });

});

