# ECMS-08 — Version compare, labels, and historical as-of view API

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Give authors and compliance a real version history: labelled versions, diffs, and the ability to see the page as it was on any date.

## Current state

Snapshots are taken on every property change and can be restored, but there is no diff, no labels/comments, and no way to render a past state (test doc VER-011).

## Acceptance criteria

- [ ] AC1: Versions can carry a label and comment; `POST .../node/versions` creates an on-demand labelled version.
- [ ] AC2: Diff API returns structured property-level differences between two versions of a node, and component-level differences for a page subtree.
- [ ] AC3: As-of API returns the page JSON (including components) as it was at a given timestamp.
- [ ] AC4: Publishing creates a version automatically.
- [ ] AC5: Unit + IT coverage for diff correctness and as-of reconstruction.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-08-TC01 | AC1 | api | _Draft:_ Versions can carry a label and comment; `POST .../node/versions` creates an on-demand labelled version. | — |
| ECMS-08-TC02 | AC2 | api | _Draft:_ Diff API returns structured property-level differences between two versions of a node, and component-level differences for a page subtree. | — |
| ECMS-08-TC03 | AC3 | api | _Draft:_ As-of API returns the page JSON (including components) as it was at a given timestamp. | — |
| ECMS-08-TC04 | AC4 | api | _Draft:_ Publishing creates a version automatically. | — |
| ECMS-08-TC05 | AC5 | api | _Draft:_ Unit + IT coverage for diff correctness and as-of reconstruction. | — |

## Out of scope

- UI (ECMS-09).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ContentNodeVersion.java`
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-08/task.md`). |
