import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PreviewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(path?: string): Promise<void> {
    const url = path ? `/preview?path=${encodeURIComponent(path)}` : '/preview';
    await this.page.goto(url);
    await this.waitForLoad();
  }

  get previewIframe(): Locator {
    return this.page.locator('iframe[data-testid="preview-iframe"], iframe').first();
  }

  get viewportDesktop(): Locator {
    return this.page.locator('[data-testid="preview-viewport-desktop"]');
  }

  get viewportTablet(): Locator {
    return this.page.locator('[data-testid="preview-viewport-tablet"]');
  }

  get viewportMobile(): Locator {
    return this.page.locator('[data-testid="preview-viewport-mobile"]');
  }

  async switchToViewport(size: 'desktop' | 'tablet' | 'mobile'): Promise<void> {
    await this.page.locator(`[data-testid="preview-viewport-${size}"]`).click();
  }

  frameLocator() {
    return this.page.frameLocator('iframe').first();
  }
}

