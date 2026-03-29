/**
 * PIM Product Editor E2E Tests — UI-056 → UI-061
 *
 * URL: /pim/{catalogId}/{productId}
 */
import { test, expect } from '@playwright/test';

const CATALOG_ID = 'tut-vehicles';
const PRODUCT_ID = 'prod-001';

// Deterministic product detail fixture
const PRODUCT_DETAIL = {
  id: 'prod-001',
  sku: 'TUT-SUV-2026',
  name: 'TUT Ranger SUV 2026',
  status: 'DRAFT',
  updatedAt: '2026-03-28T10:00:00Z',
  updatedBy: 'admin',
  attributes: {
    brand: 'TUT Motors',
    category: 'SUV',
    panel: 'Premium',
    price: 42999,
    description: 'The flagship SUV from TUT Motors',
  },
};

const VARIANTS = [
  {
    id: 'v1',
    variantSku: 'TUT-SUV-2026-RED',
    status: 'ACTIVE',
    attributes: { region: 'UK', color: 'Red' },
    inventory: { stock: 5 },
  },
  {
    id: 'v2',
    variantSku: 'TUT-SUV-2026-BLK',
    status: 'DRAFT',
    attributes: { region: 'DE', color: 'Black' },
    inventory: { stock: 12 },
  },
];

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, } = url;
    const method = route.request().method();

    // Product variants
    if (pathname.includes(`/api/pim/v1/products/${PRODUCT_ID}/variants`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(VARIANTS),
      });
    }
    // Product detail (GET)
    if (pathname.includes(`/api/pim/v1/products/${PRODUCT_ID}`) && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PRODUCT_DETAIL),
      });
    }
    // Save draft (PUT by SKU)
    if (pathname.includes('/api/pim/v1/products/TUT-SUV-2026') && method === 'PUT' && !pathname.includes('/status')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }
    // Publish status (PUT /products/{sku}/status)
    if (pathname.includes('/api/pim/v1/products/TUT-SUV-2026/status') && method === 'PUT') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('PIM Product Editor @regression', () => {

  test('UI-056: editor loads product data from API and shows SKU heading @smoke', async ({ page }) => {
    const productApiCall = page.waitForResponse(
      (r) => r.url().includes(`/api/pim/v1/products/${PRODUCT_ID}`) && r.status() === 200,
    );
    await page.goto(`/pim/${CATALOG_ID}/${PRODUCT_ID}`);
    await productApiCall;
    // After loading, h1 shows "SKU: TUT-SUV-2026"
    await expect(page.getByText(/SKU:\s*TUT-SUV-2026/)).toBeVisible({ timeout: 10_000 });
  });

  test('UI-057: "Save Draft" button sends PUT to /api/pim/v1/products/{sku}', async ({ page }) => {
    const saveRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/api/pim/v1/products/TUT-SUV-2026') &&
        req.method() === 'PUT' &&
        !req.url().includes('/status'),
    );
    await page.goto(`/pim/${CATALOG_ID}/${PRODUCT_ID}`);
    await expect(page.getByText(/SKU:\s*TUT-SUV-2026/)).toBeVisible({ timeout: 10_000 });
    // Click "Save Draft"
    await page.getByRole('button', { name: /save draft/i }).click();
    await saveRequest;
  });

  test('UI-058: "Publish" button sends PUT with PUBLISHED status', async ({ page }) => {
    let capturedBody: Record<string, unknown> = {};
    const publishRequest = new Promise<void>((resolve) => {
      void page.route('**/api/pim/v1/products/TUT-SUV-2026/status', async (route) => {
        if (route.request().method() === 'PUT') {
          capturedBody = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
        resolve();
      });
    });
    await page.goto(`/pim/${CATALOG_ID}/${PRODUCT_ID}`);
    await expect(page.getByText(/SKU:\s*TUT-SUV-2026/)).toBeVisible({ timeout: 10_000 });
    // Click "Publish" — locator by button text content (button has icon + 'Publish' text)
    await page.locator('button').filter({ hasText: 'Publish' }).last().click();
    await publishRequest;
    expect(capturedBody['status']).toBe('PUBLISHED');
  });

  test('UI-059: variants section is fetched from API and displayed', async ({ page }) => {
    const variantsApiCall = page.waitForResponse(
      (r) => r.url().includes(`/api/pim/v1/products/${PRODUCT_ID}/variants`) && r.status() === 200,
    );
    await page.goto(`/pim/${CATALOG_ID}/${PRODUCT_ID}`);
    await variantsApiCall;
    // Product Variants section heading
    await expect(page.getByText('Product Variants')).toBeVisible({ timeout: 10_000 });
    // Variant SKU suffix from fixtures
    await expect(page.getByText('TUT-SUV-2026-RED')).toBeVisible();
    await expect(page.getByText('TUT-SUV-2026-BLK')).toBeVisible();
  });

  test('UI-060: last modified info shows real updatedAt and updatedBy from API', async ({ page }) => {
    await page.goto(`/pim/${CATALOG_ID}/${PRODUCT_ID}`);
    await expect(page.getByText(/SKU:\s*TUT-SUV-2026/)).toBeVisible({ timeout: 10_000 });
    // The page renders "Last modified: {date} by {user}"
    await expect(page.getByText(/last modified/i)).toBeVisible();
    await expect(page.getByText('admin')).toBeVisible();
  });

  test('UI-061: all product data is driven by the PIM API (no mock constants)', async ({ page }) => {
    const productRequest = page.waitForRequest(
      (req) => req.url().includes(`/api/pim/v1/products/${PRODUCT_ID}`),
    );
    const variantsRequest = page.waitForRequest(
      (req) => req.url().includes(`/api/pim/v1/products/${PRODUCT_ID}/variants`),
    );
    await page.goto(`/pim/${CATALOG_ID}/${PRODUCT_ID}`);
    // Both API calls must be made
    await productRequest;
    await variantsRequest;
    // SKU comes from API, not hardcoded
    await expect(page.getByText(/SKU:\s*TUT-SUV-2026/)).toBeVisible({ timeout: 10_000 });
  });
});


