# The Factory Architecture

This document describes the current FlexCMS Dark Factory architecture: how the local router controls the SDLC loop, how GitHub Copilot Cloud Agent tasks are launched, how evidence is recorded, and how role/state boundaries are enforced.

For operator commands and day-to-day usage, see `FACTORY-USER-MANUAL.md`.

## 1. Architecture goals

The Factory exists to run a traceable, role-separated SDLC loop for FlexCMS tasks.

Primary goals:

1. Keep the repository-local Dark Factory runtime as the source of truth.
2. Execute exactly one role per role-session.
3. Delegate implementation/review work to cloud or local AI runners without giving those runners authority over the whole SDLC.
4. Preserve evidence for every state transition.
5. Keep QA and PO gates distinct from development work.
6. Allow deterministic local gates to override agent claims.
7. Use GitHub Copilot Cloud Agent for remote coding/review work while the local router remains the loop controller.

Non-goals:

- The Factory is not a replacement for Git history, CI, or human review.
- The Factory does not make product decisions without recorded authority.
- Automated `po` acceptance is currently disabled and must not be inferred from QA or agent output.

## 2. High-level system view

```text
Human operator
    │
    ▼
call-start-factory.bash / ./start factory
    │
    ▼
df/agent-router/start-factory.bash
    │
    ├── reads df/runtime/board.md
    ├── selects next actionable task
    ├── resolves responsible role
    ├── builds one role-session prompt
    ├── invokes DF_AGENT_CMD
    ├── validates state changes / gates
    ├── regenerates derived subboards
    └── repeats until stop condition
    │
    ▼
DF_AGENT_CMD = df/agent-router/copilot-cloud-agent.py
    │
    ├── reads role/task/prompt context
    ├── resolves GitHub repo and model
    ├── creates GitHub Agent Task via REST
    ├── polls task status
    ├── polls branch/PR/CI evidence when available
    ├── writes df/artifacts/{task-id}/cloud-agent-*.{json,md}
    └── updates local board/activity/handoff evidence
    │
    ▼
GitHub REST API
    │
    ├── /agents/repos/{owner}/{repo}/tasks
    ├── repository branches / PRs
    └── checks / statuses
```

## 3. Repository components

### 3.1 Router entrypoints

| File | Responsibility |
|---|---|
| `start` | Human-friendly project command wrapper. |
| `call-start-factory.bash` | Loads `.df-factory.env` and calls the router. |
| `df/agent-router/start-factory.bash` | Main loop, task selection, role prompt generation, adapter invocation, quality gate coordination, stop conditions. |
| `df/agent-router/state-role-map.bash` | State-to-role mapping and selection ranking. |
| `df/agent-router/board-parser.bash` | Markdown board parsing helpers. |
| `df/agent-router/quality-gate.bash` | Router-enforced objective gate and state mutation helpers. |
| `df/agent-router/render-subboards.bash` | Regenerates lane-specific derived boards. |
| `df/agent-router/worktree-manager.bash` | Optional delivery-lane git worktree isolation. |

### 3.2 Cloud Agent runner

| File | Responsibility |
|---|---|
| `df/agent-router/copilot-cloud-agent.py` | Executable wrapper for the Cloud Agent runner. |
| `df/agent-router/copilot_cloud_agent.py` | Importable Python implementation of GitHub Agent Tasks integration. |
| `df/agent-router/test_copilot_cloud_agent.py` | Unit tests for payload generation, model fallback, token loading, dry-run behavior, polling, CI aggregation, and redaction. |

### 3.3 Runtime files

| File | Responsibility |
|---|---|
| `df/runtime/board.md` | Live task queue and authoritative current state. |
| `df/runtime/activity-log.md` | Append-only record of role actions and policy changes. |
| `df/runtime/decisions.md` | Accepted decisions, including disabled PO automation. |
| `df/runtime/risks.md` | Known risks/blockers. |
| `df/runtime/*-board.md` | Generated lane views. Do not hand-edit. |

### 3.4 Task artifacts

Each task stores evidence under:

```text
df/artifacts/{task-id}/
```

Common files:

