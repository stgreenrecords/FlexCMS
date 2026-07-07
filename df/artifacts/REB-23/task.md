# REB-23 — Implement PIM catalog/product authoring Selenium E2E suite

## Summary

- Priority: P1
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Implement Selenium/API E2E coverage for PIM authoring surfaces: catalog/product browsing, product CRUD/status, variants, asset references, carryforward/delta, version history/restore, import/schema route smoke, and product rendering integration where CMS pages consume product data.

## Read first

- `df/artifacts/REB-17/task.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `flexcms/flexcms-pim/src/main/java/com/flexcms/pim/controller/ProductApiController.java`
- `frontend/apps/admin/src/app/(admin)/pim/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/[id]/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/[id]/[productId]/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/import/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/schema/page.tsx`

## Dependencies

- REB-07
- REB-13

## Functional scope

- PIM catalog list and catalog detail routes.
- Product create/list/search/update/delete/status.
- Product variants create/list/update/delete.
- Product asset references link/update/unlink.
- Carryforward, merge inherited attributes, delta report.
- Product version history and restore.
- PIM import wizard/schema route smoke and API-backed validation where safe.
- CMS page/product component publish verification if product data is rendered on public pages.

## Required E2E scenarios

1. **PIM route smoke**: open catalog list, schema, import, catalog detail, and product detail routes; verify no 404/error and API-backed data appears.
2. **Product create**: create a unique test product in a safe test catalog, verify list/search and product detail.
3. **Product update**: update attributes with unique marker, verify API resolved product and UI detail show marker.
4. **Product status**: transition product `DRAFT` -> `PUBLISHED` -> `ARCHIVED` as supported, verify status and UI badges.
5. **Variant lifecycle**: create/update/delete a test variant; verify product variant list after each step.
6. **Asset reference lifecycle**: link a DAM asset path, update role/order, unlink, verify asset refs API/UI.
7. **Version history/restore**: update product twice, verify versions list, restore prior version, verify attributes reverted.
8. **Carryforward/delta**: with test catalogs only, carry forward product, edit target, verify delta report and merge inherited attributes.
9. **PIM import smoke**: run import wizard validation/infer-schema against a tiny safe fixture if backend endpoint is available; otherwise document API/UI blocker.
10. **Rendered integration**: if any TUT product component consumes PIM data, publish a page that references the test product and verify publish environment renders the updated product value.

## Acceptance criteria

- AC1: PIM tests use the PIM API/data source only; no CMS datasource assumptions.
- AC2: Product mutation tests create uniquely named/SKU test data and clean up where safe.
- AC3: If product data is rendered on a CMS page, publish-environment verification is included.
- AC4: Import/carryforward tests are guarded against destructive non-local environments.
- AC5: Evidence is recorded in `df/artifacts/REB-23/devops/summary.md`.

