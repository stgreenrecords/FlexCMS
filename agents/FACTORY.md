# Agent Factory — FlexCMS Automated Delivery Line

> **Legacy notice (2026-07-06):** Dark Factory under `df/` is now the active SDLC
> source of truth. This document and `agents/factory.py` remain as migration and
> deterministic validation helpers only. Use `df/00-start-here.md`,
> `df/runtime/board.md`, and `df/artifacts/{task-id}/` for new work.

> **This supersedes the manual two-agent routing** (`kyle implement` / `erik implement` /
> "Is this for Kyle or Erik?"). Work is now pulled from a machine-readable queue by
> interchangeable workers, scheduled by a dispatcher — not by human keystrokes.
>
> Single source of truth: **`agents/queue.json`**. Control plane: **`agents/factory.py`**.
> The prose boards (`WORK_BOARD_*.md`) are kept only as a historical archive.

---

## 1. Why a factory

The old flow made a **human the scheduler**: nothing moved until someone typed
`kyle implement`. Locks were a hand-edited Markdown table, priorities and
`Blocked By` were resolved by eye, and one agent did build→test→review→merge on
its own work. That does not scale and is not automatable.

The factory model fixes each bottleneck:

| Old (manual) | New (factory) |
|---|---|
| Human types which agent runs | Dispatcher hands out the next ready task |
| Named agents (Kyle/Erik) with fixed scope | Interchangeable **workers** pull any task |
| Hand-edited module-lock table | **Automatic leases** derived from a task's `modules` |
| `Blocked By` read by eye | **Dependency graph** enforced by the engine |
| One agent self-reviews and merges | Separate **build → test → review** stations |
| Manual `/validate` checklist | One gate: `factory.py validate` |
| Failure = ad-hoc PAUSE note | Failure flows to a **rework** lane automatically |

---

## 2. The assembly line

```
intake ─▶ backlog ─▶ ready ─▶ build ─▶ test ─▶ review ─▶ done
  (PM)     (groom)   (deps    (worker  (quality (2nd     (merge/
                      cleared) codes)   gate)    worker)   deploy)
                          ▲                          │
                          └────────── rework ◀───────┘   blocked (side lane)
```

| Station | Meaning | Who acts | Exit rule |
|---|---|---|---|
| `backlog` | Raw, ungroomed idea | PM (intake) | Has title, priority, modules, ACs → `ready` |
| `ready` | Groomed, dependencies + ACs defined | dispatcher | Deps done **and** modules free → `build` |
| `build` | A worker is implementing | worker | Code + local build pass → `test` |
| `test` | Automated quality gate runs | worker/CI | `validate` green → `review` |
| `review` | A **different** worker reviews the diff | reviewer | Approved → `done`; else → `rework` |
| `done` | Merged & pushed | — | terminal |
| `rework` | Failed test/review, needs fixes | dispatcher | Re-dispatched → `build` |
| `blocked` | External blocker | dispatcher | Blocker cleared → `ready` |

**WIP limits** (`agents/queue.json` → `config.wip_limits`) cap how many tasks may sit
in `build`/`test`/`review` at once, so the line pulls rather than piles up.

---

## 3. Roles (not names)

- **PM / Intake** — turns a request into a groomed `backlog`→`ready` task
  (`factory.py add`). Same senior-PM decomposition rules as before: split if it
  touches >3–4 modules or has >8 ACs; each subtask independently verifiable.
- **Dispatcher** — the `factory.py` engine. Chooses the next task by priority,
  cleared dependencies, and free modules; issues a **lease**.
- **Worker** — any interchangeable agent. Calls `next --agent <id>`, implements,
  runs the gate, then `pass`. Workers are stateless and identical.
- **Reviewer** — a worker that is **not** the builder of that task. Reviews the diff
  against the ACs at the `review` station. Approve → `pass`; reject → `fail`.