| File | Responsibility |
|---|---|
| `task.md` | Scope, acceptance criteria, dependencies, risk, role history. |
| `solution-design.md` | SA-owned architecture/design where required. |
| `handoffs.md` | Role-to-role handoffs and next instructions. |
| `cloud-agent-status.json` | Machine-readable Cloud Agent run status. |
| `cloud-agent-report.md` | Human-readable Cloud Agent run report. |
| `qa-report.md` | QA-owned verification report. |
| `po-review.md` | PO-owned acceptance/rejection evidence; currently human/manual-only. |

## 4. Control plane versus work plane

The Factory separates the control plane from the work plane.

### Control plane

The control plane is local repository state:

```text
df/runtime/
df/artifacts/
df/agent-router/
```

It decides:

- which task is next;
- which role owns the current state;
- what evidence is required;
- whether a state transition is acceptable;
- when the loop stops.

### Work plane

The work plane can be:

1. local model/CLI execution;
2. GitHub Copilot Cloud Agent tasks;
3. manual sessions;
4. optional git worktrees for delivery lanes.

The work plane may produce code, artifacts, PRs, or reports, but it does not replace the local board as the SDLC authority.

## 5. State machine and role routing

The state machine is defined in `df/02-state-machine.md`.

The router maps states to roles through `df/agent-router/state-role-map.bash`.

Current automated routing:

| State | Automated owner |
|---|---|
| `OPEN` | `sa` |
| `INTAKE` | `sa` |
| `REFINEMENT_IN_PROGRESS` | `sa` |
| `REFINED` | `sa` |
| `NEEDS_ARCHITECTURE` | `sa` |
| `ARCHITECTURE_IN_PROGRESS` | `sa` |
| `READY_FOR_DESIGN` | `designer` |
| `DESIGN_IN_PROGRESS` | `designer` |
| `READY_FOR_DEV` | delivery lane from board owner |
| `DEV_IN_PROGRESS` | delivery lane from board owner |
| `RETURNED_TO_DEV` | delivery lane from board owner |
| `READY_FOR_QA` | `qa` |
| `QA_IN_PROGRESS` | `qa` |
| `QA_FAILED` | `qa` |

Manual or disabled routing:

| State | Behavior |
|---|---|
| `REFINEMENT_QUESTIONS` | Human/product input required. |
| `READY_FOR_PO` | Human PO review required. |
| `PO_REVIEW` | Human PO review required. |
| `PO_REJECTED` | Human/product rerouting required. |
| `DONE` | Terminal. |
| `BLOCKED` | Terminal until manually unblocked or dependencies become done and SA reroutes. |

## 6. PO-disabled architecture

Automated PO is disabled by `DEC-DFCA-002`.

Implementation points:

- `df/roles/po.md` contains a disabled-role banner.
- `df/03-orchestration-rules.md` contains an active override section.
- `df/agent-router/state-role-map.bash` returns no role for PO-owned states.
- Router regression tests expect successful automation to stop at `READY_FOR_PO`, not `DONE`.

This prevents automated product acceptance and enforces manual/human product authority.

## 7. GitHub Cloud Agent integration

### 7.1 API endpoint

The current Cloud Agent runner uses GitHub Agent Tasks API:

```text
POST /agents/repos/{owner}/{repo}/tasks
GET  /agents/repos/{owner}/{repo}/tasks
GET  /agents/repos/{owner}/{repo}/tasks/{task-id}
```

The endpoint is configurable through:

```dotenv
DF_COPILOT_AGENT_CREATE_ENDPOINT='/agents/repos/{owner}/{repo}/tasks'
DF_COPILOT_AGENT_API_BASE='https://api.github.com'
DF_COPILOT_AGENT_API_VERSION='2022-11-28'
DF_COPILOT_AGENT_ACCEPT='application/vnd.github+json'
```

### 7.2 Request payload

For live calls, the runner sends the documented minimal task payload:

```json
{
  "prompt": "...role-session prompt...",
  "base_ref": "main",
  "model": "gpt-5.3-codex",
  "create_pull_request": true
}
```

