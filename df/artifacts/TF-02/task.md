# TF-02 - L3 UI POM buildout — Page Objects + live specs for all 18 admin screens

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: frontend-dev
- Legacy station: backlog

## Dependencies
- TF-00

## Modules / scope
- `apps/admin-e2e`
- `apps/admin`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/QA_TEST_PLAN.md`
- `frontend/apps/admin/src/app`

## Acceptance criteria
- A Page Object class per admin screen: dashboard, content tree, editor, DAM browser+detail, PIM catalog/product/import/schema, sites, workflows, preview, components, XF, translations, login
- Live specs (mocks OFF) covering UI-001→105 with real backend; each tagged @UI-xxx
- Every 'No mock data' case (UI-019/051/061/068/086/095) verified via real network calls
- data-testid added to any element a POM needs but that lacks one
- 0 failures on green stack; traces saved for edge cases under docs/retest-runs/TF-02/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
