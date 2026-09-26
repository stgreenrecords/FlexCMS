# ECMS-03B — Frontend: reference site and admin use canonical asset URLs

| Field | Value |
|---|---|
| Type | Story |
| Priority | P0 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Parent | [ECMS-03](ECMS-03.md) |
| Depends on | [ECMS-03A](ECMS-03A.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Visitors see the images on published pages; editors see unpublished images in draft preview.

## Acceptance criteria

- [ ] AC1: `site-nextjs` proxies `/dam/renditions/:path*` to the live route's API base and `/draft-dam/renditions/:path*` to the preview route's API base.
- [ ] AC2: `normalizePageAssetUrls` rewrites legacy and absolute author asset URLs to canonical `/dam/renditions/...`, and to `/draft-dam/renditions/...` in preview mode; unit tests cover each form.
- [ ] AC3: The admin DAM "Copy URL" action copies the canonical `/dam/renditions/{id}` URL.
- [ ] AC4: Playwright E2E: publish a page that references a DAM image, load it on the site rendered from the publish tier, and assert the image loads (`naturalWidth > 0`).

## Test cases

Scenarios S1–S6 were verified on 2026-09-24 with a Selenium suite. Under the Playwright-only standard, they must be re-implemented in Playwright. The unit rows already exist and pass.

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-03B-TC01 | AC2 | unit | Legacy relative/absolute author URLs (`localhost:8080`, `author:8080`, external host) → `/dam/renditions/{id}`; absolute canonical → relative; live mode leaves canonical and unrelated values alone; preview mode → `/draft-dam/renditions/...`; rich-text `<img>` rewritten; idempotent; nested children/arrays; look-alike paths untouched | `frontend/apps/site-nextjs/src/app/lib/normalizeAssetUrls.test.ts` |
| ECMS-03B-TC02 | AC1 | unit | Live and preview API-base precedence; the rewrite table maps `/dam/renditions` → live API and `/draft-dam/renditions` → preview API | `frontend/apps/site-nextjs/src/app/lib/apiBases.test.ts` |
| ECMS-03B-TC03 | AC1, AC2 | e2e | S1 — Given an uploaded, unpublished asset referenced (legacy URL) by a draft page, then publish `/dam/renditions/{id}` → 404, and the `:3001` preview renders `src="/draft-dam/renditions/{id}"` with naturalWidth > 0 | — |
| ECMS-03B-TC04 | AC1, AC4 | e2e | S2 — When the page is published, then the asset is served by publish (200), publish JSON carries `/dam/renditions/{id}` and no `/api/author/`, and the publish-backed site `:3005` renders it with naturalWidth > 0 | — |
| ECMS-03B-TC05 | AC1 | e2e | S3 — The default site `:3001` live page renders the same canonical src and it decodes | — |
| ECMS-03B-TC06 | AC4 | e2e | S4 — After unpublish, a fresh visitor context on `:3005` gets a broken image while draft preview still decodes; after re-publish it decodes again | — |
| ECMS-03B-TC07 | AC3 | e2e | S5 — Admin DAM Copy URL notice names `/dam/renditions/{id}` and never `/api/author/` (works with or without clipboard permission) | — |
| ECMS-03B-TC08 | AC4 | e2e | S6 — After the asset is deleted on author, publish → 404 and a fresh visitor on `:3005` gets a broken image while the page still renders | — |

Target spec: `frontend/apps/e2e/tests/e2e/published-assets.spec.ts`, tagged `@ECMS-03B`. The fixture is a run-unique 1×1 PNG plus page `content.tut-usa.<uniqueName>` with a `flexcms/image` component whose `src` is the legacy author URL. Delete both afterwards. The publish-backed site on `:3005` is started as described in TESTING.md §6.

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Split from ECMS-03. |
| 2026-09-24 | Started (Mode B). No design package needed: no visible layout change, only URL values and the Copy URL notice text. |
| 2026-09-24 | Implemented: site proxy rewrites (`next.config`), `normalizePageAssetUrls` + `apiBases`, admin DAM Copy URL, and removal of `toBrowserImageUrl` (hard-coded `localhost:8080`) from `site-renderers`. Vitest: site-nextjs 20 passed, site-renderers 44 passed. Selenium S1–S6: 6/6 twice. Regression: DAM authoring 10/10, DAM folder tree 10/10. `pnpm build` green. Docker image not built; nothing pushed. |
| 2026-09-24 | Finding (not fixed): assets are served with `Cache-Control: public, max-age=86400`, so a browser that already loaded an image keeps it for up to a day after withdrawal. Filed as TECH-001. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-03B/`). |
| 2026-09-26 | **Handoff:** code and unit tests are done per the 2026-09-24 evidence. Re-run the unit tests to confirm, then tick AC1–AC3. **Remaining:** (1) implement TC03–TC08 in Playwright (`tests/e2e/published-assets.spec.ts`), porting `frontend/apps/selenium-e2e/src/cases/admin/published-asset-rendering.spec.ts`, then delete that Selenium spec and its `test:ecms03` script; (2) run every quality gate, including `pnpm test:e2e:live` with the `:3005` site and the Docker image build; (3) tick AC4, fill **Automated in**, move to Done, commit and push. |
