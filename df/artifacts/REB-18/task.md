# REB-18 — Implement content tree, page creation, and author/publish verification Selenium suite

## Summary

- Priority: P0
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Implement Selenium E2E coverage for the content tree and page lifecycle: browse/search/select, create a page, publish it, verify it remains available in the authoring environment, and verify published visibility on the publish environment.

## Read first

- `df/artifacts/REB-17/task.md`
- `df/artifacts/REB-13/task.md`
- `df/artifacts/REB-13/devops/summary.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `frontend/apps/admin/src/app/(admin)/content/page.tsx`
- `frontend/apps/admin/src/app/editor/page.tsx`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`
- `frontend/apps/selenium-e2e/src/cases/admin/authoring-roundtrip.spec.ts`
- `frontend/apps/selenium-e2e/src/pages/EditorPage.ts`
- `frontend/apps/selenium-e2e/src/pages/AuthorApiClient.ts`

## Dependencies

- REB-11
- REB-13

## Functional scope

- Content tree load from `/api/author/content/children` and fallback list behavior.
- Search/filter by page name and URL path.
- Folder breadcrumb/up navigation.
- Selection and select-all behavior.
- Row actions: Edit, Preview, Publish, Duplicate, Move, Delete where implemented.
- Page creation flow, including template/resource type selection if UI is implemented.
- Authoring environment availability after create and publish.
- Publish environment visibility after publish.

## Required E2E scenarios

1. **Content tree smoke**: open `/content`, verify loading resolves, breadcrumbs render, root/site children appear, and no 404/error page is displayed.
2. **Navigation**: drill into a seeded site/locale/page folder, use breadcrumb and up navigation, verify direct children match author API response paths.
3. **Search/filter**: filter by a known seeded page title/path, verify only matching rows remain, clear search, verify full list returns.
4. **Selection**: select one row, select all visible rows, clear selection, verify counts and visual state.
5. **Edit/preview links**: use row actions to open editor and preview for a known seeded page; verify URL encodes the selected path and editor/preview loads.
6. **Create page**: create a unique test page under a safe local test parent with a valid template/resource type; verify the new node exists via author UI and `/api/author/content/node` or `/api/author/content/page`.
7. **Create-page publish rule**: publish the newly created page; verify status is `PUBLISHED`; verify it remains discoverable/openable in authoring UI and author API.
8. **Publish environment rule**: after publishing the created page, verify it is visible on the configured publish environment and/or publish API/rendered public route, not just on author.
9. **Move/delete safety**: for test-owned nodes only, move to a test folder and delete/cleanup; verify author API no longer returns the deleted path. If UI lacks wired move/delete, document the blocker and cover via API-backed helper with UI smoke only.
10. **Negative validation**: attempt invalid duplicate name or missing required creation fields where UI supports it; verify user-facing validation and no persisted invalid node.

## Acceptance criteria

- AC1: Selenium specs exist under `frontend/apps/selenium-e2e/src/cases/admin/` and are included in a package script.
- AC2: Page creation test verifies created, published, and available on authoring environment.
- AC3: Any publishing case verifies visibility on the publish environment using configured publish URL/API.
- AC4: Tests use unique test-owned paths and clean up or document retained fixtures.
- AC5: JUnit report and failure screenshots are generated; exact command and environment URLs are recorded in `df/artifacts/REB-18/devops/summary.md`.
- AC6: Missing UI wiring/selectors are reported as defects or blockers with source file references, not silently skipped.

