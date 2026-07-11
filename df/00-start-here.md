# 00 - The Factory Start Here

This is the boot sequence for every agent session.

## Mission

Operate a self-correcting SDLC loop where agents deliver tasks through refinement, implementation, QA, and product-owner acceptance with traceable evidence.

## Operating modes

The Factory runs in one of two modes. **Decide which one you are in before doing
anything else**, because it changes whether you start the router and where you stop.

### Mode A — Autonomous (router-driven)

Triggered when a human explicitly starts the factory, e.g.:

```text
The Factory: start work.
DF start.
Start the factory.
Continue SDLC.
Run the autonomous factory.
```

The human starts the factory once. The router under `df/agent-router/`
(`start-factory.bash`) then repeats the boot sequence below for each role,
automatically starting a fresh single-role session after the previous one ends.
The loop stops only at `DONE`, `NO_TASKS`, `BLOCKED`, the iteration cap, or a
stall. "Stop the session" means end the current single-role session, not stop the
factory. Everything about autonomous chaining and "one session = one role" in
`df/01-operating-model.md` and `df/03-orchestration-rules.md` applies literally in
this mode.

### Mode B — Interactive (manual, human-in-the-loop) — DEFAULT for chat requests

Triggered when a human asks you directly, in conversation, to work a task, e.g.:

```text
Take a look at the next task from the backlog.
Pick up REB-11 and implement it.
Look at this new task and start implementation.
What's next on the board? Do it.
```

In this mode:

- **Do NOT run `start-factory.bash` or any `df/agent-router/` command, and do NOT
  spawn autonomous orchestration.** The human is the orchestrator. Just work
  within the project directly in this session.
- Still read the boot docs below **for context** — the board, state machine, role
  behavior, and documentation standards all apply. Use them to understand *how* to
  do the work correctly, not as a trigger to launch the router.
- Pick the task the human named (or, if they said "next", the highest-priority
  actionable task per **Task selection order** below), determine its role from its
  state, and **implement it here**.
- "One session = one role" and "end the single-role session" are properties of the
  *router's* automation, **not** a limit on an interactive session. You may carry a
  task through consecutive roles in the same chat when the human asks, as long as
  you keep the role hats, artifacts, and handoff notes distinct per role.
- When you finish the requested work, **update the runtime docs, write the handoff
  note, and report back to the human** — do not auto-start the next task or session.

When in doubt about which mode a request implies, assume **Mode B** and ask the
human only if it matters.

## Boot sequence

This sequence applies to both modes. Steps **11** and **16** ("execute only that
one role", "end this single-role session") are literal in **Mode A** (the router
enforces them). In **Mode B** they mean: keep clean role separation in your work,
but continue serving the human in this session instead of terminating — see
**Operating modes** above.

1. Read this file.
2. Read `df/01-operating-model.md`.
3. Read `df/02-state-machine.md`.
4. Read `df/03-orchestration-rules.md`.
5. Read `df/04-documentation-standards.md`.
6. Read the relevant role file in `df/roles/`.
7. Inspect `df/runtime/board.md`.
8. Inspect design and delivery subdashboards when design or implementation/data work is involved.
9. Pick the highest-priority actionable task.
10. Determine the responsible role from the task state.
11. **Execute only that one role.**
12. Create or update `df/artifacts/{task-id}/`.
13. Execute the role checklist.
14. Update runtime documentation.
15. Write a handoff note for the next role.
16. **End this single-role session.**

## Task selection order

Choose tasks in this order:

1. tasks explicitly requested by the user in the current message;
2. tasks marked `RETURNED_TO_DEV` (e.g. bounced back by the router gate);
3. design tasks marked `READY_FOR_DESIGN` and delivery tasks marked `READY_FOR_DEV`;
4. tasks marked `REFINED`;
5. tasks marked `INTAKE` or `REFINEMENT_IN_PROGRESS`;
6. tasks marked `OPEN`;
7. bugs before enhancements when priority is equal;
8. smaller safe tasks before larger tasks when all else is equal.

> QA and PO are disabled, so `QA_FAILED`, `PO_REJECTED`, and `REFINEMENT_QUESTIONS`
> are not agent-actionable states. Any task sitting in `REFINEMENT_QUESTIONS`
> waits for a human; agents do not answer product questions.

## If there is no board yet

Create `df/runtime/board.md` from `df/templates/board.md`. If no tasks exist, record `NO_TASKS` and stop.

## Factory heartbeat

At the end of every session, document:

- current role;
- task id;
- current state;
- actions completed;
- evidence produced;
- next role/action;
- blockers, risks, and assumptions.

