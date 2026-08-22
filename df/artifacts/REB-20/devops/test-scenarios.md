# REB-20 — Test scenarios (devops)

Scenario design for the publishing, workflow, scheduling, and bulk operation E2E
suite. Every scenario below is implemented in
`frontend/apps/selenium-e2e/src/cases/admin/publishing-workflow-suite.spec.ts`
and runs against the live local stack (author `:8080`, publish `:8081`, admin
`:3000`, reference site `:3001`).

## What the platform actually offers

The suite was designed against the real API and UI surface, not against an
assumed one. Three facts shaped every scenario:

| Surface | Reality |
|---|---|
| Workflow | One seeded definition, `standard-publish`: `draft --submit→ review --approve→ approved --publish→ published`, with `reject` returning to `draft` from either participant step and `unpublish` returning from `published`. The `published` step carries `actions: ["replicate-activate"]`. No step is `type: "end"`. |
| Workflow paths | `AuthorWorkflowController` passes `contentPath` straight to `WorkflowEngine`, which looks the node up by exact path. Workflow calls therefore take the **ltree** form (`content.tut-usa.page`), unlike the content endpoints, which normalise `/content/...`. |
| Scheduling | `ScheduledPublishingService` polls on `@Scheduled(fixedDelay = 60_000)`. A schedule dated *now* is due on the next cycle, which makes the scheduled scenarios deterministic within two cycles instead of needing fake timers. |

Bulk operations and scheduling have **no admin UI** (see `blockers.md`), so for
those the UI evidence is the resulting tree state rather than the action itself.

## How an operation is covered

Each scenario records one row per operation in
`publishing-operation-matrix.csv`, with a column per surface:

| Surface | What it proves | Evidence |
|---|---|---|
| `apiEvidence` | The author API performed the operation and its state reflects it | `GET /node`, `GET /children`, `GET /workflow/*`, `BulkOperationResult` |
| `uiEvidence` | The admin UI shows the result, or why it cannot | `/workflows` inbox cards, content-tree listings |
| `publishEvidence` | The publish environment serves (or stops serving) the content | `GET :8081/api/content/v1/pages/{path}` |

An operation is `PASS` when it behaved as contracted on every surface it claims,
`BLOCKED` when a known, evidenced product gap stopped a surface from verifying,
and `FAIL` only for genuinely unexpected behaviour. `S11` asserts no row is
`FAIL` and that every `BLOCKED`/`SKIPPED` row carries a reason.

## Scenario list

### S10 — Publish-environment isolation guard (runs first)

Ordered before every other scenario on purpose: it proves the publish service
answers its health probe **and** that a freshly created, unpublished page is
*absent* from publish while present on the author delivery API. Without this,
every later "verified on publish" claim could be the author API answering for
itself, which is exactly what AC1 forbids.

### S1 — Workflow start (AC2)

Starts `standard-publish` on a test-owned page and verifies: instance `ACTIVE` at
step `draft`, `contentPath`/`startedBy` correct, `GET /workflow/active` finds it,
`GET /workflow/list?status=ACTIVE` contains it, and a **second** start for the
same path is refused. UI: the `/workflows` inbox lists a card reading
`Content path: {ltree path}` and the Pending tab count is non-zero.

### S2 — Workflow advance through approval to publish (AC1, AC2)

Advances `submit → approve → publish` and asserts, at each step, both the
workflow state (`currentStepId`, `previousStepId`, `lastAction`, `lastActionBy`,
`lastComment`) and the node status the step drives
(`DRAFT → IN_REVIEW → APPROVED → PUBLISHED`). The `published` step's
`replicate-activate` action is then verified **on the publish environment** by
polling for the run's marker. Records that the instance stays `ACTIVE` afterwards,
because the definition has no `end` step.

### S3 — Workflow reject and cancel (AC2)

On a second page: `submit`, then `reject` — asserting the workflow returns to step
`draft`, stays `ACTIVE`, and the node returns to `DRAFT` — then `cancel`,
asserting `CANCELLED`, that `GET /workflow/active` answers 404, and that the
instance is in the `CANCELLED` list and gone from the `ACTIVE` list. UI: the card
**disappears** from the inbox, which is the correct expectation because
`listForUser` returns only `ACTIVE` instances.

### S4 — Individual publish (AC1)

Publishes one node through `POST /node/status?status=PUBLISHED` — the path
`BUG-PUBLISH-REPLICATION` fixed — and proves the marker is absent from publish
beforehand and served afterwards, i.e. that the status endpoint replicates
unaided.

