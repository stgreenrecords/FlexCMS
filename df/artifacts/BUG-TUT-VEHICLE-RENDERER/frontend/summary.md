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

## Validation
- `pnpm --filter @flexcms/site-nextjs test -- src/components/__tests__/tutVehiclesRenderers.test.tsx` — PASS (4 tests).
- `pnpm --filter @flexcms/site-nextjs test` — PASS (7 files, 26 tests).
- `pnpm --filter @flexcms/site-nextjs build` — PASS after campaign changes; existing `<img>` optimization warnings only.
- `PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" /opt/homebrew/bin/pnpm build` — PASS (9/9 frontend workspace packages); existing image and package-export warnings only.

## Not run
Live route verification was attempted against the local reference site, but the running route did not expose the expected authored page content and a subsequent route probe lacked the `curl` executable in that shell environment. Browser-width verification remains outstanding.

