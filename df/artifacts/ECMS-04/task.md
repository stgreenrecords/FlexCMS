# ECMS-04 — Page copy and rename API

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors can duplicate a page (optionally with its subtree) and rename it, which every enterprise page console offers.

## Current state in FlexCMS

No copy endpoint (live copy creates a sync relationship, which is not a plain copy). No rename endpoint — renaming requires delete + recreate.

## Acceptance criteria

- [ ] AC1: `POST /api/author/content/node/copy` copies a node (and optionally its subtree) to a target parent with a new name; copies get fresh ids, status DRAFT, and new version history.
- [ ] AC2: `POST /api/author/content/node/rename` changes the last path segment, rewrites descendant paths, and keeps ids and version history.
- [ ] AC3: Both reject a target path that already exists with 409 and a missing source with 404.
- [ ] AC4: Rename and copy are audited and replicate correctly (a renamed published page is retracted at the old path and republished at the new one, or the behaviour is decided and documented).
- [ ] AC5: Service-layer transactions; unit + IT coverage including subtree path rewriting.
- [ ] AC6: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-04/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- UI (ECMS-05).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
