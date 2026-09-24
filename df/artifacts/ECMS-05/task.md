# ECMS-05 — Content Tree page operations wired end to end

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `frontend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Make the Content Tree a working page console: every page operation an author needs, from the UI.

## Current state in FlexCMS

+ Create New Page, row Publish/Duplicate/Move/Delete, and Publish All are inert (test doc GAP-030/031). Lock state and scheduling have no UI.

## Acceptance criteria

- [ ] AC1: Create page dialog: parent, name, title, template (from `/api/author/content/templates`); creates via API and appears in the tree.
- [ ] AC2: Row and multi-select actions: copy, move (target picker), rename, delete (with confirmation), lock/unlock, publish, unpublish, publish later / unpublish later (date-time).
- [ ] AC3: Every destructive action asks for confirmation; every API failure shows a visible error — no optimistic success.
- [ ] AC4: Lock state is shown on rows and in the editor header; a page locked by another user is read-only in the editor.
- [ ] AC5: Uses `@flexcms/ui` components and tokens; loading and empty states present; follows `Design/UI/.../content_tree_*`.
- [ ] AC6: Selenium scenarios for each action, verifying the backend result, not just the UI.
- [ ] AC7: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-05/frontend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `frontend-dev`. Use `@flexcms/ui` components and `var(--color-*)` tokens; every page needs breadcrumb, empty state, and loading skeleton (`CLAUDE.md`).

## Out of scope

- References warning on delete (added when ECMS-02 lands).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-04

## Read first

- `frontend/apps/admin/src/app/(admin)/content/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/content_tree_list_view/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
