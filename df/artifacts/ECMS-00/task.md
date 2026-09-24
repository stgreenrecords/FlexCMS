# ECMS-00 — Enterprise-level CMS parity: gap analysis and backlog

## Summary

- Priority: P1
- Type: Task
- Current state: `DONE`
- Owner role: `sa`

## Business goal

Compare FlexCMS's current functionality against the native feature set of an enterprise-level CMS (the core-features reference document in the repository root) and turn every gap into a routed, testable task.

## Acceptance criteria

- [x] AC1: Every capability area in the reference document is compared with FlexCMS, with evidence for the current state — `gap-analysis.md`.
- [x] AC2: Every gap maps to at least one task; every task has testable acceptance criteria, an owner role, and an explicit `## Dependencies` section — `df/artifacts/ECMS-01` … `ECMS-66`.
- [x] AC3: Tasks are single-lane, or routed to `sa` (`NEEDS_ARCHITECTURE`) for design and splitting; visible UI work without an approved design goes to `designer` first.
- [x] AC4: All tasks are registered on `df/runtime/board.md`; lane sub-boards regenerated.
- [x] AC5: Capabilities where FlexCMS already exceeds the baseline, and deliberate exclusions, are recorded so no task regresses them.

## Out of scope

- Implementing any of the gaps (child tasks carry delivery).
- Third-party integrations and AI-dependent features (see `gap-analysis.md`).

## Assumptions

- Native platform capabilities only.
- Priorities are an SA proposal based on the reference document's business-function tables and unblock count; a human may reprioritise.

## Dependencies

- none

## Evidence

- `df/artifacts/ECMS-00/gap-analysis.md`
- Live stack probe 2026-09-24 (component registry, templates, sites, DAM, PIM), code search across `flexcms/` and `frontend/`, `docs/MANUAL_TEST_CASES_AUTHORING.md` §20, `df/runtime/risks.md`.

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | ARCHITECTURE_IN_PROGRESS | Gap analysis across 15 capability areas. |
| 2026-09-24 local | sa | DONE | 66 child tasks created and registered; docs-only SA work validated. |
