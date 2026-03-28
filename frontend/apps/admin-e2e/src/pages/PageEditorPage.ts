import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PageEditorPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(path?: string): Promise<void> {
    const url = path ? `/editor?path=${encodeURIComponent(path)}` : '/editor';
    await this.page.goto(url);
    await this.waitForLoad();
  }

  get componentPalette(): Locator {
    return this.page.locator('[data-testid="component-palette"]');
  }

  get canvas(): Locator {
    return this.page.locator('[data-testid="editor-canvas"]');
  }

  get propertyPanel(): Locator {
    return this.page.locator('[data-testid="property-panel"]');
  }

  get saveButton(): Locator {
    return this.page.locator('[data-testid="editor-save"]');
  }

  get publishButton(): Locator {
    return this.page.locator('[data-testid="editor-publish"]');
  }

  get viewportDesktop(): Locator {
    return this.page.locator('[data-testid="viewport-desktop"]');
  }

  get viewportTablet(): Locator {
    return this.page.locator('[data-testid="viewport-tablet"]');
  }

  get viewportMobile(): Locator {
    return this.page.locator('[data-testid="viewport-mobile"]');
  }

  async clickPaletteItem(name: string): Promise<void> {
    await this.page.locator('[data-testid="palette-item"]', { hasText: name }).click();
  }

  async clickComponentInCanvas(index = 0): Promise<void> {
    await this.page.locator('[data-testid="component-item"]').nth(index).click();
  }

  async fillPropertyField(label: string, value: string): Promise<void> {
    const field = this.propertyPanel.getByLabel(label);
    await field.fill(value);
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }
}

