# Handoff

- Task: `TUT-LINK-RENDERING`
- State: `BLOCKED`
- Role: `frontend-dev`
- Result: Implemented authored link normalization and rendering across the TUT renderer modules, added renderer unit coverage, and added full seeded-site anchor/route/fragment integrity coverage.
- Dependencies: `TUT-LINK-SEED` and `BUG-TUT-VEHICLE-RENDERER` are `DONE`.
- Evidence: `frontend/apps/site-nextjs/src/components/tutLink.ts`, changed TUT renderer modules, `frontend/apps/site-nextjs/src/components/__tests__/homepageRenderers.test.tsx`, `frontend/apps/site-nextjs/src/components/__tests__/tutVehiclesRenderers.test.tsx`, `frontend/apps/selenium-e2e/src/cases/templates/tut-usa-link-integrity.spec.ts`.
- Checks: Site package tests pass (`27/27`); full frontend build passes; Selenium smoke passes; focused full template run passes the new link-integrity case and reports `13 passing / 9 failing` overall.
- Full-gate blocker: `pnpm test:e2e:selenium:full` is blocked by nine existing `REB-12` `hasPrimaryCta` assertions on `TPL-01`, `TPL-05`, `TPL-07`, `TPL-13`–`TPL-17`, and `TPL-19`. The clean site server returns HTTP 200 with meaningful main content; the failures are CTA-discoverability baseline mismatches, not broken link resolution.
- Risks: Marking the task `DONE` would violate the mandatory zero-failure full-gate requirement. The remaining CTA assertions need a separate test/seed/template decision.
- Next action: Resolve or explicitly waive the nine `REB-12` CTA baseline failures, then rerun `pnpm test:e2e:selenium:full` before moving this task to `DONE`.

