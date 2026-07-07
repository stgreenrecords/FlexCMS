import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForClickable, waitForPageReady, waitForVisible } from '../driver/waits';

export class EditorPage {
  private readonly env = loadEnv();

  constructor(private readonly driver: WebDriver) {}

  async open(contentPath: string): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/editor?path=${encodeURIComponent(contentPath)}`);
    await waitForPageReady(this.driver);
    await waitForVisible(this.driver, By.xpath("//button[normalize-space()='Save']"));
  }

  async clickPublish(): Promise<void> {
    const publishButton = await waitForClickable(this.driver, By.xpath("//button[normalize-space()='Publish']"));
    await publishButton.click();
  }

  async clickSave(): Promise<void> {
    const saveButton = await waitForClickable(this.driver, By.xpath("//button[normalize-space()='Save' or normalize-space()='Saving…']"));
    await saveButton.click();
  }

  async waitForPublishedFooter(): Promise<void> {
    await waitForVisible(this.driver, By.xpath("//span[normalize-space()='Published']"));
  }

  async openLayersTab(): Promise<void> {
    const layersTab = await waitForClickable(this.driver, By.xpath("//button[normalize-space()='Layers']"));
    await layersTab.click();
  }

  async selectFirstLockedLayer(): Promise<void> {
    await this.openLayersTab();
    const lockedLayer = await waitForClickable(
      this.driver,
      By.xpath("(//button[.//span[normalize-space()='Locked']])[1]"),
    );
    await lockedLayer.click();
  }

  async hasLockedLayer(): Promise<boolean> {
    await this.openLayersTab();
    const lockedLayers = await this.driver.findElements(By.xpath("(//button[.//span[normalize-space()='Locked']])"));
    return lockedLayers.length > 0;
  }

  async selectLayerByText(labelText: string): Promise<void> {
    await this.openLayersTab();
    const normalized = labelText.toLowerCase();
    const candidates = await this.driver.findElements(By.xpath("//button[.//span]"));
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
    const fields = await this.driver.findElements(
      By.xpath("(//aside//*[self::input or self::textarea or self::select][not(@disabled)])"),
    );
    return fields.length > 0;
  }

  async cancelInheritanceIfVisible(): Promise<boolean> {
    const buttons = await this.driver.findElements(By.css('[data-testid="cancel-inheritance-button"]'));
    if (buttons.length === 0) return false;

    await buttons[0].click();
    await this.driver.wait(async () => {
      const info = await this.driver.findElements(By.xpath("//p[contains(normalize-space(.), 'Inheritance canceled')]"));
      const error = await this.driver.findElements(By.xpath("//p[contains(normalize-space(.), 'Failed to cancel inheritance') or contains(normalize-space(.), 'Could not persist editable override') or contains(normalize-space(.), 'has no page node')]"));
      return info.length > 0 || error.length > 0;
    }, 20000);

    return true;
  }

  async updateFirstEditableTextField(suffix: string): Promise<string> {
    const field = await waitForVisible(
      this.driver,
      By.xpath("(//aside//*[self::input or self::textarea or self::select][not(@disabled)])[1]"),
    );

    const tagName = (await field.getTagName()).toLowerCase();
    if (tagName === 'select') {
      const option = await waitForVisible(this.driver, By.xpath("(//aside//select[not(@disabled)])[1]/option[last()]"));
      const optionValue = (await option.getAttribute('value')) ?? '';
      await field.sendKeys(optionValue);
      return optionValue;
    }

    const previousValue = (await field.getAttribute('value')) ?? '';
    const nextValue = `${previousValue} ${suffix}`.trim();
    await field.clear();
    await field.sendKeys(nextValue);
    return nextValue;
  }

  async readFirstEditableTextFieldValue(): Promise<string> {
    const field = await waitForVisible(
      this.driver,
      By.xpath("(//aside//*[self::input or self::textarea or self::select][not(@disabled)])[1]"),
    );
    return (await field.getAttribute('value')) ?? '';
  }

  async refreshAndWait(): Promise<void> {
    await this.driver.navigate().refresh();
    await waitForPageReady(this.driver);
    await waitForVisible(this.driver, By.xpath("//button[normalize-space()='Save']"));
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



