# Frontend delivery summary

## Root cause
`component-map.tsx` had concrete mappings for only selected components. Contract-driven entries for unmapped components resolved to `createGroupRenderer()`, which displayed authored fields as generic metadata. This affected `product-card` on vehicles and the CTA-group components on offers-and-finance, including `pricing-table`, `plan-card`, and `offer-card`.

## Changes
- Added `ProductCardRenderer` in `frontend/apps/site-nextjs/src/components/tutVehiclesRenderers.tsx`.
- Registered the full resource type in `frontend/apps/site-nextjs/src/components/component-map.tsx`.
- Added regression coverage in `frontend/apps/site-nextjs/src/components/__tests__/tutVehiclesRenderers.test.tsx`.
- Added `frontend/apps/site-nextjs/src/components/tutCampaignRenderers.tsx` with concrete pricing-table, plan-card, and offer-card renderers plus a semantic CTA-group fallback.
- Updated `tutGroupedRenderers.tsx` so every `Calls to Action, Promotions & Campaigns` contract uses the semantic fallback unless a concrete mapping overrides it.
- Added CTA-group coverage in `tutCampaignRenderers.test.tsx` and `tutGroupedRenderers.test.tsx`.
- Added `frontend/apps/site-nextjs/src/components/tutLearningRenderers.tsx` with course catalog, course card, resource list, FAQ, and semantic Education-group renderers.
- Registered the learn-page resource types in `component-map.tsx` and added learning/group-resolution tests.
- Fixed `src/test/setup.ts` to explicitly extend the imported Vitest `expect` with `jest-dom` matchers.
- Normalized `ProductCardRenderer` image values from either URL strings or authored image objects (`url`, `src`, `path`, `imageUrl`, or `thumbnailUrl`) and added regression coverage.

## Validation
- `pnpm --filter @flexcms/site-nextjs test -- src/components/__tests__/tutVehiclesRenderers.test.tsx` — PASS (5 tests).
- `pnpm --filter @flexcms/site-nextjs test` — PASS (7 files, 27 tests).
- `pnpm --filter @flexcms/site-nextjs build` — PASS after campaign changes; existing `<img>` optimization warnings only.
- `PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" /opt/homebrew/bin/pnpm build` — PASS (9/9 frontend workspace packages); existing image and package-export warnings only.
- `pnpm test:e2e:selenium:smoke` — PASS; retained artifacts under `frontend/apps/selenium-e2e/reports/retained/smoke`.
- `pnpm test:e2e:selenium:full` — PASS after restarting the stale Next.js process; retained artifacts under `frontend/apps/selenium-e2e/reports/retained/full`.
- Live route probe — PASS: `/tut-usa/offers-and-finance/financing-and-leasing` and `/tut-usa/learn/ev-buying-guide` returned HTTP 200 with authored page content.

## Notes

The first full Selenium attempt observed the stale reference-site process returning HTTP 500 for seeded routes. After restarting the orphaned Next.js child process, the live routes returned HTTP 200 and the full gate passed. The build retains pre-existing Next.js `<img>` and package-export warnings; no errors were reported.

