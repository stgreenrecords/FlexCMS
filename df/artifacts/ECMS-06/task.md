# ECMS-06 — Page properties contract and validation

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Turn page metadata from free-form JSON into a defined, validated contract every page carries.

## Current state in FlexCMS

Page properties are an untyped JSONB map (`jcr:title`, `template`). No navigation title, description, vanity URL, redirect, thumbnail, robots, or social fields; on/off time exists only as scheduling columns.

## Acceptance criteria

- [ ] AC1: A versioned page-properties schema (title, navTitle, description, tags, vanityUrl, redirectTarget, onTime, offTime, thumbnail asset, robots, canonicalOverride, ogTitle/ogDescription/ogImage, hideInNav).
- [ ] AC2: Create/update of a page validates against the schema and returns 422 with field errors on violation.
- [ ] AC3: onTime/offTime map onto the existing scheduling columns so there is one source of truth.
- [ ] AC4: Properties are exposed in author and headless page JSON under a stable key.
- [ ] AC5: Existing seeded pages remain valid (migration or defaults).
- [ ] AC6: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-06/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- The properties dialog (ECMS-07); vanity/redirect resolution (ECMS-59).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-01

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ContentNode.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/service/ScheduledPublishingService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
