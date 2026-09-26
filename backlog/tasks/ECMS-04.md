# ECMS-04 — Page copy and rename API

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors can duplicate a page (optionally with its subtree) and rename it, which every enterprise page console offers.

## Current state

No copy endpoint (live copy creates a sync relationship, which is not a plain copy). No rename endpoint — renaming requires delete + recreate.

## Acceptance criteria

- [ ] AC1: `POST /api/author/content/node/copy` copies a node (and optionally its subtree) to a target parent with a new name; copies get fresh ids, status DRAFT, and new version history.
- [ ] AC2: `POST /api/author/content/node/rename` changes the last path segment, rewrites descendant paths, and keeps ids and version history.
- [ ] AC3: Both reject a target path that already exists with 409 and a missing source with 404.
- [ ] AC4: Rename and copy are audited and replicate correctly (a renamed published page is retracted at the old path and republished at the new one, or the behaviour is decided and documented).
- [ ] AC5: Service-layer transactions; unit + IT coverage including subtree path rewriting.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-04-TC01 | AC1 | api | _Draft:_ `POST /api/author/content/node/copy` copies a node (and optionally its subtree) to a target parent with a new name; copies get fresh ids, status DRAFT, and new version history. | — |
| ECMS-04-TC02 | AC2 | api | _Draft:_ `POST /api/author/content/node/rename` changes the last path segment, rewrites descendant paths, and keeps ids and version history. | — |
| ECMS-04-TC03 | AC3 | api | _Draft:_ Both reject a target path that already exists with 409 and a missing source with 404. | — |
| ECMS-04-TC04 | AC4 | api | _Draft:_ Rename and copy are audited and replicate correctly (a renamed published page is retracted at the old path and republished at the new one, or the behaviour is decided and documented). | — |
| ECMS-04-TC05 | AC5 | api | _Draft:_ Service-layer transactions; unit + IT coverage including subtree path rewriting. | — |

## Out of scope

- UI (ECMS-05).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-04/task.md`). |
