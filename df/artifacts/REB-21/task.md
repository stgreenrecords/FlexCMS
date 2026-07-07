# REB-21 — Implement DAM authoring and asset-reference Selenium E2E suite

## Summary

- Priority: P1
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Implement Selenium E2E coverage for DAM authoring flows and prove uploaded/selected assets can be referenced from authored content and rendered after publish.

## Read first

- `df/artifacts/REB-17/task.md`
- `df/artifacts/REB-07/data/summary.md`
- `df/artifacts/REB-07/data/dam-import-map.json`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorAssetController.java`
- `frontend/apps/admin/src/app/(admin)/dam/page.tsx`
- `frontend/apps/admin/src/app/(admin)/dam/[id]/page.tsx`
- `frontend/apps/admin/src/app/editor/page.tsx`

## Dependencies

- REB-07
- REB-11
- REB-13

## Functional scope

- Asset list/search/pagination.
- Upload binary with path/site/user.
- Asset detail metadata.
- Binary content stream and content-type verification.
- Folder listing.
- Delete test-owned asset.
- Select/reference asset in page editor.
- Publish page with asset and verify publish environment renders it without broken image.

## Required E2E scenarios

1. **DAM browser smoke**: open `/dam`, verify asset list loads from API and no error/empty state appears when seeded assets exist.
2. **Search**: search for a known imported asset, verify results match query and clear search restores list.
3. **Upload**: upload a small deterministic test image/file to a test path, verify UI success, asset metadata API, and binary stream content type/bytes.
4. **Asset detail**: open uploaded/seeded asset detail route, verify metadata fields and preview/content link.
5. **Folder listing**: verify `/api/author/assets/folder` for a known folder and UI behavior if folder browsing is wired.
6. **Editor asset reference**: assign uploaded or imported asset to a media component field, save, verify author API property/reference.
7. **Publish asset-backed page**: publish the page referencing the asset, verify publish environment renders the asset URL and browser reports no broken image.
8. **Delete safety**: delete only the test-owned uploaded asset after unlinking; verify asset API returns not found. If delete UI is not wired, use API cleanup and document UI blocker.
9. **Negative upload**: attempt unsupported/oversized/empty file if validation exists; verify user-facing error and no persisted asset.

## Acceptance criteria

- AC1: Tests cover upload, list/search, detail/content stream, content reference, publish render, and cleanup.
- AC2: Asset-reference publish test verifies the publish environment with image health checks.
- AC3: Test-owned assets use unique paths and do not delete seeded/shared assets.
- AC4: Evidence is recorded in `df/artifacts/REB-21/devops/summary.md` with JUnit and screenshots.

