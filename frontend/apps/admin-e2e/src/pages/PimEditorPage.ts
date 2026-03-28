import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PimEditorPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(catalogId: string, productId: string): Promise<void> {
    await this.page.goto(`/pim/${catalogId}/${productId}`);
    await this.waitForLoad();
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: /save/i });
  }

  get skuField(): Locator {
    return this.page.getByLabel(/sku/i);
  }

  get nameField(): Locator {
    return this.page.getByLabel(/name/i).first();
  }

  async fillField(label: string, value: string): Promise<void> {
    await this.page.getByLabel(new RegExp(label, 'i')).fill(value);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}

