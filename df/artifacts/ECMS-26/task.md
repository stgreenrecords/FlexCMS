# ECMS-26 — Translations page wired to the dictionary API

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `frontend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Localisation managers manage UI strings in the Translations page.

## Current state in FlexCMS

The page issues no requests and is permanently empty (test doc GAP-020).

## Acceptance criteria

- [ ] AC1: Grid loads keys × locales from the API; status chips (translated/missing/outdated) are computed from data.
- [ ] AC2: Inline edit, add key, import, and export XLIFF work against the API.
- [ ] AC3: Translation Health panel shows real completion.
- [ ] AC4: Follows `translation_manager` design; Selenium coverage.
- [ ] AC5: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-26/frontend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `frontend-dev`. Use `@flexcms/ui` components and `var(--color-*)` tokens; every page needs breadcrumb, empty state, and loading skeleton (`CLAUDE.md`).

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-25

## Read first

- `frontend/apps/admin/src/app/(admin)/translations/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/translation_manager/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
