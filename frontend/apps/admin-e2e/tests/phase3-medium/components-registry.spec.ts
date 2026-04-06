/**
 * Component Registry E2E Tests
 *
 * Tests the Component Registry page (/components) which shows all registered
 * CMS component types from /api/content/v1/component-registry.
 */
import { test, expect } from '@playwright/test';

// Inline fixture data in the exact format the Components page expects.
// The page uses `data.components` and maps via `apiToComponentDef`.
// Groups must be lowercase to match the ComponentGroup enum.
const MOCK_COMPONENTS = [
  { resourceType: 'flexcms/hero',        name: 'hero',        title: 'Hero Banner',    description: 'Full-width hero banner', group: 'layout',   isContainer: false },
  { resourceType: 'flexcms/text-block',  name: 'text-block',  title: 'Text Block',     description: 'Rich text block',        group: 'content',  isContainer: false },
  { resourceType: 'flexcms/card-grid',   name: 'card-grid',   title: 'Card Grid',      description: 'Grid of cards',          group: 'layout',   isContainer: true  },
  { resourceType: 'flexcms/image',       name: 'image',       title: 'Image',          description: 'Responsive image',       group: 'media',    isContainer: false },
  { resourceType: 'flexcms/navigation',  name: 'navigation',  title: 'Navigation',     description: 'Site navigation',        group: 'navigation', isContainer: false },
];
const registryPayload = { components: MOCK_COMPONENTS };

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.includes('/api/content/v1/component-registry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(registryPayload),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Component Registry @regression', () => {

  test('COMP-001: component registry page loads with correct heading', async ({ page }) => {
    await page.goto('/components');
    const heading = page.getByTestId('components-heading');
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expect(heading).toHaveText('Component Registry');
  });

  test('COMP-002: page fetches from /api/content/v1/component-registry', async ({ page }) => {
    const apiCall = page.waitForResponse(
      (r) => r.url().includes('/api/content/v1/component-registry') && r.status() === 200,
    );
    await page.goto('/components');
    await apiCall;
    await expect(page.getByTestId('components-heading')).toBeVisible({ timeout: 10_000 });
  });

  test('COMP-003: components from API are displayed in the table', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByTestId('components-heading')).toBeVisible({ timeout: 10_000 });
    // Wait for the table to have rows (data loaded from mock)
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('COMP-004: search input filters components by name', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByTestId('components-heading')).toBeVisible({ timeout: 10_000 });
    const searchInput = page.getByTestId('components-search');
    await expect(searchInput).toBeVisible();
    // Fill a search query — count display updates
    await searchInput.fill('hero');
    await expect(page.getByText(/Showing/i).first()).toBeVisible();
  });

  test('COMP-005: view toggle switches between Table and Grid modes', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByTestId('components-heading')).toBeVisible({ timeout: 10_000 });
    // Table view is default — wait for rows
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    // Click Grid view toggle button (text "grid", case-insensitive)
    await page.locator('button').filter({ hasText: /^grid$/i }).click();
    // tbody should be gone; grid cards should appear
    await expect(page.locator('tbody')).not.toBeVisible();

    // Switch back to Table view
    await page.locator('button').filter({ hasText: /^table$/i }).click();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5_000 });
  });

  test('COMP-006: table columns include Component, Group, Status, and Type headers', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByTestId('components-heading')).toBeVisible({ timeout: 10_000 });
    // Wait for data to load so we see the real table (not EmptyState)
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
    // Column headers are in thead
    const thead = page.locator('thead');
    await expect(thead.getByText(/component/i)).toBeVisible();
    await expect(thead.getByText(/group/i)).toBeVisible();
    await expect(thead.getByText(/status/i)).toBeVisible();
    await expect(thead.getByText(/type/i)).toBeVisible();
  });

  test('COMP-007: Register Component button is present in the header', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByTestId('components-heading')).toBeVisible({ timeout: 10_000 });
    // Use .first() because EmptyState also has a "Register Component" button
    await expect(page.getByRole('button', { name: /register component/i }).first()).toBeVisible();
  });

  test('COMP-008: stats bento shows Total Components and Active counts', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByTestId('components-heading')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Total Components')).toBeVisible();
    // Use a more specific locator — the bento stat label is a <p> tag
    await expect(page.locator('p').filter({ hasText: /^Active$/ }).first()).toBeVisible();
  });

});

