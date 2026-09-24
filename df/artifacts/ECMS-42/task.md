# ECMS-42 — Asset Detail page wired end to end

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `frontend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors can inspect and manage an asset on its detail page.

## Current state in FlexCMS

Save/Discard are inert, the preview is a placeholder gradient, renditions and usage panels are always empty, and Delete Asset in the rail is inert (test doc GAP-022/024/025/026).

## Acceptance criteria

- [ ] AC1: Real image/video/PDF preview.
- [ ] AC2: Metadata form saves via ECMS-41 and survives reload; Discard reverts.
- [ ] AC3: Renditions panel lists real renditions with download.
- [ ] AC4: Usage panel lists references (ECMS-02).
- [ ] AC5: Move, rename, and delete from the page, with confirmation and visible errors.
- [ ] AC6: Follows `asset_detail` design; Selenium coverage.
- [ ] AC7: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-42/frontend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `frontend-dev`. Use `@flexcms/ui` components and `var(--color-*)` tokens; every page needs breadcrumb, empty state, and loading skeleton (`CLAUDE.md`).

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-41
- ECMS-02

## Read first

- `frontend/apps/admin/src/app/(admin)/dam/[id]/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/asset_detail/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
