# REB-20 — devops run summary

Publishing, workflow, scheduling, and bulk operation E2E suite for the TUT-USA
sample site. Every number below is read out of the artifacts the run of record
produced — `publishing-operation-matrix.csv` and
`frontend/apps/selenium-e2e/reports/junit/reb20-suite.xml`.

## Run of record

| | |
|---|---|
| Date | 2026-08-21 local (CEDT) |
| Command | `cd frontend/apps/selenium-e2e && pnpm test:reb20:ci` |
| Suite | `src/cases/admin/publishing-workflow-suite.spec.ts` |
| Mocha result | **12 tests, 0 failures**, 92.59 s |
| JUnit XML | `reports/junit/reb20-suite.xml` |
| Operation matrix | `publishing-operation-matrix.csv` — 13 rows |
| Failure screenshots | none for this run |

Environment (all four services live, local workstation):

| Service | URL | Started as |
|---|---|---|
| Author | `http://localhost:8080` | `mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author,local` (JDK 26) |
| Publish | `http://localhost:8081` | `mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=publish,local` (JDK 26) |
| Admin UI | `http://localhost:3000` | `pnpm start` (Next.js production build) |
| Reference site | `http://localhost:3001` | `pnpm exec next start -p 3001` (production build) |
| Infra | postgres, redis, rabbitmq, minio, elasticsearch | `docker compose -f infra/local/docker-compose.dev.yml up -d` |

Both environment prerequisites are non-obvious and are recorded in
`hints_for_agent.md`: the backends must include the **`local`** profile or every
author write answers `401`, and the frontends must be **production** builds or
REB-12's console-error assertion fails.

## Totals

| Metric | Value |
|---|---|
| Mocha tests | **12** |
| Failures | **0** |
| Operation rows recorded | **13** |
| PASS | **8** |
| BLOCKED | **5** |
| FAIL | **0** |
| SKIPPED | **0** |

Every `BLOCKED` row is a pre-existing product gap, evidenced live and carrying a
reason — `S11` asserts that none is left unexplained.

## Operations covered

| Scenario | Operation | Outcome |
|---|---|---|
| S10 | `guard:publish-isolation` | PASS |
| S1 | `workflow:start` | PASS |
| S2 | `workflow:advance submit→approve→publish` | PASS |
| S3 | `workflow:advance reject` + `workflow:cancel` | PASS |
| S4 | `content:status → PUBLISHED` | PASS |
| S5 | `content:bulk/publish` | PASS |
| S6 | `content:bulk/move` | **BLOCKED** — `R20-1` |
| S7 | `content:bulk DELETE` | PASS |
| S8 | `content:schedule-publish` | **BLOCKED** — `R20-3` |
| S9 | `content:schedule-deactivate` | **BLOCKED** — `R20-4` |
| S12 | `content:bulk/publish` (nonexistent path) | PASS — positive control |
| S12 | `content:bulk DELETE` (nonexistent path) | **BLOCKED** — `R20-5` |
| S12 | `content:delete` (node with workflow instances) | **BLOCKED** — `R20-2` |

## Acceptance criteria

| AC | Requirement | How it is met |
|---|---|---|
| **AC1** | Publishing scenarios verify the publish environment, not only the author or author-side GraphQL | `S10` runs **first** and proves `:8081` is reachable *and* that an unpublished page is absent from it, so no later publish assertion can be satisfied by the author answering for itself. `S2`, `S4`, `S5`, `S8`, `S9` each poll `GET :8081/api/content/v1/pages/{path}` for that run's marker. |
| **AC2** | Workflow scenarios validate API state **and** admin UI lists | `S1` asserts the `/workflows` inbox card and Pending count; `S3` asserts the card disappears after cancel. Both also assert the full API state (`/active`, `/list?status=…`). Where no UI exists — bulk and scheduling — the matrix says so explicitly rather than claiming coverage. |
| **AC3** | Bulk operations only mutate test-owned content, with deterministic cleanup | All fixtures are test-owned pages with fixed `reb20-*` names. `S7` additionally proves an unlisted sibling survives a bulk delete. Cleanup archives and deletes every created path, and separates "undeletable by design (workflow FK)" from a real `FIXTURE LEAK` so the two can never be confused. |
| **AC4** | Scheduled operations pass deterministically **or** document a precise blocker | Both. `ScheduledPublishingService` polls on a 60 s `fixedDelay`, so a schedule dated *now* is due on the next cycle: `S8` observed the scheduler consume it in 45–58 s across runs, well inside the 180 s allowance. No clock manipulation is used. The gaps that remain (`R20-3`, `R20-4`) are recorded with live evidence. |
| **AC5** | Evidence recorded under `df/artifacts/REB-20/devops/` | `summary.md`, `publishing-operation-matrix.csv`, `test-scenarios.md`, `blockers.md`, plus the JUnit XML. |

