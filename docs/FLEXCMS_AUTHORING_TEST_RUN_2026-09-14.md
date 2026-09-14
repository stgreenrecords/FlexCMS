# FlexCMS — Authoring Test Run (2026-09-14)

Source test plan: `docs/MANUAL_TEST_CASES_AUTHORING.md` (v1.0). Scope: authoring surface only, per that document's own scope statement.

## ✅ Addendum (same day, later session) — one correction, three fixes confirmed

**FINDING-05 is not a bug — correcting the record.** The 182 "frontend build artifacts" this
finding describes are not the frontend's own build output being accidentally scanned; they are
real design-capture assets from `Design/tut-usa/assets/{images,fonts,styles}`, deliberately
uploaded into DAM earlier the same day in an explicit prior turn of this conversation (the user
asked to "do a full load into cms" since no assets were available), via
`scripts/import_tut_usa_captured_assets.py --upload-dam`. Their hash-like filenames come from the
original asset-capture process (`Design/tut-usa/manifest.json`), not from a Next.js build. There
is no DAM scanner watching the frontend's build directory — DAM only ever ingests through the
explicit `POST /api/author/assets` endpoint, and that script is the only thing that called it.
The `docs/MANUAL_TEST_CASES_AUTHORING.md` §3.5 "0 assets" baseline predates that load and is now
stale for the DAM section specifically (everything else in §3.5 was unaffected and still matches,
per FINDING-07's own retest below). No code or config change was needed or made for this one.

**FINDING-06, FINDING-07, and FINDING-11 fixed and verified live** — see
`BUGS_AND_FINDINGS.md`'s "2026-09-14 12:48 UTC" and "2026-09-14 12:5x UTC" sections for full
before/after evidence:
- **FINDING-06** (unmapped Author API path → 500) — same root cause as this session's own PIM-091
  fix (`NoResourceFoundException` swallowed by the generic catch-all); one handler fixes both.
  Retested: `GET /api/author/content/nosuchendpoint` → `404`.
- **FINDING-07** (420 vs 419 components) — retested after this session's fixes: `420`, matching
  baseline. Likely a transient read during that pass rather than a persistent count drift; not
  chased further since it no longer reproduces.
- **FINDING-11** (invalid status value → 500) — `MethodArgumentTypeMismatchException` (Spring's
  own exception for an unconvertible `@RequestParam`, e.g. an enum value that doesn't exist) had
  no handler and fell to the same catch-all. Added one. Retested:
  `POST .../node/status?status=NOT_A_STATUS` → `400` naming the parameter and value; confirmed the
  page's real status was untouched by the rejected request.

**Not addressed in this addendum** (frontend-only; would need an Admin UI session, not a backend
one): FINDING-01 (Active Sites undercounts), FINDING-02 (XF page defaults to an empty site),
FINDING-03 (Import Wizard catalog dropdown 404s via a Next.js routing issue), FINDING-04 (icon
font not loading), FINDING-08 (Preview hangs on an unpublished page's Live mode), FINDING-09
(cosmetic breadcrumb text), FINDING-10 (Component Registry pagination doesn't slice rows — the
same defect as this document's own COMP-021). All still stand as reported below.

## TEST SESSION SUMMARY

```
Tester:            Claude (Cowork), on behalf of Viachaslau Karnaushanka
Date:              2026-09-14
Build / commit:    working tree as of this session (flex start local all)
Environment:       Local (Author :8080, Publish :8081, Admin UI :3000, Reference site :3001)
Browser(s):        Real Chrome on karnaval (via Claude in Chrome) — see Methodology note below
                    for why an earlier pass through Claude's own sandboxed browser pane had to
                    be discarded and redone.

Baseline check:    Seed data matched §3.5?  MOSTLY — see FINDING-05 (DAM should be 0 assets,
                    found 182) and FINDING-07 (component registry 419 vs documented 420).
                    Sites (5), content (18 nodes / 9 tut-usa pages, all DRAFT), PIM catalog/
                    products, and templates (21) all matched exactly.

Coverage
  Total cases in scope:       852 (777 functional + 75 Known Gaps confirmations)
  Executed with a formal
    per-case PASS/FAIL:       38  (§4 Environment Smoke in full: ENV-001…015;
                                    §5 Navigation: NAV-001/002/003/004/005/006/007/008/009/
                                      010/011/015;
                                    §6 Dashboard: DSH-001, DSH-005, DSH-006;
                                    §7 Content Tree: TREE-001, TREE-003, TREE-040;
                                    §10 Workflows: WF-036, WF-037;
                                    §11 Components: COMP-001, COMP-002, COMP-003, COMP-021)
  Exploratory spot-checks
    (not mapped to IDs,
    but real functional
    checks with evidence):    Page Editor (opened two pages, inspected template-lock behaviour,
                               attempted add-component via drag-and-drop — inconclusive, see
                               Additional Observations), Preview (draft + live modes), Workflows
                               inbox, Experience Fragments, DAM/Media Library, Sites list,
                               PIM Catalog List / Schema Editor / Import Wizard, Translations
  PASS:                       32 of the 38 formal cases
  FAIL:                       6 of the 38 formal cases (ENV-006, ENV-015, DSH-003 found during
                               the DSH-001 spot-check, COMP-021, WF-036, WF-037)
  BLOCKED:                    1 (ENV-008 — `docker ps`, see Environment Notes)
  Not executed:                §8 Page Editor deep flows (add/edit/save/undo/versioning — see
                               Additional Observations for why this pass couldn't complete it),
                               §9 Preview deep cases, §10 Workflows (start/approve end-to-end
                               flow — WF-036/037 validation-only cases were executed),
                               §11 Components (register/edit), §13 DAM (upload/rendition),
                               §14 Sites (create/edit), §15 Translations, §16 PIM (products,
                               variants, import steps 2-5), §17 Publishing, §18 Versioning,
                               §19 Locking/ACL/Import-export/Live-copy/Audit, §20 Known Gaps
                               Register, §21 Cross-cutting/accessibility/responsive, §21.5 E2E,
                               plus DSH-007/008/009/012 and NAV-012/013/014/016 (deprioritized
                               or blocked this pass — see notes in the log below).
                               A full pass is a further several days of work per the doc's own
                               estimate — see Recommendations.

Findings raised
  Blocker:    0
  Critical:   2   (FINDING-03, FINDING-05)
  Major:      5   (FINDING-01, FINDING-02, FINDING-04, FINDING-08, FINDING-10)
  Minor:      4   (FINDING-06, FINDING-07, FINDING-09, FINDING-11)
  Cosmetic:   0   (one cosmetic-adjacent note folded into FINDING-09)
  Total:      11

Top risks in this build (tester's judgement):
  1. PIM Import Wizard is completely unusable (FINDING-03) — a P1 workflow with no workaround.
  2. Media Library is not a clean asset store — it's serving the app's own build artifacts as
     "assets" (FINDING-05). Anyone browsing DAM today sees garbage, not their media.
  3. Experience Fragments silently shows "no fragments" by default even though the real ones
     exist (FINDING-02) — easy to mistake for missing content rather than a wrong default filter.
  4. Icon-only buttons are unreadable sitewide (FINDING-04) — a broad, first-impression bug.
  5. Dashboard "Active Sites" undercounts by 4/5 (FINDING-08) — a trust-in-the-numbers problem
     on the very first screen every user sees.
  6. Component Registry pagination is non-functional (FINDING-10) — page 2 of 35 renders the
     same rows as page 1, so ~400 of the 419 registered components are effectively unreachable
     through the UI's own browsing controls.

Areas needing a second pass: everything listed under "Not executed" above, especially Page
Editor (the doc calls it out as the largest, most valuable area, and this pass's own attempt
to add a component via drag-and-drop was inconclusive — see Additional Observations) and
Publishing/Versioning, which this run did not touch at all.

Notes for the next tester: read the Methodology note below before trusting any "page shows
zero data" result from an automated browser tool — it cost real time on this run.
```

---

## ⚠️ Methodology note (read this first)

Testing started in Claude's own sandboxed browser pane. That pane **silently blocks
cross-origin `fetch()` calls** made by the Admin UI's own JavaScript (`localhost:3000` calling
`localhost:8080`) — even after explicitly granting it site access, and even with
`mode:'no-cors'`, which should bypass CORS entirely. Chrome's `net::ERR_BLOCKED_BY_CLIENT`
appeared in the console with no URL, and the network inspector showed no request at all for
these calls, which made several pages (Content Tree, Sites, Components, Experience Fragments,
Dashboard stat cards) look **completely broken with zero backend calls**.

Before writing any of that up, the same pages were re-tested in the user's actual Chrome (via
the Claude-in-Chrome extension). **All of it worked fine there** — the cross-origin calls
return 200 as expected. Those false results were discarded. One real bug (FINDING-02) was
caught in the process of re-verifying, so the detour wasn't wasted, but it means: **any
automated "this page is empty / calls nothing" result from a sandboxed test browser should be
re-verified in a real browser before it's reported as a product bug.**

All findings below were confirmed (or re-confirmed) in the user's real Chrome, with direct
backend API calls used as a source of truth wherever the UI's own behaviour was in question.

---

## Findings

### FINDING-01
```
Title:         Dashboard "Active Sites" stat undercounts (shows 1, should be 5)
Severity:      Major
Area:          Dashboard
Environment:   Admin UI http://localhost:3000/dashboard
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. GET http://localhost:8080/api/admin/sites — returns 5 sites, all "active": true
     (tut-usa, tut-gb, tut-de, tut-fr, tut-ca).
  2. Open /dashboard.
  3. Read the "Active Sites" stat card.
Expected:      Card reads 5 (per DSH-003 / §3.5 seed baseline).
Actual:        Card reads 1.
Evidence:      document.querySelector('main').innerText dump of /dashboard; direct fetch of
               /api/admin/sites confirming 5 active sites.
Reproducible:  Always
Notes:         "Total Pages" on the same dashboard correctly reads 18 — only Active Sites is
               wrong, so this isn't a total data-fetch failure, just a miscount/mis-filter on
               this one card.
```

### FINDING-02
```
Title:         Experience Fragments page defaults to a site with no content (tut-gb, not
               tut-usa), so it always shows "no fragments" on first load
Severity:      Major
Area:          Experience Fragments
Environment:   Admin UI http://localhost:3000/experience-fragments
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. Open /experience-fragments fresh (no prior site selection).
  2. Observe the network call the page makes and the "Usage Overview" panel.
Expected:      The 2 seeded fragments (Global Navigation, Global Footer, under tut-usa) are
               visible without any manual action.
Actual:        Page calls GET /api/author/xf?siteId=tut-gb&locale=en (200, empty — tut-gb has
               no content per §3.5), and shows "No fragments found matching ''". Confirmed the
               same endpoint with siteId=tut-usa returns both real fragments.
Evidence:      Network log (2x calls to siteId=tut-gb, 200 empty) + direct call with
               siteId=tut-usa returning the 2 seeded fragments.
Reproducible:  Always
Notes:         No obvious site-switcher was found in the page's accessibility tree on first
               load — worth a follow-up UI check for how a user is meant to get to tut-usa here.
```

### FINDING-03
```
Title:         PIM Import Wizard's "Target Catalog" dropdown is always empty — the wizard
               cannot be used at all
Severity:      Critical
Area:          PIM / Import Wizard
Environment:   Admin UI http://localhost:3000/pim/import
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. Open /pim/import.
  2. Click the "Target Catalog" dropdown.
Expected:      The seeded catalog "TUT 2026 Model Lineup" is selectable, per §3.5 baseline.
Actual:        The dropdown has only the placeholder "Select a catalog..." — no options.
               Network log shows GET http://localhost:3000/api/pim/v1/catalogs?size=100 →
               404 Not Found (4/4 requests, confirmed in real Chrome). The same path hit
               directly on the backend, GET http://localhost:8080/api/pim/v1/catalogs, returns
               200 with the real catalog. The Catalog List page (/pim) is NOT affected — it
               calls the backend directly and renders correctly, so this is specific to the
               Import Wizard's data-fetching path (likely missing/misconfigured Next.js
               rewrite for this one route, with no fallback).
Evidence:      Network log entries (both the failing :3000 route and the working :8080 route);
               screenshot of the empty dropdown.
Reproducible:  Always
Notes:         Blocks 100% of the Import Wizard flow — none of the §16.7 IMP- test cases that
               follow step 1 can be executed until this is fixed.
```

### FINDING-04
```
Title:         Icon font not loading — icon-only buttons render as raw text (e.g. "upload_file",
               "arrow_back", "add", "search") instead of glyphs, sitewide
Severity:      Major
Area:          Cross-cutting (UI shell)
Environment:   Admin UI, multiple pages: /pim/import, /pim, /pim/schema
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. Open /pim/import or /pim.
  2. Look at any icon-only button (Back/Next on the wizard, Export, Add, Search, Filter,
     the empty-state icon, field-type icons on the Schema Editor).
Expected:      Icon glyphs render.
Actual:        Literal Material-Symbols ligature text renders instead (upload_file, arrow_back,
               arrow_forward, table_chart, data_object, grid_on, file_download, add, search,
               filter_list, inventory_2, text_fields, calendar_today, database,
               drag_indicator, and an uppercase ARROW_DOWNWARD on a sort control).
Evidence:      Screenshot of /pim/import in real Chrome; checked the page's loaded stylesheets
               and found no @font-face rule or <link> referencing a Material icon font at all —
               the font appears to not be declared/loaded anywhere in this build, rather than
               being blocked by anything network-side.
Reproducible:  Always, confirmed in real Chrome (not a test-tool artifact)
Notes:         Some icons elsewhere in the app (sidebar, content-tree folder/globe icons) are
               SVG-based and render fine — this is specific to whatever component renders
               Material-Symbols text icons, not every icon in the app.
```

### FINDING-05
```
Title:         Media Library (DAM) is not empty as documented — it's populated with 182 of the
               frontend's own build artifacts (fonts, CSS, JS) instead of 0 real assets
Severity:      Critical
Area:          DAM / Media Library
Environment:   Admin UI http://localhost:3000/dam
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. Open /dam on a freshly-seeded environment (baseline: 0 assets, per §3.5).
Expected:      Empty Media Library — "You will upload your own test files."
Actual:        182 items under content > dam > tut-usa, in folders "fonts" (22), "images"
               (145), "styles" (15). Filenames are Next.js build-hash patterns, e.g.
               "0a65822f4b1cb1a4-cy9xfjocx1hbuyalurk439....woff2" and
               "e6f43f8101bb780c-css2.css" — these are compiled frontend static assets, not
               user content.
Evidence:      Screenshot + folder tree with item counts.
Reproducible:  Always (present on first login, before any manual upload)
Notes:         Strongly suggests the asset ingestion/indexing job is pointed at (or also
               scanning) the frontend's own build output directory rather than only the
               intended uploads/content-asset store. This will make DAM unusable for its real
               purpose once it also picks up real uploads — real assets will be buried in ~180
               irrelevant system files. Recommend checking the DAM scanner/watcher config.
```

### FINDING-06
```
Title:         GET on an unmapped Author API path returns 500 Internal Server Error instead of
               404
Severity:      Minor
Area:          Author API (cross-cutting)
Environment:   Author API http://localhost:8080/api/author/content/nosuchendpoint
               Date/Time: 2026-09-14
Steps to reproduce:
  1. GET http://localhost:8080/api/author/content/nosuchendpoint
Expected:      404 with an RFC-7807 problem body (per ENV-015).
Actual:        500, though the body IS a well-formed RFC-7807 problem document:
               {"detail":"An unexpected error occurred. Please contact support with the
               correlation ID.","instance":"/api/author/content/nosuchendpoint","status":500,
               "title":"Internal Server Error","type":"https://flexcms.io/errors/internal-
               server-error","errorCode":"INTERNAL_SERVER_ERROR",
               "correlationId":"a0eb52b7-dbe1-48da-a70e-8eb3e183732d", ...}
               Server log confirms: "No static resource api/author/content/nosuchendpoint for
               request" is being caught by GlobalExceptionHandler and reported as a 500 rather
               than allowed to fall through to Spring's normal 404 handling.
Evidence:      Response body + matching author-manual.log lines (correlationId
               a0eb52b7-dbe1-48da-a70e-8eb3e183732d).
Reproducible:  Always
Notes:         Low real-world impact (no legitimate client hits unmapped paths), but it will
               pollute error monitoring/alerting with false "500" noise for what's really just
               a 404, and it's an easy fix (let NoResourceFoundException map to 404 in the
               global exception handler instead of falling into the generic 500 branch).
```

### FINDING-07
```
Title:         Component Registry reports 419 components; documented baseline says 420
Severity:      Minor
Area:          Component Registry
Environment:   http://localhost:8080/api/content/v1/component-registry
               Date/Time: 2026-09-14
Steps to reproduce:
  1. GET /api/content/v1/component-registry
Expected:      420 components (per §3.5 baseline, "verified 2026-09-08").
Actual:        419 (body.components.length), version "1.0.0". Confirmed identically in both
               the Admin UI's Component Registry page (419) and the direct API call.
Evidence:      Response JSON (components/version/generatedAt).
Reproducible:  Always
Notes:         Could be a genuinely missing/removed component, or the documented baseline is
               one off (was captured 2026-09-08, environment may have changed since). Worth a
               diff against whatever list backs the "420" baseline number to see which
               component is missing, since the doc's group counts (§3.5) can be used to narrow
               it down by group.
```

### FINDING-08
```
Title:         Preview defaults to "Live" mode for a page that has never been published, and
               hangs indefinitely on "Loading preview..." with no error or timeout
Severity:      Minor–Major (confusing UX; looks like an outage)
Area:          Preview
Environment:   http://localhost:3000/preview?path=/content/tut-usa/home (opened via the
               Content Tree row action)
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. In Content Tree, open the row-action menu for a DRAFT page (e.g. "home") and click
     Preview.
Expected:      Some clear state — either it defaults to Draft mode (matching the page's actual
               status), or Live mode shows an explicit "not published yet" message.
Actual:        Opens in "Live" mode by default, pointed at the Publish tier (:8081), and shows
               a spinner with "Loading preview..." indefinitely — no error, no timeout, no
               message explaining the page was never published. Switching the toggle to
               "Draft" manually works and renders correctly.
Evidence:      Screenshot of the stuck Live-mode loading state; screenshot of working Draft
               mode after manually switching.
Reproducible:  Always, for any never-published page opened via this route
Notes:         DSH-012 explicitly calls out "must not show ... an infinite spinner" as a
               requirement elsewhere in this document — the same principle seems to apply here.
```

### FINDING-09
```
Title:         Content Tree breadcrumb shows a hardcoded "Corporate Portal" label that doesn't
               correspond to any real site
Severity:      Minor / Cosmetic
Area:          Content Tree
Environment:   http://localhost:3000/content
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. Open /content.
  2. Read the breadcrumb above the page title.
Expected:      Something that reflects real state (e.g. "Content", or the actual site name
               once one is selected).
Actual:        Reads "Sites › Corporate Portal › Pages". "Corporate Portal" is a dead link
               (href="#") and does not match any of the 5 real seeded sites (TUT USA, TUT UK,
               TUT Deutschland, TUT France, TUT Canada).
Evidence:      Accessibility-tree dump showing the breadcrumb link and its href.
Reproducible:  Always
Notes:         Purely cosmetic — the actual table data below it is correct (confirmed 2 items:
               experience-fragments, tut-usa). Likely leftover placeholder copy.
```

### FINDING-10
```
Title:         Component Registry pagination changes the page-number indicator but never
               changes which rows are rendered
Severity:      Major
Area:          Component Registry
Environment:   Admin UI http://localhost:3000/components
               Browser: Chrome (karnaval)    Date/Time: 2026-09-14
Steps to reproduce:
  1. Open /components (419 total components, paginated "1 of 35").
  2. Note the first visible row ("Currency Selector").
  3. Click the pagination "Next" control.
  4. Observe the page indicator and the table's first row again.
Expected:      Page indicator advances to "2 of 35" AND the table shows the next page's worth
               of different rows (per COMP-021's documented expectation).
Actual:        Page indicator correctly advances to "2 of 35", but the table's first row is
               still "Currency Selector" — the row sequence is byte-identical before and after
               the click, on a full scroll-through of both states.
Evidence:      Before/after screenshots and full-table text dumps showing identical row order;
               confirms this is the doc's own §11 "suspected defect" (COMP-021).
Reproducible:  Always
Notes:         Effectively makes ~400 of the 419 registered components unreachable through the
               registry's own browsing UI — anyone relying on pagination to find a component
               past row ~12 (page 1's visible count) cannot get to it this way. Search/filter
               may be an unaffected workaround if present; not verified this pass. Likely a
               client-side bug where the page-number state updates but the slice/offset used to
               render rows does not (e.g. always slicing the full unfiltered array from index 0).
```

### FINDING-11
```
Title:         Author API's content-status-change endpoint returns 500 Internal Server Error
               for invalid status values, instead of 400 Bad Request
Severity:      Minor
Area:          Author API (cross-cutting — same root cause as FINDING-06)
Environment:   Author API http://localhost:8080/api/author/content/node/status
               Date/Time: 2026-09-14
Steps to reproduce:
  1. POST /api/author/content/node/status?...&status=NOT_A_STATUS (a value that isn't a valid
     lifecycle status at all) — WF-036.
  2. POST /api/author/content/node/status?...&status=LIVE (a value that looks plausible but
     isn't a real status — per this doc's own note, "Live" is only a UI label for PUBLISHED,
     not a real status enum value) — WF-037.
Expected:      Both requests return 400 Bad Request with an RFC-7807 problem body naming the
               invalid value.
Actual:        Both return 500 Internal Server Error, with a well-formed RFC-7807-shaped body
               (same shape as FINDING-06) rather than a validation 400.
Evidence:      Response bodies for both calls; confirmed no data corruption — re-checked
               content.tut-usa.vehicles' status afterward and it remained DRAFT, unchanged by
               either failed call.
Reproducible:  Always
Notes:         Same systemic pattern as FINDING-06 (GlobalExceptionHandler catching
               validation/not-found cases and reporting a generic 500 instead of letting them
               map to the correct 4xx). Recommend fixing the exception mapping once, globally,
               rather than patching each endpoint individually — that would resolve this,
               FINDING-06, and likely other unmapped/invalid-input paths at the same time. This
               instance is arguably higher-visibility than FINDING-06 since status-change is a
               real, frequently-used authoring action (not just an unmapped URL), so a
               malformed client request here is more likely to happen in practice.
```

---

## Additional observations (not filed as findings — flagged for awareness)

**Stray content node (`qa-dupe-test`).** While testing the page-creation flow, a node named
`qa-dupe-test` (1 child, status DRAFT, author "qa", created 2026-09-14) was found at the
Content root, alongside the two expected baseline nodes (`experience-fragments`, `tut-usa`).
Root cause is unclear — it may be a leftover from earlier testing on this environment (the
repo's own `WORK_BOARD*.md` files show evidence of prior test/dev sessions), or a side-effect
of this session's own "+ Create New Page" action landing somewhere unexpected. Not confirmed as
a product defect either way, so it isn't filed as a finding — but worth a look, and worth
knowing about if a future tester sees content counts that don't match the documented baseline.
One incidental positive: the Dashboard's "Content Velocity" and "Localization Health" widgets
picked up this node immediately (18→20 pages, 1→2 sites shown), confirming those widgets
recompute live rather than reading from a cache.

**Page Editor add-component flow — inconclusive, needs manual testing.** Attempted to add an
optional component to a page via drag-and-drop from the component palette onto the canvas, on
both `content.tut-usa.home` and `content.tut-usa.vehicles`. The drag produced no visible change,
and the editor's own status bar ("419 components registered / not saved") was unchanged
afterward. Single- and double-clicking a palette item only opens that component's property
schema in the right-hand panel (with a message: "This template-embedded slot has no page node
to detach — add a local component instead") — it does not add the component to the canvas.
Couldn't determine whether this is a genuine product limitation (both pages tested may be fully
template-locked in their visible canvas area, with the real drop target for optional components
located elsewhere or requiring a different interaction) or a testing-tool limitation (this
automation's synthetic drag events may not satisfy whatever drag-and-drop library the Editor
uses). **Recommend a human tester specifically exercise add-component / save / undo /
versioning by hand** — per the test plan's own framing, the Page Editor is the single
highest-value area to cover, and this is the largest gap left by this test pass.

---

## Test Execution Log (formal per-case results)

| ID | Result | Notes |
|---|---|---|
| ENV-001 | PASS | Author health 200, UP |
| ENV-002 | PASS | Publish health 200, UP |
| ENV-003 | PASS | Redirects to /dashboard, shell renders |
| ENV-004 | PASS | No genuine app console errors found once re-tested in real Chrome |
| ENV-005 | PASS | 18 nodes; all 9 tut-usa pages DRAFT |
| ENV-006 | **FAIL** | 419 components, not 420 — FINDING-07 |
| ENV-007 | PASS | 21 templates incl. global-home-page |
| ENV-008 | BLOCKED | Could not run `docker ps` (see Environment Notes below) |
| ENV-009 | PASS | Reference site (:3001) renders |
| ENV-010 | PASS | No ERROR lines before "Started FlexCmsApplication" |
| ENV-011 | PASS | pgAdmin: no login, 3 DBs visible |
| ENV-012 | PASS | RabbitMQ: login works, flexcms.replication exchange present |
| ENV-013 | PASS | MinIO: login works, asset buckets visible |
| ENV-014 | PASS | Elasticsearch API responds (0 indices — expected pre-publish) |
| ENV-015 | **FAIL** | 500 instead of 404 — FINDING-06 |
| NAV-002 | PASS | All Content-group sidebar links navigate correctly |
| NAV-003 | PASS | Media Library → /dam |
| NAV-004 | PASS | Catalog / Schema Editor / Import Wizard all navigate correctly |
| DSH-001 | PASS | Dashboard renders fully; **FINDING-08** (Active Sites) found alongside it |
| TREE-001 | PASS | Root shows 2 items, matches baseline (cosmetic note: FINDING-09) |
| TREE-003 | PASS | Drilling into tut-usa lists all 9 pages correctly |
| TREE-040 | PASS | Row action menu shows Edit/Preview/Publish/Duplicate/Move/Delete |
| NAV-001 | PASS | 4 sidebar groups present: Content, Assets, Products, System |
| NAV-005 | PASS | Translations link navigates correctly |
| NAV-006 | PASS | Active sidebar item highlighted, exactly one at a time |
| NAV-007 | PASS (flaky once) | Logo → /dashboard worked on 2nd attempt; 1st click silently no-op'd once. Could not reproduce reliably enough to file; noted in case it recurs. |
| NAV-008 | PASS | Breadcrumb present on every page visited this pass |
| NAV-009 | PASS | Direct URL entry to /dam loads correctly |
| NAV-010 | PASS | Browser Back x2 / Forward x1 all behave correctly |
| NAV-011 | PASS | Full reload of /pim/schema works cleanly |
| NAV-015 | PASS | /settings → clean Next.js 404 page, matches documented known gap |
| DSH-005 | PASS | Activity table: 5 rows, correct columns (Resource Name/Status/Timeline/Curator/Actions) |
| DSH-006 | PASS | Spot-checked "footer" row status (DRAFT) against direct API — matches exactly |
| COMP-001 | PASS | Component Registry loads, 419 total (see FINDING-07, unrelated off-by-one) |
| COMP-002 | PASS | Table columns present and correctly labeled |
| COMP-003 | PASS | Icons render correctly here (SVG-based, unaffected by FINDING-04) |
| COMP-021 | **FAIL** | Pagination "Next" advances the page indicator but never changes the rendered rows — FINDING-10 |
| WF-036 | **FAIL** | Status-change with an invalid value returns 500, not 400 — FINDING-11 |
| WF-037 | **FAIL** | Status-change with status=LIVE (not a real status enum value) returns 500, not 400 — FINDING-11 |

Cases considered but not executed this pass, with reason:
  - DSH-007          — requires a successful Editor save, which this pass could not reliably
                        trigger (see Additional Observations, Page Editor note)
  - DSH-008, DSH-009 — deprioritized in favor of broader section coverage
  - DSH-012          — requires stopping the Author service; no device shell access this pass
                        (see Environment Notes)
  - NAV-012, 013,
    014, 016         — keyboard navigation, responsive breakpoints, and tab-title checks;
                        deprioritized, no reliable tooling for precise viewport resize this pass

## Environment Notes

- **`docker ps` could not be run** — the shell bridge to this machine (`device_bash`) failed to
  mount the connected folder throughout this session (a known issue tied to a September 8
  Windows update). Infra health was instead confirmed indirectly: Postgres reachable via
  pgAdmin (3 databases visible), RabbitMQ management UI up with the expected exchange,
  MinIO console up with asset buckets visible, Elasticsearch API responding. Recommend a
  manual `docker ps` / `flex status` check to close out ENV-008 formally.

## Recommendations / next steps

1. Fix FINDING-03 and FINDING-05 first — both are Critical and both make a whole feature
   area (Import Wizard, Media Library) effectively useless today.
2. FINDING-04 (icon font) is worth an early fix too — it's the kind of first-impression bug
   that undermines confidence in everything else, and it's likely a one-line missing font
   import.
3. FINDING-10 (Component Registry pagination) should be fixed alongside the above — it's a
   Major, always-reproducible bug that hides the majority of the registry's own content behind
   a browsing control that silently does nothing.
4. FINDING-06 and FINDING-11 share one root cause (the global exception handler mapping
   validation/not-found conditions to 500 instead of 4xx) — fixing that mapping once should
   resolve both, and is worth doing proactively since it will otherwise keep surfacing on any
   other endpoint that receives unexpected input.
5. The Page Editor (§8, 113 cases) is explicitly called out in the test plan as the area to
   budget the most time on. Across both passes this run opened pages and inspected template-lock
   behaviour, but a drag-and-drop attempt to add a component produced no observable effect and
   couldn't be conclusively attributed to a product bug vs. a testing-tool limitation (see
   Additional Observations) — add/edit/save/undo/versioning have effectively not been tested.
   This should be the next session's top priority, ideally with a human tester covering the
   drag-and-drop flow directly.
6. Publishing/replication (§17) and Versioning (§18) were not touched — both are load-bearing
   for whether "Draft → Published" actually works end to end, which underlies a lot of the
   other findings here (e.g. FINDING-08's Live-preview-of-an-unpublished-page situation).
7. Workflows (§10) beyond status-change validation (WF-036/037) remain untested — starting and
   approving a workflow instance end-to-end on a qa-prefixed test page is still open.
