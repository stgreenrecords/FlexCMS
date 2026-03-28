import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PimCatalogPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/pim');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /catalog|pim|product/i });
  }

  get productGrid(): Locator {
    return this.page.locator('[data-testid="product-grid"]');
  }

  get emptyState(): Locator {
    return this.page.locator('[data-testid="pim-empty-state"]');
  }

  productByName(name: string): Locator {
    return this.page.locator('[data-testid="product-item"]', { hasText: name });
  }
}

