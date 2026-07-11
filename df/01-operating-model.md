# 01 - The Factory Operating Model

## Roles

The Factory uses six active roles. The `qa` and `po` roles are **permanently
disabled in every operating mode** (human decision 2026-07-08) and must never be
selected, executed, or simulated — see `df/03-orchestration-rules.md`.

| Role | Short name | Purpose |
|---|---|---|
| Solution Architect | `sa` | Refines tasks, defines acceptance criteria, and guards solution design quality. |
| Designer | `designer` | Produces UI/UX design packages before visible frontend changes. |
| Backend Developer | `backend-dev` | Implements backend services, APIs, persistence, migrations, and full backend test coverage. |
| Frontend Developer | `frontend-dev` | Implements client applications, UI behavior, accessibility, and full frontend/Selenium test coverage. |
| DevOps Engineer | `devops` | Implements CI/CD, automation, runtime packaging, infrastructure, and environment tooling with tests. |
| Data Engineer | `data-engineer` | Produces datasets, fixtures, imports, source maps, and data-quality evidence with tests. |
| ~~Quality Engineer~~ | ~~`qa`~~ | **DISABLED.** Verification is now owned end to end by the delivery developer. |
| ~~Product Owner~~ | ~~`po`~~ | **DISABLED.** No automated product acceptance; open product questions go to a human via `BLOCKED`. |

## Role ownership

A role owns a task only while the task is in that role's state.
Ownership must be reflected in `df/runtime/board.md` and, when applicable, the matching design or delivery subdashboard.

## Single-role-per-session rule

**An agent must not switch roles within one session.**

When the current role finishes, it must:

1. document the final task state;
2. write a handoff note for the next role; and
3. end its single-role session.

The `df/agent-router/` orchestrator then starts the next role's session
automatically (with `--adapter auto`), so the human only starts the factory
once. Role isolation is preserved: every session still runs exactly one role.

## Standard flow

```text
OPEN
  -> INTAKE
  -> REFINEMENT_IN_PROGRESS
  -> REFINED
  -> NEEDS_ARCHITECTURE
  -> READY_FOR_DESIGN (if UI design is required)
  -> DESIGN_IN_PROGRESS
  -> READY_FOR_DEV
  -> DEV_IN_PROGRESS
  -> DONE   (delivery lane, after the developer testing bar is met)
```

QA and PO are disabled, so there is no `READY_FOR_QA`/`QA_*`/`READY_FOR_PO`/`PO_*`
stage. The delivery lane carries the task to `DONE` itself once the developer
testing bar in `df/03-orchestration-rules.md` is fully satisfied.

Small, well-defined tasks may skip refinement or architecture when the skip reason is documented.
Documentation/process-only changes may move from `ARCHITECTURE_IN_PROGRESS` directly to `DONE` when no delivery lane is required and the change is validated.

## Delivery lane routing

Before work moves to `READY_FOR_DEV`, SA must route it to exactly one delivery lane:

- `backend-dev`
- `frontend-dev`
- `devops`
- `data-engineer`

If a task spans multiple lanes, split it into child tasks unless the work is inseparable and must be serialized.

## Lane artifact ownership

Each delivery lane writes only in its own artifact folder:

```text
df/artifacts/{task-id}/backend/
df/artifacts/{task-id}/frontend/
df/artifacts/{task-id}/devops/
df/artifacts/{task-id}/data/
```

Designer documentation belongs under `df/artifacts/{task-id}/design/`, while design assets belong under root `design/{page-slug}/`.

## Frontend design gate

Visible UI work requires a design package before `frontend-dev` changes user-facing behavior or markup.
If no design package exists, the work must be blocked or routed to `designer` first.

## Communication protocol

Agents communicate through repository artifacts, not hidden state.
Every role session must leave behind a start/finish trail, evidence, and a handoff.

## Definition of done

With QA and PO disabled, the delivery developer owns the full bar. A task is done
only when:

- implementation or documentation is complete;
- 100% of the new/changed functionality is covered by unit tests and/or Selenium
  automation that the developer designed, wrote, ran, and fixed;
- the full application build runs with **zero errors** and all those tests pass
  with **0 failures**;
- test scenarios covering 100% of the functionality are recorded in the task's
  artifact folder; and
- runtime files are updated.

If any part of this bar cannot be met, the task is not done — it stays
`DEV_IN_PROGRESS` or moves to `BLOCKED` with the exact failure recorded.

