/**
 * FlexCMS Selenium E2E — admin Workflow Inbox page object (REB-20).
 *
 * The workflows page at `/workflows` renders one card per workflow instance it
 * receives from `GET /api/author/workflow/for-user`. Two behaviours of that page
 * shape every assertion here, and both are properties of the product rather than
 * of this page object:
 *
 * - **The inbox only ever shows ACTIVE instances.** `WorkflowEngine.listForUser`
 *   ignores its `userId` argument and returns `findByStatus(ACTIVE, ...)`, so a
 *   cancelled or completed workflow disappears from the page entirely instead of
 *   moving to another tab. "Card gone" is therefore the correct assertion for a
 *   cancelled workflow, not "card moved to Rejected".
 * - **The card identifies its content by ltree path.** Each card's description is
 *   rendered as `Content path: {contentPath}`, and the workflow API stores the
 *   path exactly as it was passed in, which is the ltree form.
 */
import { By, type WebDriver } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForClickable, waitForPageReady, waitForVisible } from '../driver/waits';

/** Tabs the page renders. `Pending` carries a live count in its label. */
export type WorkflowTab = 'Pending' | 'Approved' | 'Rejected';

export class WorkflowsPage {
  private readonly env = loadEnv();

  constructor(private readonly driver: WebDriver) {}

  async open(): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/workflows`);
    await waitForPageReady(this.driver);
    await waitForVisible(this.driver, By.xpath("//h1[normalize-space()='Workflow Inbox']"));
    await this.waitUntilLoaded();
  }

  /** Waits for the inbox fetch to settle, i.e. for the loading state to clear. */
  async waitUntilLoaded(): Promise<void> {
    await this.driver.wait(async () => {
      const body = await this.readBodyText();
      return !body.includes('Loading');
    }, 20_000, 'Workflow inbox never finished loading');
  }

  async readBodyText(): Promise<string> {
    const body = await waitForVisible(this.driver, By.css('body'));
    return (await body.getText()).trim();
  }

  /**
   * Clicks a tab. The Pending tab's label carries a count (`Pending (3)`), so it
   * is matched on its prefix rather than on equality.
   */
  async selectTab(tab: WorkflowTab): Promise<void> {
    const button = await waitForClickable(
      this.driver,
      By.xpath(`//button[starts-with(normalize-space(), '${tab}')]`),
    );
    await button.click();
    await this.waitUntilLoaded();
  }

  /** Every `Content path: …` line currently rendered, in page order. */
  async readContentPaths(): Promise<string[]> {
    const elements = await this.driver.findElements(
      By.xpath("//*[starts-with(normalize-space(), 'Content path:')]"),
    );
    const paths: string[] = [];
    for (const element of elements) {
      const text = (await element.getText()).trim();
      const match = /^Content path:\s*(.+)$/.exec(text);
      if (match) paths.push(match[1].trim());
    }
    return paths;
  }

  /** Whether the inbox currently lists a card for this ltree content path. */
  async hasWorkflowForPath(contentLtreePath: string): Promise<boolean> {
    return (await this.readContentPaths()).includes(contentLtreePath);
  }

  /**
   * Polls the inbox — reloading it — until a card for `contentLtreePath` is
   * present or absent as required. The page fetches once on mount, so a reload is
   * the only way to pick up a change made through the API.
   */
  async waitForWorkflowPresence(
    contentLtreePath: string,
    shouldBePresent: boolean,
    timeoutMs = 30_000,
  ): Promise<boolean> {
    const startedAt = Date.now();
    let present = false;
    while (Date.now() - startedAt < timeoutMs) {
      await this.open();
      present = await this.hasWorkflowForPath(contentLtreePath);
      if (present === shouldBePresent) return true;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    return false;
  }

  /** The count the Pending tab advertises in its own label. */
  async readPendingTabCount(): Promise<number> {
    const buttons = await this.driver.findElements(
      By.xpath("//button[starts-with(normalize-space(), 'Pending')]"),
    );
    if (buttons.length === 0) return -1;
    const label = (await buttons[0].getText()).trim();
    const match = /\((\d+)\)/.exec(label);
    return match ? Number(match[1]) : -1;
  }

  /** Labels of the tabs the page offers, for UI-surface evidence. */
  async readTabLabels(): Promise<string[]> {
    const buttons = await this.driver.findElements(
      By.xpath(
        "//button[starts-with(normalize-space(), 'Pending')" +
          " or normalize-space()='Approved' or normalize-space()='Rejected']",
      ),
    );
    const labels: string[] = [];
    for (const button of buttons) {
      labels.push((await button.getText()).trim());
    }
    return labels;
  }
}
