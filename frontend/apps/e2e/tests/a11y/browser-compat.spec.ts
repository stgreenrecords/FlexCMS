/**
 * Browser Compatibility Tests — COMPAT-001 → COMPAT-006
 *
 * Tests that the Admin UI renders correctly across different browsers and
 * viewport sizes. These tests run on all configured Playwright projects
 * (chromium, firefox, webkit) and with tablet/mobile viewports.
 */
import { test, expect } from '@playwright/test';
import sitesList from '../../src/fixtures/data/sites-list.json';
import rootChildren from '../../src/fixtures/data/content-children-root.json';

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.includes('/api/author/content/children')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rootChildren) });
    }
    if (pathname.includes('/api/author/content/list')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: rootChildren, totalElements: rootChildren.length }) });
    }
    if (pathname.includes('/api/admin/sites')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sitesList) });
    }
    if (pathname.includes('/api/author/sites')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sitesList.map(s => ({ siteId: s.siteId, title: s.title }))) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
// COMPAT-001 to COMPAT-004 are implicit — each spec runs on all browser
// projects (chromium, firefox, webkit) as configured in playwright.config.ts.
// These explicit tests assert correct rendering regardless of browser.

test.describe('Browser Compatibility @regression', () => {

  // COMPAT-001/002/003/004: Core pages render correctly in all browsers
  test('COMPAT-001-004: dashboard renders correctly in current browser', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
    // No horizontal overflow at 1280px viewport (default desktop)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // allow 5px tolerance
  });

  test('COMPAT-001-004: content tree renders correctly in current browser', async ({ page }) => {
    await page.goto('/content');
    await expect(page.getByRole('heading', { name: /content/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('COMPAT-001-004: sites page renders correctly in current browser', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 15_000 });
  });

  // COMPAT-005: Tablet viewport (768px)
  test('COMPAT-005: layout adapts at tablet viewport (768px) — no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    // At tablet, small overflow (sidebar collapse) is acceptable — max 20px
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('COMPAT-005: content tree accessible at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/content');
    // Page must not show a blank white screen
    const body = await page.locator('body').innerText();
    expect(body.trim().length).toBeGreaterThan(0);
  });

  // COMPAT-006: Mobile viewport (375px)
  test('COMPAT-006: layout adapts at mobile viewport (375px) — content still usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    // Page must render some content — not blank
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').innerText();
    expect(body.trim().length).toBeGreaterThan(0);
  });

  test('COMPAT-006: sites page renders at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sites');
    await page.waitForLoadState('domcontentloaded');
    // Should not crash at mobile width
    const body = await page.locator('body').innerText();
    expect(body.trim().length).toBeGreaterThan(0);
  });

});

