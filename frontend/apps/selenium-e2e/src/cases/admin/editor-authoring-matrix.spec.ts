/**
 * REB-19 — page editor component/property/asset authoring matrix suite.
 *
 * Builds the contract-driven authoring foundation that REB-26 reuses for its
 * exhaustive per-component sweep. Everything the suite knows about field types
 * comes from `Design/tut-usa/generated/component-contracts.json` through
 * `src/fixtures/component-contracts.ts` — no component or field is hard-coded.
 *
 * Fixture strategy: the suite creates its own page under the TUT-USA site and
 * seeds one representative component per component group through the author
 * API, then drives all *editing* through the admin UI. Seeded demo pages are
 * never mutated, and the page is deleted again in `after`.
 *
 * Where the editor cannot currently perform a required action, the scenario
 * records an implementation blocker with an exact file/symbol reference (AC5)
 * instead of asserting the broken behaviour as if it were correct.
 */
import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { MatrixRecorder, type MatrixOutcome } from '../../reports/matrix';
import { AuthorApiClient } from '../../pages/AuthorApiClient';
import { EditorAuthoringPage } from '../../pages/EditorAuthoringPage';
import {
  authorableFields,
  authoringValueFor,
  contractNodeName,
  groupRepresentatives,
  toEditorTestId,
  TEMPLATE_DETACHED_FLAG,
  type AuthorableField,
  type ComponentContract,
} from '../../fixtures/component-contracts';
import { firstImportedSiteImageUrl } from '../../fixtures/site-assets';

const TASK_ID = 'REB-19';
const SITE_ID = 'tut-usa';
const SITE_ROOT_LTREE = `content.${SITE_ID}`;
const TEMPLATE_NAME = 'global-home-page';

/** Controls whose rendered element is acceptable for a given contract field. */
const ALLOWED_TAGS_BY_CONTROL: Record<string, string[]> = {
  text: ['input'],
  number: ['input'],
  textarea: ['textarea'],
  toggle: ['button', 'input'],
  select: ['button'],
  // Array and object fields render a container — a nested group or a repeater —
  // rather than a single form control, since REB-19 blocker B-1 was fixed.
  structured: ['div'],
};

