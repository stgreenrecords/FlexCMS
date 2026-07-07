# TF-09 - Traceability matrix + coverage gate (QA case ID -> test; fail CI on uncovered Critical/High)

## Summary

- Priority: P2
- Current state: OPEN
- Owner role: devops
- Legacy station: backlog

## Dependencies
- TF-08

## Modules / scope
- `apps/admin-e2e`
- `scripts`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- A generated matrix maps every QA_TEST_PLAN case ID to the automated test(s) tagged with it
- A coverage script fails CI if any Critical or High case has no linked passing test
- Report shows overall coverage %; target = 100% Critical+High automated
- Matrix published as a CI artifact and committed to docs/retest-runs/TF-09/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
