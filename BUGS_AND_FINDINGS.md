# FlexCMS — Bugs and Findings

## ✅ 2026-09-14 12:48 UTC — Fixes applied and verified live

Working from `docs/MANUAL_TEST_CASES_AUTHORING.md`'s already-identified suspected/confirmed
defects, six were fixed at the source, verified with `mvn test` (full backend suite: **all
modules, all tests green**), and re-confirmed against the live running Author service with real
HTTP calls. All changes follow the codebase's existing RFC 7807 / `GlobalExceptionHandler`
convention rather than adding ad hoc workarounds.

| Test case | Was | Now | Root cause | Fix |
|---|---|---|---|---|
| **PIM-091** | `500` on any unmapped path (e.g. a trailing slash: `GET /api/pim/v1/products/`) | `404` with a proper RFC 7807 body | `NoResourceFoundException` — Spring's own correct 404 for an unmatched route — was being intercepted by `GlobalExceptionHandler`'s `Exception.class` catch-all before Spring's default handling ever ran | Added a dedicated `@ExceptionHandler(NoResourceFoundException.class)` in `GlobalExceptionHandler`, ahead of the catch-all in specificity (Spring picks the closest match automatically) |
| **WF-016 / WF-017 / PIM-063 / PIM-066 / PIM-072** and every other "not found" / illegal-state case across PIM | `500 INTERNAL_SERVER_ERROR` for ordinary user errors (missing product/catalog/schema/variant/asset-ref, illegal catalog transition, duplicate SKU/schema/variant) | `404` for not-found, `409` for conflicts, `400` for schema-validation/import-parameter errors | `ProductService`, `CatalogService`, `SchemaService`, `VariantService`, `ProductAssetRefService`, `ImportService`, `SchemaValidationService` all threw bare `IllegalArgumentException`/`IllegalStateException`, which `GlobalExceptionHandler` has no specific mapping for | Added `PimNotFoundException`, `PimConflictException`, `PimValidationException` (`flexcms-pim/.../exception/`) — PIM stays isolated from `flexcms-core` per its documented architecture, so these are PIM's own types, mapped in `GlobalExceptionHandler` (which already depends on every module) exactly like `NotFoundException`/`ConflictException` are for core. All throw sites updated; **26 existing unit-test assertions** updated to match the corrected (intentional) exception types — this was expected test churn from fixing the contract, not new breakage |
| **GAP-103 / PIM catalog year rule** | Class Javadoc claimed "only one catalog per year may be ACTIVE," but nothing enforced it — two catalogs for the same year could both be activated | Activating a catalog now checks for another `ACTIVE` catalog in the same year via the already-existing `findByYearAndStatus` repository method, and rejects with `409` if one exists | The rule was documented but never implemented | Added the check in `CatalogService.activate()`; added `CatalogServiceTest.activate_throwsWhenAnotherCatalogAlreadyActiveForSameYear` |
| **SITE-023** | `500` on a duplicate `siteId` in `POST /api/admin/sites` | `409 ALREADY_EXISTS` | `SiteManagementService.createSite()`/`addDomain()`/`getSiteSummary()` threw bare `IllegalArgumentException` | Swapped for `flexcms-core`'s existing `ConflictException.alreadyExists()` / `NotFoundException.forId()` — `flexcms-multisite` already depends on `flexcms-core`, so no new exception types were needed here |
| **DAM-095 / GAP-110** | `GET /api/author/assets?q=...` without `siteId` silently searched a hardcoded `"corporate"` site and returned an empty result for assets that genuinely exist elsewhere | `422` with a clear `"siteId is required when searching with 'q'"` message; behavior unchanged (and correct) when `siteId` is supplied | The underlying native SQL (`AssetRepository.search`) filters by an *exact* `site_id` match — there is no cross-site search query to fall back to — so a missing `siteId` could never validly mean "search everywhere" | `AuthorAssetController.listAll()` now validates explicitly via `flexcms-core`'s `ValidationException`, matching the same controller's `upload()`/`listFolder()`, which already require `siteId` via `@NotBlank`. Confirmed the Admin UI's own DAM search is unaffected (it never calls this endpoint's `q` parameter — client-side filter over an already-fetched list) |
| **`docs/FLEXCMS_AUTHORING_TEST_RUN_2026-09-14.md` FINDING-06** | `500` on any unmapped Author API path (e.g. `GET /api/author/content/nosuchendpoint`) | `404` | Same `NoResourceFoundException`-vs-catch-all root cause as PIM-091, just observed on a different controller — confirms the fix is genuinely generic, not PIM-specific | No additional code — already covered by the PIM-091 fix above. Re-verified live on this exact path after restart |
| **`docs/FLEXCMS_AUTHORING_TEST_RUN_2026-09-14.md` FINDING-11 / WF-036** | `500` on `POST /api/author/content/node/status` with an invalid status value (e.g. `status=NOT_A_STATUS`) | `400` naming the parameter and the bad value | `@RequestParam NodeStatus status` throws Spring's `MethodArgumentTypeMismatchException` when the string doesn't match an enum constant — unhandled, same catch-all. Applies to every `@RequestParam`/`@PathVariable` typed as an enum, UUID, or number, across every controller, not just this one | Added `@ExceptionHandler(MethodArgumentTypeMismatchException.class)` in `GlobalExceptionHandler`. Verified live; confirmed the target page's real status was untouched by the rejected request |

