# ECMS-01 — Taxonomy and tagging service for pages, assets, and fragments

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Give every content type a shared, governed tag vocabulary so content can be classified, filtered, and searched consistently across sites and languages.

## Current state

No tag concept exists anywhere. `AssetRepository.search` once referenced a phantom `tags` column (R-REB-21-002). Page, asset, and fragment classification is impossible.

## Acceptance criteria

- [ ] AC1: Tag namespaces and hierarchical tags (e.g. `products:vehicles/suv`) with CRUD API under `/api/author/tags`, following model → repository → service → controller layering.
- [ ] AC2: Each tag stores a title per locale; API returns the locale-appropriate title with fallback to the default locale.
- [ ] AC3: Pages (content nodes) and DAM assets can be tagged and untagged; tags are returned in author and headless JSON.
- [ ] AC4: Deleting or merging a tag in use returns 409 unless an explicit `force`/`mergeInto` is given; merge re-points all references.
- [ ] AC5: Content search and asset search can filter by tag (including a tag's descendants).
- [ ] AC6: Flyway migration for the tag tables; RFC 7807 errors for not-found/conflict via existing exception types.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-01-TC01 | AC1 | api | _Draft:_ Tag namespaces and hierarchical tags (e.g. `products:vehicles/suv`) with CRUD API under `/api/author/tags`, following model → repository → service → controller layering. | — |
| ECMS-01-TC02 | AC2 | api | _Draft:_ Each tag stores a title per locale; API returns the locale-appropriate title with fallback to the default locale. | — |
| ECMS-01-TC03 | AC3 | api | _Draft:_ Pages (content nodes) and DAM assets can be tagged and untagged; tags are returned in author and headless JSON. | — |
| ECMS-01-TC04 | AC4 | api | _Draft:_ Deleting or merging a tag in use returns 409 unless an explicit `force`/`mergeInto` is given; merge re-points all references. | — |
| ECMS-01-TC05 | AC5 | api | _Draft:_ Content search and asset search can filter by tag (including a tag's descendants). | — |
| ECMS-01-TC06 | AC6 | integration | _Draft:_ Flyway migration for the tag tables; RFC 7807 errors for not-found/conflict via existing exception types. | — |

## Out of scope

- Admin tag-manager UI and tag pickers (separate frontend task after design).
- AI auto-tagging.

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ContentNode.java`
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/repository/AssetRepository.java`
- `flexcms/flexcms-search/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-01/task.md`). |
