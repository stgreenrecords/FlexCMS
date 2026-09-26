import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Workspace Overview' });
  }

  get totalPagesCard(): Locator {
    return this.page.getByText('Total Pages');
  }

  get activeSitesCard(): Locator {
    return this.page.getByText('Active Sites');
  }

  get contentUpdatesSection(): Locator {
    return this.page.getByText('Content Updates');
  }

  get recentActivityTable(): Locator {
    return this.page.getByText('Recent Global Activity');
  }

  async getTotalPagesValue(): Promise<string> {
    const card = this.page.locator('div', { has: this.page.getByText('Total Pages') });
    const valueEl = card.locator('p.text-2xl, p[class*="text-2xl"]').first();
    return (await valueEl.textContent()) ?? '';
  }

  async clickCreateNewResource(): Promise<void> {
    await this.page.getByRole('link', { name: 'Create New Resource' }).click();
  }
}

