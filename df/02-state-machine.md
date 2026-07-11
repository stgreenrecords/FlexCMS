# 02 - The Factory State Machine

This file defines task states and allowed transitions.

> **QA and PO are permanently disabled (2026-07-08).** The states
> `READY_FOR_QA`, `QA_IN_PROGRESS`, `QA_FAILED`, `READY_FOR_PO`, `PO_REVIEW`, and
> `PO_REJECTED` are **retired** — no task may enter them. The delivery lane moves
> work from `DEV_IN_PROGRESS` directly to `DONE` after meeting the developer
> testing bar in `df/03-orchestration-rules.md`.

## States

| State | Owner | Meaning |
|---|---|---|
| `OPEN` | factory | Task exists but has not been prepared. |
| `INTAKE` | `sa` | SA is triaging the raw task. |
| `REFINEMENT_IN_PROGRESS` | `sa` | SA is refining acceptance criteria and assumptions. |
| `REFINEMENT_QUESTIONS` | human | Product answers are needed before work can continue (PO disabled — route to a human). |
| `REFINED` | factory | The task is clear enough for routing or architecture. |
| `NEEDS_ARCHITECTURE` | `sa` | Solution design is required before delivery. |
| `ARCHITECTURE_IN_PROGRESS` | `sa` | SA is producing or revising the solution design. |
| `READY_FOR_DESIGN` | `designer` | UI/UX design input is required before frontend implementation. |
| `DESIGN_IN_PROGRESS` | `designer` | Design work is underway. |
| `READY_FOR_DEV` | delivery lane | The task is ready for exactly one delivery lane. |
| `DEV_IN_PROGRESS` | delivery lane | The assigned lane is implementing and fully testing the work. |
| ~~`READY_FOR_QA`~~ | ~~`qa`~~ | **RETIRED — QA disabled.** |
| ~~`QA_IN_PROGRESS`~~ | ~~`qa`~~ | **RETIRED — QA disabled.** |
| ~~`QA_FAILED`~~ | ~~`qa`~~ | **RETIRED — QA disabled.** |
| ~~`READY_FOR_PO`~~ | ~~`po`~~ | **RETIRED — PO disabled.** |
| ~~`PO_REVIEW`~~ | ~~`po`~~ | **RETIRED — PO disabled.** |
| ~~`PO_REJECTED`~~ | ~~`po`~~ | **RETIRED — PO disabled.** |
| `RETURNED_TO_DEV` | delivery lane | Rework is required by the original lane unless SA reroutes it (e.g. after a failed router gate). |
| `BLOCKED` | human/factory | Work cannot continue safely. |
| `DONE` | factory | The delivery lane completed the task and met the developer testing bar. |
| `NO_TASKS` | factory | No actionable tasks exist. |

## Allowed transitions

| From | To | Required evidence |
|---|---|---|
| `OPEN` | `INTAKE` | raw task exists |
| `OPEN` | `READY_FOR_DEV` | acceptance criteria are already clear |
| `OPEN` | `NEEDS_ARCHITECTURE` | scope is clear but design is required |
| `INTAKE` | `REFINEMENT_IN_PROGRESS` | SA start note |
| `REFINEMENT_IN_PROGRESS` | `REFINEMENT_QUESTIONS` | refinement questions document |
| `REFINEMENT_IN_PROGRESS` | `REFINED` | acceptance criteria and assumptions documented |
| `REFINEMENT_QUESTIONS` | `REFINEMENT_IN_PROGRESS` | product answers recorded |
| `REFINED` | `NEEDS_ARCHITECTURE` | architecture-needed reason |
| `REFINED` | `READY_FOR_DESIGN` | UI design is needed first |
| `REFINED` | `READY_FOR_DEV` | architecture is not required |
| `NEEDS_ARCHITECTURE` | `ARCHITECTURE_IN_PROGRESS` | SA start note |
| `ARCHITECTURE_IN_PROGRESS` | `READY_FOR_DEV` | solution design plus lane routing |
| `ARCHITECTURE_IN_PROGRESS` | `READY_FOR_DESIGN` | design scope and handoff created |
| `ARCHITECTURE_IN_PROGRESS` | `DONE` | docs/process-only work completed and validated by SA (no delivery lane required) |
| `READY_FOR_DESIGN` | `DESIGN_IN_PROGRESS` | designer start note |
| `DESIGN_IN_PROGRESS` | `READY_FOR_DEV` | design package complete |
| `READY_FOR_DEV` | `DEV_IN_PROGRESS` | lane start note |
| `RETURNED_TO_DEV` | `DEV_IN_PROGRESS` | rework plan |
| `DEV_IN_PROGRESS` | `DONE` | developer testing bar met: 100% test coverage (unit and/or Selenium) designed, run, and green; full build passes with zero errors; test scenarios recorded |
| `DEV_IN_PROGRESS` | `RETURNED_TO_DEV` | router gate failed the build/test command |
| Any active state | `BLOCKED` | blocker reason and owner (includes unanswered product questions, since PO is disabled) |
| `BLOCKED` | previous actionable state | blocker resolution note |

> The transitions into and out of `READY_FOR_QA`, `QA_IN_PROGRESS`, `QA_FAILED`,
> `READY_FOR_PO`, `PO_REVIEW`, and `PO_REJECTED` are removed. QA and PO are
> disabled; a task never enters those states.

## State update format

When changing state, append this block to `df/runtime/activity-log.md`:

```markdown
## {timestamp} - State change

- Task: {task-id}
- From: {old-state}
- To: {new-state}
- Role: {role}
- Reason: {why}
- Evidence: {links/files}
- Next: {next role/action}
```

