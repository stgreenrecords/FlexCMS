# REB-24 — Implement admin sites/translations/component-registry authoring-smoke Selenium suite

## Summary

- Priority: P2
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Implement Selenium smoke and API-backed coverage for secondary admin authoring/read-only surfaces: sites, translations, component registry, dashboard navigation, and route-level health. Expand to mutation coverage only where backend/UI support exists.

## Read first

- `df/artifacts/REB-17/task.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `frontend/apps/admin/src/app/(admin)/sites/page.tsx`
- `frontend/apps/admin/src/app/(admin)/translations/page.tsx`
- `frontend/apps/admin/src/app/(admin)/components/page.tsx`
- `frontend/apps/admin/src/app/(admin)/dashboard/page.tsx`
- `frontend/apps/admin/src/app/page.tsx`

## Dependencies

- REB-13

## Functional scope

- Admin shell navigation to secondary routes.
- Sites overview/list behavior.
- Translation manager filters/status/pagination and any available edit actions.
- Component registry browsing/search/details and contract/schema verification.
- Dashboard link integrity.
- Route loading/empty/error states.

## Required E2E scenarios

1. **Admin navigation smoke**: visit dashboard, sites, content, DAM, workflows, experience fragments, PIM, components, translations; verify each route renders expected heading and no fatal error.
2. **Sites route**: verify site cards/list/statistics render from current data or expected static model; if APIs are absent, classify as static/read-only and document.
3. **Translations route**: verify status filters (`Translated`, `Outdated`, `Missing`), search, pagination, and missing/outdated indicators; mutation/edit only if a backed endpoint exists.
4. **Component registry route**: verify component definitions/contracts load, resource types are searchable, required fields/schema metadata are visible, and generated contract count matches expectations where possible.
5. **Component authoring bridge**: choose one registry component and navigate/author it in the page editor if a bridge exists; otherwise document missing integration as blocker for later REB-19 coverage.
6. **Dashboard links**: verify primary dashboard cards/links route to correct admin pages.
7. **Error/empty states**: force no-results filters and verify empty state; capture behavior when backend endpoint returns unavailable if safe.
8. **Accessibility smoke**: headings, landmarks, focusable controls, keyboard tab order for the secondary routes.

## Acceptance criteria

- AC1: Suite distinguishes read-only/static UI from backed authoring functionality with evidence.
- AC2: Component registry coverage validates generated contract visibility and supports REB-19 matrix authoring.
- AC3: Translation/site routes are covered by smoke and filter/search tests even if mutation APIs are not implemented.
- AC4: Evidence is recorded in `df/artifacts/REB-24/devops/summary.md`.

