# ECMS-41 — Asset metadata and lifecycle API

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Assets can be described, reorganised, and deduplicated after upload.

## Current state in FlexCMS

No update/move/rename endpoint (DAM-090); `title`/`description`/`metadata` cannot be set after upload; no embedded-metadata extraction; duplicates are accepted silently.

## Acceptance criteria

- [ ] AC1: `PATCH /api/author/assets/{id}` updates title, description, and custom metadata.
- [ ] AC2: Move and rename assets between folders, updating folder counts and keeping renditions.
- [ ] AC3: Embedded EXIF/XMP/IPTC metadata extracted at ingest into `metadata`.
- [ ] AC4: Duplicate detection by content checksum: upload reports an existing identical asset (warn or reject per flag).
- [ ] AC5: Audit entries; unit + IT coverage.
- [ ] AC6: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-41/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- Asset Detail UI (ECMS-42).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-dam/src/main/java/com/flexcms/dam/service/AssetIngestService.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorAssetController.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
