# The Factory Agent Router

The router lets a human **start the factory once** and then drives the SDLC loop
automatically. On each iteration it:

1. reads `df/runtime/board.md`;
2. selects the highest-priority actionable task (per `df/00-start-here.md`);
3. resolves the responsible role from the task state (and the delivery lane from
   the board owner column); blocked tasks whose declared dependencies are all
   `DONE` are resumed through `sa`; and
4. launches exactly **one** fresh role-session through the chosen adapter.

After a session returns, the router re-reads the board and launches the next
role-session, repeating until the work reaches `DONE` / `NO_TASKS` / `BLOCKED`,
the safety `--max-iterations` cap is hit, or a session makes no board change
(stall protection).

When no normal actionable state remains, the router performs one more pass over
`BLOCKED` tasks. If a blocked task's `## Dependencies` entries in
`df/artifacts/{task-id}/task.md` all point to tasks that are now `DONE` on the
runtime board, the router sends that blocked task back to `sa` for an
unblock/reroute session instead of stopping early.

This preserves the **one role per session** principle — each iteration is an
isolated single-role session — while removing the need for a human to re-trigger
each role by hand.

For human-facing start, monitoring, and troubleshooting instructions, see
`FACTORY-USER-MANUAL.md` in the repository root.

## Files

- `start-factory.bash` — entrypoint and main loop.
- `state-role-map.bash` — state → role mapping and task-selection ranking.
- `board-parser.bash` — `board.md` table parser.
- `quality-gate.bash` — objective quality gate, rework cap, and the
  router-side board mutation + lock helpers.
- `render-subboards.bash` — derives the five lane sub-boards from `board.md`.
- `worktree-manager.bash` — per-task git worktree isolation for delivery lanes.

## Git worktree isolation (delivery lanes)

Parallel delivery sessions sharing one working tree can clobber each other's
code even when their declared dependencies are satisfied. To prevent that, each
delivery-lane task (`backend-dev` / `frontend-dev` / `devops` / `data-engineer`)
runs in its own git worktree on branch `df/task/<id>`, created from `main` HEAD:

- The agent edits code there in isolation (`DF_SESSION_ROOT` points the runner
  at the worktree).
- The `df/runtime/` control plane stays **shared and router-owned**: the agent
  updates its task's row on the worktree board, and the router reads that state
  and writes the authoritative value onto the main board. Branch copies of
  `df/runtime/` are never merged, so `board.md` cannot conflict across branches.
- The **quality gate runs inside the worktree**, so broken code never reaches
  `main`. On a pass, the router integrates only the task's code and its own
  `df/artifacts/<task>/` folder into `main` (committing just those paths) and
  removes the worktree. On a fail, nothing integrates and the worktree is kept
  so the next rework session resumes its WIP.

Disable with `DF_WORKTREES=0` (then delivery runs in the main tree, as before).
Requires the repository to be a git work tree; otherwise the router falls back
to main-tree execution automatically. The `.df-worktrees/` directory is
gitignored.

## Lane sub-boards are derived

The five `df/runtime/*-board.md` lane views are regenerated from `board.md` on
every board change (rows are filtered by the Owner-role column). They are not
hand-maintained; update a task's State/Owner on `board.md` instead.

## Objective quality gate (deterministic, router-enforced)

In an autonomous loop the same model can play developer, QA, and PO, so a
self-reported "READY_FOR_QA" is not, by itself, evidence of quality. To anchor
the loop to objective truth, the router runs a configurable gate command
**itself** — deterministic code, not the agent — at the dev → QA boundary:

- When a delivery lane (`backend-dev` / `frontend-dev` / `devops` /
  `data-engineer`) moves a task to `READY_FOR_QA`, the router runs `DF_GATE_CMD`
  from the repo root.
- If it **passes**, the task proceeds to `qa` as normal.
- If it **fails**, the router overrides the agent's claim, routes the task back
  to `RETURNED_TO_DEV`, and writes `df/artifacts/<task>/gate-report.md` with the
  command, exit code, and captured output. The agent cannot self-certify past a
  red build.
- If `DF_GATE_CMD` is unset, the gate is skipped and a warning is logged at
  startup so the operator knows quality is unguarded.

Set `DF_GATE_CMD` to your real build/test/lint command, e.g.
`DF_GATE_CMD='npm ci && npm test && npm run lint'`. The gate is most reliable
under serial execution (`--max-parallel 1`); under parallelism it runs against a
shared working tree and is best-effort.

## Rework cap (loop-budget protection)

A genuinely hard task can otherwise ping-pong
`QA_FAILED → RETURNED_TO_DEV → … ` forever, changing state each hop (so stall
protection never trips) and burning the whole `--max-iterations` budget. The
router counts rework cycles per task (`RETURNED_TO_DEV`, `QA_FAILED`,
`PO_REJECTED`, and gate failures); once a task reaches `DF_MAX_REWORK` (default
3) the router force-`BLOCKED`s it with a clear next-action and an activity-log
entry, so it surfaces for human attention instead of looping.

## Usage

```bash
# One-time local setup for your agent launcher.
cp .df-factory.env.example .df-factory.env

# Default startup: auto adapter, 300 iterations.
./start factory

# Equivalent direct wrapper invocation.
./call-start-factory.bash

# Autonomous with explicit one-off overrides.
DF_AGENT_CMD="my-agent-cli" ./call-start-factory.bash --adapter auto --max-iterations 300

# Plan only, no sessions launched.
./call-start-factory.bash --dry-run

# Conservative: prepare ONE role-session prompt and stop (human-driven chaining).
./call-start-factory.bash --adapter manual
```

## Adapters

| Adapter | Behavior |
|---|---|
| `manual` | Prints the next role-session prompt and stops after one role. A human copies it into a new session. |
| `auto`   | Runs `$DF_AGENT_CMD` for every role-session and loops automatically until a stop condition. |

`call-start-factory.bash` loads an optional repo-local `.df-factory.env` file
before launching the router. Use it to persist `DF_AGENT_CMD` and override the
default startup values without retyping them on every run.

### `auto` adapter contract

`DF_AGENT_CMD` must run exactly one role-session. The router calls it as:

```text
$DF_AGENT_CMD <role> <task-id> <state> <prompt-file>
```

and pipes the same prompt on stdin. The command MUST update `df/runtime/board.md`
to reflect the new task state before returning. If the board is unchanged after a
session, the router stops with a stall error to avoid an infinite loop.

`DF_AGENT_CMD` is intentionally tool-neutral: point it at any AI agent CLI, script,
or wrapper that can read the prompt and act on the repository.

## Stop conditions

- no actionable task remains (`NO_TASKS` / all `DONE` / all `BLOCKED`, including
  blocked tasks whose declared dependencies are still unresolved);
- `--max-iterations` reached (re-run to continue);
- a role-session produced no board change (stall protection);
- a task reaches the rework cap (`DF_MAX_REWORK`) and is force-`BLOCKED`;
- the agent command exits non-zero (that task is marked stalled; independent
  tasks continue).