## Blockers found (all pre-existing)

Full evidence, source symbols, and observed transcripts are in
[`blockers.md`](blockers.md). None is caused by this suite; all are outside the
`devops` lane and need SA routing.

| ID | Summary | Severity | Suggested lane |
|---|---|---|---|
| `R20-1` | **Moving content leaves the moved node's `parentPath` stale** — `move()` rewrites `parentPath` by substituting `sourcePath` inside it, which is a no-op for the subtree's own root. The page vanishes from its new parent's `/children` and lingers in its old parent's, so the admin tree shows it in the folder it was moved *out of*. Affects single and bulk moves. | High | `backend-dev` |
| `R20-2` | **A page that has ever had a workflow can never be deleted** — `workflow_instances.content_node_id` is an FK with no `ON DELETE` rule, so `deleteSubtree` fails and the API answers an opaque HTTP 500. Cancelling does not help; cancelled and completed instances keep the reference. | High | `backend-dev` + `sa` |
| `R20-3` | **Scheduled publish never updates the author status** — the scheduler replicates and clears the schedule without a status transition, so the public is served a page the author still shows as `DRAFT`. | High | `backend-dev` |
| `R20-4` | **Scheduled deactivation retracts nothing** — publish keeps serving the page and the author node stays `PUBLISHED`. Confirms REB-26 `R26-2` through a second code path. | High | `backend-dev` + `sa` |
| `R20-5` | **Bulk delete reports success for content that never existed** — `deleteSubtree` affects zero rows without raising, so a fictional path counts as `succeeded`. Bulk publish and move both reject a missing path, making delete the outlier. | Medium | `backend-dev` |

Documented non-blocking behaviours — the `standard-publish` workflow never
reaching `COMPLETED`, the workflow inbox being able to show only `ACTIVE` work,
bulk/scheduling having no admin UI, and the content tree being unable to descend
into a page — are all recorded in `blockers.md`.

## Fixture residue after the run of record (AC3)

Verified directly after the run:

```
GET /children?path=content.tut-usa   -> remaining reb20 nodes: reb20-workflow-approve, reb20-workflow-cancel
```

Those two are the workflow fixtures pinned by `R20-2`; **every other fixture was
cleaned up**. Because the names are fixed, the next run re-authors these two in
place rather than adding more.

Publish side, as expected under `R26-1`/`R26-2` (nothing can retract published
content):

| Path | `:8081` |
|---|---|
| `/tut-usa/reb20-workflow-approve` | 200 |
| `/tut-usa/reb20-publish-single` | 200 |
| `/tut-usa/reb20-bulk-publish-a` | 200 |
| `/tut-usa/reb20-bulk-publish-b` | 200 |
| `/tut-usa/reb20-schedule-publish` | 200 |
| `/tut-usa/reb20-schedule-deactivate` | 200 |
| `/tut-usa/reb20-never-published` | 500 — never published, never replicated |

The residue is therefore a bounded set of six fixed paths that each run
overwrites, not one new orphan per run. Purging them needs direct
`flexcms_publish` database access, which was not authorised in this session.

## Developer testing bar (df/03-orchestration-rules.md)

| Check | Command | Result |
|---|---|---|
| REB-20 suite | `pnpm test:reb20:ci` | **12 tests, 0 failures**, 92.59 s |
| Backend unit suite | `cd flexcms && mvn test` (JDK 26) | **505 tests, 0 failures, 0 errors**, `BUILD SUCCESS` |
| Frontend build | `cd frontend && pnpm build` | **9 of 9** tasks successful |
| Selenium full gate | `node scripts/selenium-gate.cjs --mode full` | **PASS**, artifacts retained under `reports/retained/full` |

