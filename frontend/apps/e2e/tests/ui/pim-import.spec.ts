/**
 * PIM Import Wizard E2E Tests — UI-062 → UI-068
 *
 * URL: /pim/import  (5-step wizard)
 *
 * The import page uses a hardcoded API_BASE = '/api/pim/v1' (relative).
 * Catalog endpoint: /api/pim/v1/catalogs?size=100  → expects { items: [...] }
 */
import { test, expect, type Page } from '@playwright/test';

// Catalog fixture in { items: [...] } format (as import page expects)
const IMPORT_CATALOGS = {
  items: [
    { id: 'tut-vehicles',    name: 'TUT Vehicles',    year: 2026, season: 'Spring', status: 'ACTIVE' },
    { id: 'tut-accessories', name: 'TUT Accessories', year: 2026, season: null,     status: 'ACTIVE' },
  ],
};

// Infer-schema mock response
const INFER_SCHEMA_RESPONSE = {
  properties: {
    sku:   { type: 'string', examples: ['TUT-001'] },
    name:  { type: 'string', examples: ['Sample Product'] },
    price: { type: 'number', examples: ['999.99'] },
  },
};

// Import result mock
const IMPORT_RESULT = {
  created: 2,
  updated: 0,
  skipped: 0,
  errorCount: 0,
  errors: [],
};

