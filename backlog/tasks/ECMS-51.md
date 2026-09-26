# ECMS-51 — Inbox v2 and workflow administration console

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-48](ECMS-48.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Every user has a clear personal queue, and admins can monitor and repair workflows.

## Current state

Inbox shows all instances regardless of user; approve/reject report success even when the API call fails (WF-013 / GAP-109); sort by Newest/Deadline are no-ops.

## Acceptance criteria

- [ ] AC1: Inbox lists only the current user's (and their groups') items; delegate, step back, comment.
- [ ] AC2: Approve/reject show success only after the API confirms; failures are visible and the item stays.
- [ ] AC3: All sort and filter controls work.
- [ ] AC4: Admin console: running/completed/failed instances with terminate, retry, reassign.
- [ ] AC5: Follows `workflow_inbox` design; Playwright E2E coverage including the API-failure case.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-51-TC01 | AC1 | ui | _Draft:_ Inbox lists only the current user's (and their groups') items; delegate, step back, comment. | — |
| ECMS-51-TC02 | AC2 | ui | _Draft:_ Approve/reject show success only after the API confirms; failures are visible and the item stays. | — |
| ECMS-51-TC03 | AC3 | ui | _Draft:_ All sort and filter controls work. | — |
| ECMS-51-TC04 | AC4 | ui | _Draft:_ Admin console: running/completed/failed instances with terminate, retry, reassign. | — |
| ECMS-51-TC05 | AC5 | e2e | _Draft:_ Follows `workflow_inbox` design; Playwright E2E coverage including the API-failure case. | — |

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/admin/src/app/(admin)/workflows/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/workflow_inbox/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-51/task.md`). |
