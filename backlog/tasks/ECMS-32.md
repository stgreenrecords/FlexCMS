# ECMS-32 — Staged releases: parallel future versions of a site section

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Campaign teams build next month's version of a section while normal edits continue, then promote it in one step.

## Current state

No equivalent exists.

## Acceptance criteria

- [ ] AC1: Create a release from one or more source subtrees with a title and target date; content is copied into a separate release area linked to the source.
- [ ] AC2: Sync from source pulls live changes into the release.
- [ ] AC3: Promote: all pages, only modified pages, or a chosen subset replace the source; optional publish in the same step or at the scheduled date.
- [ ] AC4: Nested releases supported; translation jobs can target a release.
- [ ] AC5: Technical design addresses storage (separate ltree root), conflict rules, and permissions.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-32-TC01 | AC1 | api | _Draft:_ Create a release from one or more source subtrees with a title and target date; content is copied into a separate release area linked to the source. | — |
| ECMS-32-TC02 | AC2 | api | _Draft:_ Sync from source pulls live changes into the release. | — |
| ECMS-32-TC03 | AC3 | api | _Draft:_ Promote: all pages, only modified pages, or a chosen subset replace the source; optional publish in the same step or at the scheduled date. | — |
| ECMS-32-TC04 | AC4 | api | _Draft:_ Nested releases supported; translation jobs can target a release. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-32.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- UI (ECMS-33).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-32/task.md`). |