Local status artifacts may include additional metadata such as role, task id, state, and branch hints. These are for Factory evidence and are not necessarily sent to GitHub.

### 7.3 Prompt structure

The prompt includes:

- repository owner/name;
- role short name;
- task id;
- current state;
- base branch;
- one-role-only instructions;
- QA/PO separation guardrails;
- the router-generated role-session prompt.

The prompt explicitly tells delivery agents not to self-approve QA or PO.

### 7.4 Status polling

The runner polls until GitHub reports a terminal status or timeout.

Recognized success-like statuses:

```text
completed, complete, succeeded, success, done, ready_for_review
```

Recognized failure-like statuses:

```text
failed, failure, cancelled, canceled, error, timed_out, timeout
```

Non-terminal statuses include:

```text
queued, pending, in_progress, running, created, started, waiting, idle, waiting_for_user
```

### 7.5 CI/check aggregation

When branch or SHA information is available, the runner queries GitHub checks/status APIs and records summary under `ci` in `cloud-agent-status.json`.

If `DF_COPILOT_AGENT_REQUIRE_CI=true`, missing CI can become blocking. If false, missing checks are recorded but not necessarily blocking.

## 8. Model routing architecture

The runner resolves models in this order:

1. `DF_COPILOT_AGENT_MODEL_<ROLE>`
2. `DF_COPILOT_AGENT_MODEL`
3. `DF_AGENT_MODEL`
4. built-in fallback

Role env names normalize `-` to `_`, for example:

```dotenv
DF_COPILOT_AGENT_MODEL_BACKEND_DEV='GPT-5.3-Codex'
DF_COPILOT_AGENT_MODEL_DATA_ENGINEER='GPT-5.3-Codex'
DF_COPILOT_AGENT_MODEL_QA='gpt-5-mini'
```

Known aliases are normalized before sending to GitHub, for example:

```text
GPT-5.3-Codex -> gpt-5.3-codex
GPT-5.2-Codex -> gpt-5.2-codex
GPT-5 mini    -> gpt-5-mini
GPT-5.4       -> gpt-5.4
```

If GitHub rejects a requested model with a model-not-found/model-not-enabled error, the runner retries without the `model` field so GitHub can use auto model selection.

## 9. Authentication and secret handling

Token lookup order:

1. `DF_GITHUB_TOKEN`
2. `GITHUB_TOKEN`
3. `GH_TOKEN`
4. `DF_GITHUB_TOKEN_COMMAND`

Default token command:

```dotenv
DF_GITHUB_TOKEN_COMMAND='gh auth token'
```

Secret handling rules:

- tokens are not printed by the runner;
- token-like values are redacted from status/report artifacts;
- fields named like `authorization`, `token`, `secret`, `cookie`, `password`, or `credential` are redacted;
- a PAT must not be committed to `.df-factory.env`, runtime files, artifacts, or logs.

## 10. Quality gates

The router can enforce a deterministic quality gate through:

```dotenv
DF_GATE_CMD='python3 agents/factory.py validate'
```

When a delivery role claims `READY_FOR_QA`, the router runs the gate. If it fails, the router overrides the agent's claim and returns work to development/rework.

This gate is router-owned, not model-owned.

## 11. Worktree isolation

Delivery lanes can run in isolated git worktrees.

Config:

```dotenv
DF_WORKTREES='0'
```

Current local config disables worktrees. If enabled, each delivery task uses a branch/worktree like:

```text
df/task/{task-id}
.df-worktrees/{task-id}
```

The router integrates task code only after a passing gate.

## 12. Runtime data flow

A typical delivery-lane run:

```text
READY_FOR_DEV
    │
    ▼
Router selects task and owner lane
    │
    ▼
Cloud Agent task created with role prompt
    │
    ▼
Cloud Agent produces branch/PR
    │
    ▼
Runner polls task and checks
    │
    ▼
Runner writes cloud-agent-status/report
    │
    ▼
Router/gate confirms or rejects transition
    │
    ▼
READY_FOR_QA or RETURNED_TO_DEV/BLOCKED
```

A typical QA run:

