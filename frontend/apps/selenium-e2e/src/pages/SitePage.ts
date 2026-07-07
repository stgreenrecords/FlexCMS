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

  async fontFailureCount(): Promise<number> {
    const failed = await this.driver.executeScript<number>(
      `
      const entries = performance.getEntriesByType('resource') || [];
      const fonts = entries.filter((entry) => entry.initiatorType === 'font');
      return fonts.filter((entry) => Number(entry.duration) <= 0).length;
      `,
    );
    return Number(failed ?? 0);
  }

  async consoleErrorCount(): Promise<number> {
    const logs = await this.driver.manage().logs().get('browser');
    return logs.filter((entry) => entry.level?.name === 'SEVERE').length;
  }

  async hasPrimaryCta(): Promise<boolean> {
    const hasCta = await this.driver.executeScript<boolean>(
      `
      const selectors = [
        '[data-testid*="cta"]',
        '[class*="cta"]',
        'a[role="button"]',
        'button',
        'a'
      ];
      const textHints = ['book', 'build', 'buy', 'shop', 'learn', 'explore', 'contact', 'reserve', 'test drive'];
      const candidates = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
      return candidates.some((el) => {
        const text = (el.textContent || '').toLowerCase().trim();
        if (!text) return false;
        return textHints.some((hint) => text.includes(hint));
      });
      `,
    );
    return Boolean(hasCta);
  }

  async responsiveBodiesVisible(widths: number[]): Promise<boolean> {
    for (const width of widths) {
      await this.driver.manage().window().setRect({ width, height: 900 });
      await waitForPageReady(this.driver);
      await waitForVisible(this.driver, By.css('body'));
    }
    return true;
  }

  async accessibilityIssueCount(): Promise<number> {
    const count = await this.driver.executeScript<number>(
      `
      const html = document.documentElement;
      const body = document.body;
      const issues = [];
      if (!html || !html.getAttribute('lang')) issues.push('missing-html-lang');
      if (!body || !body.innerText || !body.innerText.trim()) issues.push('empty-body-text');
      if (document.querySelectorAll('h1').length > 1) issues.push('multiple-h1');
      return issues.length;
      `,
    );
    return Number(count ?? 0);
  }
}


