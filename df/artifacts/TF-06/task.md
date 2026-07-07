# TF-06 - Cross-cutting coverage — security, error handling, accessibility (axe), CORS/rate-limit, perf smoke

## Summary

- Priority: P2
- Current state: OPEN
- Owner role: qa
- Legacy station: backlog

## Dependencies
- TF-01
- TF-02

## Modules / scope
- `apps/admin-e2e`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- SEC-* / ERR-* / INJ-* automated: auth bypass (local), RFC7807 error bodies, SQL-injection/XSS/path-traversal negative cases
- A11Y-001→008 automated with @axe-core/playwright on all admin pages (0 critical/serious WCAG violations)
- CORS-* and RATE-* automated where applicable
- PERF smoke: key page render under threshold; assert no obvious N+1 via response timing
- Tagged @SEC/@ERR/@A11Y/@PERF; evidence under docs/retest-runs/TF-06/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
