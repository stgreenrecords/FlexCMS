import { By, type WebDriver } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForFontsReady, waitForNetworkIdle, waitForPageReady, waitForVisible } from '../driver/waits';

export class SitePage {
  private readonly env = loadEnv();
  private readonly baseUrl: string;

  constructor(private readonly driver: WebDriver, baseUrl?: string) {
    this.baseUrl = baseUrl ?? this.env.siteUrl;
  }

  async open(path: string): Promise<void> {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    await this.driver.get(`${this.baseUrl}${normalized}`);
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
      const main = document.querySelector('main');
      if (!main) return false;

      const selectors = [
        '[data-testid*="cta"]',
        '[class*="cta"]',
        'a[role="button"]',
        'button',
        'a'
      ];
      const textHints = ['book', 'build', 'buy', 'shop', 'learn', 'explore', 'contact', 'reserve', 'test drive'];
      const candidates = selectors.flatMap((selector) => Array.from(main.querySelectorAll(selector)));
      return candidates.some((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        if (!visible) return false;
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

      const healthy = await this.driver.executeScript<boolean>(
        `
        const main = document.querySelector('main');
        if (!main) return false;
        const rect = main.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const body = document.body;
        const hasMajorOverflow = body.scrollWidth > (window.innerWidth * 1.5);
        return !hasMajorOverflow;
        `,
      );
      if (!healthy) {
        return false;
      }
    }

    // Restore desktop viewport for follow-up checks in the same test.
    await this.driver.manage().window().setRect({ width: 1440, height: 900 });
    await waitForPageReady(this.driver);
    return true;
  }

  async hasMeaningfulMainContent(minTextLength = 120): Promise<boolean> {
    const result = await this.driver.executeScript<{ hasMain: boolean; textLength: number; componentMarkers: number; mediaCount: number }>(
      `
      const main = document.querySelector('main');
      if (!main) {
        return { hasMain: false, textLength: 0, componentMarkers: 0, mediaCount: 0 };
      }

      const contentText = (main.textContent || '').replace(/\s+/g, ' ').trim();
      const componentMarkers = main.querySelectorAll('[data-flexcms-resource-type], [data-flexcms-unimplemented], [data-flexcms-group]').length;
      const mediaCount = main.querySelectorAll('img, picture, video, iframe').length;
      return {
        hasMain: true,
        textLength: contentText.length,
        componentMarkers,
        mediaCount,
      };
      `,
    );

    if (!result?.hasMain) return false;
    if (Number(result.componentMarkers ?? 0) > 0) return true;
    if (Number(result.mediaCount ?? 0) > 0) return true;
    return Number(result.textLength ?? 0) >= minTextLength;
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


