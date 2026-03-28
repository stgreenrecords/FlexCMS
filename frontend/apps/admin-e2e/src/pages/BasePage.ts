/**
 * Base Page Object Model — shared navigation and common locators.
 */
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to this page's URL */
  abstract goto(...args: string[]): Promise<void>;

  /** Wait until the page's primary content is loaded */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(200);
  }

  // ── Sidebar helpers ──────────────────────────────────────────────────────

  get sidebarNav(): Locator {
    return this.page.getByTestId('sidebar-nav');
  }

  async clickSidebarLink(name: string): Promise<void> {
    await this.page.getByRole('link', { name }).click();
  }

  // ── Breadcrumb helpers ───────────────────────────────────────────────────

  get breadcrumb(): Locator {
    return this.page.getByTestId('breadcrumb');
  }

  async getBreadcrumbText(): Promise<string[]> {
    return this.page.getByTestId('breadcrumb-item').allTextContents();
  }

  // ── Skeleton / loading helpers ───────────────────────────────────────────

  async waitForSkeletonsGone(timeout = 15_000): Promise<void> {
    const skeletons = this.page.getByTestId('loading-skeleton');
    const count = await skeletons.count();
    if (count > 0) {
      await expect(skeletons.first()).not.toBeVisible({ timeout });
    }
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  get emptyState(): Locator {
    return this.page.getByTestId('empty-state');
  }
}

