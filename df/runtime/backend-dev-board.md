# The Factory Backend Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `backend-dev` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P0 | TUT-LINK-CONTRACTS | Correct TUT-USA component link contracts | DONE | backend-dev | No | 2026-07-11 21:21 CEST | Completed: V18 contracts, migration/public-registry tests, PostgreSQL execution, all Maven gates, and Docker image/runtime validation pass |
| P0 | BUG-CONTENT-DELETE | Content node deletion fails for every node | DONE | backend-dev | No | 2026-08-19 23:05 CEDT | Completed: `@Modifying` + sibling-safe prefix, 5 new tests, verified live (delete cascades, shared-prefix siblings preserved); REB-19 fixtures now clean up |
| P0 | BUG-PUBLISH-REPLICATION | Publishing a node does not replicate it to the publish environment | DONE | backend-dev | No | 2026-08-19 23:05 CEDT | Completed: `ContentStatusChangedEvent` + AFTER_COMMIT replication listener, controller loop removed, 9 new tests, verified live via `/node/status` alone |
| P1 | ECMS-01 | Taxonomy and tagging service for pages, assets, and fragments | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements tag model, API, and search filtering |
| P0 | ECMS-03A | Backend: publish-tier asset delivery and asset replication | DONE | backend-dev | No | 2026-09-24 local | `/dam/renditions/**` on both tiers; assets replicate with content, explicit publish/unpublish, delete; mvn verify green; live 29/29 |
| P1 | ECMS-04 | Page copy and rename API | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements copy/rename |
| P1 | ECMS-06 | Page properties contract and validation | READY_FOR_DEV | backend-dev | Yes: ECMS-01 | 2026-09-24 local | Blocked until ECMS-01 is DONE |
| P1 | ECMS-08 | Version compare, labels, and historical as-of view API | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements |
| P2 | ECMS-10 | Review annotations API | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements |
| P1 | ECMS-25 | i18n dictionary REST API with import/export | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements |
| P1 | ECMS-41 | Asset metadata and lifecycle API | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements |
| P3 | ECMS-56 | Maintenance jobs: version, audit, and workflow purge | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements |
| P2 | ECMS-61 | Content search v2: reindex, facets, suggestions | READY_FOR_DEV | backend-dev | No | 2026-09-24 local | backend-dev implements |
