# ECMS-12 — Rich text editor with policy-driven formatting

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors format text in a real rich text editor, limited to what brand rules allow for that component.

## Current state in FlexCMS

No RTE library in the admin app — rich text fields are textareas. Server-side `RichTextSanitizer` exists.

## Acceptance criteria

- [ ] AC1: Design package for RTE toolbar and dialogs (links, tables, special characters).
- [ ] AC2: Frontend: RTE for `rich-text` fields with headings, lists, links (internal page picker + external), tables, inline images from DAM.
- [ ] AC3: Enabled features come from the component's policy (ECMS-19); disallowed formatting is unavailable and stripped on paste.
- [ ] AC4: Paste from Word/Google Docs is cleaned to allowed markup.
- [ ] AC5: Output remains safe after `RichTextSanitizer`; Selenium covers each formatting feature and paste filtering.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-19

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/util/RichTextSanitizer.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
