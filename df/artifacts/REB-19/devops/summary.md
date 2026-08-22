# REB-19 — DevOps delivery summary

- Task: `REB-19` — Implement page editor component/property/asset authoring matrix Selenium suite
- Role/lane: `devops`
- State: `DEV_IN_PROGRESS` → `DONE`
- Session: 2026-08-19, Mode B (interactive; router not started)

## Result

The contract-driven page editor authoring matrix is implemented, wired into the
CI gate, and green. The suite establishes the field-type-aware framework REB-26
reuses, and it surfaced seven pre-existing implementation blockers with exact
file/symbol references (`blockers.md`).

```
REB-19 page editor authoring matrix suite
  ✔ S1 renders contract-driven authoring controls for a representative component in every group
  ✔ S2 round-trips a text field through UI, author API, headless JSON, and rendered output
  ✔ S3 round-trips an asset reference and verifies the rendered image resolves
  ✔ S4 clears an optional field and verifies the component still renders without console errors
  ✔ S5 authors long content and verifies the editor and rendered page do not truncate it
  ✔ S6 enforces template component constraints in the palette
  - S7 reorders components and verifies the persisted child order      (blocked: B-3)
  - S8 applies undo/redo to a property edit and persists the final state (blocked: B-4)
  ✔ S9 opens preview for the authored page and documents unsaved vs saved behaviour
  ✔ S10 publishes an edited page and verifies the change on the publish environment

  8 passing, 2 pending, 0 failing
```

## Files changed

### New

| File | Purpose |
|---|---|
| `frontend/apps/selenium-e2e/src/fixtures/component-contracts.ts` | Contract-driven authoring model: loads the 406 generated contracts, mirrors the editor's schema→control mapping, classifies field semantics (`scalar`/`richtext`/`asset`/`reference`/`list`/`object`), derives `data-testid`s, generates traceable sample values, and picks deterministic group representatives. **This is the REB-26 reuse surface.** |
| `frontend/apps/selenium-e2e/src/fixtures/site-assets.ts` | Resolves real imported assets from the REB-07 pipeline so the asset scenario references an asset that actually exists. |
| `frontend/apps/selenium-e2e/src/pages/EditorAuthoringPage.ts` | Field-type-aware editor page object: address a property by contract key, read/write per control type, probe palette and canvas capabilities, collect console errors and broken images. |
| `frontend/apps/selenium-e2e/src/reports/matrix.ts` | Writes `matrix-coverage.csv` from the run itself. |
| `frontend/apps/selenium-e2e/src/cases/admin/editor-authoring-matrix.spec.ts` | The REB-19 suite (10 scenarios). |
| `frontend/apps/selenium-e2e/src/reports/hooks.ts` | Recreated — was missing from version control, see `repo-defects.md` DEFECT-1. |
| `scripts/publish_tut_usa_site.py` | Publishes the seeded site to the publish environment and verifies it, polling for asynchronous replication. |

### Modified

| File | Change |
|---|---|
| `frontend/apps/selenium-e2e/src/pages/AuthorApiClient.ts` | Added `updateNodeProperties`, `getTemplate`, `getComponentRegistry` plus their response types. |
| `frontend/apps/selenium-e2e/src/fixtures/index.ts` | Re-exports the new fixture modules. |
| `frontend/apps/selenium-e2e/package.json` | Added `test:reb19` / `test:reb19:ci`; `test:full:ci` now includes REB-19. |
| `frontend/apps/selenium-e2e/scripts/selenium-gate.cjs` | REB-19 added to the `full` gate; single `MODE_SCRIPTS` source of truth; **fixed a Windows portability defect** (see below). |
| `frontend/apps/selenium-e2e/config/traceability-priority.json` | REB-19 registered as a `critical` traceability row against `reb19-suite.xml`. |
| `frontend/apps/selenium-e2e/.gitignore` | Ignore patterns anchored to the package root, see `repo-defects.md` DEFECT-1. |

## Gate defect fixed while wiring REB-19 in

`selenium-gate.cjs` used `cp.spawnSync('pnpm', [...])` with no shell. On Windows
this cannot work: the extensionless name fails with `ENOENT`, and naming
`pnpm.cmd` fails with `EINVAL` because modern Node refuses to spawn batch files
unshelled. Both gate modes aborted before any suite started, reporting only
`Script failed: test:smoke:ci (exit unknown)`.

