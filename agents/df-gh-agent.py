#!/usr/bin/env python3
"""GitHub Models role-session adapter for Dark Factory.

The Dark Factory router calls this command as:
  df-gh-agent.py <role> <task-id> <state> <prompt-file>

It sends a bounded role prompt to `gh models run`, expects file changes using the
standard `### FILE: <path>` + fenced-code protocol, applies those files inside
DF_SESSION_ROOT, and writes the raw model response to the task artifact folder.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = "GPT-5.3-Codex"
MAX_PROMPT_BYTES = int(os.environ.get("DF_MODEL_MAX_PROMPT_BYTES", "16000"))
MAX_CONTEXT_FILE_BYTES = int(os.environ.get("DF_MODEL_MAX_CONTEXT_FILE_BYTES", "3000"))
EMERGENCY_PROMPT_BYTES = int(os.environ.get("DF_MODEL_EMERGENCY_PROMPT_BYTES", "4500"))
# Source files the task's "## Read first" section points at. Without these the
# code-producing lanes are asked to rewrite files they have never seen.
READ_FIRST_FILE_BYTES = int(os.environ.get("DF_MODEL_MAX_READ_FIRST_BYTES", "3500"))
MAX_READ_FIRST_FILES = int(os.environ.get("DF_MODEL_MAX_READ_FIRST_FILES", "4"))
# GitHub Models (free tier) rate-limits aggressively with HTTP 429. Back off and
# retry instead of stalling the task on the first throttle.
MODEL_MAX_RETRIES = int(os.environ.get("DF_MODEL_MAX_RETRIES", "5"))
MODEL_RETRY_CAP_SECONDS = int(os.environ.get("DF_MODEL_RETRY_CAP_SECONDS", "180"))

MODEL_ALIASES = {
    "GPT-5": "openai/gpt-5",
    "GPT-5 mini": "openai/gpt-5-mini",
    "GPT-5.3-Codex": "openai/gpt-5",
    "GPT-5.4": "openai/gpt-5",
    "GPT-5.4 mini": "openai/gpt-5-mini",
    "GPT-5.5": "openai/gpt-5",
    # NOTE: `gh models` has no Anthropic models and no literal gpt-5.5. These
    # friendly names resolve to the closest model the active provider serves.
    # Change the right-hand side (or DF_MODEL* env) if you point the factory at
    # a provider that actually hosts these models.
    "Claude Sonnet 5": "openai/gpt-4.1",
    "Sonnet 5": "openai/gpt-4.1",
}


def resolve_model_for_role(role: str) -> str:
    """Resolve the model for a role. Precedence, highest first:
      1. DF_MODEL_<ROLE>   role upper-cased, non-alnum -> '_' (e.g. DF_MODEL_SA,
                           DF_MODEL_BACKEND_DEV, DF_MODEL_DATA_ENGINEER)
      2. DF_MODEL          factory-wide default
      3. DEFAULT_MODEL     hard-coded fallback
    The chosen friendly name is mapped through MODEL_ALIASES to a provider id;
    an unknown name is passed through unchanged so a raw provider id also works.
    """
    role_env = "DF_MODEL_" + re.sub(r"[^0-9A-Za-z]+", "_", role).upper()
    name = os.environ.get(role_env) or os.environ.get("DF_MODEL", DEFAULT_MODEL)
    return MODEL_ALIASES.get(name, name)

FILE_BLOCK = re.compile(r"^###\s*FILE:\s*(.+?)\s*$\n```[^\n]*\n(.*?)\n```", re.MULTILINE | re.DOTALL)


def die(message: str, code: int = 1) -> None:
    print(f"[df-gh-agent][error] {message}", file=sys.stderr)
    raise SystemExit(code)


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def read_limited(path: Path, limit: int = MAX_CONTEXT_FILE_BYTES) -> str:
    try:
        data = path.read_bytes()
    except FileNotFoundError:
        return f"(missing: {rel(path)})"
    except OSError as exc:
        return f"(unreadable: {path}: {exc})"
    text = data[:limit].decode("utf-8", errors="replace")
    if len(data) > limit:
        text += "\n… (truncated)"
    return text


def append_budget(parts: list[str], heading: str, path: Path,
                  file_limit: int = MAX_CONTEXT_FILE_BYTES,
                  prompt_budget: int = MAX_PROMPT_BYTES) -> None:
    block = f"\n## {heading}\n\nSource: `{rel(path)}`\n\n```markdown\n{read_limited(path, file_limit)}\n```\n"
    candidate = "\n".join(parts + [block])
    if len(candidate.encode("utf-8")) <= prompt_budget:
        parts.append(block)
    else:
        parts.append(f"\n## {heading}\n\nOmitted: prompt budget reached for `{rel(path)}`.\n")


def board_row(task_id: str, root: Path = ROOT) -> str:
    board = root / "df" / "runtime" / "board.md"
    try:
        for line in board.read_text(encoding="utf-8", errors="replace").splitlines():
            if f"| {task_id} |" in line:
                return line
    except OSError:
        pass
    return f"(board row not found for {task_id})"


def read_first_paths(task_id: str) -> list[str]:
    """Parse the '## Read first' bullets of a task.md so the model can be shown
    the exact source files it is expected to modify."""
    task_file = ROOT / "df" / "artifacts" / task_id / "task.md"
    try:
        lines = task_file.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return []
    out: list[str] = []
    in_section = False
    for line in lines:
        stripped = line.strip()
        if stripped.lower().startswith("## read first"):
            in_section = True
            continue
        if in_section and stripped.startswith("## "):
            break
        if in_section and stripped.startswith("- "):
            path = stripped[2:].strip().strip("`").strip().strip('"').strip("'")
            if path and path.lower() not in {"none", "n/a", "-"}:
                out.append(path)
    return out


def compact_role_rules(role: str) -> str:
    return (
        "Dark Factory rules: execute exactly one role; update df/runtime/board.md; "
        "append df/runtime/activity-log.md; update df/artifacts/{task}/handoffs.md; "
        "do not self-approve; QA and PO acceptance are required before DONE. "
        f"Current role is {role}; follow only that role's responsibility."
    )


def flexcms_business_summary() -> str:
    return (
        "FlexCMS: headless-only CMS/DAM/PIM. Backend returns JSON only. "
        "Respect backend layers controller->service->repository; no repository calls from controllers; "
        "no FetchType.EAGER workaround; APIs return DTOs/projections. "
        "PIM uses its own datasource. Admin UI uses @flexcms/ui and CSS tokens. "
        "Live behavior needs real API/DB evidence, not only mocked tests."
    )


def build_payload(role: str, task_id: str, state: str, prompt_file: Path,
                  emergency: bool = False) -> str:
    budget = EMERGENCY_PROMPT_BYTES if emergency else MAX_PROMPT_BYTES
    context_limit = 700 if emergency else MAX_CONTEXT_FILE_BYTES
    task_file = ROOT / "df" / "artifacts" / task_id / "task.md"
    handoff_file = ROOT / "df" / "artifacts" / task_id / "handoffs.md"
    role_file = ROOT / "df" / "roles" / f"{role}.md"

    parts = [
        "You are executing ONE Dark Factory role session for FlexCMS.",
        compact_role_rules(role),
        flexcms_business_summary(),
        "Return ONLY file updates using this exact protocol for every changed/created file:",
        "### FILE: <relative/path>",
        "```",
        "<full file contents>",
        "```",
        "No prose outside file blocks. Preserve user work. If implementation cannot be safely completed, update the task to BLOCKED or handoff with the exact blocker.",
        "Shared runtime files are MERGED by the adapter, not overwritten — obey these two exceptions:",
        "- For df/runtime/board.md: return a board.md block containing ONLY this task's single table row (do NOT reproduce other tasks' rows; the adapter splices your row into the shared board).",
        "- For df/runtime/activity-log.md: return an activity-log.md block containing ONLY the new entry to append (do NOT reproduce existing history; the adapter appends it).",
        f"Role: {role}",
        f"Task: {task_id}",
        f"State: {state}",
        f"Board row: {board_row(task_id)}",
        "",
        "# Router prompt (condensed)",
        read_limited(prompt_file, 900 if emergency else 1600),
    ]

    context_files = [task_file, handoff_file]
    if not emergency:
        context_files.append(role_file)
    for path in context_files:
        append_budget(parts, f"Context: {path.name}", path, context_limit, budget)

    # Show the model the actual source files it must read/modify. Skipped under
    # the emergency (413 fallback) budget. append_budget degrades gracefully if
    # the prompt budget is exhausted, so the most important files come first.
    if not emergency:
        included = 0
        for rp in read_first_paths(task_id):
            if included >= MAX_READ_FIRST_FILES:
                break
            fp = ROOT / rp
            if fp.is_file():
                append_budget(parts, f"Read-first source: {rp}", fp, READ_FIRST_FILE_BYTES, budget)
                included += 1

    payload = "\n".join(parts)
    encoded = payload.encode("utf-8")
    if len(encoded) > budget:
        payload = encoded[: budget - 128].decode("utf-8", errors="ignore")
        payload += "\n\n[truncated to model prompt byte budget]\n"
    return payload


def call_model(model: str, payload: str) -> str:
    cmd = ["gh", "models", "run", model]
    try:
        proc = subprocess.run(cmd, input=payload, capture_output=True, text=True, timeout=900)
    except FileNotFoundError:
        die("gh CLI not found. Install/authenticate GitHub CLI or use --adapter manual.")
    except subprocess.TimeoutExpired:
        die("model call timed out", 124)
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout).strip()
        die(f"model call failed: {err[:1000]}", proc.returncode)
    return proc.stdout


def _is_rate_limited(err: str) -> bool:
    low = err.lower()
    return "rate limit" in low or "too many requests" in low or "429" in low


def _is_oversized(err: str) -> bool:
    low = err.lower()
    return "413" in low or "tokens_limit_reached" in low or "request body too large" in low


def _parse_retry_after(err: str) -> int:
    """Extract the provider's requested back-off, e.g. 'retry after 1m0s' or
    'retry after 55s'. Returns seconds, 0 if not present."""
    m = re.search(r"retry\s*after\s*(?:(\d+)\s*m)?\s*(\d+)?\s*s", err.lower())
    if not m:
        return 0
    return int(m.group(1) or 0) * 60 + int(m.group(2) or 0)


def call_model_with_retry(model: str, payload: str, emergency_payload: str) -> str:
    cmd = ["gh", "models", "run", model]
    current = payload
    used_emergency = False
    rate_attempt = 0

    while True:
        try:
            proc = subprocess.run(cmd, input=current, capture_output=True, text=True, timeout=900)
        except FileNotFoundError:
            die("gh CLI not found. Install/authenticate GitHub CLI or use --adapter manual.")
        except subprocess.TimeoutExpired:
            die("model call timed out", 124)

        if proc.returncode == 0:
            return proc.stdout

        err = (proc.stderr or proc.stdout).strip()

        # Oversized prompt: fall back once to the emergency compact prompt.
        if _is_oversized(err) and not used_emergency:
            print("[df-gh-agent] prompt exceeded provider limit; retrying with emergency compact prompt", file=sys.stderr)
            current = emergency_payload
            used_emergency = True
            continue

        # Rate limited: honor the provider's retry hint (or exponential backoff)
        # up to MODEL_MAX_RETRIES before giving up.
        if _is_rate_limited(err) and rate_attempt < MODEL_MAX_RETRIES:
            rate_attempt += 1
            wait = _parse_retry_after(err)
            if wait <= 0:
                wait = 2 ** rate_attempt
            wait = min(wait, MODEL_RETRY_CAP_SECONDS) + 2  # small pad past the window
            print(
                f"[df-gh-agent] rate limited by GitHub Models; backing off {wait}s "
                f"(attempt {rate_attempt}/{MODEL_MAX_RETRIES})",
                file=sys.stderr,
            )
            time.sleep(wait)
            continue

        die(f"model call failed: {err[:1000]}", proc.returncode)


def safe_output_path(session_root: Path, rel: str) -> Path:
    clean = rel.strip().lstrip("/")
    if not clean or "\0" in clean:
        die(f"invalid file path from model: {rel!r}")
    target = (session_root / clean).resolve()
    try:
        target.relative_to(session_root.resolve())
    except ValueError:
        die(f"model attempted to write outside session root: {rel}")
    return target


def _board_rows(text: str):
    """Yield (task_id, full_line) for each data row of a board table."""
    for line in text.splitlines():
        if not line.startswith("|") or "---" in line or "Task ID" in line:
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 2 and cells[1]:
            yield cells[1], line


def _task_ids_from_board(text: str) -> set[str]:
    return {tid for tid, _ in _board_rows(text)}


def _merge_board(existing: str, model_content: str, task_id: str) -> str:
    """Row-level merge of the shared board: every existing row is preserved; the
    model may only replace ITS OWN task's row; genuinely new task rows (e.g. an
    SA task split) are appended. This makes single-task sessions incapable of
    truncating or corrupting other tasks' state."""
    model_rows: dict[str, str] = {}
    order: list[str] = []
    for tid, line in _board_rows(model_content):
        if tid not in model_rows:
            order.append(tid)
        model_rows[tid] = line

    existing_ids = _task_ids_from_board(existing)
    out: list[str] = []
    last_row_idx = -1
    for line in existing.splitlines():
        tid = None
        if line.startswith("|") and "---" not in line and "Task ID" not in line:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 2 and cells[1]:
                tid = cells[1]
        if tid is not None:
            out.append(model_rows[tid] if tid == task_id and tid in model_rows else line)
            last_row_idx = len(out) - 1
        else:
            out.append(line)
            if line.startswith("|"):
                last_row_idx = len(out) - 1

    new_rows = [model_rows[t] for t in order if t not in existing_ids]
    if new_rows:
        at = last_row_idx + 1
        out[at:at] = new_rows
    return "\n".join(out).rstrip("\n") + "\n"


