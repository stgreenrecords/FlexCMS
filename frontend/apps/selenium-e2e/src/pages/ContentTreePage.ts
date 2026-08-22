import { By, type WebDriver, type WebElement } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForClickable, waitForPageReady, waitForVisible } from '../driver/waits';

function escapeXPathLiteral(value: string): string {
  if (!value.includes("'")) {
    return `'${value}'`;
  }
  const parts = value.split("'").map((part) => `'${part}'`);
  return `concat(${parts.join(", \"'\", ")})`;
}

export class ContentTreePage {
  private readonly env = loadEnv();

  constructor(private readonly driver: WebDriver) {}

  async open(): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/content`);
    await waitForPageReady(this.driver);
    await waitForVisible(this.driver, By.xpath("//h1[normalize-space()='Content Tree']"));
    await this.waitUntilLoaded();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.driver.wait(async () => {
      const skeletonRows = await this.driver.findElements(By.xpath("//tbody//tr[.//div[contains(@style, 'width: 14px')]]"));
      return skeletonRows.length === 0;
    }, 20_000);
  }

  async readVisibleRowNames(): Promise<string[]> {
    const nameElements = await this.driver.findElements(
      By.xpath("//tbody/tr/td[2]//span[contains(@class,'font-semibold')]"),
    );
    const names: string[] = [];
    for (const el of nameElements) {
      const text = (await el.getText()).trim();
      if (text) names.push(text);
    }
    return names;
  }

  /**
   * Waits until the visible listing satisfies the given expectations, then returns it.
   *
   * `waitUntilLoaded()` only waits for skeleton rows to disappear, which does not
   * cover the gap between clicking a row and the new folder's `/children` fetch
   * resolving — during that gap the table still holds the *previous* folder's rows.
   * Asserting directly on `readVisibleRowNames()` after a navigation is therefore
   * racy, and an all-negative assertion can pass against the wrong folder entirely.
   *
   * @param expectPresent names that must all be listed
   * @param expectAbsent  names that none of which may be listed
   */
  async waitForRowNames(
    expectPresent: string[],
    expectAbsent: string[] = [],
    timeoutMs = 20_000,
  ): Promise<string[]> {
    let names: string[] = [];
    const satisfied = async (): Promise<boolean> => {
      names = await this.readVisibleRowNames();
      return (
        expectPresent.every((name) => names.includes(name)) &&
        expectAbsent.every((name) => !names.includes(name))
      );
    };

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await satisfied()) return names;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(
      `Timed out after ${timeoutMs} ms waiting for the content tree listing. ` +
        `Expected present [${expectPresent.join(', ')}] and absent [${expectAbsent.join(', ')}]; ` +
        `listing held [${names.join(', ')}]`,
    );
  }

  async readBodyText(): Promise<string> {
    const body = await waitForVisible(this.driver, By.css('body'));
    return body.getText();
  }

  async setSearch(value: string): Promise<void> {
    const input = await waitForVisible(this.driver, By.css('input[placeholder="Filter by name or URL..."]'));
    await input.clear();
    if (value) {
      await input.sendKeys(value);
    }
    await this.driver.sleep(300);
  }

  async clearSearch(): Promise<void> {
    await this.setSearch('');
  }

  async selectRowCheckboxByName(name: string): Promise<void> {
    const literal = escapeXPathLiteral(name);
    const checkbox = await waitForClickable(
      this.driver,
      By.xpath(`//tr[.//td[2]//span[normalize-space()=${literal}]]//input[@type='checkbox']`),
    );
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"});', checkbox);
    await this.driver.executeScript('arguments[0].click();', checkbox);
    await this.driver.wait(async () => {
      const checked = await checkbox.getAttribute('checked');
      return checked !== null;
    }, 5_000);
  }

  async uncheckRowCheckboxByName(name: string): Promise<void> {
    const literal = escapeXPathLiteral(name);
    const checkbox = await waitForClickable(
      this.driver,
      By.xpath(`//tr[.//td[2]//span[normalize-space()=${literal}]]//input[@type='checkbox']`),
    );
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"});', checkbox);
    await this.driver.executeScript('arguments[0].click();', checkbox);
    await this.driver.wait(async () => {
      const checked = await checkbox.getAttribute('checked');
      return checked === null;
    }, 5_000);
  }

  async toggleSelectAll(): Promise<void> {
    const checkbox = await waitForClickable(this.driver, By.css('input[aria-label="Select all items"]'));
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"});', checkbox);
    await this.driver.executeScript('arguments[0].click();', checkbox);
  }

  async readCheckedVisibleRowCount(): Promise<number> {
    const checkboxes = await this.driver.findElements(By.css('tbody tr input[type="checkbox"]'));
    let checkedCount = 0;
    for (const checkbox of checkboxes) {
      const checked = await checkbox.getAttribute('checked');
      if (checked !== null) {
        checkedCount += 1;
      }
    }
    return checkedCount;
  }

  async isRowCheckboxChecked(name: string): Promise<boolean> {
    const literal = escapeXPathLiteral(name);
    const checkbox = await waitForVisible(
      this.driver,
      By.xpath(`//tr[.//td[2]//span[normalize-space()=${literal}]]//input[@type='checkbox']`),
    );
    const checked = await checkbox.getAttribute('checked');
    return checked !== null;
  }

  async readSelectedCount(): Promise<number> {
    const selectedButtons = await this.driver.findElements(By.xpath("//button[contains(normalize-space(), ' selected')]"));
    if (selectedButtons.length === 0) return 0;
    const text = await selectedButtons[0].getText();
    const match = text.match(/(\d+)\s+selected/i);
    return match ? Number(match[1]) : 0;
  }

  async clickRowByName(name: string): Promise<void> {
    const literal = escapeXPathLiteral(name);
    const row = await waitForClickable(
      this.driver,
      By.xpath(`//tr[.//td[2]//span[normalize-space()=${literal}]]`),
    );
    await row.click();
    await this.waitUntilLoaded();
  }

  async clickNavigateUp(): Promise<void> {
    const button = await waitForClickable(this.driver, By.css('button[title="Up one level"]'));
    await button.click();
    await this.waitUntilLoaded();
  }

  async readBreadcrumbLabels(): Promise<string[]> {
    const items = await this.driver.findElements(
      By.xpath("//div[contains(@class,'rounded-lg') and .//button[@title='Up one level'] or .//span[contains(normalize-space(), 'Content')]]//*[self::button or self::span][.//svg]"),
    );
    const labels: string[] = [];
    for (const item of items) {
      const text = (await item.getText()).trim();
      if (text) {
        labels.push(text.replace(/\s+/g, ' '));
      }
    }
    return labels;
  }

  async readRowUrlPathByName(name: string): Promise<string> {
    const literal = escapeXPathLiteral(name);
    const cell = await waitForVisible(
      this.driver,
      By.xpath(`//tr[.//td[2]//span[normalize-space()=${literal}]]//td[4]//span`),
    );
    return (await cell.getText()).trim();
  }

  async openActionMenuByName(name: string): Promise<void> {
    const literal = escapeXPathLiteral(name);
    const button = await waitForClickable(
      this.driver,
      By.xpath(`//tr[.//td[2]//span[normalize-space()=${literal}]]//button[contains(@aria-label,'Actions for')]`),
    );
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await button.click();
      const isOpen = await this.driver.wait(async () => {
        const menuItems = await this.driver.findElements(By.xpath("//a[normalize-space()='Edit' or normalize-space()='Preview']"));
        return menuItems.length > 0;
      }, 1_500).catch(() => false);
      if (isOpen) {
        return;
      }
    }
    throw new Error(`Could not open action menu for row ${name}`);
  }

  async readActionHref(name: string, actionLabel: 'Edit' | 'Preview'): Promise<string> {
    await this.openActionMenuByName(name);
    const literal = escapeXPathLiteral(actionLabel);
    const anchor = await waitForVisible(
      this.driver,
      By.xpath(`//a[normalize-space()=${literal}]`),
    );
    return (await anchor.getAttribute('href')) ?? '';
  }

  async clickAction(name: string, actionLabel: 'Edit' | 'Preview'): Promise<void> {
    await this.openActionMenuByName(name);
    const literal = escapeXPathLiteral(actionLabel);
    const anchor = await waitForClickable(
      this.driver,
      By.xpath(`//a[normalize-space()=${literal}]`),
    );
    await anchor.click();
    await waitForPageReady(this.driver);
  }

  async waitForUrlContains(fragment: string): Promise<void> {
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      return url.includes(fragment);
    }, 20_000, `Timed out waiting for URL containing ${fragment}`);
  }

  async hasCreateNewPageButton(): Promise<boolean> {
    const buttons = await this.driver.findElements(By.xpath("//button[contains(normalize-space(), 'Create New Page') or contains(normalize-space(), '+ Create New Page')]"));
    return buttons.length > 0;
  }

  async openEditor(path: string): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/editor?path=${encodeURIComponent(path)}`);
    await waitForPageReady(this.driver);
    await waitForVisible(this.driver, By.css('[data-testid="editor-save-button"]'));
  }

  async openPreview(path: string): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/preview?path=${encodeURIComponent(path)}`);
    await waitForPageReady(this.driver);
  }

  async elementExists(locator: By): Promise<boolean> {
    const elements: WebElement[] = await this.driver.findElements(locator);
    return elements.length > 0;
  }
}