### S5 — Bulk publish (AC1)

Publishes two pages in one `POST /bulk/publish`, asserting
`BulkOperationResult` (`succeeded=2`, `errors=[]`, `total=2`), both node statuses,
and **both** markers on the publish environment.

### S6 — Bulk move (AC2, AC3)

Moves a test-owned page under a test-owned parent. Hard assertions: no errors,
`succeeded=1`, the old path 404s, the new path resolves, and the authored
properties survive. The re-parenting itself is *recorded* rather than asserted,
because `move()` leaves the moved node's `parentPath` stale (`R20-1`) — so the
scenario stays correct both today and once that is fixed. UI: the move target is
listed at the site root, and whether the stale source row is still shown there is
recorded as evidence.

### S7 — Bulk delete (AC3)

Deletes two test-owned pages in one call and asserts both are gone from the API
**and** that an unlisted sibling survives, proving the delete is scoped. UI: the
content-tree listing must contain the surviving sibling and neither deleted page —
the positive control matters, because an all-negative assertion would pass against
a stale or wrong folder listing.

### S8 — Scheduled publish (AC1, AC4)

Schedules a publish dated *now*, asserts the schedule is persisted and that
scheduling alone does not change the status, waits for the scheduler to clear it
(≤ 180 s = two 60 s cycles plus replication), then verifies the marker on the
publish environment. Records `R20-3`: the author status is never transitioned.

### S9 — Scheduled deactivation (AC1, AC4)

Publishes a page, confirms it is live, schedules a deactivation dated *now*, waits
for the scheduler to consume it, then records what the publish environment
actually does. Today it keeps serving the page and the author status stays
`PUBLISHED` (`R20-4`), so the row is `BLOCKED` with live evidence rather than a
false pass.

### S12 — Bulk failure reporting and workflow-blocked deletion

Two checks that only an exhaustive suite would reach:

- a **positive control** that a genuine per-path failure is reported — bulk
  publish on a nonexistent path returns `succeeded=0, failed=1` with the path
  named — followed by the finding that bulk **delete** reports `succeeded=1` for a
  path that never existed (`R20-5`);
- deleting a page that carried a workflow, which is refused permanently by the
  `workflow_instances` foreign key and surfaces as an opaque HTTP 500 (`R20-2`).

### S11 — Matrix completeness

Asserts the matrix has a row per operation, no `FAIL` rows, and that every
`BLOCKED` or `SKIPPED` row carries a reason.

## Fixture strategy — fixed names, test-owned paths (AC3)

All fixtures are test-owned pages directly under `content.tut-usa`, with
**deterministic** names (`reb20-workflow-approve`, `reb20-bulk-publish-a`, …)
rather than timestamped ones. Two product constraints force this:

- nothing can retract published content (`R26-1`/`R26-2`), so timestamped names
  would leave a new publish-side orphan on **every** run;
- a page that has carried a workflow can never be deleted (`R20-2`), so the two
  workflow fixtures survive the run regardless.

Each run therefore deletes and recreates what it can, and **re-authors in place**
what it cannot delete, so the residue is bounded to this fixed set instead of
growing. Cleanup reports an undeletable workflow fixture as
`undeletable by design (workflow FK)`, and anything else as a `FIXTURE LEAK`, so
the two cases can never be confused.

## Deliberate non-goals

- **No seeded content is mutated.** Every operation acts on test-owned fixtures;
  `S7` additionally proves a non-listed sibling survives a bulk delete.
- **No PIM or DAM writes.** Out of scope here; covered by REB-21 and REB-23.
- **No scheduler clock manipulation.** Schedules are dated *now* and the real 60 s
  poll is awaited, so the evidence reflects the shipped scheduler rather than a
  test-only time source.
- **No UI assertions where no UI exists.** Bulk and scheduling actions are
  API-only; claiming UI coverage for them would be false evidence.

## Run instructions

```bash
# Prerequisites: author :8080, publish :8081, admin :3000, site :3001 all running.
# Backends must include the `local` profile, and the frontends must be production
# builds — see hints_for_agent.md for both.
cd frontend/apps/selenium-e2e

pnpm test:reb20          # spec reporter
pnpm test:reb20:ci       # JUnit XML -> reports/junit/reb20-suite.xml
pnpm ci:gate:full        # includes REB-20 alongside REB-12/13/18/19/26
```
