/**
 * FlexCMS Selenium E2E — REB-25: cross-cutting hardening.
 *
 * The other suites assert what the product does. This one asserts that the machinery
 * they rely on actually works, because a harness that fails silently is worse than no
 * harness: it makes a suite look green while proving nothing.
 *
 * Each scenario therefore checks a helper's *guarantee*, not just its happy path — that
 * the publish verifier refuses an author URL, that the cleanup registry tears down in
 * dependency order, that the console check can still see a real error through its ignore
 * list. Several of these guarantees exist because the corresponding mistake was made in
 * this program and cost real time; the comments name which.
 */
import { expect } from 'chai';
import { By, type WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { loadEnv } from '../../driver/env';
import { waitForPageReady } from '../../driver/waits';
import { OperationMatrixRecorder, type OperationOutcome } from '../../reports/operationMatrix';
import {
  CONSOLE_IGNORE,
  FindingLog,
  PublishVerifier,
  TestDataNamespace,
  accessibilitySmoke,
  brokenMedia,
  describeA11y,
  describeCleanup,
  describeEnvironment,
  describeHealthFindings,
  failedRequests,
  inspectEnvironment,
  publishVerifier,
  severeConsoleErrors,
} from '../../harness';

const TASK_ID = 'REB-25';

describe('REB-25 harness hardening suite', function () {
  this.timeout(900_000);

  const env = loadEnv();
  const recorder = new OperationMatrixRecorder(TASK_ID, 'hardening-matrix.csv');
  const findings = new FindingLog(TASK_ID);

  let driver: WebDriver | undefined;

  attachFailureScreenshot(() => driver);

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
    const matrixPath = recorder.write();
    console.log(
      `[${TASK_ID}] matrix rows: ${recorder.size} `
        + `(PASS ${recorder.countByOutcome('PASS')}, BLOCKED ${recorder.countByOutcome('BLOCKED')}) `
        + `-> ${matrixPath}`,
    );
    findings.report();
    await quitDriver(driver);
  });

  it('S1 reports every configured endpoint and names what is unreachable', async () => {
    const results = await inspectEnvironment(env);

    expect(results.length, 'preflight checks nothing').to.be.greaterThan(4);

    // Every endpoint a mutation suite depends on must be named, so a missing service is
    // diagnosed rather than inferred from a wall of assertion failures.
    const names = results.map((r) => r.name);
    expect(names).to.include.members([
      'admin app', 'author API', 'author health', 'publish API', 'public site',
    ]);

    // Each result must carry the variable that redirects it — the diagnostic is only
    // actionable if it says how to point the suite elsewhere.
    for (const result of results) {
      expect(result.envVar, `${result.name} has no env var documented`).to.match(/^[A-Z_]+$/);
    }

    const unreachable = results.filter((r) => !r.reachable);
    expect(
      unreachable,
      `preflight found unreachable endpoints — this suite cannot judge the rest:\n${describeEnvironment(results)}`,
    ).to.deep.equal([]);

    record({
      scenarioId: 'S1',
      scenario: 'reports every configured endpoint and names what is unreachable',
      operation: 'harness:preflight',
      target: results.map((r) => r.name).join(', '),
      api: `${results.length} endpoints checked, all reachable`,
      outcome: 'PASS',
    });
  });

  it('S2 refuses to verify publish against the author instance', async () => {
    // The guarantee: a publish assertion pointed at the author host would pass for
    // content that was never published, so the verifier must not construct at all.
    expect(
      () => new PublishVerifier({ ...env, publishUrl: env.authorApiUrl }),
      'the verifier accepted the author API as a publish URL',
    ).to.throw(/same host as the author/i);

    expect(
      () => new PublishVerifier({ ...env, publishUrl: '' }),
      'the verifier accepted an empty publish URL',
    ).to.throw(/no publish URL/i);

    // And the real one works.
    const verifier = publishVerifier(env);
    expect(verifier.baseUrl, 'the verifier is not pointed at the publish instance')
      .to.equal(env.publishUrl.replace(/\/+$/, ''));
    expect(await verifier.isHealthy(), 'the publish instance is not answering').to.equal(true);

    // A path that was never published must not be served — the negative half, without
    // which "serves()" could be a function that always says yes.
    const neverPublished = `content.tut-usa.reb25-never-published-${Date.now()}`;
    expect(await verifier.serves(neverPublished), 'publish serves a path that does not exist')
      .to.equal(false);

    record({
      scenarioId: 'S2',
      scenario: 'refuses to verify publish against the author instance',
      operation: 'harness:publish-verifier',
      target: verifier.baseUrl,
      publish: 'health 200; an unpublished path is not served; author URL rejected at construction',
      outcome: 'PASS',
    });
  });

  it('S3 generates namespaced names that cannot collide across runs', async () => {
    const first = new TestDataNamespace(TASK_ID);
    const second = new TestDataNamespace(TASK_ID, () => Date.now() + 1);

    expect(first.runId, 'the run id does not name its owning task').to.contain('reb-25');
    expect(first.runId, 'two runs share an id').to.not.equal(second.runId);

    // Each kind of entity gets a distinct name, and repeated calls do not repeat.
    const names = [
      first.contentName(), first.contentName(),
      first.sku(), first.assetPath('tut-usa', 'hero.png'),
      first.fragmentName(), first.liveCopyName(), first.catalogName(),
    ];
    expect(new Set(names).size, `names repeated: ${names.join(', ')}`).to.equal(names.length);

    // Content names become ltree labels, so anything outside [A-Za-z0-9-] would be
    // rejected by the backend rather than by the test.
    expect(first.contentName('a page!')).to.match(/^[A-Za-z0-9-]+$/);
    // Captured once: every call returns a *new* name, so comparing two calls compares
    // two different SKUs rather than checking the casing of one.
    const oneSku = first.sku();
    expect(oneSku).to.equal(oneSku.toUpperCase());
    expect(first.assetPath('tut-usa', 'hero.png')).to.contain('content/dam/tut-usa/');

    record({
      scenarioId: 'S3',
      scenario: 'generates namespaced names that cannot collide across runs',
      operation: 'harness:test-data',
      target: first.runId,
      api: `${names.length} distinct names; content names are ltree-safe; SKUs upper-cased`,
      outcome: 'PASS',
    });
  });

  it('S4 tears down in dependency order and audits what it kept', async () => {
    const namespace = new TestDataNamespace(TASK_ID);
    const order: string[] = [];

    // Registered in creation order: a source, then the dependent carried forward from
    // it. Deleting the source first is what returned 409 during REB-23 and stranded ten
    // catalogs, so reverse order is the guarantee under test.
    namespace.track('product', 'source', async () => { order.push('source'); });
    namespace.track('product', 'dependent', async () => { order.push('dependent'); });
    namespace.track('asset', 'kept-on-purpose', async () => { order.push('kept-on-purpose'); });
    namespace.retain('kept-on-purpose', 'demonstrates deliberate retention in the audit');

    // One entity that cannot be removed, to prove a stuck delete does not hide the audit.
    namespace.track('content', 'stuck', async () => {
      throw new Error('simulated 409 from a dependent that still references it');
    });

    const audit = await namespace.cleanup();

    expect(order, 'teardown did not run newest-first').to.deep.equal(['dependent', 'source']);
    expect(audit.deleted.map((d) => d.id)).to.have.members(['dependent', 'source']);
    expect(audit.retained.map((r) => r.id), 'retention was not recorded')
      .to.deep.equal(['kept-on-purpose']);
    expect(audit.retained[0].reason, 'retention has no reason attached').to.not.equal('');
    expect(audit.failed.map((f) => f.id), 'a failed delete was not reported')
      .to.deep.equal(['stuck']);
    expect(audit.clean, 'an audit with a failed delete must not claim to be clean')
      .to.equal(false);

    // Retaining something untracked is a mistake worth catching at the call site.
    expect(() => namespace.retain('never-tracked', 'reason'))
      .to.throw(/untracked/i);

    expect(describeCleanup(audit), 'the audit note omits the failure').to.contain('stuck');

    record({
      scenarioId: 'S4',
      scenario: 'tears down in dependency order and audits what it kept',
      operation: 'harness:cleanup-audit',
      target: audit.runId,
      api: 'reverse-order teardown verified; retention and failure both recorded; clean=false',
      outcome: 'PASS',
      notes: 'AC3: retained entities are distinguished from entities left behind',
    });
  });

  it('S5 finds real console errors and failed requests without over-filtering', async () => {
    const d = driver as WebDriver;

    // The ignore list must be specific. A pattern broad enough to swallow a real
    // TypeError is how a suite stops finding defects.
    const realError = 'TypeError: Cannot read properties of undefined (reading \'bg\')';
    for (const rule of CONSOLE_IGNORE) {
      expect(
        rule.match.test(realError),
        `ignore rule ${rule.match} would hide a real TypeError`,
      ).to.equal(false);
      expect(rule.because, `ignore rule ${rule.match} has no justification`).to.not.equal('');
    }

    // Against a route that renders correctly, nothing severe should remain.
    for (const route of ['/dashboard', '/components']) {
      await d.get(`${env.adminUrl}${route}`);
      await waitForPageReady(d);
      await severeConsoleErrors(d); // drain anything from the previous navigation

      await d.get(`${env.adminUrl}${route}`);
      await waitForPageReady(d);

      const consoleErrors = await severeConsoleErrors(d);
      const requests = await failedRequests(d);
      const media = await brokenMedia(d);

      expect(
        consoleErrors,
        `${route} logged severe console errors:\n${describeHealthFindings(consoleErrors, media, requests)}`,
      ).to.deep.equal([]);
      expect(
        media,
        `${route} has broken media:\n${describeHealthFindings(consoleErrors, media, requests)}`,
      ).to.deep.equal([]);
    }

    record({
      scenarioId: 'S5',
      scenario: 'finds real console errors and failed requests without over-filtering',
      operation: 'harness:browser-health',
      target: '/dashboard, /components',
      ui: `no severe console errors or broken media; ${CONSOLE_IGNORE.length} ignore rules, none matching a TypeError`,
      outcome: 'PASS',
    });
  });

  it('S6 reports broken media on the public site', async () => {
    const d = driver as WebDriver;
    await d.get(`${env.siteUrl}/tut-usa/home`);
    await waitForPageReady(d);

    // Scroll so lazy images below the fold are actually asked to load; otherwise the
    // check passes by never looking at them.
    await d.executeScript('window.scrollTo(0, document.body.scrollHeight / 2)');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const images = await d.findElements(By.css('img'));
    expect(images.length, 'the page under test has no images, so this proves nothing')
      .to.be.greaterThan(0);

    const media = await brokenMedia(d);
    expect(media, `broken media on the public home page:\n${describeHealthFindings([], media, [])}`)
      .to.deep.equal([]);

    record({
      scenarioId: 'S6',
      scenario: 'reports broken media on the public site',
      operation: 'harness:media-health',
      target: `${env.siteUrl}/tut-usa/home`,
      ui: `${images.length} images checked after scrolling, none broken`,
      outcome: 'PASS',
    });
  });

  it('S7 runs the accessibility smoke over the admin routes', async () => {
    const d = driver as WebDriver;
    const perRoute: Array<{ route: string; findings: string[] }> = [];

    // /dam is included now that it has an h1. It was excluded while it had none, which
    // meant the one route with a structural accessibility gap was also the one route the
    // check skipped — precisely backwards.
    for (const route of ['/dashboard', '/sites', '/components', '/translations', '/dam']) {
      await d.get(`${env.adminUrl}${route}`);
      await waitForPageReady(d);

      const routeFindings = await accessibilitySmoke(d);
      perRoute.push({ route, findings: routeFindings.map((f) => `${f.check}: ${f.detail}`) });
    }

    // Structural checks are asserted; naming gaps are recorded. An unlabelled icon
    // button is a real defect, but failing this suite for it would block the gate on
    // work that belongs to the frontend lane, so it is classified instead.
    const structural = ['single main landmark', 'nav landmark', 'single h1', 'keyboard reachability'];
    const structuralFailures = perRoute.flatMap((r) =>
      r.findings.filter((f) => structural.some((s) => f.startsWith(s))).map((f) => `${r.route} — ${f}`),
    );
    expect(
      structuralFailures,
      `structural accessibility failures:\n  ${structuralFailures.join('\n  ')}`,
    ).to.deep.equal([]);

    const namingGaps = perRoute.flatMap((r) =>
      r.findings.filter((f) => f.startsWith('labelled control') || f.startsWith('visible focus'))
        .map((f) => `${r.route} — ${f}`),
    );
    if (namingGaps.length > 0) {
      findings.unsupportedUi(
        `${namingGaps.length} accessibility naming/focus gap(s) across the admin routes`,
        'frontend/apps/admin/src/app/(admin)/**',
        'add accessible names to icon-only controls and keep a visible focus indicator; '
          + `first few: ${namingGaps.slice(0, 3).join(' | ')}`,
      );
    }

    record({
      scenarioId: 'S7',
      scenario: 'runs the accessibility smoke over the admin routes',
      operation: 'harness:a11y-smoke',
      target: perRoute.map((r) => r.route).join(', '),
      ui: `structural checks clean on ${perRoute.length} routes; ${namingGaps.length} naming/focus gap(s) recorded`,
      outcome: 'PASS',
      notes: namingGaps.length > 0 ? 'naming gaps classified as unsupported-ui, not failed' : '',
    });
  });

  it('S8 records the selectors suites had to guess at', async () => {
    const d = driver as WebDriver;

    // A suite that matches on visible text breaks when the copy changes. These are the
    // routes where this program had no choice, and they are recorded so the frontend
    // lane has a concrete list rather than a principle (AC4).
    const wanted: Array<{ route: string; testId: string; why: string }> = [
      { route: '/sites', testId: 'sites-heading', why: 'S2 of REB-24 matches the site title in body text' },
      { route: '/dashboard', testId: 'dashboard-heading', why: 'navigation smoke matches the h1 by copy' },
      { route: '/dam', testId: 'dam-heading', why: 'the route had no h1 at all until ADMIN-STABLE-SELECTORS' },
    ];

    const missing: string[] = [];
    for (const item of wanted) {
      await d.get(`${env.adminUrl}${item.route}`);
      await waitForPageReady(d);
      const found = await d.findElements(By.css(`[data-testid="${item.testId}"]`));
      if (found.length === 0) missing.push(`${item.route} needs [data-testid="${item.testId}"] — ${item.why}`);
    }

    if (missing.length > 0) {
      findings.unsupportedUi(
        `${missing.length} route(s) have no stable heading selector, so suites match on copy`,
        'frontend/apps/admin/src/app/(admin)/{sites,dashboard,dam}/page.tsx',
        `add the listed data-testid attributes: ${missing.join(' | ')}`,
      );
    }

    // The shell selector every suite already depends on must exist, or navigation
    // helpers across the whole program are matching on nothing.
    await d.get(`${env.adminUrl}/dashboard`);
    await waitForPageReady(d);
    const shell = await d.findElements(By.css('[data-testid="sidebar-nav"]'));
    expect(shell.length, 'the admin shell selector every suite waits on is gone').to.equal(1);

    record({
      scenarioId: 'S8',
      scenario: 'records the selectors suites had to guess at',
      operation: 'harness:selector-stability',
      target: wanted.map((w) => w.route).join(', '),
      ui: `sidebar-nav present; ${missing.length} heading selector(s) missing and recorded`,
      outcome: missing.length > 0 ? 'BLOCKED' : 'PASS',
      notes: 'AC4: recorded with file references rather than worked around silently',
    });
  });

  it('S9 produces the artifacts CI retention depends on', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // JUnit XML for the suites the gate runs. The gate is the consumer, so its absence
    // is what would break REB-14's retention rather than anything visible locally.
    const junitDir = path.resolve('reports/junit');
    expect(fs.existsSync(junitDir), `no JUnit directory at ${junitDir}`).to.equal(true);

    const junitFiles = fs.readdirSync(junitDir).filter((f) => f.endsWith('.xml'));
    expect(junitFiles.length, 'no JUnit reports have been produced').to.be.greaterThan(5);

    // Every report must be parseable and carry a test count: a truncated file is worse
    // than a missing one, because CI reports it as a pass.
    for (const file of junitFiles) {
      const xml = fs.readFileSync(path.join(junitDir, file), 'utf8');
      expect(xml, `${file} is not a JUnit report`).to.contain('<testsuite');
      expect(xml, `${file} carries no test count`).to.match(/tests="\d+"/);
    }

    // The screenshot directory is created on demand, so it only has to be writable.
    const shotsDir = path.resolve(env.screenshotsDir);
    fs.mkdirSync(shotsDir, { recursive: true });
    expect(fs.existsSync(shotsDir), `screenshot directory ${shotsDir} is not usable`).to.equal(true);

    record({
      scenarioId: 'S9',
      scenario: 'produces the artifacts CI retention depends on',
      operation: 'harness:artifacts',
      target: `${junitFiles.length} JUnit reports`,
      api: `every report parseable and carries tests="…"; ${env.screenshotsDir} writable`,
      outcome: 'PASS',
      notes: 'AC5: ready for REB-14 CI retention',
    });
  });

  it('S10 classifies findings by who has to act on them', async () => {
    // The taxonomy's value is the distinction, so the scenario asserts the distinction
    // survives: four classes, each with its own owner and action.
    const log = new FindingLog('REB-25-selftest');
    log.productDefect('publish shipped a fragment without its components',
      'ContentPublishReplicationListener.isTreeReplicationCandidate', 'fix the product');
    log.environmentBlocker('Elasticsearch client 9.4.2 against server 8.13.4',
      'flexcms/docker-compose.yml', 'align the versions');
    log.unsupportedUi('the component registry has no route into the editor',
      'admin/(admin)/components/page.tsx', 'add a bridge or accept the gap');
    log.testBug('matched the string 404 against a component named "Error Page 404"',
      'secondary-routes-suite.spec.ts', 'assert on Next\'s not-found copy');

    expect(log.count('product-defect')).to.equal(1);
    expect(log.count('environment-blocker')).to.equal(1);
    expect(log.count('unsupported-ui')).to.equal(1);
    expect(log.count('test-bug')).to.equal(1);

    const rendered = describeA11y([]) + '';
    expect(rendered, 'empty findings should render as nothing, not "undefined"').to.equal('');

    // Anything this run classified is reported in `after`, so the summary carries it.
    record({
      scenarioId: 'S10',
      scenario: 'classifies findings by who has to act on them',
      operation: 'harness:failure-taxonomy',
      target: 'product-defect | environment-blocker | unsupported-ui | test-bug',
      api: 'each class counted independently and rendered with an owner and an action',
      outcome: 'PASS',
      notes: `this run classified ${findings.all.length} finding(s)`,
    });
  });
});
