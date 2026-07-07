## 2026-07-07 local - qa - REB-01

- State: QA_IN_PROGRESS -> READY_FOR_PO
- Action: Verified REB-01 design-normalization artifacts against AC1-AC5, recorded QA evidence, and found no blocking defects.
- Evidence: `df/artifacts/REB-01/qa-report.md`, `df/artifacts/REB-01/handoffs.md`, `Design/tut-usa/README.md`, `df/artifacts/REB-01/design/inventory.md`, `df/artifacts/REB-01/design/summary.md`; command output confirmed `template_dirs=21`, `component_dirs=14`.
- Result: PASS
- Next: `po` reviews REB-01 and accepts/rejects.
- Risks/blockers: `tut_sovereign` design evidence gap and remote asset/font licensing constraints remain open for downstream tasks.

## 2026-07-07 local - State change

- Task: REB-01
- From: READY_FOR_QA
- To: READY_FOR_PO
- Role: qa
- Reason: QA validated all acceptance criteria and recorded passing evidence in `qa-report.md`.
- Evidence: `df/artifacts/REB-01/qa-report.md`, `df/artifacts/REB-01/handoffs.md`, `df/runtime/board.md`
- Next: po acceptance review

## 2026-07-07 local - Policy change - factory-wide

- Task: N/A (process/orchestration change)
- Action: Recorded `DEC-REB-006` per explicit human request to re-enable automated `qa` and `po` sessions; removed the temporary override from orchestration rules and removed disable banners from QA/PO role definitions.
- Evidence: `df/runtime/decisions.md` (`DEC-REB-006`), `df/03-orchestration-rules.md`, `df/roles/qa.md`, `df/roles/po.md`, `df/runtime/board.md`
- Result: PASS
- Next: Run the next single-role session as `qa` for the highest-priority `READY_FOR_QA` task (`REB-01`) and continue normal QA -> PO flow.
- Risks/blockers: Backlog contains multiple queued `READY_FOR_QA` tasks; prioritize strictly by board order and business priority to avoid review thrash.

## 2026-07-07 local - sa - REB-26

- State: READY_FOR_DEV
- Action: Added exhaustive per-UI-component sample-site editing backlog in response to human follow-up. `REB-26` requires one generated Selenium editing scenario or explicit blocker/unsupported matrix row for every active component in `Design/tut-usa/generated/component-contracts.json`.
- Evidence: `df/artifacts/REB-26/task.md`, `df/artifacts/REB-17/task.md`, `df/artifacts/REB-19/task.md`, `df/artifacts/REB-25/task.md`, `df/artifacts/REB-17/handoffs.md`, `df/runtime/board.md`; inventory command reported `components=406`, `groups=14`, `asset_fields=91`, `rich_text_fields=25`, `reference_fields=30`.
- Result: PASS
- Next: DevOps implements `REB-26` after `REB-19` establishes reusable field-type editing helpers, or earlier only with explicit human dependency override.
- Risks/blockers: Exhaustive scope is large and should be sharded by component group while preserving a complete per-component evidence matrix; publish checks still require configured publish environment.

## 2026-07-07 local - sa - REB-17

- State: READY_FOR_QA
- Action: Mapped current authoring functionality and added a prioritized Selenium authoring E2E automation backlog (`REB-18` through `REB-25`) covering content/page creation, editor/component authoring, publishing/workflow/scheduling/bulk operations, DAM, experience fragments/live copy, PIM, secondary admin routes, and cross-cutting hardening.
- Evidence: `df/artifacts/REB-17/task.md`, `df/artifacts/REB-17/handoffs.md`, `df/artifacts/REB-18/task.md`, `df/artifacts/REB-19/task.md`, `df/artifacts/REB-20/task.md`, `df/artifacts/REB-21/task.md`, `df/artifacts/REB-22/task.md`, `df/artifacts/REB-23/task.md`, `df/artifacts/REB-24/task.md`, `df/artifacts/REB-25/task.md`, `df/runtime/board.md`.
- Result: PASS
- Next: Manual human QA reviews `REB-17` per `DEC-REB-005`; DevOps implements `REB-18`-`REB-25` when dependencies are satisfied or explicitly overridden by the human.
- Risks/blockers: Some admin UI actions may be partially wired; publish-environment checks require a running/configured publish service and must not fall back to author-only verification.

## 2026-07-07 local - devops - REB-13

- State: DEV_IN_PROGRESS
- Action: Fixed backend duplicate version-snapshot collision and revalidated strict Selenium authoring checks (button presence/navigation + cancel inheritance/edit/publish flows).
- Evidence: `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`, `flexcms/flexcms-core/src/test/java/com/flexcms/core/service/ContentNodeServiceTest.java`, `frontend/apps/selenium-e2e/src/pages/EditorPage.ts`, `frontend/apps/selenium-e2e/src/cases/admin/authoring-roundtrip.spec.ts`, `df/artifacts/REB-13/devops/summary.md`, `df/artifacts/REB-13/handoffs.md`; command `cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS && ./flex start local all` -> backend rebuild/restart PASS; command `cd frontend/apps/selenium-e2e && pnpm test:admin` -> `4 passing`, `0 failing`.
- Result: PASS
- Next: Continue REB-13 toward READY_FOR_QA, and rerun core unit tests on supported JDK (Java 21) due local Java 26 Mockito/ByteBuddy limits.
- Risks/blockers: Local `ContentNodeServiceTest` run fails in this shell because Mockito inline instrumentation does not support Java 26.

## 2026-07-07 local - devops - REB-13

- State: DEV_IN_PROGRESS
- Action: Tightened Selenium admin suite to assert authoring button presence/navigation and fail on cancel-inheritance error messages; reproduced user-reported cancel-inheritance/edit defect.
- Evidence: `frontend/apps/selenium-e2e/src/cases/admin/authoring-roundtrip.spec.ts`, `frontend/apps/selenium-e2e/src/pages/EditorPage.ts`, `df/artifacts/REB-13/devops/summary.md`, `df/artifacts/REB-13/handoffs.md`; command `cd frontend/apps/selenium-e2e && pnpm test:admin` -> `2 passing`, `2 failing` with `Could not persist editable override (500)`; command `cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS && tail -n 220 .dev-logs/author.log` shows `ConstraintViolationException` on `content_node_versions_node_id_version_number_key`.
- Result: FAIL
- Next: Backend/devops fix for duplicate content-node version inserts, then rerun strict admin suite.
- Risks/blockers: Authoring cancel-inheritance/edit flows are currently blocked by backend 500s.

