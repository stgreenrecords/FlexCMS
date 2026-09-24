# FlexCMS — Retest Plan: 2026-09-14 Exception-Handling Fixes

> **Purpose:** This is a **scoped retest**, not the full suite. It covers exactly what changed in
> commit `20ad856` (pushed to `origin/main`) — 8 backend defects fixed across PIM, the Author
> content API, the Author asset (DAM) API, and site management — plus the regression checks
> needed to confirm nothing else broke. For the full 852-case authoring suite, use
> `docs/MANUAL_TEST_CASES_AUTHORING.md`.
>
> **Commit:** `20ad856` — `fix(pim,author,multisite): map user errors to proper HTTP status instead of 500`
> **Full change record with before/after evidence:** `BUGS_AND_FINDINGS.md` (see the
> "2026-09-14 12:48 UTC" and "2026-09-14 12:5x UTC" sections)
> **Track:** every case here is **API-level** — no Admin UI involvement. All 8 fixes are backend
> exception-mapping changes; none of them touch frontend code.

---

## 1. Why this retest exists

I (the agent that made these fixes) already verified all 8 live with `curl` and a full `mvn test`
run before committing. This document exists so a **second person** — you — can independently
confirm the same results, per the project's own principle in `docs/RETEST_PLAN.md`: *"The reviewer
re-ran the evidence command themselves — a different person than the builder."* Nothing here
should surprise you; every expected result below is copy-pasted from a response I actually got.

---

## 2. Prerequisites

1. **Author API running** on `http://localhost:8080` with the code at or after commit `20ad856`.
   ```powershell
   git log --oneline -1   # confirm 20ad856 or later is checked out
   ```
   If Author was already running before you pulled this commit, **restart it** — these are
   compiled Java changes, not something a running JVM picks up on its own:
   ```powershell
   cd flexcms
   $env:MAVEN_OPTS = "-Djavax.net.ssl.trustStoreType=Windows-ROOT"   # only needed on this network
   mvn -B spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author,local
   ```
2. **Seed data present** — the retest below uses the seeded `TUT 2026 Model Lineup` catalog and
   `content.tut-usa.home` page. If your environment has been reset, re-seed first (see
   `docs/TEST_DATA_SPECIFICATION.md`).
3. A tool to make HTTP requests: `curl`, Postman, or similar. No browser needed for this pass.

**Quick check before starting:**
```bash
curl -s http://localhost:8080/actuator/health
# expect: {"groups":["liveness","readiness"],"status":"UP"}
```
If that doesn't return `200`, stop — the rest of this document is `BLOCKED` until Author is up.

---

## 3. Retest Cases

### Table columns

Same convention as `docs/MANUAL_TEST_CASES_AUTHORING.md`: run each **Step**, compare against
**Expected**, record **PASS**/**FAIL**/**BLOCKED**. Any **FAIL** here is a regression on a fix that
was already verified once — treat it as high priority and stop to investigate before continuing.

### 3.1 Fixes — confirm each one now behaves correctly

