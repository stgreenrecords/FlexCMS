/**
 * FlexCMS Selenium E2E — REB-24: secondary admin routes.
 *
 * Sites, translations, the component registry, dashboard navigation and route-level
 * health. The task's first acceptance criterion is the interesting one: **distinguish
 * read-only or static UI from backed authoring functionality, with evidence.** Several
 * of these routes look like working tools and are not, so each scenario records which
 * of the two it found.
 *
 * What that distinction turned up, verified against the running app:
 *
 * - `/components` rendered a completely blank document — no heading, no navigation,
 *   zero focusable elements — because the registry's 18 free-form group names were cast
 *   to a seven-member union and the colour lookup threw on `undefined`. Fixed under this
 *   task; `S4` and `S8` would both fail again if it regressed.
 * - `/translations` never fetches anything. There is an i18n backend (dictionary,
 *   language copies, `TranslationService`) but no read endpoint for translation keys, so
 *   the matrix is static by necessity. `S3` asserts the honest empty state rather than
 *   pretending the filters work over data.
 * - The component registry offers no route into the page editor, which `S5` records as
 *   the blocker the spec anticipates.
 */
import { expect } from 'chai';
import { By, Key, type WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { loadEnv } from '../../driver/env';
import { waitForPageReady, waitForVisible } from '../../driver/waits';
import { OperationMatrixRecorder, type OperationOutcome } from '../../reports/operationMatrix';

const TASK_ID = 'REB-24';

/** Every admin route the navigation smoke visits, with the heading it must render. */
const ROUTES: Array<{ path: string; heading: string | null }> = [
  { path: '/dashboard', heading: 'Workspace Overview' },
  { path: '/sites', heading: 'Site Manager' },
  { path: '/content', heading: 'Content Tree' },
  { path: '/dam', heading: 'Media Library' },
  { path: '/workflows', heading: 'Workflow Inbox' },
  { path: '/experience-fragments', heading: 'Experience Fragments' },
  { path: '/pim', heading: 'Catalog List' },
  { path: '/components', heading: 'Component Registry' },
  { path: '/translations', heading: 'Language Matrix' },
];

describe('REB-24 secondary admin routes suite', function () {
  this.timeout(900_000);

  const env = loadEnv();
  const recorder = new OperationMatrixRecorder(TASK_ID, 'secondary-routes-matrix.csv');
  const blockers: string[] = [];
  const observations: string[] = [];

  let driver: WebDriver | undefined;

  attachFailureScreenshot(() => driver);

  function record(row: {
    scenarioId: string;
    scenario: string;
    operation: string;
    target: string;
    api?: string;
    ui?: string;
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
      publishEvidence: '',
      outcome: row.outcome,
      notes: row.notes ?? '',
    });
  }

  /** Opens a route and waits for the admin shell to be present. */
  async function open(path: string): Promise<WebDriver> {
    const d = driver as WebDriver;
    await d.get(`${env.adminUrl}${path}`);
    await waitForPageReady(d);
    await waitForVisible(d, By.css('[data-testid="sidebar-nav"]'));
    return d;
  }

  before(async () => {
    driver = await createDriver();
  });

  after(async () => {
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

  it('S1 renders every admin route with its heading and no fatal error', async () => {
    const missingHeadings: string[] = [];

    for (const route of ROUTES) {
      const d = await open(route.path);

      // A route that throws during render leaves an empty document: this is what
      // `/components` did, and checking the shell is what catches it.
      const focusables = await d.findElements(By.css('a[href], button, input, select, textarea'));
      expect(
        focusables.length,
        `${route.path} rendered no interactive elements — the route probably threw while rendering`,
      ).to.be.greaterThan(5);

      const body = (await (await d.findElement(By.css('body'))).getText()).toLowerCase();
      // Matched on Next's own not-found copy rather than the string "404": the component
      // registry legitimately lists a component called "Error Page 404", so searching the
      // page text for a status code finds content, not a broken route.
      expect(body, `${route.path} rendered a not-found page`)
        .to.not.contain('this page could not be found');
      expect(body, `${route.path} rendered an unhandled error`).to.not.contain('unhandled');
      expect(body, `${route.path} rendered a client exception`).to.not.contain('client-side exception');

      const headings = await d.findElements(By.css('h1'));
      if (route.heading === null) {
        // Recorded rather than asserted away: this route has no h1 at all.
        if (headings.length === 0) missingHeadings.push(route.path);
      } else {
        expect(headings.length, `${route.path} has no h1`).to.be.greaterThan(0);
        expect(await headings[0].getText(), `${route.path} heading`).to.contain(route.heading);
      }
    }

    if (missingHeadings.length > 0) {
      observations.push(
        `These routes render no h1 at all, so they have no accessible page title: ${missingHeadings.join(', ')}. ` +
          'Every other admin route has one, which makes this an inconsistency rather than a house style.',
      );
    }

    record({
      scenarioId: 'S1',
      scenario: 'renders every admin route with its heading and no fatal error',
      operation: 'admin:navigation-smoke',
      target: ROUTES.map((r) => r.path).join(' | '),
      ui: `${ROUTES.length} routes rendered; ${ROUTES.length - missingHeadings.length} carry an h1`,
      outcome: 'PASS',
      notes: missingHeadings.length > 0 ? `no h1 on: ${missingHeadings.join(', ')}` : '',
    });
  });

  it('S2 shows sites from the API, not a static model', async () => {
    const res = await fetch(`${env.authorApiUrl}/admin/sites`);
    expect(res.status, 'the sites endpoint is unavailable').to.equal(200);
    const sites = (await res.json()) as Array<{ siteId: string; title: string }>;
    expect(sites.length, 'no configured sites to verify against').to.be.greaterThan(0);

    const d = await open('/sites');
    const body = await (await d.findElement(By.css('body'))).getText();

    // Each configured site must appear by name, which is what makes this backed rather
    // than a static mock: the assertion is driven by whatever the API returns.
    for (const site of sites) {
      expect(body, `site "${site.title}" from the API is not shown`).to.contain(site.title);
    }

    record({
      scenarioId: 'S2',
      scenario: 'shows sites from the API, not a static model',
      operation: 'sites:list',
      target: sites.map((s) => s.siteId).join(', '),
      api: `GET /admin/sites returned ${sites.length} site(s)`,
      ui: 'every site returned by the API is rendered by title',
      outcome: 'PASS',
      notes: 'backed, read-only: the route offers no site mutation',
    });
  });

  it('S3 shows the translations matrix as static UI with an honest empty state', async () => {
    const d = await open('/translations');

    await waitForVisible(d, By.css('[data-testid="translations-heading"]'));
    const search = await waitForVisible(d, By.css('[data-testid="translations-search"]'));

    // The search box accepts input — the control works, there is simply nothing behind it.
    await search.click();
    await search.sendKeys('anything');
    expect(await search.getAttribute('value'), 'the search box does not accept input')
      .to.equal('anything');

    const rows = await d.findElements(By.css('tbody tr'));
    expect(rows.length, 'the matrix has rows, so it is no longer static — update this scenario')
      .to.equal(0);

    const body = await (await d.findElement(By.css('body'))).getText();
    expect(body, 'an empty matrix should say so rather than render nothing')
      .to.contain('No translation keys');

    blockers.push(
      'The translations route is static: it performs no fetch, and there is no read endpoint ' +
        'for translation keys to call. The backend has the model and the service — ' +
        'I18nDictionary, LanguageCopy, TranslationService, and a createLanguageCopy action on ' +
        'SiteAdminController — but nothing exposes the dictionary for reading, so the whole ' +
        'matrix, its status filters and its pagination have no data source. Scenario 3\'s ' +
        'filter/status/pagination coverage cannot be written until that endpoint exists.',
    );

    record({
      scenarioId: 'S3',
      scenario: 'shows the translations matrix as static UI with an honest empty state',
      operation: 'translations:static',
      target: '/translations',
      api: 'none — the page issues no request, and no read endpoint exists',
      ui: 'heading and search render; search accepts input; empty state shown; 0 rows',
      outcome: 'BLOCKED',
      notes: 'static UI, not backed authoring (AC1)',
    });
  });

  it('S4 loads the component registry and makes it searchable', async () => {
    const res = await fetch(`${env.authorApiUrl}/content/v1/component-registry`);
    expect(res.status).to.equal(200);
    const registry = (await res.json()) as {
      components: Array<{ resourceType: string; title: string; group: string; dataSchema?: unknown }>;
    };
    expect(registry.components.length, 'the registry is empty').to.be.greaterThan(400);

    const d = await open('/components');
    await waitForVisible(d, By.css('[data-testid="components-heading"]'));

    const body = await (await d.findElement(By.css('body'))).getText();

    // The registry publishes descriptive group names. The route used to cast them to a
    // seven-member union and crash on the colour lookup; showing a real one proves both
    // that it renders and that the group survived the mapping.
    const groupNames = [...new Set(registry.components.map((c) => c.group))].filter((g) =>
      g?.includes('&'),
    );
    expect(groupNames.length, 'expected descriptive group names in the registry')
      .to.be.greaterThan(0);
    const shownGroups = groupNames.filter((g) => body.includes(g));
    expect(
      shownGroups.length,
      `none of the registry's group names are shown: ${groupNames.slice(0, 3).join(' / ')}`,
    ).to.be.greaterThan(0);

    // Search narrows to a component the API also knows about.
    const target = registry.components.find((c) => c.resourceType.includes('hero-banner'))
      ?? registry.components[0];
    const search = await waitForVisible(d, By.css('[data-testid="components-search"]'));
    await search.click();
    await search.sendKeys(target.title);
    await waitForPageReady(d);

    const filtered = await (await d.findElement(By.css('body'))).getText();
    expect(filtered, `search for "${target.title}" hid the component itself`)
      .to.contain(target.title);

    // Schema metadata is what REB-19's authoring matrix depends on (AC2).
    const withSchema = registry.components.filter((c) => c.dataSchema);
    expect(withSchema.length, 'no component publishes a dataSchema — REB-19 has nothing to author')
      .to.be.greaterThan(0);

    record({
      scenarioId: 'S4',
      scenario: 'loads the component registry and makes it searchable',
      operation: 'components:registry',
      target: `${registry.components.length} components`,
      api: `GET /content/v1/component-registry returned ${registry.components.length}; ${withSchema.length} publish a dataSchema`,
      ui: `route renders with the registry's own group names; search narrows to "${target.title}"`,
      outcome: 'PASS',
      notes: 'AC2: dataSchema visibility is what REB-19 authoring depends on',
    });
  });

  it('S5 records that the registry offers no route into the page editor', async () => {
    const d = await open('/components');

    const editorLinks = await d.findElements(By.css('a[href*="/editor"]'));
    expect(
      editorLinks.length,
      'an editor link now exists — replace this scenario with real authoring coverage',
    ).to.equal(0);

    blockers.push(
      'The component registry has no bridge into the page editor: /components renders no ' +
        'link or action targeting /editor, so an author who finds a component in the registry ' +
        'cannot get from there to authoring it. The spec anticipates this ("otherwise document ' +
        'missing integration as blocker for later REB-19 coverage").',
    );

    record({
      scenarioId: 'S5',
      scenario: 'records that the registry offers no route into the page editor',
      operation: 'components:authoring-bridge',
      target: '/components -> /editor',
      ui: 'no anchor targeting /editor anywhere on the route',
      outcome: 'BLOCKED',
      notes: 'documented per the spec; REB-19 covers authoring from the editor side',
    });
  });

  it('S6 follows the dashboard link to its route', async () => {
    const d = await open('/dashboard');

    // The sidebar is the real navigation; the dashboard body carries a single link.
    const bodyLinks = await d.findElements(By.css('main a[href^="/"]'));
    const hrefs: string[] = [];
    for (const link of bodyLinks) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(new URL(href).pathname);
    }

    expect(hrefs.length, 'the dashboard body has no links at all').to.be.greaterThan(0);

    // Every link it does have must resolve to a route that renders.
    for (const path of [...new Set(hrefs)]) {
      const d2 = await open(path);
      const focusables = await d2.findElements(By.css('a[href], button, input'));
      expect(focusables.length, `dashboard link ${path} leads to a route that renders nothing`)
        .to.be.greaterThan(5);
    }

    observations.push(
      `The dashboard body links to ${[...new Set(hrefs)].join(', ')} only — the spec's ` +
        '"primary dashboard cards/links" are stat tiles without navigation, so route coverage ' +
        'from the dashboard is thinner than the scenario assumes.',
    );

    record({
      scenarioId: 'S6',
      scenario: 'follows the dashboard link to its route',
      operation: 'dashboard:links',
      target: [...new Set(hrefs)].join(', '),
      ui: `${new Set(hrefs).size} distinct in-body link(s), each resolving to a rendering route`,
      outcome: 'PASS',
    });
  });

  it('S7 shows an empty state when a filter matches nothing', async () => {
    const d = await open('/components');
    const search = await waitForVisible(d, By.css('[data-testid="components-search"]'));

    await search.click();
    await search.sendKeys('zzz-no-such-component-zzz');
    await waitForPageReady(d);

    const body = (await (await d.findElement(By.css('body'))).getText()).toLowerCase();
    // Something must acknowledge the empty result — silence looks like a broken filter.
    const acknowledges = ['no component', 'no results', 'nothing found', '0 component', 'no matches']
      .some((phrase) => body.includes(phrase));
    expect(
      acknowledges,
      'a filter matching nothing renders no empty state, so it is indistinguishable from a failure',
    ).to.equal(true);

    record({
      scenarioId: 'S7',
      scenario: 'shows an empty state when a filter matches nothing',
      operation: 'components:empty-state',
      target: 'search "zzz-no-such-component-zzz"',
      ui: 'the route acknowledges the empty result rather than rendering an empty list silently',
      outcome: 'PASS',
    });
  });

  it('S8 gives the secondary routes landmarks, headings and a keyboard path', async () => {
    const failures: string[] = [];

    for (const path of ['/sites', '/components', '/translations', '/dashboard']) {
      const d = await open(path);

      const mains = await d.findElements(By.css('main'));
      if (mains.length !== 1) failures.push(`${path}: expected one <main>, found ${mains.length}`);

      const navs = await d.findElements(By.css('nav'));
      if (navs.length === 0) failures.push(`${path}: no <nav> landmark`);

      const h1s = await d.findElements(By.css('h1'));
      if (h1s.length !== 1) failures.push(`${path}: expected one <h1>, found ${h1s.length}`);

      // Tab must reach a real control rather than stalling on the document body.
      const body = await d.findElement(By.css('body'));
      await body.sendKeys(Key.TAB);
      const focusedTag = await d.executeScript<string>(
        'return document.activeElement ? document.activeElement.tagName : "NONE";',
      );
      if (!['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focusedTag)) {
        failures.push(`${path}: tab from the body focused <${focusedTag}>, not a control`);
      }
    }

    expect(failures, `accessibility smoke findings:\n  ${failures.join('\n  ')}`).to.deep.equal([]);

    record({
      scenarioId: 'S8',
      scenario: 'gives the secondary routes landmarks, headings and a keyboard path',
      operation: 'admin:a11y-smoke',
      target: '/sites, /components, /translations, /dashboard',
      ui: 'each route: one <main>, a <nav>, exactly one <h1>, and tab reaches a control',
      outcome: 'PASS',
    });
  });
});
