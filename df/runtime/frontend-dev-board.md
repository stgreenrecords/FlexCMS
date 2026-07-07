# The Factory Frontend Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `frontend-dev` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P1 | REB-08 | Rebuild frontend tokens, fonts, layout shell, and renderer foundation | DEV_IN_PROGRESS | frontend-dev | No (manual review deferred per DEC-REB-005; using REB-01/REB-04 produced outputs) | 2026-07-07 local | Implement tokens/fonts/layout shell + renderer foundation |
| P1 | REB-09 | Implement TUT grouped component renderers | READY_FOR_DEV | frontend-dev | Yes: REB-08 | 2026-07-07 local | Implement grouped component renderers |
| P1 | REB-10 | Implement all 21 TUT page templates and page routes | READY_FOR_DEV | frontend-dev | Yes: REB-07, REB-09 | 2026-07-07 local | Implement template routes/layouts using headless JSON |
| P1 | REB-11 | Reimplement admin authoring/editor flows for new components/templates | READY_FOR_DEV | frontend-dev | Yes: REB-04, REB-08 | 2026-07-07 local | Rebuild admin authoring/editor UX for generated contracts |
