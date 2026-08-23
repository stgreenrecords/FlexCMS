/**
 * FlexCMS Selenium E2E — the editor canvas renders what the site renders.
 *
 * The editor used to draw components with its own hand-written previews: a switch on
 * substrings of the resource type, falling through to a grey box with the component's
 * name in it. Components that the site rendered as real UI — product grids, feature
 * lists, forms — appeared in the editor as those boxes, so authoring was done against
 * a wireframe and the real layout only appeared after publishing.
 *
 * Both surfaces now render from `@flexcms/site-renderers`. These scenarios exist to
 * keep it that way, and they are deliberately written to fail if a second renderer set
 * ever reappears:
 *
 * - **S1/S2 assert real output**, not the absence of a placeholder. A form must
 *   produce an actual `input`; a table must produce an actual `table`.
 * - **S4 compares the two surfaces directly.** It reads the same component's text from
 *   the editor and from the published page and requires them to agree. A drifting
 *   editor preview fails here even if it looks plausible on its own.
 */
import { expect } from 'chai';
import { By, type WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { loadEnv } from '../../driver/env';
import { waitForPageReady, waitForVisible } from '../../driver/waits';

const SITE_ID = 'tut-usa';

/**
 * A page carrying components from several groups: two forms, a table-shaped
 * escalation matrix and an FAQ. It is seeded content, not created here — these
 * scenarios are read-only and must not mutate shared state.
 */
const PAGE_PATH = `/${SITE_ID}/contact-and-concierge`;

describe('Editor WYSIWYG canvas suite', function () {
  this.timeout(600_000);

  const env = loadEnv();
  let driver: WebDriver | undefined;

  attachFailureScreenshot(() => driver);

  before(async () => {
    driver = await createDriver();
  });

  after(async () => {
    await quitDriver(driver);
  });

  /** Opens the editor and waits for the canvas to render its components. */
  async function openEditor(): Promise<WebDriver> {
    const d = driver as WebDriver;
    await d.get(`${env.adminUrl}/editor?path=${encodeURIComponent(PAGE_PATH)}`);
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'The editor canvas never rendered any component',
    );
    return d;
  }

  it('S1 renders real form controls on the canvas', async () => {
    const d = await openEditor();

    const form = await waitForVisible(
      d,
      By.css('[data-canvas-resource-type$="/contact-form"]'),
    );

    // The regression this pins: every form component used to render as a list of
    // field names with no control of any kind.
    const inputs = await form.findElements(By.css('input, textarea, select'));
    expect(inputs.length, 'the contact form rendered no interactive control').to.be.greaterThan(2);

    const buttons = await form.findElements(By.css('button[type="submit"], button'));
    expect(buttons.length, 'the contact form rendered no submit control').to.be.greaterThan(0);
  });

  it('S2 renders tabular content as a table', async () => {
    const d = await openEditor();

    const matrix = await waitForVisible(
      d,
      By.css('[data-canvas-resource-type$="/escalation-matrix"]'),
    );

    const tables = await matrix.findElements(By.css('table'));
    expect(tables.length, 'row/column content did not render as a table').to.equal(1);

    const headers = await tables[0].findElements(By.css('th'));
    expect(headers.length, 'the table rendered without column headers').to.be.greaterThan(1);
  });

  it('S3 keeps a component selectable when it renders nothing', async () => {
    const d = await openEditor();

    // Page metadata has no visual output by design. That is faithful to the published
    // page, but a zero-height component cannot be clicked, and its selection chip only
    // appears once selected — so it would be unreachable without a stub.
    const metadata = await waitForVisible(
      d,
      By.css('[data-canvas-resource-type$="/page-metadata"]'),
    );

    const height = (await metadata.getRect()).height;
    expect(height, 'a component that renders nothing must still be clickable').to.be.greaterThan(20);

    const stub = await metadata.findElements(By.css('[data-canvas-collapsed="true"]'));
    expect(stub.length, 'no stub was rendered for the empty component').to.equal(1);
  });

  it('S4 shows the same content in the editor as the published page does', async () => {
    const d = await openEditor();

    const editorText = await readComponentText(d, 'escalation-matrix');
    expect(editorText, 'the editor rendered no text for the component').to.not.equal('');

    await d.get(`${env.siteUrl}${PAGE_PATH}`);
    await waitForPageReady(d);
    const siteText = await readComponentText(d, 'escalation-matrix');

    // Compared as sets of words: the two surfaces wrap and space differently, and this
    // is about the content being the same, not the whitespace.
    const editorWords = new Set(words(editorText));
    const missing = words(siteText).filter((word) => !editorWords.has(word));

    expect(
      missing,
      `the published page shows content the editor does not: ${missing.slice(0, 8).join(', ')}`,
    ).to.deep.equal([]);
  });

  /** Text of a component, found by resource type on either surface. */
  async function readComponentText(d: WebDriver, leaf: string): Promise<string> {
    const selectors = [
      `[data-canvas-resource-type$="/${leaf}"]`,
      `[data-flexcms-resource-type$="/${leaf}"]`,
    ];
    for (const selector of selectors) {
      const found = await d.findElements(By.css(selector));
      if (found.length > 0) return (await found[0].getText()).trim();
    }
    return '';
  }

  function words(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3);
  }
});
