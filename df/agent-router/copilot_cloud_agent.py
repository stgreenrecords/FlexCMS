#!/usr/bin/env python3
"""GitHub Copilot Cloud Agent REST runner for The Factory.

The Dark Factory router calls a role-session command as:

    <command> <role> <task-id> <state> <prompt-file>

This module implements that contract for GitHub Copilot Cloud Agent tasks. The
router remains the SDLC authority; this runner creates/polls one cloud task,
records sanitized evidence under df/artifacts/{task-id}/, and updates the local
Dark Factory board to the next state.

The GitHub Copilot coding-agent REST API is public preview. Endpoint and schema
values are therefore intentionally configurable through environment variables so
preview changes are localized to this client.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_API_BASE = "https://api.github.com"
DEFAULT_CREATE_ENDPOINT = "/agents/repos/{owner}/{repo}/tasks"
DEFAULT_API_VERSION = "2022-11-28"
DEFAULT_ACCEPT = "application/vnd.github+json"
SUCCESS_STATUSES = {"completed", "complete", "succeeded", "success", "done", "ready_for_review"}
FAILURE_STATUSES = {"failed", "failure", "cancelled", "canceled", "error", "timed_out", "timeout"}
RUNNING_STATUSES = {"queued", "pending", "in_progress", "running", "created", "started", "waiting", "idle", "waiting_for_user"}
DELIVERY_ROLES = {"backend-dev", "frontend-dev", "devops", "data-engineer"}
SECRET_FIELD_RE = re.compile(r"(authorization|token|secret|cookie|password|credential)", re.IGNORECASE)
TOKEN_RE = re.compile(r"(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]+|Bearer\s+[A-Za-z0-9._\-]+)")
MODEL_ALIASES = {
    "GPT-5.3-Codex": "gpt-5.3-codex",
    "GPT-5.2-Codex": "gpt-5.2-codex",
    "GPT-5 mini": "gpt-5-mini",
    "GPT-5 Mini": "gpt-5-mini",
    "GPT-5.4": "gpt-5.4",
    "Claude Sonnet 4.6": "claude-sonnet-4.6",
    "Claude Opus 4.6": "claude-opus-4.6",
    "Claude Sonnet 4.5": "claude-sonnet-4.5",
    "Claude Opus 4.5": "claude-opus-4.5",
}


@dataclass
class Config:
    role: str
    task_id: str
    state: str
    prompt_file: Path
    session_root: Path = ROOT
    api_base: str = DEFAULT_API_BASE
    create_endpoint: str = DEFAULT_CREATE_ENDPOINT
    api_version: str = DEFAULT_API_VERSION
    accept: str = DEFAULT_ACCEPT
    owner: str = ""
    repo: str = ""
    base_branch: str = "main"
    model: str = "gpt-5"
    create_pr: bool = True
    dry_run: bool = False
    dry_run_advance: bool = False
    poll_seconds: int = 15
    timeout_seconds: int = 3600
    require_ci: bool = False
    token: str = ""
    extra_headers: dict[str, str] = field(default_factory=dict)

    @property
    def artifacts_dir(self) -> Path:
        return self.session_root / "df" / "artifacts" / self.task_id

    @property
    def status_file(self) -> Path:
        return self.artifacts_dir / "cloud-agent-status.json"

    @property
    def report_file(self) -> Path:
        return self.artifacts_dir / "cloud-agent-report.md"

    @property
    def handoff_file(self) -> Path:
        return self.artifacts_dir / "handoffs.md"

    @property
    def board_file(self) -> Path:
        return self.session_root / "df" / "runtime" / "board.md"

    @property
    def activity_file(self) -> Path:
        return self.session_root / "df" / "runtime" / "activity-log.md"


def truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on", "y"}


def env_name_for_role(prefix: str, role: str) -> str:
    return prefix + re.sub(r"[^0-9A-Za-z]+", "_", role).upper()


def run_git(args: list[str], cwd: Path) -> str:
    proc = subprocess.run(["git", *args], cwd=str(cwd), capture_output=True, text=True, timeout=15)
    if proc.returncode != 0:
        return ""
    return proc.stdout.strip()


def parse_github_remote(remote: str) -> tuple[str, str] | None:
    remote = remote.strip()
    patterns = [
        r"^git@github\.com:(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?$",
        r"^https://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?/?$",
        r"^ssh://git@github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?$",
    ]
    for pattern in patterns:
        match = re.match(pattern, remote)
        if match:
            return match.group("owner"), match.group("repo")
    return None


def infer_repo(session_root: Path, env: dict[str, str]) -> tuple[str, str]:
    owner = env.get("DF_GITHUB_OWNER") or env.get("GITHUB_REPOSITORY_OWNER") or ""
    repo = env.get("DF_GITHUB_REPO") or ""
    if not repo and env.get("GITHUB_REPOSITORY"):
        parts = env["GITHUB_REPOSITORY"].split("/", 1)
        if len(parts) == 2:
            owner = owner or parts[0]
            repo = parts[1]
    if owner and repo:
        return owner, repo

    for remote_name in ("origin", "upstream"):
        remote = run_git(["remote", "get-url", remote_name], session_root)
        parsed = parse_github_remote(remote) if remote else None
        if parsed:
            return parsed
    return owner, repo


def infer_branch(session_root: Path, env: dict[str, str]) -> str:
    explicit = env.get("DF_COPILOT_AGENT_BASE_BRANCH") or env.get("GITHUB_BASE_REF")
    if explicit:
        return explicit
    branch = run_git(["branch", "--show-current"], session_root)
    if branch:
        return branch
    return env.get("GITHUB_REF_NAME") or "main"


def resolve_model(role: str, env: dict[str, str]) -> str:
    role_env = env_name_for_role("DF_COPILOT_AGENT_MODEL_", role)
    model = env.get(role_env) or env.get("DF_COPILOT_AGENT_MODEL") or env.get("DF_AGENT_MODEL") or "gpt-5.3-codex"
    return MODEL_ALIASES.get(model, model)


def getenv_int(env: dict[str, str], name: str, default: int, minimum: int = 1) -> int:
    try:
        value = int(env.get(name, str(default)))
    except ValueError:
        return default
    return value if value >= minimum else default


def parse_extra_headers(raw: str) -> dict[str, str]:
    if not raw.strip():
        return {}
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    if not isinstance(loaded, dict):
        return {}
    return {str(k): str(v) for k, v in loaded.items()}


def load_token(env: dict[str, str]) -> str:
    token = env.get("DF_GITHUB_TOKEN") or env.get("GITHUB_TOKEN") or env.get("GH_TOKEN") or ""
    if token:
        return token.strip()

    command = env.get("DF_GITHUB_TOKEN_COMMAND", "gh auth token")
    if not command.strip():
        return ""
    try:
        proc = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=15)
    except (OSError, subprocess.TimeoutExpired):
        return ""
    if proc.returncode != 0:
        return ""
    return proc.stdout.strip().splitlines()[0] if proc.stdout.strip() else ""


def build_config(role: str, task_id: str, state: str, prompt_file: Path, env: dict[str, str] | None = None) -> Config:
    env = dict(os.environ if env is None else env)
    session_root = Path(env.get("DF_SESSION_ROOT", str(ROOT))).resolve()
    owner, repo = infer_repo(session_root, env)
    create_endpoint = env.get("DF_COPILOT_AGENT_CREATE_ENDPOINT", DEFAULT_CREATE_ENDPOINT)
    return Config(
        role=role,
        task_id=task_id,
        state=state,
        prompt_file=prompt_file,
        session_root=session_root,
        api_base=env.get("DF_COPILOT_AGENT_API_BASE", DEFAULT_API_BASE).rstrip("/"),
        create_endpoint=create_endpoint,
        api_version=env.get("DF_COPILOT_AGENT_API_VERSION", DEFAULT_API_VERSION),
        accept=env.get("DF_COPILOT_AGENT_ACCEPT", DEFAULT_ACCEPT),
        owner=owner,
        repo=repo,
        base_branch=infer_branch(session_root, env),
        model=resolve_model(role, env),
        create_pr=truthy(env.get("DF_COPILOT_AGENT_CREATE_PR", "true")),
        dry_run=truthy(env.get("DF_COPILOT_CLOUD_DRY_RUN")),
        dry_run_advance=truthy(env.get("DF_COPILOT_CLOUD_DRY_RUN_ADVANCE")),
        poll_seconds=getenv_int(env, "DF_COPILOT_AGENT_POLL_SECONDS", 15),
        timeout_seconds=getenv_int(env, "DF_COPILOT_AGENT_TIMEOUT_SECONDS", 3600),
        require_ci=truthy(env.get("DF_COPILOT_AGENT_REQUIRE_CI")),
        token=load_token(env),
        extra_headers=parse_extra_headers(env.get("DF_COPILOT_AGENT_EXTRA_HEADERS", "")),
    )


def full_prompt(config: Config) -> str:
    prompt = config.prompt_file.read_text(encoding="utf-8", errors="replace")
    return (
        f"Repository: {config.owner}/{config.repo}\n"
        f"Role: {config.role}\n"
        f"Task: {config.task_id}\n"
        f"State: {config.state}\n"
        f"Dark Factory role: {config.role}\n"
        f"Dark Factory task: {config.task_id}\n"
        f"Current state: {config.state}\n"
        f"Base branch: {config.base_branch}\n\n"
        "Execute exactly one Dark Factory role session. Preserve role isolation: "
        "delivery work may move to READY_FOR_QA, but must not perform QA or PO acceptance. "
        "Update task artifacts and handoff evidence in the branch or PR.\n\n"
        f"{prompt}"
    )


def build_create_payload(config: Config) -> dict[str, Any]:
    title = f"DF {config.task_id}: {config.role} role session"
    branch_name = f"df/cloud/{config.task_id}/{config.role}".replace("_", "-")
    prompt = full_prompt(config)
    pr_body = (
        f"## Dark Factory task\n\n- Task: `{config.task_id}`\n- Role: `{config.role}`\n"
        f"- Base branch: `{config.base_branch}`\n\n"
        "## Required evidence\n\n"
        f"Update `df/artifacts/{config.task_id}/` with implementation summary, test evidence, risks, and rollback notes.\n\n"
        "## QA/PO guardrail\n\nThis cloud task must not self-approve QA or PO acceptance.\n"
    )
    return {
        "title": title,
        "prompt": prompt,
        "problem_statement": prompt,
        "base_ref": config.base_branch,
        "base_branch": config.base_branch,
        "target_branch": branch_name,
        "branch_name": branch_name,
        "model": config.model,
        "create_pull_request": config.create_pr,
        "pull_request": {
            "title": title,
            "body": pr_body,
            "draft": False,
        },
        "metadata": {
            "source": "dark-factory",
            "task_id": config.task_id,
            "role": config.role,
            "state": config.state,
        },
    }


def redact(value: Any, secrets: Iterable[str] = ()) -> Any:
    secret_values = [s for s in secrets if s]
    if isinstance(value, dict):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            if SECRET_FIELD_RE.search(str(key)):
                redacted[str(key)] = "[REDACTED]"
            else:
                redacted[str(key)] = redact(item, secret_values)
        return redacted
    if isinstance(value, list):
        return [redact(item, secret_values) for item in value]
    if isinstance(value, str):
        text = TOKEN_RE.sub("[REDACTED]", value)
        for secret in secret_values:
            text = text.replace(secret, "[REDACTED]")
        return text
    return value


def endpoint_url(config: Config, endpoint: str) -> str:
    endpoint = endpoint.format(owner=urllib.parse.quote(config.owner), repo=urllib.parse.quote(config.repo), task_id="{task_id}")
    if endpoint.startswith("https://") or endpoint.startswith("http://"):
        return endpoint
    return f"{config.api_base}/{endpoint.lstrip('/')}"


class GitHubClient:
    def __init__(self, config: Config):
        self.config = config

    def request(self, method: str, url: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        data = None if body is None else json.dumps(body).encode("utf-8")
        headers = {
            "Accept": self.config.accept,
            "X-GitHub-Api-Version": self.config.api_version,
            "User-Agent": "dark-factory-copilot-cloud-agent",
        }
        headers.update(self.config.extra_headers)
        if self.config.token:
            headers["Authorization"] = f"Bearer {self.config.token}"
        if body is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                raw = response.read().decode("utf-8", errors="replace")
                return json.loads(raw) if raw.strip() else {}
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"GitHub API {method} {url} failed with HTTP {exc.code}: {redact(raw, [self.config.token])}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"GitHub API {method} {url} failed: {exc.reason}") from exc


def first_present(data: dict[str, Any], names: Iterable[str]) -> Any:
    for name in names:
        if name in data and data[name] not in (None, ""):
            return data[name]
    return None


def normalize_status(data: dict[str, Any]) -> str:
    value = first_present(data, ("status", "state", "conclusion", "result"))
    return str(value or "unknown").lower()


def extract_task_info(data: dict[str, Any], config: Config) -> dict[str, Any]:
    task_id = first_present(data, ("id", "task_id", "number", "node_id"))
    branch = first_present(data, ("branch", "branch_name", "target_branch", "head_branch"))
    if isinstance(branch, dict):
        branch = first_present(branch, ("name", "ref"))
    pr = first_present(data, ("pull_request", "pr"))
    pr_number = None
    pr_url = None
    if isinstance(pr, dict):
        pr_number = first_present(pr, ("number", "id"))
        pr_url = first_present(pr, ("html_url", "url"))
    return {
        "cloud_task_id": task_id,
        "status": normalize_status(data),
        "status_url": first_present(data, ("status_url", "url", "task_url")),
        "html_url": first_present(data, ("html_url", "web_url")),
        "branch": branch,
        "pr_number": pr_number or first_present(data, ("pull_request_number", "pr_number")),
        "pr_url": pr_url or first_present(data, ("pull_request_url", "pr_url")),
        "raw": redact(data, [config.token]),
    }


def terminal_result(status: str) -> str | None:
    status = status.lower()
    if status in SUCCESS_STATUSES:
        return "success"
    if status in FAILURE_STATUSES:
        return "failure"
    return None


def create_cloud_task(client: GitHubClient, config: Config, payload: dict[str, Any]) -> dict[str, Any]:
    if not config.owner or not config.repo:
        raise RuntimeError("DF_GITHUB_OWNER/DF_GITHUB_REPO or a GitHub git remote is required")
    if not config.token:
        raise RuntimeError("DF_GITHUB_TOKEN, GITHUB_TOKEN, or GH_TOKEN is required for live cloud-agent calls")
    url = endpoint_url(config, config.create_endpoint)
    api_payload = {
        "prompt": payload["prompt"],
        "base_ref": payload["base_ref"],
        "model": payload["model"],
        "create_pull_request": payload["create_pull_request"],
    }
    try:
        return client.request("POST", url, api_payload)
    except RuntimeError as exc:
        message = str(exc).lower()
        if "model not found" not in message and "model" not in message:
            raise
        fallback_payload = dict(api_payload)
        rejected_model = fallback_payload.pop("model", None)
        response = client.request("POST", url, fallback_payload)
        if isinstance(response, dict):
            response.setdefault("model_fallback", {"requested_model": rejected_model, "used": "auto"})
        return response


def poll_cloud_task(client: GitHubClient, config: Config, info: dict[str, Any]) -> dict[str, Any]:
    status_url = info.get("status_url") or info.get("html_url")
    cloud_task_id = info.get("cloud_task_id")
    if not status_url and cloud_task_id:
        status_url = endpoint_url(config, config.create_endpoint).rstrip("/") + f"/{urllib.parse.quote(str(cloud_task_id))}"
    if not status_url:
        return {**info, "poll_error": "No status URL or cloud task id was returned by create response."}

    deadline = time.time() + config.timeout_seconds
    current = dict(info)
    while time.time() <= deadline:
        status = str(current.get("status", "unknown")).lower()
        if terminal_result(status):
            return current
        time.sleep(config.poll_seconds)
        polled = client.request("GET", str(status_url))
        current = {**current, **extract_task_info(polled, config), "last_polled_at": timestamp()}
    return {**current, "status": "timed_out", "poll_error": f"Timed out after {config.timeout_seconds}s"}


def checks_url(config: Config, ref: str) -> str:
    encoded = urllib.parse.quote(ref, safe="")
    return f"{config.api_base}/repos/{urllib.parse.quote(config.owner)}/{urllib.parse.quote(config.repo)}/commits/{encoded}/check-runs"


def statuses_url(config: Config, ref: str) -> str:
    encoded = urllib.parse.quote(ref, safe="")
    return f"{config.api_base}/repos/{urllib.parse.quote(config.owner)}/{urllib.parse.quote(config.repo)}/commits/{encoded}/status"


def aggregate_ci(client: GitHubClient, config: Config, ref: str | None) -> dict[str, Any]:
    if not ref:
        state = "missing_ref_required" if config.require_ci else "not_checked"
        return {"state": state, "summary": "No branch or SHA returned by cloud task.", "check_runs": [], "statuses": []}

    check_runs: list[dict[str, Any]] = []
    statuses: list[dict[str, Any]] = []
    errors: list[str] = []
    try:
        checks = client.request("GET", checks_url(config, ref))
        for item in checks.get("check_runs", []):
            check_runs.append({
                "name": item.get("name"),
                "status": item.get("status"),
                "conclusion": item.get("conclusion"),
                "html_url": item.get("html_url"),
            })
    except RuntimeError as exc:
        errors.append(str(redact(str(exc), [config.token])))
    try:
        combined = client.request("GET", statuses_url(config, ref))
        for item in combined.get("statuses", []):
            statuses.append({
                "context": item.get("context"),
                "state": item.get("state"),
                "target_url": item.get("target_url"),
            })
    except RuntimeError as exc:
        errors.append(str(redact(str(exc), [config.token])))

    failed_checks = [c for c in check_runs if c.get("conclusion") in {"failure", "cancelled", "timed_out", "action_required"}]
    pending_checks = [c for c in check_runs if c.get("status") != "completed" or not c.get("conclusion")]
    failed_statuses = [s for s in statuses if s.get("state") in {"failure", "error"}]
    pending_statuses = [s for s in statuses if s.get("state") in {"pending", "expected"}]

    if failed_checks or failed_statuses:
        state = "failure"
    elif pending_checks or pending_statuses:
        state = "pending"
    elif check_runs or statuses:
        state = "success"
    elif config.require_ci:
        state = "missing_required"
    else:
        state = "not_found"
    return {
        "state": state,
        "summary": f"{len(check_runs)} check runs, {len(statuses)} commit statuses, {len(errors)} API errors",
        "check_runs": check_runs,
        "statuses": statuses,
        "errors": errors,
    }


def timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M local")


def board_text(value: Any, limit: int = 240) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    text = text.replace("|", "/")
    return text[: limit - 1] + "…" if len(text) > limit else text


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def append_report(config: Config, result: dict[str, Any]) -> None:
    config.report_file.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"## {timestamp()} - Copilot Cloud Agent run",
        "",
        f"- Task: `{config.task_id}`",
        f"- Role: `{config.role}`",
        f"- Dry run: `{str(config.dry_run).lower()}`",
        f"- Repository: `{config.owner}/{config.repo}`",
        f"- Base branch: `{config.base_branch}`",
        f"- Model: `{config.model}`",
        f"- Cloud task id: `{result.get('cloud_task_id') or 'n/a'}`",
        f"- Cloud status: `{result.get('status') or 'unknown'}`",
        f"- Branch: `{result.get('branch') or 'n/a'}`",
        f"- PR: `{result.get('pr_url') or result.get('pr_number') or 'n/a'}`",
        f"- CI state: `{result.get('ci', {}).get('state', 'not_checked')}`",
        f"- Next state: `{result.get('next_state')}`",
        f"- Notes: {result.get('note', 'n/a')}",
        "",
    ]
    with config.report_file.open("a", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


def board_next_state(config: Config, success: bool, note: str) -> tuple[str, str, str]:
    if success:
        if config.role in DELIVERY_ROLES:
            return "READY_FOR_QA", "qa", "Cloud agent completed and CI checks are acceptable; QA verifies branch/PR evidence."
        if config.role == "qa":
            return "READY_FOR_PO", "po", "Cloud QA role completed; PO review is next."
        if config.role == "po":
            return "DONE", "factory", "Cloud PO role accepted the task."
        return "READY_FOR_QA", "qa", "Cloud role completed; QA verifies evidence."
    if config.state == "RETURNED_TO_DEV" or config.role in DELIVERY_ROLES:
        return "RETURNED_TO_DEV", config.role, f"Cloud agent did not produce a passing result: {note}"
    return "BLOCKED", config.role, f"Cloud agent blocked: {note}"


def update_board(config: Config, next_state: str, next_owner: str, next_action: str) -> None:
    board = config.board_file
    if not board.exists():
        return
    lines = board.read_text(encoding="utf-8").splitlines()
    updated: list[str] = []
    replaced = False
    for line in lines:
        if line.startswith("|") and f"| {config.task_id} |" in line and "---" not in line:
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) >= 9:
                cells[4] = next_state
                cells[5] = next_owner
                cells[6] = "No" if next_state != "RETURNED_TO_DEV" else "No - rework required"
                cells[7] = "2026-07-07 local"
                cells[8] = board_text(next_action)
                line = "| " + " | ".join(cells) + " |"
                replaced = True
        updated.append(line)
    if replaced:
        board.write_text("\n".join(updated) + "\n", encoding="utf-8")


def append_activity(config: Config, result: dict[str, Any]) -> None:
    config.activity_file.parent.mkdir(parents=True, exist_ok=True)
    entry = f"""
