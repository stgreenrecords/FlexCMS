# 03 - The Factory Orchestration Rules

## Goal

Keep delivery moving after a human starts the factory, while preserving role separation and evidence quality.

## Main loop

```text
while factory is running:
  load board
  load design and delivery subdashboards
  choose the highest-priority actionable task
  choose the responsible role from task state
  execute exactly one role session
  validate outputs
  update runtime documentation
  hand off to the next role
  if no task is actionable:
    record NO_TASKS or BLOCKED and stop
```

## Refinement loop

When a task is ambiguous:

```text
SA reads raw input
SA asks only decision-grade questions
PO answers with documented authority
SA writes acceptance criteria
SA routes to architecture, design, or delivery
```

Rules:

- ask questions only when the answer can change scope, tests, risks, architecture, or acceptance criteria;
- do not ask questions that can be answered from repository context;
- use documented low-risk assumptions only when safe;
- block the task when a critical answer is missing.

## Priority rules

Sort actionable tasks by:

1. user-requested task in the current session;
2. rejected or failed work;
3. highest business priority;
4. dependency-unblocking value;
5. oldest task;
6. smallest safe task.

## Routing rules

- `designer` owns design packages.
- `backend-dev`, `frontend-dev`, `devops`, and `data-engineer` own delivery work.
- UI-facing frontend work must have design input first.
- Multi-lane work should be split into child tasks whenever practical.

## Active override - PO role disabled

Per human decision on 2026-07-07, automated `po` role sessions are disabled
until further notice. The router must not auto-select `po` for
`REFINEMENT_QUESTIONS`, `READY_FOR_PO`, `PO_REVIEW`, or `PO_REJECTED` states.
Those states wait for explicit human product direction or a later decision record
that re-enables the role. No agent may move a task to `DONE` as PO acceptance
while this override is active.

This override does not authorize the current implementation session to execute
QA. QA remains separate and must be performed in a distinct QA session or by a
human reviewer.


## Handoff rules

Every handoff must include:

- task id;
- current state;
- previous role result;
- files changed or artifacts created;
- checks performed and results;
- known risks;
- next role instructions.

## Objective quality gate

The loop does not rely solely on an agent's self-reported state change. When a
delivery lane moves a task to `READY_FOR_QA`, the router runs a deterministic
build/test/lint command (`DF_GATE_CMD`) itself, from the repository root:

- gate passes -> the task proceeds to `qa`;
- gate fails -> the router overrides the claim, routes the task back to
  `RETURNED_TO_DEV`, and records `df/artifacts/{task-id}/gate-report.md`;
- gate not configured -> skipped, with a startup warning that quality is
  unguarded.

This makes a green build an objective precondition for QA, independent of what
the delivery agent claims. Delivery roles should still run the project's checks
themselves and record the evidence; the router gate is a backstop, not a
substitute for the role's own validation.

## Rework cap

Each task carries a rework counter (`RETURNED_TO_DEV`, `QA_FAILED`,
`PO_REJECTED`, and gate failures). When a task reaches `DF_MAX_REWORK` cycles
(default 3) the router force-`BLOCKED`s it for human attention instead of
letting it consume the whole iteration budget in a rework loop.

## Delivery isolation

Each delivery-lane session runs in its own git worktree (branch
`df/task/<id>`), so parallel sessions cannot clobber each other's code. The
`df/runtime/` control plane stays shared and router-owned: the agent updates its
task's row on the worktree board, the router reconciles that state onto the main
board, and on a passing gate the router integrates only the task's code and its
own artifact folder into the main branch. Disable with `DF_WORKTREES=0`.

## Evidence hierarchy

Prefer stronger evidence in this order:

1. automated tests or machine validation;
2. exact command output;
3. screenshots or exported artifacts;
4. structured manual notes;
5. reasoned inspection.

## Tool failure handling

If a tool or command fails:

1. retry once if the failure appears transient;
2. capture the exact error;
3. try a safe alternative path;
4. if still blocked, document the blocker and stop.

## Autonomous chaining

A human starts the factory once. The `df/agent-router/` orchestrator then runs
the main loop above, starting a fresh single-role session for each successive
role automatically. With `--adapter auto` the chaining needs no further human
input; with `--adapter manual` the router prepares the next role-session prompt
and stops so a human can start it. Either way each session runs exactly one role.

## Stop conditions

A single role-session must end when:

- the current role's work is complete and the handoff is written.

The whole factory loop stops when:

- all tasks are `DONE`;
- all remaining tasks are `BLOCKED` (including tasks force-`BLOCKED` at the
  rework cap);
- no task exists;
- the iteration cap (`--max-iterations`) is reached;
- a role-session makes no board change (stall protection); or
- continuing would risk data loss, security exposure, or policy violation.

**One session = one role.**

