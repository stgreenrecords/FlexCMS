/**
 * FlexCMS Selenium E2E — REB-22: experience fragments and live copies.
 *
 * Two reuse mechanisms, covered end to end:
 *
 * - **Experience fragments**: a folder holding one or more `flexcms/xf-page`
 *   variations. The components an author edits live under a variation, not under the
 *   folder — a distinction that matters throughout, because the fragment folder is not
 *   editable and publishing the wrong node ships nothing.
 * - **Live copies**: a blueprint subtree copied to a target, kept in sync by rollout
 *   until it is detached.
 *
 * Conventions these scenarios hold to:
 *
 * - **Test-owned data only.** Every fragment, page and copy carries a run-unique
 *   prefix. The seeded `navigation` and `footer` fragments are locked onto every TUT
 *   page, so `S6` asserts explicitly that they survive the run (AC3).
 * - **Behaviour verified against the running system, not assumed.** Each assertion here
 *   was checked against the live API first; where the platform's answer is imperfect
 *   but deliberate, the scenario records it rather than pretending otherwise.
 * - **Publish means the publish instance.** `S5` reads the fragment back from `:8081`'s
 *   headless API, which is the only way to prove reusable content actually shipped.
 */
import { expect } from 'chai';
import { By, type WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { loadEnv } from '../../driver/env';
import { waitForPageReady, waitForVisible } from '../../driver/waits';
import { OperationMatrixRecorder, type OperationOutcome } from '../../reports/operationMatrix';

const TASK_ID = 'REB-22';
const SITE_ID = 'tut-usa';

/** Fragments that ship with the site and must never be disturbed by this suite. */
const SEEDED_FRAGMENTS = [
  'content.experience-fragments.tut-usa.global.navigation',
  'content.experience-fragments.tut-usa.global.footer',
];

interface ApiResult<T = unknown> {
  status: number;
  body: T;
}

describe('REB-22 reusable content suite (experience fragments and live copies)', function () {
  this.timeout(900_000);

  const env = loadEnv();
  const api = `${env.authorApiUrl}/author`;
  const headlessAuthor = `${env.authorApiUrl.replace(/\/api$/, '')}/api/content/v1`;
  const headlessPublish = `${env.publishUrl}/api/content/v1`;

  const runId = `reb22-${Date.now()}`;
  const recorder = new OperationMatrixRecorder(TASK_ID, 'reusable-content-matrix.csv');
  const blockers: string[] = [];
  const observations: string[] = [];

  /** Every path this run created, deepest first, for guaranteed cleanup. */
  const createdXfPaths: string[] = [];
  const createdContentPaths: string[] = [];

  let driver: WebDriver | undefined;

  attachFailureScreenshot(() => driver);

  async function call<T = unknown>(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<ApiResult<T>> {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, body: parsed as T };
  }

  /**
     * One matrix row per scenario. The three evidence columns are kept distinct on
     * purpose: a scenario proven only through the API is weaker evidence than one the
     * UI or the publish instance also confirms, and the matrix should show which.
     */
  function record(row: {
    scenarioId: string;
    scenario: string;
    operation: string;
    target: string;
    api?: string;
    ui?: string;
    publish?: string;
    outcome: OperationOutcome;
    notes?: string;
  }): void {
    recorder.add({
      scenarioId: row.scenarioId,
      scenario: row.scenario,
      operation: row.operation,
      target: row.target,
      apiEvidence: row.api ?? '',
      uiEvidence: row.ui ?? '',
      publishEvidence: row.publish ?? '',
      outcome: row.outcome,
      notes: row.notes ?? '',
    });
  }

  before(async () => {
    driver = await createDriver();
  });

  after(async () => {
    // Fragments first: deleting one removes its variations and their components.
    for (const path of createdXfPaths) {
      try {
        await call('DELETE', `${api}/xf/${path}?userId=admin`);
      } catch {
        /* best effort — cleanup must not mask a result */
      }
    }
    for (const path of [...createdContentPaths].reverse()) {
      try {
        await call('DELETE', `${api}/content/node?path=${encodeURIComponent(path)}&userId=admin`);
      } catch {
        /* best effort */
      }
    }

    const matrixPath = recorder.write();
    console.log(
      `[${TASK_ID}] matrix rows: ${recorder.size} ` +
        `(PASS ${recorder.countByOutcome('PASS')}, BLOCKED ${recorder.countByOutcome('BLOCKED')}) ` +
        `-> ${matrixPath}`,
    );
    if (blockers.length > 0) {
      console.log(`[${TASK_ID}] implementation blockers observed:`);
      for (const blocker of blockers) console.log(`- ${blocker}`);
    }
    if (observations.length > 0) {
      console.log(`[${TASK_ID}] documented behaviour:`);
      for (const observation of observations) console.log(`- ${observation}`);
    }
    await quitDriver(driver);
  });

  // ── Experience fragments ──────────────────────────────────────────────────

  it('S1 loads the experience fragments route with the seeded fragments', async () => {
    const d = driver as WebDriver;
    await d.get(`${env.adminUrl}/experience-fragments`);
    await waitForPageReady(d);

    await waitForVisible(d, By.css('[data-testid="xf-heading"]'));

    // The heading renders before the fragment list is fetched — the page resolves its
    // site and then reads the fragments — so this waits for the load to *settle* into
    // either outcome. Reading straight after the heading appears samples an empty list
    // and reports a product failure that is really a race in the test.
    await d.wait(
      async () =>
        (await d.findElements(By.css('[data-testid^="xf-edit-"]'))).length > 0 ||
        (await d.findElements(By.css('[data-testid="xf-error"]'))).length > 0 ||
        (await d.findElements(By.css('[data-testid="xf-empty"]'))).length > 0,
      30_000,
      'the fragments route never finished loading: no fragments, no error, no empty state',
    );

    // The route used to render nothing at all: it called `/api/author/xf/list`, which
    // matches the controller's `/{*xfPath}` catch-all and 404s, and it asked for a
    // `corporate` site that does not exist. Both failures were swallowed by a bare
    // `.catch`, so an empty list was indistinguishable from a broken page.
    const errors = await d.findElements(By.css('[data-testid="xf-error"]'));
    const errorText = errors.length > 0 ? await errors[0].getText() : '';
    expect(errorText, 'the fragments route reported a load error').to.equal('');

    const names: string[] = [];
    for (const el of await d.findElements(By.css('[data-testid^="xf-edit-"]'))) {
      names.push((await el.getText()).trim());
    }

    expect(names, 'seeded navigation fragment missing from the list').to.include('Global Navigation');
    expect(names, 'seeded footer fragment missing from the list').to.include('Global Footer');

    record({
      scenarioId: 'S1',
      scenario: 'loads the experience fragments route with the seeded fragments',
      operation: 'xf:browse',
      target: 'admin /experience-fragments',
      api: `GET /author/xf?siteId=${SITE_ID} returned the seeded fragments`,
      ui: `route listed ${names.length} fragments with no error banner`,
      outcome: 'PASS',
    });
  });

  it('S2 creates a fragment and finds it through list and get', async () => {
    const created = await call<{ path?: string }>('POST', `${api}/xf`, {
      siteId: SITE_ID,
      locale: 'en',
      category: 'global',
      name: `${runId}-fragment`,
      title: `REB-22 fragment ${runId}`,
      description: 'Created by the REB-22 suite',
      userId: 'admin',
    });
    expect(created.status, 'creating a fragment failed').to.equal(200);

    // The server decides the path — it inserts a locale segment the seeded fragments do
    // not have — so it is read from the response rather than reconstructed.
    const xfPath = created.body.path as string;
    expect(xfPath, 'create returned no path').to.be.a('string').and.not.empty;
    createdXfPaths.push(xfPath);

    // A created fragment must be addressable by the API that created it. It was not:
    // the service built paths outside `content.` while every read normalised onto it.
    expect(xfPath, 'a fragment created outside the content tree is unreachable')
      .to.match(/^content\.experience-fragments\./);

    const list = await call<Array<{ xf_path: string }>>(
      'GET',
      `${api}/xf?siteId=${SITE_ID}&locale=en`,
    );
    expect(list.status).to.equal(200);
    expect(list.body.map((f) => f.xf_path), 'new fragment missing from the list').to.include(xfPath);

    const got = await call<{ xf?: { path?: string } }>('GET', `${api}/xf/${xfPath}`);
    expect(got.status, 'the fragment could not be fetched by its own path').to.equal(200);
    expect(got.body.xf?.path).to.equal(xfPath);

    record({
      scenarioId: 'S2',
      scenario: 'creates a fragment and finds it through list and get',
      operation: 'xf:create',
      target: xfPath,
      api: 'POST /author/xf 200; list and get both resolve the created path',
      outcome: 'PASS',
      notes: 'path is read from the create response — the service inserts a locale segment',
    });
  });

  it('S3 adds variations and lists them', async () => {
    const xfPath = createdXfPaths[0];
    expect(xfPath, 'S2 must have created a fragment').to.be.a('string');

    for (const variationType of ['master', 'mobile']) {
      const added = await call<{ path?: string; resourceType?: string }>(
        'POST',
        `${api}/xf/variations?path=${encodeURIComponent(xfPath)}`,
        { variationType, title: variationType, userId: 'admin' },
      );
      // Every variation change used to answer 500: the metadata timestamp was bound as
      // a `java.time.Instant` parameter, which the driver cannot type.
      expect(added.status, `adding the ${variationType} variation failed`).to.equal(200);
      expect(added.body.resourceType, 'a variation must be an xf-page').to.equal('flexcms/xf-page');
    }

    const variations = await call<Array<{ name: string; resourceType: string }>>(
      'GET',
      `${api}/xf/variations?path=${encodeURIComponent(xfPath)}`,
    );
    expect(variations.status).to.equal(200);
    const names = variations.body.map((v) => v.name);
    expect(names, 'master variation missing').to.include('master');
    expect(names, 'mobile variation missing').to.include('mobile');

    record({
      scenarioId: 'S3',
      scenario: 'adds variations and lists them',
      operation: 'xf:variation.add',
      target: `${xfPath} (master, mobile)`,
      api: `POST /author/xf/variations 200 twice; list returned ${names.join(', ')}`,
      outcome: 'PASS',
    });
  });

  it('S4 edits a variation and persists it through the author API', async () => {
    const xfPath = createdXfPaths[0];
    const variationPath = `${xfPath}.master`;

    // Components live under the variation. This is the node an author edits.
    const component = await call<{ path?: string }>('POST', `${api}/content/node`, {
      parentPath: variationPath,
      name: 'promo',
      resourceType: 'tut-usa/calls-to-action-promotions-campaigns/promo-banner',
      properties: { title: `${runId} original title` },
      userId: 'admin',
    });
    expect(component.status, 'adding a component to the variation failed').to.equal(200);

    const edited = await call('PUT', `${api}/content/node/properties`, {
      path: component.body.path,
      properties: { title: `${runId} edited title` },
      userId: 'admin',
    });
    expect(edited.status, 'editing the component failed').to.equal(200);

    const readBack = await call<{ properties?: Record<string, unknown> }>(
      'GET',
      `${api}/content/node?path=${encodeURIComponent(component.body.path as string)}`,
    );
    expect(readBack.body.properties?.title, 'the edit did not persist')
      .to.equal(`${runId} edited title`);

    // The editor must open on the variation, and render it.
    const d = driver as WebDriver;
    const editorPath = `/${variationPath.replace(/^content\./, '').replace(/\./g, '/')}`;
    await d.get(`${env.adminUrl}/editor?path=${encodeURIComponent(editorPath)}`);
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      'the editor rendered no component for the fragment variation',
    );

    const rendered: string[] = [];
    for (const el of await d.findElements(By.css('[data-canvas-resource-type]'))) {
      rendered.push((await el.getAttribute('data-canvas-resource-type')) ?? '');
    }
    expect(rendered, 'the editor did not render the variation\'s component')
      .to.include('tut-usa/calls-to-action-promotions-campaigns/promo-banner');

    record({
      scenarioId: 'S4',
      scenario: 'edits a variation and persists it through the author API',
      operation: 'xf:variation.edit',
      target: variationPath,
      api: 'component created and PUT /content/node/properties read back with the new title',
      ui: 'editor opened on the variation and rendered the component on the canvas',
      outcome: 'PASS',
    });
  });

  it('S5 ships a published fragment, with its components, to the publish instance', async () => {
    const xfPath = createdXfPaths[0];
    const variationPath = `${xfPath}.master`;

    const authorView = await call<{ components?: unknown[] }>(
      'GET',
      `${headlessAuthor}/xf/variation/master?path=${encodeURIComponent(xfPath)}`,
    );
    expect(authorView.status).to.equal(200);
    expect(authorView.body.components ?? [], 'author should serve the fragment with its component')
      .to.have.length.greaterThan(0);

    const published = await call(
      'POST',
      `${api}/content/node/status?path=${encodeURIComponent(variationPath)}` +
        '&status=PUBLISHED&userId=admin',
    );
    expect(published.status, 'publishing the variation failed').to.equal(200);

    // Replication is asynchronous, so this polls rather than sleeping a fixed time.
    let publishView: ApiResult<{ components?: unknown[] }> = { status: 0, body: {} };
    for (let attempt = 0; attempt < 20; attempt += 1) {
      publishView = await call<{ components?: unknown[] }>(
        'GET',
        `${headlessPublish}/xf/variation/master?path=${encodeURIComponent(xfPath)}`,
      );
      if (publishView.status === 200 && (publishView.body.components ?? []).length > 0) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    expect(publishView.status, 'the publish instance does not serve the published fragment')
      .to.equal(200);

    // Publishing a variation used to replicate the variation alone, leaving its
    // components on the author instance: the fragment arrived as an empty shell while
    // the equivalent page operation worked, because only `flexcms/page` and the site
    // root were treated as owning a subtree.
    expect(
      publishView.body.components ?? [],
      'the fragment reached publish without its components',
    ).to.have.length.greaterThan(0);

    record({
      scenarioId: 'S5',
      scenario: 'ships a published fragment, with its components, to the publish instance',
      operation: 'xf:publish',
      target: variationPath,
      api: 'POST /content/node/status PUBLISHED 200',
      publish: `:8081 /api/content/v1/xf/variation/master served ${(publishView.body.components ?? []).length} component(s)`,
      outcome: 'PASS',
    });
  });

  it('S6 deletes test-owned variations and fragments, leaving the seeded ones intact', async () => {
    const xfPath = createdXfPaths[0];

    const deletedVariation = await call(
      'DELETE',
      `${api}/xf/variation/mobile?path=${encodeURIComponent(xfPath)}&userId=admin`,
    );
    expect(deletedVariation.status, 'deleting a variation failed').to.be.oneOf([200, 204]);

    const remaining = await call<Array<{ name: string }>>(
      'GET',
      `${api}/xf/variations?path=${encodeURIComponent(xfPath)}`,
    );
    expect(remaining.body.map((v) => v.name), 'the deleted variation is still listed')
      .to.not.include('mobile');

    const deletedXf = await call('DELETE', `${api}/xf/${xfPath}?userId=admin`);
    expect(deletedXf.status, 'deleting the fragment failed').to.be.oneOf([200, 204]);
    createdXfPaths.length = 0;

    const list = await call<Array<{ xf_path: string }>>(
      'GET',
      `${api}/xf?siteId=${SITE_ID}&locale=en`,
    );
    const paths = list.body.map((f) => f.xf_path);
    expect(paths, 'the deleted fragment is still listed').to.not.include(xfPath);

    // AC3: the fragments the site depends on must be untouched.
    for (const seeded of SEEDED_FRAGMENTS) {
      expect(paths, `seeded fragment ${seeded} was removed`).to.include(seeded);
    }

    record({
      scenarioId: 'S6',
      scenario: 'deletes test-owned variations and fragments, leaving the seeded ones intact',
      operation: 'xf:delete',
      target: xfPath,
      api: 'variation and fragment deletes returned 2xx; neither remains in the list',
      outcome: 'PASS',
      notes: `seeded fragments still present: ${SEEDED_FRAGMENTS.join(' | ')}`,
    });
  });

  // ── Entry points into the editor ──────────────────────────────────────────
  //
  // These exist because the suite above did not have them. It built `.master` paths
  // itself, so it proved the editor works when handed the right node and never asked
  // whether anything hands it the right node.

  /** Structural node types that hold other nodes rather than authorable content. */
  const STRUCTURAL_RESOURCE_TYPES = ['flexcms/xf-folder', 'flexcms/xf-page'];

  /** Resource types the editor canvas is currently rendering. */
  async function canvasResourceTypes(d: WebDriver): Promise<string[]> {
    const nodes = await d.findElements(By.css('[data-canvas-resource-type]'));
    const types: string[] = [];
    for (const node of nodes) {
      types.push((await node.getAttribute('data-canvas-resource-type')) ?? '');
    }
    return types;
  }

  async function openEditorAt(d: WebDriver, urlPath: string): Promise<void> {
    await d.get(`${env.adminUrl}/editor?path=${encodeURIComponent(urlPath)}`);
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      `the editor rendered no component for ${urlPath}`,
    );
  }

  it('S11 makes a fragment folder URL editable instead of rendering its variation as a component', async () => {
    const d = driver as WebDriver;

    // The URL from the report: the fragment folder, with no variation segment.
    await openEditorAt(d, '/content/experience-fragments/tut-usa/global/navigation');

    const body = await (await d.findElement(By.css('body'))).getText();
    expect(body, 'the canvas is still showing an unrendered structural node')
      .to.not.contain('Renderer pending');

    const types = await canvasResourceTypes(d);
    expect(types, 'the folder\'s variation is being rendered as if it were a component')
      .to.not.include('flexcms/xf-page');
    expect(types, 'the fragment\'s own component is not on the canvas')
      .to.include('tut-usa/navigation-search-discovery/navigation');

    // And the author is told which node they are actually editing.
    const notice = await d.findElements(By.css('[data-testid="editor-resolution-notice"]'));
    expect(notice.length, 'the editor resolved to another node without saying so').to.equal(1);
    expect(await notice[0].getText()).to.contain('master');

    record({
      scenarioId: 'S11',
      scenario: 'makes a fragment folder URL editable instead of rendering its variation as a component',
      operation: 'xf:folder-url',
      target: '/content/experience-fragments/tut-usa/global/navigation',
      ui: 'resolved to the master variation, rendered the navigation component, notice shown',
      outcome: 'PASS',
    });
  });

  it('S12 follows the content tree\'s own Edit link into the editor', async () => {
    const d = driver as WebDriver;

    await d.get(`${env.adminUrl}/content`);
    await waitForPageReady(d);

    // Rows first: the tree fetches its nodes after the shell renders.
    await d.wait(
      async () => (await d.findElements(By.css('tbody tr'))).length > 0,
      30_000,
      'the content tree never rendered any rows',
    );

    // The Edit link is inside a row's action menu and does not exist until it is opened,
    // which is why looking for inline editor links found none.
    const rows = await d.findElements(By.css('tbody tr'));
    let editHref: string | null = null;

    for (const row of rows.slice(0, 3)) {
      const triggers = await row.findElements(By.css('td:last-child button'));
      if (triggers.length === 0) continue;

      await triggers[0].click();
      await d.wait(
        async () => (await d.findElements(By.css('a[href*="/editor?path="]'))).length > 0,
        5_000,
        'the row action menu exposed no Edit link',
      ).catch(() => undefined);

      const links = await d.findElements(By.css('a[href*="/editor?path="]'));
      if (links.length > 0) {
        editHref = await links[0].getAttribute('href');
        break;
      }
    }

    expect(editHref, 'no row in the content tree offered an Edit link').to.be.a('string');

    // Follow the tree's own link. Its href comes from the node's urlPath, so this is the
    // construction that produced the reported fragment-folder URL.
    await d.get(editHref as string);
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      `the content tree's Edit link (${editHref}) rendered nothing on the canvas`,
    );

    const structural = (await canvasResourceTypes(d))
      .filter((t) => STRUCTURAL_RESOURCE_TYPES.includes(t));
    expect(
      structural,
      `the content tree's Edit link renders a structural node as a component: ${editHref}`,
    ).to.deep.equal([]);

    observations.push(
      "The content tree's Edit link is built from the node's urlPath, so for an Experience "
        + 'Fragment folder it produces the folder URL rather than a variation. The editor '
        + 'resolves that to the master variation (S11), which is why this entry point works '
        + 'without changing the tree.',
    );

    record({
      scenarioId: 'S12',
      scenario: "follows the content tree's own Edit link into the editor",
      operation: 'xf:content-tree-entry',
      target: editHref as string,
      ui: 'the tree\'s Edit link lands on authorable components, no structural node rendered',
      outcome: 'PASS',
    });
  });

  it('S13 follows the editor\'s own Edit in Experience Fragments link', async () => {
    const d = driver as WebDriver;

    // Open a normal page, then use the link the editor renders rather than the path this
    // suite would have guessed. If that href ever loses its variation segment again, this
    // fails where the previous scenarios did not.
    await openEditorAt(d, '/tut-usa/home');

    const links = await d.findElements(By.css('a[href*="experience-fragments"]'));
    expect(links.length, 'the page editor renders no link to its experience fragments')
      .to.be.greaterThan(0);

    const href = await links[0].getAttribute('href');
    expect(href, 'the fragment link has no href').to.be.a('string');

    await d.get(href as string);
    await waitForPageReady(d);
    await d.wait(
      async () => (await d.findElements(By.css('[data-canvas-resource-type]'))).length > 0,
      45_000,
      `the editor's own fragment link (${href}) rendered nothing`,
    );

    const types = await canvasResourceTypes(d);
    expect(
      types.filter((t) => STRUCTURAL_RESOURCE_TYPES.includes(t)),
      `the editor's own fragment link renders a structural node as a component: ${href}`,
    ).to.deep.equal([]);

    record({
      scenarioId: 'S13',
      scenario: "follows the editor's own Edit in Experience Fragments link",
      operation: 'xf:editor-link',
      target: href as string,
      ui: 'the link lands on authorable components rather than a structural node',
      outcome: 'PASS',
    });
  });

  it('S14 never renders a structural node as a component, whatever the URL', async () => {
    const d = driver as WebDriver;

    // The invariant behind S11–S13. A folder or a variation is a container; the canvas is
    // for authorable components. Asserting this across several shapes of URL catches the
    // whole class from entry points nobody has enumerated.
    const urls = [
      '/tut-usa/home',
      '/content/experience-fragments/tut-usa/global/navigation',
      '/content/experience-fragments/tut-usa/global/navigation/master',
      '/content/experience-fragments/tut-usa/global/footer',
    ];

    const offenders: string[] = [];
    for (const url of urls) {
      await openEditorAt(d, url);
      const structural = (await canvasResourceTypes(d))
        .filter((t) => STRUCTURAL_RESOURCE_TYPES.includes(t));
      if (structural.length > 0) offenders.push(`${url} -> ${structural.join(', ')}`);
    }

    expect(offenders, `structural nodes rendered as components:\n  ${offenders.join('\n  ')}`)
      .to.deep.equal([]);

    record({
      scenarioId: 'S14',
      scenario: 'never renders a structural node as a component, whatever the URL',
      operation: 'xf:canvas-invariant',
      target: `${urls.length} editor URLs`,
      ui: `no ${STRUCTURAL_RESOURCE_TYPES.join('/')} node appeared on any canvas`,
      outcome: 'PASS',
    });
  });

  it('S15 saves to the node on screen, not the node named in the URL', async () => {
    const d = driver as WebDriver;
    const folderUrl = '/content/experience-fragments/tut-usa/global/navigation';
    const folderPath = 'content.experience-fragments.tut-usa.global.navigation';

    // The editor now resolves that folder to its master variation, which means Save has
    // two candidate parents. Writing to the folder would put components among the
    // variations and corrupt the fragment, so this checks the folder gained no children
    // beyond the variations it is supposed to have.
    const before = await call<Array<{ name: string; resourceType: string }>>(
      'GET',
      `${api}/content/children?path=${encodeURIComponent(folderPath)}`,
    );
    const beforeNames = (before.body ?? []).map((c) => c.name).sort();

    await openEditorAt(d, folderUrl);

    const save = await waitForVisible(d, By.css('[data-testid="editor-save-button"]'));
    await save.click();
    await waitForPageReady(d);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const after = await call<Array<{ name: string; resourceType: string }>>(
      'GET',
      `${api}/content/children?path=${encodeURIComponent(folderPath)}`,
    );
    const afterNames = (after.body ?? []).map((c) => c.name).sort();

    expect(afterNames, 'saving from a folder URL added children to the fragment folder')
      .to.deep.equal(beforeNames);

    // Every child of the folder is still a variation, not a component.
    for (const child of after.body ?? []) {
      expect(child.resourceType, `the folder gained a non-variation child "${child.name}"`)
        .to.equal('flexcms/xf-page');
    }

    record({
      scenarioId: 'S15',
      scenario: 'saves to the node on screen, not the node named in the URL',
      operation: 'xf:save-target',
      target: folderPath,
      api: `folder children unchanged (${afterNames.join(', ')}), all still variations`,
      outcome: 'PASS',
      notes: 'guards the corruption the folder resolution would otherwise have introduced',
    });
  });

  // ── Live copies ───────────────────────────────────────────────────────────

  /** Creates the blueprint page and its component, returning both paths. */
  async function createBlueprint(): Promise<{ page: string; component: string }> {
    const page = await call<{ path?: string }>('POST', `${api}/content/node`, {
      parentPath: `content.${SITE_ID}`,
      name: `${runId}-source`,
      resourceType: 'flexcms/page',
      properties: { 'jcr:title': 'REB-22 blueprint' },
      userId: 'admin',
    });
    expect(page.status, 'creating the blueprint page failed').to.equal(200);
    createdContentPaths.push(page.body.path as string);

    const component = await call<{ path?: string }>('POST', `${api}/content/node`, {
      parentPath: page.body.path,
      name: 'hero',
      resourceType: 'tut-usa/calls-to-action-promotions-campaigns/hero-banner',
      properties: { title: 'blueprint original' },
      userId: 'admin',
    });
    expect(component.status, 'creating the blueprint component failed').to.equal(200);

    return { page: page.body.path as string, component: component.body.path as string };
  }

  let blueprint: { page: string; component: string };
  let copyPath = '';

  it('S7 creates a live copy and reports the relationship', async () => {
    blueprint = await createBlueprint();

    const copy = await call<{ path?: string }>('POST', `${api}/livecopy`, {
      sourcePath: blueprint.page,
      targetParentPath: `content.${SITE_ID}`,
      targetName: `${runId}-copy`,
      deep: true,
      // A comma-separated string, not an array — sending an array is a 400.
      excludedProps: '',
      userId: 'admin',
    });
    expect(copy.status, 'creating the live copy failed').to.equal(200);
    copyPath = copy.body.path as string;
    createdContentPaths.push(copyPath);

    const status = await call<{ isLiveCopy: boolean; sourcePath: string | null; deep: boolean }>(
      'GET',
      `${api}/livecopy/status?targetPath=${encodeURIComponent(copyPath)}`,
    );
    expect(status.body.isLiveCopy, 'the copy does not report itself as a live copy').to.equal(true);
    expect(status.body.sourcePath, 'the copy points at the wrong blueprint').to.equal(blueprint.page);
    expect(status.body.deep, 'the copy should be deep').to.equal(true);

    // The blueprint is not itself a live copy.
    const sourceStatus = await call<{ isLiveCopy: boolean }>(
      'GET',
      `${api}/livecopy/status?targetPath=${encodeURIComponent(blueprint.page)}`,
    );
    expect(sourceStatus.body.isLiveCopy, 'the blueprint must not be a live copy').to.equal(false);

    const copies = await call<Array<{ targetPath: string }>>(
      'GET',
      `${api}/livecopy?sourcePath=${encodeURIComponent(blueprint.page)}`,
    );
    expect(copies.body.map((c) => c.targetPath), 'the copy is not listed against its blueprint')
      .to.include(copyPath);

    // A deep copy brings the blueprint's components with it.
    const children = await call<Array<{ name: string }>>(
      'GET',
      `${api}/content/children?path=${encodeURIComponent(copyPath)}`,
    );
    expect(children.body.map((c) => c.name), 'the deep copy did not include the component')
      .to.include('hero');

    record({
      scenarioId: 'S7',
      scenario: 'creates a live copy and reports the relationship',
      operation: 'livecopy:create',
      target: `${blueprint.page} -> ${copyPath}`,
      api: 'status reports isLiveCopy with the blueprint path; deep copy included the component',
      outcome: 'PASS',
    });
  });

  it('S8 rolls blueprint changes out to the live copy', async () => {
    const edited = await call('PUT', `${api}/content/node/properties`, {
      path: blueprint.component,
      properties: { title: 'blueprint rolled out' },
      userId: 'admin',
    });
    expect(edited.status).to.equal(200);

    const rollout = await call<{ updatedNodes: number; errors: string[] }>(
      'POST',
      `${api}/livecopy/rollout?sourcePath=${encodeURIComponent(blueprint.page)}&userId=admin`,
    );
    expect(rollout.status).to.equal(200);
    expect(rollout.body.errors, 'rollout reported errors').to.deep.equal([]);
    expect(rollout.body.updatedNodes, 'rollout updated nothing').to.be.greaterThan(0);

    const copyComponent = await call<{ properties?: Record<string, unknown> }>(
      'GET',
      `${api}/content/node?path=${encodeURIComponent(`${copyPath}.hero`)}`,
    );
    expect(copyComponent.status, 'the copy lost its component').to.equal(200);
    expect(copyComponent.body.properties?.title, 'the rollout did not reach the live copy')
      .to.equal('blueprint rolled out');

    record({
      scenarioId: 'S8',
      scenario: 'rolls blueprint changes out to the live copy',
      operation: 'livecopy:rollout',
      target: copyPath,
      api: `rollout updatedNodes=${rollout.body.updatedNodes}; copy component carries the new title`,
      outcome: 'PASS',
    });
  });

  it('S9 stops syncing a detached copy and leaves its local value alone', async () => {
    const detached = await call(
      'DELETE',
      `${api}/livecopy?targetPath=${encodeURIComponent(copyPath)}&deep=true`,
    );
    expect(detached.status, 'detaching failed').to.equal(200);

    const status = await call<{ isLiveCopy: boolean }>(
      'GET',
      `${api}/livecopy/status?targetPath=${encodeURIComponent(copyPath)}`,
    );
    expect(status.body.isLiveCopy, 'the copy still reports a blueprint after detaching')
      .to.equal(false);

    // Change the blueprint again and roll out. The detached copy must not move.
    await call('PUT', `${api}/content/node/properties`, {
      path: blueprint.component,
      properties: { title: 'blueprint after detach' },
      userId: 'admin',
    });
    const rollout = await call<{ updatedNodes: number }>(
      'POST',
      `${api}/livecopy/rollout?sourcePath=${encodeURIComponent(blueprint.page)}&userId=admin`,
    );
    expect(rollout.body.updatedNodes, 'rollout still touched a detached copy').to.equal(0);

    const copyComponent = await call<{ properties?: Record<string, unknown> }>(
      'GET',
      `${api}/content/node?path=${encodeURIComponent(`${copyPath}.hero`)}`,
    );
    expect(
      copyComponent.body.properties?.title,
      'a detached copy must keep the value it had, not follow the blueprint',
    ).to.equal('blueprint rolled out');

    record({
      scenarioId: 'S9',
      scenario: 'stops syncing a detached copy and leaves its local value alone',
      operation: 'livecopy:detach',
      target: copyPath,
      api: 'status isLiveCopy=false; a later rollout updated 0 nodes and the copy kept its value',
      outcome: 'PASS',
    });
  });

  it('S10 answers invalid live-copy requests with actionable errors', async () => {
    // Missing source: 404, naming the path.
    const missingSource = await call<{ detail?: string }>('POST', `${api}/livecopy`, {
      sourcePath: `content.${SITE_ID}.${runId}-does-not-exist`,
      targetParentPath: `content.${SITE_ID}`,
      targetName: `${runId}-invalid`,
      deep: true,
      excludedProps: '',
      userId: 'admin',
    });
    expect(missingSource.status, 'an unknown source should be 404, not a server error')
      .to.equal(404);
    expect(missingSource.body.detail ?? '', 'the error should name the missing path')
      .to.contain(`${runId}-does-not-exist`);

    // Duplicate target: 409, naming the collision.
    const duplicate = await call<{ detail?: string }>('POST', `${api}/livecopy`, {
      sourcePath: blueprint.page,
      targetParentPath: `content.${SITE_ID}`,
      targetName: `${runId}-copy`,
      deep: true,
      excludedProps: '',
      userId: 'admin',
    });
    expect(duplicate.status, 'a name collision should be 409, not a server error').to.equal(409);
    expect(duplicate.body.detail ?? '').to.contain(`${runId}-copy`);

    // Malformed body: 400, naming the field. `excludedProps` is a string; an array is
    // the mistake a caller reading the status name alone would most easily make.
    const malformed = await call<{ detail?: string }>('POST', `${api}/livecopy`, {
      sourcePath: blueprint.page,
      targetParentPath: `content.${SITE_ID}`,
      targetName: `${runId}-malformed`,
      deep: true,
      excludedProps: [],
      userId: 'admin',
    });
    expect(malformed.status, 'an unreadable body should be 400, not a server error').to.equal(400);
    expect(malformed.body.detail ?? '', 'the error should name the offending field')
      .to.contain('excludedProps');

    // Rolling out a source that does not exist used to answer 200 with `updatedNodes: 0`,
    // and this scenario asserted that while recording it as a known defect. It is a 404
    // now, and `S16` covers it — asserting it twice would just be duplication.

    record({
      scenarioId: 'S10',
      scenario: 'answers invalid live-copy requests with actionable errors',
      operation: 'livecopy:negative',
      target: 'invalid source / duplicate target / malformed body',
      api: 'missing source 404, duplicate target 409, unreadable body 400 — each naming the cause',
      outcome: 'PASS',
      notes: 'rollout of an unknown source is covered by S16, which asserts its 404',
    });
  });

  it('S16 refuses to roll out a blueprint that does not exist', async () => {
    // `rollout` used to answer 200 with `updatedNodes: 0` and no errors for a source path
    // that named nothing — identical to the response for a real blueprint that simply has
    // no live copies (S8's counterpart). A typo'd or deleted blueprint therefore reported
    // a successful rollout. Same failure shape as the bulk delete that counted missing
    // paths as succeeded.
    const missing = `${blueprint.page}-does-not-exist-${Date.now()}`;

    const rollout = await call<{ updatedNodes?: number }>(
      'POST',
      `${api}/livecopy/rollout?sourcePath=${encodeURIComponent(missing)}&userId=admin`,
    );

    expect(
      rollout.status,
      `rolling out a nonexistent blueprint answered ${rollout.status} instead of 404`,
    ).to.equal(404);
    expect(
      rollout.body.updatedNodes,
      'a rejected rollout must not report an update count',
    ).to.equal(undefined);

    record({
      scenarioId: 'S16',
      scenario: 'refuses to roll out a blueprint that does not exist',
      operation: 'livecopy:rollout',
      target: missing,
      api: `POST /livecopy/rollout -> ${rollout.status}`,
      outcome: 'PASS',
      notes: 'nonexistent blueprint is rejected rather than reported as zero updates',
    });
  });
});
