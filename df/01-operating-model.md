# 01 - The Factory Operating Model

## Roles

The Factory uses eight required roles.

| Role | Short name | Purpose |
|---|---|---|
| Solution Architect | `sa` | Refines tasks, defines acceptance criteria, and guards solution design quality. |
| Designer | `designer` | Produces UI/UX design packages before visible frontend changes. |
| Backend Developer | `backend-dev` | Implements backend services, APIs, persistence, migrations, and backend tests. |
| Frontend Developer | `frontend-dev` | Implements client applications, UI behavior, accessibility, and frontend tests. |
| DevOps Engineer | `devops` | Implements CI/CD, automation, runtime packaging, infrastructure, and environment tooling. |
| Data Engineer | `data-engineer` | Produces datasets, fixtures, imports, source maps, and data-quality evidence. |
| Quality Engineer | `qa` | Verifies work independently through tests and structured quality checks. |
| Product Owner | `po` | Validates business outcome and accepts or rejects the result. |

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
  -> REFINEMENT_QUESTIONS
  -> REFINED
  -> NEEDS_ARCHITECTURE
  -> READY_FOR_DESIGN (if UI design is required)
  -> DESIGN_IN_PROGRESS
  -> READY_FOR_DEV
  -> DEV_IN_PROGRESS
  -> READY_FOR_QA
  -> QA_IN_PROGRESS
  -> READY_FOR_PO
  -> PO_REVIEW
  -> DONE
```

Small, well-defined tasks may skip refinement or architecture when the skip reason is documented.
Documentation/process-only changes may move from `ARCHITECTURE_IN_PROGRESS` directly to `READY_FOR_QA` when no delivery lane is required.

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

A task is done only when:

- implementation or documentation is complete;
- relevant tests/checks passed or limits are documented;
- QA approved the task;
- PO accepted the task; and
- runtime files are updated.

