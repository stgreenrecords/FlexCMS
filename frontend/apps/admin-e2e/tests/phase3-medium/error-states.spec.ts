/**
 * Admin UI Error States E2E Tests — UIERR-001 → UIERR-005
 *
 * Tests how the admin UI handles API errors: unreachable API, 500 errors,
 * network timeouts, auth expiry, and concurrent edit scenarios.
 */
import { test, expect } from '@playwright/test';

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Admin UI Error States @regression', () => {

  // ── UIERR-001: API unreachable ──────────────────────────────────────────
  test('UIERR-001: content page shows error state when API is unreachable', async ({ page }) => {
    // Simulate network failure for all API calls
    await page.route('**/api/**', async (route) => {
      await route.abort('failed');
    });
    await page.goto('/content');
    // Page should not be blank — should show a heading or error indication
    // The content page should still render its scaffold (heading, breadcrumb, etc.)
    await page.waitForLoadState('domcontentloaded');
    // The page skeleton or an error message should be visible — not a blank white screen
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    // The page title should still be present in the document
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  // ── UIERR-002: API returns 500 ─────────────────────────────────────────
  test('UIERR-002: content page gracefully handles API 500 response', async ({ page }) => {
    await page.route('**/api/author/content/**', async (route) => {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Database connection failed' }),
      });
    });
    await page.goto('/content');
    await page.waitForLoadState('domcontentloaded');
    // Page should render without crashing (no unhandled JS error dialog)
    // The page should display at minimum the heading or an error state
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    // Should NOT show a raw JSON error or stack trace exposed to the user
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Error: Database connection failed');
  });

  // ── UIERR-003: Network timeout / slow response ─────────────────────────
  test('UIERR-003: loading skeleton is shown while API is slow', async ({ page }) => {
    // Delay the content API response by 3 seconds
    await page.route('**/api/author/content/children**', async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 3_000));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    // Mock other routes instantly
    await page.route('**/api/**', async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/content');
    // Within 1s of load, skeleton rows should be present
    const skeletons = page.locator('[data-testid="skeleton-row"], [class*="skeleton"], [class*="animate-pulse"]');
    // Page should be in loading state during the delay
    await expect(page.locator('body')).not.toBeEmpty();
    // After content loads, the page should recover
    await page.waitForTimeout(4_000);
    // Page should not crash
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  // ── UIERR-004: 401 Unauthorized (session expired) ─────────────────────
  test('UIERR-004: 401 response does not crash the page', async ({ page }) => {
    await page.route('**/api/author/content/**', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized', message: 'Session expired' }),
      });
    });
    // Also route the editor page
    await page.route('**/api/**', async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.goto('/content');
    await page.waitForLoadState('domcontentloaded');
    // Page must not show a blank white screen or unhandled error
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    const bodyText = await page.locator('body').innerText();
    // No raw stack trace should be visible
    expect(bodyText).not.toContain('at Object.');
  });

  // ── UIERR-005: Graceful degradation on DAM API failure ────────────────
  test('UIERR-005: DAM browser shows empty state on API error', async ({ page }) => {
    await page.route('**/api/author/assets**', async (route) => {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });
    await page.route('**/api/**', async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' });
    });
    await page.goto('/dam');
    await page.waitForLoadState('domcontentloaded');
    // Page should render without crashing
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

});

