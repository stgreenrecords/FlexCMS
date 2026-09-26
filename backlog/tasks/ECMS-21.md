# ECMS-21 — Style picker in the editor and style classes in renderers

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-19](ECMS-19.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors change a component's look in seconds from approved style options.

## Current state

No style mechanism exists.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a style picker on the component chip.
- [ ] AC2: Editor offers only the styles the component policy allows, honouring single/multi-select groups.
- [ ] AC3: Site renderers (React and Vue) add the mapped classes to the component wrapper; preview updates live.
- [ ] AC4: Playwright E2E: apply a style, publish, assert the class on the public page.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-21-TC01 | AC2 | ui | _Draft:_ Editor offers only the styles the component policy allows, honouring single/multi-select groups. | — |
| ECMS-21-TC02 | AC3 | ui | _Draft:_ Site renderers (React and Vue) add the mapped classes to the component wrapper; preview updates live. | — |
| ECMS-21-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: apply a style, publish, assert the class on the public page. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/packages/site-renderers/`
- `frontend/packages/react/`
- `frontend/packages/vue/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-21/task.md`). |
