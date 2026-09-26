import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ComponentsPage extends BasePage {
  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/components');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /component/i });
  }

  get componentList(): Locator {
    return this.page.locator('[data-testid="component-list"]');
  }
}

