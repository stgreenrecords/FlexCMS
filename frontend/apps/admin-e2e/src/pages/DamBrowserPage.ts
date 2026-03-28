import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DamBrowserPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dam');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /media library|dam/i });
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search/i).first();
  }

  get assetGrid(): Locator {
    return this.page.locator('[data-testid="asset-grid"]');
  }

  get uploadButton(): Locator {
    return this.page.locator('[data-testid="dam-upload-btn"]');
  }

  get uploadZone(): Locator {
    return this.page.locator('[data-testid="dam-upload-zone"]');
  }

  get bulkActionsBar(): Locator {
    return this.page.locator('[data-testid="bulk-actions"]');
  }

  get viewToggleGrid(): Locator {
    return this.page.locator('[data-testid="view-toggle-grid"]');
  }

  get viewToggleList(): Locator {
    return this.page.locator('[data-testid="view-toggle-list"]');
  }

  get emptyState(): Locator {
    return this.page.locator('[data-testid="dam-empty-state"]');
  }

  async selectAsset(index: number): Promise<void> {
    const items = this.page.locator('[data-testid="asset-item"]');
    await items.nth(index).click();
  }

  async openUploadDialog(): Promise<void> {
    await this.uploadButton.click();
  }
}

