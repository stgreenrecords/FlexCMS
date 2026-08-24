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

  it('S5 keeps the editor toolbar clickable when a component positions itself fixed', async () => {
    // The site navigation renders `position: fixed; top: 0; z-index: 50`. Inside the
    // canvas that escapes its container and lays itself over the editor's own toolbar,
    // and REB-26 found it as Save becoming unclickable — an author could not save any
    // page holding a navigation component. The canvas now establishes a containing
    // block, so a component that pins itself to "the top" pins to its own slot.
    const d = driver as WebDriver;
    await d.get(
      `${env.adminUrl}/editor?path=` +
        encodeURIComponent('/experience-fragments/tut-usa/global/navigation/master'),
    );
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'The editor canvas never rendered the navigation component',
    );

    // A rendered fixed nav is the precondition; without it this proves nothing.
    const navs = await d.findElements(By.css('[data-canvas-resource-type] nav'));
    expect(navs.length, 'expected the navigation component to render a nav').to.be.greaterThan(0);

    const save = await waitForVisible(d, By.css('[data-testid="editor-save-button"]'));
    const box = await save.getRect();

    // Whatever sits at the Save button's centre must be the Save button itself.
    const owner = await d.executeScript<string>(
      `const el = document.elementFromPoint(arguments[0], arguments[1]);
       return el ? (el.closest('[data-testid="editor-save-button"]') ? 'save' : el.tagName + '.' + el.className) : 'none';`,
      Math.round(box.x + box.width / 2),
      Math.round(box.y + box.height / 2),
    );
    expect(owner, 'something is covering the Save button').to.equal('save');

    // And it must actually take the click.
    await save.click();
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

  it('S6 adds a component by dragging it from the palette onto the canvas', async () => {
    // Palette-to-canvas insertion had no scenario at all, which is why the gate stayed
    // green while it was completely broken: the palette's draggables sat outside the
    // editor's DndContext, so dragging one did nothing. Reordering components already on
    // the canvas kept working (REB-19 S7) because those live inside the context — the
    // passing test was the reason the outage looked fine.
    const d = driver as WebDriver;

    await d.get(`${env.adminUrl}/editor?path=${encodeURIComponent(`/${SITE_ID}/home`)}`);
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'the editor rendered no canvas to drop onto',
    );

    const canvasTypes = async (): Promise<string[]> => {
      const nodes = await d.findElements(By.css('[data-canvas-resource-type]'));
      const types: string[] = [];
      for (const node of nodes) types.push((await node.getAttribute('data-canvas-resource-type')) ?? '');
      return types;
    };

    const before = await canvasTypes();

    const tile = await waitForVisible(d, By.css('[data-testid^="editor-palette-item-"]'));
    const testId = (await tile.getAttribute('data-testid')) ?? '';
    // Derived from the tile rather than hardcoded, so the expectation follows whatever
    // the palette happens to offer first.
    const draggedSlug = testId.replace('editor-palette-item-', '');
    const canvas = await d.findElement(By.css('[data-canvas-resource-type]'));

    // A pointer drag, deliberately — the editor also inserts on click, and that path
    // worked throughout the outage, so a click-based assertion would have proved nothing.
    await d.actions({ async: true })
      .move({ origin: tile })
      .press()
      // dnd-kit's pointer sensor only starts once the activation distance is cleared.
      .move({ origin: tile, x: 8, y: 8 })
      .move({ origin: canvas, x: 0, y: -40 })
      .move({ origin: canvas, x: 0, y: 0 })
      .move({ origin: canvas, x: 0, y: 30 })
      .release()
      .perform();

    await d.wait(
      async () => (await canvasTypes()).length > before.length,
      15_000,
      'dragging from the palette added nothing — the palette draggables are probably '
        + 'outside the DndContext again',
    );

    const after = await canvasTypes();
    expect(after.length, 'the drag should add exactly one component').to.equal(before.length + 1);

    const normalise = (value: string) => value.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    expect(
      after.map(normalise).join(' | '),
      `the canvas did not gain the dragged component "${draggedSlug}"`,
    ).to.contain(normalise(draggedSlug));
  });

  it('S7 selects a component instead of following the links inside it', async () => {
    // A regression from putting the site's real renderers on the canvas: a CTA is now a
    // real anchor, so clicking one navigated out of the editor and took unsaved work with
    // it. In edit mode a click belongs to the editor — it should select the component and
    // open its properties. Links stay live in /preview and on the published site.
    const d = driver as WebDriver;

    await d.get(`${env.adminUrl}/editor?path=${encodeURIComponent(`/${SITE_ID}/home`)}`);
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'the editor rendered no components',
    );

    const editorUrl = await d.getCurrentUrl();

    // Find a component that really does contain an anchor with a destination, or this
    // proves nothing.
    const anchors = await d.findElements(By.css('[data-canvas-resource-type] a[href]'));
    expect(anchors.length, 'no component on the canvas contains a link to click')
      .to.be.greaterThan(0);

    const anchorHref = await anchors[0].getAttribute('href');
    expect(anchorHref, 'the anchor has no destination').to.be.a('string').and.not.equal('');

    // Click the anchor's own position. `pointer-events: none` on the canvas means the
    // click lands on the wrapper that owns selection rather than on the link.
    await d.actions({ async: true }).move({ origin: anchors[0] }).click().perform();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(
      await d.getCurrentUrl(),
      `clicking a component link navigated away from the editor (to ${anchorHref})`,
    ).to.equal(editorUrl);

    // And the click did what an author expects: the properties panel is now bound to a
    // component rather than showing the empty prompt.
    const panel = await (await d.findElement(By.css('body'))).getText();
    expect(panel, 'clicking a component did not open its properties')
      .to.not.contain('Click a component on the canvas to edit its properties');

    // The canvas is inert, not invisible: the anchor is still rendered and still carries
    // its destination, so the WYSIWYG fidelity S4 asserts is unaffected.
    expect(await anchors[0].getAttribute('href'), 'the link lost its destination')
      .to.equal(anchorHref);
  });
});