**Verification:** `mvn -B test` (whole `flexcms/` reactor) — every module green, no regressions,
including **5 new unit tests** added directly against `GlobalExceptionHandler` for the two new
generic handlers (`NoResourceFoundException`, `MethodArgumentTypeMismatchException`) and the three
PIM exception handlers (previously untested in isolation). Then live-verified every fix with real
`curl` calls against a running Author instance (bodies and status codes shown above are the actual
responses).

**Correcting the record — not a bug:** a separate test pass the same day
(`docs/FLEXCMS_AUTHORING_TEST_RUN_2026-09-14.md`, FINDING-05) reported the DAM library being
populated with 182 items as a defect ("frontend build artifacts leaking into DAM"). It isn't one —
those are the real `Design/tut-usa/assets/{images,fonts,styles}` design-capture files, deliberately
uploaded via `scripts/import_tut_usa_captured_assets.py --upload-dam` in an earlier turn of this
same conversation, at the user's explicit request. See that document's own addendum for the full
correction.

**Turned out not to need a fix — re-read for accuracy, not touched:**
- **XF-039** (`GET /api/author/xf/?...` trailing slash) — already returns `404`, not `500`. It
  matches the `{xfPath}` path-variable route with an empty segment rather than falling through to
  `NoResourceFoundException`, so the message is confusingly worded ("Experience Fragment not
  found: content.") but the status code was already correct. Downgraded from "defect" to
  "cosmetic message wording" — not fixed in this pass.

**New discovery — out of scope for this pass, not fixed:** while testing cleanup, `DELETE
/api/admin/sites/{siteId}` (an endpoint not previously documented in this file's API inventory)
returns `500` due to `org.hibernate.LazyInitializationException: Cannot lazily initialize
collection of role 'Site.domains' ... (no session)` — the lazy `domains` collection is accessed
outside the transaction that loaded it. Left as `qa-dupe-test` in the seed data (test data may
remain between sessions per `docs/TEST_DATA_SPECIFICATION.md`). Worth its own investigation later.

**Not attempted in this pass** (frontend-only, or a larger design question rather than a bug):
- **WF-013 / GAP-109** — Workflow approve/reject reports success in the UI even when the API call
  fails. This is an Admin UI (Next.js) fix, not backend.
- **COMP-021** — Component Registry pagination controls don't slice the rendered rows. Admin UI fix.
- **GAP-101** — `for-user` workflow inbox ignores `userId`. Requires deciding the intended
  filtering semantics, not just a status-code fix.
- **PIM-081** — Product asset links accept a non-existent DAM path with no existence check. PIM is
  deliberately DB-isolated from DAM; validating this would mean an HTTP call from PIM to Author at
  write time (a real architectural decision, not a quick fix) or accepting the current tradeoff.
- **GAP-108** — The direct content-status endpoint bypasses workflow validation. This is
  documented, intentional behavior, not a defect.

---

## ⚠️ 2026-09-08 20:55 UTC — Retest superseding the BLOCKED record below

The BLOCKED result recorded in this file (and in the near-duplicate `BUGS_AND_FINDINGS (1).md`,
also untracked in this repo) was produced by a test executor that had **no network path to this
FlexCMS host** — it could not reach `localhost:8080/8081/3000` and had no `docker` binary at all,
while still having filesystem access to write into this repo. That is a disconnected sandbox, not
a FlexCMS outage: `BLOCKER-001` below is a **test-environment reachability issue in that other
executor**, not a confirmed product defect, and it was **not** caused by the DAM asset import that
ran immediately before the second attempt.

From an agent session running directly on the host that owns the FlexCMS runtime, the full P0
smoke gate (§4) and the §13 DAM retest were executed for real, with genuine evidence. Results:

### Retest — Session Summary

| Metric | Result |
|---|---:|
| Test cases attempted | 9 |
| PASS | 9 |
| FAIL | 0 |
| BLOCKED | 0 |
| N/A | 0 |
| Product defects confirmed | 1 |
| Environment blockers | 0 |

### Retest — Test Execution Results

| Test Case ID | Priority | Result | Observation |
|---|---|---|---|
| ENV-001 | P0 | **PASS** | `GET http://localhost:8080/actuator/health` → `200`, `{"groups":["liveness","readiness"],"status":"UP"}`. |
| ENV-002 | P0 | **PASS** | `GET http://localhost:8081/actuator/health` → `200`, `{"groups":["liveness","readiness"],"status":"UP"}`. |
| ENV-003 | P0 | **PASS** | `GET http://localhost:3000/` → `307` redirect to `/dashboard`; `GET /dashboard` → `200`. |
| ENV-005 | P0 | **PASS** | `GET /api/author/content/list?page=0&size=50` → `200`, `totalElements: 18`. All 9 `content.tut-usa.*` pages are `flexcms/page`, status `DRAFT`, exactly as the documented baseline. The 4 nodes reported as `PUBLISHED` are the pure structural `flexcms/container` folders (`content`, `content.experience-fragments`, `.tut-usa`, `.tut-usa.global`) — not part of the "nine pages" baseline claim, so this is not a deviation. Both XF folders and their `master` variations are `DRAFT` as documented. |
| ENV-006 | P0 | **PASS** | `GET /api/content/v1/component-registry` → `200`; 420 `resourceType` entries, matching the documented baseline. |
| ENV-007 | P1 | **PASS** | `GET /api/author/content/templates` → `200`; 21 templates. |
| ENV-008 | P0 | **PASS** | `docker ps` lists `flexcms-postgres`, `flexcms-redis`, `flexcms-rabbitmq`, `flexcms-elasticsearch` all `Up ... (healthy)`, plus `flexcms-minio` and `flexcms-pgadmin` `Up`. |
| ENV-009 | P1 | **PASS** | `GET http://localhost:3001` → `200`. |
| §13 DAM baseline | P0 gate dependency | **PASS** | `GET /api/author/assets/folders?siteId=tut-usa` → `200`, exactly 3 folders: `content/dam/tut-usa/images` (145), `content/dam/tut-usa/fonts` (22), `content/dam/tut-usa/styles` (15) — matching the reported 182-asset import precisely. `GET /api/author/assets?page=0&size=5` → `totalCount: 182`. Spot-checked one image asset: `mimeType: image/png` correctly sniffed, `width/height: 512/512`, `aspectRatio: 1.0` — dimension extraction (DAM-027) confirmed working. Spot-checked one font asset: `mimeType: application/octet-stream`, no dimensions — correct, non-image files are not dimension-sniffed. |

### Retest — Confirmed Product Defect

#### FINDING-001 — `GET /api/author/assets?q=...` silently searches the wrong site when `siteId` is omitted

**Test Case ID:** DAM-093 (Asset search via API)
**Severity:** Minor
**Area:** DAM — Author Asset API
**Environment:** Author API `http://localhost:8080`, 2026-09-08 UTC
**Reproducible:** Always

**Steps to reproduce**
1. Confirm a real asset exists and matches a search term: `GET /api/author/assets/{id}` for an image in `content/dam/tut-usa/images` shows `originalFilename` starting with `02f0b2ff...`.
2. `GET /api/author/assets?q=02f0b2ff&page=0&size=3` — **no `siteId` parameter**.
3. Observe `{"items":[],"totalCount":0,...}` even though the asset genuinely exists and genuinely matches.
4. `GET /api/author/assets?q=02f0b2ff&siteId=tut-usa&page=0&size=3` — same query, `siteId` added.
5. Observe the asset is now returned correctly.

**Expected:** Omitting `siteId` on a search either searches across all sites or returns a validation
error explaining that `siteId` is required for search.

**Actual:** Confirmed at the source
(`flexcms-author/src/main/java/com/flexcms/author/controller/AuthorAssetController.java`, the
search/list handler): `String effectiveSite = (siteId != null && !siteId.isBlank()) ? siteId : "corporate";`
— when `siteId` is omitted, the search silently runs against a hardcoded `"corporate"` site instead
of the caller's actual site, returning an empty result set with **no error, warning, or indication
that anything is wrong**. A caller unfamiliar with this convention will conclude the asset does not
exist.

**Impact today:** None observed in the shipped Admin UI — `frontend/apps/admin/src/app/(admin)/dam/page.tsx`
does not use this endpoint's `q` parameter at all; it fetches up to `size=200` assets once and
filters client-side, so the Admin UI's own search box is unaffected by this default. The risk is
for any other API consumer (Postman, integrations, future UI code, or the API test track in
`docs/MANUAL_TEST_CASES_AUTHORING.md` DAM-093 itself) that calls this endpoint without knowing the
undocumented default.

**Related observation (not a confirmed defect, noted for awareness):** the same DAM page's initial
asset fetch is `fetch(`${API_BASE}/api/author/assets?size=200`)` with no further pagination for the
folder tree / "All Assets" grid view. At the current 182 seeded assets this is not yet a problem,
but once total assets exceed 200 the grid/tree/client-side-search would silently stop showing the
rest. Worth a boundary test once the library grows past 200 assets.

---

## Original (superseded) report below

**Test source:** `MANUAL_TEST_CASES_AUTHORING.md`, version 1.0  
**Execution date:** 2026-09-08 UTC  
**Scope attempted:** Mandatory Environment Smoke Tests (§4)  
**Overall status:** **BLOCKED — System Under Test is not reachable from the available test environment**

## Executive Summary

Testing was started in the priority order required by the authoring test plan. The mandatory P0 smoke gate could not be passed because the Author API, Publish API, and Admin UI were not reachable. Docker is also unavailable in the execution environment, so the FlexCMS services cannot be started or inspected here.

This is recorded as a test-environment blocker rather than a confirmed FlexCMS product bug. The remaining functional test cases were not executed because §4 explicitly requires the tester to stop when a P0 smoke case fails.

## Session Summary

| Metric | Result |
|---|---:|
| Test cases attempted | 6 |
| PASS | 0 |
| FAIL | 2 |
| BLOCKED | 4 |
| N/A | 0 |
| Product defects confirmed | 0 |
| Environment blockers | 1 |

## Test Execution Results

| Test Case ID | Priority | Result | Observation |
|---|---|---|---|
| ENV-001 | P0 | FAIL | `GET http://localhost:8080/actuator/health` could not connect. The client reported: `Failed to connect to localhost port 8080: Couldn't connect to server`; HTTP status was `000`. |
| ENV-002 | P0 | FAIL | `GET http://localhost:8081/actuator/health` could not connect. The client reported: `Failed to connect to localhost port 8081: Couldn't connect to server`; HTTP status was `000`. |
| ENV-003 | P0 | BLOCKED | The Admin UI could not be loaded at `http://localhost:3000`. Browser navigation was blocked before application content loaded (`net::ERR_BLOCKED_BY_CLIENT`). Because the Author and Publish services were also unreachable, Admin UI availability could not be independently confirmed. |
| ENV-005 | P0 | BLOCKED | The seed-baseline API is hosted on the unreachable Author service. The request to `/api/author/content/list?page=0&size=50` could not connect, so the expected 18 nodes and nine DRAFT pages could not be checked. |
| ENV-006 | P0 | BLOCKED | The component registry endpoint is hosted on the unreachable Author service. The expected 420 component definitions could not be checked. |
| ENV-008 | P0 | BLOCKED | `docker ps` could not be executed because Docker is not installed or exposed in the test environment (`docker: command not found`). Container health could not be checked. |

## Environment Blocker

### BLOCKER-001 — FlexCMS runtime is unavailable to the test executor

**Related Test Case IDs:** ENV-001, ENV-002, ENV-003, ENV-005, ENV-006, ENV-008  
**Classification:** Test environment blocker  
**Severity:** Blocker  
**Area:** Environment / Runtime availability  
**Environment:** Expected local FlexCMS runtime on ports 3000, 8080, and 8081; tested 2026-09-08 UTC  
**Reproducible:** Always during this test session

**Description**

The mandatory FlexCMS runtime endpoints are not accessible from the environment in which the test pass is being executed. Both backend health endpoints refuse connections. The Admin UI cannot be opened by the attached test browser, and there is no Docker command available to verify or start the required containers.

**Steps to reproduce**

1. Request `GET http://localhost:8080/actuator/health`.
2. Observe that no HTTP response is returned and the connection to port 8080 fails.
3. Request `GET http://localhost:8081/actuator/health`.
4. Observe that no HTTP response is returned and the connection to port 8081 fails.
5. Open `http://localhost:3000` in the test browser.
6. Observe that navigation is blocked before the FlexCMS page loads.
7. Run `docker ps` to check the infrastructure containers.
8. Observe that the Docker executable is unavailable.

**Expected**

- Author health returns HTTP `200` with `{"status":"UP"}`.
- Publish health returns HTTP `200` with `{"status":"UP"}`.
- Admin UI redirects to `/dashboard` and renders the sidebar and top bar.
- Docker reports the required infrastructure containers as running and healthy.

**Actual**

- Author health: connection refused/unavailable; HTTP status `000`.
- Publish health: connection refused/unavailable; HTTP status `000`.
- Admin UI: browser reports `net::ERR_BLOCKED_BY_CLIENT`; no FlexCMS DOM is available for inspection.
- Docker inspection: `docker: command not found`.

**Evidence**

- Command output captured during the 2026-09-08 UTC test session.
- Browser navigation error: `net::ERR_BLOCKED_BY_CLIENT`.
- No application screenshot, HAR, console log, API response body, or `correlationId` exists because the requests did not reach FlexCMS.

**Impact**

No product functionality can be tested reliably. Seed data, navigation, dashboard, editor, DAM, workflows, PIM, API-only features, and known-gap confirmations all depend on the mandatory smoke gate.

**Required action to unblock**

1. Make the FlexCMS runtime reachable from the same environment used for testing, or expose a non-localhost test URL.
2. Start the complete stack with `flex start local all` on the host that owns the runtime.
3. Confirm ports 3000, 3001, 8080, and 8081 are listening.
4. Ensure the test executor can reach those ports; `localhost` must refer to the machine running FlexCMS.
5. Provide Docker visibility if ENV-008 is expected to be executed remotely, or provide equivalent container-health evidence.
6. Re-run ENV-001 through ENV-010 before continuing with §5 and later sections.

## Product Bugs and Known Findings

No FlexCMS product defect has yet been confirmed. The observed failures occur before an application response is received. Known gaps from §20 were not re-filed because their behavior could not be exercised, and the test plan explicitly treats those items separately.

## Next Execution Point

Resume at **ENV-001** after the runtime becomes reachable. Do not skip directly to navigation or feature tests; the complete P0 smoke gate must pass first.