Full-gate suite breakdown, all regenerated by the passing gate run:

| Suite | Tests | Failures | Time |
|---|---:|---:|---:|
| REB-12 template-by-template public site | 22 | 0 | 134.5 s |
| REB-13 admin authoring and round-trip | 4 | 0 | 3.7 s |
| REB-18 content tree and page lifecycle | 2 | 0 | 14.2 s |
| REB-19 page editor authoring matrix | 10 | 0 | 19.3 s |
| **REB-20 publishing/workflow/scheduling/bulk** | **12** | **0** | **107.3 s** |
| REB-26 exhaustive per-component sweep | 24 | 0 | 300.7 s |
| **Total** | **74** | **0** | |

The gate's critical/high traceability enforcement passed, including the new
`REB-20` row.

**One infrastructure rerun.** The first full-gate attempt failed at the REB-26
stage with `session not created from chrome not reachable` in its `before all`
hook — Chrome failed to launch, with nothing wrong in either suite. A direct
WebDriver probe started a session against the same stack in 926 ms, and the gate
passed on the retry. Note the workstation had 79 Chrome processes at the time,
all user-profile instances with no automation flags, so no test browser had
leaked and nothing was killed.

## Wiring added

| File | Change |
|---|---|
| `frontend/apps/selenium-e2e/package.json` | `test:reb20`, `test:reb20:ci`, and `test:reb20:ci` added to `test:full:ci` |
| `frontend/apps/selenium-e2e/scripts/selenium-gate.cjs` | `test:reb20:ci` added to the `full` mode stage list |
| `frontend/apps/selenium-e2e/config/traceability-priority.json` | `REB-20` row at `critical` priority, so the gate fails if the suite stops reporting |

## Code added

| File | Purpose |
|---|---|
| `src/cases/admin/publishing-workflow-suite.spec.ts` | The suite: S1–S12 |
| `src/pages/WorkflowsPage.ts` | Admin Workflow Inbox page object |
| `src/reports/operationMatrix.ts` | Operation-level recorder (operation × API/UI/publish surface) |
| `src/pages/AuthorApiClient.ts` | 11 new methods: workflow start/advance/cancel/list/for-user/active, schedule publish/deactivate, bulk delete/move, publish status and reachability probes. `bulkPublish` now returns the parsed `BulkOperationResult` instead of `void` (existing callers ignored the return value) |
| `src/pages/ContentTreePage.ts` | `waitForRowNames(present, absent)` — an explicit wait for a folder listing, since `waitUntilLoaded()` does not cover the gap between a row click and the `/children` fetch resolving |

## Reruns and corrections during this session

Recorded per the test-evidence rules — the suite took four runs to go green, and
**every** fix was either a product finding or a defect in my own test code:

1. **Run 1** (10 pass / 1 fail): S6 failed. Two product findings landed here —
   `R20-3` and `R20-4` — plus two fixtures that would not delete, which turned out
   to be `R20-2`.
2. **A wrong claim of mine, corrected.** I first recorded that all three bulk
   endpoints never increment `failed`, having read only the `catch` blocks.
   `BulkOperationResult.addError()` increments it itself, and a direct probe
   confirmed bulk publish and move both report `failed=1` for a bad path. That
   claim was withdrawn before it reached any artifact; S12 now carries a positive
   control proving the counters work, and reports the real outlier (`R20-5`).
3. **Run 2** (6 pass / 6 fail): a regression of my own making — fixed fixture
   names collided with `R20-2`, so S1/S2/S3 died on `409` duplicate creates.
   `createFixturePage` now re-authors an undeletable node in place.
4. **Run 3** (11 pass / 1 fail): S6 again, this time with the message that exposed
   `R20-1`. Also fixed a race in my UI assertions: reading the tree listing right
   after a row click can return the *previous* folder's rows, which meant S7's
   all-negative assertions could have passed vacuously. Added
   `waitForRowNames` and gave S7 a positive control.
5. **Run 4** (12 pass / 0 fail) and the CI run: green, 13 operation rows.

No check was skipped.
