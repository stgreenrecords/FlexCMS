# RT-02 - Page-edit round-trip — author edits dummy data in editor, it persists, headless reflects it, site renders it

## Summary

- Priority: P0
- Current state: READY_FOR_QA
- Owner role: qa
- Legacy station: ready

## Dependencies
- RT-00

## Modules / scope
- `apps/admin-e2e`
- `apps/admin`

## Read first
- `docs/RETEST_PLAN.md`
- `scripts/live_smoke.py`
- `frontend/apps/admin/src/app/editor/page.tsx`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- SMOKE: python3 scripts/live_smoke.py --page content/tut-usa/home passes the page-edit round-trip check (edit persists and reverts)
- FIELD TYPES: for a page with mixed components, edit and SAVE every schema-driven field type — text, textarea/rich-text, enum/select, boolean/toggle, number (UI-024→028) — and confirm each new value persists
- PERSISTENCE: after save, GET /api/author/content/node?path=... shows the edited value in properties JSONB, AND GET /api/content/v1/pages/... returns the same edited value (not the mock {"success":true})
- RENDER: reload the demo site page and confirm the edited dummy data actually appears in the rendered markup
- STRUCTURE EDITS: add a component from the palette, reorder two components (drag), and delete a component (UI-032/033/034) — each change persists across reload
- PUBLISH: Publish from the editor (UI-031) sets status PUBLISHED via the real API
- LOCKED CASES (negative): template-embedded components and XF Navigation/Footer slots CANNOT be edited/moved/deleted from the canvas
- ALL of the above run with mocks OFF (USE_LIVE_API) against the seeded backend — a stopped backend must make the journey FAIL
- If any edit path is broken, file BUG-xx in 'ready' with the failing transcript and fix the CODE (not the test)
- Playwright trace + API transcripts (before/after) saved under docs/retest-runs/RT-02/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
