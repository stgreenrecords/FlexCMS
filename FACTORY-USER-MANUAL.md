# The Factory User Manual

This manual is for a human operator who wants to start, observe, and control The Factory loop from the terminal.

## What the factory does

The factory reads `df/runtime/board.md`, picks the highest-priority actionable task, resolves the responsible role from the task state, and launches exactly one role-session at a time.

In `auto` mode it keeps chaining role-sessions until one of these happens:

- all work is `DONE`;
- all remaining work is `BLOCKED`;
- there are no actionable tasks;
- the iteration cap is reached; or
- a role-session makes no board change and stall protection stops the loop.

## Prerequisites

Before starting the factory, make sure these prerequisites are satisfied:

1. you are in the repository root;
2. `df/runtime/board.md` exists and contains at least one actionable task;
3. your selected agent runner is installed and available on `PATH`;
4. the agent runner authentication is working for the account you want to use, if required;
5. `.df-factory.env` exists if you want local overrides for model, runner, or iteration defaults; and
6. you understand that the factory will update runtime files and task artifacts in this repository.

Quick checks:

```zsh
pwd
sed -n '1,80p' df/runtime/board.md
```

## Before you start

Make sure you are in the repository root:

```zsh
cd "/path/to/your/project"
```

The local launcher configuration lives in `.df-factory.env` when you create it.

Template defaults in this framework:

- adapter: `auto`
- max iterations: `300`
- max parallel sessions: `5`
- quality gate: disabled until you set `DF_GATE_CMD`
- rework cap: `3`
- delivery worktree isolation: on (set `DF_WORKTREES=0` to disable)

## Quality gate (recommended)

Because the loop runs fully autonomously to `DONE`, the router's objective
quality gate is the only check that does not depend on an agent grading its own
work. Set `DF_GATE_CMD` to your real build/test/lint command in
`.df-factory.env`:

```dotenv
DF_GATE_CMD='npm ci && npm test && npm run lint'
DF_MAX_REWORK='3'
```

When a delivery lane reports `READY_FOR_QA`, the router runs that command. If it
fails, the task is sent back to `RETURNED_TO_DEV` with a
`df/artifacts/<task>/gate-report.md`, regardless of what the agent claimed. If
you leave `DF_GATE_CMD` empty the factory still runs, but logs a startup warning
that quality is unguarded.

## Delivery isolation (git worktrees)

By default each delivery-lane session runs in its own git worktree on a branch
`df/task/<id>`, so parallel sessions cannot clobber each other's code. The
quality gate runs inside that worktree, and only code that passes is integrated
into your main branch (as a commit touching just that task's files). Failed work
stays in the worktree under `.df-worktrees/<id>` for the next attempt; that
directory is gitignored. Set `DF_WORKTREES=0` to run delivery in the main tree
instead. This requires the project to be a git repository — if it is not, the
router automatically falls back to main-tree execution.

Note: integration creates commits on your current branch. Review them as normal;
the router never pushes.

The router will launch up to `--max-parallel` role-sessions concurrently when
the board has independent eligible tasks. A task is eligible only when every
entry in its `df/artifacts/{task-id}/task.md` `## Dependencies` section is in
state `DONE`. Set `--max-parallel 1` (or `DF_FACTORY_MAX_PARALLEL=1` in
`.df-factory.env`) for fully serial behaviour. The SA role owns the contract
that dependency lists are accurate; see `df/roles/sa.md`.

## Fast start

Start the factory with repository defaults:

```zsh
./start factory
```

## What you will see in the terminal

The same terminal will show three kinds of messages:

1. router messages, prefixed with `df-router`;
2. launcher messages, prefixed with `df-agent-runner`; and
3. live child-agent output, prefixed with `df-agent-runner][stdout]` or `df-agent-runner][stderr]`.

If you see heartbeat lines, the session is active and not silent.

## Common commands

### Preview only

```zsh
./call-start-factory.bash --dry-run
```

### Start one specific task

```zsh
./call-start-factory.bash --task-id TASK-001
```

### Force the first role-session

```zsh
./call-start-factory.bash --role sa
```

### Run one manual step only

```zsh
./call-start-factory.bash --adapter manual
```

### Limit the iteration count for one run

```zsh
./call-start-factory.bash --max-iterations 10
```

## How to stop the factory

Press `Ctrl+C` in the terminal where you started it.

## How to inspect current state

```zsh
sed -n '1,200p' df/runtime/board.md
sed -n '1,240p' df/runtime/activity-log.md
```

## Troubleshooting

### The factory looks stuck

If you see heartbeat lines such as:

```text
[df-agent-runner] Copilot still running (30s elapsed) ...
```

then it is not frozen; it is still processing.

### The wrong task was selected

Inspect `df/runtime/board.md` and verify the task `State`. The router chooses by state priority, not by free-text notes.

### I want different local defaults

Edit `.df-factory.env`.

Example:

```dotenv
DF_AGENT_CMD='./df/agent-router/run-role-session.bash'
DF_AGENT_RUNNER='copilot'
DF_AGENT_MODEL='gpt-5.4'
DF_AGENT_MODE='autopilot'
DF_FACTORY_ADAPTER='auto'
DF_FACTORY_MAX_ITERATIONS='300'
DF_GATE_CMD='npm ci && npm test && npm run lint'
DF_MAX_REWORK='3'
```