## 2026-07-07 local - devops - REB-12

- State: DEV_IN_PROGRESS
- Action: Started REB-12 by implementing a Selenium public-site suite for home and remaining discovered TUT-USA pages, plus reusable discovery/site helpers and a dedicated test command.
- Evidence: `frontend/apps/selenium-e2e/src/cases/templates/tut-usa-pages.spec.ts`, `frontend/apps/selenium-e2e/src/pages/SitePage.ts`, `frontend/apps/selenium-e2e/src/pages/AuthorApiClient.ts`, `frontend/apps/selenium-e2e/package.json`, `frontend/apps/selenium-e2e/README.md`, `df/artifacts/REB-12/devops/summary.md`, `df/artifacts/REB-12/handoffs.md`; command `cd frontend/apps/selenium-e2e && pnpm test:pages` -> `3 passing`
- Result: PASS
- Next: Continue REB-12 by converting generated template skeletons into deterministic per-template assertions and collecting richer AC-level evidence.
- Risks/blockers: Current coverage is a dynamic page-health baseline and does not yet fully replace all 21 template skeletons with template-specific assertions.

## 2026-07-07 local - State change

- Task: REB-12
- From: READY_FOR_DEV
- To: DEV_IN_PROGRESS
- Role: devops
- Reason: Human requested starting home page and remaining pages Selenium tests.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-12/devops/summary.md`, `df/artifacts/REB-12/handoffs.md`
- Next: Continue REB-12 implementation in devops lane.

## 2026-07-07 local - devops - REB-13

- State: DEV_IN_PROGRESS
- Action: Started REB-13 Selenium admin authoring/round-trip implementation; added editor/API helpers, admin suite specs, package command, and docs updates in selenium-e2e.
- Evidence: `frontend/apps/selenium-e2e/src/cases/admin/authoring-roundtrip.spec.ts`, `frontend/apps/selenium-e2e/src/pages/EditorPage.ts`, `frontend/apps/selenium-e2e/src/pages/AuthorApiClient.ts`, `frontend/apps/selenium-e2e/package.json`, `frontend/apps/selenium-e2e/README.md`, `frontend/apps/selenium-e2e/reports/junit/reb13-admin-suite.xml`, `df/artifacts/REB-13/devops/summary.md`, `df/artifacts/REB-13/handoffs.md`; command `cd frontend/apps/selenium-e2e && pnpm test:admin` -> `3 passing`; command `cd frontend/apps/selenium-e2e && pnpm build && pnpm exec mocha --grep "REB-13 admin authoring and round-trip suite" --reporter mocha-junit-reporter --reporter-options mochaFile=./reports/junit/reb13-admin-suite.xml` -> PASS
- Result: PASS
- Next: Continue devops lane and decide whether to move REB-13 to `READY_FOR_QA` after final AC review.
- Risks/blockers: Edit persistence currently uses a fallback save path when selected seeded component does not expose direct editable controls in the panel.

## 2026-07-07 local - State change

- Task: REB-13
- From: READY_FOR_DEV
- To: DEV_IN_PROGRESS
- Role: devops
- Reason: Human requested starting Selenium admin automation for edit/cancel-inheritance/publish flows.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-13/devops/summary.md`, `df/artifacts/REB-13/handoffs.md`
- Next: Continue REB-13 implementation and validation in devops lane.

## 2026-07-07 local - frontend-dev - REB-08

- State: READY_FOR_QA
- Action: Completed frontend foundation updates for tokens/fonts/layout shell and renderer contract baseline; replaced stale `site-nextjs` component-map imports with a contract-aware fallback map and validated full frontend build.
- Evidence: `frontend/apps/site-nextjs/src/app/globals.css`, `frontend/apps/site-nextjs/src/app/layout.tsx`, `frontend/apps/site-nextjs/src/components/component-map.tsx`, `frontend/packages/react/src/FlexCmsProvider.tsx`, `frontend/packages/react/src/FlexCmsComponent.tsx`, `df/artifacts/REB-08/frontend/summary.md`, `df/artifacts/REB-08/handoffs.md`; command `cd frontend && NUXT_TELEMETRY_DISABLED=1 pnpm build` PASS
- Result: PASS
- Next: Manual human QA/PO review per `DEC-REB-005`; route defects back to `frontend-dev` if review fails.
- Risks/blockers: Unimplemented TUT resource types currently render through explicit fallback until REB-09 grouped renderers are delivered.

## 2026-07-07 local - State change

- Task: REB-08
- From: DEV_IN_PROGRESS
- To: READY_FOR_QA
- Role: frontend-dev
- Reason: AC1-AC5 implementation and validation evidence completed in frontend lane.
- Evidence: `df/artifacts/REB-08/frontend/summary.md`, `df/artifacts/REB-08/handoffs.md`, `df/runtime/board.md`
- Next: Manual human review/acceptance per `DEC-REB-005`

## 2026-07-07 local - frontend-dev - REB-08

- State: DEV_IN_PROGRESS
- Action: Started REB-08 as the next implementation task by human request; captured frontend scope, design/contract inputs, and continuation plan.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-08/frontend/summary.md`, `df/artifacts/REB-08/handoffs.md`, `df/runtime/decisions.md`
- Result: IN PROGRESS
- Next: Continue frontend implementation for tokens/fonts/layout shell/renderer foundation, then hand off for manual human review per `DEC-REB-005`.
- Risks/blockers: REB-01 and REB-04 are still awaiting manual acceptance; implementation proceeds under explicit human override with traceable assumptions.

## 2026-07-07 local - State change

- Task: REB-08
- From: READY_FOR_DEV
- To: DEV_IN_PROGRESS
- Role: frontend-dev
- Reason: Human requested starting the next implementation task while QA/PO automation remains disabled.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-08/frontend/summary.md`, `df/runtime/decisions.md`
- Next: Implement REB-08 acceptance criteria and move to `READY_FOR_QA` when validation evidence is complete.

## 2026-07-07 local - data-engineer - REB-07