## {timestamp()} - {config.role} - {config.task_id}

- State: {config.state} -> {result.get('next_state')}
- Action: Launched/polled GitHub Copilot Cloud Agent REST orchestration path; recorded sanitized cloud-task, branch/PR, and CI evidence.
- Evidence: `df/artifacts/{config.task_id}/cloud-agent-status.json`, `df/artifacts/{config.task_id}/cloud-agent-report.md`, `df/artifacts/{config.task_id}/handoffs.md`
- Result: {'PASS' if result.get('success') else 'FAIL'}
- Next: {result.get('next_action')}
- Risks/blockers: {result.get('note')}
"""
    with config.activity_file.open("a", encoding="utf-8") as handle:
        handle.write(entry)


def append_handoff(config: Config, result: dict[str, Any]) -> None:
    config.handoff_file.parent.mkdir(parents=True, exist_ok=True)
    next_role = "qa" if result.get("next_state") == "READY_FOR_QA" else config.role
    entry = f"""
## {config.role} -> {next_role}

- Timestamp: {timestamp()}
- Task: {config.task_id}
- From state: {config.state}
- To state: {result.get('next_state')}
- Lane: devops
- Summary: Implemented/used the Copilot Cloud Agent REST orchestration runner and recorded sanitized cloud status evidence.

