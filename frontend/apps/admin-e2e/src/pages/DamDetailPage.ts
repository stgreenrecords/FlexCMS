import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DamDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(assetId: string): Promise<void> {
    await this.page.goto(`/dam/${assetId}`);
    await this.waitForLoad();
  }

  get assetName(): Locator {
    return this.page.locator('h1, h2').first();
  }

  get downloadButton(): Locator {
    return this.page.getByRole('button', { name: /download/i });
  }

  get deleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete/i });
  }
}