Fixed by running the command through a shell — safe because the command string is
built solely from the whitelisted script names in `MODE_SCRIPTS`, which
`runScript` now validates against — and by surfacing `result.error` and the log
path in the thrown message so the next failure is diagnosable at a glance.

## Acceptance criteria

| AC | Evidence |
|---|---|
| AC1 — uses generated contracts, not hardcoded coverage | Every component, field, control type, and test id derives from `component-contracts.json` via `component-contracts.ts`. No component name appears in the spec. |
| AC2 — media-heavy component verifies asset selection/reference through author API and rendered output | S3: asset reference verified through author API, headless JSON, and a rendered `<img>` proven non-broken (`naturalWidth > 0`). Asset *selection* is impossible today — blocker B-2. |
| AC3 — every successful edit verifies UI, author API, headless JSON, rendered output | S2/S3/S5 assert all four layers; `verifiedLayers` per row in `matrix-coverage.csv`. |
| AC4 — every publish path verifies the change on the publish environment | S10 verifies the marker on `:8081`. The editor's own publish button does not replicate — recorded as blocker B-5. |
| AC5 — missing editor capabilities documented as blockers with exact file/symbol references | `blockers.md` B-1…B-7, each observed at runtime with file and symbol. |
| AC6 — evidence recorded with commands, JUnit, screenshots, matrix rows | This file, `test-scenarios.md`, `matrix-coverage.csv` (79 rows), JUnit `reb19-suite.xml`, retained artifacts under `frontend/apps/selenium-e2e/reports/retained/{smoke,full}`. |
| AC7 — handoff documents how REB-26 enumerates all components and reuses the helpers | `handoffs.md`. |

## Validation evidence

All commands run from the repository working tree on 2026-08-19 against the local
stack (author `:8080`, publish `:8081`, admin `:3000`, site `:3001`, infra via
`infra/local/docker-compose.dev.yml`).

| # | Command | Result |
|---|---|---|
| 1 | `cd flexcms && mvn clean install -DskipTests -B` | **BUILD SUCCESS** (1:23) |
| 2 | `cd flexcms && mvn test -B` | **BUILD SUCCESS** — 495 tests, 0 failures, 0 errors, 0 skipped (45.5 s) |
| 3 | `cd frontend && pnpm install && pnpm build` | **9/9 tasks successful** (23.1 s) |
| 4 | `pnpm --filter @flexcms/selenium-e2e test:reb19` | **8 passing, 2 pending, 0 failing** |
| 5 | `pnpm --filter @flexcms/selenium-e2e ci:gate:smoke` | **PASS** |
| 6 | `pnpm --filter @flexcms/selenium-e2e ci:gate:full` | **PASS** |
| 7 | `python scripts/publish_tut_usa_site.py` | 72/72 pages published and verified on `:8081` |

JUnit totals after the full gate:

```
reb12-template-results.xml       tests= 22 failures= 0
reb13-admin-suite.xml            tests=  4 failures= 0
reb18-suite.xml                  tests=  2 failures= 0
reb19-suite.xml                  tests= 10 failures= 0
selenium-smoke-results.xml       tests= 10 failures= 0
```

**Skipped check:** the Docker image build (pre-push step 5) was not run because no
backend source changed in this task — the only backend interaction is via existing
REST endpoints. Backend compile, test, and runtime were all exercised.

## Fixture cleanup caveat

The suite's `after` hook deletes its fixture page, but `DELETE /api/author/content/node`
returns HTTP 500 for **every** node (blocker B-7: `ContentNodeRepository.deleteSubtree`
is a native `DELETE @Query` with no `@Modifying`). The hook therefore verifies the
deletion and prints a loud `FIXTURE LEAK` diagnostic naming B-7 rather than
swallowing the error. Leaked REB-19 fixture nodes from this session were removed
directly from `flexcms_author` and `flexcms_publish`; the pre-existing
`content.tut-usa.reb18-e2e-*` pages from the REB-18 suite were left as found and
are cited as evidence of B-7's impact.

## Environment note

This session started on a workstation with no toolchain at all (no Maven, no
pnpm, empty Docker, no `node_modules`). Provisioning is documented in
`environment-provisioning.md`, and the two repository defects it exposed in
`repo-defects.md`. A hint covering all of it was added to `hints_for_agent.md`.
