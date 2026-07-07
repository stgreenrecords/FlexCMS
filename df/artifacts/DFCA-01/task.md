# Task - DFCA-01

## Summary

Replace the Dark Factory local GitHub Copilot CLI execution path with a GitHub REST API driven Copilot Cloud Agent orchestration adapter.

## Type

Task

## Priority

P0

## Current state

READY_FOR_QA

## Business goal

Enable The Factory to use paid-plan Copilot Cloud Agent tasks with selectable premium models instead of being limited by local Copilot CLI model availability, while preserving Dark Factory role isolation, evidence, QA gates, and PO acceptance controls.

## Acceptance criteria

- [x] AC1: The router has a new cloud-agent launcher path that delegates coding role sessions to GitHub Copilot Cloud Agent through the official public-preview REST API instead of invoking the local `copilot` CLI.
- [x] AC2: Each launched cloud task includes the Dark Factory role prompt, task id, current state, base branch, requested model, target repository, and explicit instruction to update task artifacts/runtime evidence in its branch or PR.
- [x] AC3: The orchestrator records the cloud task id, branch, PR URL/number when available, lifecycle status, and last poll/error details under `df/artifacts/{task-id}/` without logging secrets.
- [x] AC4: The control loop can poll cloud-agent task completion and GitHub Actions/CI status, then decide pass, retry/rework, split/escalate, or route to QA/PO using existing state-machine semantics and rework caps.
- [x] AC5: The implementation preserves one Dark Factory role per session and does not let one cloud task self-approve QA/PO for its own delivery work.
- [x] AC6: Configuration documentation covers required environment variables, GitHub token scope/permission expectations, model selection, optional PR creation, base branch selection, dry-run behavior, rate-limit handling, and public-preview API volatility.
- [x] AC7: A dry-run/mock mode validates request payload construction, state transitions, polling logic, and failure handling without making network calls; local deterministic tests pass.

## Out of scope

- Rewriting FlexCMS product code.
- Removing the `manual` adapter.
- Deleting all legacy CLI runners in the first delivery step; they may remain as explicit fallback/legacy modes while the cloud path is stabilized.
- Bypassing GitHub Actions or existing local validation gates.

## Assumptions

- The human has access to a paid Copilot plan and repository permissions that allow Copilot Cloud Agent task creation through the GitHub REST API.
- The Copilot Cloud Agent task API is public preview and may require endpoint/header adjustments during implementation.
- The implementation should verify the exact current GitHub API endpoint and request/response schema from official docs before coding hard-coded endpoint paths.
- Local routing remains the source of truth for Dark Factory state transitions; GitHub PRs/branches are execution artifacts, not the SDLC authority.

## Dependencies

- none

## Risks

- Public-preview REST API behavior may change, breaking automation until the client is updated.
- Token permissions may be broader than local CLI auth; secrets must never be printed or committed.
- Cloud branches/PRs can diverge from local `df/runtime/` state if merge/reconciliation rules are not explicit.
- CI latency/rate limits can slow the factory loop; polling must use backoff and clear timeout states.

## Links

- Issue: n/a
- PR: n/a
- Design: `df/artifacts/DFCA-01/solution-design.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-07-07 local | sa | READY_FOR_DEV | Created architecture, acceptance criteria, and devops handoff for Copilot Cloud Agent REST orchestration. |
| 2026-07-07 local | devops | READY_FOR_QA | Implemented opt-in Copilot Cloud Agent REST runner, wrapper integration, dry-run/mock tests, docs, sanitized evidence, and QA handoff. |

