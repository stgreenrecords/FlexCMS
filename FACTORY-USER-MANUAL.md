# The Factory User Manual

This manual is for a human operator who wants to start, observe, and control the FlexCMS Dark Factory loop from the terminal.

For implementation architecture and component boundaries, see `FACTORY-ARCHITECTURE.md`.

## 1. What The Factory does

The Factory is an autonomous SDLC loop stored under `df/`. It:

1. reads `df/runtime/board.md`;
2. selects the highest-priority actionable task;
3. resolves the responsible role from the task state;
4. launches exactly one role-session at a time;
5. records evidence under `df/artifacts/{task-id}/` and `df/runtime/`; and
6. repeats until a stop condition is reached.

The main runtime source of truth is:

```text
df/runtime/board.md
```

Task evidence is stored under:

```text
df/artifacts/{task-id}/
```

## 2. Current FlexCMS operating mode

FlexCMS currently uses the GitHub Copilot Cloud Agent REST runner:

```dotenv
DF_AGENT_CMD='./df/agent-router/copilot-cloud-agent.py'
```

The runner creates GitHub agent tasks through the GitHub REST API:

```text
POST https://api.github.com/agents/repos/{owner}/{repo}/tasks
```

The current repository target is:

```dotenv
DF_GITHUB_OWNER='stgreenrecords'
DF_GITHUB_REPO='FlexCMS'
DF_COPILOT_AGENT_BASE_BRANCH='main'
DF_COPILOT_AGENT_CREATE_PR='true'
```

The current model routing is:

| Role | Model config |
|---|---|
| `sa` | `Gemini 2.5 Pro` |
| `backend-dev` | `GPT-5.3-Codex` |
| `frontend-dev` | `GPT-5.3-Codex` |
| `devops` | `GPT-5.3-Codex` |
| `data-engineer` | `GPT-5.3-Codex` |
| `qa` | `gpt-5-mini` |
| `po` | disabled |

Important: GitHub may reject model names that are not enabled for your account, plan, or organization. The runner normalizes known model aliases and retries with GitHub auto model selection if GitHub rejects a requested model.

## 3. PO role is disabled

Per `DEC-DFCA-002`, automated `po` role sessions are disabled until a human explicitly re-enables them.

This means:

- no automated product acceptance;
- no automated transition to `DONE`;
- `READY_FOR_PO`, `PO_REVIEW`, `PO_REJECTED`, and `REFINEMENT_QUESTIONS` are not auto-selected by the router;
- tasks that reach `READY_FOR_PO` wait for manual human product review.

QA is still a separate role unless a human disables it separately.

## 4. Main files

| File | Purpose |
|---|---|
| `df/runtime/board.md` | Live task queue and task states. |
| `df/runtime/activity-log.md` | Append-only runtime log. |
| `df/runtime/decisions.md` | Accepted product/process decisions. |
| `df/runtime/risks.md` | Known risks/blockers. |
| `df/artifacts/{task-id}/task.md` | Task definition and acceptance criteria. |
| `df/artifacts/{task-id}/handoffs.md` | Role-to-role handoffs. |
| `df/artifacts/{task-id}/cloud-agent-status.json` | Machine-readable GitHub cloud-agent status. |
| `df/artifacts/{task-id}/cloud-agent-report.md` | Human-readable GitHub cloud-agent run report. |
| `df/agent-router/start-factory.bash` | Main router loop. |
| `df/agent-router/copilot-cloud-agent.py` | Executable Copilot Cloud Agent REST runner. |
| `df/agent-router/copilot_cloud_agent.py` | Importable Python implementation and tests target. |
| `.df-factory.env` | Local Factory configuration. |

## 5. Prerequisites

Before running The Factory:

1. Work from the repository root.
2. Ensure the latest Factory code is committed and pushed to GitHub.
3. Ensure GitHub CLI authentication works.
4. Ensure `df/runtime/board.md` contains actionable tasks.
5. Understand that the Factory can create GitHub Cloud Agent tasks and PRs.
6. Do not store PATs in files.