- State: READY_FOR_QA
- Action: Completed REB-07 by implementing a manifest-driven captured-asset importer, generating the DAM/public map and evidence artifacts, and copying captured assets into frontend public roots.
- Evidence: `scripts/import_tut_usa_captured_assets.py`, `scripts/tests/test_import_tut_usa_captured_assets.py`, `df/artifacts/REB-07/data/dam-import-map.json`, `df/artifacts/REB-07/data/checksum-evidence.md`, `df/artifacts/REB-07/data/rollback-notes.md`, `df/artifacts/REB-07/data/validation.md`, `df/artifacts/REB-07/handoffs.md`; command `python3 -m unittest scripts.tests.test_import_tut_usa_captured_assets -v` PASS; command `python3 scripts/import_tut_usa_captured_assets.py` PASS
- Result: PASS
- Next: Manual human QA/PO review per `DEC-REB-005`
- Risks/blockers: DAM upload path was not executed in this session (`--upload-dam` not enabled), and capture manifests still report `missing` entries for `component_library_events_booking`.

## 2026-07-07 local - State change

- Task: REB-07
- From: DEV_IN_PROGRESS
- To: READY_FOR_QA
- Role: data-engineer
- Reason: Manifest-driven import pipeline, mapping artifact, checksum/rollback evidence, and lane validation were completed.
- Evidence: `df/artifacts/REB-07/data/summary.md`, `df/artifacts/REB-07/data/validation.md`, `df/artifacts/REB-07/handoffs.md`, `df/runtime/board.md`
- Next: Manual human QA/PO review per `DEC-REB-005`

## 2026-07-07 local - data-engineer - REB-07

- State: DEV_IN_PROGRESS
- Action: Started REB-07 by explicit human request to continue delivery while `qa`/`po` remain manual-only (`DEC-REB-005`), and prepared lane evidence with implementation inputs/deliverables.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-07/data/summary.md`, `df/artifacts/REB-07/handoffs.md`, `df/runtime/decisions.md`
- Result: IN PROGRESS
- Next: Continue REB-07 implementation (manifest-driven DAM/public asset import map, checksums, rollback notes), then hand off for manual human review.
- Risks/blockers: Dependencies `REB-02` and `REB-03` are still awaiting manual human review; this start proceeds under explicit human override.

## 2026-07-07 local - State change

- Task: REB-07
- From: READY_FOR_DEV
- To: DEV_IN_PROGRESS
- Role: data-engineer
- Reason: Human requested starting a new dev task now while QA/PO remain disabled and user review comes later.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-07/data/summary.md`, `df/runtime/decisions.md`
- Next: Complete REB-07 lane deliverables and move to `READY_FOR_QA` for manual human review per `DEC-REB-005`

## 2026-07-07 local - data-engineer - REB-03

- State: DEV_IN_PROGRESS -> READY_FOR_QA
- Action: Implemented guarded TUT/TUT-USA reset planning/execution tooling, added unit tests, and generated a machine-readable dry-run reset scope report.
- Evidence: `scripts/reset_tut_usa_seed.py`, `scripts/tests/test_reset_tut_usa_seed.py`, `df/artifacts/REB-03/data/reset-plan.md`, `df/artifacts/REB-03/data/reseed-evidence.md`, `df/artifacts/REB-03/data/reset-scope.json`; command `python3 -m unittest scripts.tests.test_reset_tut_usa_seed -v` PASS; command `python3 scripts/reset_tut_usa_seed.py --confirm-reset-tut-usa --environment local --report-json /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS/df/artifacts/REB-03/data/reset-scope.json` PASS (dry-run)
- Result: PASS
- Next: Manual human QA/PO review per `DEC-REB-005`
- Risks/blockers: Live before/after DB row counts were not captured in this shell because `psycopg2` is not installed; the tool still supports count collection when the dependency is present.

## 2026-07-07 local - State change

- Task: REB-03
- From: READY_FOR_DEV
- To: READY_FOR_QA
- Role: data-engineer
- Reason: Reset plan, safety gates, dry-run scope report, and lane evidence are complete for QA review.
- Evidence: `df/artifacts/REB-03/data/reset-plan.md`, `df/artifacts/REB-03/data/reseed-evidence.md`, `df/artifacts/REB-03/data/reset-scope.json`, `df/artifacts/REB-03/handoffs.md`
- Next: Manual human QA/PO review per `DEC-REB-005`
# The Factory Activity Log

Append-only chronological log of factory actions.

Use `df/templates/activity-log-entry.md` for new entries.

## 2026-07-07 local - qa - REB-05

- State: READY_FOR_QA -> READY_FOR_PO
- Action: Verified Selenium framework foundation (`frontend/apps/selenium-e2e`): ran `pnpm build`, executed the smoke spec, and validated generated JUnit reports and artifacts against acceptance criteria AC1-AC5 as documented by DevOps.
- Evidence: `df/artifacts/REB-05/devops/summary.md`, `df/artifacts/REB-05/qa-report.md`, `df/runtime/board.md`
- Result: PASS
- Next: po reviews evidence and accepts/rejects `REB-05`
- Risks/blockers: `chromedriver` major-version pinning may need bumping over time; the smoke spec proved framework mechanics but did not exercise real Admin UI content (content-level assertions belong to REB-12/REB-13).



## 2026-05-29 15:25 - devops - TASK-001

- State: READY_FOR_QA
- Action: Rebranded user-facing repository docs, templates, runtime headings, and automation-facing router/test display text to `The Factory`; preserved internal `df/` and `DF_*` identifiers.
- Evidence: `df/artifacts/TASK-001/devops/dev-notes.md`; `df/artifacts/TASK-001/handoffs.md`; repository-wide branding scan; `df/agent-router/test-router-selection.bash`
- Result: PASS
- Next: `qa` verifies branding coverage and reruns router regression validation.
- Risks/blockers: Internal `df/` paths, `DF_*` environment names, and the repository folder name `DF` remain unchanged by design.

## 2026-05-29 15:25 - State change

- Task: TASK-001
- From: DEV_IN_PROGRESS
- To: READY_FOR_QA
- Role: devops
- Reason: Rebranding implementation completed with validation evidence.
- Evidence: `df/artifacts/TASK-001/devops/dev-notes.md`, `df/artifacts/TASK-001/handoffs.md`, `df/agent-router/test-router-selection.bash`
- Next: qa verifies rename coverage and regression safety

