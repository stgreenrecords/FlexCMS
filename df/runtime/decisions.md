# The Factory Decisions

Use `df/templates/decision-record.md` for new decision records.


## 2026-07-07 local - DEC-REB-001 - Replace RT/TF backlog with REB rebuild backlog

- Status: Accepted (PO, 2026-07-07)
- Context: Human explicitly requested a completely new backlog and called the existing backlog unusable.
- Decision: Archive the previous `df/runtime/board.md` at `df/artifacts/REB-00/archived-board-before-reset.md` and replace the active board with `REB-00` through `REB-16`.
- Consequences: Old RT/TF tasks are no longer active runtime work items. They remain recoverable from the archive.

## 2026-07-07 local - DEC-REB-002 - Keep original design source immutable and write processed output under `design/tut-usa/`

- Status: Accepted (PO, 2026-07-07)
- Context: The existing template/component folders under `Design/sample-website-tut/` are source evidence containing `code.html`, `screen.png`, assets, fonts, and remote references.
- Decision: Treat `Design/sample-website-tut/` as immutable input. Store normalized templates, captured assets, manifests, generated contracts, and test case mappings under `design/tut-usa/` per Dark Factory design asset standards.
- Consequences: Processing is reversible and source references remain auditable.

## 2026-07-07 local - DEC-REB-003 - Seed reset must be opt-in and environment-guarded

- Status: Accepted (PO, 2026-07-07)
- Context: The request says to erase current seed data, but destructive deletion can damage non-demo data.
- Decision: Do not rewrite historical Flyway migrations. Implement a safe reset/reseed tool that deletes only deterministic TUT/demo seed records and requires an explicit confirmation flag/environment gate.
- Consequences: Local/QA demo data can be reset while production-like data is protected by default.

## 2026-07-07 local - DEC-REB-004 - Add Selenium as the rebuild automation framework without deleting Playwright first

- Status: Accepted (PO, 2026-07-07)
- Context: Existing automation is Playwright-only, while the new requirement asks for Selenium.
- Decision: Add a new Selenium package and coverage gates. Retain Playwright until equivalent Selenium coverage has passed QA and PO acceptance.
- Consequences: Test coverage is not reduced during framework transition.

## 2026-07-07 local - DEC-REB-005 - Temporarily disable automated `qa` and `po` role sessions; human plays both roles

- Status: Accepted (human, 2026-07-07)
- Context: The human explicitly requested that the `qa` and `po` Dark Factory roles be temporarily disabled and stated they will personally play both roles while implementation continues.
- Decision:
  - No agent session may execute the `qa` or `po` role (per `df/roles/qa.md`, `df/roles/po.md`) until this decision is reversed by a new decision record.
  - Delivery lanes (`backend-dev`, `frontend-dev`, `devops`, `data-engineer`) still move finished work to `READY_FOR_QA` as normal and still run their own validation/build gates — the override only removes the *automated* QA/PO agent sessions, not the delivery lane's own verification duty.
  - Tasks that reach `READY_FOR_QA`, `QA_IN_PROGRESS`, `READY_FOR_PO`, or `PO_REVIEW` must sit and wait; the human will review and transition them (to `QA_FAILED`/`RETURNED_TO_DEV` or `READY_FOR_PO`/`DONE`) manually, outside an automated role session.
  - The router/orchestrator must not auto-select `qa` or `po` as the "responsible role" for a task while this override is active; see `df/03-orchestration-rules.md`.
- Consequences: Delivery can proceed continuously without waiting for an automated QA/PO session, but nothing reaches `DONE` without explicit human review. Re-enable by adding a new decision record and removing the override note in `df/03-orchestration-rules.md`.
