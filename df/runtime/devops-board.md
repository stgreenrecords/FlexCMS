# The Factory DevOps Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `devops` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P1 | INFRA-TESTCONTAINERS-DOCKER29 | Integration tests cannot run on Docker Engine 29+ and are not wired into any build stage | READY_FOR_DEV | devops | No | 2026-08-19 23:05 CEDT | Migrate to the Boot-managed Testcontainers line and bind the ITs to a gating build stage |
| P1 | REB-12 | Implement Selenium public-site template/component suites | DONE | devops | Yes: REB-06, REB-10 | 2026-07-09 local | Completed end-to-end: reseed + discovery fix + renderer/asset rewrites; REB-12 suite now `21 passing`, `0 pending`, `0 failing` |
| P1 | REB-13 | Implement Selenium admin authoring and round-trip suites | DONE | devops | Yes: REB-06, REB-11 | 2026-07-10 local | Completed with passing admin round-trip Selenium suite + JUnit artifact refresh; proceed to REB-14 |
| P2 | REB-14 | Wire Selenium gates into CI/local validation and retain artifacts | DONE | devops | No | 2026-07-11 local | Completed with passing Selenium smoke/full gates, retained artifacts, and critical/high traceability enforcement |
| P0 | REB-19 | Implement page editor component/property/asset authoring matrix Selenium suite | DONE | devops | No | 2026-08-19 22:35 CEDT | Completed: contract-driven authoring matrix (8 pass / 2 documented-blocker pending / 0 fail), CI gate wired, 495 backend tests + full frontend build + smoke/full Selenium gates green; REB-26 unblocked |
| P0 | REB-26 | Implement exhaustive per-UI-component sample-site editing Selenium suite | DONE | devops | No | 2026-08-21 13:45 CEDT | Completed: 406/406 components PASS across ui/author-api/headless/graphql/publish (24 tests, 0 failures); 505 backend tests, frontend build 9/9, full Selenium gate PASS; four pre-existing blockers R26-1..R26-4 need SA routing |
| P0 | REB-20 | Implement publishing, workflow, scheduling, and bulk operation Selenium/API E2E suite | DONE | devops | No | 2026-08-21 16:10 CEDT | Completed: 12 tests / 0 failures, 13 operation rows (8 PASS / 5 BLOCKED / 0 FAIL) across workflow, publish, bulk and scheduled operations with publish-environment verification; 505 backend tests, frontend build 9/9, full gate PASS (74 tests); five pre-existing blockers R20-1..R20-5 need SA routing |
| P1 | REB-21 | Implement DAM authoring and asset-reference Selenium E2E suite | READY_FOR_DEV | devops | Yes: REB-07, REB-11, REB-13 | 2026-07-07 local | Implement DAM upload/reference/publish-render coverage |
| P1 | REB-22 | Implement experience-fragment and live-copy authoring Selenium E2E suite | READY_FOR_DEV | devops | Yes: REB-11, REB-13, REB-18 | 2026-07-07 local | Implement XF variation and live-copy rollout/detach coverage |
| P1 | REB-23 | Implement PIM catalog/product authoring Selenium E2E suite | READY_FOR_DEV | devops | Yes: REB-07, REB-13 | 2026-07-07 local | Implement PIM CRUD/status/variants/assets/version coverage |
| P2 | REB-24 | Implement admin sites/translations/component-registry authoring-smoke Selenium suite | READY_FOR_DEV | devops | Yes: REB-13 | 2026-07-07 local | Implement secondary admin route smoke/filter/registry coverage |
| P2 | REB-25 | Harden cross-cutting admin E2E quality gates for navigation, errors, accessibility, and cleanup | READY_FOR_DEV | devops | Yes: REB-18, REB-19, REB-20, REB-21, REB-22, REB-23, REB-24, REB-26 | 2026-07-07 local | Add shared hardening helpers before CI gate expansion |
