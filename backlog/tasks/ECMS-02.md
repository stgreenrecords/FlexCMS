# ECMS-02 — Reference index and 'where used' API for pages, assets, and fragments

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Let authors see every place a page, asset, or fragment is used before changing, unpublishing, or deleting it.

## Current state

Only the component registry reports usages. Asset Detail's Usage References panel is permanently empty; deleting a referenced asset or page gives no warning.

## Acceptance criteria

- [ ] AC1: Technical design decides between maintaining a reference table on write vs. querying JSONB on read, with a measured cost on the seeded dataset.
- [ ] AC2: API returns inbound references for a page path, asset path/id, or fragment path, including the referring node path, property name, and status (draft/published).
- [ ] AC3: References inside component properties (links, `x-asset` fields, fragment references) are detected from the component `dataSchema`, not by string guessing.
- [ ] AC4: Delete and unpublish endpoints can report affected references (dry-run flag) so the UI can warn.
- [ ] AC5: Reference data stays correct after move, rename, copy, and delete.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-02-TC01 | AC2 | api | _Draft:_ API returns inbound references for a page path, asset path/id, or fragment path, including the referring node path, property name, and status (draft/published). | — |
| ECMS-02-TC02 | AC3 | api | _Draft:_ References inside component properties (links, `x-asset` fields, fragment references) are detected from the component `dataSchema`, not by string guessing. | — |
| ECMS-02-TC03 | AC4 | ui | _Draft:_ Delete and unpublish endpoints can report affected references (dry-run flag) so the UI can warn. | — |
| ECMS-02-TC04 | AC5 | api | _Draft:_ Reference data stays correct after move, rename, copy, and delete. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-02.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- UI panels (delivered by the console tasks that consume this API).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `Design/tut-usa/generated/component-contracts.json`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-02/task.md`). |
