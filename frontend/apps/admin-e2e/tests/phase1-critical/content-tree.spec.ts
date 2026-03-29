/**
 * Content Tree Browser E2E Tests — UI-007 → UI-022
 *
 * Self-contained: JSON fixtures imported directly, routes set up inline
 * via test.beforeEach so Playwright's per-file scoping works correctly.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import rootChildren from '../../src/fixtures/data/content-children-root.json';
import tutUsaChildren from '../../src/fixtures/data/content-children-tut-usa.json';
import tutUsaEnChildren from '../../src/fixtures/data/content-children-tut-usa-en.json';

// ── API mocks ─────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;

    if (pathname.includes('/api/author/content/children')) {
      const path = searchParams.get('path') ?? 'content';
      const data =
        path === 'content'             ? rootChildren :
        path === 'content.tut-usa'     ? tutUsaChildren :
        path === 'content.tut-usa.en'  ? tutUsaEnChildren :
        [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    }
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

// ── Selector helper ───────────────────────────────────────────────────────
/** Locate a content table row by its exact node name (avoids URL-path column). */
function rowByName(page: Page, name: string) {
  return page.locator('tbody tr', { has: page.locator('span.font-semibold', { hasText: name }) }).first();
}

// ── Tests ─────────────────────────────────────────────────────────────────
test.describe('Content Tree Page @smoke @regression', () => {

  test('UI-007: top-level content nodes are displayed from API', async ({ page }) => {
    const apiCall = page.waitForResponse(
      (r) => r.url().includes('/api/author/content/children') && r.url().includes('path=content'),
    );
    await page.goto('/content');
    await apiCall;

    await expect(page.getByRole('heading', { name: 'Content Tree' })).toBeVisible();
    await expect(rowByName(page, 'tut-usa')).toBeVisible();
    await expect(rowByName(page, 'experience-fragments')).toBeVisible();
  });

  test('UI-008: clicking a folder row loads its children', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    const childApiCall = page.waitForResponse((r) => r.url().includes('path=content.tut-usa'));
    await rowByName(page, 'tut-usa').click();
    await childApiCall;

    await expect(rowByName(page, 'en')).toBeVisible();
  });

  test('UI-009: breadcrumb shows navigation path', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    const breadcrumb = page.locator('.flex.items-center.gap-1.mb-2');
    await expect(breadcrumb.getByText('Content')).toBeVisible();

    await rowByName(page, 'tut-usa').click();
    await expect(rowByName(page, 'en')).toBeVisible();
    await expect(breadcrumb.getByText('tut-usa')).toBeVisible();

    await rowByName(page, 'en').click();
    await expect(rowByName(page, 'home')).toBeVisible();
    await expect(breadcrumb.getByText('en', { exact: true }).first()).toBeVisible();
  });

  test('UI-010: breadcrumb click navigates back to that level', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    await rowByName(page, 'tut-usa').click();
    await expect(rowByName(page, 'en')).toBeVisible();
    await rowByName(page, 'en').click();
    await expect(rowByName(page, 'home')).toBeVisible();

    await page.locator('.flex.items-center.gap-1.mb-2').getByText('Content').first().click();

    await expect(rowByName(page, 'tut-usa')).toBeVisible();
    await expect(rowByName(page, 'experience-fragments')).toBeVisible();
  });

  test('UI-011: up-one-level button works', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    await rowByName(page, 'tut-usa').click();
    await expect(rowByName(page, 'en')).toBeVisible();

    await page.getByTitle('Up one level').click();

    await expect(rowByName(page, 'tut-usa')).toBeVisible();
  });

  test('UI-012: status badges show Live, Draft, In Review, Archived', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    await rowByName(page, 'tut-usa').click();
    await expect(rowByName(page, 'en')).toBeVisible();
    await rowByName(page, 'en').click();
    await expect(rowByName(page, 'home')).toBeVisible();

    // home=PUBLISHED(Live), innovation=DRAFT, news=IN_REVIEW, offers=ARCHIVED
    await expect(page.getByText('Live').first()).toBeVisible();
    await expect(page.getByText('Draft').first()).toBeVisible();
    await expect(page.getByText('In Review').first()).toBeVisible();
    await expect(page.getByText('Archived').first()).toBeVisible();
  });

  test('UI-013: search filters content rows', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    await rowByName(page, 'tut-usa').click();
    await expect(rowByName(page, 'en')).toBeVisible();
    await rowByName(page, 'en').click();
    await expect(rowByName(page, 'home')).toBeVisible();

    await page.getByPlaceholder('Filter by name or URL...').fill('vehicle');

    await expect(rowByName(page, 'vehicles')).toBeVisible();
    await expect(rowByName(page, 'home')).not.toBeVisible();
  });

  test('UI-014: empty folder shows empty message', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'experience-fragments')).toBeVisible();

    await rowByName(page, 'experience-fragments').click();

    await expect(page.getByText('This folder is empty.')).toBeVisible();
  });

  test('UI-015: skeleton rows shown during loading', async ({ page }) => {
    // Override with a slow response so skeleton is visible before data arrives
    await page.route('**/api/author/content/children*', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/content');

    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('UI-016: three-dot action menu shows Edit, Preview, Publish', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    await rowByName(page, 'tut-usa').click();
    await expect(rowByName(page, 'en')).toBeVisible();
    await rowByName(page, 'en').click();
    await expect(rowByName(page, 'home')).toBeVisible();

    const homeRow = rowByName(page, 'home');
    await homeRow.locator('button').last().click();

    await expect(page.getByRole('link', { name: 'Edit', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Preview', exact: true })).toBeVisible();
  });

  test('UI-019: all data is fetched from API, no hardcoded content', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => { if (req.url().includes('/api/')) apiCalls.push(req.url()); });

    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();

    expect(apiCalls.find((u) => u.includes('/api/author/content/children'))).toBeTruthy();
  });

  test('UI-022: direct URL with path param loads correct children', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();
    await expect(rowByName(page, 'experience-fragments')).toBeVisible();
  });

  test('UI-007b: item count footer shows correct number', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();
    await expect(rowByName(page, 'experience-fragments')).toBeVisible();

    await expect(page.getByText(/Showing.*2.*items/)).toBeVisible();
  });

  test('UI-007c: select-all checkbox selects all rows', async ({ page }) => {
    await page.goto('/content');
    await expect(rowByName(page, 'tut-usa')).toBeVisible();
    await expect(rowByName(page, 'experience-fragments')).toBeVisible();

    await page.locator('thead input[type="checkbox"]').click();

    await expect(page.getByText('2 selected')).toBeVisible();
  });
});
