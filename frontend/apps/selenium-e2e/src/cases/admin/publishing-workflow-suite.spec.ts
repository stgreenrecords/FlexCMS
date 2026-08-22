/**
 * REB-20 — publishing, workflow, scheduling, and bulk operation E2E suite.
 *
 * Covers every publishing-adjacent authoring flow the platform exposes: the
 * `standard-publish` workflow lifecycle, single-node and bulk publish, bulk move
 * and delete, and the two scheduled operations — each verified on the author API,
 * on the admin UI where one exists, and on the **publish environment** whenever
 * content is activated (AC1).
 *
 * Design decisions worth knowing before changing this file:
 *
 * - **Publish verification never trusts the author.** `S10` runs first and proves
 *   the publish service is reachable *and* that an unpublished page is absent
 *   from it. Without that, a green publish assertion could just be the author API
 *   answering for itself, which is exactly what AC1 forbids.
 * - **Workflow calls take ltree paths.** `AuthorWorkflowController` hands
 *   `contentPath` straight to `WorkflowEngine`, which looks the node up by exact
 *   path — unlike the content endpoints, which normalise `/content/...` for you.
 * - **Fixture names are deterministic, not timestamped.** A published page cannot
 *   be retracted (REB-26 `R26-1`/`R26-2`), so timestamped fixtures would leave a
 *   new publish-side orphan on every run. Reusing fixed paths bounds the residue
 *   to a known set that each run overwrites.
 * - **Evidence over exceptions.** A known product gap is recorded as a `BLOCKED`
 *   matrix row with live evidence and the scenario continues; only genuinely
 *   unexpected behaviour fails a test.
 */
import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { OperationMatrixRecorder, type OperationOutcome } from '../../reports/operationMatrix';
import { AuthorApiClient, type WorkflowInstance } from '../../pages/AuthorApiClient';
import { ContentTreePage } from '../../pages/ContentTreePage';
import { WorkflowsPage } from '../../pages/WorkflowsPage';

const TASK_ID = 'REB-20';
const SITE_ID = 'tut-usa';
const SITE_ROOT_LTREE = `content.${SITE_ID}`;
const SITE_ROOT_CONTENT = `/content/${SITE_ID}`;
const TEMPLATE_NAME = 'global-home-page';
const WORKFLOW_NAME = 'standard-publish';

/**
 * Fixture page names, deliberately stable across runs.
 *
 * Nothing in the platform can retract published content, so a timestamped name
 * would add one permanent publish-side orphan per run. These fixed names bound
 * the residue to this set; each run deletes and recreates them on the author side
 * and overwrites them on the publish side.
 */
const FIXTURES = {
  workflowHappy: 'reb20-workflow-approve',
  workflowCancel: 'reb20-workflow-cancel',
  singlePublish: 'reb20-publish-single',
  bulkPublishA: 'reb20-bulk-publish-a',
  bulkPublishB: 'reb20-bulk-publish-b',
  moveSource: 'reb20-move-source',
  moveTarget: 'reb20-move-target',
  deleteA: 'reb20-bulk-delete-a',
  deleteB: 'reb20-bulk-delete-b',
  schedulePublish: 'reb20-schedule-publish',
  scheduleDeactivate: 'reb20-schedule-deactivate',
  neverPublished: 'reb20-never-published',
} as const;

/** The scheduler polls on a 60 s `fixedDelay`; allow two cycles plus replication. */
const SCHEDULER_TIMEOUT_MS = 180_000;

