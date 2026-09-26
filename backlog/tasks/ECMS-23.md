# ECMS-23 — Multi-site management completeness: rollout configs, inheritance control, conflicts

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Corporate changes reach every derived site automatically, while local teams keep the local changes they need.

## Current state

Live copy create (deep, excluded properties), manual rollout, detach, list, and status exist in API. No rollout triggers, no per-component cancel/re-enable, no suspend/resume, no conflict rules; rollout of a nonexistent source answers 200 with 0 updates.

## Acceptance criteria

- [ ] AC1: Rollout configurations: trigger (manual, on source activation, on source modification) and actions (update content, add/remove pages, reorder, activate on rollout).
- [ ] AC2: Cancel and re-enable inheritance per page and per component; re-enable restores source content.
- [ ] AC3: Suspend/resume a whole live copy.
- [ ] AC4: Conflict rules for name collisions (source wins / local wins / rename local).
- [ ] AC5: Live-copy overview API with per-node status (inherited, cancelled, suspended, not rolled out).
- [ ] AC6: Rollout of a nonexistent source returns 404.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-23-TC01 | AC1 | api | _Draft:_ Rollout configurations: trigger (manual, on source activation, on source modification) and actions (update content, add/remove pages, reorder, activate on rollout). | — |
| ECMS-23-TC02 | AC2 | api | _Draft:_ Cancel and re-enable inheritance per page and per component; re-enable restores source content. | — |
| ECMS-23-TC03 | AC3 | api | _Draft:_ Suspend/resume a whole live copy. | — |
| ECMS-23-TC04 | AC4 | api | _Draft:_ Conflict rules for name collisions (source wins / local wins / rename local). | — |
| ECMS-23-TC05 | AC5 | api | _Draft:_ Live-copy overview API with per-node status (inherited, cancelled, suspended, not rolled out). | — |
| ECMS-23-TC06 | AC6 | api | _Draft:_ Rollout of a nonexistent source returns 404. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-23.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- UI (ECMS-24).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-multisite/src/main/java/com/flexcms/multisite/service/LiveCopyService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-23/task.md`). |