## 2026-07-06 21:18 local - sa - DF-INTEGRATION

- State: migration
- Action: Migrated active legacy queue items into Dark Factory runtime board and task artifacts.
- Evidence: `df/runtime/board.md`, `df/artifacts/*/task.md`
- Result: PASS
- Next: run `./flex agent plan` to inspect the next role-session; use `./flex agent run` for autonomous routing.
- Risks/blockers: Legacy `agents/queue.json` remains for reference only.

## 2026-07-06 21:45 local - devops - RT-00

- State: BLOCKED claimed by autonomous model output; not accepted as authoritative.
- Action: Autonomous role session wrote planning/handoff artifacts but incorrectly truncated `df/runtime/board.md` and overwrote the append-only activity log.
- Evidence: `df/artifacts/RT-00/agent-response-devops.md`, `df/artifacts/RT-00/handoffs.md`, `df/artifacts/RT-00/devops/plan.md`, `df/artifacts/RT-00/devops/evidence.md`
- Result: PARTIAL
- Next: Control plane repaired; RT-00 returned to `RETURNED_TO_DEV`; adapter now rejects board truncation and activity-log overwrite attempts.
- Risks/blockers: Compact model prompt may not provide enough code context for large devops implementation tasks.

## 2026-07-06 21:55 local - system - DF-CONTROL-PLANE-REPAIR

- State: repaired
- Action: Restored full Dark Factory runtime board and append-only activity log after unsafe model output.
- Evidence: `df/runtime/board.md`, `df/runtime/activity-log.md`, `agents/df-gh-agent.py`
- Result: PASS
- Next: Run `./flex agent plan` before another live run; consider manual/session-specific prompting for RT-00 implementation.
- Risks/blockers: Future model sessions must preserve all board rows; unsafe writes are rejected by the adapter.

## 2026-07-07 local - sa - REB-00

- State: READY_FOR_QA
- Action: Replaced the previous RT/TF runtime backlog with a new rebuild backlog for TUT design normalization, browser/Selenium remote asset capture, safe seed reset/reseed, frontend reimplementation, Selenium automation, QA, and PO acceptance.
- Evidence: `df/artifacts/REB-00/task.md`; `df/artifacts/REB-00/solution-design.md`; `df/artifacts/REB-00/handoffs.md`; `df/artifacts/REB-00/archived-board-before-reset.md`; `df/artifacts/REB-01/task.md` through `df/artifacts/REB-16/task.md`; `df/runtime/board.md`
- Result: PASS
- Next: `qa` verifies `REB-00` planning/backlog-reset evidence, then routes to PO or defects.
- Risks/blockers: Remote asset licensing/availability, destructive seed reset risk, and broad rebuild scope are recorded in `df/runtime/risks.md`.

## 2026-07-07 local - State change

- Task: REB-00
- From: OPEN
- To: READY_FOR_QA
- Role: sa
- Reason: Human requested a complete backlog reset; SA produced replacement backlog, architecture, dependencies, and handoff artifacts.
- Evidence: `df/artifacts/REB-00/task.md`, `df/artifacts/REB-00/solution-design.md`, `df/runtime/board.md`
- Next: qa verifies planning evidence and routes to PO or defects

## 2026-07-07 local - sa - REB-00

- State: READY_FOR_QA
- Action: Ran factory dry-run planner after board replacement.
- Evidence: command `./start factory --dry-run`; output selected role `qa`, task `REB-00`, state `READY_FOR_QA`.
- Result: PASS
- Next: `qa` executes the next single-role session for `REB-00`.
- Risks/blockers: none beyond risks already recorded for the rebuild program.

## 2026-07-07 local - qa - REB-00

- State: QA_IN_PROGRESS -> READY_FOR_PO
- Action: Independently verified all 7 acceptance criteria for the REB-00 planning/backlog-reset task: archived board, replaced board, 16-task backlog coverage, storage conventions, safe seed-reset design, Selenium traceability strategy, and runtime documentation updates. Cross-checked SA facts against the filesystem (template/component folder counts, Flyway migration files, component count in source doc).
- Evidence: `df/artifacts/REB-00/qa-report.md`; `df/artifacts/REB-00/handoffs.md`; terminal counts of `Design/sample-website-tut/template-libs` (21) and `component-libs` (14); grep of `docs/list-ofcomponents-tempaltes-and-page-trees.txt` for "406 components"; `ls` of `flexcms-app/.../db/migration/` confirming V14-V17.
- Result: PASS
- Next: `po` reviews and accepts or rejects `REB-00`.
- Risks/blockers: Minor process observation (state transition recorded as OPEN->READY_FOR_QA without an explicit ARCHITECTURE_IN_PROGRESS entry) documented in qa-report.md as non-blocking. Substantive risks remain tracked in `df/runtime/risks.md`.

## 2026-07-07 local - State change

- Task: REB-00
- From: READY_FOR_QA
- To: READY_FOR_PO
- Role: qa
- Reason: All acceptance criteria independently verified with PASS; no blocking defects found.
- Evidence: `df/artifacts/REB-00/qa-report.md`, `df/runtime/board.md`
- Next: po start note, then PO acceptance review

## 2026-07-07 local - po - REB-00

- State: PO_REVIEW
- Action: Reviewed REB-00 planning/backlog-reset artifacts (task, solution design, QA report, decisions, risks) against acceptance criteria AC1-AC7. Confirmed QA PASS, backlog decomposition matches the raw request intent, seed-reset safety guardrails and Selenium/Playwright transition strategy are sound. E2E validation not applicable — no runnable UI/backend surface in this task's scope.
- Evidence: `df/artifacts/REB-00/po-review.md`
- Result: PASS
- Next: `designer` starts `REB-01` (now unblocked in `df/runtime/board.md`).
- Risks/blockers: R-REB-001..005 accepted as open risks owned by downstream delivery lanes; not blockers to this planning task's acceptance.

## 2026-07-07 local - State change

- Task: REB-00
- From: PO_REVIEW
- To: DONE
- Role: po
- Reason: Acceptance criteria met, QA passed, product outcome matches raw request intent; no UI in scope so E2E evidence marked not applicable per PO acceptance rules.
- Evidence: `df/artifacts/REB-00/po-review.md`, `df/runtime/board.md`
- Next: `designer` starts `REB-01`.

