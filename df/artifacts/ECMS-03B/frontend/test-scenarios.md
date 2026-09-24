# ECMS-03B — Test scenarios (frontend-dev)

Developer testing bar per `DEC-DF-007`. Covers `ECMS-03-TC05` and the frontend half of
`ECMS-03-TC02/TC03` in `docs/MANUAL_TEST_CASES_ECMS_UPCOMING.md`.

- Date: 2026-09-24 local
- Design package: not required. Nothing visible changes layout; only URL values and the
  wording of the Copy URL confirmation (it now also names the URL) change.

## How to run

Stack: author `:8080`, publish `:8081`, admin `:3000`, site `:3001` (`flex start local all`),
plus a **publish-backed site instance** on `:3005`. The default local site reads its live pages
from author, so only the `:3005` instance shows what a visitor gets:

```bash
cd frontend/apps/site-nextjs
NEXT_DIST_DIR=.next-publish FLEXCMS_API_URL=http://localhost:8081 \
  FLEXCMS_PREVIEW_API_URL=http://localhost:8080 pnpm exec next dev -p 3005

cd frontend/apps/selenium-e2e
pnpm test:ecms03                      # PUBLISH_SITE_URL defaults to http://localhost:3005
```

## Unit tests (`site-nextjs`, vitest): 20 passed

| File | Scenarios |
|---|---|
| `src/app/lib/normalizeAssetUrls.test.ts` (9) | missing-DAM fallback kept; legacy author URL, relative or on `localhost:8080` / `author:8080` / external host → `/dam/renditions/{id}`; absolute canonical → relative; live mode leaves canonical and unrelated values alone; preview mode → `/draft-dam/renditions/...` for canonical, legacy and absolute forms; rich-text `<img>` rewritten in both modes; preview rewrite is idempotent; nested children/arrays/objects; look-alike paths untouched |
| `src/app/lib/apiBases.test.ts` (5) | defaults (author, same-origin browser base); live base precedence (`NEXT_PUBLIC_FLEXCMS_API_URL` > `NEXT_PUBLIC_FLEXCMS_API` > `FLEXCMS_API_URL`); preview stays on author when live reads publish (`FLEXCMS_PREVIEW_API_URL`); rewrite table maps `/dam/renditions` → live API and `/draft-dam/renditions` → preview API, trailing slash stripped; default setup proxies both to author |
| `src/components/templates/__tests__/template-map.test.tsx` (6) | existing, unchanged |

`site-renderers` vitest: 44 passed. The only change there is removing the unused `toBrowserImageUrl`, which hard-coded `http://localhost:8080`.

## Selenium: `ECMS-03 published asset rendering suite`, 6 passed (two consecutive runs)

Spec: `frontend/apps/selenium-e2e/src/cases/admin/published-asset-rendering.spec.ts`.
Fixture: a run-unique 1×1 PNG uploaded to the DAM, and page `content.tut-usa.ecms03b-asset-render` with a
`flexcms/image` component whose `src` is the **legacy** author URL, which is what existing content holds.
Both are deleted afterwards.

| # | Scenario | Assertion | TC | AC |
|---|---|---|---|---|
| S1 | Unpublished asset | publish `/dam/renditions/{id}` → 404; `:3001/preview/...` renders `src="/draft-dam/renditions/{id}"` with `naturalWidth > 0` | TC02 | AC1, AC2 |
| S2 | Publish the page | the asset reaches publish (200); publish JSON carries `/dam/renditions/{id}` and no `/api/author/`; **`:3005` renders `src="/dam/renditions/{id}"` with `naturalWidth > 0`** | **TC05**, TC03 | AC1, AC4 |
| S3 | Default-site control | `:3001` live page renders the same canonical src and it decodes | TC03 | AC1 |
| S4 | Withdraw then re-publish | after unpublish, a **fresh visitor** on `:3005` gets a broken image (`naturalWidth == 0`) while draft preview still decodes it; after re-publish it decodes again. This proves publish, not author, is serving the live image | TC02 | AC1, AC4 |
| S5 | Admin DAM Copy URL | the notice names `/dam/renditions/{id}` and never `/api/author/` (works whether or not headless Chrome grants clipboard access) | — | AC3 |
| S6 | Delete on author | publish → 404, and a fresh visitor on `:3005` gets a broken image while the page still renders | TC02 | AC4 |

Evidence: `selenium-ecms03-2026-09-24.txt`.

## Regression (existing suites touching the changed code)

| Suite | Result | Note |
|---|---|---|
| REB-21 DAM authoring and asset-reference | 10/10 | S7 used to record `BLOCKED` ("no publish-side asset delivery"); it now passes |
| DAM folder tree | 10/10 | S2 failed on the first run: it compared folder **leaf names** against the retired MIME buckets, so the real seeded folder `content/dam/tut-usa/images` counted as a bucket. The test was wrong, not the product; it now compares whole paths |
| admin-e2e Playwright (chromium) | see activity log | mock-API suite, run for the pre-push gate |

Evidence: `selenium-dam-regression-2026-09-24.txt` (first run, showing the S2 failure) plus the rerun result above.

## Build

`cd frontend && pnpm install && pnpm build`: 10/10 turbo tasks, 0 errors.
`site-nextjs` `tsc --noEmit`: no errors in changed files. Pre-existing errors remain in
`template-map.test.tsx` (jest-dom matcher types), unrelated to this task.

## Findings raised (not fixed here)

1. **Browser cache outlives withdrawal.** Asset responses carry `Cache-Control: public, max-age=86400`
   (`DEC-ECMS-002`). CDN copies are purged on withdraw/delete, but a browser that already loaded the
   image keeps showing it for up to a day. S4/S6 initially failed for exactly this reason, and model a new
   visitor instead. For legally sensitive takedowns, consider `s-maxage=86400` for shared caches with
   browser revalidation (`max-age=0, must-revalidate`); the existing `ETag`/304 path keeps that cheap. SA decision.
2. **`flex start local <subset>` stopped every service** (all java, all FlexCMS node). Found while
   restarting admin and site. Fixed in `flex.ps1` (devops scope, recorded here because it surfaced here):
   a partial start now closes only the requested services' windows and relies on each `Start-*`'s
   `Free-Port`. Verified: `start local author,publish` left admin, site and `:3005` up, and `start local publish`
   replaced the running publish PID while author, admin, site and `:3005` kept running.
