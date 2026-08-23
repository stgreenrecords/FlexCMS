/**
 * REB-26 — exhaustive per-UI-component sample-site editing suite.
 *
 * Walks **every active component contract** in
 * `Design/tut-usa/generated/component-contracts.json` (406 at the time of
 * writing), authors it on a TUT-USA fixture page through the admin page editor,
 * and verifies the edit across every layer the platform exposes: the editor UI
 * after a reload, the author API, the headless delivery JSON, the rendered
 * reference site, and the publish environment.
 *
 * Nothing here knows anything about a specific component. Field types, editor
 * controls, sample values, and node names all come from the REB-19 contract model
 * in `src/fixtures/component-contracts.ts`, so the sweep stays correct when the
 * generated contracts change — the run reports the current count instead of
 * asserting a stale one.
 *
 * Design decisions worth knowing before changing this file:
 *
 * - **Batching.** The components are swept in batches of `REB26_BATCH_SIZE`
 *   (default 20), each batch recreating one reused fixture page. A single page
 *   holding 406 components would be unusable in the editor; a page per component
 *   would pay the create/publish/delete cost 406 times; a page per *batch* would
 *   leave one un-removable published orphan per batch (see `FIXTURE_PAGE_NAME`).
 * - **Identity.** A component is selected as "the single *unlocked* layer whose
 *   label equals the contract title". Template-contributed layers stay locked
 *   because the sweep never cancels inheritance, and contract titles are unique,
 *   so the selection is unambiguous even though 35 titles are substrings of
 *   another title.
 * - **Lossy fields.** `list`, `object`, and `asset` fields are authored through
 *   the author API, never through the UI: the editor renders them as
 *   `String(value)` in a text input (REB-19 blocker B-1), so a UI edit would
 *   persist a string where the contract requires structured data. The sweep
 *   instead proves those fields survive an editor save unchanged, which is what
 *   an author would experience today.
 * - **Evidence over exceptions.** A component that misbehaves is recorded as a
 *   `FAIL`/`BLOCKED` matrix row and the sweep continues, so one bad component
 *   cannot destroy the evidence for the other 19 in its batch. Every batch still
 *   asserts at the end that it produced no `FAIL` rows.
 */
import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { MatrixRecorder, type MatrixOutcome } from '../../reports/matrix';
import { ComponentMatrixRecorder, type ComponentOutcome } from '../../reports/componentMatrix';
import { AuthorApiClient } from '../../pages/AuthorApiClient';
import { EditorAuthoringPage } from '../../pages/EditorAuthoringPage';
import {
  activeComponentContracts,
  apiOnlyFields,
  authorableFields,
  authoringValueFor,
  componentBatches,
  contractNodeName,
  primaryEditableField,
  TEMPLATE_DETACHED_FLAG,
  type AuthorableField,
  type ComponentContract,
} from '../../fixtures/component-contracts';
import { importedSiteImageUrls } from '../../fixtures/site-assets';

const TASK_ID = 'REB-26';
const SITE_ID = 'tut-usa';
const SITE_ROOT_LTREE = `content.${SITE_ID}`;
const TEMPLATE_NAME = 'global-home-page';

/**
 * One reused fixture page path for the whole sweep, deleted and recreated per
 * batch, rather than one page per batch.
 *
 * The sweep must publish its fixture (AC5), and nothing in the platform can
 * un-publish content: `ContentNodeService.delete()` never replicates, and the
 * DEACTIVATE replication only flips the publish node's status, which the publish
 * delivery API ignores (see `devops/blockers.md`). A per-batch page name would
 * therefore leave one permanently published orphan per batch, on every run.
 * Reusing a single stable path bounds that residue to exactly one path, which
 * each run overwrites instead of adding to.
 */
const FIXTURE_PAGE_NAME = 'reb26-component-sweep';

/** Component groups whose rendered output gets a category-specific assertion. */
const FORM_GROUP = 'Forms, Data Capture & Consent';
const NAVIGATION_GROUP = 'Navigation, Search & Discovery';
const COMMERCE_GROUP = 'Commerce, Catalog & Merchandising';

const BATCH_SIZE = Number(process.env.REB26_BATCH_SIZE ?? 20);
/** Dev-only cap. Truncating the sweep makes the completeness scenario fail. */
const MAX_BATCHES = process.env.REB26_MAX_BATCHES ? Number(process.env.REB26_MAX_BATCHES) : 0;

/**
 * Asset field names that denote an image, i.e. the ones whose authored reference
 * must end up in an `<img>`. Asset fields like `downloadFile` or `audioFile` are
 * legitimate asset references that no renderer should turn into an image.
 */
