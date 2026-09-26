# ECMS-12 — Rich text editor with policy-driven formatting

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-19](ECMS-19.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors format text in a real rich text editor, limited to what brand rules allow for that component.

## Current state

No RTE library in the admin app — rich text fields are textareas. Server-side `RichTextSanitizer` exists.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for RTE toolbar and dialogs (links, tables, special characters).
- [ ] AC2: Frontend: RTE for `rich-text` fields with headings, lists, links (internal page picker + external), tables, inline images from DAM.
- [ ] AC3: Enabled features come from the component's policy (ECMS-19); disallowed formatting is unavailable and stripped on paste.
- [ ] AC4: Paste from Word/Google Docs is cleaned to allowed markup.
- [ ] AC5: Output remains safe after `RichTextSanitizer`; Playwright E2E covers each formatting feature and paste filtering.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-12-TC01 | AC2 | ui | _Draft:_ Frontend: RTE for `rich-text` fields with headings, lists, links (internal page picker + external), tables, inline images from DAM. | — |
| ECMS-12-TC02 | AC3 | ui | _Draft:_ Enabled features come from the component's policy (ECMS-19); disallowed formatting is unavailable and stripped on paste. | — |
| ECMS-12-TC03 | AC4 | ui | _Draft:_ Paste from Word/Google Docs is cleaned to allowed markup. | — |
| ECMS-12-TC04 | AC5 | e2e | _Draft:_ Output remains safe after `RichTextSanitizer`; Playwright E2E covers each formatting feature and paste filtering. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/util/RichTextSanitizer.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-12/task.md`). |
