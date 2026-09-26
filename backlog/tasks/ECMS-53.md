# ECMS-53 — User, group, and permissions management UI

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-52](ECMS-52.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Isolate brand or country teams to their own subtree without API calls.

## Current state

Path ACLs are API-only; no user/group UI.

## Acceptance criteria

- [ ] AC1: Users and groups screens per `user_management` design.
- [ ] AC2: Permissions console: per-path ACL editor (allow/deny READ/WRITE/DELETE/PUBLISH/MANAGE_ACL), inherited entries shown, effective permissions for a chosen user.
- [ ] AC3: Playwright E2E coverage (enforcement verified in a Keycloak-enabled profile).

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-53-TC01 | AC1 | ui | _Draft:_ Users and groups screens per `user_management` design. | — |
| ECMS-53-TC02 | AC2 | ui | _Draft:_ Permissions console: per-path ACL editor (allow/deny READ/WRITE/DELETE/PUBLISH/MANAGE_ACL), inherited entries shown, effective permissions for a chosen user. | — |
| ECMS-53-TC03 | AC3 | e2e | _Draft:_ Playwright E2E coverage (enforcement verified in a Keycloak-enabled profile). | — |

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/user_management/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-53/task.md`). |
