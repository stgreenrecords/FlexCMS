/**
 * Translations Manager E2E Tests
 *
 * Tests the Translations / Language Matrix page (/translations).
 */
import { test, expect } from '@playwright/test';

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  // The Translations page is mostly client-side with static mock data in the component.
  // No backend API calls are made in the current implementation.
  // Allow all requests through.
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Translation Manager @regression', () => {

  test('TRANS-001: translations page loads with Language Matrix heading', async ({ page }) => {
    await page.goto('/translations');
    const heading = page.getByTestId('translations-heading');
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expect(heading).toHaveText('Language Matrix');
  });

  test('TRANS-002: breadcrumb shows correct navigation path', async ({ page }) => {
    await page.goto('/translations');
    await expect(page.getByTestId('translations-heading')).toBeVisible({ timeout: 10_000 });
    // Breadcrumb should contain Dashboard → Sites → Translation Manager
    await expect(page.getByRole('navigation', { name: /breadcrumb/i }).or(
      page.locator('nav').filter({ hasText: /dashboard/i })
    ).first()).toBeVisible();
  });

  test('TRANS-003: search input is present and accepts input', async ({ page }) => {
    await page.goto('/translations');
    await expect(page.getByTestId('translations-heading')).toBeVisible({ timeout: 10_000 });
    const searchInput = page.getByTestId('translations-search');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('nav');
    await expect(searchInput).toHaveValue('nav');
  });

  test('TRANS-004: Import Translations button is present', async ({ page }) => {
    await page.goto('/translations');
    await expect(page.getByTestId('translations-heading')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /import translations/i }).first()).toBeVisible();
  });

  test('TRANS-005: Export XLIFF button is present', async ({ page }) => {
    await page.goto('/translations');
    await expect(page.getByTestId('translations-heading')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /export xliff/i })).toBeVisible();
  });

  test('TRANS-006: status filter chips are rendered (All, Translated, Outdated, Missing)', async ({ page }) => {
    await page.goto('/translations');
    await expect(page.getByTestId('translations-heading')).toBeVisible({ timeout: 10_000 });
    // Filter chips rendered inline
    await expect(page.getByRole('button', { name: /^All$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Translated$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Outdated$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Missing$/i })).toBeVisible();
  });

  test('TRANS-007: translation health panel is visible in the corner', async ({ page }) => {
    await page.goto('/translations');
    await expect(page.getByTestId('translations-heading')).toBeVisible({ timeout: 10_000 });
    // Health panel has "Translation Health" title
    await expect(page.getByText('Translation Health')).toBeVisible();
    await expect(page.getByText('Completion')).toBeVisible();
  });

});