def _merge_activity_log(existing: str, model_content: str) -> str:
    """Append-only merge: the model returns just the new entry; keep all history."""
    new = model_content.strip("\n")
    base = existing.rstrip("\n")
    if not new or new in base:
        return base + "\n"
    if new.startswith(base) and len(new) > len(base):
        # Model reproduced the full log and appended — accept as-is.
        return new.rstrip("\n") + "\n"
    return base + "\n\n" + new + "\n"


def apply_file_blocks(response: str, session_root: Path, task_id: str) -> list[Path]:
    written: list[Path] = []
    root = session_root.resolve()
    for rel_path, content in FILE_BLOCK.findall(response):
        target = safe_output_path(session_root, rel_path)
        body = content if content.endswith("\n") else content + "\n"
        rel_target = str(target.relative_to(root))

        if rel_target == "df/runtime/board.md" and target.exists():
            existing = target.read_text(encoding="utf-8", errors="replace")
            merged = _merge_board(existing, body, task_id)
            if not _task_ids_from_board(existing).issubset(_task_ids_from_board(merged)):
                die("board merge dropped task rows (internal error); board not written", 3)
            if "| Priority |" not in merged or "|---" not in merged:
                die("board merge produced a malformed table; board not written", 3)
            body = merged
        elif rel_target == "df/runtime/activity-log.md" and target.exists():
            existing = target.read_text(encoding="utf-8", errors="replace")
            body = _merge_activity_log(existing, body)

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")
        written.append(target)
    return written


def main(argv: list[str]) -> int:
    if len(argv) != 4:
        die("usage: df-gh-agent.py <role> <task-id> <state> <prompt-file>")
    role, task_id, state, prompt = argv
    prompt_file = Path(prompt).resolve()
    session_root = Path(os.environ.get("DF_SESSION_ROOT", str(ROOT))).resolve()
    model = resolve_model_for_role(role)

    payload = build_payload(role, task_id, state, prompt_file)
    emergency_payload = build_payload(role, task_id, state, prompt_file, emergency=True)
    print(
        f"[df-gh-agent] role={role} model={model} prompt_bytes={len(payload.encode('utf-8'))} "
        f"emergency_bytes={len(emergency_payload.encode('utf-8'))}",
        file=sys.stderr,
    )
    response = call_model_with_retry(model, payload, emergency_payload)

    artifact_dir = session_root / "df" / "artifacts" / task_id
    artifact_dir.mkdir(parents=True, exist_ok=True)
    (artifact_dir / f"agent-response-{role}.md").write_text(response, encoding="utf-8")

    written = apply_file_blocks(response, session_root, task_id)
    if not written:
        die("model returned no file blocks; board was not updated", 2)
    print(f"[df-gh-agent] applied {len(written)} file(s) using {model}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

