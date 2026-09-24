# ECMS-32 — Staged releases: parallel future versions of a site section

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Campaign teams build next month's version of a section while normal edits continue, then promote it in one step.

## Current state in FlexCMS

No equivalent exists.

## Acceptance criteria

- [ ] AC1: Create a release from one or more source subtrees with a title and target date; content is copied into a separate release area linked to the source.
- [ ] AC2: Sync from source pulls live changes into the release.
- [ ] AC3: Promote: all pages, only modified pages, or a chosen subset replace the source; optional publish in the same step or at the scheduled date.
- [ ] AC4: Nested releases supported; translation jobs can target a release.
- [ ] AC5: Solution design addresses storage (separate ltree root), conflict rules, and permissions.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- UI (ECMS-33).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
