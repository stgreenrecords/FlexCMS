#!/usr/bin/env python3
"""
factory.py — FlexCMS Agent Factory dispatcher.

A zero-dependency orchestrator that turns the agent workflow into a factory
assembly line. The queue (agents/queue.json) is the single source of truth;
any interchangeable worker pulls the next READY task the dispatcher hands out.

Stations (assembly line):
    backlog -> ready -> build -> test -> review -> done
                          ^                  |
                          +----- rework <----+        blocked (side lane)

Key ideas replacing the old two-agent manual flow:
  * Dispatcher, not humans, schedules work    -> `factory.py next --agent <id>`
  * Locks are automatic leases from modules    -> no hand-edited lock table
  * Dependency graph is enforced by the engine -> no eyeballing "Blocked By"
  * Quality is one gate                        -> `factory.py validate`
  * Failures flow to a rework lane             -> `factory.py fail <id>`

Usage:
    factory.py status
    factory.py next --agent worker-1
    factory.py claim <ID> --agent worker-1
    factory.py move <ID> <station>
    factory.py pass <ID>            # advance build->test->review->done
    factory.py fail <ID> [--reason] # send back to rework
    factory.py block <ID> --reason "..."
    factory.py unblock <ID>
    factory.py add --id <ID> --title "..." --priority P1 --modules a,b --deps X,Y
    factory.py release <ID>         # drop a (stale) lease
    factory.py lint                 # consistency checks
    factory.py validate             # run the build/test gates
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_DIR = os.path.dirname(os.path.abspath(__file__))
QUEUE = os.path.join(AGENTS_DIR, "queue.json")
CONFIG = os.path.join(AGENTS_DIR, "config.json")
RUNLOG_DIR = os.path.join(ROOT, "docs", "agent-runs")

# Advance path along the assembly line.
NEXT_STATION = {"build": "test", "test": "review", "review": "done"}


# --------------------------------------------------------------------------- IO
def now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso(t: dt.datetime) -> str:
    return t.replace(microsecond=0).isoformat()


def load() -> dict:
    with open(QUEUE, encoding="utf-8") as fh:
        return json.load(fh)


def save(data: dict) -> None:
    data["updated"] = now().date().isoformat()
    with open(QUEUE, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def find(data: dict, task_id: str) -> dict | None:
    return next((t for t in data["tasks"] if t["id"] == task_id), None)


def log(task: dict, event: str) -> None:
    task.setdefault("history", []).append({"ts": iso(now()), "event": event})


# ------------------------------------------------------------------- lease logic
def lease_active(task: dict) -> bool:
    lease = task.get("lease") or {}
    if not lease.get("agent") or not lease.get("expires"):
        return False
    try:
        return dt.datetime.fromisoformat(lease["expires"]) > now()
    except ValueError:
        return False


def set_lease(task: dict, agent: str, ttl_min: int) -> None:
    start = now()
    task["lease"] = {
        "agent": agent,
        "since": iso(start),
        "expires": iso(start + dt.timedelta(minutes=ttl_min)),
    }


def clear_lease(task: dict) -> None:
    task["lease"] = {"agent": None, "since": None, "expires": None}


def locked_modules(data: dict) -> dict[str, str]:
    """Modules currently held by an in-flight task with a live lease -> owning id."""
    held: dict[str, str] = {}
    flight = set(data["config"]["in_flight_stations"])
    for t in data["tasks"]:
        if t["station"] in flight and lease_active(t):
            for m in t.get("modules", []):
                held[m] = t["id"]
    return held


def deps_done(data: dict, task: dict) -> bool:
    done = {t["id"] for t in data["tasks"] if t["station"] == "done"}
    return all(d in done for d in task.get("depends_on", []))


# ----------------------------------------------------------------------- commands
def cmd_status(data: dict, _args) -> int:
    stations = data["config"]["stations"]
    buckets: dict[str, list[dict]] = {s: [] for s in stations}
    for t in data["tasks"]:
        buckets.setdefault(t["station"], []).append(t)

    print("\n  FlexCMS Agent Factory — board")
    print("  " + "-" * 60)
    for s in stations:
        tasks = buckets.get(s, [])
        print(f"  {s.upper():<9} ({len(tasks)})")
        for t in sorted(tasks, key=lambda x: _prio_key(data, x)):
            lease = t.get("lease") or {}
            who = f"  @{lease['agent']}" if lease.get("agent") else ""
            stale = "  (LEASE STALE)" if lease.get("agent") and not lease_active(t) else ""
            print(f"      [{t['priority']:<3}] {t['id']:<7} {t['title'][:52]}{who}{stale}")
    print()

    held = locked_modules(data)
    if held:
        print("  Active module locks (auto-leased):")
        for mod, owner in sorted(held.items()):
            print(f"      {mod:<24} -> {owner}")
        print()

    ready = _dispatchable(data)
    print(f"  Dispatchable now: {', '.join(t['id'] for t in ready) or '(none)'}")
    print()
    return 0


def _prio_key(data: dict, task: dict):
    order = data["config"]["priority_order"]
    p = task.get("priority", "P3")
    return (order.index(p) if p in order else len(order), task["id"])


def _dispatchable(data: dict) -> list[dict]:
    """READY (or rework) tasks whose deps are done and whose modules are free."""
    held = locked_modules(data)
    out = []
    for t in data["tasks"]:
        if t["station"] not in ("ready", "rework"):
            continue
        if lease_active(t):
            continue
        if not deps_done(data, t):
            continue
        clash = [m for m in t.get("modules", []) if m in held]
        if clash:
            continue
        out.append(t)
    return sorted(out, key=lambda x: _prio_key(data, x))


def _wip_ok(data: dict, station: str) -> bool:
    limit = data["config"].get("wip_limits", {}).get(station)
    if limit is None:
        return True
    current = sum(1 for t in data["tasks"] if t["station"] == station)
    return current < limit


def cmd_next(data: dict, args) -> int:
    if not _wip_ok(data, "build"):
        print("  ⛔ build station at WIP limit — finish/advance a task first.")
        return 1
    candidates = _dispatchable(data)
    if not candidates:
        print("  No dispatchable task (deps unmet, modules locked, or queue empty).")
        return 1
    task = candidates[0]
    ttl = data["config"]["lease_ttl_minutes"]
    set_lease(task, args.agent, ttl)
    task["station"] = "build"
    log(task, f"dispatched->build @{args.agent}")
    save(data)
    _print_assignment(task)
    return 0


def _print_assignment(task: dict) -> None:
    print(f"\n  ▶ Assigned {task['id']} [{task['priority']}] to @{task['lease']['agent']}")
    print(f"    {task['title']}")
    if task.get("modules"):
        print(f"    Locks:  {', '.join(task['modules'])}")
    if task.get("read_first"):
        print("    Read first:")
        for f in task["read_first"]:
            print(f"      - {f}")
    if task.get("acceptance_criteria"):
        print("    Acceptance criteria:")
        for i, ac in enumerate(task["acceptance_criteria"], 1):
            print(f"      AC{i}: {ac}")
    print(f"    Lease expires: {task['lease']['expires']}")
    print("\n    When build is complete:  factory.py pass " + task["id"])
    print()


def cmd_claim(data: dict, args) -> int:
    task = find(data, args.id)
    if not task:
        print(f"  Unknown task: {args.id}")
        return 1
    if task["station"] not in ("ready", "rework"):
        print(f"  {args.id} is in '{task['station']}', not ready/rework.")
        return 1
    if lease_active(task):
        print(f"  {args.id} already leased by @{task['lease']['agent']}.")
        return 1
    if not deps_done(data, task):
        pending = [d for d in task["depends_on"] if not find(data, d) or find(data, d)["station"] != "done"]
        print(f"  {args.id} blocked by unfinished deps: {', '.join(pending)}")
        return 1
    held = locked_modules(data)
    clash = {m: held[m] for m in task.get("modules", []) if m in held}
    if clash:
        print(f"  {args.id} module conflict: {clash}")
        return 1
    set_lease(task, args.agent, data["config"]["lease_ttl_minutes"])
    task["station"] = "build"
    log(task, f"claimed->build @{args.agent}")
    save(data)
    _print_assignment(task)
    return 0


def cmd_move(data: dict, args) -> int:
    task = find(data, args.id)
    if not task:
        print(f"  Unknown task: {args.id}")
        return 1
    if args.station not in data["config"]["stations"]:
        print(f"  Unknown station: {args.station}")
        return 1
    prev = task["station"]
    task["station"] = args.station
    if args.station in ("done", "backlog", "ready", "blocked"):
        clear_lease(task)
    log(task, f"move {prev}->{args.station}")
    save(data)
    print(f"  {args.id}: {prev} -> {args.station}")
    return 0


def cmd_pass(data: dict, args) -> int:
    task = find(data, args.id)
    if not task:
        print(f"  Unknown task: {args.id}")
        return 1
    nxt = NEXT_STATION.get(task["station"])
    if not nxt:
        print(f"  {args.id} is in '{task['station']}' — nothing to advance.")
        return 1
    prev = task["station"]
    task["station"] = nxt
    if nxt == "done":
        clear_lease(task)
    log(task, f"pass {prev}->{nxt}")
    save(data)
    print(f"  {args.id}: {prev} -> {nxt}" + ("  ✅ DONE" if nxt == "done" else ""))
    return 0


def cmd_fail(data: dict, args) -> int:
    task = find(data, args.id)
    if not task:
        print(f"  Unknown task: {args.id}")
        return 1
    prev = task["station"]
    task["station"] = "rework"
    clear_lease(task)
    log(task, f"fail {prev}->rework: {args.reason or 'unspecified'}")
    save(data)
    print(f"  {args.id}: {prev} -> rework  ({args.reason or 'no reason given'})")
    return 0


def cmd_block(data: dict, args) -> int:
    task = find(data, args.id)
    if not task:
        print(f"  Unknown task: {args.id}")
        return 1
    prev = task["station"]
    task["station"] = "blocked"
    clear_lease(task)
    log(task, f"block {prev}->blocked: {args.reason or 'unspecified'}")
    save(data)
    print(f"  {args.id}: {prev} -> blocked  ({args.reason or 'no reason given'})")
    return 0


def cmd_unblock(data: dict, args) -> int:
    task = find(data, args.id)
    if not task:
        print(f"  Unknown task: {args.id}")
        return 1
    task["station"] = "ready"
    log(task, "unblock->ready")
    save(data)
    print(f"  {args.id}: blocked -> ready")
    return 0


def cmd_release(data: dict, args) -> int:
    task = find(data, args.id)
    if not task:
        print(f"  Unknown task: {args.id}")
        return 1
    clear_lease(task)
    log(task, "lease released")
    save(data)
    print(f"  {args.id}: lease released (still in '{task['station']}').")
    return 0


def cmd_add(data: dict, args) -> int:
    if find(data, args.id):
        print(f"  Task {args.id} already exists.")
        return 1
    task = {
        "id": args.id,
        "title": args.title,
        "priority": args.priority,
        "station": args.station,
        "depends_on": [d for d in (args.deps or "").split(",") if d],
        "modules": [m for m in (args.modules or "").split(",") if m],
        "read_first": [f for f in (args.read_first or "").split(",") if f],
        "acceptance_criteria": [],
        "lease": {"agent": None, "since": None, "expires": None},
        "history": [{"ts": iso(now()), "event": f"created:{args.station}"}],
    }
    data["tasks"].append(task)
    save(data)
    print(f"  Added {args.id} to '{args.station}'.")
    return 0


def cmd_lint(data: dict, _args) -> int:
    problems = []
    ids = {t["id"] for t in data["tasks"]}
    for t in data["tasks"]:
        for d in t.get("depends_on", []):
            if d not in ids:
                problems.append(f"{t['id']}: depends on unknown task {d}")
        if t["station"] in data["config"]["in_flight_stations"] and not lease_active(t):
            problems.append(f"{t['id']}: in-flight '{t['station']}' but lease missing/stale")
        if t["station"] not in data["config"]["in_flight_stations"] and lease_active(t):
            problems.append(f"{t['id']}: has live lease but station is '{t['station']}'")
    # dependency cycle detection
    graph = {t["id"]: t.get("depends_on", []) for t in data["tasks"]}
    state: dict[str, int] = {}

    def visit(n: str) -> bool:
        state[n] = 1
        for m in graph.get(n, []):
            if state.get(m) == 1 or (state.get(m) != 2 and visit(m)):
                return True
        state[n] = 2
        return False

    for n in graph:
        if state.get(n) != 2 and visit(n):
            problems.append(f"dependency cycle involving {n}")
            break

    if problems:
        print("  ❌ Lint problems:")
        for p in problems:
            print(f"      - {p}")
        return 1
    print("  ✅ Queue is consistent (no orphans, stale leases, or cycles).")
    return 0


def cmd_validate(_data: dict, _args) -> int:
    """The single quality gate that replaces the manual checklist."""
    flexcms = os.path.join(ROOT, "flexcms")
    frontend = os.path.join(ROOT, "frontend")
    steps = [
        ("Backend compile", ["mvn", "-q", "clean", "compile"], flexcms),
        ("Backend tests", ["mvn", "-q", "test"], flexcms),
        ("Frontend build", ["pnpm", "build"], frontend),
    ]
    all_ok = True
    for name, cmd, cwd in steps:
        print(f"\n  ▶ {name}: {' '.join(cmd)}  (cwd={os.path.relpath(cwd, ROOT)})")
        try:
            rc = subprocess.run(cmd, cwd=cwd).returncode
        except FileNotFoundError as exc:
            print(f"    ⚠ tool not found: {exc}")
            rc = 127
        status = "✅ PASS" if rc == 0 else "❌ FAIL"
        print(f"    {status}")
        all_ok = all_ok and rc == 0
    print("\n  " + ("✅ VALIDATION PASSED — safe to push." if all_ok
                     else "❌ VALIDATION FAILED — do NOT push."))
    return 0 if all_ok else 1


# ------------------------------------------------------- autonomous run loop
DEFAULT_CONFIG = {
    "model": "openai/gpt-4o",
    "review_model": "openai/gpt-4o",
    "gh_command": ["gh", "models", "run", "{model}"],
    "preferred_model_ids": ["openai/gpt-5", "openai/gpt-4.1", "openai/gpt-4o"],
    "model_aliases": {
        "GPT-5": "openai/gpt-5",
        "GPT-5 mini": "openai/gpt-5-mini",
        "GPT-5.3-Codex": "openai/gpt-5",
        "GPT-5.4": "openai/gpt-5",
        "GPT-5.4 mini": "openai/gpt-5-mini",
        "GPT-5.5": "openai/gpt-5",
    },
    "worker_pool": ["w1", "w2", "w3"],
    "loop": {"max_iterations": 20, "stop_when_idle": True, "sleep_seconds": 2},
    "autonomy": {"enabled": False, "apply_edits": False, "auto_validate": True,
                 "auto_review": True, "auto_commit": False},
    "prompt": {"system": "", "review_system": "", "include_read_first": True,
               "max_file_bytes": 20000, "max_prompt_bytes": 50000,
               "max_read_first_files": 4},
}


def load_config() -> dict:
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))  # deep copy
    if os.path.exists(CONFIG):
        try:
            with open(CONFIG, encoding="utf-8") as fh:
                user = json.load(fh)
            for k, v in user.items():
                if isinstance(v, dict) and isinstance(cfg.get(k), dict):
                    cfg[k].update(v)
                else:
                    cfg[k] = v
        except (json.JSONDecodeError, OSError) as exc:
            print(f"  ⚠ could not read {CONFIG}: {exc} — using defaults")
    return cfg


def _read_file_safe(path: str, limit: int) -> str:
    full = path if os.path.isabs(path) else os.path.join(ROOT, path)
    if not os.path.exists(full):
        return f"(missing: {path})"
    try:
        with open(full, encoding="utf-8", errors="replace") as fh:
            data = fh.read(limit + 1)
        return data[:limit] + ("\n… (truncated)" if len(data) > limit else "")
    except OSError as exc:
        return f"(unreadable: {path}: {exc})"


def _bytes_len(text: str) -> int:
    return len(text.encode("utf-8"))


def _is_prompt_too_large(err: str) -> bool:
    low = (err or "").lower()
    return "413" in low or "request entity too large" in low


def _is_rate_limited(err: str) -> bool:
    low = (err or "").lower()
    return "rate limited" in low or "too many requests" in low or "429" in low


def build_prompt(task: dict, cfg: dict) -> str:
    prompt_cfg = cfg.get("prompt", {})
    max_file = int(prompt_cfg.get("max_file_bytes", 20000))
    max_prompt = int(prompt_cfg.get("max_prompt_bytes", 50000))
    max_files = int(prompt_cfg.get("max_read_first_files", 4))

    parts = [cfg["prompt"].get("system", ""), "",
             f"# Task {task['id']} [{task['priority']}]", task["title"], "",
             "## Acceptance criteria"]
    parts += [f"- {ac}" for ac in task.get("acceptance_criteria", [])] or ["- (none specified)"]
    parts += ["", f"## Modules you may touch\n{', '.join(task.get('modules', [])) or '(any)'}"]

    omitted: list[str] = []
    if cfg["prompt"].get("include_read_first") and task.get("read_first"):
        parts.append("\n## Context files")
        for idx, f in enumerate(task["read_first"]):
            if max_files and idx >= max_files:
                omitted.append(f"{f} (omitted: max_read_first_files)")
                continue
            block = f"\n### {f}\n```\n{_read_file_safe(f, max_file)}\n```"
            candidate = "\n".join(parts + [block])
            if _bytes_len(candidate) > max_prompt:
                omitted.append(f"{f} (omitted: max_prompt_bytes budget)")
                continue
            parts.append(block)

    if omitted:
        parts.append("\n## Omitted context files")
        parts += [f"- {x}" for x in omitted]

    prompt = "\n".join(parts)
    if _bytes_len(prompt) > max_prompt:
        payload = prompt.encode("utf-8")
        trimmed = payload[: max_prompt - 64].decode("utf-8", errors="ignore")
        prompt = trimmed + "\n\n[truncated to max_prompt_bytes]\n"
    return prompt


def _gh_models() -> tuple[bool, list[tuple[str, str]], str]:
    """Query `gh models list` and return (ok, [(id, label)], err)."""
    try:
        proc = subprocess.run(["gh", "models", "list"], capture_output=True, text=True, timeout=20)
    except FileNotFoundError:
        return False, [], "gh CLI not found"
    except subprocess.TimeoutExpired:
        return False, [], "gh models list timed out"
    if proc.returncode != 0:
        return False, [], (proc.stderr or proc.stdout or "gh models list failed").strip()

    rows: list[tuple[str, str]] = []
    for raw in proc.stdout.splitlines():
        line = raw.strip()
        if not line:
            continue
        parts = line.split()
        model_id = parts[0]
        label = " ".join(parts[1:]).strip()
        rows.append((model_id, label))
    return True, rows, ""


def _resolve_model(requested: str, cfg: dict) -> tuple[str, str | None]:
    """Resolve configured model/alias to a concrete gh model id; fallback if unavailable."""
    aliases = cfg.get("model_aliases") or {}
    candidate = aliases.get(requested, requested)

    ok, models, err = _gh_models()
    if not ok:
        return candidate, f"could not verify model availability ({err}); using '{candidate}'"

    ids = {mid for mid, _ in models}
    if candidate in ids:
        return candidate, None

    # Accept display-name input when it uniquely matches a gh model label.
    wanted = candidate.lower().strip()
    label_hits = [mid for mid, label in models if label.lower() == wanted]
    if len(label_hits) == 1:
        return label_hits[0], f"resolved display name '{requested}' -> '{label_hits[0]}'"

    for pref in cfg.get("preferred_model_ids") or []:
        if pref in ids:
            return pref, f"model '{requested}' unavailable in gh models; falling back to '{pref}'"

    if models:
        return models[0][0], f"model '{requested}' unavailable; falling back to '{models[0][0]}'"

    return candidate, f"model '{requested}' unavailable and no fallback discovered"


def call_model(prompt: str, cfg: dict, system: str | None = None,
               model: str | None = None) -> tuple[bool, str]:
    """Invoke the configured model via the GitHub CLI. Returns (ok, output)."""
    selected = model or cfg["model"]
    cmd = [c.replace("{model}", selected) for c in cfg["gh_command"]]
    payload = (system + "\n\n" + prompt) if system else prompt
    try:
        proc = subprocess.run(cmd, input=payload, capture_output=True, text=True, timeout=600)
    except FileNotFoundError:
        return False, f"gh CLI not found (command: {' '.join(cmd)}). Install GitHub CLI + models extension."
    except subprocess.TimeoutExpired:
        return False, "model call timed out"
    if proc.returncode != 0:
        return False, f"model call failed (exit {proc.returncode}): {proc.stderr.strip()[:400]}"
    return True, proc.stdout


FILE_BLOCK = re.compile(r"^###\s*FILE:\s*(.+?)\s*$\n```[^\n]*\n(.*?)\n```", re.MULTILINE | re.DOTALL)


def apply_edits(model_output: str) -> list[str]:
    """Apply the '### FILE: path' + fenced-block protocol. Returns list of written paths."""
    written = []
    for rel_path, content in FILE_BLOCK.findall(model_output):
        full = os.path.join(ROOT, rel_path.strip())
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as fh:
            fh.write(content if content.endswith("\n") else content + "\n")
        written.append(rel_path.strip())
    return written


def _worklog(task_id: str, name: str, content: str) -> str:
    d = os.path.join(RUNLOG_DIR, task_id)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    return os.path.relpath(path, ROOT)


def _run_validate() -> bool:
    return cmd_validate({}, None) == 0


def cmd_run(data: dict, args) -> int:
    """Autonomous loop: dispatch -> model works -> validate -> review (different worker) -> done/rework."""
    cfg = load_config()
    if args.model:
        cfg["model"] = args.model
    if args.review_model:
        cfg["review_model"] = args.review_model

    dry = args.dry_run or (not args.live and not cfg["autonomy"].get("enabled", False))
    pool = cfg.get("worker_pool") or ["w1"]
    max_iter = 1 if args.once else cfg["loop"].get("max_iterations", 20)
    sleep_s = 0 if args.once else cfg["loop"].get("sleep_seconds", 0)
    stop_idle = cfg["loop"].get("stop_when_idle", True)

    build_model, build_note = _resolve_model(cfg["model"], cfg)
    review_model, review_note = _resolve_model(cfg.get("review_model", build_model), cfg)
    cfg["model"] = build_model
    cfg["review_model"] = review_model

    mode = "DRY-RUN (no model calls, no writes)" if dry else f"LIVE via {cfg['gh_command'][0]} · model={cfg['model']}"
    print(f"\n  Agent Factory autonomous loop — {mode}")
    print(f"  workers: {', '.join(pool)}  |  max iterations: {max_iter}\n")
    if build_note:
        print(f"  note: {build_note}")
    if review_note and review_note != build_note:
        print(f"  note: {review_note}")

    wi = 0
    completed = 0
    failed_this_run: set[str] = set()
    for it in range(max_iter):
        worker = pool[wi % len(pool)]
        wi += 1  # automated switch: round-robin worker rotation

        candidates = [t for t in _dispatchable(data) if t["id"] not in failed_this_run]
        if not candidates:
            print(f"  [{it + 1}] idle — nothing dispatchable.")
            if stop_idle:
                break
            if sleep_s:
                time.sleep(sleep_s)
            continue

        task = candidates[0]
        set_lease(task, worker, data["config"]["lease_ttl_minutes"])
        task["station"] = "build"
        log(task, f"run:dispatch->build @{worker}")
        prompt = build_prompt(task, cfg)

        print(f"  [{it + 1}] @{worker} → {task['id']} [{task['priority']}] {task['title'][:48]}")

        if dry:
            wl = _worklog(task["id"], "prompt.dry.md", prompt)
            print(f"        DRY-RUN: prompt written to {wl}; would call model + validate + review.")
            # keep in-memory claim so the next iteration switches to a different task
            continue

        save(data)
        _worklog(task["id"], "prompt.md", prompt)
        ok, out = call_model(prompt, cfg, model=cfg["model"])
        _worklog(task["id"], "build.response.md", out)
        if not ok:
            print(f"        ✗ model error: {out[:120]}")

            if _is_prompt_too_large(out):
                task["station"] = "blocked"
                task["block_reason"] = "Prompt payload too large for provider; reduce context or prompt limits"
                log(task, "run:model-error-413->blocked")
                print("        ↳ moved to BLOCKED (413 payload too large); adjust prompt budget/read_first.")
            else:
                task["station"] = "rework"
                log(task, "run:model-error->rework")

            clear_lease(task)
            failed_this_run.add(task["id"])
            save(data)

            # Back off if provider asks to slow down.
            if _is_rate_limited(out):
                wait_s = max(15, int(sleep_s) if sleep_s else 0)
                if wait_s:
                    print(f"        ↳ rate limited; sleeping {wait_s}s before next iteration.")
                    time.sleep(wait_s)
            continue

        if cfg["autonomy"].get("apply_edits"):
            written = apply_edits(out)
            print(f"        applied {len(written)} file(s): {', '.join(written) or '(none parsed)'}")

        passed = True
        if cfg["autonomy"].get("auto_validate", True):
            passed = _run_validate()
        if not passed:
            print("        ✗ validate failed → rework")
            task["station"] = "rework"
            clear_lease(task)
            log(task, "run:validate-fail->rework")
            save(data)
            continue

        # build ok → review by a DIFFERENT worker (automated role switch)
        task["built_by"] = worker
        task["station"] = "review"
        log(task, f"run:build->review built_by={worker}")
        save(data)

        reviewer = next((w for w in pool if w != worker), worker)
        approved = True
        if cfg["autonomy"].get("auto_review", True):
            rprompt = build_prompt(task, cfg) + "\n\n## Build output to review\n" + out[:8000]
            rok, rout = call_model(rprompt, cfg, system=cfg["prompt"].get("review_system"),
                                   model=cfg.get("review_model"))
            _worklog(task["id"], "review.response.md", rout)
            approved = rok and rout.strip().upper().startswith("APPROVE")
            print(f"        review @{reviewer}: {'APPROVE' if approved else 'REJECT'}")

        if approved:
            task["station"] = "done"
            clear_lease(task)
            log(task, f"run:review->done reviewer={reviewer}")
            completed += 1
            if cfg["autonomy"].get("auto_commit"):
                subprocess.run(["git", "add", "-A"], cwd=ROOT)
                subprocess.run(["git", "commit", "-m", f"feat({task['id']}): autonomous"], cwd=ROOT)
        else:
            task["station"] = "rework"
            clear_lease(task)
            log(task, f"run:review-reject->rework reviewer={reviewer}")
        save(data)
        if sleep_s:
            time.sleep(sleep_s)

    print(f"\n  Loop finished — {completed} task(s) completed this run.")
    if dry:
        print("  (dry-run made no changes to the queue.)")
    return 0


# ------------------------------------------------------------------------- parser
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="FlexCMS Agent Factory dispatcher")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="show the assembly-line board")

    n = sub.add_parser("next", help="dispatch the next ready task to an agent")
    n.add_argument("--agent", required=True)

    c = sub.add_parser("claim", help="claim a specific task by id")
    c.add_argument("id")
    c.add_argument("--agent", required=True)

    m = sub.add_parser("move", help="move a task to a station")
    m.add_argument("id")
    m.add_argument("station")

    pa = sub.add_parser("pass", help="advance build->test->review->done")
    pa.add_argument("id")

    fa = sub.add_parser("fail", help="send a task back to rework")
    fa.add_argument("id")
    fa.add_argument("--reason", default="")

    bl = sub.add_parser("block", help="block a task")
    bl.add_argument("id")
    bl.add_argument("--reason", default="")

    ub = sub.add_parser("unblock", help="unblock a task -> ready")
    ub.add_argument("id")

    rl = sub.add_parser("release", help="release a (stale) lease")
    rl.add_argument("id")

    ad = sub.add_parser("add", help="add a new task")
    ad.add_argument("--id", required=True)
    ad.add_argument("--title", required=True)
    ad.add_argument("--priority", default="P2")
    ad.add_argument("--station", default="backlog")
    ad.add_argument("--modules", default="")
    ad.add_argument("--deps", default="")
    ad.add_argument("--read-first", dest="read_first", default="")

    sub.add_parser("lint", help="consistency checks")
    sub.add_parser("validate", help="run the build/test quality gate")

    ru = sub.add_parser("run", help="autonomous loop: dispatch→model→validate→review→done")
    ru.add_argument("--once", action="store_true", help="run a single iteration")
    ru.add_argument("--live", action="store_true",
                    help="force live mode even when autonomy.enabled=false")
    ru.add_argument("--dry-run", action="store_true",
                    help="plan only: no model calls, no queue writes (also default unless autonomy.enabled)")
    ru.add_argument("--model", default="", help="override build model for this run")
    ru.add_argument("--review-model", default="", help="override review model for this run")
    return p


DISPATCH = {
    "status": cmd_status, "next": cmd_next, "claim": cmd_claim, "move": cmd_move,
    "pass": cmd_pass, "fail": cmd_fail, "block": cmd_block, "unblock": cmd_unblock,
    "release": cmd_release, "add": cmd_add, "lint": cmd_lint, "validate": cmd_validate,
    "run": cmd_run,
}


def main(argv: list[str]) -> int:
    args = build_parser().parse_args(argv)
    data = load()
    return DISPATCH[args.cmd](data, args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