## 2026-07-07 local - backend-dev - REB-04

- State: READY_FOR_QA
- Action: Generated canonical TUT USA component contracts, template contracts, page tree, static asset URL inventory, and asset download/storage plan from the approved template/component/page-tree sources. Human clarified design is already provided and no designer-side action is needed for this contract-generation session.
- Evidence: `scripts/generate_tut_contract_artifacts.py`; `Design/tut-usa/generated/component-contracts.json`; `Design/tut-usa/generated/template-contracts.json`; `Design/tut-usa/generated/page-tree.json`; `Design/tut-usa/generated/static-asset-url-inventory.json`; `Design/tut-usa/generated/asset-download-plan.md`; `df/artifacts/REB-04/backend/summary.md`; `df/artifacts/REB-04/handoffs.md`
- Result: PASS
- Next: `qa` verifies REB-04 generated contracts and source traceability.
- Risks/blockers: Static asset inventory is not authoritative browser capture; REB-02 must perform Selenium capture before runtime/DAM asset import.

## 2026-07-07 local - State change

- Task: REB-04
- From: READY_FOR_DEV
- To: READY_FOR_QA
- Role: backend-dev
- Reason: Contract/page-tree generation completed and validated; no backend runtime code changed.
- Evidence: `df/artifacts/REB-04/backend/summary.md`, `df/artifacts/REB-04/handoffs.md`, `Design/tut-usa/generated/`
- Next: qa verifies generated artifacts and evidence

## 2026-07-07 local - Policy change - factory-wide

- Task: N/A (process/orchestration change)
- Action: Recorded `DEC-REB-005` in `df/runtime/decisions.md` per explicit human request: temporarily disable the automated `qa` and `po` Dark Factory roles; the human will play both roles manually going forward. Added the active-override section to `df/03-orchestration-rules.md` and disabled banners to `df/roles/qa.md` and `df/roles/po.md`.
- Evidence: `df/runtime/decisions.md` (`DEC-REB-005`), `df/03-orchestration-rules.md` (active override section), `df/roles/qa.md`, `df/roles/po.md`, `df/runtime/board.md` (queue notes)
- Result: PASS
- Next: No agent session selects `qa`/`po` as responsible role until a human reverses this decision. Delivery lanes continue implementing and moving tasks to `READY_FOR_QA` as usual; the human reviews manually.
- Risks/blockers: Nothing reaches `DONE` automatically anymore — the human must manually transition `READY_FOR_QA`/`READY_FOR_PO`/`PO_REVIEW` tasks.

## 2026-07-07 local - devops - REB-05

- State: DEV_IN_PROGRESS
- Action: Corrected a stale `Blocked?` flag on `REB-05` (its only dependency `REB-00` is `DONE`) and started implementing the Selenium E2E framework foundation package (`frontend/apps/selenium-e2e`) per `df/artifacts/REB-00/solution-design.md` section 8.
- Evidence: `df/artifacts/REB-05/devops/` (in progress)
- Result: IN PROGRESS
- Next: Complete Selenium package scaffolding, scripts, and README, then move to `READY_FOR_QA` for human review.
- Risks/blockers: None yet identified.

## 2026-07-07 local - devops - REB-05

- State: READY_FOR_QA
- Action: Completed the Selenium E2E framework foundation (`frontend/apps/selenium-e2e`): typed driver/env/waits/screenshots helpers, an example page object, a passing `@smoke` spec, JUnit reporting via `mocha-junit-reporter`, and a full README. Verified locally: `pnpm install`, `pnpm build` (tsc, 0 errors), `npx mocha` (1 passing), and a JUnit-reporter run producing valid XML. Playwright (`frontend/apps/admin-e2e`) untouched per `DEC-REB-004`.
- Evidence: `frontend/apps/selenium-e2e/` (package + README); `df/artifacts/REB-05/devops/summary.md`; `df/artifacts/REB-05/handoffs.md`
- Result: PASS
- Next: Per `DEC-REB-005`, automated `qa`/`po` are disabled — human reviews REB-05 manually and accepts (`DONE`) or rejects (`RETURNED_TO_DEV`).
- Risks/blockers: `chromedriver` major-version pinning may need bumping over time; SLOWMO env var is a documented placeholder only; Turbo pipeline wiring deferred to REB-14 by design.

## 2026-07-07 local - State change

- Task: REB-05
- From: READY_FOR_DEV
- To: READY_FOR_QA
- Role: devops
- Reason: Selenium framework foundation implemented and locally verified (build + smoke test + JUnit report).
- Evidence: `df/artifacts/REB-05/devops/summary.md`, `df/artifacts/REB-05/handoffs.md`, `frontend/apps/selenium-e2e/`
- Next: Human plays `qa`/`po` manually per `DEC-REB-005` and decides DONE vs RETURNED_TO_DEV.



## 2026-07-07 local - State change

- Task: REB-01
- From: READY_FOR_DESIGN
- To: DESIGN_IN_PROGRESS
- Role: designer
- Reason: Started REB-01 design package normalization and storage-map approval session.
- Evidence: `df/artifacts/REB-01/task.md`, `df/artifacts/REB-00/solution-design.md`, `docs/list-ofcomponents-tempaltes-and-page-trees.txt`
- Next: Complete design inventory, risk notes, and handoff artifacts.

## 2026-07-07 local - designer - REB-01

- State: READY_FOR_DEV
- Action: Completed REB-01 design normalization deliverables: canonical TUT USA storage map, full template/component inventory with source-reference coverage, screenshot-reference policy (no source mutation), and missing-evidence/licensing risk notes.
- Evidence: `Design/tut-usa/README.md`; `df/artifacts/REB-01/design/inventory.md`; `df/artifacts/REB-01/design/summary.md`; `df/artifacts/REB-01/handoffs.md`
- Result: PASS
- Next: `devops` starts `REB-02` browser-first remote asset capture using REB-01 inventory/storage map.
- Risks/blockers: `tut_sovereign` folders have `DESIGN.md` only; remote asset/font licensing must be preserved in REB-02 manifests.

## 2026-07-07 local - State change

