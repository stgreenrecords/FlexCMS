# ECMS-03A — Backend: publish-tier asset delivery and asset replication

## Summary

- Priority: P0
- Type: Story
- Current state: `DONE`
- Owner role: `backend-dev`
- Parent: `ECMS-03` (design: `df/artifacts/ECMS-03/solution-design.md`, `DEC-ECMS-002`)

## Business goal

Published pages can serve the DAM images and documents they reference.

## Acceptance criteria

- [x] AC1: `AssetUrls` defines the canonical `/dam/renditions/{id}[/{key}]` contract, extracts asset ids from both canonical and legacy `/api/author/assets/{id}/content` references (relative or absolute), and rewrites legacy references to canonical.
- [x] AC2: `GET /dam/renditions/{id}` and `/{id}/{renditionKey}` stream an ACTIVE asset (rendition falls back to the original) on both tiers, with `Cache-Control: public, max-age=86400`, an `ETag`, and `304` for a matching `If-None-Match`; unknown or inactive → 404 RFC 7807.
- [x] AC3: Publishing a page, site root, or XF variation (tree or single node) replicates every ACTIVE asset its properties reference; the publish tier upserts the asset row with the author's id and its renditions.
- [x] AC4: `POST /api/author/assets/{id}/publish` and `/unpublish` replicate activate/deactivate; deleting an asset on author replicates the deletion after commit; the publish tier then answers 404.
- [x] AC5: Page and XF delivery JSON never contains `/api/author/assets/...`; references are rewritten to canonical URLs.
- [x] AC6: The publish tier purges `/dam/renditions/{id}` and `/dam/renditions/{id}/*` from the CDN when an asset is activated, deactivated, or deleted.
- [x] AC7: `DamClient.getRenditionUrl` and `DirectDamClient` URLs are canonical URLs, not storage keys.
- [x] AC8: Developer testing bar (`DEC-DF-007`): unit tests for every AC, an `*IT` for the native upsert SQL, scenarios recorded in `df/artifacts/ECMS-03A/backend/`, `mvn verify` green.

## Dependencies

- none

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Split from ECMS-03. |
| 2026-09-24 local | backend-dev | DEV_IN_PROGRESS | Started (Mode B). |
| 2026-09-24 local | backend-dev | DONE | All ACs met; `mvn verify` green; live verification 29/29; fixed pre-existing AFTER_COMMIT replication-log loss. Evidence: `backend/test-scenarios.md`. |
