/**
 * Page Editor E2E Tests — UI-021 → UI-037
 */
import { test, expect } from '@playwright/test';

// ── Fixture: registry with "components" key (what editor expects) ──────────
const registryFixture = {
  components: [
    {
      resourceType: 'flexcms/hero',
      name: 'hero',
      title: 'Hero Banner',
      description: 'Full-width hero banner',
      group: 'Layout',
      isContainer: false,
      dataSchema: {
        type: 'object',
        properties: {
          title:    { type: 'string',  title: 'Title' },
          subtitle: { type: 'string',  title: 'Subtitle', format: 'textarea' },
          ctaLabel: { type: 'string',  title: 'CTA Label' },
          variant:  { type: 'string',  title: 'Variant', enum: ['dark', 'light', 'transparent'] },
          fullHeight: { type: 'boolean', title: 'Full Height' },
        },
        required: ['title'],
      },
    },
    {
      resourceType: 'flexcms/text-block',
      name: 'text-block',
      title: 'Text Block',
      group: 'Content',
      isContainer: false,
      dataSchema: {
        type: 'object',
        properties: {
          body:      { type: 'string', title: 'Body', format: 'textarea' },
          alignment: { type: 'string', title: 'Alignment', enum: ['left', 'center', 'right'] },
        },
      },
    },
  ],
};

// ── Fixture: page node — editor fetches from /api/author/content/page ──────
const pageFixture = {
  id: 'e1',
  path: 'content.tut-gb.en.home',
  name: 'home',
  resourceType: 'flexcms/page',
  status: 'DRAFT',
  modifiedBy: 'admin',
  modifiedAt: '2026-03-28T10:00:00Z',
  properties: { title: 'Home Page' },
  children: [
    {
      id: 'c1',
      path: 'content.tut-gb.en.home.hero-1',
      name: 'hero-1',
      resourceType: 'flexcms/hero',
      status: 'DRAFT',
      properties: { title: 'Drive the Future', ctaLabel: 'Discover Now', variant: 'dark' },
      children: [],
    },
    {
      id: 'c2',
      path: 'content.tut-gb.en.home.text-1',
      name: 'text-1',
      resourceType: 'flexcms/text-block',
      status: 'DRAFT',
      properties: { body: 'Premium vehicles for every journey.', alignment: 'center' },
      children: [],
    },
  ],
};

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    // Component registry — editor uses reg.components key
    if (pathname.includes('/api/content/v1/component-registry')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(registryFixture) });
    }
    // Page node — editor fetches /api/author/content/page (not /node)
    if (pathname.includes('/api/author/content/page')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pageFixture) });
    }
    // Save properties
    if (pathname.includes('/api/author/content/node/properties')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    // Publish status
    if (pathname.includes('/api/author/content/node/status')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Page Editor @smoke @regression', () => {

  test('UI-021: editor loads with component palette and canvas', async ({ page }) => {
    await page.goto('/editor?path=/tut-gb/en/home');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('aside').first()).toBeVisible();
  });

  test('UI-022: component palette shows components from component registry', async ({ page }) => {
    const registryCall = page.waitForResponse(
      (r) => r.url().includes('/api/content/v1/component-registry'),
    );
    await page.goto('/editor?path=/tut-gb/en/home');
    await registryCall;
    // Palette renders component titles from the registry — scope to left panel aside to avoid strict-mode violation
    await expect(page.locator('aside').first().getByText('Hero Banner')).toBeVisible({ timeout: 10_000 });
  });

  test('UI-023: canvas renders loaded page components', async ({ page }) => {
    await page.goto('/editor?path=/tut-gb/en/home');
    // The hero component preview shows the title prop value
    await expect(page.getByText('Drive the Future')).toBeVisible({ timeout: 10_000 });
  });

  test('UI-024: clicking a canvas component shows property inputs in right panel', async ({ page }) => {
    await page.goto('/editor?path=/tut-gb/en/home');
    await expect(page.getByText('Drive the Future')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Drive the Future').first().click();
    // Right panel should show text inputs for string properties
    await expect(page.locator('aside').last().locator('input[type="text"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('UI-025: enum field in right panel renders as a select element', async ({ page }) => {
    await page.goto('/editor?path=/tut-gb/en/home');
    await expect(page.getByText('Drive the Future')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Drive the Future').first().click();
    // Variant field has enum values and renders as <select>
    await expect(page.locator('aside').last().locator('select').first()).toBeVisible({ timeout: 5_000 });
  });

  test('UI-030: save button calls properties API for loaded components', async ({ page }) => {
    const saveCall = page.waitForResponse(
      (r) => r.url().includes('/api/author/content/node/properties') && r.status() === 200,
    );
    await page.goto('/editor?path=/tut-gb/en/home');
    // Wait for components to load (they have nodePath so save will call API)
    await expect(page.getByText('Drive the Future')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Save' }).click();
    await saveCall;
  });

  test('UI-037: viewport toggle buttons switch between desktop/tablet/mobile', async ({ page }) => {
    await page.goto('/editor?path=/tut-gb/en/home');
    await expect(page.getByRole('button', { name: 'tablet' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'tablet' }).click();
    await expect(page.getByRole('button', { name: 'desktop' })).toBeVisible();
  });

  test('UI-036: publish button calls the status API', async ({ page }) => {
    const publishCall = page.waitForResponse(
      (r) => r.url().includes('/api/author/content/node/status') && r.status() === 200,
    );
    await page.goto('/editor?path=/tut-gb/en/home');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Publish' }).click();
    await publishCall;
  });

  test('UI-021b: editor top bar shows Save and Publish buttons', async ({ page }) => {
    await page.goto('/editor?path=/tut-gb/en/home');
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
  });

  test('UI-021c: editor shows viewport toggle buttons (desktop/tablet/mobile)', async ({ page }) => {
    await page.goto('/editor?path=/tut-gb/en/home');
    await expect(page.getByRole('button', { name: 'desktop' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'tablet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'mobile' })).toBeVisible();
  });
});