- Task: REB-01
- From: DESIGN_IN_PROGRESS
- To: READY_FOR_DEV
- Role: designer
- Reason: Design package normalization artifacts and handoff were completed.
- Evidence: `Design/tut-usa/README.md`, `df/artifacts/REB-01/design/inventory.md`, `df/artifacts/REB-01/design/summary.md`, `df/artifacts/REB-01/handoffs.md`, `df/runtime/board.md`
- Next: devops executes REB-02



## 2026-07-07 local - devops - REB-01

- State: READY_FOR_QA
- Action: Reviewed and approved the REB-01 normalized design storage contract and inventory package for downstream browser-capture work; validated the required baseline artifacts/paths exist.
- Evidence: `df/artifacts/REB-01/devops/summary.md`; `df/artifacts/REB-01/handoffs.md`; command checks for `Design/tut-usa/README.md`, `df/artifacts/REB-01/design/inventory.md`, `Design/sample-website-tut/template-libs/`, `Design/sample-website-tut/component-libs/`
- Result: PASS
- Next: Per `DEC-REB-005`, human performs QA/PO review manually; after acceptance, run a new `devops` session for `REB-02`.
- Risks/blockers: `tut_sovereign` evidence gap and remote asset/font licensing metadata requirements remain tracked in REB-01 artifacts.

## 2026-07-07 local - State change

- Task: REB-01
- From: READY_FOR_DEV
- To: READY_FOR_QA
- Role: devops
- Reason: DevOps storage-map/inventory approval completed with baseline validation evidence.
- Evidence: `df/artifacts/REB-01/devops/summary.md`, `df/artifacts/REB-01/handoffs.md`, `df/runtime/board.md`
- Next: Manual human QA/PO review per DEC-REB-005

## 2026-07-07 local - State change

- Task: REB-02
- From: READY_FOR_DEV
- To: DEV_IN_PROGRESS
- Role: devops
- Reason: Started the REB-02 DevOps session to implement the Selenium browser-first asset-capture pipeline and normalized TUT output generation.
- Evidence: `df/artifacts/REB-02/task.md`, `df/artifacts/REB-00/solution-design.md`, `Design/tut-usa/README.md`, `df/runtime/board.md`
- Next: Implement the capture runner, generate manifests/normalized HTML/screenshots, validate locally, then hand off for manual human QA per DEC-REB-005

## 2026-07-07 local - devops - REB-02

- State: DEV_IN_PROGRESS
- Action: Claimed the task, reviewed REB-02 acceptance criteria plus REB-00/REB-01 design guidance, and began implementing the Selenium-based browser capture pipeline in `frontend/apps/selenium-e2e`.
- Evidence: `df/artifacts/REB-02/task.md`; `df/artifacts/REB-00/solution-design.md`; `df/artifacts/REB-01/handoffs.md`; `Design/tut-usa/README.md`; `frontend/apps/selenium-e2e/`
- Result: IN PROGRESS
- Next: Build the runner, execute capture, record manifests/screenshots/evidence, then move the task to `READY_FOR_QA` for manual human review.
- Risks/blockers: Remote scripts are expected to remain disallowed/provenance-only and must be recorded as blockers rather than downloaded.

## 2026-07-07 local - devops - REB-02

- State: READY_FOR_QA
- Action: Implemented the Selenium browser-first asset-capture runner, executed capture across all available TUT template/component `code.html` inputs, generated canonical `Design/tut-usa/` outputs, and revalidated the Selenium smoke suite after the new capture code landed.
- Evidence: `frontend/apps/selenium-e2e/src/capture/runTutAssetCapture.ts`; `frontend/apps/selenium-e2e/src/driver/waits.ts`; `frontend/apps/selenium-e2e/package.json`; `frontend/apps/selenium-e2e/README.md`; `Design/tut-usa/manifest.json`; `Design/tut-usa/templates/`; `Design/tut-usa/components/`; `Design/tut-usa/assets/`; `df/artifacts/REB-02/devops/summary.md`; `df/artifacts/REB-02/handoffs.md`
- Result: PASS
- Next: Per `DEC-REB-005`, human performs QA/PO review manually and decides whether REB-02 is accepted or returned to DevOps for stricter normalization/blocker handling.
- Risks/blockers: 37 blockers remain intentionally documented in manifests (primarily disallowed Tailwind CDN scripts and one HTTP 400 Google Fonts stylesheet); `tut_sovereign` source folders remain skipped because no `code.html` exists.

## 2026-07-07 local - State change

- Task: REB-02
- From: DEV_IN_PROGRESS
- To: READY_FOR_QA
- Role: devops
- Reason: Browser-first Selenium capture pipeline implemented and validated; normalized outputs, manifests, screenshots, and captured assets generated under `Design/tut-usa/`.
- Evidence: `df/artifacts/REB-02/devops/summary.md`, `df/artifacts/REB-02/handoffs.md`, `Design/tut-usa/manifest.json`, `frontend/apps/selenium-e2e/`
- Next: Manual human QA/PO review per DEC-REB-005



## 2026-07-07 local - factory-planning - dispatch check

- State: planning
- Action: Ran the Dark Factory dry-run after boot-sequence review to determine whether a new delivery-lane task can start.
- Evidence: Command `./start factory --dry-run` selected role `qa` for task `REB-01` even though `DEC-REB-005` disables automated `qa`/`po` sessions; current board rows show all remaining delivery tasks depend on human QA/PO acceptance of `REB-01` through `REB-05`.
- Result: BLOCKED
- Next: Human performs manual QA/PO review for `REB-01` through `REB-05`, then start the next unblocked delivery-lane session.
- Risks/blockers: The router dry-run currently proposes a disabled `qa` session, so `df/runtime/board.md` plus `df/runtime/decisions.md` remain the authoritative source for delivery-task selection.

## 2026-07-07 local - devops - REB-06

- State: DEV_IN_PROGRESS
- Action: Started REB-06 by explicit human request to continue development while `qa`/`po` automation stays disabled and manual review is deferred.
- Evidence: `df/runtime/board.md`, command `./start factory --dry-run`, `df/runtime/decisions.md` (`DEC-REB-005`)
- Result: IN PROGRESS
- Next: Execute the devops checklist for REB-06 (traceability matrix + Selenium skeleton generation) and move to `READY_FOR_QA` with evidence.
- Risks/blockers: REB-02, REB-04, and REB-05 remain in `READY_FOR_QA`; this start proceeds under explicit human override and depends on later manual review outcomes.