```text
READY_FOR_QA
    │
    ▼
Router selects qa
    │
    ▼
Cloud Agent task created with QA prompt/model
    │
    ▼
QA evidence is expected in task artifacts
    │
    ▼
READY_FOR_PO if QA passes
    │
    ▼
Manual human PO review because automated PO is disabled
```

## 13. Failure handling

### 13.1 Endpoint failure

Example:

```text
404 Not Found
```

Likely cause: wrong public-preview endpoint.

Correct current endpoint:

```text
/agents/repos/{owner}/{repo}/tasks
```

### 13.2 Model failure

Example:

```text
model not found or not enabled for user
```

The runner retries without `model`. If it still fails, the task is marked according to role/state failure rules and evidence is written.

### 13.3 API failure and board safety

API error messages can contain newlines or JSON. The runner sanitizes board cell text to avoid corrupting the Markdown board table:

- whitespace collapses to a single space;
- pipe characters are replaced;
- long messages are truncated.

Full error details remain in `cloud-agent-status.json` and `cloud-agent-report.md`.

### 13.4 Stalls

The router stops if a role-session returns without a board change or exits non-zero. The task is marked stalled for that router process so independent tasks can continue.

## 14. Stop conditions

The loop stops when:

- max iterations reached;
- no actionable task remains;
- all remaining tasks are blocked/manual-only;
- a session stalls;
- a task reaches the rework cap;
- continuing would risk data loss, secrets, or policy violation.

## 15. Test architecture

Factory/router tests are split across Bash and Python.

Python:

```text
df/agent-router/test_copilot_cloud_agent.py
```

Covers:

- payload construction;
- model aliasing;
- model fallback;
- token command fallback;
- redaction;
- dry-run artifacts;
- polling transitions;
- CI aggregation;
- board updates.

Bash:

```text
df/agent-router/test-router-selection.bash
df/agent-router/test-quality-gate.bash
df/agent-router/test-worktree.bash
```

Covers:

- task selection;
- blocked dependency behavior;
- quality gate override;
- rework cap;
- PO-disabled stop at `READY_FOR_PO`;
- worktree integration and failure preservation.

## 16. Deployment and commit boundary

GitHub Cloud Agent runs against the remote repository, not uncommitted local files.

Therefore any Factory code change must be committed and pushed before a cloud-agent task can rely on it.

Recommended sequence:

```zsh
git --no-pager status --short
python3 -m unittest discover -s df/agent-router -p '*test*.py'
bash df/agent-router/test-router-selection.bash
bash df/agent-router/test-quality-gate.bash
bash df/agent-router/test-worktree.bash
git add -A
git commit -m "feat(<TASK-ID>): description"
git push origin main
```

## 17. Security architecture

Security boundaries:

- local runner owns token usage;
- GitHub owns cloud task execution;
- local `df/runtime/` owns SDLC state;
- human owns PO acceptance;
- deterministic gates own build/test truth.

Security rules:

1. Never commit a PAT.
2. Prefer `gh auth token` over token files.
3. Redact token-like strings from artifacts.
4. Treat public-preview API errors as non-secret unless they contain request headers/body secrets.
5. Rotate any PAT that was pasted into chat or logs.

## 18. Current known limitations

1. GitHub Agent Tasks API is public preview and can change.
2. Model availability depends on GitHub plan/org policy.
3. PO is manual-only and will stop full automation at `READY_FOR_PO`.
4. The cloud runner depends on GitHub returning enough task/branch/PR metadata to poll checks reliably.
5. If GitHub creates a task from an older remote commit, push local Factory changes first and start a new task.

## 19. Extension points

Future improvements can add:

- richer GraphQL issue-assignment support;
- automatic PR discovery when task response omits PR details;
- automatic PR review comments with Factory evidence links;
- stronger CI wait/retry policies;
- a dashboard over `df/runtime/board.md` and cloud-agent status files;
- a human PO command that records acceptance without enabling automated PO.

## 20. Relationship to user manual

Use this file for architecture and implementation reasoning.

Use `FACTORY-USER-MANUAL.md` for commands and operator workflows.

