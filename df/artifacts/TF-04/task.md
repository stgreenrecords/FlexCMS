# TF-04 - DAM + PIM full functional coverage (API + UI, live)

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: backend-dev
- Legacy station: backlog

## Dependencies
- TF-02

## Modules / scope
- `apps/admin-e2e`
- `flexcms-dam`
- `flexcms-pim`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- DAM-* automated: upload (jpeg/png/pdf), renditions generated, list/get/delete, negative cases — real MinIO
- PIM-* automated: schemas, catalogs, products CRUD, variants, carryforward, import (CSV/XLSX/JSON), search — real flexcms_pim DB
- UI-038→079 admin DAM + PIM journeys automated live
- Each test tagged @DAM-xxx / @PIM-xxx / @UI-xxx
- 0 failures; evidence under docs/retest-runs/TF-04/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
