/**
 * FlexCMS Selenium E2E — admin DAM (Digital Asset Management) page object (REB-21).
 *
 * Covers the asset library at `/dam` and the asset detail route at `/dam/{id}`.
 *
 * Two behaviours of the library page shape every assertion here, and both are
 * properties of the product rather than of this page object:
 *
 * - **Its search is client-side.** The page fetches
 *   `GET /api/author/assets?size=200` once on mount and then filters the result in
 *   the browser with `a.name.toLowerCase().includes(search)`. It never calls the
 *   API's own `q` parameter, so UI search and API search are genuinely different
 *   code paths — and the API one defaults `siteId` to `"corporate"` when the
 *   caller omits it, which no `tut-usa` asset would ever match.
 * - **Previews come from the author binary route.** Image tiles point at
 *   `${API_BASE}/api/author/assets/{id}/content`. There is no publish-side asset
 *   delivery anywhere in the platform, so that URL is the only way to fetch an
 *   asset's bytes.
 */
import { By, Key, type WebDriver } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForPageReady, waitForVisible } from '../driver/waits';

export class DamPage {
  private readonly env = loadEnv();

  constructor(private readonly driver: WebDriver) {}

  /** Opens the asset library and waits for its initial fetch to settle. */
  async open(): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/dam`);
    await waitForPageReady(this.driver);
    await this.waitUntilLoaded();
  }

  /** Opens one asset's detail route. */
  async openDetail(assetId: string): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/dam/${assetId}`);
    await waitForPageReady(this.driver);
    await this.driver.wait(async () => {
      const body = await this.readBodyText();
      return !body.includes('Loading');
    }, 20_000, `Asset detail for ${assetId} never finished loading`);
  }

  async waitUntilLoaded(): Promise<void> {
    await this.driver.wait(async () => {
      const body = await this.readBodyText();
      return !body.includes('Loading');
    }, 20_000, 'DAM library never finished loading');
  }

  async readBodyText(): Promise<string> {
    const body = await waitForVisible(this.driver, By.css('body'));
    return (await body.getText()).trim();
  }

  /** Whether the library rendered an error state rather than content. */
  async hasErrorState(): Promise<boolean> {
    const body = (await this.readBodyText()).toLowerCase();
    return body.includes('failed to load') || body.includes('something went wrong');
  }

  /**
   * Types into the library's search box, which filters the already-fetched list.
   *
   * The box is a controlled React input, so `WebElement.clear()` is not enough: it
   * empties the DOM value without dispatching the event React listens for, leaving
   * component state on the previous term and the list filtered by a query the box
   * no longer shows. Selecting all and typing over the selection (or pressing
   * DELETE for an empty value) goes through the same key events a user produces —
   * the same approach `EditorAuthoringPage.clearAndType()` uses.
   */
  async setSearch(value: string): Promise<void> {
    const input = await waitForVisible(this.driver, By.css('input[placeholder="Search assets..."]'));
    await input.click();
    await input.sendKeys(Key.chord(Key.CONTROL, 'a'));
    if (value.length > 0) {
      await input.sendKeys(value);
    } else {
      await input.sendKeys(Key.DELETE);
    }
    await this.driver.wait(
      async () => ((await input.getAttribute('value')) ?? '') === value,
      this.env.explicitWaitMs,
      `DAM search box did not accept "${value}"`,
    );
    // The filter is derived state; give React a frame to re-render the list.
    await this.driver.sleep(300);
  }

  async clearSearch(): Promise<void> {
    await this.setSearch('');
  }

  /**
   * Whether the given filename is currently visible in the library.
   *
   * Matched against the whole page text rather than a tile selector: the page
   * offers grid and list view modes with different markup, and this assertion
   * should hold in either.
   */
  async showsAsset(filename: string): Promise<boolean> {
    return (await this.readBodyText()).includes(filename);
  }

  /** Polls the library — reloading it — until `filename` is present or absent. */
  async waitForAssetPresence(filename: string, shouldBePresent: boolean, timeoutMs = 30_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await this.open();
      if ((await this.showsAsset(filename)) === shouldBePresent) return true;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    return false;
  }

  /** `src` of every rendered image tile, for preview-health checks. */
  async assetImageSources(): Promise<string[]> {
    const images = await this.driver.findElements(By.css('img'));
    const sources: string[] = [];
    for (const image of images) {
      const src = await image.getAttribute('src');
      if (src) sources.push(src);
    }
    return sources;
  }

  /**
   * Images that failed to load, by natural size.
   *
   * A broken `<img>` still exists in the DOM, so presence alone proves nothing —
   * only `naturalWidth === 0` distinguishes a resolved image from a dead URL.
   */
  async brokenImageSources(): Promise<string[]> {
    return (await this.driver.executeScript(
      `return Array.from(document.images)
         .filter((img) => img.complete && img.naturalWidth === 0)
         .map((img) => img.src);`,
    )) as string[];
  }

  /** Whether the Upload control is present (upload is dialog-driven). */
  async hasUploadControl(): Promise<boolean> {
    const buttons = await this.driver.findElements(
      By.xpath("//button[contains(normalize-space(), 'Upload')]"),
    );
    return buttons.length > 0;
  }
}
