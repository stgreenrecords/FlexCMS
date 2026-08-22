# BUG-PUBLISH-REPLICATION / BUG-CONTENT-DELETE — Handoff

## 2026-08-19 — `backend-dev` → next role

- **Task ids:** `BUG-PUBLISH-REPLICATION`, `BUG-CONTENT-DELETE`
- **Current state:** both `DONE`
- **Previous role result:** both P0 defects raised from REB-19 evidence are fixed,
  covered by new unit tests, and verified live against the running stack.
- **Files changed:**
  - `flexcms-core/src/main/java/com/flexcms/core/event/ContentStatusChangedEvent.java` (new)
  - `flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
  - `flexcms-core/src/main/java/com/flexcms/core/repository/ContentNodeRepository.java`
  - `flexcms-replication/src/main/java/com/flexcms/replication/listener/ContentPublishReplicationListener.java` (new)
  - `flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`
  - tests: `ContentPublishReplicationListenerTest` (new), `ContentNodeServiceTest`, `ContentNodeRepositoryIT`
  - `pom.xml` — Testcontainers pin left at 1.19.8 with the Docker 29 constraint documented
- **Checks performed:** `mvn install -DskipTests` PASS; `mvn test` **505 tests / 0
  failures**; live delete and live publish verification; `pnpm test:reb19`
  8 passing / 2 pending / 0 failing; `ci:gate:full` PASS (48 tests / 0 failures).
- **Known risks:**
  - Four repository ITs covering the delete fix are written but cannot execute on
    this host — see `INFRA-TESTCONTAINERS-DOCKER29`.
  - `ScheduledPublishingService` still calls `replicationAgent.replicate(ACTIVATE)`
    directly on top of the new event-driven replication. Harmless (the node is
    activated twice) but now redundant; removing it is a small follow-up.
- **Next role/action:**
  - `devops` → `REB-26`, now genuinely unblocked: fixture pages can be created and
    deleted again, so the 406-component sweep will not pollute the content tree.
  - `devops` → `INFRA-TESTCONTAINERS-DOCKER29` so integration tests run and gate.
  - `sa` → decide routing for the still-open REB-19 blockers B-1, B-2, B-3, B-4, B-6
    (all `frontend-dev` except B-6).
