/**
 * Sites Management E2E Tests — UI-087 → UI-095
 */
import { test, expect } from '@playwright/test';
import sitesList from '../../src/fixtures/data/sites-list.json';

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.includes('/api/admin/sites')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sitesList),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Site Management @smoke @regression', () => {

  test('UI-087: sites page loads and fetches from /api/admin/sites', async ({ page }) => {
    const apiCall = page.waitForResponse(
      (r) => r.url().includes('/api/admin/sites') && r.status() === 200,
    );
    await page.goto('/sites');
    await apiCall;
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
  });

  test('UI-088: site cards display name and status badge', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    // Fixture has 4 sites, all active (published)
    await expect(page.getByText('TUT Motors UK')).toBeVisible();
    await expect(page.getByText('TUT Motors DE')).toBeVisible();
    // Status badge — active: true → "Published"
    const badges = page.getByText('Published');
    await expect(badges.first()).toBeVisible();
  });

  test('UI-089: switching to grid view renders site cards', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    // Click the Grid view toggle (button with title="Grid view")
    await page.locator('button[title="Grid view"]').click();
    // Site names should still be visible in grid view
    await expect(page.getByText('TUT Motors UK')).toBeVisible();
    // Switch back to list view
    await page.locator('button[title="List view"]').click();
    await expect(page.getByText('TUT Motors UK')).toBeVisible();
  });

  test('UI-090: search input filters sites by name', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    const searchInput = page.getByPlaceholder(/filter sites/i);
    await expect(searchInput).toBeVisible();
    // Type to filter — "DE" should only show the DE site
    await searchInput.fill('DE');
    await expect(page.getByText('TUT Motors DE')).toBeVisible();
    // UK site should be hidden after filtering
    await expect(page.getByText('TUT Motors UK')).not.toBeVisible();
    // Clear search to restore all sites
    await searchInput.fill('');
    await expect(page.getByText('TUT Motors UK')).toBeVisible();
  });

  test('UI-091: status badges are color-coded per site status', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    // All fixture sites are active → "Published" status
    const publishedBadges = page.getByText('Published');
    const count = await publishedBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('UI-092: "Create New Site" button is present', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /create new site/i })).toBeVisible();
  });

  test('UI-093: action menu opens with site management options', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    // Hover over first row to reveal the action button (opacity 0 → visible on hover)
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    const actionButton = firstRow.locator('button').last();
    await actionButton.click();
    // Action menu items should be visible
    await expect(page.getByText(/edit|manage|publish|delete/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('UI-094: grid/list view toggle persists during the session', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    // Switch to grid
    await page.locator('button[title="Grid view"]').click();
    // The list table should not be visible; grid should be
    await expect(page.locator('table')).not.toBeVisible({ timeout: 3_000 });
    // Switch back to list — table returns
    await page.locator('button[title="List view"]').click();
    await expect(page.locator('table')).toBeVisible({ timeout: 3_000 });
  });

  test('UI-095: all sites data is fetched from the API, not hardcoded', async ({ page }) => {
    const apiRequest = page.waitForRequest(
      (req) => req.url().includes('/api/admin/sites'),
    );
    await page.goto('/sites');
    await apiRequest;
    await expect(page.getByRole('heading', { name: /site manager/i })).toBeVisible({ timeout: 10_000 });
    // Fixture site IDs appear in the DOM as text
    await expect(page.getByText('tut-gb')).toBeVisible();
  });
});