// ── API mocks ──────────────────────────────────────────────────────────────
async function setupImportMocks(page: Page) {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;
    const method = route.request().method();

    // Catalog list (import page expects { items: [...] })
    if (pathname.includes('/api/pim/v1/catalogs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(IMPORT_CATALOGS),
      });
    }
    // Schema inference
    if (pathname.includes('/api/pim/v1/imports/infer-schema') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(INFER_SCHEMA_RESPONSE),
      });
    }
    // Execute import
    if (pathname.includes('/api/pim/v1/imports') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(IMPORT_RESULT),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('PIM Import Wizard @regression', () => {

  test('UI-062: import wizard page loads with heading and step indicator', async ({ page }) => {
    await setupImportMocks(page);
    await page.goto('/pim/import');
    await expect(page.getByRole('heading', { name: /import wizard/i })).toBeVisible({ timeout: 10_000 });
    // Step badge: "STEP 1 OF 5: UPLOAD"
    await expect(page.getByText(/STEP 1 OF 5/)).toBeVisible();
    await expect(page.getByText(/UPLOAD/)).toBeVisible();
  });

  test('UI-063: catalog selection dropdown is populated from /api/pim/v1/catalogs @smoke', async ({ page }) => {
    await setupImportMocks(page);
    const catalogsApiCall = page.waitForResponse(
      (r) => r.url().includes('/api/pim/v1/catalogs') && r.status() === 200,
    );
    await page.goto('/pim/import');
    await catalogsApiCall;
    await expect(page.getByRole('heading', { name: /import wizard/i })).toBeVisible({ timeout: 10_000 });
    // The catalog dropdown should have options from the API
    const catalogSelect = page.locator('select').first();
    await expect(catalogSelect).toBeVisible();
    // Select first catalog option (index 1 = first real catalog after placeholder)
    const options = await catalogSelect.locator('option').allTextContents();
    expect(options.some((o) => o.includes('TUT Vehicles'))).toBe(true);
  });

  test('UI-064: file upload zone accepts CSV, JSON, and Excel files', async ({ page }) => {
    await setupImportMocks(page);
    await page.goto('/pim/import');
    await expect(page.getByRole('heading', { name: /import wizard/i })).toBeVisible({ timeout: 10_000 });
    // Upload drop zone with instructions
    await expect(page.getByText(/drop your file here/i)).toBeVisible();
    // Format chips (use exact: true to avoid strict-mode on substrings like "Supports CSV, JSON…")
    await expect(page.getByText('CSV', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('JSON', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('XLSX', { exact: true })).toBeVisible();
  });

  test('UI-065: schema inference is triggered after file upload and step advance', async ({ page }) => {
    await setupImportMocks(page);
    await page.goto('/pim/import');
    await expect(page.getByRole('heading', { name: /import wizard/i })).toBeVisible({ timeout: 10_000 });

    // Select a catalog so we can proceed
    const catalogSelect = page.locator('select').first();
    await catalogSelect.waitFor({ state: 'visible', timeout: 8_000 });
    await catalogSelect.selectOption('tut-vehicles');

    // Upload a test file via the hidden file input
    const csvContent = 'sku,name,price\nTUT-001,Test Product,999';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Proceed to step 2 (Format)
    const nextBtn = page.getByRole('button', { name: /next step/i });
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await nextBtn.click();
    await expect(page.getByText(/STEP 2 OF 5/)).toBeVisible({ timeout: 5_000 });

    // Proceed to step 3 (Mapping) — this triggers infer-schema
    const inferCall = page.waitForRequest(
      (req) => req.url().includes('/api/pim/v1/imports/infer-schema') && req.method() === 'POST',
    );
    await nextBtn.click();
    await inferCall;
    await expect(page.getByText(/STEP 3 OF 5/)).toBeVisible({ timeout: 8_000 });
  });

  test('UI-066: field mapping step displays detected columns', async ({ page }) => {
    await setupImportMocks(page);
    await page.goto('/pim/import');
    await expect(page.getByRole('heading', { name: /import wizard/i })).toBeVisible({ timeout: 10_000 });

    // Select catalog and upload file to get to mapping step
    const catalogSelect = page.locator('select').first();
    await catalogSelect.waitFor({ state: 'visible', timeout: 8_000 });
    await catalogSelect.selectOption('tut-vehicles');

    const csvContent = 'sku,name,price\nTUT-001,Test Product,999';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Step 1 → 2 → 3
    const nextBtn = page.getByRole('button', { name: /next step/i });
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await nextBtn.click(); // → step 2
    await expect(page.getByText(/STEP 2 OF 5/)).toBeVisible({ timeout: 5_000 });
    await nextBtn.click(); // → step 3 (infer schema fires)
    await expect(page.getByText(/STEP 3 OF 5/)).toBeVisible({ timeout: 8_000 });

    // Mapping columns from INFER_SCHEMA_RESPONSE should be shown
    // Use exact: true to avoid strict-mode violations (options in selects also contain column names)
    await expect(page.getByText('sku',   { exact: true }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('name',  { exact: true }).first()).toBeVisible();
    await expect(page.getByText('price', { exact: true }).first()).toBeVisible();
  });

  test('UI-067: executing import calls POST /api/pim/v1/imports', async ({ page }) => {
    test.slow(); // wizard navigation can be slow
    await setupImportMocks(page);
    await page.goto('/pim/import');
    await expect(page.getByRole('heading', { name: /import wizard/i })).toBeVisible({ timeout: 10_000 });

    // Navigate to mapping step
    const catalogSelect = page.locator('select').first();
    await catalogSelect.waitFor({ state: 'visible', timeout: 8_000 });
    await catalogSelect.selectOption('tut-vehicles');

    const csvContent = 'sku,name,price\nTUT-001,Test Product,999';
    await page.locator('input[type="file"]').setInputFiles({
      name: 'products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // "Next Step" button (text: "Next Step arrow_forward")
    const nextStepBtn = page.getByRole('button', { name: /next step/i });
    await expect(nextStepBtn).toBeVisible({ timeout: 5_000 });
    await nextStepBtn.click(); // step 1 → 2
    await expect(page.getByText(/STEP 2 OF 5/)).toBeVisible({ timeout: 5_000 });
    await nextStepBtn.click(); // step 2 → 3 (triggers infer-schema)
    await expect(page.getByText(/STEP 3 OF 5/)).toBeVisible({ timeout: 8_000 });
    // Wait for inferring to finish ("Detecting columns…" disappears)
    await expect(page.getByText(/detecting columns/i)).not.toBeVisible({ timeout: 10_000 });

    // At step 3: only mapping selects are rendered (no catalog select).
    // Map all 3 columns to their first destination option to satisfy canProceed().
    const mappingSelects = page.locator('table select');
    const selectCount = await mappingSelects.count();
    for (let i = 0; i < selectCount; i++) {
      await mappingSelects.nth(i).selectOption({ index: 1 });
    }
    // Verify "All columns mapped" appears (the validation sidebar)
    await expect(page.getByText('All columns mapped')).toBeVisible({ timeout: 5_000 });

    await nextStepBtn.click(); // step 3 → 4
    await expect(page.getByText(/STEP 4 OF 5/)).toBeVisible({ timeout: 5_000 });
    await nextStepBtn.click(); // step 4 → 5
    await expect(page.getByText(/STEP 5 OF 5/)).toBeVisible({ timeout: 5_000 });

    // Trigger import and verify POST API call
    const importRequest = page.waitForRequest(
      (req) => req.url().includes('/api/pim/v1/imports') && req.method() === 'POST',
    );
    const startImportBtn = page.getByRole('button', { name: /start import/i });
    await expect(startImportBtn).toBeVisible({ timeout: 5_000 });
    await startImportBtn.click();
    await importRequest;
  });

  test('UI-068: no hardcoded mock constants in the import wizard', async ({ page }) => {
    await setupImportMocks(page);
    const catalogsRequest = page.waitForRequest(
      (req) => req.url().includes('/api/pim/v1/catalogs'),
    );
    await page.goto('/pim/import');
    await catalogsRequest; // API is called — not a static list
    await expect(page.getByRole('heading', { name: /import wizard/i })).toBeVisible({ timeout: 10_000 });
    // "Select a catalog..." placeholder text is present in the catalog select (no hardcoded catalog pre-selected)
    const catalogSelect = page.locator('select').first();
    await expect(catalogSelect).toContainText('Select a catalog');
  });
});








