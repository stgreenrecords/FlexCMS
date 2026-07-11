# REB-10 Frontend Implementation Summary

## 2026-07-11 local - route rendering audit

- Confirmed generated template routing is working; the screenshot defect was in shared component rendering beneath the templates, not in `templateMap` selection.
- REB-10 routes now benefit from semantic page-header/product-hero renderers and safe handling of nested `flexcms/page` nodes, eliminating production fallback/debug blocks from the verified vehicle route.
- Live evidence: `http://localhost:3001/tut-usa/vehicles` returned HTTP 200 after restarting the site and contained no `Renderer pending` or `data-flexcms-unimplemented` markers.

## 2026-07-08 local - completion validation update

- Revalidated `REB-10` in the `frontend-dev` lane after QA/PO state retirement.
- Reworked template routing to derive canonical template names from generated contracts instead of stale hardcoded keys.
- Added compatibility aliases for legacy naming variants used in prior docs/seeds.
- Added template-map/unit coverage to prove template registration and template wrapper behavior (navigation/footer injection + fallback mapping).

## Files changed in this session

- `frontend/apps/site-nextjs/src/components/templates/template-map.tsx`
- `frontend/apps/site-nextjs/src/components/templates/GlobalHomePageTemplate.tsx`
- `frontend/apps/site-nextjs/src/components/templates/StandardPageTemplate.tsx`
- `frontend/apps/site-nextjs/src/components/templates/__tests__/template-map.test.tsx`

## Acceptance criteria coverage

- AC1: Template routing now uses `Design/tut-usa/generated/template-contracts.json` names (20 canonical templates from `V17__tut_usa_page_templates.sql`) plus compatibility aliases in `template-map.tsx`.
- AC2: `CmsPageClient` continues to render CMS `pageData` through `FlexCmsPage` with template selection based on `pageData.page.template` (no static page bodies added).
- AC3: Template wrappers continue to guarantee required `Navigation` and `Footer` renderers when authored page components omit them; behavior validated by unit tests.
- AC4: Added responsive layout scaffolding (`max-width` + breakpoint paddings) in both template wrappers and validated no regressions via build + unit tests.
- AC5: Frontend tests/build were executed and passed (see commands below).

## Validation evidence

- `cd frontend && pnpm --filter @flexcms/site-nextjs test` -> PASS (`2` files, `9` tests)
- `cd frontend && NUXT_TELEMETRY_DISABLED=1 pnpm build` -> PASS

## Residual risks

- Full visual parity for every template still depends on seeded runtime content and screenshot-based review; this session validated deterministic routing/wrapper behavior and compile/test health.
- Existing non-blocking Next.js `<img>` warnings remain in admin/site packages and are unchanged by this task.

## Work Completed

- Updated the main board to move REB-10 to `DEV_IN_PROGRESS`.
- Refactored `CmsPageClient.tsx` to use a template-based rendering approach.
- Created a `template-map.tsx` to map template names from the CMS to React components.
- Created a `DefaultTemplate` for templates without a specific implementation.
- Created a `GlobalHomePageTemplate` for the home page, which ensures the Navigation and Footer components are rendered.
- Created a `StandardPageTemplate` for all other pages, which also ensures the Navigation and Footer components are rendered.
- Registered all 21 TUT page templates in the `template-map.tsx`.
- Fixed a build error related to resolving components from the `@flexcms/react` package.
- Verified that the frontend build completes successfully.

## Files Changed

- `df/runtime/board.md`
- `frontend/apps/site-nextjs/src/app/[[...slug]]/CmsPageClient.tsx`
- `frontend/apps/site-nextjs/src/components/templates/template-map.tsx` (new file)
- `frontend/apps/site-nextjs/src/components/templates/GlobalHomePageTemplate.tsx` (new file)
- `frontend/apps/site-nextjs/src/components/templates/StandardPageTemplate.tsx` (new file)

## Evidence

- Frontend build passed successfully. See terminal output.

## Next Steps

- The application needs to be run with seeded data to visually verify that the correct templates and components are being rendered for each page.
- The responsive behavior of the templates needs to be tested.
- Any missing component renderers will be visible due to the `ContractFallback` component, and will need to be implemented.

