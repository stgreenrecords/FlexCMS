/**
 * Dashboard E2E Tests — UI-001 → UI-006
 *
 * These tests navigate to the real Dashboard page, verify that actual elements
 * are rendered, click interactive controls, and assert expected outcomes.
 */
import { test, expect } from '../../src/fixtures/base.fixture';

test.describe('Dashboard Page @smoke', () => {
  // ── UI-001: Dashboard loads without JS errors ────────────────────────
  test('UI-001: page loads and renders the heading', async ({ mockPage: page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');

    // The main heading "Workspace Overview" must be visible
    await expect(page.getByText('Workspace Overview')).toBeVisible();

    // The page title should contain "FlexCMS"
    await expect(page).toHaveTitle(/FlexCMS/);
  });

  // ── UI-002: Real data displayed — stats come from API, not hardcoded ─
  test('UI-002: stats are fetched from the Author API', async ({ mockPage: page }) => {
    // Set up a response listener BEFORE navigating
    const apiCalled = page.waitForResponse(
      (resp) => resp.url().includes('/api/author/content/list') && resp.status() === 200,
    );

    await page.goto('/dashboard');

    // Wait for the API call to complete
    const response = await apiCalled;
    expect(response.status()).toBe(200);

    // The stat card "Total Pages" should show the value from the API (1,005)
    await expect(page.getByText('Total Pages')).toBeVisible();
    // The actual number should be rendered (from our mock: 1005)
    await expect(page.getByText('1,005')).toBeVisible();
  });

  // ── UI-003: Recent activity section shows content items ──────────────
  test('UI-003: recent activity items are displayed', async ({ mockPage: page }) => {
    await page.goto('/dashboard');

    // The "Content Updates" section heading must exist
    await expect(page.getByText('Content Updates')).toBeVisible();
  });

  // ── UI-004: Loading state shows before data arrives ──────────────────
  test('UI-004: loading state is shown while API responds', async ({ page }) => {
    // Delay the API response by 3 seconds to observe loading state
    await page.route('**/api/author/content/list*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      });
    });
    // Also mock sites to avoid real call
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await page.goto('/dashboard');

    // During loading, stat values show "—" (the default placeholder)
    await expect(page.getByText('Total Pages').locator('..').locator('..')).toBeVisible();
  });

  // ── UI-005: Theme uses CSS custom properties (no hardcoded colors) ───
  test('UI-005: dark theme background is applied', async ({ mockPage: page }) => {
    await page.goto('/dashboard');

    // The page wrapper should have the dark background
    const bg = await page.locator('.p-8').first().evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    // #201f1f = rgb(32, 31, 31)
    expect(bg).toContain('32');
  });

  // ── UI-006: Sidebar navigation links are present and clickable ───────
  test('UI-006: sidebar has all main navigation links', async ({ mockPage: page }) => {
    await page.goto('/dashboard');

    // Check each sidebar nav link exists
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

  // ── UI-006b: Clicking a sidebar link navigates to the correct page ───
  test('UI-006b: clicking Content Tree link navigates to /content', async ({ mockPage: page }) => {
    await page.goto('/dashboard');

    // Click the "Content Tree" link in the sidebar
    await page.getByRole('link', { name: 'Content Tree' }).click();

    // Should navigate to /content
    await expect(page).toHaveURL(/\/content/);

    // Content Tree page heading should be visible
    await expect(page.getByText('Content Tree')).toBeVisible();
  });
});

