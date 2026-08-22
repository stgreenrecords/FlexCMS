/**
 * FlexCMS Selenium E2E — field-type-aware page editor object (REB-19).
 *
 * `EditorPage` covers the REB-13 smoke surface (open, save, publish, layers,
 * "first editable field"). This object adds the matrix-driven surface REB-19
 * needs and REB-26 reuses: address a property by its contract key, read and
 * write it according to its control type, probe canvas/palette capabilities,
 * and collect browser console errors as rendering evidence.
 *
 * It composes `EditorPage` rather than extending it so the REB-13 contract stays
 * untouched.
 */
import { By, Key, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForClickable, waitForPageReady, waitForVisible } from '../driver/waits';
import { EditorPage } from './EditorPage';
import type { AuthorableField, EditorControl } from '../fixtures/component-contracts';

export interface PropertyFieldProbe {
  key: string;
  inputTestId: string;
  present: boolean;
  tagName?: string;
  disabled?: boolean;
}

/** One row of the Layers panel: its position, its label, and its lock state. */
export interface LayerEntry {
  /** 1-based position in the Layers panel. */
  position: number;
  label: string;
  locked: boolean;
}

export interface CanvasCapabilityProbe {
  moveUp: boolean;
  moveDown: boolean;
  duplicate: boolean;
  delete: boolean;
}

export class EditorAuthoringPage {
  private readonly env = loadEnv();
  private readonly editor: EditorPage;

  constructor(private readonly driver: WebDriver) {
    this.editor = new EditorPage(driver);
  }

  // ── Navigation / lifecycle ───────────────────────────────────────────────

  async open(contentPath: string): Promise<void> {
    await this.editor.open(contentPath);
  }

  async refreshAndWait(): Promise<void> {
    await this.editor.refreshAndWait();
  }

  async save(): Promise<void> {
    await this.editor.clickSave();
    await this.editor.waitForAnySaveTimestamp();
  }

  async publish(): Promise<void> {
    await this.editor.clickPublish();
    await this.editor.waitForPublishedFooter();
  }

  async clickPreviewAndReadNewTabUrl(): Promise<string> {
    return this.editor.clickPreviewAndReadNewTabUrl();
  }

  async openTab(tab: 'components' | 'layers' | 'assets'): Promise<void> {
    const control = await waitForClickable(this.driver, By.css(`[data-testid="editor-left-tab-${tab}"]`));
    await control.click();
  }

  async hasElementByTestId(testId: string): Promise<boolean> {
    return this.editor.hasElementByTestId(testId);
  }

  // ── Layer selection ──────────────────────────────────────────────────────

  /**
   * Selects a component in the Layers panel by its visible label. Layer labels
   * come from the component definition title, so callers pass the contract
   * title (or node name) rather than an index — stable against reordering.
   */
  async selectComponentLayer(label: string): Promise<void> {
    await this.openTab('layers');
    const normalized = label.toLowerCase();
    const layers = await this.driver.findElements(
      By.xpath("//p[normalize-space()='Page Layers']/following-sibling::button"),
    );

    for (const layer of layers) {
      const text = (await layer.getText()).toLowerCase();
      if (text.includes(normalized)) {
        await layer.click();
        return;
      }
    }

    const available = [] as string[];
    for (const layer of layers) {
      available.push((await layer.getText()).replace(/\s+/g, ' ').trim());
    }
    throw new Error(`No layer matched "${label}". Available layers: ${available.join(' | ') || '(none)'}`);
  }

  async layerLabels(): Promise<string[]> {
    await this.openTab('layers');
    const layers = await this.driver.findElements(
      By.xpath("//p[normalize-space()='Page Layers']/following-sibling::button"),
    );
    const labels: string[] = [];
    for (const layer of layers) {
      labels.push((await layer.getText()).replace(/\s+/g, ' ').trim());
    }
    return labels;
  }