> **Definition of Done is evidence-based, not formal.** `validate` (compile + unit + FE build)
> and mocked UI tests are **necessary but not sufficient** — they never close a feature/retest task.
> A task may only reach `done` when the behavior is demonstrated against the **live seeded stack**
> and the proof is attached (HTTP transcript / DB row / Playwright trace with mocks OFF / screenshot).
> The reviewer must independently replay that evidence. See `docs/RETEST_PLAN.md` §3–§5 and the fast
> gate `scripts/live_smoke.py`. Mocked-API tests are only evidence of rendering, never of a working feature.

---

## 4. Leases replace the lock table

When a task enters `build`, the dispatcher stamps a **lease**
(`agent`, `since`, `expires`). While the lease is live, that task's `modules` are
locked — the dispatcher will not hand out any other task that touches the same
module. This is the automatic equivalent of `WORK_BOARD.md §2`, with three wins:

1. **No stale locks** — leases expire (`config.lease_ttl_minutes`, default 4h). An
   expired lease is treated as free; `factory.py release <ID>` frees one manually.
2. **No races** — the engine, not a human, checks module overlap atomically.
3. **No bookkeeping** — locks are derived from data, never edited by hand.

---

## 5. Worker loop (what an agent actually does)

```bash
# 1. Pull the next ready task (dispatcher decides which)
python3 agents/factory.py next --agent worker-1

# 2. Read the printed read_first files + ACs. Implement per CLAUDE.md conventions.

# 3. Run the single quality gate
python3 agents/factory.py validate      # backend compile + tests + frontend build

# 4a. Green -> advance to test, then review
python3 agents/factory.py pass <ID>

# 4b. Something broke you can't fix now -> back to rework or blocked
python3 agents/factory.py fail  <ID> --reason "…"
python3 agents/factory.py block <ID> --reason "…"

# 5. Commit with the task id as scope
git add -A && git commit -m "feat(<ID>): <description>" && git push
```

A **reviewer** (different agent) then picks the task up at `review`, checks the
diff against ACs, and runs `pass <ID>` (→ `done`) or `fail <ID>` (→ `rework`).

> **Shortcut:** every command below is also reachable through the `flex` CLI as
> `flex agent <cmd> …` (e.g. `flex agent next --agent worker-1`). It simply forwards
> to `agents/factory.py`, so use whichever is convenient.

---

## 6. `factory.py` command reference

| Command | Purpose |
|---|---|
| `status` | Print the board by station + active module locks + what's dispatchable |
| `next --agent <id>` | **Dispatch** the highest-priority ready task (auto-lease → `build`) |
| `claim <ID> --agent <id>` | Pull a *specific* task (still checks deps + locks) |
| `pass <ID>` | Advance `build → test → review → done` |
| `fail <ID> [--reason]` | Send back to `rework` |
| `block <ID> --reason` / `unblock <ID>` | Enter / leave the blocked lane |
| `move <ID> <station>` | Manual override to any station |
| `add --id --title --priority --modules --deps --read-first` | Add a task |
| `release <ID>` | Drop a (stale) lease |
| `lint` | Consistency checks: orphan deps, stale/misplaced leases, dependency cycles |
| `validate` | The one quality gate (compile + unit tests + frontend build) |

---

## 7. Task schema (`agents/queue.json`)

```jsonc
{
  "id": "E-16",
  "title": "…",
  "priority": "P0|P1|P2|P3|TA",
  "station": "backlog|ready|build|test|review|done|blocked|rework",
  "depends_on": ["E-02"],          // must all be in 'done' before dispatch
  "modules": ["apps/site-nextjs"],  // auto-locked while in-flight
  "read_first": ["docs/…"],         // printed to the worker on assignment
  "acceptance_criteria": ["…"],     // reviewer checks the diff against these
  "lease": { "agent": null, "since": null, "expires": null },
  "history": [ { "ts": "…", "event": "…" } ]  // append-only audit trail
}
```

---

## 8. Invariants (what `lint` enforces)

