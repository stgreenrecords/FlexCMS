import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PimImportPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/pim/import');
    await this.waitForLoad();
  }

  get currentStep(): Locator {
    return this.page.locator('[data-testid^="import-step-"][aria-current="true"]');
  }

  step(n: number): Locator {
    return this.page.locator(`[data-testid="import-step-${n}"]`);
  }

  get uploadZone(): Locator {
    return this.page.locator('[data-testid="dam-upload-zone"]');
  }

  get nextButton(): Locator {
    return this.page.getByRole('button', { name: /next/i });
  }

  get finishButton(): Locator {
    return this.page.getByRole('button', { name: /finish|import/i });
  }
}

