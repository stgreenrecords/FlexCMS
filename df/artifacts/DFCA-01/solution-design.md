# Solution Design - DFCA-01

## Scope

Introduce a Dark Factory orchestration path where the local router remains the loop controller, but coding work is delegated to GitHub Copilot Cloud Agent tasks through the official GitHub REST API instead of the local GitHub Copilot CLI.

This is an architecture and devops automation change. It does not change FlexCMS product runtime behavior.

## Current state

Repository evidence reviewed during SA session:

- `df/agent-router/start-factory.bash` owns the main loop, prompt building, state selection, quality gate invocation, worktree isolation, and `DF_AGENT_CMD` execution.
- `df/agent-router/run-role-session.bash` currently auto-detects local runners and has a first-class `copilot` runner that invokes the local `copilot` CLI with `--model`, `--mode`, `--allow-all`, and `--no-ask-user`.
- `agents/df-gh-agent.py` is a separate GitHub Models adapter that uses `gh models run`, applies file blocks locally, and protects shared board/activity-log writes.
- `df/agent-router/README.md` documents a generic `DF_AGENT_CMD <role> <task-id> <state> <prompt-file>` contract.

## Target architecture

```text
The Factory router
│
├── Task planner / state machine (`df/runtime/board.md`)
├── Prompt builder (`start-factory.bash`)
├── Cloud agent launcher (`df/agent-router/copilot-cloud-agent.*`)
├── GitHub REST API client
├── Cloud task / PR status store (`df/artifacts/{task-id}/cloud-agent-status.*`)
├── GitHub Actions / checks monitor
├── Rework, split, escalation, QA/PO routing decisions
└── Existing runtime evidence + handoff updates
        │
        ▼
GitHub repository
        │
        ▼
Copilot Cloud Agent creates branch / changes / optional PR
        │
        ▼
GitHub Actions runs tests
        │
        ▼
The Factory records result and decides next state
```

## Design principles

1. **Router remains authoritative.** GitHub cloud tasks execute work, but `df/runtime/board.md` and role handoffs remain the SDLC source of truth.
2. **One role per cloud task.** Each REST-created Copilot task must map to exactly one Dark Factory role-session and one task id.
3. **Cloud tasks do not self-approve.** Delivery cloud tasks may move to `READY_FOR_QA`; QA and PO remain separate role sessions unless a human explicitly overrides the process.
4. **REST client is isolated.** Public-preview API volatility must be contained in one client module/script rather than spread through the router.
5. **Dry-run first.** Request payload generation and routing logic must be testable without network calls.
6. **No secret leakage.** Token values and authorization headers must never appear in logs, artifacts, PR bodies, or error messages.

## Proposed implementation shape

### 1. Add a cloud-agent runner

Add a new runner under `df/agent-router/`, for example:

```text
df/agent-router/copilot-cloud-agent.py
```

or an equivalent Bash/Python wrapper. Python is preferred for JSON payload construction, polling, HTTP error handling, and unit tests.

The router should be able to call it through the existing contract:

```text
DF_AGENT_CMD='./df/agent-router/copilot-cloud-agent.py'
./start factory --adapter auto
```

The command still receives:

```text
<role> <task-id> <state> <prompt-file>
```

and stdin contains the same role prompt.

### 2. Add explicit configuration

Recommended environment variables:

| Variable | Purpose |
|---|---|
| `DF_AGENT_CMD` | Points to the cloud-agent runner. |
| `DF_COPILOT_CLOUD_DRY_RUN` | When true, write intended request/status artifacts without network calls. |
| `DF_GITHUB_TOKEN` / `GITHUB_TOKEN` | Token used for GitHub REST API calls. Prefer repo-scoped fine-grained credentials. |
| `DF_GITHUB_OWNER` | Repository owner/org override when it cannot be inferred from git remote. |
| `DF_GITHUB_REPO` | Repository name override when it cannot be inferred from git remote. |
| `DF_COPILOT_AGENT_MODEL` | Default Copilot Cloud Agent model. |
| `DF_COPILOT_AGENT_MODEL_<ROLE>` | Optional role-specific model override, e.g. `DF_COPILOT_AGENT_MODEL_BACKEND_DEV`. |
| `DF_COPILOT_AGENT_BASE_BRANCH` | Base branch for cloud-created work. Defaults to current main branch. |
| `DF_COPILOT_AGENT_CREATE_PR` | Whether the cloud agent should create/open a PR when supported. |
| `DF_COPILOT_AGENT_POLL_SECONDS` | Initial poll interval. |
| `DF_COPILOT_AGENT_TIMEOUT_SECONDS` | Max wait before marking the cloud task stalled/blocked. |
| `DF_COPILOT_AGENT_API_VERSION` | API version/header override for public-preview changes. |

### 3. REST API client responsibilities

The client must:

