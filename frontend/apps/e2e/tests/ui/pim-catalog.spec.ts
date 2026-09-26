/**
 * PIM Product Grid (Catalog Detail) E2E Tests — UI-052 → UI-055
 *
 * URL: /pim/{catalogId}  — catalog detail page showing the product grid.
 */
import { test, expect } from '@playwright/test';
import pimProducts from '../../src/fixtures/data/pim-products.json';
import pimCatalogs from '../../src/fixtures/data/pim-catalogs.json';

const CATALOG_ID = 'tut-vehicles';
const CATALOG = pimCatalogs[0]; // { id: 'tut-vehicles', name: 'TUT Vehicles', ... }

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    // Catalog detail (single object) — must be checked before the list route
    if (pathname.includes(`/api/pim/v1/catalogs/${CATALOG_ID}`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CATALOG),
      });
    }
    // Catalog list
    if (pathname.includes('/api/pim/v1/catalogs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pimCatalogs),
      });
    }
    // Products for this catalog
    if (pathname.includes('/api/pim/v1/products')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pimProducts),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('PIM Product Grid @smoke @regression', () => {

  test('UI-052: product grid loads and fetches from /api/pim/v1/products @smoke', async ({ page }) => {
    const productsApiCall = page.waitForResponse(
      (r) => r.url().includes('/api/pim/v1/products') && r.status() === 200,
    );
    await page.goto(`/pim/${CATALOG_ID}`);
    await productsApiCall;
    // Product table should render
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
  });

  test('UI-053: product rows display SKU and product name', async ({ page }) => {
    await page.goto(`/pim/${CATALOG_ID}`);
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    // SKU from fixture prod-001
    await expect(page.getByText('TUT-SUV-2026')).toBeVisible();
    // Product name from fixture
    await expect(page.getByText('TUT Ranger SUV 2026')).toBeVisible();
    // Second product
    await expect(page.getByText('TUT-EV-2026')).toBeVisible();
    await expect(page.getByText('TUT Spark EV 2026')).toBeVisible();
    // Sync status column is rendered (all 'Draft' since status is PUBLISHED → not 'active')
    const syncStatusCells = page.getByText('Draft');
    await expect(syncStatusCells.first()).toBeVisible();
  });

  test('UI-054: search input filters products by name or SKU', async ({ page }) => {
    await page.goto(`/pim/${CATALOG_ID}`);
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    // Find the search input (placeholder: "Filter products…" or similar)
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    // Search for "SUV" — only TUT Ranger SUV should remain
    await searchInput.fill('SUV');
    await expect(page.getByText('TUT Ranger SUV 2026')).toBeVisible();
    // The EV product should not be visible
    await expect(page.getByText('TUT Spark EV 2026')).not.toBeVisible();
    // Clear search to restore all products
    await searchInput.fill('');
    await expect(page.getByText('TUT Spark EV 2026')).toBeVisible();
  });

  test('UI-055: all product data is fetched from the PIM API (no mock constants)', async ({ page }) => {
    const productsRequest = page.waitForRequest(
      (req) => req.url().includes('/api/pim/v1/products'),
    );
    const catalogRequest = page.waitForRequest(
      (req) => req.url().includes(`/api/pim/v1/catalogs/${CATALOG_ID}`),
    );
    await page.goto(`/pim/${CATALOG_ID}`);
    // Both API calls must have been made
    await productsRequest;
    await catalogRequest;
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    // Product names come from the API fixture, not hardcoded
    await expect(page.getByText('TUT Ranger SUV 2026')).toBeVisible();
  });
});

