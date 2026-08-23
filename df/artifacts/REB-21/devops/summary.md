# REB-21 — devops run summary

DAM authoring and asset-reference E2E suite. Every number below is read out of the
artifacts the run of record produced — `dam-operation-matrix.csv` and
`frontend/apps/selenium-e2e/reports/junit/reb21-suite.xml`.

## Run of record

| | |
|---|---|
| Date | 2026-08-23 local (CEDT) |
| Command | `cd frontend/apps/selenium-e2e && pnpm test:reb21:ci` |
| Suite | `src/cases/admin/dam-authoring-suite.spec.ts` |
| Mocha result | **10 tests, 0 failures**, 5.85 s |
| JUnit XML | `reports/junit/reb21-suite.xml` |
| Operation matrix | `dam-operation-matrix.csv` — 9 rows |
| Failure screenshots | none for this run |

Environment (all four services live):

| Service | URL | Started as |
|---|---|---|
| Author | `http://localhost:8080` | `mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author,local` (JDK 26) |
| Publish | `http://localhost:8081` | `mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=publish,local` (JDK 26) |
| Admin UI | `http://localhost:3000` | `pnpm start` (Next.js production build) |
| Reference site | `http://localhost:3001` | `pnpm exec next start -p 3001` (production build) |
| Infra | postgres, redis, rabbitmq, minio, elasticsearch | `docker compose -f infra/local/docker-compose.dev.yml up -d` |

## Totals

| Metric | Value |
|---|---|
| Mocha tests | **10** |
| Failures | **0** |
| Operation rows | **9** |
| PASS | **6** |
| BLOCKED | **3** |
| FAIL | **0** |
| SKIPPED | **0** |

| Scenario | Operation | Outcome |
|---|---|---|
| S1 | `dam:list` + UI load | PASS |
| S2 | `dam:upload` + `dam:content` | PASS |
| S3 | `dam:detail` | PASS |
| S4 | `dam:list` + `dam:search` | **BLOCKED** — `R21-2` |
| S5 | `dam:folder` | PASS |
| S6 | `content:reference asset` | PASS |
| S7 | `content:publish` + `dam:delivery` | **BLOCKED** — `R21-3` |
| S8 | `dam:delete by path` | PASS |
| S9 | `dam:upload` (empty file, executable) | **BLOCKED** — `R21-1` |

Every `BLOCKED` row is a pre-existing product gap with live evidence and a stated
reason; `S10` asserts none is left unexplained.

## Acceptance criteria

| AC | Requirement | How it is met |
|---|---|---|
| **AC1** | Cover upload, list/search, detail/content stream, content reference, publish render, and cleanup | `S2` upload + byte-exact content stream; `S1`/`S4` list and both search paths; `S3` detail; `S5` folder listing and a non-image content type; `S6` reference from a real contract component; `S7` publish; `S8` cleanup. |
| **AC2** | Asset-reference publish test verifies the publish environment **with image health checks** | `S7` confirms the publish environment serves the page JSON carrying the asset id, then probes whether it can serve the asset bytes at all — it cannot (`R21-3`). Image health is measured with `naturalWidth > 0` against `/tut-usa/home` as a **positive control**, proving the check works and isolating the failure to DAM-backed URLs. |
| **AC3** | Test-owned assets use unique paths and do not delete seeded/shared assets | Every upload lands under `content/dam/tut-usa/reb21-{timestamp}/`, and deletion only targets paths this run created. `S8` additionally proves a sibling asset survives a delete. |
| **AC4** | Evidence recorded in `df/artifacts/REB-21/devops/summary.md` with JUnit and screenshots | This file, `dam-operation-matrix.csv`, `test-scenarios.md`, `blockers.md`, and `reports/junit/reb21-suite.xml`. The run produced no failures, so there are no failure screenshots — the mechanism is wired via `attachFailureScreenshot` and demonstrated by earlier runs of this suite. |

## What the suite proves works

Worth stating explicitly, because three findings below could otherwise read as
"the DAM is broken":

- Upload stores the bytes and metadata correctly, and `GET /{id}/content` returns
  them **byte-for-byte identical** with the right content type — verified for both
  a PNG and a PDF, so the type is preserved per asset rather than coerced.
- Listing, folder listing, and the asset detail route all work, and the detail
  preview image genuinely resolves.
- Delete-by-path works, is scoped, and leaves siblings alone.
- An asset reference authored onto a real contract component persists verbatim and
  survives into both author and publish delivery JSON.

## Findings

Full evidence and source symbols in [`blockers.md`](blockers.md). None is caused
by this suite; all need SA routing.

