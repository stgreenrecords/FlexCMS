# ECMS-10 — Review annotations API

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Reviewers can leave comments pinned to a page or a specific component for structured review before go-live.

## Current state in FlexCMS

No comment/annotation model exists.

## Acceptance criteria

- [ ] AC1: Annotation entity attached to a node path (page or component) with author, text, status (open/resolved), timestamps, and replies.
- [ ] AC2: CRUD + resolve API; list by page including descendant components.
- [ ] AC3: Annotations are excluded from published content and from replication.
- [ ] AC4: Deleting the annotated node removes or orphans its annotations per a documented rule.
- [ ] AC5: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-10/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- Annotate mode UI (ECMS-11).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
