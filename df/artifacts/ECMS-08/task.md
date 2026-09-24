# ECMS-08 — Version compare, labels, and historical as-of view API

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Give authors and compliance a real version history: labelled versions, diffs, and the ability to see the page as it was on any date.

## Current state in FlexCMS

Snapshots are taken on every property change and can be restored, but there is no diff, no labels/comments, and no way to render a past state (test doc VER-011).

## Acceptance criteria

- [ ] AC1: Versions can carry a label and comment; `POST .../node/versions` creates an on-demand labelled version.
- [ ] AC2: Diff API returns structured property-level differences between two versions of a node, and component-level differences for a page subtree.
- [ ] AC3: As-of API returns the page JSON (including components) as it was at a given timestamp.
- [ ] AC4: Publishing creates a version automatically.
- [ ] AC5: Unit + IT coverage for diff correctness and as-of reconstruction.
- [ ] AC6: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-08/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- UI (ECMS-09).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ContentNodeVersion.java`
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
