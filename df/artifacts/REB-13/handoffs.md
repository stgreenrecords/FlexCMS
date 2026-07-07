# REB-13 Handoffs

## 2026-07-07 local - devops -> devops (continuation)

- State: `DEV_IN_PROGRESS`
- What was done:
  - Started REB-13 Selenium admin automation implementation.
  - Added new admin round-trip suite and supporting page/API helpers.
  - Added package script `test:admin` and README command docs.
- Evidence:
  - `frontend/apps/selenium-e2e/src/cases/admin/authoring-roundtrip.spec.ts`
  - `frontend/apps/selenium-e2e/src/pages/EditorPage.ts`
  - `frontend/apps/selenium-e2e/src/pages/AuthorApiClient.ts`
  - `frontend/apps/selenium-e2e/package.json`
  - `frontend/apps/selenium-e2e/README.md`
  - `df/artifacts/REB-13/devops/summary.md`
- Checks:
  - `cd frontend/apps/selenium-e2e && pnpm test:admin`
  - Previous outcome: `3 passing`, `0 failing`, `0 pending`
  - Current outcome after strict assertions: `2 passing`, `2 failing`
  - Failure: `Cancel inheritance failed: Could not persist editable override (500).`
  - Outcome after backend fix + restart: `4 passing`, `0 failing`
  - `cd frontend/apps/selenium-e2e && pnpm build && pnpm exec mocha --grep "REB-13 admin authoring and round-trip suite" --reporter mocha-junit-reporter --reporter-options mochaFile=./reports/junit/reb13-admin-suite.xml`
  - Outcome: PASS, JUnit report `frontend/apps/selenium-e2e/reports/junit/reb13-admin-suite.xml`
  - `cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS && tail -n 220 .dev-logs/author.log`
  - Outcome: backend `ConstraintViolationException` on `content_node_versions_node_id_version_number_key` during update-properties persistence.
- Next role/action:
  1. Keep strict authoring button presence/navigation and cancel-inheritance failure checks enabled as regression guard.
  2. Re-run backend unit tests on supported JDK (project Java 21) because local Java 26 fails Mockito/ByteBuddy instrumentation.
  3. Continue REB-13 evidence gathering for READY_FOR_QA transition.
- Risks/blockers:
  - Local `ContentNodeServiceTest` execution is blocked by Java 26 runtime compatibility with Mockito/ByteBuddy, not by business logic correctness.