const IMAGE_FIELD_PATTERN = /(image|photo|thumbnail|poster|logo|icon|background|banner|avatar|picture)/i;

/** Controls whose rendered element is acceptable for a given contract field. */
const ALLOWED_TAGS_BY_CONTROL: Record<string, string[]> = {
  text: ['input'],
  number: ['input'],
  textarea: ['textarea'],
  toggle: ['button', 'input'],
  select: ['button'],
  // Structured fields render a container (object group / array repeater), not a
  // single form control.
  structured: ['div'],
};

/** Everything the sweep plans, authors, and verifies for one component. */
interface ComponentPlan {
  contract: ComponentContract;
  nodeName: string;
  ltreePath: string;
  /** Run-unique marker embedded in every authored value for this component. */
  marker: string;
  /** Fields edited through the editor UI, with the value each must hold. */
  uiEdits: Array<{ entry: AuthorableField; expected: string }>;
  /** Asset fields seeded with a real imported image URL. */
  assetFields: Array<{ entry: AuthorableField; url: string }>;
  /** Reference fields seeded for this component, with the authored value. */
  referenceFields: Array<{ entry: AuthorableField; value: string }>;
  /** Verification layers proven for this component. */
  layers: Set<string>;
  notes: string[];
  outcome: ComponentOutcome;
  controlsRendered: number;
}

