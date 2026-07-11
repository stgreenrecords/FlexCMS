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

## 2026-07-07 local - DEC-REB-006 - Re-enable automated `qa` and `po` role sessions

- Status: Accepted (human, 2026-07-07)
- Context: The human requested to re-enable QA and PO so Dark Factory can resume normal automated review/acceptance routing.
- Decision:
  - Reverse `DEC-REB-005` and allow agent sessions to execute `qa` and `po` roles again.
  - Restore normal routing for tasks in `READY_FOR_QA`, `QA_IN_PROGRESS`, `READY_FOR_PO`, and `PO_REVIEW`.
  - Remove temporary-disable notices from role docs and orchestration rules.
- Consequences: Backlogged tasks waiting in QA/PO states can move forward through QA and PO sessions again; tasks may reach `DONE` through the standard workflow.

## 2026-07-07 local - DEC-DFCA-001 - Use Copilot Cloud Agent REST tasks as the target coding delegation path

- Status: Accepted (human, 2026-07-07)
- Context: The current Dark Factory automation can invoke the local GitHub Copilot CLI through `df/agent-router/run-role-session.bash`, but the human cannot use premium models there and requested a new architecture where the local factory loop launches/manages GitHub Copilot Cloud Agent tasks through the GitHub REST API.
- Decision:
  - Keep The Factory router as the task planner, state-machine authority, evidence recorder, CI/test monitor, review loop, and merge/next-task decision point.
  - Delegate coding role-session work to GitHub Copilot Cloud Agent tasks via the official public-preview GitHub REST API instead of making the local Copilot CLI the primary path.
  - Require the implementation to support prompt, task id, role, base branch, model choice, optional PR creation, lifecycle polling, CI/check monitoring, and sanitized evidence artifacts.
  - Keep `manual` and legacy local CLI/model adapters available as explicit fallback/rollback modes during initial rollout.
- Consequences: `DFCA-01` is routed to `devops` to implement an opt-in cloud-agent runner/client, dry-run tests, configuration docs, and reconciliation behavior. Public-preview API volatility and token-permission risk must be documented and isolated in the GitHub API client layer.

## 2026-07-07 local - DEC-DFCA-002 - Disable automated `po` role sessions until further notice

- Status: Accepted (human, 2026-07-07)
- Context: The human explicitly instructed the agent not to play QA and requested removing the PO role or at least disabling it until further notice.
- Decision:
  - Automated agents must not execute the `po` role until a later human decision reverses this record.
  - The router must not auto-select `po` for `REFINEMENT_QUESTIONS`, `READY_FOR_PO`, `PO_REVIEW`, or `PO_REJECTED`.
  - Tasks in PO-owned states wait for explicit human product direction; agents must not move tasks to `DONE` as product acceptance.
  - This decision does not authorize the current implementation session to perform QA. QA remains a separate role/session or human activity.
- Consequences: Work can still move through delivery and into `READY_FOR_QA`, but product acceptance is manual/human-only while this decision is active. `DEC-REB-006` is superseded only for the `po` role; automated QA routing is not changed by this decision.

## 2026-07-08 local - DEC-DF-007 - Permanently disable QA and PO in all modes; developer owns 100% test coverage

- Status: Accepted (human, 2026-07-08)
- Context: The human requested that the `qa` and `po` roles be permanently disabled for every operating mode, and that the delivery developer own verification end to end — designing test scenarios and writing, running, and fixing unit and Selenium automated tests to 100% coverage before reporting any work complete.
- Decision:
  - Supersede `DEC-REB-005`, `DEC-REB-006`, and `DEC-DFCA-002`. The `qa` and `po` roles are **permanently disabled in Mode A (autonomous) and Mode B (interactive)**. No agent may select, execute, or simulate them.
  - Retire the states `READY_FOR_QA`, `QA_IN_PROGRESS`, `QA_FAILED`, `READY_FOR_PO`, `PO_REVIEW`, and `PO_REJECTED`. No task may enter them.
  - The delivery lane is the terminal owner: it moves work directly from `DEV_IN_PROGRESS` to `DONE` after meeting the developer testing bar.
  - **Developer testing bar:** any new/changed functionality must be 100% covered, run, and fixed by the developer using unit tests and Selenium automation. The developer designs the test scenarios, writes the tests, runs them, and fixes until green. A task may not be reported complete until (1) 100% of the functionality is developed and a full application build runs with zero errors, (2) test scenarios covering 100% of the functionality are recorded in the task artifact folder, and (3) the unit/automated tests are implemented and run with 0 errors and the full build is 100% working. Do not write tests whose only purpose is to cover another test.
  - Unanswered product questions (`REFINEMENT_QUESTIONS`) go to a human via `BLOCKED`; agents do not answer them.
  - The router's objective gate now runs on the `DEV_IN_PROGRESS -> DONE` transition; a failing gate routes the task to `RETURNED_TO_DEV`.
- Consequences: No separate QA or PO stage exists. Delivery developers carry full verification responsibility and cannot report done without a green build and full test coverage. Reversing this requires a new decision record and restoring the retired states/roles across `df/00-start-here.md`, `df/01-operating-model.md`, `df/02-state-machine.md`, `df/03-orchestration-rules.md`, and the role files.

