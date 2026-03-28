/**
 * DAM Browser E2E Tests — UI-038 → UI-051
 *
 * Tests the Digital Asset Management browser: asset grid/list view,
 * search, upload dialog, multi-select, and bulk actions.
 *
 * Self-contained: routes set up inline via test.beforeEach.
 */
import { test, expect } from '@playwright/test';
import assetsList from '../../src/fixtures/data/assets-list.json';

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.includes('/api/author/assets')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(assetsList),
      });
    }
    if (pathname.includes('/api/author/content/list')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      });
    }
    if (pathname.includes('/api/author/sites')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('DAM Browser @smoke @regression', () => {

  test('UI-038: DAM page loads and fetches assets from API', async ({ page }) => {
    const apiCall = page.waitForResponse(
      (r) => r.url().includes('/api/author/assets') && r.status() === 200,
    );
    await page.goto('/dam');
    await apiCall;
    // DAM uses a Breadcrumb (not h1) — check the breadcrumb 'Assets' text is visible
    await expect(page.getByText('All Assets').first()).toBeVisible({ timeout: 10_000 });
  });

  test('UI-039: asset grid renders asset names from API', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('product-launch.mp4')).toBeVisible();
  });

  test('UI-040: search filters asset list', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    const searchInput = page.getByPlaceholder(/search assets/i);
    await searchInput.fill('hero');
    await page.waitForTimeout(300);
    await expect(page.getByText('hero-banner.jpg')).toBeVisible();
    await expect(page.getByText('product-launch.mp4')).not.toBeVisible();
  });

  test('UI-041: view mode can toggle between grid and list', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    // Find the list-view button (aria-pressed state changes)
    const listButton = page.locator('button[aria-pressed]').nth(1);
    await expect(listButton).toBeVisible();
    await listButton.click();
  });

  test('UI-042: upload button opens upload dialog', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    // Find upload button
    const uploadBtn = page.getByRole('button', { name: /upload/i });
    await expect(uploadBtn).toBeVisible();
    await uploadBtn.click();
    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('UI-043: upload dialog contains file drop zone', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /upload/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    // Upload zone should be present in dialog
    await expect(page.locator('[role="dialog"]').locator('input[type="file"]')).toBeAttached();
  });

  test('UI-046: multiple checkboxes selection shows selected count', async ({ page }) => {
    // Switch to list view first
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    // Switch to list view
    const listButton = page.locator('button[aria-pressed]').nth(1);
    await listButton.click();
    // Select first checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    // Selected count should appear
    await expect(page.getByText(/selected/i)).toBeVisible({ timeout: 3_000 });
  });

  test('UI-051: all asset data comes from API, not hardcoded', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) apiCalls.push(req.url());
    });
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    expect(apiCalls.find((u) => u.includes('/api/author/assets'))).toBeTruthy();
  });

  test('UI-038b: folder filter sidebar is visible', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText(/all assets/i)).toBeVisible({ timeout: 10_000 });
    // Folder sidebar shows folder names
    await expect(page.getByText(/images/i).first()).toBeVisible();
  });

  test('UI-038c: asset type badges are displayed', async ({ page }) => {
    await page.goto('/dam');
    await expect(page.getByText('hero-banner.jpg')).toBeVisible({ timeout: 10_000 });
    // Type labels shown in list
    await expect(page.getByText(/image/i).first()).toBeVisible();
  });
});

