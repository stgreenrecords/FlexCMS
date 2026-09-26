# ECMS-06 — Page properties contract and validation

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-01](ECMS-01.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Turn page metadata from free-form JSON into a defined, validated contract every page carries.

## Current state

Page properties are an untyped JSONB map (`jcr:title`, `template`). No navigation title, description, vanity URL, redirect, thumbnail, robots, or social fields; on/off time exists only as scheduling columns.

## Acceptance criteria

- [ ] AC1: A versioned page-properties schema (title, navTitle, description, tags, vanityUrl, redirectTarget, onTime, offTime, thumbnail asset, robots, canonicalOverride, ogTitle/ogDescription/ogImage, hideInNav).
- [ ] AC2: Create/update of a page validates against the schema and returns 422 with field errors on violation.
- [ ] AC3: onTime/offTime map onto the existing scheduling columns so there is one source of truth.
- [ ] AC4: Properties are exposed in author and headless page JSON under a stable key.
- [ ] AC5: Existing seeded pages remain valid (migration or defaults).

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-06-TC01 | AC1 | api | _Draft:_ A versioned page-properties schema (title, navTitle, description, tags, vanityUrl, redirectTarget, onTime, offTime, thumbnail asset, robots, canonicalOverride, ogTitle/ogDescription/ogImage, hideInNav). | — |
| ECMS-06-TC02 | AC2 | api | _Draft:_ Create/update of a page validates against the schema and returns 422 with field errors on violation. | — |
| ECMS-06-TC03 | AC3 | api | _Draft:_ onTime/offTime map onto the existing scheduling columns so there is one source of truth. | — |
| ECMS-06-TC04 | AC4 | api | _Draft:_ Properties are exposed in author and headless page JSON under a stable key. | — |
| ECMS-06-TC05 | AC5 | api | _Draft:_ Existing seeded pages remain valid (migration or defaults). | — |

## Out of scope

- The properties dialog (ECMS-07); vanity/redirect resolution (ECMS-59).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ContentNode.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/service/ScheduledPublishingService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-06/task.md`). |
