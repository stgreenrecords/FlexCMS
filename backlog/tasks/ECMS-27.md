# ECMS-27 — Translation projects, jobs, delta updates, and translation rules

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-25](ECMS-25.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Batch, track, and audit translation work, and pay only for changed content.

## Current state

Only one-shot language-copy creation exists; the DeepL connector is unreachable (GAP-081).

## Acceptance criteria

- [ ] AC1: Translation project and job entities with states (draft → submitted → in progress → ready for review → approved/rejected → complete).
- [ ] AC2: Jobs can contain pages, fragments, assets metadata, tags, and dictionaries.
- [ ] AC3: Delta update re-sends only content modified since the last completed job.
- [ ] AC4: Translation rules declare which component properties are translatable, so URLs and ids are never sent.
- [ ] AC5: Machine translation via the existing connector framework; human review step.
- [ ] AC6: Language-copy sync status is updated from real modification dates.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-27-TC01 | AC1 | api | _Draft:_ Translation project and job entities with states (draft → submitted → in progress → ready for review → approved/rejected → complete). | — |
| ECMS-27-TC02 | AC2 | api | _Draft:_ Jobs can contain pages, fragments, assets metadata, tags, and dictionaries. | — |
| ECMS-27-TC03 | AC3 | api | _Draft:_ Delta update re-sends only content modified since the last completed job. | — |
| ECMS-27-TC04 | AC4 | api | _Draft:_ Translation rules declare which component properties are translatable, so URLs and ids are never sent. | — |
| ECMS-27-TC05 | AC5 | api | _Draft:_ Machine translation via the existing connector framework; human review step. | — |
| ECMS-27-TC06 | AC6 | api | _Draft:_ Language-copy sync status is updated from real modification dates. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-27.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- Vendor-specific connectors.

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-i18n/src/main/java/com/flexcms/i18n/service/TranslationService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-27/task.md`). |
