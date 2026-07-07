testing# REB-17 Handoffs

## 2026-07-07 local — SA to manual QA / DevOps

- Task: `REB-17`
- Current state: `READY_FOR_QA`
- Previous role result: SA refined the user's request into a prioritized authoring E2E automation backlog and created delivery tasks `REB-18` through `REB-25`.
- Files/artifacts created:
  - `df/artifacts/REB-17/task.md`
  - `df/artifacts/REB-18/task.md`
  - `df/artifacts/REB-19/task.md`
  - `df/artifacts/REB-20/task.md`
  - `df/artifacts/REB-21/task.md`
  - `df/artifacts/REB-22/task.md`
  - `df/artifacts/REB-23/task.md`
  - `df/artifacts/REB-24/task.md`
  - `df/artifacts/REB-25/task.md`
  - `df/artifacts/REB-26/task.md`
  - `df/runtime/board.md`
  - `df/runtime/activity-log.md`
- Current authoring functionality mapped:
  - Content tree/page CRUD/status/version/schedule/bulk APIs and admin content/editor routes.
  - Publishing and replication verification expectations.
  - Workflow start/advance/cancel/list APIs and workflow admin route.
  - DAM upload/list/detail/stream/delete APIs and admin DAM routes.
  - Experience-fragment CRUD/variation APIs and admin XF route.
  - Live-copy create/rollout/detach/status APIs and editor inheritance controls.
  - PIM product/variant/asset/version/carryforward APIs and admin PIM routes.
  - Sites/translations/component-registry secondary admin routes.
- Required user-specific rules captured:
  - Page creation tests must verify the page was created, published, and available on the authoring environment.
  - Publishing tests must verify the authored change is visible on the publish environment.
  - Every generated sample-site UI component must have an E2E editing scenario or an explicit blocker/unsupported row in the component editing matrix.
- Checks performed:
  - Repository context read through Dark Factory boot sequence, `docs/FLEXCMS_BUSINESS_CONTEXT.md`, current board, `REB-00` solution design, current `REB-13` evidence, backend authoring controllers, admin routes, and Selenium authoring suite.
  - Documentation validation command is recorded in the activity log.
- Known risks:
  - `REB-18`–`REB-25` are delivery backlog items and may be blocked until `REB-11`/`REB-13` and other dependencies are accepted or otherwise explicitly overridden.
  - Some visible admin controls appear partially wired or placeholder-like; delivery tasks must classify these as unsupported UI/blockers versus product defects with evidence.
  - Publish-environment checks depend on a configured/running publish service and must not silently pass against author-only endpoints.
  - `REB-26` is intentionally exhaustive: current generated inventory is 406 components across 14 groups, so DevOps may need sharded/grouped execution while preserving one matrix row per component.
- Next role/action:
  - Manual human QA reviews `REB-17` planning artifact per `DEC-REB-005`.
  - DevOps can implement `REB-18`–`REB-26` when dependencies are satisfied or when the human explicitly authorizes proceeding under the same manual-review override used for current rebuild tasks.


## qa -> qa

- Timestamp: 2026-07-07 18:50 local
- Task: REB-17
- From state: READY_FOR_QA
- To state: READY_FOR_PO
- Lane: devops
- Summary: Implemented/used the Copilot Cloud Agent REST orchestration runner and recorded sanitized cloud status evidence.

## Evidence

- `df/agent-router/copilot-cloud-agent.py`
- `df/agent-router/copilot_cloud_agent.py`
- `df/artifacts/REB-17/cloud-agent-status.json`
- `df/artifacts/REB-17/cloud-agent-report.md`

## Tests/checks

| Check | Command/source | Result | Notes |
|---|---|---|---|
| Cloud agent REST runner | `python3 -m unittest df/agent-router/test_copilot_cloud_agent.py` | PASS | Deterministic unit tests; no live network required. |

## Known risks

- GitHub Copilot Cloud Agent API is public preview; verify endpoint/header values before live use.
- Live validation requires a paid Copilot plan and token permissions for the target repository.

## Next role instructions

- QA should inspect the runner, tests, docs, and generated dry-run/status artifacts.
- Live cloud-agent validation should be run only with a valid token and confirmed current GitHub API endpoint.

## Blockers

- None for dry-run/mock validation. Live validation remains environment-dependent.
