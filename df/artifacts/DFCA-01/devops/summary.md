# DFCA-01 DevOps Summary

## Implementation summary

Implemented an opt-in GitHub Copilot Cloud Agent REST orchestration path for The Factory while keeping the existing local/manual adapters available for rollback.

## Files changed

- `df/agent-router/copilot_cloud_agent.py` — importable Python REST runner/client for one Dark Factory role-session.
- `df/agent-router/copilot-cloud-agent.py` — executable wrapper for direct `DF_AGENT_CMD` usage.
- `df/agent-router/test_copilot_cloud_agent.py` — deterministic unit tests with mocked/dry-run behavior and no live network requirement.
- `df/agent-router/run-role-session.bash` — added opt-in `DF_AGENT_RUNNER='copilot-cloud'` dispatch path.
- `df/agent-router/README.md` — documented cloud-agent configuration, dry-run behavior, CI monitoring, evidence files, and rollback.
- `.df-factory.env.example` — added commented cloud-agent configuration block.
- `df/artifacts/DFCA-01/cloud-agent-status.json` — generated no-network dry-run status evidence.
- `df/artifacts/DFCA-01/cloud-agent-report.md` — generated no-network dry-run report evidence.

## Acceptance criteria mapping

| AC | Result | Evidence |
|---|---|---|
| AC1 | PASS | `copilot-cloud-agent.py` / `copilot_cloud_agent.py` create a REST-based launcher path; `run-role-session.bash` supports `DF_AGENT_RUNNER='copilot-cloud'`; local Copilot CLI remains fallback only. |
| AC2 | PASS | `build_create_payload()` includes prompt, task id, role/state, base branch, model, repository, target branch, PR settings, and artifact/handoff instructions. |
| AC3 | PASS | Runner writes sanitized `cloud-agent-status.json` and append-only `cloud-agent-report.md` with task id, branch, PR fields, lifecycle status, CI state, and notes. |
| AC4 | PASS | `poll_cloud_task()` and `aggregate_ci()` implement lifecycle and GitHub check/status polling; next-state decisions route success to QA and failures to rework/blocking states. |
| AC5 | PASS | Prompt and PR body explicitly forbid cloud task self-approval; delivery roles route to `READY_FOR_QA`, not `DONE`. |
| AC6 | PASS | `df/agent-router/README.md` and `.df-factory.env.example` document environment variables, model selection, PR/base branch options, dry-run, rate/timeout settings, CI requirement, preview headers, endpoint override, and rollback. |
| AC7 | PASS | Unit tests cover payloads, model overrides, repo parsing, dry-run artifacts, polling transitions, CI aggregation, live-success reconciliation with mocked client, and secret redaction. |

## Validation evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Focused unit tests | `python3 -m unittest df/agent-router/test_copilot_cloud_agent.py` | PASS | 10 tests. |
| Router Python test discovery | `python3 -m unittest discover -s df/agent-router -p '*test*.py'` | PASS | 10 tests. |
| Shell syntax | `bash -n df/agent-router/start-factory.bash && bash -n df/agent-router/run-role-session.bash` | PASS | No syntax errors. |
| Python compile | `python3 -m py_compile df/agent-router/copilot_cloud_agent.py df/agent-router/copilot-cloud-agent.py` | PASS | No syntax errors. |
| Direct cloud dry-run | `DF_COPILOT_CLOUD_DRY_RUN=true ... python3 df/agent-router/copilot-cloud-agent.py devops DFCA-01 DEV_IN_PROGRESS df/artifacts/DFCA-01/task.md` | PASS | Generated sanitized status/report; no network calls. |
| Wrapper cloud dry-run | `DF_AGENT_RUNNER=copilot-cloud DF_COPILOT_CLOUD_DRY_RUN=true ... bash df/agent-router/run-role-session.bash devops DFCA-01 DEV_IN_PROGRESS df/artifacts/DFCA-01/task.md` | PASS | Validated opt-in wrapper path. |
| Existing router regression | `bash df/agent-router/test-router-selection.bash && bash df/agent-router/test-quality-gate.bash && bash df/agent-router/test-worktree.bash` | PASS | Existing router behavior unchanged. |
| Router plan | `./start factory --dry-run --task-id DFCA-01` | PASS | Selects `devops`, task `DFCA-01`, state `DEV_IN_PROGRESS`. |
| IDE diagnostics | Editor diagnostics for changed implementation/docs files | PASS | No errors found. |

## Live validation status

Live GitHub Copilot Cloud Agent API execution was not run in this session because it requires paid Copilot Cloud Agent access and a GitHub token with the current public-preview REST API permissions. The implementation is endpoint/header configurable and dry-run/mock validated. Before live use, verify GitHub's current official API path/media type and set `DF_COPILOT_AGENT_CREATE_ENDPOINT`, `DF_COPILOT_AGENT_ACCEPT`, and `DF_COPILOT_AGENT_EXTRA_HEADERS` if the preview contract differs from the default.

## Rollback

- Direct rollback: set `DF_AGENT_CMD='./df/agent-router/run-role-session.bash'` with `DF_AGENT_RUNNER='copilot'`, or restore the previous `python3 agents/df-gh-agent.py` setting.
- Conservative fallback: run `./start factory --adapter manual`.
- The new runner is opt-in; existing router selection, manual adapter, GitHub Models adapter, and local Copilot CLI path remain available.

## Risks / follow-up

- Public-preview API schema may change; this is mitigated by centralized endpoint/header configuration and tests.
- Live token permission requirements must be confirmed against current GitHub docs before enabling non-dry-run mode.
- If GitHub requires a different payload field naming convention, update `build_create_payload()` and associated tests in one place.

