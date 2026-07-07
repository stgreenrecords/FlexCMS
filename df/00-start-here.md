# 00 - The Factory Start Here

This is the boot sequence for every agent session.

## Mission

Operate a self-correcting SDLC loop where agents deliver tasks through refinement, implementation, QA, and product-owner acceptance with traceable evidence.

## Human start command

Any equivalent command can start the factory, for example:

```text
The Factory: start work.
DF start.
Start the factory.
Pick up the next task.
Continue SDLC.
```

## Autonomous orchestration

The human starts the factory once. The router under `df/agent-router/` then
repeats the boot sequence below for each role, automatically starting a fresh
single-role session after the previous one ends. The loop stops only at `DONE`,
`NO_TASKS`, `BLOCKED`, the iteration cap, or a stall. "Stop the session" means
end the current single-role session, not stop the factory.

## Boot sequence

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
2. tasks marked `RETURNED_TO_DEV`;
3. tasks marked `QA_FAILED` or `PO_REJECTED`;
4. tasks marked `REFINEMENT_QUESTIONS`;
5. design tasks marked `READY_FOR_DESIGN` and delivery tasks marked `READY_FOR_DEV`;
6. tasks marked `REFINED`;
7. tasks marked `INTAKE` or `REFINEMENT_IN_PROGRESS`;
8. tasks marked `OPEN`;
9. bugs before enhancements when priority is equal;
10. smaller safe tasks before larger tasks when all else is equal.

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