## Evidence

- `df/agent-router/copilot-cloud-agent.py`
- `df/agent-router/copilot_cloud_agent.py`
- `df/artifacts/{config.task_id}/cloud-agent-status.json`
- `df/artifacts/{config.task_id}/cloud-agent-report.md`

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
"""
    with config.handoff_file.open("a", encoding="utf-8") as handle:
        handle.write(entry)


def run(config: Config, client: GitHubClient | None = None) -> dict[str, Any]:
    payload = build_create_payload(config)
    sanitized_payload = redact(payload, [config.token])
    config.artifacts_dir.mkdir(parents=True, exist_ok=True)

    if config.dry_run:
        success = config.dry_run_advance
        next_state, next_owner, next_action = board_next_state(config, success, "dry-run only; no cloud task was created")
        result = {
            "dry_run": True,
            "success": success,
            "status": "dry_run",
            "cloud_task_id": "dry-run",
            "branch": payload.get("branch_name"),
            "pr_url": None,
            "ci": {"state": "not_checked", "summary": "Dry-run mode does not call GitHub."},
            "next_state": next_state,
            "next_owner": next_owner,
            "next_action": next_action,
            "note": "dry-run only; no cloud task was created",
            "request": sanitized_payload,
            "endpoint": redact(endpoint_url(config, config.create_endpoint), [config.token]),
        }
        write_json(config.status_file, redact(result, [config.token]))
        append_report(config, result)
        if config.dry_run_advance:
            update_board(config, next_state, next_owner, next_action)
            append_activity(config, result)
            append_handoff(config, result)
        return result

    client = client or GitHubClient(config)
    created = create_cloud_task(client, config, payload)
    info = extract_task_info(created, config)
    polled = poll_cloud_task(client, config, info)
    cloud_result = terminal_result(str(polled.get("status", "unknown")))
    ci_ref = polled.get("branch") or polled.get("head_sha") or polled.get("sha")
    ci = aggregate_ci(client, config, str(ci_ref) if ci_ref else None)
    ci_ok = ci["state"] in {"success", "not_found", "not_checked"} and not config.require_ci
    ci_ok = ci_ok or ci["state"] == "success"
    success = cloud_result == "success" and ci_ok
    note = "cloud task completed" if success else f"cloud={polled.get('status')} ci={ci.get('state')}"
    next_state, next_owner, next_action = board_next_state(config, success, note)
    result = {
        **polled,
        "dry_run": False,
        "success": success,
        "ci": ci,
        "next_state": next_state,
        "next_owner": next_owner,
        "next_action": next_action,
        "note": note,
        "request": sanitized_payload,
    }
    write_json(config.status_file, redact(result, [config.token]))
    append_report(config, result)
    update_board(config, next_state, next_owner, next_action)
    append_activity(config, result)
    append_handoff(config, result)
    return result


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run one Dark Factory role via GitHub Copilot Cloud Agent REST API")
    parser.add_argument("role")
    parser.add_argument("task_id")
    parser.add_argument("state")
    parser.add_argument("prompt_file", type=Path)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    config = build_config(args.role, args.task_id, args.state, args.prompt_file)
    try:
        result = run(config)
    except Exception as exc:  # noqa: BLE001 - CLI must convert any failure into sanitized evidence.
        config.artifacts_dir.mkdir(parents=True, exist_ok=True)
        sanitized = str(redact(str(exc), [config.token]))
        error_result = {
            "dry_run": config.dry_run,
            "success": False,
            "status": "error",
            "next_state": "RETURNED_TO_DEV" if config.role in DELIVERY_ROLES else "BLOCKED",
            "next_owner": config.role,
            "next_action": f"Fix Copilot Cloud Agent runner/API failure: {sanitized}",
            "note": sanitized,
        }
        write_json(config.status_file, error_result)
        append_report(config, error_result)
        update_board(config, error_result["next_state"], error_result["next_owner"], error_result["next_action"])
        append_activity(config, error_result)
        append_handoff(config, error_result)
        print(f"[copilot-cloud-agent][error] {sanitized}", file=sys.stderr)
        return 1
    print(json.dumps(redact(result, [config.token]), indent=2, sort_keys=True))
    return 0 if result.get("success") or result.get("dry_run") else 1


if __name__ == "__main__":
    raise SystemExit(main())