- verify the exact current GitHub Copilot Cloud Agent task API endpoint, preview headers, request schema, and response schema from official GitHub docs during implementation;
- create a cloud agent task with role prompt, base branch, model, repository, task title/name, and optional PR creation settings;
- persist a sanitized request summary and returned identifiers to `df/artifacts/{task-id}/cloud-agent-status.json`;
- poll task status until terminal status or timeout;
- discover the branch and PR number/URL when available;
- poll GitHub Actions/check suites for the branch or PR head SHA;
- write append-only human-readable evidence to `df/artifacts/{task-id}/cloud-agent-report.md`.

Avoid hard-coding undocumented endpoints in multiple places. If the public-preview endpoint changes, only the client layer should need updates.

### 4. Runtime reconciliation

For delivery lanes:

1. Router selects a task exactly as it does today.
2. Cloud runner creates one Copilot Cloud Agent task for the selected role/task.
3. Cloud agent pushes changes to its branch and optionally opens a PR.
4. Cloud runner waits for terminal cloud status and CI/check status.
5. If task and CI pass:
   - record branch/PR/check evidence;
   - move the Dark Factory task to the state expected for that role, usually `READY_FOR_QA` for delivery lanes;
   - hand off to `qa`.
6. If task fails, times out, or CI fails:
   - route according to existing semantics: `RETURNED_TO_DEV`, `QA_FAILED`, `PO_REJECTED`, or `BLOCKED` depending on current role/state;
   - increment or preserve the existing rework-cap logic;
   - include reproduction/error details in `cloud-agent-report.md` and `handoffs.md`.

For `sa`, `qa`, and `po` roles, decide during devops implementation whether to launch cloud tasks or keep local/manual execution. The minimum viable change should prioritize delivery-lane coding work, because the user explicitly needs premium model coding capability.

### 5. Branch and PR policy

Recommended default:

- Base branch: `main` or the current checked-out branch inferred by the runner, configurable via `DF_COPILOT_AGENT_BASE_BRANCH`.
- Cloud branch naming: `df/cloud/{task-id}/{role}` when the API allows naming, otherwise record the provider-generated branch.
- PR title: `DF {task-id}: {role} implementation`.
- PR body must include:
  - task id;
  - role;
  - implementation summary placeholder/instructions;
  - required test evidence section;
  - rollback notes;
  - link/path to `df/artifacts/{task-id}/`.

Merging remains out of scope for the first delivery unless CI and QA/PO acceptance handling are explicitly implemented. The safer first version may create PRs and leave merge decisions to the router/human.

### 6. State-machine impact

No new Dark Factory states are required for the first implementation. Store cloud status in artifacts, not state names.

Existing states remain authoritative:

- launch started: keep/move selected row to the appropriate `*_IN_PROGRESS` state when applicable;
- cloud success after delivery: `READY_FOR_QA`;
- cloud/CI failure: `RETURNED_TO_DEV` or `BLOCKED` depending on rework count and error class;
- QA/PO remain separate sessions.

### 7. Testing strategy

Devops implementation must include deterministic tests that do not require network access:

- payload construction from a sample prompt;
- model resolution defaults and role-specific overrides;
- repository owner/name/base branch inference;
- dry-run artifact generation;
- status polling state transitions using mocked HTTP responses;
- CI/check aggregation using mocked GitHub API responses;
- redaction of token/authorization data from logs and reports;
- timeout/rate-limit handling.

Manual/live validation should be documented separately and only run when a valid token and paid Copilot plan are available.

### 8. Security and privacy

- Use environment variables for tokens; do not read from checked-in files unless the existing local convention is explicitly preserved and `.gitignore` protects it.
- Redact `Authorization`, token values, cookies, and signed URLs from reports.
- Do not include private prompt secrets in PR text.
- Limit token permissions to repository and Copilot task creation needs; document exact scopes after confirming GitHub's public-preview requirements.

### 9. Rollback plan

- Keep the existing `manual` adapter unchanged.
- Keep local CLI runners as explicit fallback/legacy mode during initial rollout.
- Make the cloud path opt-in via `DF_AGENT_CMD` and/or `DF_AGENT_RUNNER='copilot-cloud'`.
- If the preview API breaks, set `DF_AGENT_CMD='./df/agent-router/run-role-session.bash'` or use `--adapter manual` while the client is updated.

## Delivery lane

Route to `devops` because this affects automation, orchestration, GitHub API integration, CI monitoring, and router documentation.

## Validation expectations for devops handoff

Minimum validation before moving to `READY_FOR_QA`:

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
python3 -m unittest discover -s df/agent-router -p '*test*.py'
./start factory --dry-run --task-id DFCA-01
```

If implementation touches shell scripts, add a syntax validation pass such as:

```bash
bash -n df/agent-router/start-factory.bash
bash -n df/agent-router/run-role-session.bash
```

If implementation changes frontend/backend product code unexpectedly, run the mandatory product gates from `AGENTS.md`; otherwise document why they are not applicable.

