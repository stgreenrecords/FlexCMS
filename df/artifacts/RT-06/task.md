# RT-06 - Workflow + replication + cache/CDN live retest (publish pipeline)

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: qa
- Legacy station: backlog

## Dependencies
- none

## Modules / scope
- `flexcms-author`
- `flexcms-replication`
- `flexcms-cache`

## Read first
- `docs/RETEST_PLAN.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- WF-*, REP-*, CACHE-* Critical cases executed LIVE with both Author (8080) and Publish (8081) running
- Prove a page published on Author appears on Publish and is cache-invalidated (RabbitMQ message + Publish GET evidence)
- 0 Critical failures; failures filed as BUG-xx; evidence under docs/retest-runs/RT-06/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
