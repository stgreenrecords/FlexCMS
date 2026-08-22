# BUG-PUBLISH-REPLICATION — Publishing a node does not replicate it to the publish environment

## Summary

- Priority: P0
- Type: Bug
- Owner role/lane: `backend-dev`
- Source: `REB-19` blocker B-5 (`df/artifacts/REB-19/devops/blockers.md`)

## Goal

Make every publish path replicate content to the publish environment, so an author
who publishes a page sees that page on the publish instance.

## Defect

`POST /api/author/content/node/status?status=PUBLISHED` →
`AuthorContentController.updateStatus()` → `ContentNodeService.updateStatus()`
changes the node status and writes an audit entry, but **never triggers
replication**.

Replication is instead bolted onto one caller: `AuthorContentController.bulkPublish()`
loops over the request paths itself and calls `replicationAgent.replicateTree()`
(pages/site roots) or `replicationAgent.replicate(ACTIVATE)`. That is publish
business logic living in a controller, and it means every other publish path is
silently broken:

- the admin page editor's Publish button (`handlePublish()` → `/node/status`);
- any REST client calling `/node/status`;
- `ScheduledPublishingService`, which replicates with `replicate(ACTIVATE)` and so
  never carries a page's child components.

Observed: after publishing from the editor, the author node is `PUBLISHED` while
`GET /api/content/v1/pages/{path}` on `:8081` returns the page with **zero
components**.

## Solution design

Follow the existing cross-module event convention (`com.flexcms.core.event.ContentIndexEvent`,
consumed by `SearchIndexingListener`):

1. `flexcms-core` publishes a `ContentStatusChangedEvent` from the single place a
   node's status actually changes (`ContentNodeService.updateStatus`), so single
   and bulk transitions both emit it exactly once.
2. `flexcms-replication` consumes it with `@TransactionalEventListener(AFTER_COMMIT)`
   so a rolled-back transition never replicates, and dispatches
   `replicateTree` for `flexcms/page` / `flexcms/site-root` and
   `replicate(ACTIVATE)` otherwise; a transition away from `PUBLISHED` deactivates.
3. `AuthorContentController.bulkPublish()` drops its manual replication loop —
   publish semantics now live in one place for every caller.

`flexcms-replication` already depends on `flexcms-core`, so no dependency inversion
is introduced.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/event/ContentIndexEvent.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`
- `flexcms/flexcms-replication/src/main/java/com/flexcms/replication/service/ReplicationAgent.java`
- `df/artifacts/REB-19/devops/blockers.md` (B-5)

## Acceptance criteria

- AC1: Publishing a page through `/node/status` makes the page and all of its
  components visible on the publish instance.
- AC2: Bulk publish keeps working and replicates each path exactly once.
- AC3: Replication is triggered only after the status change commits.
- AC4: A transition away from `PUBLISHED` deactivates the node on publish.
- AC5: Publish business logic no longer lives in the controller.
- AC6: New unit tests cover the event emission and the listener dispatch; the full
  backend suite stays green.
- AC7: Verified live: publish from the admin editor, then confirm the change on
  `:8081`, and confirm the REB-19 S10 blocker no longer reproduces.
