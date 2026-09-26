# ECMS-03A — Backend: publish-tier asset delivery and asset replication

| Field | Value |
|---|---|
| Type | Story |
| Priority | P0 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Parent | [ECMS-03](ECMS-03.md) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Published pages can serve the DAM images and documents they reference.

## Acceptance criteria

- [x] AC1: `AssetUrls` defines the canonical `/dam/renditions/{id}[/{key}]` contract, extracts asset ids from both canonical and legacy `/api/author/assets/{id}/content` references (relative or absolute), and rewrites legacy references to canonical.
- [x] AC2: `GET /dam/renditions/{id}` and `/{id}/{renditionKey}` stream an ACTIVE asset (rendition falls back to the original) on both tiers, with `Cache-Control: public, max-age=86400`, an `ETag`, and `304` for a matching `If-None-Match`; unknown or inactive → 404 RFC 7807.
- [x] AC3: Publishing a page, site root, or XF variation (tree or single node) replicates every ACTIVE asset its properties reference; the publish tier upserts the asset row with the author's id and its renditions.
- [x] AC4: `POST /api/author/assets/{id}/publish` and `/unpublish` replicate activate/deactivate; deleting an asset on author replicates the deletion after commit; the publish tier then answers 404.
- [x] AC5: Page and XF delivery JSON never contains `/api/author/assets/...`; references are rewritten to canonical URLs.
- [x] AC6: The publish tier purges `/dam/renditions/{id}` and `/dam/renditions/{id}/*` from the CDN when an asset is activated, deactivated, or deleted.
- [x] AC7: `DamClient.getRenditionUrl` and `DirectDamClient` URLs are canonical URLs, not storage keys.

## Test cases

Delivered before the Playwright test-case standard; no test-case table was recorded. Regression coverage for this capability is tracked by the Selenium→Playwright port tasks on the board.

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Split from ECMS-03. |
| 2026-09-24 | Started (Mode B). |
| 2026-09-24 | All ACs met; `mvn verify` green; live verification 29/29; fixed pre-existing AFTER_COMMIT replication-log loss. Evidence: `git show archive/dark-factory:df/artifacts/ECMS-03A/backend/test-scenarios.md`. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-03A/task.md`). |