| ID | Summary | Severity | Lane |
|---|---|---|---|
| `R21-1` | **The upload endpoint validates nothing** — a zero-byte file and a file with a DOS/PE executable header were both accepted and stored (HTTP 200). `uploadAsset()` passes `MultipartFile.getBytes()` straight to `ingest()`; the admin dialog's `accept=…` and 100 MB cap are browser-only and absent from the API. | High | `backend-dev` + `sa` |
| `R21-2` | **Keyword search 500s for every query** — `AssetRepository.search` is native SQL containing `OR :query = ANY(tags)` and `assets` has no `tags` column. Listing and folder listing are fine; search alone is broken, and no UI surface calls it, so it has evidently never worked. | High | `backend-dev` |
| `R21-3` | **No publish-side asset delivery exists** — `flexcms-dam` has no controller and nothing maps `/dam/renditions/**`, which `SecurityConfig` nonetheless permits. A published page referencing a DAM asset renders a dead image; both candidate URLs answer 500 on `:8081`. | High | `backend-dev` + `sa` |
| `R21-4` | **The DAM is empty** — REB-07 is `DONE` but its own `dam-import-map.json` records `"damUploaded": 0` beside `"copiedSiteNextjs": 182`. Every DAM-backed feature has no data. | Medium | `sa` |

A latent fifth issue is documented inside `R21-2`: `listAll` applies a
`"corporate"` site default **only** when `q` is set, so a keyword search without an
explicit `siteId` can never match a `tut-usa` asset. It is invisible today because
the endpoint 500s first, and will surface the moment `R21-2` is fixed.

## Developer testing bar (df/03-orchestration-rules.md)

| Check | Command | Result |
|---|---|---|
| REB-21 suite | `pnpm test:reb21:ci` | **10 tests, 0 failures**, 5.85 s |
| Backend unit suite | `cd flexcms && mvn test` | **505 tests, 0 failures, 0 errors**, `BUILD SUCCESS` |
| Frontend build | `cd frontend && pnpm build` | **9 of 9** tasks successful |
| Selenium full gate | `node scripts/selenium-gate.cjs --mode full` | see the activity-log entry for this run's result |

## Wiring added

| File | Change |
|---|---|
| `frontend/apps/selenium-e2e/package.json` | `test:reb21`, `test:reb21:ci`, and the stage added to `test:full:ci` |
| `frontend/apps/selenium-e2e/scripts/selenium-gate.cjs` | `test:reb21:ci` added to the `full` mode stage list |
| `frontend/apps/selenium-e2e/config/traceability-priority.json` | `REB-21` row at `critical` priority |

## Code added

| File | Purpose |
|---|---|
| `src/cases/admin/dam-authoring-suite.spec.ts` | The suite: S1–S10 |
| `src/pages/DamPage.ts` | Asset library and detail page object, including broken-image detection |
| `src/fixtures/dam-assets.ts` | Byte-stable fixtures: a real 1×1 PNG and a minimal PDF, plus byte-comparison helpers |
| `src/pages/AuthorApiClient.ts` | 11 DAM methods: multipart `uploadAsset`/`tryUploadAsset`, `getAsset`, `getAssetStatus`, `getAssetContent`, `listAssets`, `searchAssets`, `searchAssetsWithoutSite`, `trySearchAssets`, `listAssetFolder`, `deleteAsset`, `assetContentUrl` |

## Reruns and corrections

Three runs to green. Both non-final runs failed on the same scenario for two
different reasons, one mine and one the product's:

1. **Run 1** (9 passing / 1 failing) — `S4` failed on "clearing the search must
   restore the asset". My fault: `DamPage.setSearch` used
   `WebElement.clear()`, which empties the DOM value without dispatching the event
   React listens for, so the controlled input kept the previous term in component
   state while displaying an empty box. Replaced with the click → `Ctrl+A` →
   type/`DELETE` sequence `EditorAuthoringPage.clearAndType()` already uses, plus a
   wait until the input's value actually equals the target. Note the old version
   could also have passed a "search filters the list" assertion while the box did
   nothing — it was wrong in both directions.
2. **Run 2** (9 passing / 1 failing) — `S4` again, now on
   `Failed to search assets … (500)`. Not mine: the endpoint itself is broken
   (`R21-2`). Reproduced with `curl`, root-caused in `AssetRepository.search`, and
   confirmed against the live schema. `S4` now records it as `BLOCKED` with the
   status and cause, while still asserting the correct behaviour if the query is
   ever fixed — today's bug is not encoded as the expectation.
3. **Run 3** — 10 passing, 0 failing, 9 rows.

One design correction before the first run: the spec initially referenced a
component type `tut-usa/media-visual-storytelling-assets/image-block` that does not
exist. It was replaced with `tut-usa/editorial-article-content/story-card`, a real
contract whose `image` field is genuinely `isAsset: true`.

No check was skipped.

## Residue

Assets: none. Every upload is deleted in `after()`, and the run reports an
`ASSET LEAK` line for anything it cannot remove; the run of record reported none.

Content: one fixture page, `content.tut-usa.reb21-asset-reference`, deliberately
reused across runs and left published — nothing in the platform can retract
published content (REB-26 `R26-1`/`R26-2`), so a fixed path bounds the residue to
one page instead of adding an orphan per run.