Recommended checks:

```zsh
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
git --no-pager status --short
gh auth status
gh api /repos/stgreenrecords/FlexCMS --jq '.full_name + " default_branch=" + .default_branch'
gh api /agents/repos/stgreenrecords/FlexCMS/tasks >/dev/null && echo "agent tasks API reachable"
```

## 6. Authentication

The cloud runner finds a GitHub token in this order:

1. `DF_GITHUB_TOKEN`
2. `GITHUB_TOKEN`
3. `GH_TOKEN`
4. `DF_GITHUB_TOKEN_COMMAND`

Default token command:

```dotenv
DF_GITHUB_TOKEN_COMMAND='gh auth token'
```

This means a working `gh auth login` is enough for normal use. The token is not printed or written by the runner.

Do not commit tokens. If a PAT was pasted into chat or logs, rotate it after testing.

## 7. Dry-run commands

Dry-run the whole Factory plan without launching cloud tasks:

```zsh
./call-start-factory.bash --dry-run
```

Dry-run a specific task:

```zsh
./call-start-factory.bash --dry-run --task-id DFCA-01
```

Run a no-network cloud-agent dry-run directly:

```zsh
DF_SESSION_ROOT=/Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS \
DF_COPILOT_CLOUD_DRY_RUN=true \
DF_GITHUB_OWNER=stgreenrecords \
DF_GITHUB_REPO=FlexCMS \
DF_COPILOT_AGENT_BASE_BRANCH=main \
DF_COPILOT_AGENT_MODEL=gpt-5.3-codex \
python3 df/agent-router/copilot-cloud-agent.py \
  devops DFCA-01 DEV_IN_PROGRESS df/artifacts/DFCA-01/task.md
```

## 8. Start the real Factory loop

Run one bounded iteration first:

```zsh
DF_COPILOT_AGENT_TIMEOUT_SECONDS=900 \
DF_COPILOT_AGENT_POLL_SECONDS=30 \
./call-start-factory.bash --adapter auto --max-iterations 1
```

Run a specific task for one iteration:

```zsh
DF_COPILOT_AGENT_TIMEOUT_SECONDS=900 \
DF_COPILOT_AGENT_POLL_SECONDS=30 \
./call-start-factory.bash --adapter auto --task-id DFCA-01 --max-iterations 1
```

Run the real loop for 50 iterations:

```zsh
DF_COPILOT_AGENT_TIMEOUT_SECONDS=900 \
DF_COPILOT_AGENT_POLL_SECONDS=30 \
./call-start-factory.bash --adapter auto --max-iterations 50
```

The loop stops earlier if there are no actionable tasks, all remaining work is blocked/manual-only, an iteration stalls, or the max-iteration cap is reached.

## 9. Run in the background

From a terminal:

```zsh
DF_COPILOT_AGENT_TIMEOUT_SECONDS=900 \
DF_COPILOT_AGENT_POLL_SECONDS=30 \
./call-start-factory.bash --adapter auto --max-iterations 50 \
  > .factory-run.log 2>&1 &
```

Monitor it:

```zsh
tail -f .factory-run.log
```

Find it:

```zsh
ps aux | grep '[s]tart-factory\|[c]all-start-factory'
```

Stop it:

```zsh
kill <pid>
```

## 10. What a successful cloud-agent run records

For each task, inspect:

```zsh
cat df/artifacts/<task-id>/cloud-agent-status.json
tail -n 80 df/artifacts/<task-id>/cloud-agent-report.md
tail -n 120 df/artifacts/<task-id>/handoffs.md
```

Expected fields in `cloud-agent-status.json` include:

```json
{
  "cloud_task_id": "...",
  "status": "queued | in_progress | completed | failed | ...",
  "branch": "...",
  "pr_url": "...",
  "ci": {
    "state": "success | failure | pending | not_found"
  },
  "next_state": "..."
}
```

## 11. Monitor the board and runtime log

