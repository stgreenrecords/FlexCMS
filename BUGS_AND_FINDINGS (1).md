# FlexCMS — Bugs and Findings

**Test source:** `MANUAL_TEST_CASES_AUTHORING.md`, version 1.0  
**Execution date:** 2026-09-08 UTC  
**Scope attempted:** Mandatory Environment Smoke Tests (§4); DAM retest attempt (§13)  
**Overall status:** **BLOCKED — System Under Test is not reachable from the available test environment**

## Executive Summary

Testing was started in the priority order required by the authoring test plan. The mandatory P0 smoke gate could not be passed because the Author API, Publish API, and Admin UI were not reachable. Docker is also unavailable in the execution environment, so the FlexCMS services cannot be started or inspected here.

A second attempt was made after the reported import of 182 real TUT USA assets. Direct navigation to `http://localhost:3000/dam` remained blocked before application content loaded. Consequently, the new DAM baseline is recorded as **user-supplied setup information**, not as an independently verified PASS result.

This is recorded as a test-environment blocker rather than a confirmed FlexCMS product bug. The remaining functional test cases were not executed because §4 explicitly requires the tester to stop when a P0 smoke case fails.

## Session Summary

| Metric | Result |
|---|---:|
| Test cases attempted | 7 |
| PASS | 0 |
| FAIL | 2 |
| BLOCKED | 5 |
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
| DAM-SECTION-13 | P0 gate dependency | BLOCKED | Retest attempted after the reported 182-asset import. `http://localhost:3000/dam` could not be opened; browser navigation failed with `net::ERR_BLOCKED_BY_CLIENT` before the application DOM loaded. No §13 case was marked PASS or FAIL. |

## Reported DAM Baseline — Pending Independent Verification

The following setup state was supplied for the retest and should be treated as the expected starting baseline once the runtime is reachable:

| DAM folder | Reported count | Type |
|---|---:|---|
| `content/dam/tut-usa/images` | 145 | PNG |
| `content/dam/tut-usa/fonts` | 22 | WOFF2 |
| `content/dam/tut-usa/styles` | 15 | CSS |
| **Total** | **182** | **51.9 MB** |

Additional reported conditions:

- All 182 assets were uploaded as `admin`, assigned to site `tut-usa`, and have status `ACTIVE`.
- The same assets were copied to the reference-site and Admin UI public asset directories.
- 72 disallowed and 2 missing source resources were intentionally skipped and are outside this DAM load.
- 15 uploaded assets have SHA and/or size integrity warnings against their capture manifests. These warnings are not automatically classified as product defects; affected files must be visually opened or downloaded and compared before a finding is raised.

### DAM retest priorities after access is restored

1. Re-run the mandatory §4 smoke gate.
2. Verify `/api/author/assets/folders` returns the three TUT USA folders and exactly 182 assets.
3. Execute DAM browsing, folder-navigation, search, and asset-action cases in §13 against non-empty data.
4. Open representative PNG, WOFF2, and CSS asset details and compare UI metadata with the API.
5. Prioritize the 15 integrity-warning assets for preview/download validation.
6. Treat the static preview, empty renditions, and empty usage-reference panels according to known gaps GAP-024 through GAP-026; do not file duplicates unless observed behavior is worse than documented.
7. If metadata changes are silently lost after reload, file exactly one Major finding as required by the known-gap guidance.

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
- Second DAM retest navigation error: `net::ERR_BLOCKED_BY_CLIENT` at `http://localhost:3000/dam`.
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

Resume at **ENV-001** after the runtime becomes reachable. After the complete P0 smoke gate passes, continue directly with §13 using the reported 182-asset baseline above.