## 2026-07-07 local - State change

- Task: REB-06
- From: READY_FOR_DEV
- To: DEV_IN_PROGRESS
- Role: devops
- Reason: Human requested to start a new dev task now, with QA/PO deferred to manual review later.
- Evidence: `df/runtime/board.md`, `df/runtime/decisions.md`
- Next: Complete REB-06 implementation and handoff for manual human review per `DEC-REB-005`

## 2026-07-07 local - devops - REB-06

- State: READY_FOR_QA
- Action: Implemented REB-06 traceability generation flow in Selenium package, generated fixture manifests and skeleton specs, and produced the QA traceability CSV.
- Evidence: `frontend/apps/selenium-e2e/src/capture/generateTraceabilitySkeletons.ts`; `frontend/apps/selenium-e2e/package.json`; `frontend/apps/selenium-e2e/src/fixtures/template-manifest.ts`; `frontend/apps/selenium-e2e/src/fixtures/component-manifest.ts`; `frontend/apps/selenium-e2e/src/cases/templates/`; `frontend/apps/selenium-e2e/src/cases/components/`; `Design/tut-usa/generated/qa-traceability-matrix.csv`; `df/artifacts/REB-06/devops/summary.md`; `df/artifacts/REB-06/handoffs.md`; commands `pnpm generate:traceability`, `pnpm build`, `pnpm test:smoke` PASS
- Result: PASS
- Next: Manual human QA/PO review per `DEC-REB-005`
- Risks/blockers: `tut_sovereign` template/component folders remain capture-skipped due missing `code.html`; rows are present in matrix/spec skeletons as `skeleton-no-capture` for later implementation follow-up.

## 2026-07-07 local - State change

- Task: REB-06
- From: DEV_IN_PROGRESS
- To: READY_FOR_QA
- Role: devops
- Reason: Traceability matrix, fixture manifests, and 21 template + 14 component skeleton specs generated and validated.
- Evidence: `df/artifacts/REB-06/devops/summary.md`, `df/artifacts/REB-06/handoffs.md`, `Design/tut-usa/generated/qa-traceability-matrix.csv`, `frontend/apps/selenium-e2e/src/cases/`
- Next: Manual human review and accept/reject decision per `DEC-REB-005`

## 2026-07-07 local - frontend-dev - REB-09

- State: READY_FOR_QA
- Action: Completed grouped TUT component renderer implementation in `site-nextjs`, registering all generated `tut-usa/*` resource types from contract artifacts and adding defensive rendering for optional/missing fields, empty lists, long copy, and image fallbacks.
- Evidence: `frontend/apps/site-nextjs/src/components/tutGroupedRenderers.tsx`, `frontend/apps/site-nextjs/src/components/component-map.tsx`, `df/artifacts/REB-09/frontend/summary.md`, `df/artifacts/REB-09/handoffs.md`; command `cd frontend && NUXT_TELEMETRY_DISABLED=1 pnpm build` PASS
- Result: PASS
- Next: Manual human QA/PO review per `DEC-REB-005`; if accepted, route to `REB-10` implementation.
- Risks/blockers: Grouped renderers are generic by contract; template-level fidelity refinements may be needed in `REB-10`.

## 2026-07-07 local - State change

- Task: REB-09
- From: DEV_IN_PROGRESS
- To: READY_FOR_QA
- Role: frontend-dev
- Reason: REB-09 AC1-AC5 implementation completed with frontend build validation evidence.
- Evidence: `df/artifacts/REB-09/frontend/summary.md`, `df/artifacts/REB-09/handoffs.md`, `df/runtime/board.md`
- Next: Manual human review/acceptance per `DEC-REB-005`

## 2026-07-07 local - frontend-dev - REB-09

