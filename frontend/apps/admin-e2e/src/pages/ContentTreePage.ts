import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContentTreePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(path?: string): Promise<void> {
    await this.page.goto(path ? `/content?path=${path}` : '/content');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Content Tree' });
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Filter by name or URL...');
  }

  get contentTable(): Locator {
    return this.page.locator('table');
  }

  get tableBody(): Locator {
    return this.page.locator('tbody');
  }

  get upButton(): Locator {
    return this.page.getByTitle('Up one level');
  }

  get breadcrumbBar(): Locator {
    return this.page.locator('.flex.items-center.gap-1.mb-2');
  }

  get footer(): Locator {
    return this.page.locator('p', { hasText: /Showing/ });
  }

  /** Get a table row by the node name shown in the font-semibold span */
  rowByName(name: string): Locator {
    return this.page
      .locator('tbody tr', {
        has: this.page.locator('span.font-semibold', { hasText: name }),
      })
      .first();
  }

  async clickRow(name: string): Promise<void> {
    await this.rowByName(name).click();
    await this.waitForLoad();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300);
  }

  async openActionMenu(rowName: string): Promise<void> {
    const row = this.rowByName(rowName);
    await row.locator('button').last().click();
  }

  async selectAll(): Promise<void> {
    await this.page.locator('thead input[type="checkbox"]').click();
  }

  async getRowCount(): Promise<number> {
    return this.page.locator('tbody tr').count();
  }

  async waitForRows(minRows = 1): Promise<void> {
    await expect(this.page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
    const count = await this.page.locator('tbody tr').count();
    expect(count).toBeGreaterThanOrEqual(minRows);
  }
}

