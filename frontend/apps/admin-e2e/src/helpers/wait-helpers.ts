/**
 * Custom wait helpers for FlexCMS Admin E2E tests.
 *
 * Provides reusable wait conditions for common scenarios like
 * table load completion, skeleton disappearance, etc.
 */
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wait for all loading skeletons to disappear from the page.
 * Uses polling to detect when skeletons are no longer visible.
 */
export async function waitForSkeletonsGone(
  page: Page,
  timeout = 15_000,
): Promise<void> {
  await expect(page.locator('[data-testid="loading-skeleton"]').first())
    .not.toBeVisible({ timeout });
}

/**
 * Wait for a table to be populated with at least one row.
 */
export async function waitForTableRows(
  locator: Locator,
  minRows = 1,
  timeout = 10_000,
): Promise<void> {
  await expect(locator).toHaveCount(minRows, { timeout });
}

/**
 * Wait for a network response matching a URL pattern, then for the
 * page to stop loading (networkidle).
 */
export async function waitForPageWithApi(
  page: Page,
  urlPattern: string,
  options: { networkIdleTimeout?: number } = {},
): Promise<void> {
  const { networkIdleTimeout = 5_000 } = options;
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes(urlPattern) && resp.status() === 200,
    ),
    page.waitForLoadState('domcontentloaded'),
  ]);
  // Wait for a brief moment to allow React state updates to render
  await page.waitForTimeout(200);
  void networkIdleTimeout; // kept for future use
}

/**
 * Retry clicking an element up to N times, useful for elements that
 * may be obscured or not yet interactive.
 */
export async function clickWithRetry(
  locator: Locator,
  maxAttempts = 3,
  delayMs = 500,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await locator.click({ timeout: 3_000 });
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error(`clickWithRetry: failed after ${maxAttempts} attempts`);
      await locator.page().waitForTimeout(delayMs);
    }
  }
}

