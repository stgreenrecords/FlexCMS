# The Factory Frontend Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `frontend-dev` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P1 | REB-08 | Rebuild frontend tokens, fonts, layout shell, and renderer foundation | READY_FOR_QA | frontend-dev | No (manual review queue per DEC-REB-005) | 2026-07-07 local | Awaiting manual human QA/PO review; REB-09 renderer implementation can proceed on acceptance |
| P1 | REB-09 | Implement TUT grouped component renderers | READY_FOR_QA | frontend-dev | No (manual review queue per DEC-REB-005) | 2026-07-07 local | Awaiting manual human QA/PO review; grouped contract renderers registered for TUT component inventory |
| P1 | REB-10 | Implement all 21 TUT page templates and page routes | READY_FOR_DEV | frontend-dev | Yes: REB-07, REB-09 | 2026-07-07 local | Implement template routes/layouts using headless JSON |
| P1 | REB-11 | Reimplement admin authoring/editor flows for new components/templates | READY_FOR_DEV | frontend-dev | Yes: REB-04, REB-08 | 2026-07-07 local | Rebuild admin authoring/editor UX for generated contracts |
