# ECMS-65 — Package manager UI

## Summary

- Priority: P3
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Move content between environments without API calls.

## Current state in FlexCMS

Content export/import exists as API only (IEX-013).

## Acceptance criteria

- [ ] AC1: Design package for package build/upload/install.
- [ ] AC2: Build a package from a path (JSON/ZIP), download it, upload and install with overwrite option, show created/updated/skipped/errors.
- [ ] AC3: Selenium: export, delete, import, verify restored.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/ContentImportExportController.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
