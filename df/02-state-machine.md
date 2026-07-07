# 02 - The Factory State Machine

This file defines task states and allowed transitions.

## States

| State | Owner | Meaning |
|---|---|---|
| `OPEN` | factory | Task exists but has not been prepared. |
| `INTAKE` | `sa` | SA is triaging the raw task. |
| `REFINEMENT_IN_PROGRESS` | `sa` | SA is refining acceptance criteria and assumptions. |
| `REFINEMENT_QUESTIONS` | `po` / human | Product answers are needed before work can continue. |
| `REFINED` | factory | The task is clear enough for routing or architecture. |
| `NEEDS_ARCHITECTURE` | `sa` | Solution design is required before delivery. |
| `ARCHITECTURE_IN_PROGRESS` | `sa` | SA is producing or revising the solution design. |
| `READY_FOR_DESIGN` | `designer` | UI/UX design input is required before frontend implementation. |
| `DESIGN_IN_PROGRESS` | `designer` | Design work is underway. |
| `READY_FOR_DEV` | delivery lane | The task is ready for exactly one delivery lane. |
| `DEV_IN_PROGRESS` | delivery lane | The assigned lane is implementing the work. |
| `READY_FOR_QA` | `qa` | Delivery/design/docs work is ready for verification. |
| `QA_IN_PROGRESS` | `qa` | QA is actively verifying the task. |
| `QA_FAILED` | `qa` | QA found defects or missing evidence. |
| `READY_FOR_PO` | `po` | QA passed and product review is next. |
| `PO_REVIEW` | `po` | PO is validating the result. |
| `PO_REJECTED` | `po` | PO rejected the result. |
| `RETURNED_TO_DEV` | delivery lane | Rework is required by the original lane unless SA reroutes it. |
| `BLOCKED` | human/factory | Work cannot continue safely. |
| `DONE` | factory | PO accepted the task. |
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
| `ARCHITECTURE_IN_PROGRESS` | `READY_FOR_QA` | docs/process-only work completed by SA |
| `READY_FOR_DESIGN` | `DESIGN_IN_PROGRESS` | designer start note |
| `DESIGN_IN_PROGRESS` | `READY_FOR_DEV` | design package complete |
| `READY_FOR_DEV` | `DEV_IN_PROGRESS` | lane start note |
| `RETURNED_TO_DEV` | `DEV_IN_PROGRESS` | rework plan |
| `DEV_IN_PROGRESS` | `READY_FOR_QA` | implementation summary and validation evidence |
| `READY_FOR_QA` | `QA_IN_PROGRESS` | QA start note |
| `QA_IN_PROGRESS` | `QA_FAILED` | defect report |
| `QA_FAILED` | `RETURNED_TO_DEV` | QA handoff with reproduction details |
| `QA_IN_PROGRESS` | `READY_FOR_PO` | QA pass report |
| `READY_FOR_PO` | `PO_REVIEW` | PO start note |
| `PO_REVIEW` | `PO_REJECTED` | rejection report |
| `PO_REJECTED` | `RETURNED_TO_DEV` | rework request |
| `PO_REVIEW` | `DONE` | PO acceptance report |
| Any active state | `BLOCKED` | blocker reason and owner |
| `BLOCKED` | previous actionable state | blocker resolution note |

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

