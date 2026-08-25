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

  it('S8 never offers a structured value as editable text', async () => {
    const dr = driver as WebDriver;

    // The seeded home page carries the case that exposed this: `product-grid.products`
    // stores objects while the registry declares an array of strings. The editor trusted
    // the declaration and put `[object Object]` in a text input, whose next keystroke
    // would have replaced a whole product with that literal string.
    //
    // The invariant is asserted across every component on the page rather than that one
    // field: any component whose data has drifted from its schema produces the same
    // hazard, and there are 419 registered components.
    await dr.get(`${env.adminUrl}/editor?path=${encodeURIComponent(`/${SITE_ID}/home`)}`);
    await waitForPageReady(dr);
    await dr.wait(
      async () => (await dr.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'the editor rendered no components',
    );

    const wrappers = await dr.findElements(By.css('[data-testid^="editor-canvas-item-"]'));
    expect(wrappers.length, 'no canvas components to inspect').to.be.greaterThan(0);

    const offenders: string[] = [];
    let inspected = 0;

    for (const wrapper of wrappers) {
      // Selection lives on the wrapper; the rendered content takes no pointer events.
      await dr.executeScript('arguments[0].scrollIntoView({block: "center"});', wrapper);
      try {
        await wrapper.click();
      } catch {
        continue; // Unselectable components are S3's concern, not this one.
      }
      inspected += 1;

      const found = (await dr.executeScript(
        `const bad = [];
         document.querySelectorAll('aside input, aside textarea').forEach((el) => {
           if ((el.value || '').includes('[object Object]')) {
             bad.push(el.getAttribute('data-testid') || 'unnamed input');
           }
         });
         document.querySelectorAll('aside').forEach((panel) => {
           if ((panel.innerText || '').includes('[object Object]')) bad.push('panel text');
         });
         return bad;`,
      )) as string[];

      const id = (await wrapper.getAttribute('data-testid')) ?? 'unknown';
      for (const field of found) offenders.push(`${id}: ${field}`);
    }

    expect(inspected, 'no component could be selected, so nothing was checked')
      .to.be.greaterThan(0);
    expect(
      offenders,
      'a structured value is being edited as text, so saving would replace it with the '
        + `string "[object Object]": ${offenders.slice(0, 5).join(' | ')}`,
    ).to.deep.equal([]);
  });

  it('S9 edits a nested value inside a list of objects without flattening it', async () => {
    const dr = driver as WebDriver;

    await dr.get(`${env.adminUrl}/editor?path=${encodeURIComponent(`/${SITE_ID}/home`)}`);
    await waitForPageReady(dr);
    await dr.wait(
      async () => (await dr.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'the editor rendered no components',
    );

    // Select the product grid, whose `products` is a list of objects.
    const wrapper = await waitForVisible(
      dr,
      By.xpath(
        '//*[@data-testid and starts-with(@data-testid, "editor-canvas-item-")]'
          + '[.//*[contains(@data-canvas-resource-type, "product-grid")]]',
      ),
    );
    await dr.executeScript('arguments[0].scrollIntoView({block: "center"});', wrapper);
    await wrapper.click();

    // The schema declares no item properties, so the fields are derived from the stored
    // objects. Their presence is what proves the list is editable field by field rather
    // than as one opaque blob.
    const labels = (await dr.executeScript(
      `return Array.from(document.querySelectorAll('aside label, aside span'))
         .map((e) => (e.textContent || '').trim())
         .filter((t) => t.length > 0 && t.length < 40);`,
    )) as string[];

    const upper = labels.map((l) => l.toUpperCase());
    for (const expected of ['PRODUCT NAME', 'PRICE', 'IMAGE']) {
      expect(
        upper.some((l) => l === expected),
        `the products list offers no "${expected}" field, so its objects are not editable`,
      ).to.equal(true);
    }

    // A numeric member must be a number input, not text — proof the derived type follows
    // the value rather than defaulting to a string.
    const numberInputs = (await dr.executeScript(
      `return document.querySelectorAll('aside input[type="number"]').length;`,
    )) as number;
    expect(numberInputs, 'no numeric field in the products list').to.be.greaterThan(0);

    // A nested object inside a list item must also be fields, not JSON. `cta` is
    // `{url, label}`, so both must appear as their own inputs.
    for (const nested of ['URL', 'LABEL']) {
      expect(
        upper.some((l) => l === nested),
        `the nested cta object offers no "${nested}" field, so it is still edited as a blob`,
      ).to.equal(true);
    }

    // And the panel must not be presenting raw JSON for the author to hand-edit. JSON is
    // the last resort for a value nothing can be derived from, not the normal editor.
    const looksLikeJson = (await dr.executeScript(
      `const asides = Array.from(document.querySelectorAll('aside'));
       const panel = asides[asides.length - 1];
       return /\{\s*"/.test(panel.innerText || '');`,
    )) as boolean;
    expect(
      looksLikeJson,
      'the properties panel is showing raw JSON where labelled fields could be derived',
    ).to.equal(false);
  });

  it('S10 shows an experience fragment as itself, not as a page with locked slots', async () => {
    const dr = driver as WebDriver;

    await dr.get(
      `${env.adminUrl}/editor?path=` +
        encodeURIComponent('/content/experience-fragments/tut-usa/global/navigation/master'),
    );
    await waitForPageReady(dr);
    await dr.wait(
      async () => (await dr.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'the fragment never rendered a component',
    );

    // The fragment's own component must occupy space. The navigation renders
    // `fixed top-0 z-50`, which is out of flow, so its slot collapsed to zero height: the
    // navbar was rendering correctly and the canvas still looked empty.
    const heights = (await dr.executeScript(
      `return Array.from(document.querySelectorAll('[data-canvas-resource-type]'))
         .map((el) => Math.round(el.getBoundingClientRect().height));`,
    )) as number[];
    expect(heights.length, 'no canvas component to measure').to.be.greaterThan(0);
    expect(
      Math.max(...heights),
      'the fragment rendered nothing with height — a fixed component is escaping the flow again',
    ).to.be.greaterThan(0);

    // The locked navigation/footer slots describe what a page inherits. On a fragment they
    // are meaningless, and the navigation one linked to the page being edited.
    const lockedSlots = (await dr.executeScript(
      `return Array.from(document.querySelectorAll('a'))
         .filter((a) => (a.textContent || '').includes('Edit in Experience Fragments'))
         .length;`,
    )) as number;
    expect(lockedSlots, 'a fragment is showing the locked slots that belong to a page')
      .to.equal(0);

    // And a page must still show them, so hiding them did not simply delete the feature.
    await dr.get(`${env.adminUrl}/editor?path=${encodeURIComponent(`/${SITE_ID}/home`)}`);
    await waitForPageReady(dr);
    await dr.wait(
      async () => (await dr.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'the page never rendered its components',
    );
    const pageSlots = (await dr.executeScript(
      `return Array.from(document.querySelectorAll('a'))
         .filter((a) => (a.textContent || '').includes('Edit in Experience Fragments'))
         .length;`,
    )) as number;
    expect(pageSlots, 'a page lost the locked navigation/footer slots').to.be.greaterThan(0);
  });
});