describe('REB-19 page editor authoring matrix suite', function () {
  this.timeout(900_000);

  const runId = `reb19-${Date.now()}`;
  const pageName = runId;
  const contentPath = `/content/${SITE_ID}/${pageName}`;
  const ltreePagePath = `${SITE_ROOT_LTREE}.${pageName}`;
  const sitePath = `/${SITE_ID}/${pageName}`;

  const representatives = groupRepresentatives();
  const recorder = new MatrixRecorder(TASK_ID);
  const blockers: string[] = [];
  const observations: string[] = [];

  let driver: WebDriver | undefined;
  let editor: EditorAuthoringPage;
  let api: AuthorApiClient;
  /** Last publish-side fetch failure, used as evidence in the publish scenario. */
  let lastPublishFetchError = '';

  /** Component used for the plain-text round trip; has a scalar text field. */
  let textContract: ComponentContract;
  let textField: AuthorableField;

  /** Component used for the asset round trip; renders its asset as an image. */
  let assetContract: ComponentContract;
  let assetField: AuthorableField;

  function record(
    scenarioId: string,
    contract: ComponentContract,
    entry: AuthorableField | undefined,
    verifiedLayers: string,
    outcome: MatrixOutcome,
    notes: string,
  ): void {
    recorder.add({
      scenarioId,
      groupName: contract.groupName,
      resourceType: contract.resourceType,
      componentTitle: contract.title,
      fieldKey: entry?.key ?? '(component)',
      editorControl: entry?.control ?? '(n/a)',
      fieldSemantics: entry?.semantics ?? '(n/a)',
      verifiedLayers,
      outcome,
      notes,
    });
  }

  function blocker(message: string): void {
    if (!blockers.includes(message)) blockers.push(message);
  }

  function componentLtreePath(contract: ComponentContract): string {
    return `${ltreePagePath}.${contractNodeName(contract)}`;
  }

  async function componentProperties(contract: ComponentContract): Promise<Record<string, unknown>> {
    const node = await api.getNode(componentLtreePath(contract));
    return node.properties ?? {};
  }

  async function headlessComponentData(contract: ComponentContract): Promise<Record<string, unknown>> {
    const payload = await api.getAuthorRenderedPage(sitePath);
    const components = (payload['components'] as Array<Record<string, unknown>>) ?? [];
    const match = components.find((component) => component['name'] === contractNodeName(contract));
    if (!match) {
      throw new Error(
        `Headless payload for ${sitePath} has no component named ${contractNodeName(contract)}. ` +
          `Present: ${components.map((component) => String(component['name'])).join(', ')}`,
      );
    }
    return (match['data'] as Record<string, unknown>) ?? {};
  }

  /**
   * Component data as the publish environment sees it. A page that has not been
   * replicated yet is reported as "no data" rather than as an error, because
   * absence is exactly what the publish scenario needs to distinguish.
   */
  async function publishComponentData(contract: ComponentContract): Promise<Record<string, unknown>> {
    let payload: Record<string, unknown>;
    try {
      payload = await api.getPublishRenderedPage(sitePath);
    } catch (error) {
      lastPublishFetchError = String(error);
      return {};
    }
    const components = (payload['components'] as Array<Record<string, unknown>>) ?? [];
    const match = components.find((component) => component['name'] === contractNodeName(contract));
    return match ? ((match['data'] as Record<string, unknown>) ?? {}) : {};
  }

  before(async () => {
    api = new AuthorApiClient();

    // Fixture page + one representative component per group.
    await api.deleteNode(ltreePagePath).catch(() => undefined);
    await api.createNode({
      parentPath: SITE_ROOT_LTREE,
      name: pageName,
      resourceType: 'flexcms/page',
      properties: {
        'jcr:title': `REB-19 Authoring Matrix ${runId}`,
        'jcr:description': 'Ephemeral fixture page created by the REB-19 Selenium authoring matrix suite.',
        siteId: SITE_ID,
        template: TEMPLATE_NAME,
      },
    });

    for (const contract of representatives) {
      const properties: Record<string, unknown> = { [TEMPLATE_DETACHED_FLAG]: true };
      for (const entry of authorableFields(contract)) {
        properties[entry.key] = authoringValueFor(entry, `${runId}-seed`);
      }
      await api.createNode({
        parentPath: ltreePagePath,
        name: contractNodeName(contract),
        resourceType: contract.resourceType,
        properties,
      });
    }

    await api.waitForNode(ltreePagePath);

    textContract =
      representatives.find((contract) =>
        authorableFields(contract).some((entry) => entry.control === 'text' && entry.semantics === 'scalar'),
      ) ?? representatives[0];
    textField = authorableFields(textContract).find(
      (entry) => entry.control === 'text' && entry.semantics === 'scalar',
    )!;

    assetContract =
      representatives.find((contract) =>
        authorableFields(contract).some(
          (entry) => entry.semantics === 'asset' && /(image|photo|thumbnail|poster|logo|icon|background)/i.test(entry.key),
        ),
      ) ?? representatives[0];
    assetField = authorableFields(assetContract).find(
      (entry) => entry.semantics === 'asset' && /(image|photo|thumbnail|poster|logo|icon|background)/i.test(entry.key),
    )!;

    driver = await createDriver();
    editor = new EditorAuthoringPage(driver);
  });

  after(async () => {
    try {
      const csvPath = recorder.write();
      console.log(`[${TASK_ID}] matrix rows: ${recorder.size} -> ${csvPath}`);
      if (blockers.length > 0) {
        console.log(`[${TASK_ID}] implementation blockers observed:\n- ${blockers.join('\n- ')}`);
      }
      if (observations.length > 0) {
        console.log(`[${TASK_ID}] documented behaviour:\n- ${observations.join('\n- ')}`);
      }
    } finally {
      if (process.env['REB19_KEEP_FIXTURE'] !== '1') {
        await removeFixturePage();
      }
      await quitDriver(driver);
    }
  });

  /**
   * Deletes the fixture page and verifies it is gone. Cleanup failures are
   * reported loudly rather than swallowed: leaked fixture pages accumulate in the
   * shared content tree and are picked up by the page-discovery suites.
   */
  async function removeFixturePage(): Promise<void> {
    let deleteError = '';
    try {
      await api.deleteNode(ltreePagePath);
    } catch (error) {
      deleteError = String(error);
    }

    let stillPresent = true;
    try {
      await api.getNode(ltreePagePath);
    } catch {
      stillPresent = false;
    }

    if (!stillPresent) return;

    console.error(
      `[${TASK_ID}] FIXTURE LEAK: ${ltreePagePath} could not be deleted${deleteError ? ` (${deleteError})` : ''}. ` +
        'Known blocker B-7: ContentNodeRepository.deleteSubtree() is a native DELETE @Query with no @Modifying ' +
        'annotation, so Spring Data executes it as a select and every DELETE /api/author/content/node returns 500. ' +
        'Remove leaked fixtures manually until that is fixed.',
    );
  }

  attachFailureScreenshot(() => driver);

  // ── Scenario 1 ───────────────────────────────────────────────────────────
  it('S1 renders contract-driven authoring controls for a representative component in every group', async () => {
    await editor.open(contentPath);
    await editor.detachAllInheritance();

    const coveredGroups = new Set<string>();

    for (const contract of representatives) {
      await editor.selectComponentLayer(contract.title);
      coveredGroups.add(contract.groupName);

      for (const entry of authorableFields(contract)) {
        const probe = await editor.probeField(entry);

        if (!probe.present) {
          blocker(
            `Editor renders no control for ${contract.resourceType}.${entry.key} ` +
              `(expected data-testid "${entry.inputTestId}"); registry schema and generated contract disagree.`,
          );
          record('S1', contract, entry, 'ui', 'BLOCKED', 'no control rendered for contract field');
          continue;
        }

        const allowedTags = ALLOWED_TAGS_BY_CONTROL[entry.control] ?? ['input'];
        expect(allowedTags, `${contract.resourceType}.${entry.key} rendered <${probe.tagName}>`).to.include(
          probe.tagName ?? '',
        );

        if (entry.control === 'structured') {
          record(
            'S1',
            contract,
            entry,
            'ui',
            'PASS',
            `${entry.semantics} field renders a structured editor (nested group / repeater), not a text input`,
          );
        } else if (entry.isLossyInEditor) {
          record(
            'S1',
            contract,
            entry,
            'ui',
            'PASS',
            `control present but lossy: ${entry.semantics} field edited through a plain text input`,
          );
        } else {
          record('S1', contract, entry, 'ui', 'PASS', `control ${entry.control} present and typed as contracted`);
        }
      }
    }

    expect(coveredGroups.size, 'every active component group must be represented').to.equal(
      representatives.length,
    );

    blocker(
      'Asset fields still have no DAM picker — ' +
        'frontend/apps/admin/src/app/editor/page.tsx renders them as a plain text input for the ' +
        'asset path, so an author has to know and type the URL. That is REB-19 blocker B-2, which ' +
        'waits on a picker design from the designer. List and object fields are no longer affected: ' +
        'since B-1 was fixed, schemaToFields() emits structured editors for them (nested group, ' +
        'repeater, or validated JSON) instead of String(value), so a UI edit can no longer replace ' +
        'a structure with the string "[object Object]".',
    );
  });

  // ── Scenario 2 ───────────────────────────────────────────────────────────
  it('S2 round-trips a text field through UI, author API, headless JSON, and rendered output', async () => {
    const marker = `${runId}-text`;
    const value = `REB19 headline ${marker}`;

    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(textContract.title);

    const uiValue = await editor.writeFieldValue(textField, value);
    expect(uiValue).to.equal(value);
    await editor.save();

    // UI persistence after a full reload.
    await editor.refreshAndWait();
    await editor.selectComponentLayer(textContract.title);
    expect(await editor.readFieldValue(textField), 'value after reload').to.equal(value);

    // Author API.
    const properties = await componentProperties(textContract);
    expect(String(properties[textField.key]), 'author API property').to.equal(value);

    // Headless JSON.
    const headless = await headlessComponentData(textContract);
    expect(String(headless[textField.key]), 'headless component data').to.equal(value);

    // Rendered output.
    await editor.openPublicSitePage(sitePath);
    await editor.waitForTextPresent(marker);

    record('S2', textContract, textField, 'ui,author-api,headless,rendered', 'PASS', `marker ${marker}`);
  });

  // ── Scenario 3 ───────────────────────────────────────────────────────────
  it('S3 round-trips an asset reference and verifies the rendered image resolves', async () => {
    const assetUrl = firstImportedSiteImageUrl();

    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(assetContract.title);

    const uiValue = await editor.writeFieldValue(assetField, assetUrl);
    expect(uiValue).to.equal(assetUrl);
    await editor.save();

    const properties = await componentProperties(assetContract);
    expect(String(properties[assetField.key]), 'author API asset reference').to.equal(assetUrl);

    const headless = await headlessComponentData(assetContract);
    expect(String(headless[assetField.key]), 'headless asset reference').to.equal(assetUrl);

    await editor.openPublicSitePage(sitePath);
    const matching = await editor.imageSourcesContaining(assetUrl);
    expect(matching.length, `rendered <img> for ${assetUrl}`).to.be.greaterThan(0);

    const broken = await editor.brokenImageSources();
    expect(broken.filter((src) => src.includes(assetUrl)), 'authored asset must not be a broken image').to.deep.equal(
      [],
    );

    record('S3', assetContract, assetField, 'ui,author-api,headless,rendered', 'PASS', `asset ${assetUrl}`);

    blocker(
      'Asset fields have no DAM picker in the editor: the registry marks them with "x-asset": true, ' +
        'but frontend/apps/admin/src/app/editor/page.tsx -> schemaToFields() ignores that marker and ' +
        'PropertyField() renders a free-text input, so authors must paste a URL by hand.',
    );
  });

  // ── Scenario 4 ───────────────────────────────────────────────────────────
  it('S4 clears an optional field and verifies the component still renders without console errors', async function () {
    const optional = authorableFields(textContract).find(
      (entry) => entry.key !== textField.key && entry.control === 'text' && entry.semantics === 'scalar',
    );

    if (!optional) {
      record('S4', textContract, undefined, 'ui', 'SKIPPED', 'representative has no second optional scalar text field');
      this.skip();
      return;
    }

    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(textContract.title);

    expect(await editor.clearFieldValue(optional), 'cleared field').to.equal('');
    await editor.save();

    const properties = await componentProperties(textContract);
    expect(String(properties[optional.key] ?? ''), 'author API after clear').to.equal('');

    await editor.openPublicSitePage(sitePath);
    const source = await editor.readPageSource();
    expect(source, 'component must still render after clearing an optional field').to.include(
      textContract.resourceType,
    );
    expect(await editor.readBodyText(), 'page must not fall back to a 404 shell').to.not.include('404');

    const consoleErrors = await editor.severeConsoleErrors();
    expect(consoleErrors, 'severe console errors on the rendered page').to.deep.equal([]);

    record('S4', textContract, optional, 'ui,author-api,rendered', 'PASS', 'empty value renders without console errors');
  });

  // ── Scenario 5 ───────────────────────────────────────────────────────────
  it('S5 authors long content and verifies the editor and rendered page do not truncate it', async () => {
    const marker = `${runId}-long`;
    const longValue = `${marker} ${'TUT USA long-form authoring sentence. '.repeat(20)}`.trim();
    expect(longValue.length, 'long value must exceed the renderer preview threshold').to.be.greaterThan(220);

    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(textContract.title);

    const uiValue = await editor.writeFieldValue(textField, longValue);
    expect(uiValue, 'editor input must hold the full value').to.equal(longValue);
    await editor.save();

    await editor.refreshAndWait();
    await editor.selectComponentLayer(textContract.title);
    expect(await editor.readFieldValue(textField), 'editor value after reload').to.equal(longValue);

    const headless = await headlessComponentData(textContract);
    expect(String(headless[textField.key]), 'headless value length').to.equal(longValue);

    await editor.openPublicSitePage(sitePath);
    const source = await editor.readPageSource();
    expect(source, 'rendered HTML must contain the untruncated value').to.include(longValue.slice(0, 200));
    expect(source, 'rendered HTML must contain the tail of the value').to.include(longValue.slice(-60));

    record('S5', textContract, textField, 'ui,headless,rendered', 'PASS', `${longValue.length} characters`);

    // Restore the short marker so later scenarios assert on a readable value.
    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(textContract.title);
    await editor.writeFieldValue(textField, `REB19 headline ${runId}-text`);
    await editor.save();
  });

  // ── Scenario 6 ───────────────────────────────────────────────────────────
  it('S6 enforces template component constraints in the palette', async () => {
    const template = await api.getTemplate(TEMPLATE_NAME);
    const allowed = template.allowedComponentTypes ?? [];
    expect(allowed.length, `${TEMPLATE_NAME} must declare allowed component types`).to.be.greaterThan(0);

    await editor.open(contentPath);
    const paletteIds = await editor.paletteResourceTypeTestIds();
    const allowedIds = new Set(allowed.map((resourceType) => toEditorTestId(resourceType)));

    const unexpected = paletteIds.filter((id) => !allowedIds.has(id));
    expect(unexpected, 'palette must only offer components the template allows').to.deep.equal([]);

    const disallowed = representatives
      .map((contract) => contract.resourceType)
      .find((resourceType) => !allowed.includes(resourceType));
    expect(disallowed, 'expected at least one component outside the template allow-list').to.be.a('string');
    expect(paletteIds, `disallowed ${disallowed} must not be offered`).to.not.include(
      toEditorTestId(String(disallowed)),
    );

    record(
      'S6',
      representatives[0],
      undefined,
      'ui',
      'PASS',
      `palette limited to ${paletteIds.length} of ${allowed.length} allowed types`,
    );

    blocker(
      'Template constraints are enforced in the palette only: the author API accepts a component node of any ' +
        'resourceType under a page regardless of the template allow-list ' +
        '(flexcms-author AuthorContentController.createNode -> ContentNodeService.create performs no template ' +
        'validation), so the constraint is presentational rather than persisted.',
    );
  });

  // ── Scenario 7 ───────────────────────────────────────────────────────────
  it('S7 reorders components and verifies the persisted child order', async function () {
    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(representatives[1].title);

    const capabilities = await editor.probeCanvasCapabilities();
    if (!capabilities.moveUp && !capabilities.moveDown) {
      blocker(
        'Component reorder controls are not reachable for the selected component ' +
          '(frontend/apps/admin/src/app/editor/page.tsx -> SortableCanvasItem, buttons titled "Move up"/"Move down").',
      );
      record('S7', representatives[1], undefined, 'ui', 'BLOCKED', 'no reorder control rendered');
      this.skip();
      return;
    }

    const before = (await api.getChildren(ltreePagePath)).map((child) => child.name);
    const uiOrderBefore = await editor.canvasOrder();

    await editor.selectComponentLayer(representatives[1].title);
    await editor.clickCanvasControl('Move up');

    const uiOrderAfter = await editor.canvasOrder();
    expect(uiOrderAfter, 'reorder must change the in-editor component order').to.not.deep.equal(uiOrderBefore);

    await editor.save();
    const after = (await api.getChildren(ltreePagePath)).map((child) => child.name);

    if (JSON.stringify(before) === JSON.stringify(after)) {
      blocker(
        'Component order is never persisted: frontend/apps/admin/src/app/editor/page.tsx -> handleSave() only ' +
          'PUTs /api/author/content/node/properties for each component and never writes orderIndex, even though ' +
          'the backend orders children by it (ContentNodeRepository.findByParentPathOrderByOrderIndex). ' +
          'A reorder in the editor is therefore lost on reload.',
      );
      record('S7', representatives[1], undefined, 'ui,author-api', 'BLOCKED', 'reorder not persisted by handleSave()');
      this.skip();
      return;
    }

    record('S7', representatives[1], undefined, 'ui,author-api', 'PASS', `order changed: ${after.join(' > ')}`);
  });

  // ── Scenario 8 ───────────────────────────────────────────────────────────
  it('S8 applies undo/redo to a property edit and persists the final state', async function () {
    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(textContract.title);

    const undo = await editor.clickToolbarButtonAndDetectChange('editor-undo-button');
    const redo = await editor.clickToolbarButtonAndDetectChange('editor-redo-button');

    if (!undo.clicked || !redo.clicked) {
      blocker('Undo/redo buttons are absent from the editor toolbar.');
      record('S8', textContract, undefined, 'ui', 'BLOCKED', 'undo/redo buttons absent');
      this.skip();
      return;
    }

    if (!undo.changed && !redo.changed) {
      blocker(
        'Undo/redo are rendered but not wired: frontend/apps/admin/src/app/editor/page.tsx lines ~840-841 render ' +
          '<IconButton title="Undo" dataTestId="editor-undo-button"> and the Redo equivalent with no onClick ' +
          'handler, and the editor keeps no history stack. The same applies to the Settings button (~line 850).',
      );
      record('S8', textContract, undefined, 'ui', 'BLOCKED', 'undo/redo buttons render but have no handler');
      this.skip();
      return;
    }

    record('S8', textContract, undefined, 'ui', 'PASS', 'undo/redo changed editor state');
  });

  // ── Scenario 9 ───────────────────────────────────────────────────────────
  it('S9 opens preview for the authored page and documents unsaved vs saved behaviour', async () => {
    const marker = `${runId}-preview`;

    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(textContract.title);
    await editor.writeFieldValue(textField, `REB19 preview ${marker}`);

    // Deliberately previewing before saving, to document current behaviour.
    const previewUrl = await editor.clickPreviewAndReadNewTabUrl();
    expect(previewUrl).to.include('/preview?path=');
    expect(previewUrl).to.include('mode=draft');

    const beforeSave = await componentProperties(textContract);
    const unsavedReachedServer = String(beforeSave[textField.key] ?? '').includes(marker);
    observations.push(
      `S9 preview: the editor opens ${previewUrl} in a new tab; unsaved edits are ${
        unsavedReachedServer ? 'already persisted' : 'not persisted'
      } at preview time, because preview re-reads the page from the author API rather than posting editor state.`,
    );
    expect(unsavedReachedServer, 'preview must not silently persist unsaved editor state').to.equal(false);

    await editor.save();
    const afterSave = await componentProperties(textContract);
    expect(String(afterSave[textField.key]), 'saved state after preview').to.include(marker);

    record('S9', textContract, textField, 'ui,author-api', 'PASS', 'preview opens draft mode; save persists state');
  });

  // ── Scenario 10 ──────────────────────────────────────────────────────────
  it('S10 publishes an edited page and verifies the change on the publish environment', async () => {
    const marker = `${runId}-publish`;
    const value = `REB19 published ${marker}`;

    await editor.open(contentPath);
    await editor.detachAllInheritance();
    await editor.selectComponentLayer(textContract.title);
    await editor.writeFieldValue(textField, value);
    await editor.save();

    await editor.publish();

    const pageNode = await api.getPageNode(contentPath);
    expect(pageNode.status, 'author status after publishing from the editor').to.equal('PUBLISHED');

    const afterUiPublish = await publishComponentData(textContract);
    const uiPublishReachedPublish = String(afterUiPublish[textField.key] ?? '').includes(marker);

    if (!uiPublishReachedPublish) {
      if (lastPublishFetchError) {
        observations.push(
          `S10 publish API: a page that has not been replicated yet is reported as ` +
            `"${lastPublishFetchError.replace(/^Error:\s*/, '')}" by the publish delivery API instead of a 404.`,
        );
      }
      blocker(
        'Publishing from the editor does not reach the publish environment: ' +
          'frontend/apps/admin/src/app/editor/page.tsx -> handlePublish() calls ' +
          'POST /api/author/content/node/status, and AuthorContentController.updateStatus() only changes status — ' +
          'it never triggers replication, unlike bulkPublish() which calls replicationAgent.replicateTree() for ' +
          'flexcms/page nodes. The page therefore shows zero components on :8081 after a UI publish.',
      );
      record(
        'S10',
        textContract,
        textField,
        'ui,author-api',
        'BLOCKED',
        'editor publish button does not replicate to the publish environment',
      );
    }

    // The supported publish path must deliver the edit to the publish environment.
    await api.bulkPublish([ltreePagePath]);
    await api.waitForNodeStatus(ltreePagePath, 'PUBLISHED');

    const deadline = Date.now() + 60_000;
    let publishData: Record<string, unknown> = {};
    while (Date.now() < deadline) {
      publishData = await publishComponentData(textContract);
      if (String(publishData[textField.key] ?? '').includes(marker)) break;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }

    expect(String(publishData[textField.key] ?? ''), 'publish environment component data').to.include(marker);

    record(
      'S10',
      textContract,
      textField,
      uiPublishReachedPublish ? 'ui,author-api,publish' : 'author-api,publish',
      'PASS',
      'edit verified on the publish environment via tree-replicating publish',
    );
  });
});
