# REB-20 — Implementation blockers and findings

Every item below was **observed at runtime** by the REB-20 suite against the
running local stack, or reproduced directly against the author API, and each
names the exact file and symbol. Run of record: 2026-08-21, 12 tests / 0
failures, 13 operation rows (see `summary.md`). None is caused by REB-20's own
changes — the suite exposes them. All are outside the `devops` lane and are
reported here for SA routing rather than fixed in this session.

REB-26 already recorded `R26-1` (delete never replicates) and `R26-2` (unpublish
never retracts). `R20-4` below is the same defect reached through the scheduler,
and confirms it a second way.

---

## R20-1 — Moving content leaves the moved node's `parentPath` stale

> **RESOLVED 2026-08-23.** `ContentNodeService.move()` sets the subtree root's
> `parentPath` to the target explicitly; substitution still handles descendants, whose
> `parentPath` legitimately contains `sourcePath`. Covered by a new unit test
> (`move_reparentsTheMovedNodeItself_notJustItsDescendants` — the existing test only
> asserted the *child's* parentPath, which is how this shipped) and verified live by
> REB-20 `S6`, now PASS.


**Severity:** highest-impact finding in this task. Content silently disappears
from the folder it was moved into and keeps appearing in the folder it left.

**Where:** `flexcms-core` → `ContentNodeService.move(String sourcePath, String targetParentPath, String userId)`

```java
for (ContentNode n : subtree) {
    String updatedPath = n.getPath().replace(sourcePath, newPath);
    String updatedParent = n.getParentPath() != null
            ? n.getParentPath().replace(sourcePath, newPath)
            : targetParentPath;
    n.setPath(updatedPath);
    n.setParentPath(updatedParent);
    ...
}
```

**What:** the loop rewrites `parentPath` by substituting `sourcePath` inside it.
That works for every **descendant**, whose `parentPath` starts with `sourcePath` —
but it is a no-op for the **subtree's own root**, the node actually being moved,
because its `parentPath` is its old parent and does not contain `sourcePath`. The
`targetParentPath` branch is only reached when `parentPath` is `null`. So the
moved node ends up with a correct `path` and a stale `parentPath`.

Every children-based view reads `parentPath`, so the moved page is missing from
its new parent and still listed under its old one — with a `path` that no longer
sits beneath the parent that returned it. `ContentNodeService.bulkMove()`
delegates to `move()`, so single and bulk moves are both affected.

**Observed** (moving `reb20-move-source` under `reb20-move-target`):

```
GET /node?path=content.tut-usa.reb20-move-target.reb20-move-source   -> 200   (path rewritten)
    node.parentPath = "content.tut-usa"        (expected "content.tut-usa.reb20-move-target")
GET /children?path=content.tut-usa.reb20-move-target                 -> []    (0 children)
GET /children?path=content.tut-usa
    -> name=reb20-move-source
       path=content.tut-usa.reb20-move-target.reb20-move-source
       parentPath=content.tut-usa
```

**Consequence for the admin UI:** the content tree lists children by
`parentPath`, so an author who moves a page sees it remain in the old folder and
never appear in the new one.

**Suggested lane:** `backend-dev` — set the subtree root's `parentPath` to
`targetParentPath` explicitly instead of relying on the substring replace. Worth
covering with a repository/service test that moves a node **with** descendants and
asserts both the root's and a descendant's `parentPath`.

---

## R20-2 — A page that has ever had a workflow can never be deleted

> **RESOLVED 2026-08-23.** Migration `V19__workflow_instances_cascade_on_content_delete.sql`
> adds `ON DELETE CASCADE` to `workflow_instances.content_node_id`. A workflow instance
> describes the review of one node, so it goes when the node goes — keeping orphans
> would also let `getActiveWorkflow(path)` return an active workflow for deleted
> content. Verified live: `confdeltype = 'c'` on the constraint, and REB-20 `S12` PASS.


**Severity:** high. Any page that went through review becomes permanently
undeletable, and the author is shown only a generic error.

**Where:**
- schema: `workflow_instances.content_node_id` → FK to `content_nodes.id`, no `ON DELETE` rule
- `flexcms-core` → `ContentNodeRepository.deleteSubtree(String path)`

**What:** `deleteSubtree` is a bulk `DELETE FROM content_nodes ...`. If any
`workflow_instances` row still references one of those nodes, PostgreSQL rejects
the statement. Nothing removes or nulls the workflow rows first, and cancelling
the workflow does not help — `CANCELLED` and `COMPLETED` instances keep their
`content_node_id`. The API surfaces this as an opaque HTTP 500.

**Observed:**

```
DELETE /api/author/content/node?path=content.tut-usa.reb20-workflow-cancel&userId=admin
  -> 500 {"detail":"An unexpected error occurred. Please contact support with the correlation ID.", ...}
GET    /api/author/content/node?path=content.tut-usa.reb20-workflow-cancel   -> 200  (still there)

author.log:
  ERROR: update or delete on table "content_nodes" violates foreign key constraint
         "workflow_instances_content_node_id_fkey" on table "workflow_instances"
  Detail: Key (id)=(e3921f19-...) is still referenced from table "workflow_instances".
  [DELETE FROM content_nodes WHERE path::text = ? OR path::text LIKE ? || '.%']
```

**Consequence for this suite:** REB-20's two workflow fixtures cannot be cleaned
up. Fixture names are deliberately fixed, so each run re-authors those two paths
in place instead of accumulating new undeletable nodes, and the run logs them as
`undeletable by design (workflow FK)` rather than as leaks.

**Suggested lane:** `backend-dev`, with `sa` deciding the intended semantics —
cascade the workflow history, null the reference, or refuse the delete with a
clear `409` explaining that workflow history exists. The current generic `500` is
wrong under any of those choices.

---

## R20-3 — Scheduled publish never updates the author-side status

> **RESOLVED 2026-08-23.** `ScheduledPublishingService` now calls
> `ContentNodeService.updateStatus()`, so the scheduled path performs the same status
> transition, audit entry, and `ContentStatusChangedEvent` as every other publish path
> — including the *tree* replication a page needs, which the previous direct
> single-node `replicate()` call also got wrong. Two follow-on defects were found and
> fixed while verifying: the schedule-clearing helper re-saved a pre-transition entity
> (writing DRAFT back over PUBLISHED), and the `@Scheduled` thread had no
> `SecurityContext` for the `@PreAuthorize`d call. Verified live by REB-20 `S8`, PASS
> in 30 s, with `Scheduled publish complete: 1/1 succeeded`.


**Severity:** high. The public is served a page the author still shows as a draft.

**Where:** `flexcms-author` → `ScheduledPublishingService.processScheduledPublishes()`

```java
for (ContentNode node : due) {
    try {
        replicationAgent.replicate(node.getPath(), ReplicationAction.ACTIVATE, SCHEDULER_USER);
        clearScheduledPublish(node);
        succeeded++;
    } catch (Exception e) { ... }
}
```

**What:** the scheduler replicates the node and clears the schedule, but never
performs a status transition. `POST /node/status` and `POST /bulk/publish` both go
through `ContentNodeService`, which sets `PUBLISHED` and fires
`ContentStatusChangedEvent`; the scheduled path bypasses that entirely. The node
is live on the publish environment while the author still reads `DRAFT`.

It also interacts badly with the due-query: `findDueForPublish` selects on
`status <> 'PUBLISHED'`, so a node published by the scheduler stays eligible and
would be re-selected if a schedule were ever set on it again.

**Observed:**

```
PUT /node/schedule-publish?path=content.tut-usa.reb20-schedule-publish&publishAt=<now>  -> 200
    node.scheduledPublishAt set, node.status = DRAFT
(scheduler cycle, ~46-58 s later)
    node.scheduledPublishAt cleared
GET :8081/api/content/v1/pages/tut-usa/reb20-schedule-publish  -> serves the authored marker
GET  node.status                                               -> DRAFT   (never transitioned)
```

**Suggested lane:** `backend-dev` — route scheduled publishing through the same
status transition as the other two publish paths, so all three behave identically.

---

## R20-4 — Scheduled deactivation does not retract content, and leaves the author status untouched

> **RESOLVED 2026-08-23.** Same routing through `updateStatus()` (to `ARCHIVED`), plus
> the `R26-2` subtree/delivery fix so the retraction is visible to the public.
> Verified live by REB-20 `S9` with `Scheduled deactivation complete: 1/1 succeeded`.


**Severity:** high. Confirms REB-26 `R26-2` through a second code path, and adds
an author-side symptom.

**Where:**
- `flexcms-author` → `ScheduledPublishingService.processScheduledDeactivations()`
- `flexcms-replication` → `ReplicationReceiver.deactivateContent(ReplicationEvent)`

**What:** two gaps compound. The receiver only flips the publish-side **page**
node to `DRAFT`, leaving its child components in place, and the publish delivery
API serves pages regardless of status (`R26-2`). On top of that, the scheduled
path never transitions the author node either — so after a scheduled
deactivation, *nothing anywhere* reflects it.

**Observed:**

```
POST /bulk/publish                                    -> node PUBLISHED, live on :8081
PUT  /node/schedule-deactivate?...&deactivateAt=<now> -> 200, scheduledDeactivateAt set
(scheduler cycle)                                     -> scheduledDeactivateAt cleared
GET :8081/api/content/v1/pages/tut-usa/reb20-schedule-deactivate -> 200, marker still served
GET  node.status                                                 -> PUBLISHED  (unchanged)
```

**Suggested lane:** `backend-dev` (replicate the subtree on deactivate; make the
publish resolver status-aware; transition the author node), with `sa` confirming
whether publish delivery should filter on status. Track together with `R26-2`.

---

## R20-5 — Bulk delete reports success for content that never existed

> **RESOLVED 2026-08-23.** `ContentNodeService.delete()` resolves the node first and
> throws `NotFoundException`, which `bulkDelete()` already records as a per-path error.
> Covered by `bulkDelete_reportsMissingPathAsFailedRatherThanSucceeded` and verified
> live: `DELETE` of a never-existing path now answers 404, and REB-20 `S7`/`S12` PASS.


**Severity:** medium. A caller cannot tell a successful delete from a no-op.

**Where:** `flexcms-core` → `ContentNodeService.bulkDelete` → `delete` →
`ContentNodeRepository.deleteSubtree`

**What:** `deleteSubtree` is a bulk SQL `DELETE` that affects zero rows when the
path is absent, and nothing raises. `bulkDelete` therefore counts a wholly
fictional path as `succeeded`, and an audit entry is written either way. Bulk
publish and bulk move both reject a missing path, which makes delete the outlier.

**Observed** (same run, one path that has never existed):

```
DELETE /api/author/content/bulk       {"paths":["content.tut-usa.reb20-does-not-exist-…"]}
  -> {"succeeded":1,"failed":0,"total":1,"errors":[]}

POST /api/author/content/bulk/publish {"paths":["content.tut-usa.reb20-does-not-exist-…"]}
  -> {"succeeded":0,"failed":1,"total":1,"errors":["… : Resource not found at path: …"]}

POST /api/author/content/bulk/move    {"paths":["content.tut-usa.home"], "targetParentPath":"…missing…"}
  -> {"succeeded":0,"failed":1,"total":1,"errors":["content.tut-usa.home: Resource not found at path: …"]}
```

**Suggested lane:** `backend-dev` — have `delete` verify the node exists (or check
the affected row count) so a missing path is reported as an error like the other
bulk operations.

---

## Non-blocking observations

- **The `standard-publish` workflow never completes.** Its definition has no step
  of `type: "end"`, so `WorkflowEngine.advance` never sets
  `WorkflowStatus.COMPLETED`. An instance stays `ACTIVE` at the `published` step
  indefinitely. Combined with the next point, the admin inbox's **Approved** tab —
  which maps `COMPLETED` + `lastAction != 'reject'` to `approved` — can never
  populate.
- **The workflow inbox can only ever show active work.**
  `WorkflowEngine.listForUser(userId, pageable)` ignores its `userId` and returns
  `findByStatus(ACTIVE, pageable)` (documented in its own Javadoc as local-dev
  behaviour). The admin page at `/workflows` reads exactly that endpoint, so
  cancelled and completed workflows are invisible there and its **Approved** and
  **Rejected** tabs are unreachable by any API-visible state. A cancelled workflow
  simply vanishes from the inbox — which is what `S3` asserts.
- **Bulk operations have no admin UI.** `POST /bulk/publish`, `DELETE /bulk`, and
  `POST /bulk/move` have no wiring in
  `frontend/apps/admin/src/app/(admin)/content/page.tsx`: the page has selection
  checkboxes and a "N selected" indicator, but no action calls those endpoints.
  The suite therefore verifies bulk operations through the API and uses the tree
  UI only to confirm the resulting tree state.
- **Scheduling has no admin UI either.** `schedule-publish` and
  `schedule-deactivate` are API-only, so `S8`/`S9` have no UI surface to assert.
- **The content tree cannot descend into a page.** `ContentRow.handleClick` calls
  `onNavigate()` only when `resourceType !== 'flexcms/page'`, because a page's
  children are its components rather than browsable content. Since the TUT-USA
  model has no folder type — `content.tut-usa` is a `flexcms/site-root` and
  everything beneath it is a `flexcms/page` — a page moved under another page is
  reachable through the author API but not browsable in the tree. This is by
  design, not a defect, and is why `S6` verifies the move through the API plus the
  old parent's listing.
- **The author API accepts any `resourceType` string.** `POST /node` created nodes
  with `flexcms/folder`, `flexcms/container`, and `nt:folder` without validation,
  none of which the content model defines. Not exercised further by this suite,
  which sticks to the types the seeded site actually uses.
