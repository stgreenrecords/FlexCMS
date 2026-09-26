# FEAT-001 — Editor DAM asset picker for asset fields

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend (admin editor) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors pick images and other assets from the DAM when editing a component, instead of typing URLs.

## Current state

Component dialogs have no asset picker for `x-asset` fields. `AuthorableField.isLossyInEditor` marks asset fields so that tests do not author them through text inputs (open risk R-REB-19-002, part B-2).

## Acceptance criteria

- [ ] AC1: Every component field whose schema marks it as an asset opens a DAM picker. The picker supports browsing folders, searching, and selecting one asset.
- [ ] AC2: The selected asset is stored as the canonical asset reference (see DEC-ECMS-002), not as a URL copied from the author tier.
- [ ] AC3: The field shows a thumbnail preview, with actions to replace and clear.
- [ ] AC4: After saving and reloading the editor, the chosen asset is still shown, and the page renders it in preview.

## Test cases

> **Draft** — finalize during refinement.

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| FEAT-001-TC01 | AC1 | ui | Given a component with an asset field (mocked registry), when the user opens the field, then the picker lists DAM folders and assets | — |
| FEAT-001-TC02 | AC2 | e2e | Given a real uploaded asset, when the user picks it and saves, then the node's property via the Author API holds the canonical reference | — |
| FEAT-001-TC03 | AC3 | ui | Given a selected asset, then a thumbnail is shown and Clear empties the field | — |
| FEAT-001-TC04 | AC4 | e2e | Given the saved page, when it is previewed, then the image decodes (naturalWidth > 0) | — |

## Refinement needed

UI design is needed (no reference in `Design/UI/`). Define how asset fields are detected in `dataSchema`, and the stored value format.

## Read first

- `frontend/apps/admin/src/app/editor/page.tsx`
- `docs/architecture/DECISIONS.md` (DEC-ECMS-002)

## Log

| Date | Note |
|---|---|
| 2026-09-26 | Created. Migrated from the retired bug reports (`BUGS_AND_FINDINGS.md`, `docs/FLEXCMS_AUTHORING_TEST_RUN_2026-09-14.md`, `df/runtime/risks.md`; see git tag `archive/dark-factory`). Root cause re-checked against the code on 2026-09-26. |
