# ECMS-61 — Content search v2: reindex, facets, suggestions

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Visitors and authors find content quickly without an external search product.

## Current state

Content search has no reindex endpoint (GAP-083), no facets, suggestions, or boosting; the index only updates as a side effect of replication.

## Acceptance criteria

- [ ] AC1: Admin reindex endpoint for content (full and per site) using `IndexRebuildService`.
- [ ] AC2: Facets (template, tag, locale, site), suggestions/autocomplete, field boosting, language analysers.
- [ ] AC3: Author-side search across drafts for omnisearch (ECMS-62).
- [ ] AC4: IT coverage against the Elasticsearch container.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-61-TC01 | AC1 | ui | _Draft:_ Admin reindex endpoint for content (full and per site) using `IndexRebuildService`. | — |
| ECMS-61-TC02 | AC2 | api | _Draft:_ Facets (template, tag, locale, site), suggestions/autocomplete, field boosting, language analysers. | — |
| ECMS-61-TC03 | AC3 | api | _Draft:_ Author-side search across drafts for omnisearch (ECMS-62). | — |
| ECMS-61-TC04 | AC4 | api | _Draft:_ IT coverage against the Elasticsearch container. | — |

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-search/src/main/java/com/flexcms/search/service/IndexRebuildService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-61/task.md`). |
