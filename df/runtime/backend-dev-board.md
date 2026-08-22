# The Factory Backend Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `backend-dev` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P0 | TUT-LINK-CONTRACTS | Correct TUT-USA component link contracts | DONE | backend-dev | No | 2026-07-11 21:21 CEST | Completed: V18 contracts, migration/public-registry tests, PostgreSQL execution, all Maven gates, and Docker image/runtime validation pass |
| P0 | BUG-CONTENT-DELETE | Content node deletion fails for every node | DONE | backend-dev | No | 2026-08-19 23:05 CEDT | Completed: `@Modifying` + sibling-safe prefix, 5 new tests, verified live (delete cascades, shared-prefix siblings preserved); REB-19 fixtures now clean up |
| P0 | BUG-PUBLISH-REPLICATION | Publishing a node does not replicate it to the publish environment | DONE | backend-dev | No | 2026-08-19 23:05 CEDT | Completed: `ContentStatusChangedEvent` + AFTER_COMMIT replication listener, controller loop removed, 9 new tests, verified live via `/node/status` alone |
