import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PimSchemaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/pim/schema');
    await this.waitForLoad();
  }

  get schemaEditor(): Locator {
    return this.page.locator('[data-testid="schema-editor"]');
  }

  get addFieldButton(): Locator {
    return this.page.locator('[data-testid="add-field-btn"]');
  }

  get fieldItems(): Locator {
    return this.page.locator('[data-testid="schema-field-item"]');
  }

  async addField(): Promise<void> {
    await this.addFieldButton.click();
  }

  fieldByName(name: string): Locator {
    return this.page.locator('[data-testid="schema-field-item"]', { hasText: name });
  }
}

