# ECMS-41 — Asset metadata and lifecycle API

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Assets can be described, reorganised, and deduplicated after upload.

## Current state

No update/move/rename endpoint (DAM-090); `title`/`description`/`metadata` cannot be set after upload; no embedded-metadata extraction; duplicates are accepted silently.

## Acceptance criteria

- [ ] AC1: `PATCH /api/author/assets/{id}` updates title, description, and custom metadata.
- [ ] AC2: Move and rename assets between folders, updating folder counts and keeping renditions.
- [ ] AC3: Embedded EXIF/XMP/IPTC metadata extracted at ingest into `metadata`.
- [ ] AC4: Duplicate detection by content checksum: upload reports an existing identical asset (warn or reject per flag).
- [ ] AC5: Audit entries; unit + IT coverage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-41-TC01 | AC1 | api | _Draft:_ `PATCH /api/author/assets/{id}` updates title, description, and custom metadata. | — |
| ECMS-41-TC02 | AC2 | api | _Draft:_ Move and rename assets between folders, updating folder counts and keeping renditions. | — |
| ECMS-41-TC03 | AC3 | api | _Draft:_ Embedded EXIF/XMP/IPTC metadata extracted at ingest into `metadata`. | — |
| ECMS-41-TC04 | AC4 | api | _Draft:_ Duplicate detection by content checksum: upload reports an existing identical asset (warn or reject per flag). | — |
| ECMS-41-TC05 | AC5 | api | _Draft:_ Audit entries; unit + IT coverage. | — |

## Out of scope

- Asset Detail UI (ECMS-42).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-dam/src/main/java/com/flexcms/dam/service/AssetIngestService.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorAssetController.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-41/task.md`). |
