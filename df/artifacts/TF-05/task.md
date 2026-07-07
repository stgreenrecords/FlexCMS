# TF-05 - Workflow / replication / cache / CDN / search live coverage

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: backend-dev
- Legacy station: backlog

## Dependencies
- TF-01

## Modules / scope
- `apps/admin-e2e`
- `flexcms-author`
- `flexcms-replication`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- WF-* automated: full standard-publish flow (submit/approve/reject/publish/cancel) with real status transitions
- REP-* automated: publish on Author (8080) appears on Publish (8081); replication log asserted
- CACHE-*/ES-* automated: cache invalidation on publish; content searchable after publish
- Requires both Author + Publish running in the test stack
- 0 failures; evidence under docs/retest-runs/TF-05/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
