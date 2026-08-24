import { By, Key, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForClickable, waitForPageReady, waitForVisible } from '../driver/waits';

export class EditorPage {
  private readonly env = loadEnv();
  private resolvedAdminUrl: string;

  constructor(private readonly driver: WebDriver) {
    this.resolvedAdminUrl = this.env.adminUrl;
  }

  private getAdminUrlCandidates(): string[] {
    const candidates = [this.resolvedAdminUrl, this.env.adminUrl, ...this.env.adminUrlFallbacks];
    return [...new Set(candidates.filter((item) => item.length > 0))];
  }

  async open(contentPath: string): Promise<void> {
    const pagePath = `/editor?path=${encodeURIComponent(contentPath)}`;
    const candidates = this.getAdminUrlCandidates();
    let lastError: unknown;
    for (const baseUrl of candidates) {
      try {
        await this.driver.get(`${baseUrl}${pagePath}`);
        await waitForPageReady(this.driver);
        await this.driver.wait(until.elementLocated(By.css('[data-testid="editor-save-button"]')), this.env.explicitWaitMs);
        await waitForVisible(this.driver, By.css('[data-testid="editor-save-button"]'));
        this.resolvedAdminUrl = baseUrl;
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Editor did not become ready for ADMIN_URL candidates (${candidates.join(', ')}): ${String(lastError)}`,
    );
  }

  async clickPublish(): Promise<void> {
    const publishButton = await waitForClickable(this.driver, By.css('[data-testid="editor-publish-button"]'));
    await publishButton.click();
  }

  async hasElementByTestId(testId: string): Promise<boolean> {
    const elements = await this.driver.findElements(By.css(`[data-testid="${testId}"]`));
    return elements.length > 0;
  }

  async hasButtonByText(text: string): Promise<boolean> {
    const buttons = await this.driver.findElements(By.xpath(`//button[normalize-space()='${text}']`));
    return buttons.length > 0;
  }

  async hasIconButtonByTitle(title: string): Promise<boolean> {
    const buttons = await this.driver.findElements(By.css(`button[title="${title}"]`));
    return buttons.length > 0;
  }

  async hasLinkByHrefContains(pathFragment: string): Promise<boolean> {
    const links = await this.driver.findElements(By.css(`a[href*="${pathFragment}"]`));
    return links.length > 0;
  }

  async hasCancelAllInheritanceButton(): Promise<boolean> {
    const buttons = await this.driver.findElements(By.css('[data-testid="cancel-inheritance-all-button"]'));
    return buttons.length > 0;
  }

  async clickSave(): Promise<void> {
    const saveButton = await waitForClickable(this.driver, By.css('[data-testid="editor-save-button"]'));
    await saveButton.click();
  }

  async waitForPublishedFooter(): Promise<void> {
    await waitForVisible(this.driver, By.xpath("//span[normalize-space()='Published']"));
  }

  async openLayersTab(): Promise<void> {
    const layersTab = await waitForClickable(this.driver, By.css('[data-testid="editor-left-tab-layers"]'));
    await layersTab.click();
  }

  async selectFirstLockedLayer(): Promise<void> {
    await this.openLayersTab();
    const lockedLayer = await waitForClickable(this.driver, By.xpath("(//button[.//span[normalize-space()='Locked']])[1]"));
    await lockedLayer.click();
  }

  async hasLockedLayer(): Promise<boolean> {
    await this.openLayersTab();
    const lockedLayers = await this.driver.findElements(
      By.xpath("//p[normalize-space()='Page Layers']/following-sibling::button[.//span[normalize-space()='Locked']]"),
    );
    return lockedLayers.length > 0;
  }

  async selectLayerByText(labelText: string): Promise<void> {
    await this.openLayersTab();
    const normalized = labelText.toLowerCase();
    const candidates = await this.driver.findElements(
      By.xpath("//p[normalize-space()='Page Layers']/following-sibling::button"),
    );
    for (const candidate of candidates) {
      const text = (await candidate.getText()).toLowerCase();
      if (text.includes(normalized)) {
        await candidate.click();
        return;
      }
    }
    throw new Error(`Could not find layer containing text: ${labelText}`);
  }

  async hasEditablePropertyField(): Promise<boolean> {
    const fields = await this.driver.findElements(By.css('aside [data-testid^="editor-property-"][data-testid$="-input"]'));
    return fields.length > 0;
  }

  async cancelInheritanceIfVisible(): Promise<boolean> {
    const buttons = await this.driver.findElements(By.css('[data-testid="cancel-inheritance-button"]'));
    if (buttons.length === 0) return false;

    await buttons[0].click();
    await this.driver.wait(async () => {
      const info = await this.driver.findElements(By.xpath("//p[contains(normalize-space(.), 'Inheritance canceled')]"));
      const error = await this.driver.findElements(
        By.xpath("//p[contains(normalize-space(.), 'Failed to cancel inheritance') or contains(normalize-space(.), 'Could not persist editable override') or contains(normalize-space(.), 'has no page node') or contains(normalize-space(.), 'returned')]"),
      );
      return info.length > 0 || error.length > 0;
    }, 20000);

    const errors = await this.driver.findElements(
      By.xpath("//p[contains(normalize-space(.), 'Failed to cancel inheritance') or contains(normalize-space(.), 'Could not persist editable override') or contains(normalize-space(.), 'has no page node') or contains(normalize-space(.), 'returned')]"),
    );
    if (errors.length > 0) {
      const msg = await errors[0].getText();
      throw new Error(`Cancel inheritance failed: ${msg}`);
    }

    return true;
  }

  async cancelInheritanceForAll(): Promise<void> {
    const button = await waitForClickable(this.driver, By.css('[data-testid="cancel-inheritance-all-button"]'));
    await button.click();

    await this.driver.wait(async () => {
      const info = await this.driver.findElements(By.xpath("//p[contains(normalize-space(.), 'Inheritance canceled for')]"));
      const error = await this.driver.findElements(By.xpath("//p[contains(normalize-space(.), 'Failed:')]"));
      return info.length > 0 || error.length > 0;
    }, 20000);

    const errors = await this.driver.findElements(By.xpath("//p[contains(normalize-space(.), 'Failed:')]"));
    if (errors.length > 0) {
      const msg = await errors[0].getText();
      throw new Error(`Cancel all inheritance failed: ${msg}`);
    }
  }

  async clickPreviewAndReadNewTabUrl(): Promise<string> {
    const before = await this.driver.getAllWindowHandles();
    const previewBtn = await waitForClickable(this.driver, By.css('[data-testid="editor-preview-button"]'));
    await previewBtn.click();

    await this.driver.wait(async () => (await this.driver.getAllWindowHandles()).length > before.length, 10000);
    const after = await this.driver.getAllWindowHandles();
    const newHandle = after.find((h) => !before.includes(h));
    if (!newHandle) throw new Error('Preview did not open a new tab.');

    const original = await this.driver.getWindowHandle();
    await this.driver.switchTo().window(newHandle);
    const newUrl = await this.driver.getCurrentUrl();
    await this.driver.close();
    await this.driver.switchTo().window(original);
    return newUrl;
  }

  /**
   * Set the first writable property field to `value`, replacing whatever was there.
   *
   * This used to *append* to the previous value. Because it writes to a shared fixture
   * page that is never reset, the stored value grew by one marker on every run — it had
   * reached 624 characters and 32 markers. `sendKeys` types character by character into
   * a controlled React input that re-renders on each keystroke, so the longer the value
   * the likelier a keystroke is lost, and the round-trip assertion compares the full
   * string. That is why the scenario failed inside the loaded gate but passed when run
   * on its own. Replacing keeps the value bounded and also proves the old value is gone,
   * which appending never did.
   */
  async setFirstEditableTextField(value: string): Promise<string> {
    const fields = await this.driver.findElements(By.css('aside [data-testid^="editor-property-"][data-testid$="-input"]'));
    if (fields.length === 0) {
      throw new Error('No editable property input found in the editor sidebar.');
    }

    for (const field of fields) {
      const isDisabled = (await field.getAttribute('disabled')) !== null || (await field.getAttribute('aria-disabled')) === 'true';
      if (isDisabled) {
        continue;
      }

      const tagName = (await field.getTagName()).toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        // Select-all then type, rather than `clear()` then type: `clear()` drives the
        // input through an empty intermediate state that a controlled React field can
        // normalise behind the test's back. `EditorAuthoringPage.clearAndType` already
        // settled on this approach for the same reason.
        await field.click();
        await field.sendKeys(Key.chord(Key.CONTROL, 'a'));
        await field.sendKeys(value);

        // Confirm the input actually holds what was typed. Without this, a dropped
        // keystroke surfaces only after the refresh, where it reads as a persistence
        // bug in the product rather than a typing failure in the test.
        await this.driver.wait(
          async () => ((await field.getAttribute('value')) ?? '') === value,
          15000,
          `Typing into the property field did not take: the input never reached "${value}".`,
        );
        return value;
      }

      if (tagName === 'button') {
        await field.click();
        const options = await this.driver.findElements(By.css('div[role="option"]'));
        if (options.length > 0) {
          const option = options[options.length - 1];
          const optionValue = (await option.getText()).trim();
          await option.click();
          return optionValue;
        }
      }
    }

    throw new Error('No writable property field could be updated.');
  }

  async readFirstEditableTextFieldValue(): Promise<string> {
    const field = await waitForVisible(
      this.driver,
      By.css('aside [data-testid^="editor-property-"][data-testid$="-input"]'),
    );
    const tagName = (await field.getTagName()).toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') {
      return (await field.getAttribute('value')) ?? '';
    }
    return (await field.getText()).trim();
  }

  async refreshAndWait(): Promise<void> {
    await this.driver.navigate().refresh();
    await waitForPageReady(this.driver);
    await waitForVisible(this.driver, By.css('[data-testid="editor-save-button"]'));
  }

  async waitForAnySaveTimestamp(): Promise<void> {
    await this.driver.wait(until.elementLocated(By.xpath("//span[contains(normalize-space(.), 'Last saved')]")), 15000);
  }

  async readBodyText(): Promise<string> {
    const body = await waitForVisible(this.driver, By.css('body'));
    return body.getText();
  }

  async openPublicSitePage(urlPath: string): Promise<void> {
    const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    await this.driver.get(`${this.env.siteUrl}${normalized}`);
    await waitForPageReady(this.driver);
  }

  async hasText(value: string): Promise<boolean> {
    const bodyText = await this.readBodyText();
    return bodyText.includes(value);
  }
}



