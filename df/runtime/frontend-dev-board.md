# The Factory Frontend Delivery Subdashboard

Auto-generated from `df/runtime/board.md` by the router. Do not edit by hand;
update the task's State/Owner on the main board and this view re-renders.

Lists rows whose Owner role is `frontend-dev` (READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV).

| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|
| P0 | TUT-LINK-RENDERING | Render and verify every seeded TUT-USA link | READY_FOR_DEV | frontend-dev | Yes: TUT-LINK-SEED, BUG-TUT-VEHICLE-RENDERER | 2026-07-11 17:24 CEST | After dependencies are DONE, consume authored hrefs and add unit/full-site Selenium link-integrity coverage |
| P1 | BUG-TUT-VEHICLE-RENDERER | Replace generic vehicle, campaign, and learning contract renderers | DEV_IN_PROGRESS | frontend-dev | No | 2026-07-11 local | Learning renderers, full site tests (26/26), and frontend workspace build pass; live learn-route verification remains |
| P1 | CONTENT-PUBLISH-DOUBLECLICK | Open content-tree pages in Publish on double-click | DEV_IN_PROGRESS | frontend-dev | No | 2026-07-11 local | Fallback corrected to reference site `3001`; frontend build passed; focused/admin E2E awaits Playwright Chromium installation |
| P1 | SITE-PAGE-REFERENCE-RENDERING | Keep nested page references out of public page content | DONE | frontend-dev | No | 2026-07-11 local | Renderer boundary, asset normalization, unit/Selenium coverage, and live Vehicles HTML verification passed |
| P1 | REB-09 | Implement TUT grouped component renderers | DONE | frontend-dev | No | 2026-07-08 local | Completed by frontend-dev with grouped renderer unit coverage and passing frontend build evidence |
| P1 | REB-10 | Implement all 21 TUT page templates and page routes | DONE | frontend-dev | Yes: REB-07, REB-09 | 2026-07-08 local | Completed by frontend-dev with contract-driven template routing, template-wrapper tests, and passing frontend build evidence |
| P1 | REB-11 | Reimplement admin authoring/editor flows for new components/templates | DONE | frontend-dev | Yes: REB-04, REB-08 | 2026-07-09 local | Completed by frontend-dev with passing admin Selenium round-trip coverage and full frontend build evidence under developer-owned verification |
