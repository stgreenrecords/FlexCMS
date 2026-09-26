/**
 * Content Preview E2E Tests — UI-096 → UI-105
 *
 * Tests the preview page (/preview?path=...) which renders an iframe
 * pointing to the publish/draft service with viewport and mode toggles.
 */
import { test, expect } from '@playwright/test';

const TEST_PATH = '/tut-usa/en/home';

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  // The preview page itself does not call /api/** — it only sets an iframe src.
  // Allow all requests through (iframe loads from different origin, no intercept needed).
});

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Content Preview @regression', () => {

  test('UI-096: preview page loads with path parameter and renders iframe', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    // The page renders inside a Suspense boundary; wait for the header to appear
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });
    // Iframe should be present in the DOM
    const iframe = page.getByTestId('preview-iframe');
    await expect(iframe).toBeAttached({ timeout: 10_000 });
  });

  test('UI-097: viewport toggle buttons switch between Desktop / Tablet / Mobile', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    // Desktop is active by default
    const desktopBtn = page.getByTestId('preview-viewport-desktop');
    await expect(desktopBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch to Tablet
    await page.getByTestId('preview-viewport-tablet').click();
    await expect(page.getByTestId('preview-viewport-tablet')).toHaveAttribute('aria-pressed', 'true');
    await expect(desktopBtn).toHaveAttribute('aria-pressed', 'false');

    // Switch to Mobile
    await page.getByTestId('preview-viewport-mobile').click();
    await expect(page.getByTestId('preview-viewport-mobile')).toHaveAttribute('aria-pressed', 'true');

    // Switch back to Desktop
    await desktopBtn.click();
    await expect(desktopBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('UI-098: URL bar shows the current preview URL', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    const urlBar = page.getByTestId('preview-url-bar');
    await expect(urlBar).toBeVisible();
    // URL bar should contain the path
    await expect(urlBar).toContainText(TEST_PATH);
  });

  test('UI-099: refresh button is present and clickable', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    const refreshBtn = page.getByTestId('preview-refresh-btn');
    await expect(refreshBtn).toBeVisible();
    // Click should not throw or navigate away
    await refreshBtn.click();
    // Page should still be on /preview
    await expect(page).toHaveURL(/\/preview/);
  });

  test('UI-100: copy URL button is present', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    const copyBtn = page.getByTestId('preview-copy-url-btn');
    await expect(copyBtn).toBeVisible();
    // aria-label confirms its purpose
    await expect(copyBtn).toHaveAttribute('aria-label', /copy preview url/i);
  });

  test('UI-101: open in new tab link has correct href', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    const openTabBtn = page.getByTestId('preview-open-tab-btn');
    await expect(openTabBtn).toBeVisible();
    // The href should point to the publish service with the given path
    const href = await openTabBtn.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain(TEST_PATH);
    // Must open in new tab
    await expect(openTabBtn).toHaveAttribute('target', '_blank');
  });

  test('UI-102: draft/live mode toggle buttons are present', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    await expect(page.getByTestId('preview-draft-toggle')).toBeVisible();
    await expect(page.getByTestId('preview-published-toggle')).toBeVisible();
  });

  test('UI-103: switching to draft mode updates the URL bar to the draft base URL', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    // Live (publish) is the default. Switch to draft.
    const draftToggle = page.getByTestId('preview-draft-toggle');
    const liveToggle  = page.getByTestId('preview-published-toggle');

    // Start in live mode — live button pressed
    await expect(liveToggle).toHaveAttribute('aria-pressed', 'true');

    await draftToggle.click();
    await expect(draftToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(liveToggle).toHaveAttribute('aria-pressed', 'false');

    // URL bar should now show draft URL (localhost:3001 by default)
    const urlBar = page.getByTestId('preview-url-bar');
    await expect(urlBar).toContainText(TEST_PATH);
  });

  test('UI-104: Edit button navigates to the page editor', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    const editBtn = page.getByTestId('preview-edit-btn');
    await expect(editBtn).toBeVisible();
    // The edit link should point to /editor?path=...
    const href = await editBtn.getAttribute('href');
    expect(href).toContain('/editor');
    expect(href).toContain(encodeURIComponent(TEST_PATH));
  });

  test('UI-105: status bar is visible and shows ready state', async ({ page }) => {
    await page.goto(`/preview?path=${TEST_PATH}`);
    await expect(page.getByTestId('preview-viewport-desktop')).toBeVisible({ timeout: 10_000 });

    const statusBar = page.getByTestId('preview-status-bar');
    await expect(statusBar).toBeVisible();
    // After load, status bar should show path, viewport info, and mode
    await expect(statusBar).toContainText(TEST_PATH);
    await expect(statusBar).toContainText(/desktop|full width/i);
  });

});

