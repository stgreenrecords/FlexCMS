# The Factory DevOps Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `devops` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P1 | REB-12 | Implement Selenium public-site template/component suites | DONE | devops | Yes: REB-06, REB-10 | 2026-07-09 local | Completed end-to-end: reseed + discovery fix + renderer/asset rewrites; REB-12 suite now `21 passing`, `0 pending`, `0 failing` |
| P1 | REB-13 | Implement Selenium admin authoring and round-trip suites | DONE | devops | Yes: REB-06, REB-11 | 2026-07-10 local | Completed with passing admin round-trip Selenium suite + JUnit artifact refresh; proceed to REB-14 |
| P2 | REB-14 | Wire Selenium gates into CI/local validation and retain artifacts | DONE | devops | No | 2026-07-11 local | Completed with passing Selenium smoke/full gates, retained artifacts, and critical/high traceability enforcement |
| P0 | REB-19 | Implement page editor component/property/asset authoring matrix Selenium suite | READY_FOR_DEV | devops | Yes: REB-07, REB-10, REB-11, REB-13 | 2026-07-07 local | Implement contract-driven editor authoring matrix and publish verification |
| P0 | REB-26 | Implement exhaustive per-UI-component sample-site editing Selenium suite | READY_FOR_DEV | devops | Yes: REB-07, REB-10, REB-11, REB-13, REB-19 | 2026-07-07 local | Generate one editing scenario/matrix row for every sample-site UI component |
| P0 | REB-20 | Implement publishing, workflow, scheduling, and bulk operation Selenium/API E2E suite | READY_FOR_DEV | devops | Yes: REB-11, REB-13, REB-18 | 2026-07-07 local | Implement workflow/publish/bulk/schedule E2E with publish-environment checks |
| P1 | REB-21 | Implement DAM authoring and asset-reference Selenium E2E suite | READY_FOR_DEV | devops | Yes: REB-07, REB-11, REB-13 | 2026-07-07 local | Implement DAM upload/reference/publish-render coverage |
| P1 | REB-22 | Implement experience-fragment and live-copy authoring Selenium E2E suite | READY_FOR_DEV | devops | Yes: REB-11, REB-13, REB-18 | 2026-07-07 local | Implement XF variation and live-copy rollout/detach coverage |
| P1 | REB-23 | Implement PIM catalog/product authoring Selenium E2E suite | READY_FOR_DEV | devops | Yes: REB-07, REB-13 | 2026-07-07 local | Implement PIM CRUD/status/variants/assets/version coverage |
| P2 | REB-24 | Implement admin sites/translations/component-registry authoring-smoke Selenium suite | READY_FOR_DEV | devops | Yes: REB-13 | 2026-07-07 local | Implement secondary admin route smoke/filter/registry coverage |
| P2 | REB-25 | Harden cross-cutting admin E2E quality gates for navigation, errors, accessibility, and cleanup | READY_FOR_DEV | devops | Yes: REB-18, REB-19, REB-20, REB-21, REB-22, REB-23, REB-24, REB-26 | 2026-07-07 local | Add shared hardening helpers before CI gate expansion |
