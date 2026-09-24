# ECMS-13 — Editor productivity: inline text editing and copy/cut/paste

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `frontend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Speed up page building with inline text editing and component clipboard operations.

## Current state in FlexCMS

Text can only be edited in the properties panel; components cannot be copied or moved between containers except by drag.

## Acceptance criteria

- [ ] AC1: Double-click a text-like component to edit inline on the canvas; Enter/Escape/blur commit or cancel.
- [ ] AC2: Copy, cut, and paste components (keyboard shortcuts + chip menu), including into another container and another page in the same session.
- [ ] AC3: Paste respects container policies (rejected with a message when not allowed).
- [ ] AC4: All operations participate in undo/redo and persist on save.
- [ ] AC5: Follows `visual_page_editor` design; Selenium coverage for each operation.
- [ ] AC6: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-13/frontend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `frontend-dev`. Use `@flexcms/ui` components and `var(--color-*)` tokens; every page needs breadcrumb, empty state, and loading skeleton (`CLAUDE.md`).

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `frontend/apps/admin/src/app/editor/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/visual_page_editor_refined/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