describe('REB-26 exhaustive per-component sample-site editing suite', function () {
  // Each batch authors and verifies ~20 components across five layers.
  this.timeout(1_800_000);

  const runId = `reb26-${Date.now()}`;
  const batches = componentBatches(BATCH_SIZE);
  const plannedBatches = MAX_BATCHES > 0 ? batches.slice(0, MAX_BATCHES) : batches;

  const fieldRecorder = new MatrixRecorder(TASK_ID, 'field-coverage.csv');
  const componentRecorder = new ComponentMatrixRecorder(TASK_ID);
  const blockers: string[] = [];
  const observations: string[] = [];
  /** Fixture pages created by this run, so `after` can never leak one. */
  const fixturePages = new Set<string>();

  let driver: WebDriver | undefined;
  let editor: EditorAuthoringPage;
  let api: AuthorApiClient;
  let assetUrlPool: string[] = [];

  function blocker(message: string): void {
    if (!blockers.includes(message)) blockers.push(message);
  }

  function observe(message: string): void {
    if (!observations.includes(message)) observations.push(message);
  }

  function recordField(
    scenarioId: string,
    contract: ComponentContract,
    entry: AuthorableField | undefined,
    verifiedLayers: string,
    outcome: MatrixOutcome,
    notes: string,
  ): void {
    fieldRecorder.add({
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

  function recordComponent(plan: ComponentPlan, scenarioId: string, pagePath: string): void {
    componentRecorder.add({
      scenarioId,
      contractIndex: plan.contract.index,
      groupName: plan.contract.groupName,
      resourceType: plan.contract.resourceType,
      componentName: plan.contract.name,
      componentTitle: plan.contract.title,
      pagePath,
      editedFields: plan.uiEdits.map((edit) => edit.entry.key).join(' '),
      controlsRendered: `${plan.controlsRendered}/${authorableFields(plan.contract).length}`,
      verifiedLayers: [...plan.layers].join(' '),
      outcome: plan.outcome,
      notes: plan.notes.join('; '),
    });
  }

  /** Persists both matrices, so a long run leaves evidence after every batch. */
  function writeMatrices(): void {
    fieldRecorder.write();
    componentRecorder.write();
  }

  /**
   * The value the editor must hold after authoring `entry`.
   *
   * Text-like controls carry the run marker so the same string can be traced
   * through the author API, the delivery JSON, the rendered page, and the publish
   * environment. Numbers get a deterministic per-component value; toggles and
   * selects can only be flipped or chosen, so their post-edit value is whatever
   * the control reports and is asserted for persistence rather than for content.
   */
  function intendedValue(plan: ComponentPlan, entry: AuthorableField): string | undefined {
    if (entry.control === 'toggle' || entry.control === 'select') return undefined;
    if (entry.control === 'number') return String(1_000 + plan.contract.index);
    if (entry.semantics === 'richtext') return `<em>REB26 ${plan.marker} rich</em>`;
    if (entry.semantics === 'reference') return `/${SITE_ID}/home?ref=${plan.marker}`;
    return `REB26 ${plan.marker} ${entry.key}`;
  }

  before(async () => {
    api = new AuthorApiClient();
    assetUrlPool = importedSiteImageUrls();
    expect(assetUrlPool.length, 'REB-07 imported site images must exist for asset coverage').to.be.greaterThan(0);

    if (MAX_BATCHES > 0) {
      console.warn(
        `[${TASK_ID}] REB26_MAX_BATCHES=${MAX_BATCHES} truncates the sweep to ` +
          `${plannedBatches.length} of ${batches.length} batches. The completeness scenario will fail; ` +
          'this cap is for development only.',
      );
    }

    driver = await createDriver();
    editor = new EditorAuthoringPage(driver);
  });

  after(async () => {
    try {
      writeMatrices();
      const totals = componentRecorder.totals();
      console.log(
        `[${TASK_ID}] components recorded: ${totals.total} ` +
          `(PASS ${totals.PASS}, BLOCKED ${totals.BLOCKED}, UNSUPPORTED_UI ${totals.UNSUPPORTED_UI}, ` +
          `FAIL ${totals.FAIL}, SKIPPED ${totals.SKIPPED}); field rows: ${fieldRecorder.size}`,
      );
      if (blockers.length > 0) {
        console.log(`[${TASK_ID}] implementation blockers observed:\n- ${blockers.join('\n- ')}`);
      }
      if (observations.length > 0) {
        console.log(`[${TASK_ID}] documented behaviour:\n- ${observations.join('\n- ')}`);
      }
    } finally {
      for (const ltreePath of fixturePages) {
        await removeFixturePage(ltreePath);
      }
      await quitDriver(driver);
    }
  });

  /**
   * Removes a fixture page from the author environment.
   *
   * The page is archived before it is deleted: that is the only supported way to
   * ask the platform to stop publishing content, and it fires the DEACTIVATE
   * replication. It does not actually remove the page from the publish
   * environment — `S4` proves that and records it as a blocker — but skipping the
   * archive would mean the suite never even requested unpublication.
   */
  async function removeFixturePage(ltreePath: string): Promise<void> {
    try {
      await api.updateNodeStatus(ltreePath, 'ARCHIVED');
    } catch {
      // The page may already be gone, or never have been published.
    }

    let deleteError = '';
    try {
      await api.deleteNode(ltreePath);
    } catch (error) {
      deleteError = String(error);
    }

    try {
      await api.getNode(ltreePath);
    } catch {
      fixturePages.delete(ltreePath);
      return;
    }

    console.error(
      `[${TASK_ID}] FIXTURE LEAK: ${ltreePath} still exists after DELETE` +
        `${deleteError ? ` (${deleteError})` : ''}. Remove it before the next run.`,
    );
  }

  attachFailureScreenshot(() => driver);

  // ── S1 — generation completeness before any browser work ─────────────────
  it('S1 generates one editing scenario for every active component contract', () => {
    const contracts = activeComponentContracts();
    const batched = batches.flat();

    expect(batched.length, 'every active contract must land in exactly one batch').to.equal(contracts.length);
    expect(new Set(batched.map((contract) => contract.resourceType)).size, 'resource types must be unique').to.equal(
      contracts.length,
    );

    const withoutFields = contracts.filter((contract) => authorableFields(contract).length === 0);
    expect(withoutFields.map((contract) => contract.resourceType), 'contracts with no authorable field').to.deep.equal(
      [],
    );

    const withoutEditable = contracts.filter((contract) => !primaryEditableField(contract));
    for (const contract of withoutEditable) {
      blocker(
        `${contract.resourceType} exposes no editor-authorable field: every contracted field is a ` +
          'list/object/asset that frontend/apps/admin/src/app/editor/page.tsx renders as String(value).',
      );
    }

    const fieldTotal = contracts.reduce((sum, contract) => sum + authorableFields(contract).length, 0);
    console.log(
      `[${TASK_ID}] planning ${contracts.length} components (${fieldTotal} authorable fields) ` +
        `in ${batches.length} batches of ${BATCH_SIZE}`,
    );
  });

  // ── S2.n — the exhaustive sweep, one test per batch ───────────────────────
  plannedBatches.forEach((batch, batchIndex) => {
    const batchNumber = batchIndex + 1;
    const first = batch[0].index;
    const last = batch[batch.length - 1].index;
    const scenarioId = `S2.${batchNumber}`;

    it(`${scenarioId} authors and verifies components ${first}-${last} across ui, author API, headless, rendered, and publish`, async () => {
      const pageName = FIXTURE_PAGE_NAME;
      const contentPath = `/content/${SITE_ID}/${pageName}`;
      const ltreePagePath = `${SITE_ROOT_LTREE}.${pageName}`;
      const sitePath = `/${SITE_ID}/${pageName}`;

      const plans: ComponentPlan[] = batch.map((contract, indexInBatch) => ({
        contract,
        nodeName: contractNodeName(contract),
        ltreePath: `${ltreePagePath}.${contractNodeName(contract)}`,
        marker: `${runId}-b${batchNumber}-${indexInBatch}`,
        uiEdits: [],
        assetFields: [],
        referenceFields: [],
        layers: new Set<string>(),
        notes: [],
        outcome: 'SKIPPED',
        controlsRendered: 0,
      }));

      /** Batch-level problems, asserted after cleanup so evidence is never lost. */
      const failures: string[] = [];

      const fail = (plan: ComponentPlan, message: string): void => {
        plan.outcome = 'FAIL';
        plan.notes.push(message);
        failures.push(`${plan.contract.resourceType}: ${message}`);
      };

      /**
       * Whether a component already failed. Written as a function so control-flow
       * narrowing cannot conclude that `outcome` is still the value it had before
       * `fail()` mutated it.
       */
      const failed = (plan: ComponentPlan): boolean => plan.outcome === 'FAIL';

      const pageTitle = `REB-26 component sweep batch ${batchNumber}`;

      try {
        // 1. Fixture page.
        await api.deleteNode(ltreePagePath).catch(() => undefined);
        await api.createNode({
          parentPath: SITE_ROOT_LTREE,
          name: pageName,
          resourceType: 'flexcms/page',
          properties: {
            'jcr:title': pageTitle,
            'jcr:description': `Ephemeral fixture page for components ${first}-${last}.`,
            siteId: SITE_ID,
            template: TEMPLATE_NAME,
          },
        });
        fixturePages.add(ltreePagePath);

        // 2. Seed every component with contract-shaped values. Asset fields get a
        //    real imported image so a rendered <img> can be proven to resolve.
        for (const plan of plans) {
          const properties: Record<string, unknown> = { [TEMPLATE_DETACHED_FLAG]: true };
          for (const entry of authorableFields(plan.contract)) {
            if (entry.semantics === 'asset') {
              const url = assetUrlPool[(plan.contract.index + plan.assetFields.length) % assetUrlPool.length];
              properties[entry.key] = url;
              plan.assetFields.push({ entry, url });
              continue;
            }
            const value = authoringValueFor(entry, plan.marker);
            properties[entry.key] = value;
            if (entry.semantics === 'reference') plan.referenceFields.push({ entry, value: String(value) });
          }
          await api.createNode({
            parentPath: ltreePagePath,
            name: plan.nodeName,
            resourceType: plan.contract.resourceType,
            properties,
          });

          // Containers must keep their children across an editor save.
          if (plan.contract.isContainer) {
            await api.createNode({
              parentPath: plan.ltreePath,
              name: 'reb26-child',
              resourceType: plan.contract.resourceType,
              properties: { [TEMPLATE_DETACHED_FLAG]: true, childMarker: plan.marker },
            });
          }
        }
        await api.waitForNode(ltreePagePath);

        // 3. Author every component through the editor UI.
        await editor.open(contentPath);
        const layers = await editor.layerEntries();
        const unlockedByLabel = new Map<string, number[]>();
        for (const entry of layers.filter((layer) => !layer.locked)) {
          const positions = unlockedByLabel.get(entry.label) ?? [];
          positions.push(entry.position);
          unlockedByLabel.set(entry.label, positions);
        }

        for (const plan of plans) {
          const positions = unlockedByLabel.get(plan.contract.title) ?? [];

          if (positions.length === 0) {
            fail(
              plan,
              `no unlocked layer labelled "${plan.contract.title}" after seeding the node; ` +
                `layers present: ${layers.map((layer) => `${layer.label}${layer.locked ? '(locked)' : ''}`).join(' | ')}`,
            );
            continue;
          }
          if (positions.length > 1) {
            plan.notes.push(`${positions.length} unlocked layers share this title; used the first`);
          }

          try {
            await editor.selectLayerAt(positions[0]);

            // Probe every contracted field, then author the editable ones.
            for (const entry of authorableFields(plan.contract)) {
              const probe = await editor.probeField(entry);
              if (!probe.present) {
                plan.notes.push(`no control for ${entry.key}`);
                recordField(scenarioId, plan.contract, entry, 'ui', 'BLOCKED', 'editor rendered no control');
                blocker(
                  `Editor renders no control for ${plan.contract.resourceType}.${entry.key} ` +
                    `(expected data-testid "${entry.inputTestId}").`,
                );
                continue;
              }

              plan.controlsRendered += 1;
              const allowedTags = ALLOWED_TAGS_BY_CONTROL[entry.control] ?? ['input'];
              if (!allowedTags.includes(probe.tagName ?? '')) {
                fail(plan, `${entry.key} rendered <${probe.tagName}> for control ${entry.control}`);
                recordField(scenarioId, plan.contract, entry, 'ui', 'FAIL', `unexpected tag <${probe.tagName}>`);
                continue;
              }

              if (entry.isLossyInEditor) {
                // Structured and asset fields are authored through the author API, not
                // the UI — the sweep's contract is that the *stored shape* survives an
                // editor save, and driving a nested repeater per field would test the
                // editor's ergonomics instead of the round trip.
                //
                // For list/object this is no longer a blocker: since REB-19 B-1 was
                // fixed they render a real structured editor (asserted present above),
                // rather than a text input that would persist `[object Object]`.
                const structured = entry.control === 'structured';
                recordField(
                  scenarioId,
                  plan.contract,
                  entry,
                  'ui',
                  structured ? 'PASS' : 'BLOCKED',
                  structured
                    ? `${entry.semantics} field renders a structured editor; value authored through the author API`
                    : `${entry.semantics} field renders as a plain text input; authored through the author API instead`,
                );
                continue;
              }

              const intended = intendedValue(plan, entry);
              const isTargeted =
                entry.key === primaryEditableField(plan.contract)?.key ||
                entry.semantics === 'richtext' ||
                entry.semantics === 'reference';
              if (!isTargeted) {
                recordField(scenarioId, plan.contract, entry, 'ui', 'PASS', `control ${entry.control} present`);
                continue;
              }

              const held = await editor.writeFieldValue(entry, intended ?? '');
              if (intended !== undefined && held !== intended) {
                fail(plan, `${entry.key} held "${held}" after authoring "${intended}"`);
                recordField(scenarioId, plan.contract, entry, 'ui', 'FAIL', 'editor did not accept the value');
                continue;
              }
              plan.uiEdits.push({ entry, expected: held });
            }
          } catch (error) {
            fail(plan, `authoring threw: ${String(error)}`);
          }
        }

        // 4. One save persists every component on the page.
        await editor.save();

        // 5. Editor persistence after a full reload.
        await editor.refreshAndWait();
        const reloaded = await editor.layerEntries();
        const reloadedUnlocked = new Map<string, number[]>();
        for (const entry of reloaded.filter((layer) => !layer.locked)) {
          const positions = reloadedUnlocked.get(entry.label) ?? [];
          positions.push(entry.position);
          reloadedUnlocked.set(entry.label, positions);
        }

        for (const plan of plans) {
          if (failed(plan) || plan.uiEdits.length === 0) continue;
          const positions = reloadedUnlocked.get(plan.contract.title) ?? [];
          if (positions.length === 0) {
            fail(plan, 'layer disappeared after reload');
            continue;
          }
          try {
            await editor.selectLayerAt(positions[0]);
            for (const edit of plan.uiEdits) {
              const actual = await editor.readFieldValue(edit.entry);
              if (actual !== edit.expected) {
                fail(plan, `${edit.entry.key} read "${actual}" after reload, expected "${edit.expected}"`);
              }
            }
            if (!failed(plan)) plan.layers.add('ui');
          } catch (error) {
            fail(plan, `reload verification threw: ${String(error)}`);
          }
        }

        // 6. Author API: authored values persisted, structured values intact.
        for (const plan of plans) {
          if (failed(plan)) continue;
          try {
            const node = await api.getNode(plan.ltreePath);
            const properties = node.properties ?? {};

            for (const edit of plan.uiEdits) {
              const stored = String(properties[edit.entry.key] ?? '');
              if (stored !== edit.expected) {
                fail(plan, `author API has "${stored}" for ${edit.entry.key}, expected "${edit.expected}"`);
              }
            }

            for (const entry of apiOnlyFields(plan.contract)) {
              const stored = properties[entry.key];
              const intact =
                entry.semantics === 'asset'
                  ? typeof stored === 'string' && stored.length > 0
                  : entry.semantics === 'list'
                    ? Array.isArray(stored)
                    : typeof stored === 'object' && stored !== null;
              if (!intact) {
                plan.notes.push(`${entry.key} lost its ${entry.semantics} shape across the editor save`);
                recordField(
                  scenarioId,
                  plan.contract,
                  entry,
                  'author-api',
                  'BLOCKED',
                  `editor save coerced ${entry.semantics} to ${typeof stored}`,
                );
                blocker(
                  `Editor save coerces ${entry.semantics} fields: ${plan.contract.resourceType}.${entry.key} ` +
                    `became ${typeof stored} after handleSave() re-PUT the component ` +
                    '(frontend/apps/admin/src/app/editor/page.tsx -> handleSave/PropertyField).',
                );
              } else {
                recordField(
                  scenarioId,
                  plan.contract,
                  entry,
                  'author-api',
                  'PASS',
                  `${entry.semantics} value survived the editor save unchanged`,
                );
              }
            }

            if (plan.contract.isContainer) {
              const children = await api.getChildren(plan.ltreePath);
              if (!children.some((child) => child.name === 'reb26-child')) {
                fail(plan, 'container lost its child node across the editor save');
              } else {
                plan.notes.push('container child preserved across save');
              }
            }

            if (!failed(plan)) plan.layers.add('author-api');
          } catch (error) {
            fail(plan, `author API verification threw: ${String(error)}`);
          }
        }

        // 7. Headless delivery JSON for the whole page.
        try {
          const payload = await api.getAuthorRenderedPage(sitePath);
          const components = (payload.components as Array<Record<string, unknown>>) ?? [];
          const byName = new Map(components.map((component) => [String(component.name), component]));

          for (const plan of plans) {
            if (failed(plan)) continue;
            const component = byName.get(plan.nodeName);
            if (!component) {
              fail(plan, `headless payload for ${sitePath} has no component named ${plan.nodeName}`);
              continue;
            }
            const data = (component.data as Record<string, unknown>) ?? {};
            for (const edit of plan.uiEdits) {
              if (String(data[edit.entry.key] ?? '') !== edit.expected) {
                fail(plan, `headless data for ${edit.entry.key} is "${String(data[edit.entry.key])}"`);
              }
            }
            if (!failed(plan)) plan.layers.add('headless');
          }

          // The same page through the GraphQL delivery API (AC4). One query per
          // batch: the resolver reads the same node, so proving it answers for
          // the fixture page covers every component authored on it.
          const graphqlTitle = await api.getGraphqlPageTitle(sitePath);
          if (graphqlTitle === pageTitle) {
            for (const plan of plans) {
              if (!failed(plan)) plan.layers.add('graphql');
            }
          } else {
            failures.push(`GraphQL page(path: "${sitePath}") returned title "${graphqlTitle}"`);
          }
        } catch (error) {
          failures.push(`headless verification threw: ${String(error)}`);
        }

        // 8. Rendered reference site.
        try {
          await editor.openPublicSitePage(sitePath);
          const source = await editor.readPageSource();
          const bodyText = await editor.readBodyText();
          const formControls = await editor.formControlCount();
          const brokenImages = await editor.brokenImageSources();
          const consoleErrors = await editor.severeConsoleErrors();

          if (await editor.isFrameworkNotFoundPage()) {
            failures.push(
              `rendered ${sitePath} served the framework not-found page ` +
                `(title "${await editor.readPageTitle()}", body starts "${bodyText.slice(0, 120)}")`,
            );
          }
          if (consoleErrors.length > 0) {
            observe(
              `Rendered sweep page produced ${consoleErrors.length} severe console error(s); first: ` +
                consoleErrors[0].slice(0, 200),
            );
          }

          for (const plan of plans) {
            if (failed(plan)) continue;

            // Only marker-carrying values are traceable in rendered HTML: a
            // toggle or a number cannot embed one, so their absence says nothing
            // about the renderer and must not be reported as if it did.
            const traceable = plan.uiEdits.some((edit) => edit.expected.includes(plan.marker));
            if (source.includes(plan.marker)) plan.layers.add('rendered');
            else if (traceable) {
              plan.notes.push('reference site renderer surfaces no authored value for this component');
            } else {
              plan.notes.push(
                `rendered layer not traceable: only a ${plan.uiEdits
                  .map((edit) => edit.entry.control)
                  .join('/')} control is authorable, which carries no marker`,
              );
            }

            for (const asset of plan.assetFields) {
              const rendered = await editor.imageSourcesContaining(asset.url);
              if (rendered.length === 0) {
                // Only image-like asset fields are *expected* to become an <img>.
                // A `downloadFile`, `audioFile`, or generic `file` reference is
                // still an asset, but "no <img>" is correct for it, so reporting
                // that as a rendering gap would be a false finding.
                const expectsImage = IMAGE_FIELD_PATTERN.test(asset.entry.key);
                plan.notes.push(
                  expectsImage
                    ? `image asset ${asset.entry.key} is not rendered as an image`
                    : `non-image asset ${asset.entry.key} persisted; no <img> expected`,
                );
                recordField(
                  scenarioId,
                  plan.contract,
                  asset.entry,
                  expectsImage ? 'rendered' : 'author-api headless',
                  expectsImage ? 'BLOCKED' : 'PASS',
                  expectsImage
                    ? `authored image asset ${asset.url} produced no <img> on the reference site`
                    : `non-image asset reference persisted and delivered; rendering as <img> not applicable`,
                );
                continue;
              }
              const broken = brokenImages.filter((src) => src.includes(asset.url));
              if (broken.length > 0) {
                fail(plan, `authored asset ${asset.url} rendered as a broken image`);
                continue;
              }
              plan.layers.add('rendered-asset');
              recordField(scenarioId, plan.contract, asset.entry, 'rendered', 'PASS', `asset resolves: ${asset.url}`);
            }

            for (const reference of plan.referenceFields) {
              const hrefs = await editor.linkHrefsContaining(plan.marker);
              if (hrefs.length > 0) {
                plan.layers.add('rendered-reference');
                recordField(
                  scenarioId,
                  plan.contract,
                  reference.entry,
                  'rendered',
                  'PASS',
                  `authored reference rendered as a link: ${hrefs[0]}`,
                );
              } else {
                plan.notes.push(`reference ${reference.entry.key} produced no anchor href`);
                recordField(
                  scenarioId,
                  plan.contract,
                  reference.entry,
                  'rendered',
                  'BLOCKED',
                  'authored reference produced no anchor href on the reference site',
                );
              }
            }

            if (plan.contract.groupName === FORM_GROUP) {
              if (formControls > 0) plan.layers.add('rendered-form');
              else plan.notes.push('form component rendered no interactive control');
            }
            if (plan.contract.groupName === NAVIGATION_GROUP || plan.contract.groupName === COMMERCE_GROUP) {
              const hrefs = await editor.linkHrefsContaining('/');
              if (hrefs.length > 0) plan.layers.add('rendered-links');
              else plan.notes.push(`${plan.contract.groupName} component rendered no links`);
            }
          }
        } catch (error) {
          failures.push(`rendered verification threw: ${String(error)}`);
        }

        // 9. Draft preview route — the author-side render an editor previews.
        try {
          await editor.openPublicSitePage(`/preview${sitePath}`);
          const previewSource = await editor.readPageSource();
          if ((await editor.readBodyText()).includes('Preview not available')) {
            failures.push(`draft preview for ${sitePath} rendered the "Preview not available" fallback`);
          } else {
            for (const plan of plans) {
              if (failed(plan)) continue;
              if (previewSource.includes(plan.marker)) plan.layers.add('preview');
              else plan.notes.push('draft preview surfaces no authored value for this component');
            }
          }
        } catch (error) {
          failures.push(`draft preview verification threw: ${String(error)}`);
        }

        // 10. Publish environment.
        try {
          await api.bulkPublish([ltreePagePath]);
          await api.waitForNodeStatus(ltreePagePath, 'PUBLISHED');

          /**
           * Replication is asynchronous, so the publish payload is polled until it
           * carries *this batch's* authored values.
           *
           * Waiting for "any components" would be wrong: the fixture path is
           * reused, and a deleted page is never removed from the publish
           * environment, so the previous batch's components are already being
           * served the moment this batch publishes.
           */
          const expected = plans.filter((plan) => !failed(plan) && plan.uiEdits.length > 0);
          const carriesBatch = (byName: Map<string, Record<string, unknown>>): boolean =>
            expected.every((plan) => {
              const component = byName.get(plan.nodeName);
              if (!component) return false;
              const data = (component.data as Record<string, unknown>) ?? {};
              return plan.uiEdits.every((edit) => String(data[edit.entry.key] ?? '') === edit.expected);
            });

          const deadline = Date.now() + 120_000;
          let byName = new Map<string, Record<string, unknown>>();
          let sawPayload = false;
          while (Date.now() < deadline) {
            try {
              const payload = await api.getPublishRenderedPage(sitePath);
              const publishComponents = (payload.components as Array<Record<string, unknown>>) ?? [];
              byName = new Map(publishComponents.map((component) => [String(component.name), component]));
              sawPayload = true;
              if (carriesBatch(byName)) break;
            } catch {
              // A page that has not replicated yet answers 500, not 404 — a known
              // non-blocking observation from REB-19; keep polling.
            }
            await new Promise((resolve) => setTimeout(resolve, 2_000));
          }

          if (!sawPayload) {
            failures.push(`publish environment served no payload for ${sitePath} within 120s`);
          } else {
            for (const plan of plans) {
              if (failed(plan)) continue;
              const component = byName.get(plan.nodeName);
              if (!component) {
                fail(plan, 'component missing from the publish environment payload');
                continue;
              }
              const data = (component.data as Record<string, unknown>) ?? {};
              for (const edit of plan.uiEdits) {
                if (String(data[edit.entry.key] ?? '') !== edit.expected) {
                  fail(plan, `publish data for ${edit.entry.key} is "${String(data[edit.entry.key])}"`);
                }
              }
              if (!failed(plan)) plan.layers.add('publish');
            }
          }
        } catch (error) {
          failures.push(`publish verification threw: ${String(error)}`);
        }
      } finally {
        // 11. Grade, record, and clean up — even if a step above threw.
        const required = ['ui', 'author-api', 'headless', 'publish'];
        for (const plan of plans) {
          if (!failed(plan)) {
            const missing = required.filter((layer) => !plan.layers.has(layer));
            if (plan.uiEdits.length === 0) {
              plan.outcome = 'UNSUPPORTED_UI';
              plan.notes.push('editor offered no authorable control for any contracted field');
            } else if (missing.length === 0) {
              plan.outcome = 'PASS';
            } else {
              plan.outcome = 'BLOCKED';
              plan.notes.push(`unverified layers: ${missing.join(' ')}`);
            }
          }
          // Each authored field gets its own row carrying the layers the
          // component proved, so the field CSV shows what an edit really covered.
          const layers = [...plan.layers].join(' ');
          for (const edit of plan.uiEdits) {
            recordField(
              scenarioId,
              plan.contract,
              edit.entry,
              layers,
              plan.outcome === 'PASS' ? 'PASS' : plan.outcome === 'FAIL' ? 'FAIL' : 'BLOCKED',
              `authored "${edit.expected}" through the ${edit.entry.control} control`,
            );
          }

          recordComponent(plan, scenarioId, contentPath);
        }

        writeMatrices();
        await removeFixturePage(ltreePagePath);

        const totals = componentRecorder.totals();
        console.log(
          `[${TASK_ID}] ${scenarioId} done: ${plans.filter((plan) => plan.outcome === 'PASS').length}/${plans.length} PASS ` +
            `(cumulative ${totals.PASS} PASS, ${totals.BLOCKED} BLOCKED, ${totals.FAIL} FAIL of ${totals.total})`,
        );
      }

      expect(failures, `batch ${batchNumber} produced unexpected failures`).to.deep.equal([]);
    });
  });

  // ── S3 — completeness, asserted after the sweep ──────────────────────────
  it('S3 records exactly one matrix row for every active component contract', () => {
    const contracts = activeComponentContracts();
    const recorded = new Set(componentRecorder.resourceTypes());
    const missing = contracts
      .filter((contract) => !recorded.has(contract.resourceType))
      .map((contract) => contract.resourceType);

    expect(componentRecorder.size, 'matrix row count must equal the active contract count').to.equal(
      contracts.length,
    );
    expect(missing, 'every active component must have a matrix row').to.deep.equal([]);
    expect(componentRecorder.countByOutcome('FAIL'), 'no component may end the run in FAIL').to.equal(0);
  });

  // ── S4 — publish-side residue after author deletion ──────────────────────
  it('S4 documents whether deleting a published page removes it from the publish environment', async () => {
    const ltreePagePath = `${SITE_ROOT_LTREE}.${FIXTURE_PAGE_NAME}`;
    const sitePath = `/${SITE_ID}/${FIXTURE_PAGE_NAME}`;

    // The sweep archived and deleted the fixture; the author side must be clean.
    let authorHasPage = true;
    try {
      await api.getNode(ltreePagePath);
    } catch {
      authorHasPage = false;
    }
    expect(authorHasPage, `author must not still hold the fixture page ${ltreePagePath}`).to.equal(false);

    let publishStillServes = false;
    let publishComponentCount = 0;
    try {
      const payload = await api.getPublishRenderedPage(sitePath);
      publishStillServes = true;
      publishComponentCount = ((payload.components as unknown[]) ?? []).length;
    } catch {
      publishStillServes = false;
    }

    if (publishStillServes) {
      blocker(
        `Deleting a published page does not remove it from the publish environment: ${sitePath} is gone from ` +
          `the author API but :8081 still serves it with ${publishComponentCount} component(s). ` +
          'flexcms-core ContentNodeService.delete() only calls nodeRepository.deleteSubtree() plus an audit ' +
          'entry — it never asks flexcms-replication for anything — and no code path anywhere produces a ' +
          'ReplicationAction.DELETE event, even though ReplicationReceiver already handles one ' +
          '(case DELETE -> deleteContent). Archiving first does not help either: ' +
          'ReplicationReceiver.deactivateContent() sets the publish node status to DRAFT and leaves its ' +
          'child components untouched, and the publish delivery API serves pages regardless of status.',
      );
      observe(
        `Publish-side residue is bounded to the single reused fixture path ${sitePath}; each run overwrites it ` +
          'rather than adding a new orphan. Purging it requires direct publish-database access.',
      );
    } else {
      observe(`Publish environment no longer serves ${sitePath} after archive + delete.`);
    }
  });
});
