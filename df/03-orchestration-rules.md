# 03 - The Factory Orchestration Rules

## Goal

Keep delivery moving after a human starts the factory, while preserving role separation and evidence quality.

## Working tree state — do not interrupt the human about pre-existing changes

The repository working tree is normally **dirty**: earlier sessions leave
untracked artifacts under `df/artifacts/`, modified boards under `df/runtime/`,
and in-progress delivery files. This is expected, not a problem.

- **Do NOT stop to ask the human about uncommitted or untracked ("unregistered")
  changes you did not make.** Treat a dirty working tree as the normal starting
  state and proceed with the task.
- Never treat pre-existing changes as a blocker, and never offer to revert,
  clean, stash, or `git checkout` them.
- Only concern yourself with the files **your current task** touches. Leave every
  other modified or untracked file exactly as you found it.
- Commit or push **only** when the human explicitly asks (per repo rules). Until
  then, adding files to the working tree without committing is fine and needs no
  confirmation.
- The one exception: if a file *your task must edit* already has unrelated
  uncommitted changes and editing it could clobber them, note that in your handoff
  and work carefully — but still do not block the whole session on it.

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

## Permanently disabled roles — QA and PO (all operating modes)

Per human decision on 2026-07-08, the `qa` and `po` roles are **permanently
disabled in every operating mode** (Mode A autonomous and Mode B interactive).
This is a standing policy, not a temporary override.

- The router and any agent must **never** select, execute, or simulate the `qa`
  or `po` role.
- No task may pass through the states `READY_FOR_QA`, `QA_IN_PROGRESS`,
  `QA_FAILED`, `READY_FOR_PO`, `PO_REVIEW`, or `PO_REJECTED`. These states are
  retired and must not be entered.
- `REFINEMENT_QUESTIONS` no longer routes to `po`. When a delivery lane needs a
  product answer it cannot safely assume, it documents the question and moves the
  task to `BLOCKED` for explicit human direction.
- **The delivery lane is now the terminal owner.** After a lane fully satisfies
  the developer testing bar below, it moves the task straight from
  `DEV_IN_PROGRESS` to `DONE` — there is no separate QA or PO gate.

### Developer testing bar (replaces the QA gate)

Because QA is disabled, the delivery developer owns verification end to end. Any
new or changed functionality must be **100% covered, run, and fixed** by the
developer using unit tests and Selenium test automation before the work is
reported complete.

- The developer covers each piece of functionality with a unit test or an
  automated (Selenium) test **immediately** after implementing it, choosing the
  test type that fits the functionality. Do not write tests whose only purpose is
  to cover another test; when writing tests *was* the task, that test is the
  deliverable and needs no meta-test.
- The developer is responsible for designing the test scenarios that cover 100%
  of the functionality, then writing, running, and fixing those tests.
- A developer may **not** report a task complete (move it to `DONE`) until all of
  the following hold:
  1. 100% of the functionality is developed and exercised by a full application
     build that runs **without a single error**;
  2. test scenarios covering 100% of the functionality are prepared and recorded
     in the task's artifact folder;
  3. the unit tests and/or automated tests are implemented and run with **0
     errors**, and the full application build is **100% working**.
- If any of these cannot be met, the task stays `DEV_IN_PROGRESS` or moves to
  `BLOCKED` with the exact failure recorded — it is never reported done.

The objective router gate below still runs as a backstop, but it does not replace
the developer's own responsibility to reach a green build with full test
coverage.


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
delivery lane moves a task to `DONE`, the router runs a deterministic
build/test/lint command (`DF_GATE_CMD`) itself, from the repository root:

- gate passes -> the `DONE` transition stands;
- gate fails -> the router overrides the claim, routes the task back to
  `RETURNED_TO_DEV`, and records `df/artifacts/{task-id}/gate-report.md`;
- gate not configured -> skipped, with a startup warning that quality is
  unguarded.

This makes a green build an objective precondition for completion, independent of
what the delivery agent claims. With QA and PO disabled, delivery roles carry
full verification responsibility per the developer testing bar above; the router
gate is a backstop, not a substitute for the role's own tests and validation.

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

