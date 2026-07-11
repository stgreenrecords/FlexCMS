# Handoffs - TUT-LINK-INTEGRITY

## 2026-07-11 17:24 CEST - SA to backend-dev

- Task id: `TUT-LINK-CONTRACTS` (parent planning task: `TUT-LINK-INTEGRITY`)
- Current state: `READY_FOR_DEV`
- Previous role result: SA confirmed the defect spans registry contracts, seed data, renderers, and Selenium; it was split into three dependency-ordered delivery tasks.
- Files/artifacts created: `df/artifacts/TUT-LINK-INTEGRITY/task.md`, `df/artifacts/TUT-LINK-INTEGRITY/solution-design.md`, and child `task.md` files for contracts, seed, and rendering.
- Checks performed: repository inspection of the active seeder, `PAGES` inventory, V16 schemas, `component-map.tsx`, `homepageRenderers.tsx`, and current TUT-USA Selenium page suite. No production code or build was changed/run in this SA session.
- Known risks: nested link objects may expose existing admin editor limitations; use a forward `V18` migration and do not rewrite V16. Preserve unrelated registry fields.
- Next role instructions: backend-dev starts `TUT-LINK-CONTRACTS`, writes backend lane evidence/tests, validates registry output and full backend gates, then moves it to `DONE`. Afterward the router may start `TUT-LINK-SEED`; frontend work must wait for both data completion and `BUG-TUT-VEHICLE-RENDERER` to avoid shared-file conflicts.

