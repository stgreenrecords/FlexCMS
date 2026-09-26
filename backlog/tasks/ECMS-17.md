# ECMS-17 — Audit log viewer

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Compliance and admins can see who did what and when without API access.

## Current state

Audit API is complete (`/api/author/audit` with entity/path/user/action/date filters); there is no UI and the Dashboard link is inert (test doc GAP-090).

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for an audit log screen with filters and a per-page history drawer.
- [ ] AC2: Frontend: filter by entity type, path, user, action, and date range; paginated; link to the affected node.
- [ ] AC3: Per-page audit tab reachable from the Content Tree.
- [ ] AC4: Playwright E2E: perform actions and find them in the log.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-17-TC01 | AC2 | ui | _Draft:_ Frontend: filter by entity type, path, user, action, and date range; paginated; link to the affected node. | — |
| ECMS-17-TC02 | AC3 | ui | _Draft:_ Per-page audit tab reachable from the Content Tree. | — |
| ECMS-17-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: perform actions and find them in the log. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuditLogController.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-17/task.md`). |
