## 2026-07-11 local - frontend-dev handoff

- Task: `SITE-PAGE-REFERENCE-RENDERING`
- State: `DONE`
- Result: Public rendering now excludes `flexcms/page` route references and nested page content; missing TUT DAM values are normalized to an explicit fallback and the global rewrite is removed.
- Files changed: `frontend/packages/react/src/FlexCmsComponent.tsx`, `frontend/packages/react/src/__tests__/FlexCmsComponent.test.tsx`, `frontend/apps/site-nextjs/src/app/lib/normalizeAssetUrls.ts`, `frontend/apps/site-nextjs/src/app/lib/normalizeAssetUrls.test.ts`, `frontend/apps/site-nextjs/next.config.js`.
- Evidence: React tests 26/26, site tests 14/14, full frontend build 9/9, public Selenium template suite 21 passing, live Vehicles HTML page-reference count 0 and missing-DAM count 0.
- Risks: Existing non-blocking pnpm package-condition and Next.js `<img>` warnings remain. The live HTML title grep still finds generic navigation/footer labels, but no page-reference markup or missing DAM URLs remains.
- Next action: Human review of the rebuilt Vehicles route; no further frontend role action required.

