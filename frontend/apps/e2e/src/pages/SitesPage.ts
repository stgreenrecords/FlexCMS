import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SitesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/sites');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /site/i });
  }

  get siteGrid(): Locator {
    return this.page.locator('[data-testid="site-grid"]');
  }

  get createSiteButton(): Locator {
    return this.page.locator('[data-testid="create-site-btn"]');
  }

  get searchInput(): Locator {
    return this.page.locator('[data-testid="sites-search"]');
  }

  get emptyState(): Locator {
    return this.page.locator('[data-testid="sites-empty-state"]');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300);
  }

  siteItemByName(name: string): Locator {
    return this.page.locator('[data-testid="site-item"]', { hasText: name });
  }
}