- State: DEV_IN_PROGRESS
- Action: Started REB-09 by explicit human request while QA/PO automated sessions remain disabled; captured implementation scope and evidence plan for grouped renderer delivery.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-09/frontend/summary.md`, `df/runtime/decisions.md`
- Result: IN PROGRESS
- Next: Implement grouped TUT renderers, run frontend validation, and move task to `READY_FOR_QA` for manual review.
- Risks/blockers: Dependency `REB-08` is still awaiting manual acceptance; work proceeds under explicit human override.

## 2026-07-07 local - State change

- Task: REB-09
- From: READY_FOR_DEV
- To: DEV_IN_PROGRESS
- Role: frontend-dev
- Reason: Human requested taking the next dev task now while QA/PO review is deferred to manual.
- Evidence: `df/runtime/board.md`, `df/artifacts/REB-09/frontend/summary.md`, `df/runtime/decisions.md`
- Next: Complete REB-09 acceptance criteria and move to `READY_FOR_QA` with validation evidence.

## 2026-07-07 local - sa - DFCA-01

- State: ARCHITECTURE_IN_PROGRESS -> READY_FOR_DEV
- Action: Created a P0 Dark Factory orchestration-change task to replace primary local GitHub Copilot CLI coding delegation with GitHub Copilot Cloud Agent tasks launched and managed through the GitHub REST API. Produced acceptance criteria, target architecture, security/rollback guidance, and devops implementation handoff.
- Evidence: `df/artifacts/DFCA-01/task.md`, `df/artifacts/DFCA-01/solution-design.md`, `df/artifacts/DFCA-01/handoffs.md`, `df/runtime/board.md`, `df/runtime/decisions.md`, `df/runtime/risks.md`; inspected `df/agent-router/start-factory.bash`, `df/agent-router/run-role-session.bash`, `df/agent-router/README.md`, `agents/df-gh-agent.py`, and `agents/config.json`.
- Result: PASS
- Next: `devops` implements `DFCA-01` as an opt-in cloud-agent runner/client with dry-run/mock tests, CI/check polling, sanitized evidence, and documented preview API configuration.
- Risks/blockers: Public-preview GitHub API schema may change; live validation requires paid Copilot Cloud Agent API access and appropriate GitHub token permissions.

## 2026-07-07 local - State change

- Task: DFCA-01
- From: OPEN
- To: READY_FOR_DEV
- Role: sa
- Reason: Human explicitly requested the architecture change; SA refined the request, recorded the accepted decision, designed the target approach, and routed implementation to the DevOps lane.
- Evidence: `df/artifacts/DFCA-01/task.md`, `df/artifacts/DFCA-01/solution-design.md`, `df/artifacts/DFCA-01/handoffs.md`, `df/runtime/board.md`, `df/runtime/decisions.md`
- Next: devops implementation session for Copilot Cloud Agent REST orchestration.

## 2026-07-07 local - devops - DFCA-01

- State: DEV_IN_PROGRESS -> READY_FOR_QA
- Action: Implemented the opt-in Copilot Cloud Agent REST orchestration runner/client, executable wrapper, `run-role-session.bash` integration, no-network dry-run status/report artifacts, unit tests, configuration documentation, and rollback guidance.
- Evidence: `df/agent-router/copilot_cloud_agent.py`, `df/agent-router/copilot-cloud-agent.py`, `df/agent-router/test_copilot_cloud_agent.py`, `df/agent-router/run-role-session.bash`, `df/agent-router/README.md`, `.df-factory.env.example`, `df/artifacts/DFCA-01/devops/summary.md`, `df/artifacts/DFCA-01/cloud-agent-status.json`, `df/artifacts/DFCA-01/cloud-agent-report.md`, `df/artifacts/DFCA-01/handoffs.md`; commands `python3 -m unittest df/agent-router/test_copilot_cloud_agent.py` PASS (10 tests), `python3 -m unittest discover -s df/agent-router -p '*test*.py'` PASS (10 tests), `bash -n df/agent-router/start-factory.bash && bash -n df/agent-router/run-role-session.bash` PASS, `python3 -m py_compile df/agent-router/copilot_cloud_agent.py df/agent-router/copilot-cloud-agent.py` PASS, direct and wrapper dry-run invocations PASS, existing router regression scripts PASS.
- Result: PASS
- Next: `qa` verifies DFCA-01 local implementation, dry-run/mock evidence, docs, redaction behavior, and live-validation caveats.
- Risks/blockers: Live GitHub Copilot Cloud Agent API launch was not executed because it requires paid Copilot Cloud Agent API access and a token with current public-preview permissions; endpoint/header/schema remain configurable due preview volatility.

## 2026-07-07 local - State change

- Task: DFCA-01
- From: DEV_IN_PROGRESS
- To: READY_FOR_QA
- Role: devops
- Reason: DevOps implementation and deterministic validation are complete; live cloud launch is documented as environment-dependent.
- Evidence: `df/artifacts/DFCA-01/devops/summary.md`, `df/artifacts/DFCA-01/handoffs.md`, `df/artifacts/DFCA-01/cloud-agent-status.json`, `df/artifacts/DFCA-01/cloud-agent-report.md`, `df/runtime/board.md`
- Next: qa verification of DFCA-01.

## 2026-07-07 local - Policy change - factory-wide

- Task: N/A (process/orchestration change)
- Action: Per human instruction, did not execute QA and disabled automated `po` role routing until further notice. Updated router state-role mapping so PO-owned states are non-actionable to automation, added a PO-role disabled banner, documented the active override, and recorded `DEC-DFCA-002`.
- Evidence: `df/agent-router/state-role-map.bash`, `df/roles/po.md`, `df/03-orchestration-rules.md`, `df/runtime/decisions.md`, `df/runtime/board.md`
- Result: PASS
- Next: QA, if desired, must be performed by a separate QA session or human reviewer; product acceptance remains human-only/manual until a later decision re-enables `po`.
- Risks/blockers: Tasks in `READY_FOR_PO`, `PO_REVIEW`, `PO_REJECTED`, or `REFINEMENT_QUESTIONS` will not advance automatically while PO is disabled.


## 2026-07-07 18:17 local - qa - DFCA-01

- State: READY_FOR_QA -> BLOCKED
- Action: Launched/polled GitHub Copilot Cloud Agent REST orchestration path; recorded sanitized cloud-task, branch/PR, and CI evidence.
- Evidence: `df/artifacts/DFCA-01/cloud-agent-status.json`, `df/artifacts/DFCA-01/cloud-agent-report.md`, `df/artifacts/DFCA-01/handoffs.md`
- Result: FAIL
- Next: Fix Copilot Cloud Agent runner/API failure: GitHub API POST https://api.github.com/repos/stgreenrecords/FlexCMS/copilot/coding-agent/tasks failed with HTTP 404: {
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest",
  "status": "404"
}
- Risks/blockers: GitHub API POST https://api.github.com/repos/stgreenrecords/FlexCMS/copilot/coding-agent/tasks failed with HTTP 404: {
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest",
  "status": "404"
}

## 2026-07-07 18:20 local - qa - DFCA-01

- State: READY_FOR_QA -> BLOCKED
- Action: Launched/polled GitHub Copilot Cloud Agent REST orchestration path; recorded sanitized cloud-task, branch/PR, and CI evidence.
- Evidence: `df/artifacts/DFCA-01/cloud-agent-status.json`, `df/artifacts/DFCA-01/cloud-agent-report.md`, `df/artifacts/DFCA-01/handoffs.md`
- Result: FAIL
- Next: Fix Copilot Cloud Agent runner/API failure: GitHub API POST https://api.github.com/agents/repos/stgreenrecords/FlexCMS/tasks failed with HTTP 400: {"documentation_url":"https://docs.github.com/rest","message":"model not found or not enabled for user"}
- Risks/blockers: GitHub API POST https://api.github.com/agents/repos/stgreenrecords/FlexCMS/tasks failed with HTTP 400: {"documentation_url":"https://docs.github.com/rest","message":"model not found or not enabled for user"}

## 2026-07-07 18:30 local - qa - DFCA-01

- State: READY_FOR_QA -> BLOCKED
- Action: Launched/polled GitHub Copilot Cloud Agent REST orchestration path; recorded sanitized cloud-task, branch/PR, and CI evidence.
- Evidence: `df/artifacts/DFCA-01/cloud-agent-status.json`, `df/artifacts/DFCA-01/cloud-agent-report.md`, `df/artifacts/DFCA-01/handoffs.md`
- Result: FAIL
- Next: Cloud agent blocked: cloud=timed_out ci=not_checked
- Risks/blockers: cloud=timed_out ci=not_checked