- Every `depends_on` id exists.
- Any task in `build`/`test`/`review` **has** a live lease.
- No task outside those stations holds a live lease.
- The dependency graph is acyclic.

Run `python3 agents/factory.py lint` before every push; it is also part of the
`validate` habit. CI enforces it: `.github/workflows/agent-queue.yml` runs `lint`
on every change under `agents/**` and fails the build on an inconsistent queue.

---

## 9. Migration status

`agents/queue.json` was seeded from the historical boards: all of Kyle's `TA-00…04`
and Erik's `E-01…15` are recorded at station `done` with their dependency edges and
modules, so the graph and lock derivation are accurate from day one. New work is
added with `factory.py add`; the two prose boards are now read-only history.

---

## 10. Autonomous mode (`factory.py run`)

The loop turns the factory fully self-driving: it dispatches, calls a model **via the GitHub
CLI**, validates, reviews with a *different* worker, and advances the task — then rotates to the
next worker/task and repeats.

```bash
flex agent run --dry-run     # plan only: build prompts, no model calls, no writes (safe default)
flex agent run --live --once # force one live iteration even if autonomy.enabled=false
flex agent run --live        # full live loop (respects config max_iterations)
flex agent run --live --model openai/gpt-5 --review-model openai/gpt-5-mini
```

**Per-iteration cycle** (`build → test → review → done`, with automated switching):

1. **Switch worker** — round-robin through `worker_pool`.
2. **Dispatch** the next ready task (deps cleared + modules free), lease it → `build`.
3. **Build prompt** from the task (system instructions + ACs + allowed modules + `read_first`
   file contents) and **call the model**: `gh models run <model>` (configurable).
4. **Apply edits** if `autonomy.apply_edits` — the model returns full files using the
   `### FILE: <path>` + fenced-block protocol.
5. **Validate** (`auto_validate`) → on failure, task goes to `rework`.
6. **Review** by a **different** worker (`auto_review`): a second model call checks the diff
   against the ACs and replies `APPROVE`/`REJECT` → `done` or `rework`.
7. Optional `auto_commit`; then loop to the next worker/task until idle or `max_iterations`.

Every model interaction is logged to `docs/agent-runs/<TASK-ID>/` (prompt, build response,
review response) for audit.

### Configuration — `agents/config.json`

| Key | Meaning |
|---|---|
| `model` | Model id passed to the GitHub CLI (e.g. `openai/gpt-4o`) |
| `review_model` | Optional separate model for review pass (defaults to `model`) |
| `model_aliases` / `preferred_model_ids` | Friendly-name mapping + fallback order when a model id is unavailable |
| `gh_command` | Command template; `{model}` is substituted. Default `["gh","models","run","{model}"]` |
| `worker_pool` | Interchangeable worker ids; the loop rotates through them (automated switch) |
| `loop.max_iterations` / `stop_when_idle` / `sleep_seconds` | Loop bounds and pacing |
| `autonomy.enabled` | Master switch — while `false`, `run` is always dry-run (no model calls / writes) |

`run --model` and `run --review-model` override config values for a single run.
| `autonomy.apply_edits` | Apply model file edits to the working tree |
| `autonomy.auto_validate` / `auto_review` / `auto_commit` | Gate + review + commit automation |
| `prompt.system` / `review_system` | System prompts for the build and review roles |
| `prompt.include_read_first` / `max_file_bytes` | Context injection controls |

**Prerequisites for live mode:** GitHub CLI authenticated (`gh auth login`) with access to the
configured model (e.g. the GitHub Models extension: `gh extension install github/gh-models`).
Until `autonomy.enabled=true`, `run` stays in safe dry-run and touches nothing.

> **Safety:** `apply_edits` writes files and `auto_commit` commits them. Turn these on only when
> `agents/config.json` is trusted and you have branch protection / CI (`agent-queue.yml` +
> `live_smoke.py`) guarding `main`. The evidence-based Definition of Done (§ above) still applies —
> autonomous completions must pass `validate` and review.

