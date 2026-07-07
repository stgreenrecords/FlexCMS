# Implementation Notes - TASK-001

## Lane

devops

## Artifact ownership

Write this file only inside the owning lane folder:

- `df/artifacts/{task-id}/backend/dev-notes.md`
- `df/artifacts/{task-id}/frontend/dev-notes.md`
- `df/artifacts/{task-id}/devops/dev-notes.md`
- `df/artifacts/{task-id}/data/data-notes.md`

## Implementation summary

Renamed legacy user-facing branding to `The Factory` across repository documentation, runtime headings, templates, and automation-facing router/test display text while preserving internal `df/` paths and `DF_*` environment variable names.

## Files changed

- `AGENTS.md`: renamed framework references to `The Factory`
- `.github/copilot-instructions.md`: renamed Copilot guidance references to `The Factory`
- `README.md`: renamed framework title and description
- `FACTORY-USER-MANUAL.md`: renamed manual title and intro copy
- `df/00-start-here.md`: renamed boot-sequence title and human start phrase
- `df/01-operating-model.md`: renamed operating-model title and role summary copy
- `df/02-state-machine.md`: renamed state-machine title
- `df/03-orchestration-rules.md`: renamed orchestration-rules title
- `df/04-documentation-standards.md`: renamed documentation-standards title
- `df/templates/board.md`: renamed board template heading
- `df/agent-router/README.md`: renamed router documentation heading
- `df/agent-router/start-factory.bash`: renamed user-facing router prompt/comment branding
- `df/agent-router/board-parser.bash`: renamed header comment branding
- `df/agent-router/state-role-map.bash`: renamed header comment branding
- `df/agent-router/test-router-selection.bash`: renamed fixture board headings used by router validation
- `df/runtime/activity-log.md`: renamed runtime heading and appended implementation log
- `df/runtime/board.md`: updated task state to `READY_FOR_QA`
- `df/runtime/backend-dev-board.md`: renamed runtime heading
- `df/runtime/frontend-dev-board.md`: renamed runtime heading
- `df/runtime/devops-board.md`: renamed runtime heading and updated task state to `READY_FOR_QA`
- `df/runtime/design-board.md`: renamed runtime heading
- `df/runtime/data-engineer-board.md`: renamed runtime heading
- `df/runtime/decisions.md`: renamed runtime heading
- `df/runtime/risks.md`: renamed runtime heading

## Commands run

```text
Repository-wide text scan for legacy brand phrases
"C:\Program Files\Git\bin\bash.exe" -lc 'cd "$PWD" && bash df/agent-router/test-router-selection.bash'
```

Result: PASS

## Unit tests

- No unit-test suite applies to this documentation/tooling-only rebrand task.

## Integration tests

- `df/agent-router/test-router-selection.bash`: PASS

## Manual checks

- Repository-wide search for legacy brand strings: no remaining matches after evidence normalization.
- Confirmed internal `df/` path names and `DF_*` environment variables were left unchanged.

## Risks and limitations

- The repository folder name `DF` and internal automation identifiers intentionally remain unchanged to avoid scope creep and breaking workflow assumptions.

## Rollback notes

- Revert the modified documentation, runtime Markdown files, and router display-text changes in a single commit if the new branding is rejected.

## Ready for QA?

Yes

## Implementation handoff

QA should verify that user-facing branding reads `The Factory` everywhere, confirm no legacy brand strings remain in tracked files, and re-run `df/agent-router/test-router-selection.bash` to ensure router behavior is unchanged.

