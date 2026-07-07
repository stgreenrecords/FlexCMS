import { By, type WebDriver } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForFontsReady, waitForNetworkIdle, waitForPageReady, waitForVisible } from '../driver/waits';

export class SitePage {
  private readonly env = loadEnv();

  constructor(private readonly driver: WebDriver) {}

  async open(path: string): Promise<void> {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    await this.driver.get(`${this.env.siteUrl}${normalized}`);
    await waitForPageReady(this.driver);
    await waitForFontsReady(this.driver);
    await waitForNetworkIdle(this.driver, { timeoutMs: 20_000, idleMs: 800 });
    await waitForVisible(this.driver, By.css('body'));
  }

  async readBodyText(): Promise<string> {
    const body = await waitForVisible(this.driver, By.css('body'));
    return body.getText();
  }

  async assertNotErrorPage(): Promise<void> {
    const bodyText = (await this.readBodyText()).toLowerCase();
    if (bodyText.includes('404') || bodyText.includes('not found')) {
      throw new Error('Rendered page appears to be a 404/not-found page.');
    }
  }

  async brokenImageCount(): Promise<number> {
    const count = await this.driver.executeScript<number>(
      `
      const images = Array.from(document.images || []);
      return images.filter((img) => img.src && img.complete && img.naturalWidth === 0).length;
      `,
    );
    return Number(count ?? 0);
  }

  async imageHealth(): Promise<{ total: number; broken: number }> {
    const stats = await this.driver.executeScript<{ total: number; broken: number }>(
      `
      const images = Array.from(document.images || []).filter((img) => Boolean(img.src));
      const broken = images.filter((img) => img.complete && img.naturalWidth === 0).length;
      return { total: images.length, broken };
      `,
    );
    return {
      total: Number(stats?.total ?? 0),
      broken: Number(stats?.broken ?? 0),
    };
  }
}


