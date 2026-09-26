import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ExperienceFragmentsPage extends BasePage {
  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/experience-fragments');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /experience fragment/i });
  }
}

