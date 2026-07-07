# TF-01 - L2 API functional suite — CMS / Author CRUD / Headless REST / GraphQL (live, tagged by QA case ID)

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: backend-dev
- Legacy station: backlog

## Dependencies
- TF-00

## Modules / scope
- `apps/admin-e2e`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- Automated API tests for every Critical+High case: CMS-*, AUTH-*, HEAD-*, GQL-* — run live against seeded backend
- Each test tagged with its QA case ID (e.g. @AUTH-001) for traceability
- State-changing tests arrange + clean their own qa-test-* data (idempotent)
- Negative cases covered (404/400/409, invalid status, XSS sanitization) with real error-body assertions
- 0 failures on green stack; suite runs in CI via the stack-up job
- Evidence under docs/retest-runs/TF-01/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
