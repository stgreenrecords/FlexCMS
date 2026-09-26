# ECMS-00 — Enterprise-level CMS parity: gap analysis and backlog

| Field | Value |
|---|---|
| Type | Task |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Compare FlexCMS's current functionality against the native feature set of an enterprise-level CMS (the core-features reference document in the repository root) and turn every gap into a routed, testable task.

## Acceptance criteria

- [x] AC1: Every capability area in the reference document is compared with FlexCMS, with evidence for the current state — `gap-analysis.md`.
- [x] AC2: Every gap maps to at least one task; every task has testable acceptance criteria, an owner role, and an explicit `## Dependencies` section — `backlog/tasks/ECMS-01.md` … `ECMS-66.md`.
- [x] AC3: Tasks are single-lane, or routed to `sa` (`NEEDS_ARCHITECTURE`) for design and splitting; visible UI work without an approved design goes to `designer` first.
- [x] AC4: All tasks are registered on the board (now `backlog/BOARD.md`).
- [x] AC5: Capabilities where FlexCMS already exceeds the baseline, and deliberate exclusions, are recorded so no task regresses them.

## Test cases

Delivered before the Playwright test-case standard; no test-case table was recorded. Regression coverage for this capability is tracked by the Selenium→Playwright port tasks on the board.

## Out of scope

- Implementing any of the gaps (child tasks carry delivery).
- Third-party integrations and AI-dependent features (see `gap-analysis.md`).

## Assumptions

- Native platform capabilities only.
- Priorities are an SA proposal based on the reference document's business-function tables and unblock count; a human may reprioritise.

## Evidence

- `docs/product/ECMS_GAP_ANALYSIS.md`
- Live stack probe 2026-09-24 (component registry, templates, sites, DAM, PIM), code search across `flexcms/` and `frontend/`, `docs/testing/MANUAL_TEST_CASES_AUTHORING.md` §20.

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Gap analysis across 15 capability areas. |
| 2026-09-24 | 66 child tasks created and registered; docs-only SA work validated. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-00/task.md`). |
