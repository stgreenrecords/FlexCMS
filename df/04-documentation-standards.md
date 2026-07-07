# 04 - The Factory Documentation Standards

## Required runtime files

| File | Purpose |
|---|---|
| `df/runtime/board.md` | current task queue and states (single source of truth) |
| `df/runtime/design-board.md` | designer queue view (auto-generated) |
| `df/runtime/backend-dev-board.md` | backend delivery queue view (auto-generated) |
| `df/runtime/frontend-dev-board.md` | frontend delivery queue view (auto-generated) |
| `df/runtime/devops-board.md` | DevOps delivery queue view (auto-generated) |
| `df/runtime/data-engineer-board.md` | data delivery queue view (auto-generated) |
| `df/runtime/activity-log.md` | chronological record of activity |
| `df/runtime/decisions.md` | architecture/product/quality decisions |
| `df/runtime/risks.md` | risks and blockers |

The five lane sub-boards are **derived from `board.md` by the router** (each
lists the rows whose Owner-role column matches that lane) and are regenerated on
every board change. Do not hand-edit them; change a task's State/Owner on
`board.md` and the views re-render. To regenerate them manually, run
`df/agent-router/render-subboards.bash`.

## Required task artifact folder

Each task must have a folder:

```text
df/artifacts/{task-id}/
```

Recommended structure:

```text
df/artifacts/{task-id}/
|-- task.md
|-- refinement-questions.md
|-- solution-design.md
|-- design/
|-- backend/
|-- frontend/
|-- devops/
|-- data/
|-- qa-report.md
|-- po-review.md
|-- defects.md
|-- handoffs.md
`-- screenshots/
```

Create only the folders that apply to the task.

## Design asset rule

Designer documentation stays under `df/artifacts/{task-id}/design/`, but design assets such as HTML, PNG, SVG, PDF, and similar files belong under:

```text
design/{page-slug}/
```

Use globally unique, descriptive page slugs.

## Documentation ownership

- `sa` owns refinement, solution design, lane routing, and shared task setup.
- `designer` writes only design-owned task artifacts.
- delivery lanes write only their own lane artifacts.
- `qa` writes QA reports and defects.
- `po` writes PO reviews and acceptance/rejection evidence.

## Timestamp format

Use:

```text
YYYY-MM-DD HH:mm local
```

or include a timezone if known.

## Markdown quality rules

- Be factual and concise.
- Record exact commands when they matter.
- Separate expected vs actual behavior.
- Append history; do not silently rewrite it.
- Redact secrets and private data.

## Minimum activity log entry

```markdown
## {timestamp} - {role} - {task-id}

- State: {state}
- Action: {what was done}
- Evidence: {files/commands/screenshots}
- Result: PASS | FAIL | BLOCKED | PARTIAL
- Next: {next role/action}
- Risks/blockers: {none or list}
```

## Test evidence rules

Implementation roles and QA must record:

- the command or source of evidence;
- the environment;
- the result;
- failures or reruns;
- skipped checks and why they were skipped.

