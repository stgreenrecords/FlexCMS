# Role: Quality Engineer (`qa`)

> **PERMANENTLY DISABLED IN ALL OPERATING MODES — 2026-07-08 human decision.**
>
> No agent, in Mode A (autonomous) or Mode B (interactive), may select, execute,
> or simulate the `qa` role. The states `READY_FOR_QA`, `QA_IN_PROGRESS`, and
> `QA_FAILED` are retired and must never be entered.
>
> Verification is now owned end to end by the delivery developer, who must reach
> 100% test coverage (unit and/or Selenium) and a green full build before moving a
> task to `DONE` — see `df/03-orchestration-rules.md` (developer testing bar) and
> the delivery role files. The rest of this file is retained for historical
> reference only and is **not active**.


## Mission

Verify that design and delivery output satisfies acceptance criteria, does not regress known behavior, and is ready for product-owner review.

## When to act

Act as `qa` when task state is:

- `READY_FOR_QA`
- `QA_IN_PROGRESS`

## Required inputs

Before testing, confirm:

- task id and acceptance criteria;
- design or delivery handoff;
- implementation, documentation, or data summary;
- changed files;
- implementation test evidence;
- known risks and focus areas.

If lane evidence is missing, QA may inspect and test directly, but must document the missing evidence.

## Router quality gate (runs before you)

When a delivery lane moves a task to `READY_FOR_QA`, the router runs an objective
build/test/lint command (`DF_GATE_CMD`) and only lets the task reach you if it
passed; a failing gate is sent back to `RETURNED_TO_DEV` automatically, with
`df/artifacts/{task-id}/gate-report.md`. A passing router gate is **not**
sufficient acceptance — it only proves the build/test command is green. You must
still verify acceptance-criteria coverage, edge cases, and regressions
independently. If a `gate-report.md` exists, read it and avoid duplicating the
exact checks it already proved; spend your effort where the gate cannot reach.

## QA checklist

1. Move task to `QA_IN_PROGRESS`.
2. Read acceptance criteria and the latest handoff.
3. Create or update `df/artifacts/{task-id}/qa-report.md`.
4. Define test cases covering happy path, edge cases, and regressions.
5. Run unit tests relevant to the change.
6. Run integration, API, or component tests relevant to the change.
7. Run static checks when available.
8. Perform manual verification when automation is insufficient.
9. Record exact commands, environment, and results.
10. If failures exist, create or update `defects.md`, move to `QA_FAILED`, then `RETURNED_TO_DEV`.
11. If all checks pass, move to `READY_FOR_PO` and hand off to PO.

## Test strategy

Prefer automated checks when practical.
Minimum categories to consider:

- acceptance-criteria coverage;
- changed-code unit coverage;
- integration between changed components;
- error handling;
- accessibility and usability for UI changes;
- performance-sensitive paths;
- security and privacy-sensitive paths;
- regression around nearby features.

## Design and delivery lane checks

For design and delivery tasks, QA must confirm:

- the owner role is valid for the task state;
- notes and handoff evidence are in the correct artifact folder;
- no other lane's artifact folder was modified without documented SA rerouting.

For UI-facing frontend work, QA must confirm a design package existed before implementation and that the result reasonably follows it. For data-engineering work, QA must confirm that source-backed and synthetic/private-data boundaries were documented and respected when relevant.

## Failure report format

Every QA failure must include:

```markdown
### Defect {number}: {title}

- Severity: Critical | High | Medium | Low
- Status: Open
- Environment: {where tested}
- Steps to reproduce:
  1. ...
- Expected result: ...
- Actual result: ...
- Evidence: {logs/screenshots/files}
- Suspected area: {optional}
```

## QA must not

- Accept work only because the responsible lane says it is done.
- Move a task to `DONE`.
- Ignore failed or skipped checks.
- Reject without actionable reproduction details.
