# The Factory Runtime Board

This is the live task queue. Agents must update it when task state changes.

| Priority | Task ID | Title | Type | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|---|
| P0 | RT-00 | Live test harness — make USE_LIVE_API truly disable ALL mocks + add stack-up Playwright project | Task | RETURNED_TO_DEV | devops | No | 2026-07-06 21:55 local | devops continue implementation using repository context; previous model handoff is advisory only |
| P0 | RT-01 | Asset integrity — resolve the 152 missing images so the demo site has zero broken images | Task | RETURNED_TO_DEV | data-engineer | No | 2026-07-06 21:18 local | data-engineer fix rework item and provide evidence for QA |
| P0 | RT-02 | Page-edit round-trip — author edits dummy data in editor, it persists, headless reflects it, site renders it | Task | READY_FOR_QA | qa | No | 2026-07-06 21:18 local | QA verify with live evidence and route to PO or defects |
| P0 | TF-00 | Test framework foundation — live fixture (mocks OFF), typed API client, POM base, config projects, reporting | Task | READY_FOR_DEV | devops | No | 2026-07-06 21:18 local | devops execute role checklist |
| P1 | RT-03 | Live API/DB retest — Content, Author CRUD, Headless REST, GraphQL against real stack + seed | Task | OPEN | qa | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | RT-04 | Demo site end-to-end render — all 61 pages render with components + images | Task | OPEN | qa | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | RT-05 | DAM + PIM live retest — upload/renditions/asset ops + catalogs/products/import/schema | Task | OPEN | qa | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | RT-06 | Workflow + replication + cache/CDN live retest (publish pipeline) | Task | OPEN | qa | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | TF-01 | L2 API functional suite — CMS / Author CRUD / Headless REST / GraphQL (live, tagged by QA case ID) | Task | OPEN | backend-dev | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | TF-02 | L3 UI POM buildout — Page Objects + live specs for all 18 admin screens | Task | OPEN | frontend-dev | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | TF-03 | L4 demo-site functional + render coverage — all 61 pages, SDK & TUT cases | Task | OPEN | frontend-dev | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | TF-04 | DAM + PIM full functional coverage (API + UI, live) | Task | OPEN | backend-dev | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | TF-05 | Workflow / replication / cache / CDN / search live coverage | Task | OPEN | backend-dev | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P1 | TF-08 | Reporting + CI stack-up gate + JUnit artifacts + test tagging | Task | OPEN | devops | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P2 | RT-07 | Admin UI journeys in LIVE mode — tree, DAM, PIM, sites, preview, workflows | Task | OPEN | qa | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P2 | RT-08 | Evidence gate — wire live_smoke.py into CI stack-up job + factory validate usage | Task | OPEN | devops | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P2 | TF-06 | Cross-cutting coverage — security, error handling, accessibility (axe), CORS/rate-limit, perf smoke | Task | OPEN | qa | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P2 | TF-07 | L5 visual regression — screens x viewport (desktop/tablet/mobile) x theme, vs Design/UI refs | Task | OPEN | frontend-dev | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |
| P2 | TF-09 | Traceability matrix + coverage gate (QA case ID -> test; fail CI on uncovered Critical/High) | Task | OPEN | devops | No | 2026-07-06 21:18 local | SA refine, confirm lane routing, and create/adjust ACs |

## Queue notes

- Migrated from legacy `agents/queue.json` on 2026-07-06.
- `agents/queue.json` is legacy; Dark Factory runtime board is active.
- 2026-07-06 21:55 local: Repaired board after an autonomous RT-00 devops session truncated it to one malformed row. Added adapter safety guard to reject future board truncation.