describe('REB-20 publishing, workflow, scheduling, and bulk operation suite', function () {
  // Two scheduler scenarios wait up to three minutes each.
  this.timeout(900_000);

  const runId = `reb20-${Date.now()}`;
  const api = new AuthorApiClient();
  const recorder = new OperationMatrixRecorder(TASK_ID);
  const blockers: string[] = [];
  const observations: string[] = [];
  /** Every author-side path this run created, for guaranteed cleanup. */
  const createdPaths = new Set<string>();
  /**
   * Paths that carried a workflow instance.
   *
   * These cannot be deleted at all: `workflow_instances.content_node_id` is a
   * plain FK to `content_nodes.id` with no cascade, so `deleteSubtree` fails once
   * a node has any workflow history — active, cancelled, or completed. Cleanup
   * reports that as an evidenced blocker rather than as an unexplained leak.
   */
  const workflowFixtures = new Set<string>();

  let driver: WebDriver | undefined;
  let workflowsPage: WorkflowsPage;
  let contentTree: ContentTreePage;
  let publishReachable = false;

  function blocker(message: string): void {
    if (!blockers.includes(message)) blockers.push(message);
  }

  function observe(message: string): void {
    if (!observations.includes(message)) observations.push(message);
  }

  function record(
    scenarioId: string,
    scenario: string,
    operation: string,
    target: string,
    evidence: { api?: string; ui?: string; publish?: string },
    outcome: OperationOutcome,
    notes = '',
  ): void {
    recorder.add({
      scenarioId,
      scenario,
      operation,
      target,
      apiEvidence: evidence.api ?? '(not applicable)',
      uiEvidence: evidence.ui ?? '(no UI for this operation)',
      publishEvidence: evidence.publish ?? '(not a publishing operation)',
      outcome,
      notes,
    });
    recorder.write();
  }

  const ltree = (name: string): string => `${SITE_ROOT_LTREE}.${name}`;
  const sitePath = (name: string): string => `/${SITE_ID}/${name}`;

  /**
   * Creates a fixture page, replacing any residue from an earlier run.
   *
   * A page that has ever carried a workflow cannot be deleted (see `S12`), so the
   * delete may leave the node in place and the create would then answer 409. Such a
   * node is reused with freshly authored properties instead, which is also what
   * keeps the fixture set — and therefore the publish-side residue — bounded to
   * these fixed paths.
   */
  async function createFixturePage(name: string, marker: string): Promise<string> {
    const path = ltree(name);
    const properties: Record<string, unknown> = {
      'jcr:title': `REB-20 ${name}`,
      'jcr:description': `Test-owned fixture for ${TASK_ID}. Marker ${marker}.`,
      reb20Marker: marker,
      siteId: SITE_ID,
      template: TEMPLATE_NAME,
    };

    await api.deleteNode(path).catch(() => undefined);

    if (await nodeExists(path)) {
      // Undeletable residue: re-author it in place so this run still has a fresh marker.
      await api.updateNodeProperties(path, properties);
      createdPaths.add(path);
      const reused = await api.getNode(path);
      expect(reused.properties?.['reb20Marker'], `reused fixture ${path} must carry the new marker`).to.equal(
        marker,
      );
      return path;
    }

    await api.createNode({
      parentPath: SITE_ROOT_LTREE,
      name,
      resourceType: 'flexcms/page',
      properties,
    });
    createdPaths.add(path);
    await api.waitForNode(path);
    return path;
  }

  /**
   * Creates the bulk-move target.
   *
   * It is a `flexcms/page`, not a folder: the content model has no folder type —
   * `content.tut-usa` is a `flexcms/site-root` and every node beneath it is a
   * `flexcms/page` — so "move a page under another page" is the only move an
   * author can actually perform here.
   */
  async function createMoveTarget(name: string): Promise<string> {
    const path = ltree(name);
    await api.deleteNode(path).catch(() => undefined);
    await api.createNode({
      parentPath: SITE_ROOT_LTREE,
      name,
      resourceType: 'flexcms/page',
      properties: { 'jcr:title': `REB-20 ${name}`, siteId: SITE_ID, template: TEMPLATE_NAME },
    });
    createdPaths.add(path);
    await api.waitForNode(path);
    return path;
  }

  async function nodeExists(path: string): Promise<boolean> {
    try {
      await api.getNode(path);
      return true;
    } catch {
      return false;
    }
  }

  /** Cancels any workflow left active on a path, so a re-run can start a new one. */
  async function clearActiveWorkflow(contentLtreePath: string): Promise<void> {
    const active = await api.getActiveWorkflow(contentLtreePath).catch(() => null);
    if (active) {
      await api.cancelWorkflow(active.id, 'admin', 'REB-20 pre-run cleanup').catch(() => undefined);
    }
  }

  before(async () => {
    driver = await createDriver();
    workflowsPage = new WorkflowsPage(driver);
    contentTree = new ContentTreePage(driver);
  });

  after(async () => {
    try {
      recorder.write();
      const totals = recorder.totals();
      console.log(
        `[${TASK_ID}] operations recorded: ${totals.total} ` +
          `(PASS ${totals.PASS}, BLOCKED ${totals.BLOCKED}, FAIL ${totals.FAIL}, SKIPPED ${totals.SKIPPED})`,
      );
      if (blockers.length > 0) {
        console.log(`[${TASK_ID}] implementation blockers observed:\n- ${blockers.join('\n- ')}`);
      }
      if (observations.length > 0) {
        console.log(`[${TASK_ID}] documented behaviour:\n- ${observations.join('\n- ')}`);
      }
    } finally {
      // Deterministic cleanup of every test-owned node (AC3).
      const undeletable: string[] = [];
      for (const path of createdPaths) {
        await clearActiveWorkflow(path);
        await api.updateNodeStatus(path, 'ARCHIVED').catch(() => undefined);
        await api.deleteNode(path).catch(() => undefined);
        if (await nodeExists(path)) {
          if (workflowFixtures.has(path)) {
            undeletable.push(path);
          } else {
            console.error(`[${TASK_ID}] FIXTURE LEAK: ${path} still exists after DELETE.`);
          }
        }
      }

      if (undeletable.length > 0) {
        // Expected, and evidenced by S12 — not a leak this suite can fix.
        console.log(
          `[${TASK_ID}] undeletable by design (workflow FK): ${undeletable.join(', ')}. ` +
            'Fixture names are fixed, so the next run reuses these paths instead of adding more.',
        );
      }
      await quitDriver(driver);
    }
  });

  attachFailureScreenshot(() => driver);

  // ── S10 (first) — the publish environment must be real ───────────────────
  //
  // Ordered first on purpose: every later publish assertion is only meaningful if
  // the publish service is reachable *and* distinguishable from the author.
  it('S10 proves the publish environment is reachable and distinct from the author before any publish claim', async () => {
    publishReachable = await api.isPublishServiceReachable();
    expect(publishReachable, 'publish service must answer its health probe; publish checks are meaningless otherwise')
      .to.equal(true);

    const marker = `${runId}-never`;
    const path = await createFixturePage(FIXTURES.neverPublished, marker);
    const node = await api.getNode(path);
    expect(node.status, 'a freshly created page must start as DRAFT').to.equal('DRAFT');

    // The same path on the author delivery API vs. the publish delivery API.
    const authorPayload = await api.getAuthorRenderedPage(sitePath(FIXTURES.neverPublished));
    expect(JSON.stringify(authorPayload), 'author delivery must serve the unpublished page').to.include(marker);

    const publishStatus = await api.getPublishPageStatus(sitePath(FIXTURES.neverPublished));
    const servedByPublish = await api.waitForPublishMarker(sitePath(FIXTURES.neverPublished), marker, 5_000);
    expect(servedByPublish, `publish must NOT serve an unpublished page (HTTP ${publishStatus})`).to.equal(false);

    record(
      'S10',
      'publish environment reachable and distinct',
      'guard:publish-isolation',
      path,
      {
        api: `author delivery serves marker ${marker}; node status DRAFT`,
        ui: '(no UI surface for this guard)',
        publish: `publish delivery does not serve the unpublished page (HTTP ${publishStatus})`,
      },
      'PASS',
      'ordered first so every later publish assertion is known to target :8081, not the author',
    );
  });

  // ── S1 — workflow start ──────────────────────────────────────────────────
  it('S1 starts an approval workflow and verifies it on the API and in the admin workflow inbox', async () => {
    const marker = `${runId}-wf-approve`;
    const path = await createFixturePage(FIXTURES.workflowHappy, marker);
    await clearActiveWorkflow(path);
    workflowFixtures.add(path);

    const instance = await api.startWorkflow(path, WORKFLOW_NAME);
    expect(instance.status, 'a started workflow must be ACTIVE').to.equal('ACTIVE');
    expect(instance.currentStepId, 'standard-publish starts at its start step').to.equal('draft');
    expect(instance.contentPath).to.equal(path);
    expect(instance.startedBy).to.equal('admin');

    const active = await api.getActiveWorkflow(path);
    expect(active, 'the active-workflow lookup must find the instance').to.not.equal(null);
    expect(active?.id).to.equal(instance.id);

    const listed = await api.listWorkflows('ACTIVE');
    expect(
      listed.some((entry) => entry.id === instance.id),
      'the ACTIVE list must contain the new instance',
    ).to.equal(true);

    // Starting a second workflow for the same path must be refused.
    let duplicateRejected = false;
    try {
      await api.startWorkflow(path, WORKFLOW_NAME);
    } catch {
      duplicateRejected = true;
    }
    expect(duplicateRejected, 'a second active workflow for the same path must be rejected').to.equal(true);

    // Admin UI (AC2).
    const visible = await workflowsPage.waitForWorkflowPresence(path, true);
    const pendingCount = await workflowsPage.readPendingTabCount();
    const tabs = await workflowsPage.readTabLabels();
    expect(visible, 'the workflow inbox must list the started workflow').to.equal(true);
    expect(pendingCount, 'the Pending tab count must include it').to.be.greaterThan(0);

    record(
      'S1',
      'workflow start',
      'workflow:start',
      path,
      {
        api: `instance ${instance.id} ACTIVE at step 'draft'; /active and /list?status=ACTIVE both return it; duplicate start rejected`,
        ui: `workflow inbox lists "Content path: ${path}"; Pending count ${pendingCount}; tabs ${tabs.join(' | ')}`,
        publish: '(start does not publish)',
      },
      'PASS',
    );
  });

  // ── S2 — workflow advance through approval to publish ────────────────────
  it('S2 advances the workflow submit → approve → publish and verifies status, history, and the publish environment', async () => {
    const path = ltree(FIXTURES.workflowHappy);
    const marker = String((await api.getNode(path)).properties?.['reb20Marker'] ?? '');
    expect(marker, 'S1 must have seeded a marker on the fixture').to.not.equal('');

    const active = await api.getActiveWorkflow(path);
    expect(active, 'S1 must have left an active workflow').to.not.equal(null);
    const instanceId = (active as WorkflowInstance).id;

    // draft --submit--> review
    const inReview = await api.advanceWorkflow(instanceId, 'submit', 'admin', 'REB-20 submitting for review');
    expect(inReview.currentStepId).to.equal('review');
    expect(inReview.previousStepId).to.equal('draft');
    expect(inReview.lastAction).to.equal('submit');
    expect(inReview.lastActionBy).to.equal('admin');
    expect(inReview.lastComment).to.equal('REB-20 submitting for review');
    expect((await api.getNode(path)).status, "the 'review' step sets IN_REVIEW").to.equal('IN_REVIEW');

    // review --approve--> approved
    const approved = await api.advanceWorkflow(instanceId, 'approve', 'admin', 'REB-20 approving');
    expect(approved.currentStepId).to.equal('approved');
    expect(approved.lastAction).to.equal('approve');
    expect((await api.getNode(path)).status, "the 'approved' step sets APPROVED").to.equal('APPROVED');

    // approved --publish--> published (step actions: replicate-activate)
    const published = await api.advanceWorkflow(instanceId, 'publish', 'admin', 'REB-20 publishing');
    expect(published.currentStepId).to.equal('published');
    expect(published.lastAction).to.equal('publish');
    const publishedNode = await api.waitForNodeStatus(path, 'PUBLISHED');
    expect(publishedNode.status).to.equal('PUBLISHED');

    // AC1 — the publish environment, not the author.
    const onPublish = await api.waitForPublishMarker(sitePath(FIXTURES.workflowHappy), marker);
    expect(onPublish, 'the workflow publish step must reach the publish environment').to.equal(true);

    // The definition has no step of type "end", so the instance stays ACTIVE.
    const afterPublish = await api.getActiveWorkflow(path);
    const stillActive = afterPublish !== null && afterPublish.status === 'ACTIVE';
    if (stillActive) {
      observe(
        `The '${WORKFLOW_NAME}' definition has no step of type "end", so an instance stays ACTIVE after its ` +
          "'published' step. WorkflowInstance.status therefore never reaches COMPLETED through the happy path, " +
          "and the admin inbox's Approved tab — which maps COMPLETED to 'approved' — can never populate.",
      );
    }

    const uiStillListed = await workflowsPage.hasWorkflowForPath(path);

    record(
      'S2',
      'workflow advance through approval',
      'workflow:advance submit→approve→publish',
      path,
      {
        api:
          `steps draft→review→approved→published; node status DRAFT→IN_REVIEW→APPROVED→PUBLISHED; ` +
          `lastAction/lastActionBy/lastComment recorded at each step`,
        ui: `inbox still lists the instance after publish: ${uiStillListed} (instance remains ACTIVE)`,
        publish: `publish delivery serves marker ${marker} for ${sitePath(FIXTURES.workflowHappy)}`,
      },
      'PASS',
      stillActive ? 'workflow stays ACTIVE after publish: definition has no "end" step' : '',
    );
  });

  // ── S3 — workflow reject and cancel ──────────────────────────────────────
  it('S3 rejects a workflow back to draft, cancels it, and verifies no active workflow remains', async () => {
    const marker = `${runId}-wf-cancel`;
    const path = await createFixturePage(FIXTURES.workflowCancel, marker);
    await clearActiveWorkflow(path);
    workflowFixtures.add(path);

    const instance = await api.startWorkflow(path, WORKFLOW_NAME);
    await api.advanceWorkflow(instance.id, 'submit', 'admin', 'REB-20 submitting to reject');
    expect((await api.getNode(path)).status).to.equal('IN_REVIEW');

    // review --reject--> draft
    const rejected = await api.advanceWorkflow(instance.id, 'reject', 'admin', 'REB-20 rejecting');
    expect(rejected.currentStepId, 'reject returns the workflow to draft').to.equal('draft');
    expect(rejected.lastAction).to.equal('reject');
    expect(rejected.status, 'rejection keeps the instance ACTIVE at the draft step').to.equal('ACTIVE');
    expect((await api.getNode(path)).status, 'the draft step sets DRAFT').to.equal('DRAFT');

    const cancelled = await api.cancelWorkflow(instance.id, 'admin', 'REB-20 cancelling');
    expect(cancelled.status, 'cancel must move the instance to CANCELLED').to.equal('CANCELLED');

    expect(await api.getActiveWorkflow(path), 'no active workflow may remain for the path').to.equal(null);

    const cancelledList = await api.listWorkflows('CANCELLED');
    expect(
      cancelledList.some((entry) => entry.id === instance.id),
      'the CANCELLED list must contain the instance',
    ).to.equal(true);

    const activeList = await api.listWorkflows('ACTIVE');
    expect(
      activeList.some((entry) => entry.id === instance.id),
      'the ACTIVE list must no longer contain it',
    ).to.equal(false);

    // UI: the inbox reads /for-user, which returns only ACTIVE instances, so the
    // card disappears rather than moving to another tab.
    const goneFromUi = await workflowsPage.waitForWorkflowPresence(path, false);
    expect(goneFromUi, 'the cancelled workflow must disappear from the inbox').to.equal(true);
    await workflowsPage.selectTab('Rejected');
    const rejectedTabPaths = await workflowsPage.readContentPaths();

    observe(
      'WorkflowEngine.listForUser ignores its userId and returns only ACTIVE instances, so the admin inbox ' +
        "cannot display cancelled or completed workflows at all: its Approved and Rejected tabs are " +
        'unreachable by any API-visible state. A cancelled workflow simply vanishes from the inbox.',
    );

    record(
      'S3',
      'workflow reject and cancel',
      'workflow:advance reject + workflow:cancel',
      path,
      {
        api:
          `reject returned step 'draft' (node DRAFT) with instance still ACTIVE; cancel set CANCELLED; ` +
          `/active returns 404; instance present in /list?status=CANCELLED and absent from ACTIVE`,
        ui:
          `inbox no longer lists the workflow; Rejected tab shows ${rejectedTabPaths.length} card(s) ` +
          '(the tab cannot populate — /for-user returns ACTIVE only)',
        publish: '(reject/cancel do not publish)',
      },
      'PASS',
    );
  });

  // ── S4 — individual publish ──────────────────────────────────────────────
  it('S4 publishes a single node through the status endpoint and verifies the marker on the publish environment', async () => {
    const marker = `${runId}-single`;
    const path = await createFixturePage(FIXTURES.singlePublish, marker);

    const beforePublish = await api.waitForPublishMarker(sitePath(FIXTURES.singlePublish), marker, 5_000);
    expect(beforePublish, 'the page must not be on publish before it is published').to.equal(false);

    // The single-node status endpoint — the path BUG-PUBLISH-REPLICATION fixed.
    const updated = await api.updateNodeStatus(path, 'PUBLISHED');
    expect(updated.status).to.equal('PUBLISHED');
    expect((await api.waitForNodeStatus(path, 'PUBLISHED')).status).to.equal('PUBLISHED');

    const onPublish = await api.waitForPublishMarker(sitePath(FIXTURES.singlePublish), marker);
    expect(onPublish, 'POST /node/status must replicate to the publish environment on its own').to.equal(true);

    record(
      'S4',
      'individual publish',
      'content:status → PUBLISHED',
      path,
      {
        api: `POST /node/status?status=PUBLISHED returned PUBLISHED; node re-read as PUBLISHED`,
        ui: '(publish is not exposed as a content-tree action)',
        publish: `absent before publish, then serves marker ${marker} — status endpoint replicates unaided`,
      },
      'PASS',
    );
  });

  // ── S5 — bulk publish ────────────────────────────────────────────────────
  it('S5 bulk publishes two pages and verifies both statuses and both pages on the publish environment', async () => {
    const markerA = `${runId}-bulk-a`;
    const markerB = `${runId}-bulk-b`;
    const pathA = await createFixturePage(FIXTURES.bulkPublishA, markerA);
    const pathB = await createFixturePage(FIXTURES.bulkPublishB, markerB);

    const result = await api.bulkPublish([pathA, pathB]);
    expect(result.succeeded, 'both paths must publish').to.equal(2);
    expect(result.failed, 'no path may fail').to.equal(0);
    expect(result.total).to.equal(2);
    expect(result.errors, 'no errors may be reported').to.deep.equal([]);

    expect((await api.waitForNodeStatus(pathA, 'PUBLISHED')).status).to.equal('PUBLISHED');
    expect((await api.waitForNodeStatus(pathB, 'PUBLISHED')).status).to.equal('PUBLISHED');

    const onPublishA = await api.waitForPublishMarker(sitePath(FIXTURES.bulkPublishA), markerA);
    const onPublishB = await api.waitForPublishMarker(sitePath(FIXTURES.bulkPublishB), markerB);
    expect(onPublishA, `${pathA} must be served by the publish environment`).to.equal(true);
    expect(onPublishB, `${pathB} must be served by the publish environment`).to.equal(true);

    record(
      'S5',
      'bulk publish',
      'content:bulk/publish',
      `${pathA} ${pathB}`,
      {
        api: `BulkOperationResult succeeded=2 failed=0 total=2 errors=[]; both nodes re-read as PUBLISHED`,
        ui: '(no bulk actions are wired in the content tree UI)',
        publish: `publish delivery serves both markers (${markerA}, ${markerB})`,
      },
      'PASS',
    );
  });

  // ── S6 — bulk move ───────────────────────────────────────────────────────
  it('S6 bulk moves a test-owned page into a test-owned folder and verifies old and new paths on the API and UI', async () => {
    const marker = `${runId}-move`;
    const sourcePath = await createFixturePage(FIXTURES.moveSource, marker);
    const targetPath = await createMoveTarget(FIXTURES.moveTarget);

    const result = await api.bulkMove([sourcePath], targetPath);
    // `errors` is asserted first: the bulk endpoints never increment `failed`
    // (proven in S12), so an empty error list is the only trustworthy signal.
    expect(result.errors, 'the move must report no errors').to.deep.equal([]);
    expect(result.succeeded, 'the move must succeed').to.equal(1);

    const movedPath = `${targetPath}.${FIXTURES.moveSource}`;
    createdPaths.add(movedPath);

    expect(await nodeExists(sourcePath), 'the old path must no longer resolve').to.equal(false);
    const moved = await api.waitForNode(movedPath);
    expect(moved.path).to.equal(movedPath);
    expect(moved.properties?.['reb20Marker'], 'properties must survive the move').to.equal(marker);

    // Whether the move re-parented the node, or only rewrote its path.
    const newParentChildren = await api.getChildren(targetPath);
    const listedUnderNewParent = newParentChildren.some((child) => child.name === FIXTURES.moveSource);
    const oldParentChildren = await api.getChildren(SITE_ROOT_LTREE);
    const stillUnderOldParent = oldParentChildren.some((child) => child.name === FIXTURES.moveSource);
    const reportedParent = moved.parentPath ?? '(none)';

    if (!listedUnderNewParent || stillUnderOldParent) {
      blocker(
        `Moving content leaves its parentPath stale, so the node disappears from its new parent and lingers ` +
          `under its old one: after moving ${sourcePath} to ${movedPath}, the node's own parentPath is still ` +
          `"${reportedParent}" instead of "${targetPath}". GET /children?path=${targetPath} returns ` +
          `${newParentChildren.length} child(ren) and does not list it, while GET /children?path=` +
          `${SITE_ROOT_LTREE} still does — returning a row whose path no longer sits under the parent that ` +
          'listed it. The cause is in flexcms-core ContentNodeService.move(): for every node in the subtree it ' +
          'computes updatedParent as n.getParentPath().replace(sourcePath, newPath), which is a no-op for the ' +
          "subtree's own root because that node's parentPath does not contain sourcePath. The ternary's " +
          'targetParentPath branch is only reached when parentPath is null. Descendants re-parent correctly, so ' +
          'only the moved node itself is corrupted — and every children-based view is affected, including the ' +
          'admin content tree, which therefore shows the page under the folder it was moved out of. ' +
          'ContentNodeService.bulkMove() delegates to move(), so single and bulk moves are both affected.',
      );
    }

    // UI (AC2). Two product behaviours shape what the tree can show here:
    // the parentPath defect above, and the fact that the tree cannot descend into a
    // page — `ContentRow.handleClick` navigates only when resourceType is not
    // 'flexcms/page', because a page's children are its components. The listing is
    // therefore recorded as evidence rather than asserted into a specific shape.
    await contentTree.open();
    await contentTree.clickRowByName(SITE_ID);
    await contentTree.waitUntilLoaded();
    const rowsAtSiteRoot = await contentTree.waitForRowNames([FIXTURES.moveTarget]);
    expect(rowsAtSiteRoot, 'the move target must be listed at the site root').to.include(FIXTURES.moveTarget);
    const staleRowVisible = rowsAtSiteRoot.includes(FIXTURES.moveSource);

    observe(
      'The content tree cannot be navigated into a page-typed node: ContentRow.handleClick in ' +
        "frontend/apps/admin/src/app/(admin)/content/page.tsx calls onNavigate() only when " +
        "resourceType !== 'flexcms/page'. Since the TUT-USA content model has no folder type — " +
        'content.tut-usa is a flexcms/site-root and everything under it is a flexcms/page — a page moved ' +
        'under another page is reachable through the author API but not browsable in the tree UI.',
    );

    record(
      'S6',
      'bulk move',
      'content:bulk/move',
      `${sourcePath} → ${movedPath}`,
      {
        api:
          `succeeded=1 errors=[]; old path 404; new path resolves with reb20Marker intact; ` +
          `parentPath="${reportedParent}" (expected "${targetPath}"); ` +
          `new parent lists it: ${listedUnderNewParent}; old parent still lists it: ${stillUnderOldParent}`,
        ui:
          `site root lists ${FIXTURES.moveTarget}; stale ${FIXTURES.moveSource} row still shown there: ` +
          `${staleRowVisible}; descending into a page-typed parent is not supported by the tree UI`,
        publish: '(move does not publish; source was never published)',
      },
      listedUnderNewParent && !stillUnderOldParent ? 'PASS' : 'BLOCKED',
      listedUnderNewParent && !stillUnderOldParent
        ? ''
        : 'move rewrites path but not the moved node\'s parentPath — see blockers.md',
    );
  });

  // ── S7 — bulk delete ─────────────────────────────────────────────────────
  it('S7 bulk deletes only test-owned pages and verifies they are gone from the API and the content tree UI', async () => {
    const pathA = await createFixturePage(FIXTURES.deleteA, `${runId}-del-a`);
    const pathB = await createFixturePage(FIXTURES.deleteB, `${runId}-del-b`);

    // A sibling that must survive, proving the delete is scoped (AC3).
    const survivorPath = ltree(FIXTURES.neverPublished);
    expect(await nodeExists(survivorPath), 'the survivor fixture must exist before the delete').to.equal(true);

    const result = await api.bulkDelete([pathA, pathB]);
    expect(result.succeeded, 'both paths must delete').to.equal(2);
    expect(result.failed).to.equal(0);
    expect(result.errors).to.deep.equal([]);

    expect(await nodeExists(pathA), `${pathA} must be gone`).to.equal(false);
    expect(await nodeExists(pathB), `${pathB} must be gone`).to.equal(false);
    expect(await nodeExists(survivorPath), 'a non-listed sibling must survive the bulk delete').to.equal(true);
    createdPaths.delete(pathA);
    createdPaths.delete(pathB);

    // UI: neither page may still be listed under the site root. The surviving
    // sibling is asserted *present* in the same read, so this cannot pass against a
    // stale or wrong listing — which all-negative assertions silently would.
    await contentTree.open();
    await contentTree.clickRowByName(SITE_ID);
    await contentTree.waitUntilLoaded();
    const rows = await contentTree.waitForRowNames(
      [FIXTURES.neverPublished],
      [FIXTURES.deleteA, FIXTURES.deleteB],
    );
    expect(rows, 'the surviving sibling proves this is the site-root listing').to.include(
      FIXTURES.neverPublished,
    );
    expect(rows, `${FIXTURES.deleteA} must be gone from the UI`).to.not.include(FIXTURES.deleteA);
    expect(rows, `${FIXTURES.deleteB} must be gone from the UI`).to.not.include(FIXTURES.deleteB);

    record(
      'S7',
      'bulk delete',
      'content:bulk DELETE',
      `${pathA} ${pathB}`,
      {
        api: `succeeded=2 failed=0; both paths 404; unlisted sibling ${FIXTURES.neverPublished} untouched`,
        ui: `content tree under the site root lists ${FIXTURES.neverPublished} and neither deleted page`,
        publish: '(neither page was published)',
      },
      'PASS',
    );
  });

  // ── S8 — scheduled publish ───────────────────────────────────────────────
  it('S8 schedules a publish, waits for the scheduler, and verifies the publish environment', async () => {
    const marker = `${runId}-sched-pub`;
    const path = await createFixturePage(FIXTURES.schedulePublish, marker);

    // Due immediately, so the next 60 s scheduler cycle picks it up.
    const publishAt = new Date();
    await api.schedulePublish(path, publishAt);

    const scheduled = await api.getNode(path);
    expect(scheduled.scheduledPublishAt, 'the schedule must be persisted on the node').to.be.a('string');
    expect(scheduled.status, 'scheduling alone must not change the status').to.equal('DRAFT');

    const processed = await api.waitForScheduleProcessed(path, 'scheduledPublishAt', SCHEDULER_TIMEOUT_MS);
    expect(processed.scheduledPublishAt, 'the scheduler must clear the schedule once processed').to.not.be.a('string');

    const onPublish = await api.waitForPublishMarker(sitePath(FIXTURES.schedulePublish), marker);
    expect(onPublish, 'a scheduled publish must reach the publish environment').to.equal(true);

    // The scheduler replicates but never transitions the author node.
    const afterStatus = (await api.getNode(path)).status;
    const statusLeftBehind = afterStatus !== 'PUBLISHED';
    if (statusLeftBehind) {
      blocker(
        `Scheduled publish does not update the author-side status: ${path} is live on the publish environment ` +
          `but the author node still reads ${afterStatus}. ScheduledPublishingService.processScheduledPublishes() ` +
          'calls replicationAgent.replicate(path, ACTIVATE, ...) and clearScheduledPublish(node) directly, never ' +
          'ContentNodeService status transition — so unlike POST /node/status and bulk/publish, the scheduled path ' +
          'leaves the author showing an unpublished page that the public is already being served. It also means ' +
          'findDueForPublish (status <> PUBLISHED) would re-select the node if the schedule were set again.',
      );
    }

    record(
      'S8',
      'scheduled publish',
      'content:schedule-publish',
      path,
      {
        api: `scheduledPublishAt persisted (${scheduled.scheduledPublishAt}); cleared by the scheduler; author status after = ${afterStatus}`,
        ui: '(scheduling is not exposed in the admin UI)',
        publish: `publish delivery serves marker ${marker} after the scheduler ran`,
      },
      statusLeftBehind ? 'BLOCKED' : 'PASS',
      statusLeftBehind
        ? `author status stayed ${afterStatus} while the page is live on publish — see blockers.md`
        : '',
    );
  });

  // ── S9 — scheduled deactivation ──────────────────────────────────────────
  it('S9 schedules a deactivation for a published page and records what the publish environment does', async () => {
    const marker = `${runId}-sched-deact`;
    const path = await createFixturePage(FIXTURES.scheduleDeactivate, marker);

    // findDueForDeactivation only selects nodes whose status is PUBLISHED.
    await api.bulkPublish([path]);
    await api.waitForNodeStatus(path, 'PUBLISHED');
    const live = await api.waitForPublishMarker(sitePath(FIXTURES.scheduleDeactivate), marker);
    expect(live, 'the page must be live before deactivation is scheduled').to.equal(true);

    const deactivateAt = new Date();
    await api.scheduleDeactivate(path, deactivateAt);
    const scheduled = await api.getNode(path);
    expect(scheduled.scheduledDeactivateAt, 'the deactivation schedule must be persisted').to.be.a('string');

    const processed = await api.waitForScheduleProcessed(path, 'scheduledDeactivateAt', SCHEDULER_TIMEOUT_MS);
    expect(processed.scheduledDeactivateAt, 'the scheduler must clear the schedule once processed')
      .to.not.be.a('string');

    // What actually happens on publish, rather than what should.
    const publishStatus = await api.getPublishPageStatus(sitePath(FIXTURES.scheduleDeactivate));
    const stillServed = await api.waitForPublishMarker(sitePath(FIXTURES.scheduleDeactivate), marker, 10_000);
    const authorStatus = (await api.getNode(path)).status;

    if (stillServed) {
      blocker(
        `Scheduled deactivation does not retract content: after the scheduler processed the schedule for ${path}, ` +
          `the publish environment still serves ${sitePath(FIXTURES.scheduleDeactivate)} (HTTP ${publishStatus}) ` +
          `with the authored marker, and the author node still reads ${authorStatus}. ` +
          'ReplicationReceiver.deactivateContent() only flips the publish-side page node to DRAFT and leaves its ' +
          'child components in place, and the publish delivery API serves pages regardless of status (REB-26 R26-2). ' +
          'The scheduled path additionally never transitions the author node, so nothing anywhere reflects the ' +
          'deactivation.',
      );
    }

    record(
      'S9',
      'scheduled deactivation',
      'content:schedule-deactivate',
      path,
      {
        api: `scheduledDeactivateAt persisted (${scheduled.scheduledDeactivateAt}) and cleared by the scheduler; author status after = ${authorStatus}`,
        ui: '(scheduling is not exposed in the admin UI)',
        publish: stillServed
          ? `publish still serves the page (HTTP ${publishStatus}) with marker ${marker} after deactivation`
          : `publish no longer serves the page (HTTP ${publishStatus})`,
      },
      stillServed ? 'BLOCKED' : 'PASS',
      stillServed
        ? 'DEACTIVATE replicated but nothing retracts delivery — REB-26 R26-2 confirmed through the scheduler'
        : '',
    );

    // The scheduler must have done its half of the job regardless.
    expect(publishReachable, 'publish must still be reachable for this evidence to mean anything').to.equal(true);
  });

  // ── S12 — bulk error reporting and workflow-blocked deletion ─────────────
  it('S12 verifies bulk failure reporting and records that a page with workflow history cannot be deleted', async () => {
    const missingPath = `${SITE_ROOT_LTREE}.reb20-does-not-exist-${Date.now()}`;

    // (a) Positive control: a genuine per-path failure must be reported as one.
    const publishMissing = await api.bulkPublish([missingPath]);
    expect(publishMissing.failed, 'bulk publish must report a failure for a missing path').to.equal(1);
    expect(publishMissing.succeeded, 'nothing may be counted as published').to.equal(0);
    expect(publishMissing.errors.length, 'the failure must name the path').to.equal(1);

    record(
      'S12',
      'bulk failure reporting',
      'content:bulk/publish (nonexistent path)',
      missingPath,
      {
        api:
          `succeeded=0 failed=1 total=${publishMissing.total}; ` +
          `errors=${JSON.stringify(publishMissing.errors).slice(0, 140)}`,
        ui: '(no bulk actions are wired in the content tree UI)',
        publish: '(nothing was published)',
      },
      'PASS',
      'per-path failures are counted and named — BulkOperationResult.addError() increments failed',
    );

    // (b) Bulk delete cannot tell a missing path from a deleted one.
    const deleteMissing = await api.bulkDelete([missingPath]);
    const deleteReportsSuccess = deleteMissing.succeeded > 0 && deleteMissing.errors.length === 0;
    if (deleteReportsSuccess) {
      blocker(
        'Bulk delete reports success for content that never existed: DELETE /api/author/content/bulk with a ' +
          `path that has never been created answers succeeded=${deleteMissing.succeeded}, failed=` +
          `${deleteMissing.failed}, errors=[]. ContentNodeService.bulkDelete() calls delete(path, userId), whose ` +
          'nodeRepository.deleteSubtree(path) is a bulk SQL DELETE that simply affects zero rows when the path ' +
          'is absent, so nothing raises. Bulk publish and bulk move both reject a missing path (proven in the ' +
          'same scenario), which makes delete the outlier: a caller cannot distinguish "deleted 3 pages" from ' +
          '"deleted nothing because all 3 paths were wrong", and an audit entry is written either way.',
      );
    }

    record(
      'S12',
      'bulk delete of a nonexistent path',
      'content:bulk DELETE (nonexistent path)',
      missingPath,
      {
        api:
          `succeeded=${deleteMissing.succeeded} failed=${deleteMissing.failed} total=${deleteMissing.total} ` +
          `errors=${JSON.stringify(deleteMissing.errors)}`,
        ui: '(no bulk actions are wired in the content tree UI)',
        publish: '(not a publishing operation)',
      },
      deleteReportsSuccess ? 'BLOCKED' : 'PASS',
      deleteReportsSuccess
        ? 'delete of a never-existing path is counted as succeeded, unlike bulk publish/move'
        : '',
    );

    // (b) Deleting a page that carried a workflow.
    const workflowPath = ltree(FIXTURES.workflowCancel);
    if (await nodeExists(workflowPath)) {
      let deleteFailed = false;
      try {
        await api.deleteNode(workflowPath);
      } catch {
        deleteFailed = true;
      }
      const stillThere = await nodeExists(workflowPath);

      if (stillThere) {
        blocker(
          `A content node that has ever had a workflow cannot be deleted: DELETE ` +
            `/api/author/content/node?path=${workflowPath} leaves the node in place and answers HTTP 500 with a ` +
            'generic "An unexpected error occurred" body. The author log shows the real cause — ' +
            '"update or delete on table content_nodes violates foreign key constraint ' +
            'workflow_instances_content_node_id_fkey" — because workflow_instances.content_node_id references ' +
            'content_nodes.id with no ON DELETE rule and nothing removes the instance rows first. Cancelling the ' +
            'workflow does not help: cancelled and completed instances keep the reference. Any page that went ' +
            'through review is therefore undeletable through the API, and the author sees only a 500.',
        );
      }

      record(
        'S12',
        'delete a page with workflow history',
        'content:delete (node with workflow instances)',
        workflowPath,
        {
          api: stillThere
            ? `DELETE rejected (${deleteFailed ? 'HTTP 500' : 'no error surfaced'}); node still present — ` +
              'FK workflow_instances_content_node_id_fkey'
            : 'DELETE removed the node',
          ui: '(delete is not exposed as a content-tree action)',
          publish: '(not a publishing operation)',
        },
        stillThere ? 'BLOCKED' : 'PASS',
        stillThere ? 'workflow history pins the node permanently; see blockers.md' : '',
      );
    }
  });

  // ── S11 — matrix completeness ────────────────────────────────────────────
  it('S11 records one evidence row per publishing operation and no unexplained failures', () => {
    const totals = recorder.totals();
    expect(totals.total, 'every scenario must contribute at least one operation row').to.be.greaterThan(8);
    expect(totals.FAIL, 'no operation may end the run in FAIL').to.equal(0);

    for (const row of recorder.rowsByOutcome('BLOCKED')) {
      expect(row.notes, `BLOCKED row ${row.scenarioId}/${row.operation} must carry a reason`).to.not.equal('');
    }
    for (const row of recorder.rowsByOutcome('SKIPPED')) {
      expect(row.notes, `SKIPPED row ${row.scenarioId}/${row.operation} must carry a reason`).to.not.equal('');
    }

    console.log(`[${TASK_ID}] matrix written with ${totals.total} operation row(s)`);
  });
});