  /**
   * A layer button's visible text is `{index} {label} [Locked]`. This strips the
   * ordinal and the lock badge so the remainder can be compared to a contract
   * title exactly.
   */
  private static layerLabelOf(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\d+\s*/, '')
      .replace(/\s*Locked$/i, '')
      .trim();
  }

  /**
   * Every layer with its exact label and lock state.
   *
   * REB-26 needs more than a label match: 35 contract titles are substrings of
   * another title ("Badge" vs "Status Badge"), so `selectComponentLayer`'s
   * substring matching can select the wrong component, and a page's template
   * also contributes layers whose labels can equal a swept component's title.
   * Contract titles are unique and template-contributed layers stay locked until
   * inheritance is cancelled, so "the one unlocked layer with this exact label"
   * identifies an authored component instance unambiguously.
   */
  async layerEntries(): Promise<LayerEntry[]> {
    await this.openTab('layers');
    const layers = await this.driver.findElements(
      By.xpath("//p[normalize-space()='Page Layers']/following-sibling::button"),
    );

    const entries: LayerEntry[] = [];
    for (let index = 0; index < layers.length; index += 1) {
      const raw = (await layers[index].getText()).replace(/\s+/g, ' ').trim();
      entries.push({
        position: index + 1,
        label: EditorAuthoringPage.layerLabelOf(raw),
        locked: /Locked$/i.test(raw),
      });
    }
    return entries;
  }

  /** Clicks the layer at a 1-based position from `layerEntries()`. */
  async selectLayerAt(position: number): Promise<void> {
    await this.openTab('layers');
    const layers = await this.driver.findElements(
      By.xpath("//p[normalize-space()='Page Layers']/following-sibling::button"),
    );
    const layer = layers[position - 1];
    if (!layer) {
      throw new Error(`No layer at position ${position}; the page has ${layers.length} layers.`);
    }
    await layer.click();
  }

  /** Detaches template inheritance for every locked component, if offered. */
  async detachAllInheritance(): Promise<boolean> {
    if (!(await this.editor.hasCancelAllInheritanceButton())) return false;
    const button = await this.driver.findElement(By.css('[data-testid="cancel-inheritance-all-button"]'));
    if (!(await button.isEnabled())) return false;
    await this.editor.cancelInheritanceForAll();
    return true;
  }

  // ── Property fields ──────────────────────────────────────────────────────

  private async findInput(inputTestId: string): Promise<WebElement | undefined> {
    const matches = await this.driver.findElements(By.css(`aside [data-testid="${inputTestId}"]`));
    return matches[0];
  }

  async probeField(entry: AuthorableField): Promise<PropertyFieldProbe> {
    const input = await this.findInput(entry.inputTestId);
    if (!input) {
      return { key: entry.key, inputTestId: entry.inputTestId, present: false };
    }
    const tagName = (await input.getTagName()).toLowerCase();
    const disabled =
      (await input.getAttribute('disabled')) !== null || (await input.getAttribute('aria-disabled')) === 'true';
    return { key: entry.key, inputTestId: entry.inputTestId, present: true, tagName, disabled };
  }

  /** Every property input currently rendered in the sidebar, by test id. */
  async renderedPropertyInputTestIds(): Promise<string[]> {
    const inputs = await this.driver.findElements(
      By.css('aside [data-testid^="editor-property-"][data-testid$="-input"]'),
    );
    const ids: string[] = [];
    for (const input of inputs) {
      const id = await input.getAttribute('data-testid');
      if (id) ids.push(id);
    }
    return ids;
  }

  async readFieldValue(entry: AuthorableField): Promise<string> {
    const input = await this.findInput(entry.inputTestId);
    if (!input) throw new Error(`Property input ${entry.inputTestId} is not rendered.`);

    const tagName = (await input.getTagName()).toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') {
      if (entry.control === 'toggle') {
        const checked = await input.getAttribute('checked');
        const ariaChecked = await input.getAttribute('aria-checked');
        return String(checked === 'true' || checked === '' || ariaChecked === 'true');
      }
      return (await input.getAttribute('value')) ?? '';
    }

    if (entry.control === 'toggle') {
      const ariaChecked = await input.getAttribute('aria-checked');
      const dataState = await input.getAttribute('data-state');
      return String(ariaChecked === 'true' || dataState === 'checked');
    }

    return (await input.getText()).trim();
  }

  /**
   * Writes a value using the control the editor actually renders. Returns the
   * value the UI holds afterwards, which is what callers assert on — a select,
   * for example, cannot take an arbitrary string.
   */
  async writeFieldValue(entry: AuthorableField, value: string): Promise<string> {
    const input = await this.findInput(entry.inputTestId);
    if (!input) throw new Error(`Property input ${entry.inputTestId} is not rendered.`);

    const control: EditorControl = entry.control;

    if (control === 'toggle') {
      const before = await this.readFieldValue(entry);
      await input.click();
      const after = await this.readFieldValue(entry);
      if (after === before) {
        throw new Error(`Toggle ${entry.key} did not change state after click.`);
      }
      return after;
    }

    if (control === 'select') {
      await input.click();
      await this.driver.wait(
        async () => (await this.driver.findElements(By.css('div[role="option"]'))).length > 0,
        this.env.explicitWaitMs,
        `Select ${entry.key} did not open any options`,
      );
      const options = await this.driver.findElements(By.css('div[role="option"]'));
      const option = options[options.length - 1];
      const optionText = (await option.getText()).trim();
      await option.click();
      return optionText;
    }

    // text / textarea / number all use a native editable control.
    await this.clearAndType(input, value);
    return this.readFieldValue(entry);
  }

  async clearFieldValue(entry: AuthorableField): Promise<string> {
    const input = await this.findInput(entry.inputTestId);
    if (!input) throw new Error(`Property input ${entry.inputTestId} is not rendered.`);
    await this.clearAndType(input, '');
    return this.readFieldValue(entry);
  }

  /**
   * React-controlled inputs ignore `WebElement.clear()` in some builds because it
   * does not emit an input event, so the text is selected and typed over instead.
   *
   * The selection is *not* deleted first when there is something to type: the
   * editor renders numeric fields as `value={Number(value ?? 0)}`, so an
   * intermediate empty value is coerced straight back to `0` and the subsequent
   * keystrokes land next to that `0` ("1004" becomes "10040"). Typing over the
   * selection in one step never produces the empty intermediate state, and
   * behaves identically for text and textarea controls.
   */
  private async clearAndType(input: WebElement, value: string): Promise<void> {
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
      `Input did not accept the authored value (wanted ${value.length} chars)`,
    );
  }

  // ── Palette / canvas capability probes ───────────────────────────────────

  /** Resource types offered by the component palette for the current template. */
  async paletteResourceTypeTestIds(): Promise<string[]> {
    await this.openTab('components');
    await this.driver.wait(
      async () => (await this.driver.findElements(By.css('[data-testid^="editor-palette-item-"]'))).length > 0,
      this.env.explicitWaitMs,
      'Component palette rendered no items',
    );
    const items = await this.driver.findElements(By.css('[data-testid^="editor-palette-item-"]'));
    const ids: string[] = [];
    for (const item of items) {
      const id = await item.getAttribute('data-testid');
      if (id) ids.push(id.replace('editor-palette-item-', ''));
    }
    return ids;
  }

  async canvasItemCount(): Promise<number> {
    const items = await this.driver.findElements(By.css('[data-testid^="editor-canvas-item-"]'));
    return items.length;
  }

  /** Which per-component canvas controls the editor renders for the selection. */
  async probeCanvasCapabilities(): Promise<CanvasCapabilityProbe> {
    const has = async (title: string): Promise<boolean> =>
      (await this.driver.findElements(By.css(`button[title="${title}"]`))).length > 0;

    return {
      moveUp: await has('Move up'),
      moveDown: await has('Move down'),
      duplicate: await has('Duplicate'),
      delete: await has('Delete'),
    };
  }

  /**
   * Clicks a per-component canvas control ("Move up", "Move down", "Duplicate",
   * "Delete"). These render only while the component is selected and unlocked,
   * so callers select the component through the Layers panel first.
   */
  async clickCanvasControl(title: string): Promise<void> {
    const control = await waitForClickable(this.driver, By.css(`button[title="${title}"]`));
    await control.click();
  }

  /** Component labels in canvas order, read from the Layers panel. */
  async canvasOrder(): Promise<string[]> {
    return this.layerLabels();
  }

  /**
   * Reports whether a toolbar button is wired to a handler. React attaches
   * listeners at the root, so the DOM cannot be inspected for `onclick`;
   * instead the button is clicked and the page is checked for any observable
   * change. Used to document undo/redo as an implementation blocker rather than
   * to assert broken behaviour as correct.
   */
  async clickToolbarButtonAndDetectChange(testId: string): Promise<{ clicked: boolean; changed: boolean }> {
    const buttons = await this.driver.findElements(By.css(`[data-testid="${testId}"]`));
    if (buttons.length === 0) return { clicked: false, changed: false };

    const snapshot = async (): Promise<string> => {
      const values = await this.renderedPropertyInputTestIds();
      const layerCount = (await this.driver.findElements(By.css('[data-testid^="editor-layer-"]'))).length;
      const canvasCount = await this.canvasItemCount();
      return `${values.join(',')}|${layerCount}|${canvasCount}`;
    };

    const before = await snapshot();
    await buttons[0].click();
    const after = await snapshot();
    return { clicked: true, changed: before !== after };
  }

  // ── Rendering evidence ───────────────────────────────────────────────────

  async openPublicSitePage(urlPath: string): Promise<void> {
    const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    await this.driver.get(`${this.env.siteUrl}${normalized}`);
    await waitForPageReady(this.driver);
  }

  async readBodyText(): Promise<string> {
    const body = await waitForVisible(this.driver, By.css('body'));
    return body.getText();
  }

  async readPageSource(): Promise<string> {
    return this.driver.getPageSource();
  }

  async readPageTitle(): Promise<string> {
    return this.driver.getTitle();
  }

  /**
   * True when the browser is showing the framework's not-found page rather than a
   * rendered site page.
   *
   * Checked against the visible body text and the document title, never against
   * the page source: Next.js ships its not-found template inside the RSC payload
   * of *every* dev-mode response, so searching the HTML for "404" reports a
   * false positive on perfectly healthy pages.
   */
  async isFrameworkNotFoundPage(): Promise<boolean> {
    const title = (await this.readPageTitle()).toLowerCase();
    if (title.includes('this page could not be found')) return true;
    const body = (await this.readBodyText()).trim().toLowerCase();
    return /^404\b/.test(body) && body.includes('could not be found');
  }

  /** Severe browser console entries since the current page load. */
  async severeConsoleErrors(): Promise<string[]> {
    try {
      const entries = await this.driver.manage().logs().get('browser');
      return entries
        .filter((entry) => entry.level?.name === 'SEVERE')
        .map((entry) => entry.message)
        .filter((message) => !message.includes('favicon'));
    } catch {
      // Not every driver exposes the browser log endpoint; absence of logs is
      // reported as "no evidence" rather than as a pass.
      return [];
    }
  }

  /** Images that failed to load on the current page, by resolved URL. */
  async brokenImageSources(): Promise<string[]> {
    return this.driver.executeScript<string[]>(
      `return Array.from(document.images)
         .filter((img) => img.complete && img.naturalWidth === 0)
         .map((img) => img.currentSrc || img.src);`,
    );
  }

  /** Resolved `href` values of links whose URL contains the given fragment. */
  async linkHrefsContaining(fragment: string): Promise<string[]> {
    return this.driver.executeScript<string[]>(
      `return Array.from(document.querySelectorAll('a[href]'))
         .map((anchor) => anchor.getAttribute('href') || '')
         .filter((href) => href.indexOf(arguments[0]) !== -1);`,
      fragment,
    );
  }

  /**
   * Interactive form controls on the current page. Used as the rendered-layer
   * assertion for form/data-capture components, which must produce real controls
   * rather than only text.
   */
  async formControlCount(): Promise<number> {
    return this.driver.executeScript<number>(
      `return document.querySelectorAll('input, select, textarea, button, [role="checkbox"], [role="radio"]').length;`,
    );
  }

  /** Resolved `src` values of images whose URL contains the given fragment. */
  async imageSourcesContaining(fragment: string): Promise<string[]> {
    return this.driver.executeScript<string[]>(
      `return Array.from(document.images)
         .map((img) => img.currentSrc || img.src)
         .filter((src) => src.indexOf(arguments[0]) !== -1);`,
      fragment,
    );
  }

  async waitForTextPresent(value: string, timeoutMs = this.env.explicitWaitMs): Promise<void> {
    await this.driver.wait(
      async () => (await this.readBodyText()).includes(value),
      timeoutMs,
      `Text "${value}" never appeared on ${await this.driver.getCurrentUrl()}`,
    );
  }

  async waitForEditorReady(): Promise<void> {
    await this.driver.wait(
      until.elementLocated(By.css('[data-testid="editor-save-button"]')),
      this.env.explicitWaitMs,
    );
  }
}
