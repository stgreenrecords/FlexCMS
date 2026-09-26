# ECMS-10 — Review annotations API

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Reviewers can leave comments pinned to a page or a specific component for structured review before go-live.

## Current state

No comment/annotation model exists.

## Acceptance criteria

- [ ] AC1: Annotation entity attached to a node path (page or component) with author, text, status (open/resolved), timestamps, and replies.
- [ ] AC2: CRUD + resolve API; list by page including descendant components.
- [ ] AC3: Annotations are excluded from published content and from replication.
- [ ] AC4: Deleting the annotated node removes or orphans its annotations per a documented rule.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-10-TC01 | AC1 | api | _Draft:_ Annotation entity attached to a node path (page or component) with author, text, status (open/resolved), timestamps, and replies. | — |
| ECMS-10-TC02 | AC2 | api | _Draft:_ CRUD + resolve API; list by page including descendant components. | — |
| ECMS-10-TC03 | AC3 | api | _Draft:_ Annotations are excluded from published content and from replication. | — |
| ECMS-10-TC04 | AC4 | api | _Draft:_ Deleting the annotated node removes or orphans its annotations per a documented rule. | — |

## Out of scope

- Annotate mode UI (ECMS-11).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-10/task.md`). |