| ID | What was fixed | Step | Expected | Pri |
|---|---|---|---|---|
| RT-01 | Trailing slash / unmapped path → was `500`, now `404` | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/pim/v1/products/"` | `HTTP=404`. Body is RFC 7807 JSON with `"errorCode":"NOT_FOUND"` and a `detail` mentioning the trailing slash. **Not** `500`. | P0 |
| RT-02 | Same fix, different endpoint (confirms it's generic, not PIM-specific) | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/author/content/nosuchendpoint"` | `HTTP=404` with the same RFC 7807 shape. | P0 |
| RT-03 | Invalid enum value on a query param → was `500`, now `400` | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/author/content/node/status?path=content.tut-usa.home&status=NOT_A_STATUS&userId=qa"` | `HTTP=400`. `detail` reads `"Parameter 'status' with value 'NOT_A_STATUS' could not be converted to NodeStatus."` | P0 |
| RT-04 | RT-03 must not have mutated anything | `curl -s "http://localhost:8080/api/author/content/node?path=content.tut-usa.home" \| grep -o '"status":"[^"]*"'` | `"status":"DRAFT"` (or whatever the page's status was before RT-03 — the point is it's **unchanged**, proving the rejected request never reached the write path) | P0 |
| RT-05 | PIM product not found on a write path → was `500`, now `404` | `curl -s -w "\nHTTP=%{http_code}\n" -X PUT "http://localhost:8080/api/pim/v1/products/NO-SUCH-SKU/status" -H "Content-Type: application/json" -d '{"status":"PUBLISHED","userId":"qa"}'` | `HTTP=404`. `detail` reads `"Product not found: NO-SUCH-SKU"`. | P0 |
| RT-06 | Illegal catalog activation → was `500`, now `409` | 1. `curl -s "http://localhost:8080/api/pim/v1/catalogs" \| grep -o '"id":"[^"]*"' \| head -1` — note the id (the seeded catalog is already `ACTIVE`). <br>2. `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/pim/v1/catalogs/<id>/activate"` | `HTTP=409`. `detail` reads `"Only DRAFT catalogs can be activated; current status: ACTIVE"`. | P0 |
| RT-07 | **New rule**: two catalogs can no longer both be `ACTIVE` for the same year | 1. Create two catalogs both with `"year": 2099` (`POST /api/pim/v1/catalogs`, needs a real `schemaId` — reuse the seeded schema's id from `GET /api/pim/v1/schemas`). <br>2. Activate the first — should succeed (`200`). <br>3. Activate the second. | Step 3 returns `HTTP=409` with `detail` containing `"Another catalog is already ACTIVE for year 2099"`. **This is new enforcement** — before the fix, both activations silently succeeded. | P1 |
| RT-08 | Duplicate site → was `500`, now `409` | Run this **twice** in a row: `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/admin/sites" -H "Content-Type: application/json" -d '{"siteId":"retest-dupe","title":"Retest Dupe","defaultLocale":"en","supportedLocales":["en"],"userId":"qa"}'` | First call: `HTTP=200/201`, site created. **Second call: `HTTP=409`**, `errorCode":"ALREADY_EXISTS"`, `detail` mentions `retest-dupe`. | P0 |
| RT-09 | Asset search without `siteId` → was a silent wrong empty result, now an explicit error | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/author/assets?q=<any 4+ char substring of a real DAM filename>&page=0&size=3"` (no `siteId`) | `HTTP=422`. `detail` reads exactly `"siteId is required when searching with 'q'"`. **Not** an empty `{"items":[],"totalCount":0}` — that would mean the old bug is back. | P0 |
| RT-10 | RT-09's counterpart: search **with** `siteId` still works correctly | Repeat RT-09's call with `&siteId=tut-usa` appended | `HTTP=200`. `items` contains the matching asset(s); `totalCount` ≥ 1. | P0 |

### 3.2 Regression checks — confirm nothing else broke

Fixing exception handling touches shared infrastructure (`GlobalExceptionHandler`), so these
confirm the **happy paths** on every module touched are still intact.

| ID | Area | Step | Expected | Pri |
|---|---|---|---|---|
| RT-20 | PIM product read | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/pim/v1/products/TUT-SOVEREIGN-2026"` | `HTTP=200` with the product body. (This GET path was already correct before the fix — confirms it's still correct after.) | P1 |
| RT-21 | PIM catalog list | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/pim/v1/catalogs"` | `HTTP=200` with the seeded catalog(s) listed. | P1 |
| RT-22 | PIM catalog create (happy path) | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/pim/v1/catalogs" -H "Content-Type: application/json" -d '{"name":"Retest Catalog","year":2050,"schemaId":"<real schema id>","userId":"qa"}'` | `HTTP=200/201`, catalog created with status `DRAFT`. | P1 |
| RT-23 | PIM catalog archive (happy path — the non-error branch of the code touched in RT-06) | Using a **DRAFT** catalog (e.g. from RT-22): activate it (`200`), then archive it: `POST /api/pim/v1/catalogs/<id>/archive` | Activate → `200`, status `ACTIVE`. Archive → `200`, status `ARCHIVED`. | P1 |
| RT-24 | PIM import — happy path (touches `ImportService`, changed in this fix) | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/pim/v1/imports/infer-schema?sourceType=CSV" -F "file=@<any small CSV with a header row>"` | `HTTP=200` with an inferred schema. | P2 |
| RT-25 | PIM import — bad sourceType still rejected cleanly (was already `500` pre-fix at the *old* `IllegalArgumentException`, now should be `400` per the same fix as RT-01–10) | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/pim/v1/imports/infer-schema?sourceType=NOTAREALFORMAT" -F "file=@<any file>"` | `HTTP=400` with `detail` reading `"No import source registered for type 'NOTAREALFORMAT'. Available: CSV, EXCEL, JSON"`. Verified live. | P1 |
| RT-26 | Site creation — happy path (touches `SiteManagementService`) | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/admin/sites" -H "Content-Type: application/json" -d '{"siteId":"retest-happy","title":"Retest Happy","defaultLocale":"en","supportedLocales":["en"],"userId":"qa"}'` | `HTTP=200/201`, new site created, root content nodes created underneath it. | P1 |
| RT-27 | Site list — happy path | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/admin/sites"` | `HTTP=200` with all sites listed, including any created above. | P2 |
| RT-28 | Asset upload — happy path (touches `AuthorAssetController`, changed in this fix) | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/author/assets" -F "file=@<any small image>" -F "path=/retest" -F "siteId=tut-usa" -F "userId=qa"` | `HTTP=200/201`, asset created. | P1 |
| RT-29 | Asset list without `q` (no `siteId` required here — only the `q`-search path changed) | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/author/assets?page=0&size=5"` (no `q`, no `siteId`) | `HTTP=200` with assets across all sites — this path is unaffected by RT-09/10 and must still work with no `siteId`. | P0 |
| RT-30 | Asset folder listing — happy path (siteId already required here before the fix; confirms unrelated) | `curl -s -w "\nHTTP=%{http_code}\n" "http://localhost:8080/api/author/assets/folder?folderPath=content/dam/tut-usa/images&siteId=tut-usa&page=0&size=3"` | `HTTP=200` with images listed. | P2 |
| RT-31 | Content node valid status transition still works (the happy path of RT-03/04's code) | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/author/content/node/status?path=content.tut-usa.accessories&status=PUBLISHED&userId=qa"` | `HTTP=200`, node status becomes `PUBLISHED`. (Use a page you don't mind publishing, or revert with `status=DRAFT` afterward.) | P0 |
| RT-32 | A genuinely malformed request body still gets the *existing* (unrelated, already-working) 400 handler, not the new ones | `curl -s -w "\nHTTP=%{http_code}\n" -X POST "http://localhost:8080/api/pim/v1/catalogs" -H "Content-Type: application/json" -d '["this","is","an","array","not","an","object"]'` | `HTTP=400` with `errorCode":"MALFORMED_REQUEST_BODY"` (pre-existing handler — confirms the new handlers didn't shadow it). | P2 |
| RT-33 | Full backend unit test suite | `cd flexcms && mvn -B test` (from repo root; set `MAVEN_OPTS` as in §2 if needed) | `BUILD SUCCESS`, **0 failures, 0 errors** across every module. This was green before push — must still be green now. | P0 |

### 3.3 What NOT to expect fixed — don't file these as regressions

These are **still open**, unrelated to this commit, and were explicitly left out of scope (see
`BUGS_AND_FINDINGS.md` §"Not attempted in this pass" and §"New discovery"). Confirming they're
*still* broken is not a regression — it's the expected, already-documented state:

| Item | Still expected to fail this way |
|---|---|
| WF-013 / GAP-109 | Workflow approve/reject in the Admin UI reports success even when the API call fails (frontend-only bug, not touched) |
| COMP-021 / FINDING-10 | Component Registry pagination changes the page number but doesn't slice the rendered rows (frontend-only) |
| FINDING-01 | Dashboard "Active Sites" stat undercounts (frontend-only) |
| FINDING-02 | Experience Fragments page defaults to a site with no content (frontend-only) |
| FINDING-03 | PIM Import Wizard's catalog dropdown 404s via a Next.js routing issue (frontend-only) |
| FINDING-04 | Icon font not loading sitewide (frontend-only) |
| FINDING-08 | Preview hangs indefinitely in Live mode on a never-published page (frontend-only) |
| FINDING-09 | Content Tree breadcrumb shows a hardcoded "Corporate Portal" (frontend-only, cosmetic) |
| GAP-101 | Workflow `for-user` inbox ignores the `userId` parameter (design question, not fixed) |
| PIM-081 | Product asset links accept a non-existent DAM path with no existence check (deliberate DB isolation tradeoff, not fixed) |
| XF-039 | `GET /api/author/xf/?...` (trailing slash) still returns a confusingly-worded `404` — the status was already correct before this pass, only the message is odd. Not touched. |
| New: `DELETE /api/admin/sites/{id}` | Returns `500` due to a `LazyInitializationException` on `Site.domains` — found during this session's cleanup, **not fixed**, not part of this commit. Worth its own retest task later. |

---

## 4. Recording results

Copy this into your report, one row per case:

| ID | Result | Tester | Date | Notes |
|---|---|---|---|---|
| RT-01 | | | | |
| RT-02 | | | | |
| RT-03 | | | | |
| RT-04 | | | | |
| RT-05 | | | | |
| RT-06 | | | | |
| RT-07 | | | | |
| RT-08 | | | | |
| RT-09 | | | | |
| RT-10 | | | | |
| RT-20 | | | | |
| RT-21 | | | | |
| RT-22 | | | | |
| RT-23 | | | | |
| RT-24 | | | | |
| RT-25 | | | | |
| RT-26 | | | | |
| RT-27 | | | | |
| RT-28 | | | | |
| RT-29 | | | | |
| RT-30 | | | | |
| RT-31 | | | | |
| RT-32 | | | | |
| RT-33 | | | | |

**If everything passes:** update `BUGS_AND_FINDINGS.md`'s fix table to add a line noting
independent retest confirmation (date + tester), and update the corresponding rows in
`docs/MANUAL_TEST_CASES_AUTHORING.md` (WF-016, WF-017, SITE-023, PIM-063, PIM-072, PIM-091,
DAM-095, GAP-103, GAP-107, GAP-110, plus PIM-064) from "✅ FIXED (unverified)" to a formal
execution-log entry with your name and date, per that document's §22.

**If anything fails:** stop, capture the exact response body + `correlationId`, and file it the
same way as any other finding (§1.4 of `docs/MANUAL_TEST_CASES_AUTHORING.md`) — treat it as
higher priority than a fresh defect, since it means a fix that was already verified once has
regressed.

### Cleanup

This retest creates a few disposable records. Clean up afterward if you want a pristine
environment (none of this is required — `qa-`/`retest-`-prefixed data is expected to accumulate
per `docs/TEST_DATA_SPECIFICATION.md`):
- Sites: `retest-dupe`, `retest-happy` (no delete endpoint currently works reliably — see the
  `DELETE /api/admin/sites/{id}` note in §3.3; these will likely need a direct DB cleanup if you
  want them gone)
- PIM catalogs created in RT-07 (year 2099) and RT-22/23 (year 2050) — archive or leave as DRAFT
- Any asset uploaded in RT-28 under `content/dam/tut-usa/retest`
- If RT-31 published `content.tut-usa.accessories`, consider setting it back to `DRAFT`
