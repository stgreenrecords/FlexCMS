# TEST-001 — Live Playwright foundation: data factories, cleanup, and a CI job for the live suite

| Field | Value |
|---|---|
| Type | Test |
| Priority | P1 |
| Area | Test infrastructure |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Porting and new live tests can create and clean up realistic data in one line, and the live suite runs in CI and not only on a developer machine.

## Current state

`frontend/apps/e2e` has the `api`/`e2e`/`ui-live` projects, the `authorApi`/`publishApi` fixtures, and `uniqueName()`, but no factories for pages, assets, sites or fragments, and no CI job that starts the stack.

## Acceptance criteria

- [ ] AC1: `src/factories/` provides typed helpers to create and delete a page (with components), a DAM asset (upload a fixture file), an experience fragment, and a PIM product. Each is registered for automatic cleanup through a fixture, so it is deleted even when the test fails.
- [ ] AC2: A `publish` helper publishes a node and waits, with `expect.poll`, until the Publish API serves it.
- [ ] AC3: Optionally, the publish-backed site (`:3005`) can be started by Playwright's `webServer` when `PUBLISH_SITE=true`.
- [ ] AC4: A GitHub Actions workflow starts the stack (docker compose infra + author + publish + admin + site) and runs `pnpm test:e2e:live`, uploading the HTML report, traces and JUnit XML.
- [ ] AC5: `docs/process/TESTING.md` §5-§6 documents the factories and the CI job.

## Test cases

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| TEST-001-TC01 | AC1 | api | Each factory creates its entity, the entity is readable via the API, and after the test it no longer exists (verified in a follow-up test via the API) | — |
| TEST-001-TC02 | AC2 | api | publish() on a new page resolves only once GET on publish returns 200 | — |
| TEST-001-TC03 | AC4 | e2e | The CI workflow run is green with the smoke specs, and the report artifact is uploaded | — |

## Read first

- `frontend/apps/e2e/src/fixtures/api.fixture.ts`
- `frontend/apps/selenium-e2e/src/fixtures/`
- `.github/workflows/e2e.yml`
- `flexcms/docker-compose.yml`

## Log

| Date | Note |
|---|---|
| 2026-09-26 | Created when Playwright became the only test framework (Selenium frozen). |