Inspect the active board:

```zsh
sed -n '1,120p' df/runtime/board.md
```

Inspect one task:

```zsh
grep 'DFCA-01' df/runtime/board.md
```

Inspect recent runtime actions:

```zsh
tail -n 120 df/runtime/activity-log.md
```

Inspect decisions and risks:

```zsh
cat df/runtime/decisions.md
cat df/runtime/risks.md
```

## 12. Monitor GitHub

List GitHub agent tasks:

```zsh
gh api /agents/repos/stgreenrecords/FlexCMS/tasks
```

List PRs:

```zsh
gh pr list --repo stgreenrecords/FlexCMS
```

View a PR:

```zsh
gh pr view <number> --repo stgreenrecords/FlexCMS --web
```

Check GitHub Actions:

```zsh
gh run list --repo stgreenrecords/FlexCMS --limit 10
```

## 13. Validation commands

Factory/router validation:

```zsh
python3 -m unittest df/agent-router/test_copilot_cloud_agent.py
python3 -m unittest discover -s df/agent-router -p '*test*.py'

bash -n df/agent-router/start-factory.bash
bash -n df/agent-router/run-role-session.bash
bash -n df/agent-router/state-role-map.bash

bash df/agent-router/test-router-selection.bash
bash df/agent-router/test-quality-gate.bash
bash df/agent-router/test-worktree.bash
```

FlexCMS product validation is separate:

```zsh
cd flexcms && mvn clean compile
cd flexcms && mvn test
cd frontend && pnpm install && pnpm build
```

Use product validation when product code changed. For Factory/router-only changes, the Factory/router validation suite is the fast relevant gate.

## 14. Commit and push before relying on GitHub Cloud Agent

GitHub Cloud Agent sees the remote repository, not your uncommitted local files.

Before starting a real cloud-agent loop, commit and push Factory changes:

```zsh
git --no-pager status --short
git add -A
git commit -m "feat(<TASK-ID>): description"
git push origin main
```

Latest known Factory integration commit:

```text
e443b14 feat(DFCA-01): add Copilot cloud agent factory runner
```

## 15. Common failure modes

### `404 Not Found`

Usually wrong endpoint. Current endpoint is:

```text
/agents/repos/{owner}/{repo}/tasks
```

Not:

```text
/repos/{owner}/{repo}/copilot/coding-agent/tasks
```

### `model not found or not enabled for user`

The requested model is unavailable for your account/org. The runner retries without the model field so GitHub can auto-select. You can also set a known-supported model in `.df-factory.env`.

Known examples from GitHub docs at the time of implementation:

```text
claude-sonnet-4.6
claude-opus-4.6
gpt-5.2-codex
gpt-5.3-codex
gpt-5.4
claude-sonnet-4.5
claude-opus-4.5
```

### `401 Authentication required`

Check:

```zsh
gh auth status
gh auth token >/dev/null && echo ok
```

### `403 Insufficient permissions`

The token/user likely lacks permissions. Fine-grained PATs may need read/write access to metadata, actions, contents, issues, and pull requests depending on the GitHub preview API behavior.

### No actionable tasks

Run:

```zsh
./call-start-factory.bash --dry-run
```

If tasks are in `READY_FOR_PO`, they will not be selected because PO is disabled.

### Task got blocked by an API configuration issue

Inspect:

```zsh
cat df/artifacts/<task-id>/cloud-agent-status.json
grep '<task-id>' df/runtime/board.md
```

After fixing configuration, move the task back to the correct actionable state only with documented evidence.

## 16. Safe operating rules

- Do not paste PATs into committed files.
- Do not let agents perform PO while `DEC-DFCA-002` is active.
- Commit and push Factory changes before expecting GitHub Cloud Agent to use them.
- Start with `--max-iterations 1` before a long run.
- Use `--task-id <id>` for controlled tests.
- Inspect artifacts after every cloud-agent failure.
- Rotate any PAT that was exposed in chat or logs.
