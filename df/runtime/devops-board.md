# The Factory DevOps Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `devops` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P0 | REB-02 | Build Selenium browser asset-capture pipeline for remote template resources | READY_FOR_QA | devops | No | 2026-07-07 local | Awaiting manual human QA/PO review per DEC-REB-005; capture outputs and manifests generated under Design/tut-usa |
| P0 | REB-05 | Add Selenium framework foundation and reporting package | READY_FOR_QA | devops | No (REB-00 is DONE) | 2026-07-07 local | Awaiting manual human QA/PO review (DEC-REB-005) |
| P1 | REB-06 | Produce Selenium traceability matrix and generated test-case skeletons | READY_FOR_QA | devops | No (manual review queue per DEC-REB-005) | 2026-07-07 local | Awaiting manual human review; matrix + 21 template and 14 component skeleton specs generated |
| P1 | REB-12 | Implement Selenium public-site template/component suites | READY_FOR_DEV | devops | Yes: REB-06, REB-10 | 2026-07-07 local | Implement Selenium public-site automation |
| P1 | REB-13 | Implement Selenium admin authoring and round-trip suites | READY_FOR_DEV | devops | Yes: REB-06, REB-11 | 2026-07-07 local | Implement Selenium admin and live round-trip automation |
| P2 | REB-14 | Wire Selenium gates into CI/local validation and retain artifacts | READY_FOR_DEV | devops | Yes: REB-12, REB-13 | 2026-07-07 local | Add Selenium CI/local gates and artifact retention |
