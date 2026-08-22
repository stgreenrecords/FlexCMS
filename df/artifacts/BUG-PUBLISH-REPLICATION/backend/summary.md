# BUG-PUBLISH-REPLICATION — Backend delivery summary

- Task: `BUG-PUBLISH-REPLICATION` — Publishing a node does not replicate it to the publish environment
- Role/lane: `backend-dev`
- State: `DEV_IN_PROGRESS` → `DONE`
- Session: 2026-08-19, Mode B
- Source: `REB-19` blocker B-5

## Root cause

Replication was not part of publishing — it was bolted onto a single caller.

`AuthorContentController.bulkPublish()` changed status through the service and then
looped over the request paths itself, calling `replicationAgent.replicateTree(...)`
for pages and `replicate(ACTIVATE)` for everything else. That is publish business
logic living in a controller, and it left every other publish path broken:

- `POST /api/author/content/node/status` — what the admin page editor's Publish
  button calls — only changed status;
- any REST client using that endpoint;
- `ScheduledPublishingService`, which replicated with `replicate(ACTIVATE)` and so
  never carried a page's child components.

The user-visible symptom: an author publishes a page from the editor, the UI shows
"Published", and the publish instance serves that page with **zero components** —
forever.

## Change

The rule "publishing a node replicates it" now lives behind the status transition
itself, following the codebase's existing cross-module event convention
(`ContentIndexEvent` → `SearchIndexingListener`).

| File | Change |
|---|---|
| `flexcms-core/.../event/ContentStatusChangedEvent.java` | **New.** Carries node, previous status, new status, and user, with `isPublished()` / `isUnpublished()` helpers. |
| `flexcms-core/.../service/ContentNodeService.java` | `updateStatus(...)` captures the previous status and publishes the event after the save and audit entry. Every publish path funnels through this method — the single-node endpoint, `bulkUpdateStatus`, and scheduled publishing — so each transition is announced exactly once. |
| `flexcms-replication/.../listener/ContentPublishReplicationListener.java` | **New.** `@TransactionalEventListener(AFTER_COMMIT)` dispatches `replicateTree` for `flexcms/page` / `flexcms/site-root` and `replicate(ACTIVATE)` otherwise; a transition away from `PUBLISHED` deactivates. Replication failures are logged, not rethrown — the author-side transition already committed and re-publishing is the recovery. |
| `flexcms-author/.../controller/AuthorContentController.java` | Manual replication loop, the `ReplicationAgent` dependency, and the `isTreeReplicationCandidate` helper removed. `bulkPublish` is now a single service call. |

Design notes:

- `flexcms-replication` already depends on `flexcms-core`, so listening there
  introduces no dependency inversion — core stays unaware of replication.
- `AFTER_COMMIT` is deliberate: a rolled-back status change must never reach the
  publish environment.
- The listener carries the same `@ConditionalOnProperty(flexcms.runmode=author)`
  guard as `ReplicationAgent`, so it does not register on publish instances.
- Exactly-once is preserved: `bulkUpdateStatus` delegates to `updateStatus` per
  path, so removing the controller loop prevents what would otherwise have become
  double replication.

## Tests written and run

`ContentPublishReplicationListenerTest` (new, 6 tests, all green):

| Test | Covers |
|---|---|
| `publishingAPage_replicatesTheWholeSubtree` | AC1 — pages replicate as a tree, never as a single node |
| `publishingASiteRoot_replicatesTheWholeSubtree` | site roots behave like pages |
| `publishingAComponent_replicatesTheSingleNode` | non-page nodes use `ACTIVATE` |
| `leavingPublished_deactivatesOnPublish` | AC4 — unpublish deactivates |
| `transitionBetweenUnpublishedStates_doesNotReplicate` | DRAFT → IN_REVIEW is not a publish |
| `replicationFailure_isSwallowedSoThePublishedStatusStands` | a broken queue does not fail the author transition |

`ContentNodeServiceTest` (extended):

| Test | Covers |
|---|---|
| `updateStatus_publishesStatusChangedEvent` | AC3 — event carries correct path, previous/new status, user |
| `updateStatus_publishesUnpublishEvent_whenLeavingPublished` | unpublish semantics |
| `updateStatus_publishesNoEvent_whenNodeMissing` | no event on a failed transition |

## Validation evidence

| # | Command | Result |
|---|---|---|
| 1 | `mvn install -DskipTests -B` | BUILD SUCCESS |
| 2 | `mvn test -B` | BUILD SUCCESS — **505 tests, 0 failures, 0 errors, 0 skipped** (was 495; +10 new) |
| 3 | Live verification against the running stack (below) | PASS |
| 4 | `pnpm --filter @flexcms/selenium-e2e test:reb19` | 8 passing, 2 pending, 0 failing — **S10 blocker no longer reproduces** |
| 5 | `pnpm --filter @flexcms/selenium-e2e ci:gate:full` | PASS — 48 tests, 0 failures |

Live verification used **only** the editor's own endpoint, with no bulk publish:

```
author components     1
publish before        500 components: n/a      <- page not replicated yet
POST /node/status     200
publish after         200 components: 1  (after 2s)
MARKER ON PUBLISH     True
```

Before the fix that same sequence left the publish instance at zero components
indefinitely.

Regression check in the REB-19 suite: S10 previously recorded a `BLOCKED` matrix
row for the editor publish path and needed a bulk publish to satisfy AC4. It now
records a single `PASS` row with `verifiedLayers = ui,author-api,publish`, and the
matrix dropped from 79 rows to 78 because the blocked row is gone.

## Acceptance criteria

| AC | Status | Evidence |
|---|---|---|
| AC1 — `/node/status` publish makes page + components visible on publish | ✅ | live run above |
| AC2 — bulk publish still works, replicates once per path | ✅ | `ci:gate:full` PASS; REB-12 (22 tests) and REB-18 rely on bulk publish |
| AC3 — replication only after commit | ✅ | `@TransactionalEventListener(AFTER_COMMIT)`; `updateStatus_publishesNoEvent_whenNodeMissing` |
| AC4 — leaving PUBLISHED deactivates | ✅ | `leavingPublished_deactivatesOnPublish` |
| AC5 — publish logic out of the controller | ✅ | controller loop, `ReplicationAgent` field, and helper removed |
| AC6 — new unit tests, full suite green | ✅ | 505 tests, 0 failures |
| AC7 — verified live, REB-19 S10 blocker gone | ✅ | live run + REB-19 rerun |

## Side effect worth noting

`ScheduledPublishingService` still calls `replicationAgent.replicate(..., ACTIVATE)`
directly *in addition to* going through `updateStatus`. That path now also gets
correct tree replication from the listener, so scheduled publishing of a page no
longer loses its components. Its own direct `replicate` call is now redundant and
could be removed as a follow-up cleanup; it is harmless (the same node is
activated twice) and was left alone to keep this fix scoped.
