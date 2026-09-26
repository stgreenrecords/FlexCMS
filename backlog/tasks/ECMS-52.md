# ECMS-52 — Users, groups, and role management API

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Admins manage who can do what from inside the product.

## Current state

Identity is delegated entirely to Keycloak JWT roles; there is no in-product user or group management.

## Acceptance criteria

- [ ] AC1: Technical design: proxy Keycloak's admin API vs. a local group model mapped to Keycloak identities; records the decision.
- [ ] AC2: List/search users, manage groups and group membership, map groups to roles.
- [ ] AC3: Groups usable as ACL principals and workflow participants.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-52-TC01 | AC2 | api | _Draft:_ List/search users, manage groups and group membership, map groups to roles. | — |
| ECMS-52-TC02 | AC3 | api | _Draft:_ Groups usable as ACL principals and workflow participants. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-52.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-app/src/main/java/com/flexcms/app/config/SecurityConfig.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/NodeAclController.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-52/task.md`). |
