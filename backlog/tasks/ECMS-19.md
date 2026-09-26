# ECMS-19 — Content policies and component style variants

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-18](ECMS-18.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Brand and legal guardrails are enforced by reusable policies, and one component can offer several approved looks without new code.

## Current state

`ComponentDefinition.policies` is an unmanaged JSONB column; palette restriction is client-side only; there is no style-variant mechanism.

## Acceptance criteria

- [ ] AC1: Reusable policy entities: container policy (allowed components) and component policy (enabled RTE features, allowed image ratios, default values, feature toggles).
- [ ] AC2: Style groups on component policies, single-select or multi-select, mapping style names to CSS classes; defaults supported.
- [ ] AC3: Applied styles persist on the component node and are delivered in page JSON.
- [ ] AC4: Policies are shared between templates; changing one propagates to all users of it.
- [ ] AC5: Server-side enforcement of container policies (coordinated with ECMS-18).

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-19-TC01 | AC1 | api | _Draft:_ Reusable policy entities: container policy (allowed components) and component policy (enabled RTE features, allowed image ratios, default values, feature toggles). | — |
| ECMS-19-TC02 | AC2 | api | _Draft:_ Style groups on component policies, single-select or multi-select, mapping style names to CSS classes; defaults supported. | — |
| ECMS-19-TC03 | AC3 | api | _Draft:_ Applied styles persist on the component node and are delivered in page JSON. | — |
| ECMS-19-TC04 | AC4 | api | _Draft:_ Policies are shared between templates; changing one propagates to all users of it. | — |
| ECMS-19-TC05 | AC5 | api | _Draft:_ Server-side enforcement of container policies (coordinated with ECMS-18). | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-19.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- Editor style picker and renderer class application (ECMS-21).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ComponentDefinition.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-19/task.md`). |
