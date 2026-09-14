# FlexCMS — Manual Test Cases: Authoring

> **Document Version:** 1.0
> **Date:** 2026-09-08
> **Audience:** Manual testers (no coding required for the UI track)
> **Scope:** The complete **authoring** surface of FlexCMS — Admin UI (Content, Editor, Preview,
> Workflows, Components, Experience Fragments, DAM, Sites, Translations, PIM) plus every
> authoring capability that exists only as an API.
> **Out of scope:** Public delivery/rendering APIs, GraphQL delivery, SDK packages, performance
> and load testing, infrastructure hardening.
> **Total test cases:** 850 — 776 functional cases plus 74 Known Gaps Register confirmations.
> **Estimated effort:** 5–7 working days for a full pass by one tester (see §22.2 for a
> priority-ordered plan if you have less time).

---

## 1. How to Use This Document

### 1.1 Test case table columns

| Column | Meaning |
|---|---|
| **ID** | Unique test case ID (e.g. `TREE-004`). **Always quote this ID in your finding report.** |
| **Test Case** | What is being verified. |
| **Track** | `UI` = do it in the browser. `API` = the feature has **no UI**; use Postman/cURL. `UI+API` = do it in the UI, then confirm the result via API. |
| **Pre** | State required before you start. Blank = the base environment from §3 is enough. |
| **Steps** | Exact actions to perform. |
| **Expected Result** | What counts as a PASS. If what you see differs at all, it is a finding. |
| **Pri** | Priority — see §1.2. |

### 1.2 Priority

| Pri | Meaning | Run when |
|---|---|---|
| **P0** | Core authoring is unusable if broken. | Every pass |
| **P1** | Major feature defect; blocks release. | Every pass |
| **P2** | Should fix; a workaround exists. | Full regression |
| **P3** | Cosmetic / nice-to-have. | Time permitting |

### 1.3 Result codes

Record exactly one per test case:

| Code | Meaning |
|---|---|
| **PASS** | Observed result matches the Expected Result exactly. |
| **FAIL** | Observed result differs. **Raise a finding.** |
| **BLOCKED** | Could not run (dependency failed, environment down). State what blocked it. |
| **N/A** | Not applicable in this environment. State why. |

> **Do not mark a case PASS "with a small difference".** Any deviation is either a FAIL or a
> separate finding. Partial credit hides bugs.

### 1.4 How to report a finding

Use this template for every FAIL. One finding per template.

```
FINDING-<nnn>
Test Case ID:  <e.g. EDIT-012>
Title:         <one line: what is wrong — not what you did>
Severity:      Blocker | Critical | Major | Minor | Cosmetic
Area:          Content Tree | Editor | DAM | PIM | Workflows | ...
Environment:   Author http://localhost:8080 | Admin UI http://localhost:3000
               Browser: <name + version>    Date/Time: <local time>
Steps to reproduce:
  1.
  2.
  3.
Expected:      <from the Expected Result column>
Actual:        <exactly what happened, including verbatim error text>
Evidence:      <screenshot filename / HAR file / correlationId from the error response>
Reproducible:  Always | Intermittent (n of m attempts) | Once
Notes:         <anything that narrows it down>
```

**Severity guide**

| Severity | Means |
|---|---|
| **Blocker** | Cannot author at all; no workaround. Data loss or corruption. |
| **Critical** | A core feature is broken; workaround is painful or risky. |
| **Major** | A feature is broken but avoidable; or wrong data is shown. |
| **Minor** | Small functional problem with an easy workaround. |
| **Cosmetic** | Visual/copy issue only; behaviour is correct. |

**Always capture:**
- A **screenshot** of any unexpected UI state — full window, including the address bar.
- The **`correlationId`** from any API error body. It links your report to the server log.
- The **browser console** (F12 → Console) and the **Network** tab for any UI action that appears
  to do nothing. "Button does nothing" plus a console error is a far more useful report than
  "button does nothing".
- For data problems, the **content path** or **SKU** involved.

### 1.5 Known gaps — read this before you start

This build contains a substantial number of controls that are **rendered but deliberately not
wired**, and several features whose service layer exists with **no API or UI to reach it**. These
are catalogued in **§20 Known Gaps Register**.

> **Read §20 before testing.** Its cases ask you to *confirm the control is inert* — so an inert
> button listed there is a **PASS**, not a finding. Filing dozens of separate bugs for known-dead
> buttons buries the real defects.
>
> **If you find a dead control that is NOT listed in §20, that IS a finding.** Report it.

### 1.6 Suggested execution order

1. §4 Environment Smoke — **must pass first**; everything else is BLOCKED if it does not.
2. §5 Navigation → §6 Dashboard → §7 Content Tree — establishes that the shell and core data work.
3. §8 Page Editor — the largest and most valuable area. Budget the most time here.
4. §9 Preview → §10 Workflows → §11 Components → §12 Experience Fragments.
5. §13 DAM → §14 Sites → §15 Translations → §16 PIM.
6. §17–§19 API-only authoring features (versioning, publishing/replication, locking, ACL,
   import/export, live copy, scheduled publishing, language copy, audit).
7. §20 Known Gaps Register — confirm the known-inert list.
8. §21 Cross-cutting (validation, error handling, accessibility, responsive).

---

## 2. System Under Test

FlexCMS is an enterprise headless CMS with three independent pillars:

| Pillar | What it manages |
|---|---|
| **Content (CMS)** | A page tree. Pages hold components; component data is JSON. |
| **DAM** | Digital assets (image, video, PDF) with auto-generated renditions. |
| **PIM** | Products, catalogs, attribute schemas, variants. Has its own separate database. |

Two runtime tiers:

| Tier | Port | Role |
|---|---|---|
| **Author** | 8080 | Read-write. Everything in this document targets Author. |
| **Publish** | 8081 | Read-only. Content arrives here by replication after publishing. |

**The backend returns JSON only — it never renders HTML.** All rendering is the frontend's job.
If you ever see raw HTML in an API response, that is a finding.

**Content paths** are stored with `.` separators (`content.tut-usa.home`) and appear in URLs with
`/` (`/tut-usa/home`). Both forms are accepted by the API.

**Page lifecycle statuses:** `DRAFT` → `IN_REVIEW` → `APPROVED` → `PUBLISHED` → `ARCHIVED`.
There is no `LIVE` status. If the UI shows "Live", it is a display label for `PUBLISHED`.

**Two independent paths change a page's status** — they enforce *different* rules, so both are
tested separately:
1. The **direct status endpoint** (what the Editor's Publish button and the Content Tree use).
   It performs **no state-machine validation** — any status can go to any other status.
2. The **workflow engine** (§10), which *does* enforce a guarded step machine.

---

## 3. Test Environment

### 3.1 Service endpoints

| Service | URL | Needed for |
|---|---|---|
| **Admin UI** | http://localhost:3000 | The whole UI track |
| **Author API** | http://localhost:8080/api/author/ | UI backing + the whole API track |
| **Publish API** | http://localhost:8081 | Publishing/replication verification (§17) |
| Reference site (React) | http://localhost:3001 | Preview iframe (§9) |
| Author health | http://localhost:8080/actuator/health | Smoke check |
| Component registry | http://localhost:8080/api/content/v1/component-registry | Component schema reference |
| pgAdmin 4 (DB browser) | http://localhost:5050 | No login. DB password `flexcms`. |
| RabbitMQ Management | http://localhost:15672 | guest / guest. Replication queue (§17) |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin. Raw asset storage (§13) |
| Elasticsearch | http://localhost:9200 | Search index checks |

### 3.2 Authentication — important

Local development runs with `flexcms.local-dev=true`. **No login is required and no
`Authorization` header is needed** — every request is treated as an anonymous `ROLE_ADMIN` user.

**Consequences for testing:**
- The `/login` page exists but is bypassed. Do **not** report "the app did not ask me to log in"
  as a finding in this environment.
- All role and permission test cases (§19) **cannot be verified in local-dev mode** and are
  marked `N/A (local-dev)`. They require a deployment with Keycloak enabled.

### 3.3 Common API headers

```
Content-Type: application/json
Accept: application/json
```

No `Authorization` header in local-dev.

### 3.4 Starting and stopping the environment

```powershell
flex start local all      # infra + author + publish + admin + reference site
flex status               # health-check everything
flex stop local           # tear down
flex logs author          # tail the Author log
```

> **Prerequisites:** Java 21, Maven, Docker Desktop, **and Node.js 20+ with pnpm 9**.
> The Admin UI (port 3000) cannot start without Node.js and pnpm.

### 3.5 Baseline seed data — verified 2026-09-08

The environment is seeded with a fictional luxury-automotive brand, **TUT**. Confirm this
baseline before you start. If it differs, record the difference in your test report header —
several test cases reference these exact values.

**Sites — 5 registered:**

| siteId | Title | Default locale | Has content? |
|---|---|---|---|
| `tut-usa` | TUT USA | en | **yes — the only site with pages** |
| `tut-gb` | TUT United Kingdom | en | no — registered only |
| `tut-de` | TUT Deutschland | de | no — registered only |
| `tut-fr` | TUT France | fr | no — registered only |
| `tut-ca` | TUT Canada | en | no — registered only |

> **Expected asymmetry:** the Sites page lists **5** sites, but the Content Tree shows only
> **`tut-usa`**. That is correct for this seed — the other four are registered with domain
> mappings but have no content nodes. Do not report it as a bug.

**Content — 18 nodes total.** Nine pages sit directly under `content.tut-usa`, all `DRAFT`:

| Path | Template |
|---|---|
| `content.tut-usa.home` | `global-home-page` |
| `content.tut-usa.vehicles` | `model-overview-page` |
| `content.tut-usa.innovation` | `innovation-hub-page` |
| `content.tut-usa.news-and-updates` | `news-updates-landing-page` |
| `content.tut-usa.owners` | `owners-hub-landing-page` |
| `content.tut-usa.offers-and-finance` | `offers-financing-leasing-page` |
| `content.tut-usa.accessories` | `accessories-lifestyle-collection-page` |
| `content.tut-usa.learn` | `learning-education-hub-page` |
| `content.tut-usa.contact-and-concierge` | `contact-concierge-support-page` |

> **Note the path shape:** pages sit **directly** under the site root (`content.tut-usa.home`),
> with **no locale segment**. Locale is stored as a *property* (`locale: "en"`), not as a path
> level. Use these exact paths in test steps.

> **All nine pages start with zero components.** The Editor canvas will be empty the first time
> you open any of them. That is the correct baseline — build content as the tests direct.

**Experience Fragments — 2**, each with a `master` variation:

| Path | Title |
|---|---|
| `content.experience-fragments.tut-usa.global.navigation` | Global Navigation |
| `content.experience-fragments.tut-usa.global.footer` | Global Footer |

**Component registry — 420 components** across 18 groups. Largest groups:

| Count | Group |
|---|---|
| 69 | Editorial & Article Content |
| 43 | Calls to Action, Promotions & Campaigns |
| 42 | Forms, Data Capture & Consent |
| 33 | Media, Visual Storytelling & Assets |
| 32 | Layout & Page Structure |
| 31 | Community, Social Proof & Engagement |
| 31 | Commerce, Catalog & Merchandising |
| 29 | Navigation, Search & Discovery |
| 24 | Events, Booking, Travel & Hospitality |
| 24 | Account, Portal & Transactional |
| 19 | Brand, Corporate, Investor & Governance |
| 14 | Education, Learning & Developer Content |
| 13 | Location, Local & Physical Presence |
| 5 | Structure |
| 3 | Content |
| 3 | Commerce |
| 2 | Support, Documentation & Knowledge |
| 2 | Experience Fragments |

**Page templates — 21**, including `default-page`, `global-home-page`, `model-overview-page`,
`vehicle-model-detail-page`, `build-configure-page`, `compare-models-page`,
`innovation-hub-page`, `news-press-article-detail-page`, `dealer-showroom-locator-page`,
`book-a-test-drive-page`.

**DAM — 0 assets.** The Media Library is empty. You will upload your own test files (§13).

**PIM:**

| Entity | Value |
|---|---|
| Schema | **Luxury Vehicle v2026**, version `1.0` |
| Catalog | **TUT 2026 Model Lineup**, year 2026, status `ACTIVE` |
| Products (4) | `TUT-SOVEREIGN-2026`, `TUT-VANGUARD-2026`, `TUT-ECLIPSE-2026`, `TUT-APEX-2026` |

**Workflows — 0 active instances.** The Workflow Inbox is empty until you start one (§10).

### 3.6 Test data hygiene

- Prefix everything you create with **`qa-`** (`qa-smoke-page`, `qa-asset-01.png`, `qa-SKU-001`)
  so it can be identified and cleaned up.
- **Never delete or rename the nine seeded `tut-usa` pages, the two seeded Experience Fragments,
  the seeded PIM catalog/schema, or the four seeded products.** Later test cases depend on them.
  Destructive tests must use `qa-` objects you created yourself.
- Test data may remain after a session. To restore the baseline, re-seed per
  `docs/TEST_DATA_SPECIFICATION.md`.

### 3.7 Test files you will need

Prepare these before starting §13 (DAM):

| File | Purpose |
|---|---|
| `qa-image-small.png` | ~50 KB PNG, e.g. 800×600 |
| `qa-image-large.jpg` | ~5 MB JPEG, e.g. 4000×3000 |
| `qa-doc.pdf` | Any small PDF |
| `qa-video.mp4` | Small MP4 (a few MB) |
| `qa-oversize.bin` | **>100 MB** file — for the max-size rejection test |
| `qa-empty.png` | **0-byte** file named `.png` — for the empty-file rejection test |
| `qa-fake-image.png` | Rename a `.exe` or `.zip` to `.png` — for the MIME-sniffing test |
| `qa-products.csv` | CSV with header row + 5 rows, columns: `sku,name,price,description` |
| `qa-products-bad.csv` | Same but with a missing `sku` value on one row |

### 3.8 Browsers

Run the full suite on **Chrome (latest)**. Then repeat the **P0 cases only** on **Firefox** and
**Edge**. Note browser and version in every finding.

---

## 4. Environment Smoke Tests

Run these first. **If any P0 case here fails, stop and report it — the rest of the suite is
BLOCKED.**

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| ENV-001 | Author service is up | API | — | GET `http://localhost:8080/actuator/health` | `200`; body contains `"status":"UP"` | P0 |
| ENV-002 | Publish service is up | API | — | GET `http://localhost:8081/actuator/health` | `200`; `"status":"UP"` | P0 |
| ENV-003 | Admin UI loads | UI | — | Open `http://localhost:3000` | Redirects to `/dashboard`; sidebar and top bar render; no blank page | P0 |
| ENV-004 | No console errors on load | UI | ENV-003 | F12 → Console. Reload `/dashboard`. | No red uncaught errors. Warnings are acceptable — note them in the report. | P1 |
| ENV-005 | Seed baseline matches §3.5 | UI+API | ENV-003 | GET `/api/author/content/list?page=0&size=50`; compare against §3.5 | 18 nodes; the nine `tut-usa` pages present; all `status: DRAFT` | P0 |
| ENV-006 | Component registry loads | API | — | GET `http://localhost:8080/api/content/v1/component-registry` | `200`; 420 components; each has `resourceType`, `title`, `dataSchema` | P0 |
| ENV-007 | Templates load | API | — | GET `/api/author/content/templates` | `200`; 21 templates including `global-home-page` | P1 |
| ENV-008 | Infra containers healthy | — | — | Run `docker ps` | postgres, redis, rabbitmq, minio, elasticsearch, pgadmin all `Up`; postgres/redis/rabbitmq/elasticsearch show `(healthy)` | P0 |
| ENV-009 | Reference site is up | UI | — | Open `http://localhost:3001` | Page renders. Needed for Preview (§9). | P1 |
| ENV-010 | Author log clean at startup | — | — | Open `.dev-logs/author.log`; search for `ERROR` | No `ERROR` entries between startup and `Started FlexCmsApplication` | P1 |
| ENV-011 | pgAdmin reachable | — | — | Open `http://localhost:5050` | Opens with no login prompt; `flexcms` and `flexcms_pim` databases visible (DB password `flexcms`) | P2 |
| ENV-012 | RabbitMQ management reachable | — | — | Open `http://localhost:15672`, log in guest/guest | Dashboard loads; exchange `flexcms.replication` exists | P2 |
| ENV-013 | MinIO console reachable | — | — | Open `http://localhost:9001`, log in minioadmin/minioadmin | Console loads; the asset bucket is listed | P2 |
| ENV-014 | Elasticsearch reachable | API | — | GET `http://localhost:9200/_cat/indices?v` | `200`; index list returned | P2 |
| ENV-015 | Author API rejects unmapped path cleanly | API | — | GET `http://localhost:8080/api/author/content/nosuchendpoint` | A `404` with an RFC-7807 problem body. **A `500` here is a finding.** | P2 |

---

## 5. Global Navigation & Shell

The shell (top bar + sidebar) wraps every page except `/login`, `/editor`, and `/preview`, which
render standalone.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| NAV-001 | Sidebar renders all groups | UI | — | Open `/dashboard`; inspect the sidebar | Four groups present: **Content**, **Assets**, **Products**, **System** | P1 |
| NAV-002 | Content group links navigate | UI | — | Click each in turn: Dashboard, Content Tree, Sites, Workflows, Components, Experience Fragments, Content Preview | Navigates to `/dashboard`, `/content`, `/sites`, `/workflows`, `/components`, `/experience-fragments`, `/preview`. No 404, no blank page. | P0 |
| NAV-003 | Assets group link navigates | UI | — | Click **Media Library** | Navigates to `/dam` | P0 |
| NAV-004 | Products group links navigate | UI | — | Click Catalog, Schema Editor, Import Wizard | Navigates to `/pim`, `/pim/schema`, `/pim/import` | P0 |
| NAV-005 | Translations link navigates | UI | — | Click **Translations** | Navigates to `/translations` | P1 |
| NAV-006 | Active item is highlighted | UI | — | Visit each page in turn | The current page's sidebar item is visually highlighted, and only one at a time | P2 |
| NAV-007 | Logo returns to dashboard | UI | Be on `/dam` | Click the **FlexCMS** logo, top-left | Navigates to `/dashboard` | P2 |
| NAV-008 | Breadcrumb on every page | UI | — | Visit `/content`, `/sites`, `/workflows`, `/components`, `/experience-fragments`, `/dam`, `/pim`, `/translations` | Every page shows a breadcrumb trail at the top | P2 |
| NAV-009 | Direct URL entry works | UI | — | Type `http://localhost:3000/dam` into the address bar; press Enter | The page loads directly with the shell intact — not blank, not 404 | P1 |
| NAV-010 | Browser Back / Forward | UI | — | Navigate `/dashboard` → `/content` → `/dam`; press Back twice, then Forward once | History works; each page re-renders with correct data; no stuck loading spinner | P1 |
| NAV-011 | Deep-link refresh (F5) | UI | Be on `/pim/schema` | Press F5 | The same page reloads correctly; no 404 | P1 |
| NAV-012 | Keyboard navigation of sidebar | UI | — | From the top of the page, press Tab repeatedly | Focus moves through sidebar items in visual order with a visible focus ring; Enter activates the focused item | P2 |
| NAV-013 | Layout at 1280×800 | UI | — | Resize the window to 1280×800 | No horizontal page scrollbar; no overlapping or clipped text | P2 |
| NAV-014 | Layout at 1024×768 | UI | — | Resize to 1024×768 | Layout adapts; all sidebar items remain reachable; wide tables scroll inside their own container rather than overflowing the page | P2 |
| NAV-015 | Settings link is a dead route | UI | — | Click the **Settings** sidebar item, and the gear icon in the top bar | **Known gap (§20).** Both point at `/settings`, which does not exist. Expected: a 404 or empty page. Record the exact behaviour. | P2 |
| NAV-016 | Page title / tab label | UI | — | Visit three different pages; look at the browser tab | The tab label changes per page and is not left as a generic default | P3 |
---

## 6. Dashboard (`/dashboard`)

The landing workspace overview.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| DSH-001 | Dashboard renders | UI | — | Open `/dashboard` | Breadcrumb "Workspace › CMS Dashboard"; four stat cards; activity table. No blank regions. | P0 |
| DSH-002 | Total Pages stat is correct | UI+API | — | Read the **Total Pages** card. Then GET `/api/author/content/list?page=0&size=1` and read `totalElements`. | The card reflects the real page count from the API (not `0`, not `—`) | P1 |
| DSH-003 | Active Sites stat is correct | UI+API | — | Read the **Active Sites** card. Then GET `/api/admin/sites`. | The card shows `5`, matching the seeded site count | P1 |
| DSH-004 | Workflows / Storage stats | UI | — | Read the **Workflows** and **Storage Used** cards | **Known gap (§20).** Both show `—`. Confirm they are placeholders, not wrong numbers. | P3 |
| DSH-005 | Recent Global Activity table populates | UI | — | Inspect the activity table | Shows up to 5 rows, the most recently modified content nodes. Columns: Resource Name, Status, Timeline, Curator, Actions. | P1 |
| DSH-006 | Activity rows show real data | UI | — | Compare a row's Resource Name and Status against `/api/author/content/list` | Names and statuses match the real nodes. All seeded pages show `DRAFT`. | P1 |
| DSH-007 | Activity table reflects a change | UI | — | Edit any page (§8), save, then return to `/dashboard` and reload | The edited page appears at or near the top of Recent Global Activity, with an updated timestamp | P1 |
| DSH-008 | Create New Resource button | UI | — | Click **Create New Resource** | Navigates to `/content` | P2 |
| DSH-009 | Loading skeletons appear | UI | — | Hard-reload `/dashboard` (Ctrl+Shift+R) and watch closely | Skeleton placeholders show while data loads, then are replaced by content. No layout jump that hides content. | P2 |
| DSH-010 | Content Updates chart panel | UI | — | Inspect the **Content Updates** panel | **Known gap (§20).** Always shows "No content activity data yet", even with real content. Confirm. | P3 |
| DSH-011 | Smart Tasks panel | UI | — | Inspect the **Smart Tasks** panel | **Known gap (§20).** Always shows "No pending tasks". Confirm. | P3 |
| DSH-012 | Dashboard with backend down | UI | Stop the Author service | Reload `/dashboard` | A clear error or empty state is shown. **The page must not show a blank screen, an infinite spinner, or a raw stack trace.** Restart Author afterwards. | P1 |

---

## 7. Content Tree (`/content`)

Browse and manage the content hierarchy.

### 7.1 Browsing and navigation

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| TREE-001 | Content tree loads | UI | — | Open `/content` | Table renders with the root level. `tut-usa` and `experience-fragments` are visible. | P0 |
| TREE-002 | Table columns present | UI | — | Inspect the table header | Columns: checkbox, **Name**, **Status**, **URL Path**, **Last Modified**, **Author**, and a row action column | P1 |
| TREE-003 | Drill into a folder | UI | — | Click the `tut-usa` row | Navigates into `tut-usa`; the nine seeded pages are listed | P0 |
| TREE-004 | Child count badge | UI | — | At the root level, inspect the `tut-usa` row | A chevron and a child-count badge are shown, because it has children. Leaf pages show neither. | P2 |
| TREE-005 | Folder breadcrumb updates | UI | TREE-003 | After drilling into `tut-usa`, inspect the in-page breadcrumb | The trail shows the current folder; the item count is correct (9) | P1 |
| TREE-006 | Up one level | UI | TREE-003 | Click **Up one level** | Returns to the root; `tut-usa` and `experience-fragments` are listed again | P1 |
| TREE-007 | Breadcrumb crumb click | UI | Drill 2 levels deep | Click an earlier crumb in the trail | Jumps directly to that level | P1 |
| TREE-008 | Nine pages, all DRAFT | UI | TREE-003 | Read the Status column for all nine pages | Every page shows `DRAFT` (matching §3.5) | P1 |
| TREE-009 | URL Path column format | UI | TREE-003 | Inspect the URL Path values | Paths are shown in URL form with `/` separators (e.g. `/tut-usa/home`), **not** ltree dot form | P2 |
| TREE-010 | Last Modified / Author populated | UI | TREE-003 | Inspect both columns | Both show real values for seeded pages (author `system`), not blanks or `—` | P2 |
| TREE-011 | Filter by name | UI | TREE-003 | Type `vehicles` into the filter box | Only the `vehicles` row remains. Filtering is live, no Enter needed. | P1 |
| TREE-012 | Filter by URL | UI | TREE-003 | Type `offers` into the filter box | The `offers-and-finance` row matches | P2 |
| TREE-013 | Filter with no matches | UI | TREE-003 | Type `zzzznotfound` | A "no match" empty state is shown — **not** a blank table and not the unfiltered list | P1 |
| TREE-014 | Clear the filter | UI | TREE-011 | Clear the filter box | All nine rows return | P1 |
| TREE-015 | Filter is case-insensitive | UI | TREE-003 | Type `VEHICLES` | The `vehicles` row still matches | P2 |
| TREE-016 | Filter resets on navigation | UI | TREE-011 | With a filter active, navigate up a level | Behaviour is sensible and not confusing: either the filter clears, or it stays and is visibly still applied. Record which. | P2 |
| TREE-017 | Empty folder state | UI | — | Navigate into `experience-fragments` → `tut-usa` → `global` → `navigation` | Shows the `master` variation. Navigate into a node with no children: an "This folder is empty" message appears. | P2 |
| TREE-018 | List / Tree view toggle | UI | — | Click the **Tree** toggle, then **List** | The toggle responds and its selected state is visually clear. **Note:** both modes currently render the same flat table — record whether the layout actually differs. | P2 |
| TREE-019 | Loading skeleton | UI | — | Hard-reload `/content` | Skeleton rows appear, then real rows. No flash of an incorrect empty state. | P2 |
| TREE-020 | Footer item count | UI | TREE-003 | Read the footer | "Showing 9 items in tut-usa" (or equivalent) — the count matches the visible rows | P2 |
| TREE-021 | Footer count respects filter | UI | TREE-011 | Apply a filter that matches one row | The footer count updates to match the filtered rows | P2 |

### 7.2 Selection

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| TREE-030 | Select a single row | UI | TREE-003 | Click one row's checkbox | The row is marked selected; an "1 selected" pill appears in the header | P1 |
| TREE-031 | Select multiple rows | UI | TREE-003 | Check three rows | All three are marked; the pill reads "3 selected" | P1 |
| TREE-032 | Select all | UI | TREE-003 | Click the header checkbox | All nine rows become selected; the pill reads "9 selected" | P1 |
| TREE-033 | Indeterminate state | UI | TREE-030 | With some (not all) rows selected, inspect the header checkbox | It shows an indeterminate/partial state, not fully checked and not fully unchecked | P2 |
| TREE-034 | Deselect all | UI | TREE-032 | Click the header checkbox again | All rows are deselected; the pill disappears | P1 |
| TREE-035 | Clear selection via the pill | UI | TREE-031 | Click the "N selected" pill | Selection clears | P2 |
| TREE-036 | Selection clears on navigation | UI | TREE-031 | With rows selected, navigate into a folder | Selection does not leak across folders — stale selections must not persist into a different folder's rows | P1 |
| TREE-037 | Checkbox click does not navigate | UI | TREE-003 | Click precisely on a row's checkbox | Only selection toggles. The app must **not** also drill into the row. | P1 |

### 7.3 Row actions

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| TREE-040 | Open the row action menu | UI | TREE-003 | Click the `⋮` button on the `home` row | A menu opens listing Edit, Preview, Publish, Duplicate, Move, Delete | P1 |
| TREE-041 | Menu closes on outside click | UI | TREE-040 | Click elsewhere on the page | The menu closes without performing any action | P2 |
| TREE-042 | Only one menu open at a time | UI | TREE-040 | With one menu open, click a different row's `⋮` | The first menu closes and the second opens | P2 |
| TREE-043 | **Edit** opens the editor | UI | TREE-040 | Click **Edit** on `home` | Navigates to `/editor?path=content.tut-usa.home` and the editor loads that page | P0 |
| TREE-044 | **Preview** opens preview | UI | TREE-040 | Click **Preview** on `home` | Navigates to `/preview?path=content.tut-usa.home` | P0 |
| TREE-045 | Publish / Duplicate / Move / Delete are inert | UI | TREE-040 | Click each of **Publish**, **Duplicate**, **Move**, **Delete** in turn | **Known gap (§20).** Each only closes the menu — no API call, no confirmation dialog, no change. Verify with F12 → Network that **no** request is sent, and confirm via `/api/author/content/list` that nothing changed. | P1 |
| TREE-046 | Delete asks for no confirmation | UI | TREE-040 | Click **Delete** | Because the action is inert, nothing is deleted. **If anything IS deleted without a confirmation dialog, that is a Blocker finding — report immediately.** | P0 |
| TREE-047 | Double-click a leaf page | UI | TREE-003 | Double-click the `home` row | Opens the published site URL for that page in a new tab. With the page unpublished, a not-found/empty page from the site is acceptable — record what appears. | P2 |
| TREE-048 | Header **Publish All** is inert | UI | — | Click **Publish All** | **Known gap (§20).** No request in the Network tab; no status changes. | P2 |
| TREE-049 | Header **+ Create New Page** is inert | UI | — | Click **+ Create New Page** | **Known gap (§20).** Nothing happens — no dialog, no navigation. **This means pages cannot be created from the UI at all; use the API (TREE-060).** | P1 |
| TREE-050 | Toolbar Filter / Sort / More are inert | UI | — | Click the Filter, Sort and `⋯` toolbar icons | **Known gap (§20).** No menus, no effect. | P3 |
| TREE-051 | Right context rail is inert | UI | — | Click each icon in the right-hand rail (Version history, Page info, Comments, Settings) | **Known gap (§20).** All four are inert. | P3 |
| TREE-052 | Activity Overview cards | UI | — | Inspect Content Velocity, Localization Health, Performance Index | The first two derive from live data. **Performance Index is hardcoded `94/100` — known gap (§20).** | P3 |

### 7.4 Content CRUD via API (no UI equivalent)

Because **+ Create New Page** is inert (TREE-049), page creation, move, and delete can only be
exercised through the API. These are core authoring features and must be tested.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| TREE-060 | Create a page | API | — | POST `/api/author/content/node` with body `{"parentPath":"content.tut-usa","name":"qa-smoke-page","resourceType":"flexcms/page","properties":{"jcr:title":"QA Smoke Page","siteId":"tut-usa","template":"default-page"},"userId":"qa-tester"}` | `200/201`; the node is created at `content.tut-usa.qa-smoke-page` with `status: DRAFT` | P0 |
| TREE-061 | New page appears in the UI | UI | TREE-060 | Open `/content`, drill into `tut-usa` | `qa-smoke-page` is listed with status `DRAFT`. A refresh may be needed — note if it does not appear without one. | P0 |
| TREE-062 | Read the page back | API | TREE-060 | GET `/api/author/content/node?path=content.tut-usa.qa-smoke-page` | `200`; `properties` contains the title and template you sent | P0 |
| TREE-063 | Duplicate path is rejected | API | TREE-060 | Repeat TREE-060 verbatim | `409 Conflict` with an RFC-7807 body containing `errorCode` and `correlationId` | P1 |
| TREE-064 | Missing parent is rejected | API | — | POST with `parentPath: "content.no-such-site"` | `404 Not Found` | P1 |
| TREE-065 | Name is sanitized | API | — | POST with `"name":"QA Bad Name!@#"` | The created path uses a sanitized name (lowercase, only `a-z0-9_-`). Record the resulting path. | P2 |
| TREE-066 | Missing required field | API | — | POST omitting `name` | `400` or `422` with a `fieldErrors` array naming the missing field. **Not a 500.** | P1 |
| TREE-067 | Update page properties | API | TREE-060 | PUT `/api/author/content/node/properties` with `{"path":"content.tut-usa.qa-smoke-page","properties":{"jcr:title":"QA Renamed"},"userId":"qa-tester"}` | `200`; GET shows the new title; **other existing properties are preserved** (it is a partial merge, not a replace) | P0 |
| TREE-068 | Property update is visible in the UI | UI | TREE-067 | Reload `/content` → `tut-usa` | The row's Name reflects the new title; Last Modified is updated | P1 |
| TREE-069 | HTML in a property is sanitized | API | TREE-060 | PUT properties with `{"body":"<script>alert(1)</script><p>ok</p>"}` | The stored value has the `<script>` removed/neutralized; the safe `<p>` survives. **If the raw `<script>` is stored verbatim, that is a Critical security finding.** | P0 |
| TREE-070 | No-op update creates no version | API | TREE-067 | Note the version count via GET `/api/author/content/node/versions?nodeId=<id>`. PUT the **identical** properties again. Re-check the count. | The version count does not increase for an unchanged update | P2 |
| TREE-071 | Move a page | API | TREE-060 | POST `/api/author/content/node/move` with `{"sourcePath":"content.tut-usa.qa-smoke-page","targetParentPath":"content.tut-usa.vehicles","userId":"qa-tester"}` | `200`; the node now resolves at `content.tut-usa.vehicles.qa-smoke-page`; the old path returns `404` | P0 |
| TREE-072 | Move rewrites descendants | API | Create `qa-parent` with a child `qa-child`, then move `qa-parent` | GET the child at its **new** path | The child moved with its parent; its `parentPath` is correct; **no node is left behind at the old path** | P0 |
| TREE-073 | Moved page shows in the new folder | UI | TREE-071 | In the UI, drill into `tut-usa` → `vehicles` | `qa-smoke-page` appears there and is gone from `tut-usa` | P1 |
| TREE-074 | Reorder siblings | API | — | GET `/api/author/content/children?path=content.tut-usa` and note the order. POST `/api/author/content/node/reorder` with `{"parentPath":"content.tut-usa","orderedPaths":[<all children, reordered>],"userId":"qa-tester"}` | `200`; a subsequent children call returns the new order | P1 |
| TREE-075 | Reorder with a missing path is rejected | API | — | POST reorder with one child **omitted** from `orderedPaths` | `422` naming the `missing` set. The order is unchanged. | P1 |
| TREE-076 | Reorder with an unknown path is rejected | API | — | POST reorder including a path that is not a child of that parent | `422` naming the `unknown` set | P1 |
| TREE-077 | Reorder with a duplicate path is rejected | API | — | POST reorder with the same path listed twice | `422` | P2 |
| TREE-078 | Delete a page | API | TREE-060 | DELETE `/api/author/content/node?path=content.tut-usa.vehicles.qa-smoke-page&userId=qa-tester` | `200`; a subsequent GET returns `404` | P0 |
| TREE-079 | Delete a non-existent page | API | — | DELETE with a path that does not exist | `404` — **not** a silent success | P1 |
| TREE-080 | Delete cascades to descendants | API | TREE-072 | Delete `qa-parent` | Both `qa-parent` and `qa-child` are gone (`404` for each) | P0 |
| TREE-081 | Deleted page disappears from the UI | UI | TREE-078 | Reload `/content` → `tut-usa` | The deleted page is no longer listed | P1 |
| TREE-082 | Path accepts URL form | API | — | GET `/api/author/content/node?path=/tut-usa/home` | `200`; the same node as `content.tut-usa.home`. Both path forms are accepted. | P2 |
| TREE-083 | List pagination | API | — | GET `/api/author/content/list?page=0&size=5`, then `page=1&size=5` | Distinct pages; `totalElements` is consistent; no duplicated or skipped nodes across pages | P2 |
| TREE-084 | Page size is capped | API | — | GET `/api/author/content/list?page=0&size=5000` | The response is capped at 200 items rather than returning everything or erroring | P2 |
| TREE-085 | Children counts endpoint | API | — | GET `/api/author/content/children/counts?path=content.tut-usa` | Returns a per-child structural count consistent with the tree | P2 |

### 7.5 Bulk operations (API only)

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| TREE-090 | Bulk publish | API | Create `qa-b1`, `qa-b2` | POST `/api/author/content/bulk/publish` with `{"paths":["content.tut-usa.qa-b1","content.tut-usa.qa-b2"],"userId":"qa-tester"}` | `200`; `succeededCount: 2`; both nodes are `PUBLISHED` | P1 |
| TREE-091 | Bulk publish with one bad path | API | TREE-090 | POST bulk publish with one valid path and one non-existent path | `200`; `succeededCount: 1`; `errors` names the bad path. **The good path still succeeded** — one bad entry must not abort the batch. | P1 |
| TREE-092 | Bulk move | API | Create `qa-b3`, `qa-b4` | POST `/api/author/content/bulk/move` with both paths and `targetParentPath: "content.tut-usa.vehicles"` | `200`; both nodes now live under `vehicles` | P1 |
| TREE-093 | Bulk delete | API | TREE-092 | DELETE `/api/author/content/bulk` with the two moved paths | `200`; `succeededCount: 2`; both return `404` afterwards | P1 |
| TREE-094 | Bulk with an empty list | API | — | POST bulk publish with `"paths": []` | A clean `200` with `succeededCount: 0`, or a `400`/`422`. **Not a 500.** | P2 |

---

## 8. Visual Page Editor (`/editor?path=...`)

The most complex authoring surface. Budget the most time here.

Open it with **Edit** from a Content Tree row action (TREE-043), or directly via
`http://localhost:3000/editor?path=content.tut-usa.home`.

> **Baseline reminder:** all nine seeded pages start with **zero components**. An empty canvas on
> first open is correct.

### 8.1 Loading and layout

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-001 | Editor loads | UI | — | Open `/editor?path=content.tut-usa.home` | Three regions render: left panel (Components/Layers/Assets), centre canvas, right properties panel. Top bar and footer present. | P0 |
| EDIT-002 | Correct page is loaded | UI | EDIT-001 | Read the top-bar centre area | Breadcrumb shows "Content › home"; the content path `content.tut-usa.home` is displayed | P0 |
| EDIT-003 | Template badge | UI | EDIT-001 | Look for a template name badge in the top bar | Shows `global-home-page` for the `home` page (per §3.5) | P1 |
| EDIT-004 | Empty canvas state | UI | EDIT-001 | Inspect the canvas | Shows "Select a component from the left panel to start building" — a clear empty state, not a blank void | P1 |
| EDIT-005 | Locked nav/footer bands | UI | EDIT-001 | Inspect the top and bottom of the canvas | Read-only "Experience Fragment — Navigation" and "— Footer" bands appear, each with an "Edit in Experience Fragments →" link | P1 |
| EDIT-006 | Nav/footer link works | UI | EDIT-005 | Click **Edit in Experience Fragments →** on the navigation band | Navigates to the editor for the shared navigation fragment | P1 |
| EDIT-007 | Footer status bar | UI | EDIT-001 | Inspect the footer | Shows a save indicator ("Not saved" initially), "Draft Mode", and a registered-component count | P2 |
| EDIT-008 | Invalid path handling | UI | — | Open `/editor?path=content.tut-usa.no-such-page` | A clear "not found" message. **Not a blank screen, infinite spinner, or raw stack trace.** | P1 |
| EDIT-009 | Missing path parameter | UI | — | Open `/editor` with no `?path=` | A clear error or a prompt to choose a page. Not a crash. | P2 |
| EDIT-010 | Editor renders standalone | UI | EDIT-001 | Inspect the page chrome | The editor has its own top bar — the admin sidebar is intentionally **not** shown | P3 |

### 8.2 Component palette — adding components

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-020 | Palette lists components | UI | EDIT-001 | Open the **Components** tab in the left panel | Components are listed, grouped by registry group (e.g. "Editorial & Article Content", "Layout & Page Structure") | P0 |
| EDIT-021 | Template restricts the palette | UI | EDIT-001 | Read the "Template Rules" notice, then compare the palette against the full 420-component registry | Because `home` uses `global-home-page`, the palette is **restricted** to that template's allowed components — it should not offer all 420. The notice explains this. | P1 |
| EDIT-022 | Palette on a `default-page` | UI | Create `qa-default` with `template: default-page` (TREE-060) | Open its editor and inspect the palette | The palette content is appropriate for `default-page`. Compare against EDIT-021 and note the difference. | P2 |
| EDIT-023 | **Click** to add a component | UI | EDIT-001 | Click any palette item | The component is appended to the canvas and renders. A selection chip appears above it. | P0 |
| EDIT-024 | **Drag** to add a component | UI | EDIT-001 | Drag a palette item onto the canvas | An insert-preview placeholder shows the drop slot during the drag; on release the component lands at that position | P0 |
| EDIT-025 | Drop at a specific position | UI | Canvas has 3 components | Drag a new palette item and drop it **between** components 1 and 2 | The new component is inserted at that exact position, not appended to the end | P0 |
| EDIT-026 | Add several components | UI | EDIT-001 | Add five different components | All five render in the order added; each is independently selectable | P0 |
| EDIT-027 | Drag overlay ghost | UI | EDIT-001 | Start dragging a palette item and hold | A floating ghost preview follows the cursor | P3 |
| EDIT-028 | Cancel a drag | UI | EDIT-001 | Start dragging a palette item, then press Escape or drop outside the canvas | No component is added; the canvas is unchanged | P2 |
| EDIT-029 | Empty palette state | UI | — | Find a page whose template allows no optional components (if any) | A clear message distinguishes "this template has no optional components" from "no components are registered" | P3 |
| EDIT-030 | Component renders real output | UI | EDIT-023 | Inspect an added component on the canvas | It renders actual visual output via the real renderer — not a grey placeholder box (unless it is a metadata-only component, see EDIT-032) | P0 |
| EDIT-031 | Render error is contained | UI | EDIT-001 | Add components across several different groups, looking for any that fail to render | A failing component shows a friendly "could not be previewed" box. **The whole canvas must not go blank or crash.** Report the component's `resourceType`. | P1 |
| EDIT-032 | Zero-output component | UI | EDIT-001 | Add a metadata-only component (one with no visual output) | A clickable placeholder strip appears so the component is still selectable — it does not silently vanish | P1 |

### 8.3 Selecting and manipulating components

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-040 | Select by clicking the canvas | UI | Canvas has 3 components | Click the middle component | It becomes selected; a selection chip appears above it; the right panel shows its properties | P0 |
| EDIT-041 | Change selection | UI | EDIT-040 | Click a different component | Selection moves; the right panel updates to the newly selected component | P0 |
| EDIT-042 | Selection chip controls | UI | EDIT-040 | Inspect the selection chip | Shows a drag handle, the component label, and Move Up / Move Down / Duplicate / Delete icon buttons | P1 |
| EDIT-043 | Move Up | UI | Canvas has 3 components; select #2 | Click **Move Up** | The component swaps with #1; the canvas order updates immediately | P0 |
| EDIT-044 | Move Down | UI | Canvas has 3 components; select #2 | Click **Move Down** | The component swaps with #3 | P0 |
| EDIT-045 | Move Up on the first component | UI | Select component #1 | Click **Move Up** | Either the control is disabled, or nothing changes. **No error, no reordering glitch, no component loss.** | P1 |
| EDIT-046 | Move Down on the last component | UI | Select the last component | Click **Move Down** | Either disabled or no change. No error. | P1 |
| EDIT-047 | Duplicate | UI | EDIT-040 | Click **Duplicate** | A copy is inserted with the same property values; both instances render; they are independently selectable | P0 |
| EDIT-048 | Duplicate is independent | UI | EDIT-047 | Select the copy and change one of its properties | Only the copy changes — the original keeps its old value | P0 |
| EDIT-049 | Delete a component | UI | Canvas has 3 components | Select #2 and click **Delete** | It is removed; the remaining two close the gap; the right panel clears or moves to another selection | P0 |
| EDIT-050 | Delete every component | UI | Canvas has components | Delete them all one by one | The canvas returns to the empty state (EDIT-004) without error | P1 |
| EDIT-051 | Drag to reorder on the canvas | UI | Canvas has 4 components | Drag component #4 by its handle and drop it between #1 and #2 | It moves to that position; the other components shift accordingly | P0 |
| EDIT-052 | Reorder to the first position | UI | Canvas has 3 components | Drag the last component above the first | It becomes the first component | P1 |
| EDIT-053 | Drag-drop onto a locked band | UI | EDIT-005 | Try to drag a canvas component into the locked Navigation or Footer band | The drop is refused. The component returns to its original position and **nothing is lost or duplicated.** Record the exact behaviour — this is a known edge-case risk. | P1 |
| EDIT-054 | Rapid consecutive operations | UI | Canvas has 5 components | Quickly duplicate, delete, and reorder several times in a row | The canvas stays consistent with the operations. No duplicate keys, no vanished components, no console errors. | P1 |

### 8.4 Layers tab

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-060 | Layers list matches the canvas | UI | Canvas has 4 components | Open the **Layers** tab | All four are listed in the same order as on the canvas | P1 |
| EDIT-061 | Select from Layers | UI | EDIT-060 | Click a component in the Layers list | It becomes selected on the canvas; the canvas scrolls it into view if needed; the right panel updates | P1 |
| EDIT-062 | Layers reflect a reorder | UI | EDIT-051 | Reorder on the canvas, then open Layers | The Layers order matches the new canvas order | P1 |
| EDIT-063 | Layers reflect a delete | UI | EDIT-049 | Delete a component, then open Layers | The deleted component is no longer listed | P1 |
| EDIT-064 | Locked badge in Layers | UI | A page with template-locked components | Open **Layers** | Template-embedded components show a "Locked" badge | P1 |
| EDIT-065 | Layers empty state | UI | Empty canvas | Open **Layers** | A clear empty state, not a blank panel | P2 |

### 8.5 Properties panel — schema-driven forms

The right panel is generated from each component's registered JSON Schema, so field types vary by
component. Work through several different components to cover all field types below.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-070 | Panel empty state | UI | EDIT-001 | Deselect everything (click empty canvas space) | Shows "Click a component on the canvas to edit its properties" | P2 |
| EDIT-071 | Panel header | UI | EDIT-040 | Select a component | The panel shows the component's label and `resourceType` | P2 |
| EDIT-072 | **Text** field | UI | Select a component with a string property | Type a value into a text input | The value is accepted; the canvas preview updates to reflect it | P0 |
| EDIT-073 | **Textarea** field | UI | Select a component with a long-text property | Enter multi-line text | Newlines are preserved; the canvas updates | P1 |
| EDIT-074 | **Number** field — valid | UI | Select a component with a numeric property (e.g. Menu Card `price`) | Enter `1250.50` | The value is accepted as a number; the canvas updates | P0 |
| EDIT-075 | **Number** field — partial input | UI | EDIT-074 | Clear the field completely, then type `-`, then `-5`, then `.` | Intermediate/partial input does not corrupt the stored value or throw. The final valid value is kept. | P1 |
| EDIT-076 | **Number** field — text input | UI | EDIT-074 | Type `abc` into a number field | Rejected or ignored. **Not stored as a string and not a crash.** | P1 |
| EDIT-077 | **Toggle** field | UI | Select a component with a boolean property | Toggle it on, then off | State flips each time and the canvas reflects it | P1 |
| EDIT-078 | **Select** field | UI | Select a component with an enum property | Open the dropdown and choose each option | Only schema-declared options are offered; the selection applies | P1 |
| EDIT-079 | **List** field — add | UI | Select a component with an array property (e.g. Currency Selector `currencies`) | Click add and enter two values | Both items are added and render | P1 |
| EDIT-080 | **List** field — remove | UI | EDIT-079 | Click the `✕` on the first item | Only that item is removed; the other is untouched | P1 |
| EDIT-081 | **List** field — reorder | UI | EDIT-079 (3+ items) | Use the `↑`/`↓` controls on the second item | The item moves; the others shift correctly | P1 |
| EDIT-082 | **List** of objects | UI | Select a component whose array items are objects | Add an item and fill its sub-fields | Each item renders a nested sub-form; values save per item | P1 |
| EDIT-083 | **Object** field — nested form | UI | Select a component with an object property (e.g. Case Study Teaser `cta` with `url`) | Expand and fill the nested sub-fields | Sub-fields render as labelled inputs; values apply | P1 |
| EDIT-084 | **Object** field — JSON fallback | UI | Find a component whose object shape is not declared in its schema | Inspect the field | A JSON textarea editor is offered instead of sub-fields | P2 |
| EDIT-085 | JSON editor rejects bad JSON | UI | EDIT-084 | Enter `{"broken": ` (invalid JSON) | An inline parse-error message appears. **The bad value is not saved and the editor does not crash.** | P1 |
| EDIT-086 | JSON editor accepts valid JSON | UI | EDIT-085 | Correct it to `{"ok": true}` | The error clears and the value is accepted | P1 |
| EDIT-087 | Asset-reference field | UI | Select a component with an image property (e.g. Menu Card `image`, schema `x-asset: true`) | Inspect the field | Record how an asset is chosen. **Note:** the editor's Assets tab is only a link to `/dam` (§20) — if the field is a plain text path input, record that as the actual behaviour. | P1 |
| EDIT-088 | Very long text value | UI | EDIT-072 | Paste 5,000 characters into a text field | Accepted without freezing the editor; layout does not break | P2 |
| EDIT-089 | Special characters | UI | EDIT-072 | Enter `<>&"'` and emoji `🚗` and accented text `Grüße` | All are preserved exactly; nothing is mangled after a save/reload | P1 |
| EDIT-090 | HTML in a rich-text field | UI+API | EDIT-072 | Enter `<script>alert(1)</script><b>bold</b>`, save, then GET the node via API | The `<script>` is sanitized away; `<b>` may survive. **A stored raw `<script>` is a Critical security finding.** | P0 |
| EDIT-091 | **Reset to Defaults** | UI | EDIT-072 (several fields changed) | Click **Reset to Defaults** | All of that component's properties return to the palette defaults; the canvas updates | P1 |
| EDIT-092 | Reset affects only the selection | UI | Two components, both edited | Select one and click **Reset to Defaults** | Only the selected component resets; the other keeps its values | P1 |
| EDIT-093 | Property edit updates the canvas live | UI | EDIT-072 | Type into a visible text property and watch the canvas | The canvas preview updates as you type or on blur — no manual refresh needed | P0 |

### 8.6 Undo / Redo

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-100 | Undo an add | UI | EDIT-023 | Add a component, then click **Undo** | The component is removed | P0 |
| EDIT-101 | Redo an add | UI | EDIT-100 | Click **Redo** | The component returns with the same properties | P0 |
| EDIT-102 | Undo a delete | UI | EDIT-049 | Delete a component, then **Undo** | The component returns **with its property values intact** | P0 |
| EDIT-103 | Undo a duplicate | UI | EDIT-047 | Duplicate, then **Undo** | The copy is removed; the original remains | P1 |
| EDIT-104 | Undo a reorder | UI | EDIT-051 | Reorder, then **Undo** | The previous order is restored | P1 |
| EDIT-105 | Undo a property edit | UI | EDIT-072 | Change a text property, then **Undo** | The previous value returns | P0 |
| EDIT-106 | Multi-step undo | UI | EDIT-001 | Perform 6 different operations, then click **Undo** 6 times | Each undo reverses exactly one step, in reverse order, back to the starting state | P0 |
| EDIT-107 | Multi-step redo | UI | EDIT-106 | Click **Redo** 6 times | All six operations are reapplied in order, reaching the same state as before the undos | P1 |
| EDIT-108 | Undo at the start of history | UI | Freshly opened editor | Click **Undo** repeatedly | Either the button is disabled, or nothing happens. **No error and no corrupted canvas.** | P1 |
| EDIT-109 | Redo with nothing to redo | UI | EDIT-001 | Click **Redo** without any prior undo | Disabled or no-op. No error. | P1 |
| EDIT-110 | New action clears the redo stack | UI | EDIT-100 | Undo once, then perform a **new** action, then click **Redo** | Redo does not resurrect the discarded branch. Behaviour is consistent, not corrupting. | P2 |
| EDIT-111 | History depth | UI | EDIT-001 | Perform ~55 operations, then undo repeatedly | History holds up to 50 steps. Beyond that, the oldest are dropped **gracefully** — no crash. | P3 |

### 8.7 Saving

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-120 | Save added components | UI+API | Add 3 components | Click **Save**. Then GET `/api/author/content/page?path=content.tut-usa.home` | Button shows "Saving…", then a "Last saved HH:MM" timestamp in the footer. The API shows all three components as child nodes in the correct order. | P0 |
| EDIT-121 | Save persists across reload | UI | EDIT-120 | Press F5 to reload the editor | All three components are still present, in the same order, with the same property values | P0 |
| EDIT-122 | Save property edits | UI+API | EDIT-072 | Edit properties on an existing component, then **Save**; GET the node | The new property values are persisted | P0 |
| EDIT-123 | Save a deletion | UI+API | Save 3 components, delete one, Save again | GET the page tree | Only two component nodes remain; the deleted one is gone from the database | P0 |
| EDIT-124 | Save persists order | UI+API | Save 3 components, reorder them, Save again | GET `/api/author/content/children?path=content.tut-usa.home` | The children come back in the new order (order is persisted, not just visual) | P0 |
| EDIT-125 | Save with no changes | UI | EDIT-121 | Click **Save** without changing anything | Completes cleanly. No error, no duplicated components. | P1 |
| EDIT-126 | Save a mixed change set | UI+API | Saved page with 3 components | In one session: add one, delete one, edit one's properties, reorder — then **Save** once | All four kinds of change are persisted correctly together | P0 |
| EDIT-127 | Save indicator before saving | UI | Make any change | Inspect the footer before clicking Save | Indicates unsaved state ("Not saved" / a dirty dot) | P1 |
| EDIT-128 | Save failure is surfaced | UI | Stop the Author service | Make a change and click **Save** | A visible error tells you the save failed. **It must not falsely report success.** Restart Author afterwards. | P0 |
| EDIT-129 | Navigate away with unsaved changes | UI | Make a change without saving | Click the logo / navigate away | Either a warning prompt appears, or the change is lost silently. **Record which.** Silent loss of work is at least a Major finding. | P1 |
| EDIT-130 | Two tabs editing the same page | UI | — | Open the same page in two editor tabs. Add a component in tab A and Save. Add a different component in tab B and Save. | Record the outcome precisely. Last-write-wins that silently discards tab A's component is a Major finding — note whether any conflict is detected. | P1 |

### 8.8 Template inheritance and "Cancel Inheritance"

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-140 | Locked components are marked | UI | Open a page whose template embeds components | Inspect the canvas | Template-locked components show a lock icon instead of a drag handle | P1 |
| EDIT-141 | Locked components cannot be edited | UI | EDIT-140 | Select a locked component | The right panel shows the lock reason and offers **Cancel Inheritance and Edit**. Property fields are not directly editable. | P1 |
| EDIT-142 | Locked components cannot be dragged | UI | EDIT-140 | Try to drag a locked component | The drag is refused; the component does not move | P1 |
| EDIT-143 | Cancel inheritance for one component | UI | EDIT-141 | Click **Cancel Inheritance and Edit** | The component detaches from the template and becomes editable; its properties can now be changed | P1 |
| EDIT-144 | Detached component saves | UI+API | EDIT-143 | Change a property and **Save**; GET the node | The new value persists; the component is no longer template-locked | P1 |
| EDIT-145 | **Cancel All Inheritance** | UI | A page with 2+ locked components | Click **Cancel All Inheritance** in the top bar | Every locked component detaches. A summary message reports how many succeeded/failed. | P1 |
| EDIT-146 | Cancel All is disabled when not applicable | UI | A page with no locked components | Inspect the **Cancel All Inheritance** button | Disabled | P2 |
| EDIT-147 | Cancel All during a busy state | UI | EDIT-145 | Click **Cancel All Inheritance** and immediately click it again | The button disables while the operation runs; no duplicate requests are fired | P2 |

### 8.9 Editor top bar and viewport

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-160 | Desktop viewport | UI | EDIT-001 | Click the **Desktop** toggle | The canvas renders at full width | P1 |
| EDIT-161 | Tablet viewport | UI | EDIT-001 | Click the **Tablet** toggle | The canvas narrows to a tablet width; components reflow | P1 |
| EDIT-162 | Mobile viewport | UI | EDIT-001 | Click the **Mobile** toggle | The canvas narrows to a mobile width; components reflow | P1 |
| EDIT-163 | Viewport does not alter data | UI+API | EDIT-162 | Switch viewports, then **Save**; GET the node | Viewport is a preview-only setting. No property changes are persisted by switching it. | P1 |
| EDIT-164 | Preview button | UI | EDIT-001 | Click the **Preview** icon | Opens `/preview?path=...&mode=draft` in a new tab showing the same page | P0 |
| EDIT-165 | Preview shows unsaved state | UI | Make a change without saving | Click **Preview** | Record whether the preview shows the saved or unsaved version. Either is defensible — but it must not error. | P2 |
| EDIT-166 | Logo returns to Content Tree | UI | EDIT-001 | Click the editor logo | Navigates to `/content` | P2 |
| EDIT-167 | Settings gear is inert | UI | EDIT-001 | Click the gear icon | **Known gap (§20).** Nothing happens. | P3 |
| EDIT-168 | Publish from the editor | UI+API | Editor open on `qa-smoke-page` | Click **Publish**; then GET `/api/author/content/node?path=content.tut-usa.qa-smoke-page` | `status` becomes `PUBLISHED`. Use a `qa-` page for this — do not publish seeded pages arbitrarily. | P0 |
| EDIT-169 | Publish feedback in the UI | UI | EDIT-168 | Watch the UI during publish | Some visible confirmation appears; the footer/status reflects `PUBLISHED` rather than staying on "Draft Mode" | P1 |
| EDIT-170 | Publish failure is surfaced | UI | Stop the Author service | Click **Publish** | A visible error. **Must not falsely report success.** Restart Author afterwards. | P1 |

### 8.10 Editor Assets tab

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| EDIT-180 | Assets tab content | UI | EDIT-001 | Open the **Assets** tab in the left panel | **Known gap (§20).** It is only a static link to `/dam` — there is no in-editor asset browser or picker. Confirm this. | P1 |
| EDIT-181 | Assets tab link works | UI | EDIT-180 | Click the "Open the DAM browser" link | Navigates to `/dam` | P2 |
| EDIT-182 | Setting an image without a picker | UI | An asset exists in DAM (§13) | Add a component with an image property. Copy the asset path/URL from `/dam` and paste it into the field. Save. | The image reference is accepted and the component renders it. **Record how cumbersome this is** — the absence of a picker is a usability finding worth documenting once. | P1 |
---

## 9. Content Preview (`/preview?path=...`)

A sandboxed iframe preview with responsive-viewport simulation.

> **Requires the reference site on port 3001** (ENV-009) for Draft mode, and the Publish service
> on 8081 (ENV-002) for Live mode.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PRV-001 | Preview loads | UI | — | Open `/preview?path=content.tut-usa.home` | Breadcrumb, mode toggle, viewport toggle, read-only URL bar, and the iframe all render | P0 |
| PRV-002 | Loading spinner clears | UI | PRV-001 | Watch the iframe on load | A spinner overlay shows, then clears once the iframe loads. **It must not spin forever.** | P0 |
| PRV-003 | Page content renders | UI | A page with saved components (EDIT-120) | Preview that page | The saved components render in the iframe in the correct order | P0 |
| PRV-004 | Draft mode | UI | PRV-001 | Click the **Draft** toggle | The iframe reloads against the site-render service; the URL bar reflects the draft URL | P0 |
| PRV-005 | Live mode | UI | A **published** page (EDIT-168) | Click the **Live** toggle | The iframe reloads against the Publish service (8081); the URL bar reflects the publish URL | P0 |
| PRV-006 | Draft vs Live differ | UI | Publish a page, then edit and save a change **without** republishing | Toggle Draft ↔ Live | Draft shows the new change; Live shows the previously published version. This proves author/publish separation. | P0 |
| PRV-007 | Live mode on an unpublished page | UI | A `DRAFT` page never published | Switch to **Live** | A not-found or empty result from Publish — handled gracefully, not a crash or an infinite spinner | P1 |
| PRV-008 | Desktop viewport | UI | PRV-001 | Click **Desktop** | The iframe renders at full width | P1 |
| PRV-009 | Tablet viewport (768px) | UI | PRV-001 | Click **Tablet** | The frame narrows to 768px with device chrome and a device-label badge | P1 |
| PRV-010 | Mobile viewport (390px) | UI | PRV-001 | Click **Mobile** | The frame narrows to 390px with device chrome and a label | P1 |
| PRV-011 | Content reflows per viewport | UI | PRV-003 | Cycle Desktop → Tablet → Mobile | The rendered content genuinely reflows at each width (responsive), not just a clipped desktop layout | P1 |
| PRV-012 | Refresh button | UI | PRV-001 | Edit and save the page in another tab, then click **Refresh** here | The iframe reloads and shows the updated content | P1 |
| PRV-013 | Copy URL | UI | PRV-001 | Click **Copy URL** | A checkmark confirms for ~2s; the clipboard holds the preview URL (paste to verify) | P2 |
| PRV-014 | Open in new tab | UI | PRV-001 | Click **Open in new tab** | A new tab opens at the same preview URL | P2 |
| PRV-015 | Edit button | UI | PRV-001 | Click **Edit** | Navigates to `/editor?path=content.tut-usa.home` | P0 |
| PRV-016 | URL bar is read-only | UI | PRV-001 | Try to type in the URL bar | It is read-only (lock icon shown) | P3 |
| PRV-017 | Status bar | UI | PRV-001 | Inspect the footer | Shows loading/ready state, the current path, the viewport label, and the Draft/Live indicator | P2 |
| PRV-018 | Breadcrumb derives from path | UI | PRV-001 | Inspect the breadcrumb | It reflects the previewed page's path segments | P2 |
| PRV-019 | Invalid path | UI | — | Open `/preview?path=content.tut-usa.no-such-page` | Handled gracefully — an empty or not-found frame, not a crash | P1 |
| PRV-020 | Missing path parameter | UI | — | Open `/preview` with no `?path=` | A clear prompt or empty state. Not a crash. | P2 |
| PRV-021 | Reference site down | UI | Stop the site on 3001 | Open `/preview` in Draft mode | A visible failure state. Not an endless spinner. Restart the site afterwards. | P1 |

---

## 10. Workflows (`/workflows`) — Workflow Inbox

The approval workflow for content review.

> **Baseline:** there are **0 active workflow instances** (§3.5), so the inbox starts empty. You
> must start workflows via the API to have anything to review — the UI has no "start workflow"
> control.

**The seeded `standard-publish` state machine:**

```
draft --submit--> review --approve--> approved --publish--> published
review   --reject--> draft
approved --reject--> draft   (button label: "Send Back")
published --unpublish--> draft
```

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| WF-001 | Empty inbox state | UI | — | Open `/workflows` | The **Pending** tab shows "No pending workflows" — a clear empty state, not a blank panel | P1 |
| WF-002 | Start a workflow | API | Create `qa-wf-page` (TREE-060) | POST `/api/author/workflow/start` with `{"workflowName":"standard-publish","contentPath":"content.tut-usa.qa-wf-page","userId":"qa-tester"}` | `200`; an instance is created; the node's status becomes `DRAFT`. **Record the returned `instanceId`.** | P0 |
| WF-003 | Started workflow appears in the inbox | UI | WF-002 | Open `/workflows`; reload if needed | A task card for `qa-wf-page` appears under **Pending** with the tab count incremented | P0 |
| WF-004 | Task card content | UI | WF-003 | Inspect the card | Shows an icon, title, description, age, priority badge, and assignee avatars | P1 |
| WF-005 | Select a task | UI | WF-003 | Click the task card | The right-hand detail panel opens for that task | P0 |
| WF-006 | Detail panel content | UI | WF-005 | Inspect the panel | Shows Workflow ID, title, full description, Initiator, and Due Date | P1 |
| WF-007 | Workflow Timeline | UI | WF-005 | Inspect the timeline | A vertical stepper shows the workflow steps with completed/current states marked | P1 |
| WF-008 | Advance: submit | API | WF-002 | POST `/api/author/workflow/advance` with `{"instanceId":"<id>","action":"submit","userId":"qa-tester"}` | `200`; the instance moves to the `review` step; the node's status becomes `IN_REVIEW` | P0 |
| WF-009 | Node status follows the workflow | API | WF-008 | GET `/api/author/content/node?path=content.tut-usa.qa-wf-page` | `status` is `IN_REVIEW` — the workflow step drives the content status | P0 |
| WF-010 | **Approve** from the UI | UI+API | WF-008 (instance at `review`) | On `/workflows`, select the task, type a comment in the footer textarea, click **Approve Workflow** | The task is re-classified out of Pending and the panel closes. Verify via API that the step advanced to `approved` and the node status is `APPROVED`. | P0 |
| WF-011 | **Reject** from the UI | UI+API | A fresh instance at `review` | Select the task, add a comment, click **Reject Task** | The task leaves Pending. Via API, the step returns to `draft` and the node status is `DRAFT`. | P0 |
| WF-012 | Approve/Reject without a comment | UI | An instance at `review` | Click **Approve Workflow** leaving the comment blank | The comment is optional — the action succeeds | P1 |
| WF-013 | **Approve failure is silent** | UI | — | Stop the Author service. Select a task and click **Approve Workflow**. | **Suspected defect:** the UI optimistically re-classifies the task and closes the panel even when the API call fails, so a failed approval looks successful. Confirm this, then reload the page — if the task is back in Pending, the earlier "success" was false. **Report as a finding if confirmed.** Restart Author afterwards. | P0 |
| WF-014 | Advance to published | API | WF-010 (at `approved`) | POST advance with `"action":"publish"` | `200`; the step becomes `published`; the node status becomes `PUBLISHED`; replication is triggered (see §17) | P0 |
| WF-015 | Unpublish transition | API | WF-014 | POST advance with `"action":"unpublish"` | `200`; the step returns to `draft`; the node status becomes `DRAFT` | P1 |
| WF-016 | Invalid action is rejected | API | WF-002 (at `draft`) | POST advance with `"action":"approve"` — not legal from `draft` | The transition is refused with a client error. **Note:** `WorkflowEngine` was not part of the 2026-09-14 fix pass — it still throws a bare `IllegalArgumentException`, so this likely still surfaces as `500`. Record the actual status. | P1 |
| WF-017 | Duplicate workflow start is rejected | API | WF-002 | POST start again for the **same** `contentPath` | Refused because an ACTIVE instance already exists. **Note:** currently surfaces as `500` rather than `409`. Record the actual status. | P1 |
| WF-018 | Cancel a workflow | API | WF-002 | POST `/api/author/workflow/cancel?instanceId=<id>&userId=qa-tester&reason=qa-test` | `200`; the instance status becomes `CANCELLED` | P1 |
| WF-019 | Cancelled workflow leaves the inbox | UI | WF-018 | Reload `/workflows` | The cancelled task no longer appears under Pending | P1 |
| WF-020 | List by status | API | WF-002, WF-018 | GET `/api/author/workflow/list?status=ACTIVE` and `?status=CANCELLED` | Each returns only instances in that status | P1 |
| WF-021 | Active workflow for a path | API | WF-002 | GET `/api/author/workflow/active?contentPath=content.tut-usa.qa-wf-page` | `200` with the instance. For a path with no workflow: `404`. | P1 |
| WF-022 | **`for-user` ignores the user** | API | WF-002 | GET `/api/author/workflow/for-user?userId=nobody-at-all` | **Known gap (§20).** Returns all ACTIVE instances regardless of the `userId`, so the "inbox" is not actually per-user. Confirm. | P1 |
| WF-023 | Workflow never auto-completes | API | WF-014 | GET the instance after reaching `published` | **Known gap (§20).** The seeded workflow has no `end` step, so the instance stays `ACTIVE` forever rather than becoming `COMPLETED`. Confirm. | P2 |
| WF-024 | **Pending** tab filter | UI | Several instances in different states | Click the **Pending** tab | Only pending tasks are listed; the count matches | P1 |
| WF-025 | **Approved** tab filter | UI | WF-010 | Click the **Approved** tab | The approved task appears here | P1 |
| WF-026 | **Rejected** tab filter | UI | WF-011 | Click the **Rejected** tab | The rejected task appears here | P1 |
| WF-027 | Tab switch clears selection | UI | WF-005 | With a task selected, switch tabs | The detail panel closes / selection clears — a stale panel from the other tab must not persist | P2 |
| WF-028 | Sort by Priority | UI | 3+ tasks with different priorities | Choose **Priority** in the sort dropdown | The list reorders by priority | P2 |
| WF-029 | Sort by Newest / Deadline | UI | 3+ tasks | Choose **Newest First**, then **Deadline** | **Known gap (§20).** Both are no-ops — the original order is kept. Confirm neither reorders the list. | P2 |
| WF-030 | Non-pending task shows no actions | UI | WF-025 | Select an approved task | A static status readout is shown instead of Approve/Reject buttons | P2 |
| WF-031 | Overdue due-date styling | UI | A task past its due date | Inspect the Due Date in the detail panel | Overdue styling is applied | P3 |
| WF-032 | Header Filters / Export are inert | UI | — | Click **Filters** and **Export** | **Known gap (§20).** Both inert. | P3 |
| WF-033 | Loading skeletons | UI | — | Hard-reload `/workflows` | Skeleton cards show, then real content | P2 |
| WF-034 | Direct status change bypasses the workflow | API | Create `qa-bypass` | POST `/api/author/content/node/status?path=content.tut-usa.qa-bypass&status=PUBLISHED&userId=qa-tester` — with **no** workflow started | `200`; the node jumps straight to `PUBLISHED`. **This is by design** — the direct endpoint performs no state-machine validation. Confirm it works and note that it bypasses approval entirely. | P1 |
| WF-035 | Direct status: any transition allowed | API | WF-034 | POST status with `ARCHIVED`, then straight back to `PUBLISHED`, then `DRAFT` | Every transition is accepted with no validation. Confirm — this is the documented behaviour of the direct endpoint. | P2 |
| WF-036 | Invalid status value | API | — | POST status with `status=NOT_A_STATUS` | `400` with a clear validation message. **Not a 500.** | P1 |
| WF-037 | Status `LIVE` is not valid | API | — | POST status with `status=LIVE` | `400` — `LIVE` is not a member of the enum (§2) | P2 |

---

## 11. Component Registry (`/components`)

A read-mostly catalogue of the 420 registered components.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| COMP-001 | Registry loads | UI | — | Open `/components` | Breadcrumb, stats row, toolbar, and the component table all render | P0 |
| COMP-002 | Stats row | UI | COMP-001 | Read Total Components / Active / Containers / Deprecated | **Total Components is 420** (matching §3.5). **Known gap (§20):** every component is reported `active`, so Deprecated and Draft always read `0`. | P1 |
| COMP-003 | Table columns | UI | COMP-001 | Inspect the header | Columns: Component (icon + title + resourceType), Group, Status, Type (Container/Leaf), Uses, Last Modified, actions | P1 |
| COMP-004 | Search by title | UI | COMP-001 | Type `menu card` into the search box | The **Menu Card** component matches; filtering is live | P1 |
| COMP-005 | Search by resourceType | UI | COMP-001 | Type `currency-selector` | The Currency Selector component matches | P1 |
| COMP-006 | Search with no matches | UI | COMP-001 | Type `zzzznotfound` | A "No components found" empty state | P1 |
| COMP-007 | Group filter | UI | COMP-001 | Choose each group in the Group dropdown | The list narrows to that group. **Note:** the dropdown offers 7 generic buckets while the registry actually uses 18 groups (§3.5) — record any group whose components cannot be filtered to. | P1 |
| COMP-008 | Status filter | UI | COMP-001 | Choose **Draft**, then **Deprecated** | Both yield 0 results, because all components are `active` (COMP-002). Confirm — a known gap, not a bug in the filter. | P2 |
| COMP-009 | "Showing X of Y" counter | UI | COMP-004 | Apply a search and read the counter | The counter reflects the filtered and total counts accurately | P2 |
| COMP-010 | Table / Grid toggle | UI | COMP-001 | Switch to **Grid**, then back to **Table** | Both views render the same components with equivalent data | P1 |
| COMP-011 | Grid card content | UI | COMP-010 | Inspect a grid card | Shows icon, title, resourceType, description, group/container badges, status dot, version, usage count | P2 |
| COMP-012 | **View Schema** | UI | COMP-001 | Open a component's `⋮` menu and click **View Schema** | A modal opens showing that component's raw JSON `dataSchema` | P0 |
| COMP-013 | Schema matches the API | UI+API | COMP-012 | Compare the modal against the same component in `/api/content/v1/component-registry` | The schemas match exactly | P1 |
| COMP-014 | Close the schema modal | UI | COMP-012 | Close via the X, Escape, and an outside click | All three close the modal | P2 |
| COMP-015 | **View Usages** — used component | UI | Save a page with components (EDIT-120) | Open the `⋮` menu for a component you placed and click **View Usages** | A list of content paths where that component is used, including your page | P1 |
| COMP-016 | **View Usages** — unused component | UI | COMP-001 | View Usages for a component that is not placed anywhere | A clear empty state, not an error | P1 |
| COMP-017 | Uses count is accurate | UI+API | COMP-015 | Compare the **Uses** column against the View Usages list | The number matches the number of usages listed | P1 |
| COMP-018 | Uses count updates | UI | COMP-017 | Add another instance of that component to a page and save; reload `/components` | The Uses count increases | P2 |
| COMP-019 | Disabled menu items | UI | COMP-001 | Open a `⋮` menu and inspect **Edit Dialog**, **Clone**, **Deprecate** | All three are **disabled with an explanatory tooltip** (the registry API is read-only). This is correct, deliberate behaviour — a PASS. | P1 |
| COMP-020 | Last Modified column | UI | COMP-001 | Inspect Last Modified | **Known gap (§20).** Always `—`. Confirm. | P3 |
| COMP-021 | **Pagination does not slice rows** | UI | COMP-001 | Note the first row. Click page **2**, then **3**. | **Suspected defect:** the pagination controls change the current page but the table still renders the full filtered list, so the visible rows never change. Confirm and report. | P1 |
| COMP-022 | Rows-per-page selector | UI | COMP-001 | Change rows-per-page from 10 → 100 | **Known gap (§20).** The selector is decorative — the rendered rows do not change. Confirm. | P2 |
| COMP-023 | First / Last page buttons | UI | COMP-001 | Click **First** and **Last** | The page-number state changes (even if the rows do not — COMP-021) | P3 |
| COMP-024 | Import Schema / Register Component | UI | COMP-001 | Click both header buttons | **Known gap (§20).** Both inert — components cannot be registered from the UI. | P2 |
| COMP-025 | Quick-action cards are inert | UI | COMP-001 | Click Usage Analytics, Policy Matrix, Dialog Builder | **Known gap (§20).** All three are decorative. | P3 |
| COMP-026 | Loading skeleton | UI | — | Hard-reload `/components` | Skeletons show, then 420 components load. Note the load time — 420 items is a meaningful volume. | P2 |
| COMP-027 | Registry read-only via API | API | — | Try POST `/api/content/v1/component-registry` with any body | Rejected (`405` or `404`). Components are seed-data only. | P2 |

---

## 12. Experience Fragments (`/experience-fragments`)

Reusable content fragments with variations, shared across pages, sites, and locales.

> **Baseline:** 2 fragments — `navigation` and `footer` — each with a `master` variation (§3.5).

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| XF-001 | XF page loads | UI | — | Open `/experience-fragments` | Breadcrumb, toolbar, table, and Usage Overview cards render | P0 |
| XF-002 | Seeded fragments listed | UI | XF-001 | Inspect the table | **Global Navigation** and **Global Footer** are both listed | P0 |
| XF-003 | Table columns | UI | XF-001 | Inspect the header | Columns: checkbox, Name, Variations count, Status, Path, Last Modified, Author, actions | P1 |
| XF-004 | Variations count | UI | XF-002 | Read the Variations badge for each fragment | Each shows `1` (the `master` variation) | P1 |
| XF-005 | Usage Overview cards | UI | XF-001 | Read Fragments / Locales / Alternative Variants | Fragments = 2; Locales reflects the site's supported locales; Alternative Variants = 0 (only `master` exists) | P1 |
| XF-006 | Click name to edit | UI | XF-002 | Click **Global Navigation** | Opens `/editor?path=...navigation.master` — the master variation, not the folder | P0 |
| XF-007 | Editor resolution notice | UI | XF-006 | Inspect the editor top area | An informational banner explains that the fragment *folder* URL was resolved to a specific *variation*, so you know what you are editing | P1 |
| XF-008 | Editing a fragment | UI | XF-006 | Add a component to the navigation fragment and **Save** | The component saves to the fragment (verify via API: GET `/api/author/content/page?path=content.experience-fragments.tut-usa.global.navigation.master`) | P0 |
| XF-009 | Fragment change appears on pages | UI | XF-008 | Open `/editor?path=content.tut-usa.home` | The locked Navigation band reflects the fragment change — this is the point of fragments | P0 |
| XF-010 | No nav/footer bands inside a fragment | UI | XF-006 | Inspect the canvas while editing the navigation fragment | The locked nav/footer bands are **not** shown when editing a fragment itself (no infinite nesting) | P1 |
| XF-011 | Search by name | UI | XF-001 | Type `footer` in the search box | Only the Global Footer row remains | P1 |
| XF-012 | Search by path | UI | XF-001 | Type `global` | Both fragments match | P2 |
| XF-013 | Search with no matches | UI | XF-001 | Type `zzzznotfound` | A clear empty state | P1 |
| XF-014 | List / Tree toggle | UI | XF-001 | Switch between **List** and **Tree** | Both render. Record whether the layout genuinely differs. | P2 |
| XF-015 | **Create Fragment** is inert | UI | XF-001 | Click **+ Create Fragment** | **Known gap (§20).** Nothing happens — fragments cannot be created from this button. Use the row menu (XF-020) or the API (XF-030). | P1 |
| XF-016 | **Manage Channels** is inert | UI | XF-001 | Click **Manage Channels** | **Known gap (§20).** Inert. | P3 |
| XF-017 | Toolbar Filter/Sort/More are inert | UI | XF-001 | Click each toolbar icon | **Known gap (§20).** All inert. | P3 |
| XF-018 | Right context rail is inert | UI | XF-001 | Click each right-rail icon | **Known gap (§20).** All inert. | P3 |
| XF-019 | Selection and clear pill | UI | XF-001 | Check both rows, then click the "2 selected" pill | Selection works, then clears | P2 |
| XF-020 | **New Fragment Here** (folder row) | UI | XF-001 | Open a **folder** row's `⋮` menu and click **New Fragment Here** | A new fragment plus a `master` variation is created under that category and appears in the list | P0 |
| XF-021 | **Edit Variations** | UI | XF-002 | Open a leaf fragment's `⋮` menu and click **Edit Variations** | Opens the editor for that fragment | P1 |
| XF-022 | **Duplicate** a fragment | UI | XF-020 (use your `qa-` fragment) | Open its `⋮` menu and click **Duplicate** | A copy is created, including its variation structure. Verify it appears in the list. | P1 |
| XF-023 | **Publish** a fragment | UI+API | XF-020 | Open the `⋮` menu and click **Publish** | Every variation of that fragment is published. Verify each variation's `status` is `PUBLISHED` via API. | P1 |
| XF-024 | **Delete** a fragment | UI+API | XF-020 | Open the `⋮` menu and click **Delete** on your `qa-` fragment | The fragment and all its variations are deleted. Verify via API that the path returns `404`. **Do not delete the seeded navigation or footer.** | P1 |
| XF-025 | No **Rename** action | UI | XF-002 | Inspect the row `⋮` menu | **Rename is intentionally absent** — there is no rename endpoint. Its absence is correct; a Rename item that does nothing would be the finding. | P2 |
| XF-026 | Menu disables while busy | UI | XF-023 | Trigger Publish and immediately reopen the menu | Menu items are disabled while the action is in flight; no duplicate requests | P2 |
| XF-027 | Error banner on failure | UI | Stop the Author service | Reload `/experience-fragments` | A visible error banner appears (not a silent empty list). Restart Author afterwards. | P1 |
| XF-030 | Create a fragment via API | API | — | POST `/api/author/xf` with `{"siteId":"tut-usa","locale":"en","category":"global","name":"qa-promo-banner","title":"QA Promo Banner","description":"qa","userId":"qa-tester"}` | `200/201`; created at `content.experience-fragments.tut-usa.global.qa-promo-banner` | P0 |
| XF-031 | New fragment appears in the UI | UI | XF-030 | Reload `/experience-fragments` | `QA Promo Banner` is listed | P1 |
| XF-032 | Duplicate fragment name rejected | API | XF-030 | Repeat XF-030 verbatim | `409 Conflict` | P1 |
| XF-033 | Add a variation | API | XF-030 | POST `/api/author/xf/variations?path=content.experience-fragments.tut-usa.global.qa-promo-banner` with `{"variationType":"mobile","title":"Mobile","userId":"qa-tester"}` | `200/201`; a `mobile` variation is created | P0 |
| XF-034 | Variations count updates in the UI | UI | XF-033 | Reload `/experience-fragments` | The fragment's Variations badge now reads `2`; Alternative Variants in the Usage Overview increments | P1 |
| XF-035 | List variations | API | XF-033 | GET `/api/author/xf/variations?path=<xf path>` | Both `master` and `mobile` are returned | P1 |
| XF-036 | Duplicate variation rejected | API | XF-033 | POST the `mobile` variation again | `409 Conflict` | P1 |
| XF-037 | Delete a variation | API | XF-033 | DELETE `/api/author/xf/variation/mobile?path=<xf path>&userId=qa-tester` | `200`; only `mobile` is removed — `master` survives | P1 |
| XF-038 | List XFs by site and locale | API | — | GET `/api/author/xf?siteId=tut-usa&locale=en` | `200`; a JSON array including the navigation and footer fragments | P1 |
| XF-039 | **Trailing slash breaks the list** | API | — | GET `/api/author/xf/?siteId=tut-usa&locale=en` — note the trailing slash | **Suspected defect:** returns `404 "Experience Fragment not found: content."` instead of the list, because the trailing slash is captured by the path-variable route. The same call without the slash (XF-038) works. **Confirm and report.** | P2 |
| XF-040 | Delete a fragment via API | API | XF-030 | DELETE `/api/author/xf/<xf path>?userId=qa-tester` | `200`; the fragment and all variations are gone | P1 |

---

## 13. Media Library / DAM (`/dam`)

> **Baseline: 0 assets.** The library starts empty. Prepare the test files from §3.7 first.
>
> **Scope limit — read before testing.** The asset API supports **upload, read, list/search, and
> delete only**. There is **no endpoint to update metadata, move, rename, or tag an asset**, and
> tagging is not modelled at all. The Asset Detail page's metadata form therefore **cannot save**
> (§20). Test what exists; confirm the rest against §20 rather than filing it repeatedly.

### 13.1 Browsing and empty state

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| DAM-001 | DAM loads with an empty library | UI | — | Open `/dam` | Heading "Media Library", breadcrumb, folder tree, and a clear "no assets yet" empty state with an **Upload Assets** call to action | P0 |
| DAM-002 | Folder tree root | UI | DAM-001 | Inspect the left tree | An "All Assets" root row with a total count of `0` | P1 |
| DAM-003 | Grid / List toggle | UI | DAM-001 | Switch between **Grid** and **List** | Both render; the empty state is sensible in both | P1 |

### 13.2 Upload

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| DAM-010 | Open the upload dialog | UI | DAM-001 | Click **Upload** | A dialog opens showing the target folder/site context and a drag-drop/browse area | P0 |
| DAM-011 | Upload via browse | UI | DAM-010 | Browse and select `qa-image-small.png`, then click **Upload (1)** | Upload succeeds; the dialog closes; the asset appears in the grid | P0 |
| DAM-012 | Upload via drag-and-drop | UI | DAM-010 | Drag `qa-image-large.jpg` onto the drop zone, then Upload | The file is accepted and uploaded | P0 |
| DAM-013 | Selected-file list | UI | DAM-010 | Select three files | All three are listed with their sizes; the button reads **Upload (3)** | P1 |
| DAM-014 | Multi-file upload | UI | DAM-013 | Click **Upload (3)** | All three upload; all three appear in the library | P0 |
| DAM-015 | Cancel the dialog | UI | DAM-013 | Click **Cancel** | The dialog closes; nothing is uploaded | P1 |
| DAM-016 | Upload a PDF | UI | DAM-010 | Upload `qa-doc.pdf` | Accepted; shown with a PDF type icon rather than an image thumbnail | P1 |
| DAM-017 | Upload a video | UI | DAM-010 | Upload `qa-video.mp4` | Accepted; shown with a video type icon | P1 |
| DAM-018 | Max 20 files | UI | DAM-010 | Try to select 25 files | The picker enforces a 20-file limit with a clear message | P2 |
| DAM-019 | Oversize file rejected | UI | DAM-010 | Select `qa-oversize.bin` (>100 MB) | Rejected with a clear size message. **Not a silent failure and not a browser hang.** | P1 |
| DAM-020 | Empty file rejected | UI+API | — | Upload `qa-empty.png` (0 bytes) | Rejected with a clear message (`422` at the API) | P1 |
| DAM-021 | **MIME sniffing catches a disguised file** | UI+API | — | Upload `qa-fake-image.png` (an `.exe` renamed to `.png`) | **Rejected.** The server detects the real type from the file bytes, not the extension. **If a renamed executable is accepted, that is a Critical security finding.** | P0 |
| DAM-022 | Upload progress / feedback | UI | DAM-012 | Upload the large file and watch | Some progress or busy indication appears; the UI does not appear frozen | P1 |
| DAM-023 | Partial-failure reporting | UI | DAM-010 | Select one valid file and one oversize file, then Upload | The result reports which succeeded and which failed — not a blanket "success" or blanket "failure" | P1 |
| DAM-024 | Upload via API | API | — | POST multipart to `/api/author/assets` with `file`, `path`, `siteId=tut-usa`, `userId=qa-tester` | `200/201`; the asset record is returned with an id | P0 |
| DAM-025 | Uploaded asset reaches storage | — | DAM-011 | Open the MinIO console (`http://localhost:9001`) and browse the bucket | The original file is present in object storage | P1 |
| DAM-026 | Auto-renditions are generated | API | DAM-011 | GET `/api/author/assets/{id}` a few seconds after upload | Status has moved from `PROCESSING` to `ACTIVE`, and thumbnail / web-small / web-medium / web-large renditions exist | P1 |
| DAM-027 | Image dimensions extracted | API | DAM-011 | GET `/api/author/assets/{id}` | Width, height, and aspect ratio are populated for the image | P1 |

### 13.3 Browsing, search, folders

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| DAM-030 | Grid shows thumbnails | UI | DAM-011 | View the grid | Image assets show a real thumbnail preview; non-images show a type icon | P0 |
| DAM-031 | List view columns | UI | DAM-014 | Switch to **List** | Columns: select-all checkbox, Name + thumbnail, Type, Info, Uploaded, Status, actions | P1 |
| DAM-032 | List pagination | UI | Upload 25+ assets | Switch to List and page through | 20 rows per page; pagination works; no duplicated or skipped rows | P2 |
| DAM-033 | Search by name | UI | DAM-014 | Type `qa-image` into the search box | Only matching assets remain; filtering is live | P1 |
| DAM-034 | Search with no matches | UI | DAM-033 | Type `zzzznotfound` | A "no search match" empty state — **distinct from** the "no assets yet" state (DAM-001) | P1 |
| DAM-035 | Folder tree reflects uploads | UI | Upload into two different `path` values via API (DAM-024) | Inspect the folder tree | Both folders appear with correct descendant-inclusive counts | P1 |
| DAM-036 | Expand / collapse a folder | UI | DAM-035 | Click a folder's chevron | It expands and collapses. Clicking the chevron must **not** also change the folder selection — they are separate targets. | P1 |
| DAM-037 | Select a folder filters assets | UI | DAM-035 | Click a folder name | Only that folder's assets are shown; the breadcrumb updates | P0 |
| DAM-038 | "All Assets" clears the filter | UI | DAM-037 | Click **All Assets** | Every asset is shown again; the total count is correct | P1 |
| DAM-039 | Breadcrumb segments are clickable | UI | DAM-037 | Navigate into a nested folder, then click an earlier breadcrumb segment | Jumps to that folder level | P2 |
| DAM-040 | Folder list via API | API | DAM-035 | GET `/api/author/assets/folders?siteId=tut-usa` | Folders with active-asset counts are returned | P2 |
| DAM-041 | Assets by folder via API | API | DAM-035 | GET `/api/author/assets/folder?folderPath=<path>&siteId=tut-usa&page=0&size=20` | Only that folder's assets; pagination fields present | P2 |
| DAM-042 | Archive / Trash buttons | UI | DAM-001 | Click **Archive** and **Trash** in the sidebar | **Known gap (§20).** Both inert. | P3 |

### 13.4 Asset actions

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| DAM-050 | Open the asset action menu | UI | DAM-011 | Hover an asset card and click `⋮` | A menu opens: View Details, Download, Move to folder, Copy URL, Delete | P1 |
| DAM-051 | **View Details** | UI | DAM-050 | Click **View Details** | Navigates to `/dam/{id}` | P0 |
| DAM-052 | Double-click opens details | UI | DAM-011 | Double-click an asset card | Navigates to `/dam/{id}` | P1 |
| DAM-053 | **Download** | UI | DAM-050 | Click **Download** | The file downloads; the saved file opens correctly and matches what you uploaded | P0 |
| DAM-054 | **Copy URL** | UI | DAM-050 | Click **Copy URL**, then paste into a new browser tab | The URL is copied and resolves to the asset content | P1 |
| DAM-055 | **Move to folder** is disabled | UI | DAM-050 | Inspect **Move to folder** | **Disabled with an explanatory tooltip** — there is no move/update endpoint. Correct, deliberate behaviour. | P1 |
| DAM-056 | **Delete** a single asset | UI+API | DAM-011 | Click **Delete**, then GET the asset id | The asset disappears from the grid and the API returns `404`. Record whether a confirmation was requested. | P0 |
| DAM-057 | Delete removes renditions | API | DAM-056 | After deleting, check MinIO and the asset's renditions | The original and all renditions are removed from storage | P1 |
| DAM-058 | Delete a non-existent asset | API | — | DELETE `/api/author/assets?path=/no/such/asset.png` | `404` — **not** a silent success | P1 |
| DAM-059 | Select assets in the grid | UI | DAM-014 | Click three asset cards | Each toggles selected; a bulk-action bar appears reading "3 selected" | P1 |
| DAM-060 | Bulk **Delete** | UI+API | DAM-059 | Click **Delete** in the bulk bar | All selected assets are deleted; per-item errors (if any) are reported individually; folder counts refresh | P0 |
| DAM-061 | Bulk Download / Move are inert | UI | DAM-059 | Click **Download** and **Move** in the bulk bar | **Known gap (§20).** Both inert. | P2 |
| DAM-062 | Notice banners | UI | DAM-053 | Perform a Download, then a Copy URL | A short notice appears for each ("Downloaded X", "URL copied"). Note there is no manual dismiss. | P3 |
| DAM-063 | Delete-error banner | UI | — | Trigger a delete failure (e.g. stop Author, then delete) | A visible error banner. **Not a silent failure.** Restart Author afterwards. | P1 |

### 13.5 Asset Detail page (`/dam/{id}`)

> **This page is largely a UI mock.** Save/Discard do not persist, and Renditions and Usage
> References are always empty. See §20.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| DAM-070 | Detail page loads | UI | DAM-051 | Open `/dam/{id}` for an uploaded image | Breadcrumb with the filename, sticky action header, preview surface, and the metadata form all render | P1 |
| DAM-071 | Technical Specs are real | UI | DAM-070 | Read Format, Dimensions, File Size | These match the file you uploaded (verify against DAM-027). **Colour Space is hardcoded `sRGB` — known gap.** | P1 |
| DAM-072 | Preview surface | UI | DAM-070 | Inspect the main preview area | **Known gap (§20).** A static gradient placeholder — the real image is **not** rendered here. Confirm. | P1 |
| DAM-073 | Preview toolbar is inert | UI | DAM-070 | Click Zoom in, Zoom out, Crop, Colour adjust, Fullscreen | **Known gap (§20).** All five inert. | P2 |
| DAM-074 | Metadata form accepts input | UI | DAM-070 | Type into Asset Title, Alt Text, Copyright Holder; add two tags in the Tags field | All fields accept input; tag chips add and remove correctly | P1 |
| DAM-075 | **Save Changes does not persist** | UI | DAM-074 | Click **Save Changes**, then press F5 | **Known gap (§20).** The button is inert and there is no metadata-update endpoint, so all edits are lost on reload. Confirm — then **file this once as a single Major finding**, because a metadata editor that silently discards work is a genuine usability defect even though it is a known gap. | P1 |
| DAM-076 | Discard button | UI | DAM-074 | Click **Discard** | **Known gap (§20).** Inert — edits remain in the form. | P2 |
| DAM-077 | Generated Renditions panel | UI | DAM-070 | Inspect the panel | **Known gap (§20).** Always empty, even though renditions genuinely exist (DAM-026). Confirm the panel does not reflect real renditions. | P1 |
| DAM-078 | Usage References panel | UI | Place the asset in a page component (EDIT-182) | Inspect the panel | **Known gap (§20).** Always empty even when the asset is used. Confirm. | P1 |
| DAM-079 | Right rail is inert | UI | DAM-070 | Click Version History, Asset Comments, Share Asset, Delete Asset | **Known gap (§20).** All four inert — including **Delete Asset**, which is a trap: the working delete is in the library view (DAM-056). | P2 |
| DAM-080 | Not-found state | UI | — | Open `/dam/00000000-0000-0000-0000-000000000000` | A clear "not found" state with a **Back to Library** call to action. Not a crash. | P1 |
| DAM-081 | Back to Library | UI | DAM-070 | Click **Back to Library** | Returns to `/dam` | P2 |
| DAM-082 | Advanced IPTC/XMP toggle | UI | DAM-070 | Click the **Advanced IPTC/XMP Data** row | **Known gap (§20).** Does not expand. | P3 |

### 13.6 DAM gaps to confirm via API

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| DAM-090 | No metadata-update endpoint | API | DAM-024 | Try PUT and PATCH on `/api/author/assets/{id}` with `{"title":"qa"}` | Both are rejected (`404`/`405`). Confirms DAM-075's root cause. | P1 |
| DAM-091 | On-demand renditions unreachable | API | DAM-024 | Look for any endpoint to request the `hero-desktop`, `hero-mobile`, or `og-image` profiles | **Known gap (§20).** No such endpoint exists — only the four auto-generated profiles are obtainable. Confirm. | P2 |
| DAM-092 | Assets are not replicated | API | DAM-024 | Upload an asset, then look for it on the Publish tier (8081) | **Known gap (§20).** Asset replication is never triggered, so assets never reach Publish — unlike content nodes. Confirm and note the delivery implication. | P1 |
| DAM-093 | Asset search via API | API | DAM-014 | GET `/api/author/assets?q=qa-image&siteId=<real siteId>&page=0&size=20` | Matching assets are returned with pagination fields | P2 |
| DAM-094 | Asset content streaming | API | DAM-024 | GET `/api/author/assets/{id}/content` | `200` with the correct `Content-Type` and a `Cache-Control` header of about `max-age=3600` | P2 |
| DAM-095 | **`q=` search silently defaults to `siteId=corporate` when omitted** — ✅ **FIXED 2026-09-14** (BUGS_AND_FINDINGS.md) | API | DAM-014 | GET `/api/author/assets?q=<a real filename fragment>&page=0&size=20` — **no `siteId`** | `422` with `"siteId is required when searching with 'q'"` — verified live. With `&siteId=<real site>` it matches correctly. Was: silently substituted `"corporate"` and returned an empty result. | P2 |
---

## 14. Sites (`/sites`) — Site Manager

> **Baseline:** 5 sites registered; only `tut-usa` has content (§3.5).
>
> **Scope limit:** every row action on this page is inert, and there is no site detail route.
> Site creation, domain mapping, and language copy are **API-only** (§14.2).

### 14.1 Site Manager UI

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| SITE-001 | Sites page loads | UI | — | Open `/sites` | Breadcrumb "Workspace › Sites", toolbar, and the site list render | P0 |
| SITE-002 | All 5 sites listed | UI | SITE-001 | Inspect the list | `tut-usa`, `tut-gb`, `tut-de`, `tut-fr`, `tut-ca` are all present (§3.5) | P0 |
| SITE-003 | List columns | UI | SITE-001 | Inspect the header | Columns: checkbox, Site Name (+ avatar, ID), Status, URL, Last Published, Pages, actions | P1 |
| SITE-004 | Site data matches the API | UI+API | SITE-001 | Compare a row against GET `/api/admin/sites` | Site ID, title, and URL match. For `tut-gb` the URL should reflect `www.tut.co.uk`. | P1 |
| SITE-005 | **Pages count is always 0** | UI | SITE-001 | Read the Pages column for `tut-usa` | **Known gap (§20).** Shows `0` even though `tut-usa` has 9 pages. Confirm. | P1 |
| SITE-006 | Grid / List toggle | UI | SITE-001 | Switch to **Grid**, then back to **List** | Both render the same 5 sites | P1 |
| SITE-007 | Grid card content | UI | SITE-006 | Inspect a grid card | Shows avatar, status badge, URL, page count, last-published date, and locale chips | P2 |
| SITE-008 | Grid cards do not drill in | UI | SITE-006 | Click a grid card | **Known gap (§20).** There is no `/sites/{id}` detail route — cards are decorative. Confirm nothing navigates (or that any navigation 404s). | P2 |
| SITE-009 | Search by name | UI | SITE-001 | Type `deutsch` in the search box | The `tut-de` row matches | P1 |
| SITE-010 | Search by URL | UI | SITE-001 | Type `tut.co.uk` | The `tut-gb` row matches | P2 |
| SITE-011 | Search with no matches | UI | SITE-001 | Type `zzzznotfound` | A clear empty state | P1 |
| SITE-012 | Sort toggle | UI | SITE-001 | Click the sort toggle to switch Alphabetical ⇄ Page Count | The order changes. **Note:** because every Pages count is `0` (SITE-005), Page Count sorting cannot produce a meaningful order — record this. | P2 |
| SITE-013 | Selection and select-all | UI | SITE-001 | Check two rows, then use the header checkbox | Individual, select-all, and indeterminate states all behave correctly | P1 |
| SITE-014 | **Clear Selection** works | UI | SITE-013 | Click **Clear Selection** in the footer bulk bar | Selection clears — this footer action is genuinely functional | P2 |
| SITE-015 | **Publish Selected** is inert | UI | SITE-013 | Click **Publish Selected** | **Known gap (§20).** Inert — no request, no status change. | P2 |
| SITE-016 | Row action menu is entirely inert | UI | SITE-001 | Open a row's `⋮` menu and click each of Open, Edit Settings, Publish Now, Duplicate, Go Offline, Delete | **Known gap (§20).** All six are inert. Verify via F12 → Network that **no** request is sent, and confirm via `/api/admin/sites` that nothing changed. | P1 |
| SITE-017 | **Create New Site** is inert | UI | SITE-001 | Click **Create New Site** | **Known gap (§20).** Nothing happens — sites cannot be created from the UI. Use the API (SITE-020). | P1 |
| SITE-018 | Status badges render | UI | SITE-001 | Inspect the Status column | Each site shows a status badge (Published/Maintenance/Draft/Offline) consistent with its data | P2 |

### 14.2 Site management via API

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| SITE-020 | Create a site | API | — | POST `/api/admin/sites` with `{"siteId":"qa-site","title":"QA Site","defaultLocale":"en","supportedLocales":["en","de"],"userId":"qa-tester"}` | `200/201`; the site is created **and** root content nodes are created: `content.qa-site`, `content.qa-site.en`, `content.qa-site.de` | P0 |
| SITE-021 | New site appears in the UI | UI | SITE-020 | Reload `/sites` | `QA Site` is listed, making 6 sites | P1 |
| SITE-022 | New site root appears in the tree | UI | SITE-020 | Open `/content` | `qa-site` appears at the root level with `en` and `de` children | P1 |
| SITE-023 | Duplicate siteId rejected | API | SITE-020 | Repeat SITE-020 verbatim | ✅ **FIXED 2026-09-14.** Now `409 ALREADY_EXISTS` — verified live (BUGS_AND_FINDINGS.md). Was `500`. | P1 |
| SITE-024 | Empty supportedLocales rejected | API | — | POST a site with `"supportedLocales": []` | `400`/`422` with a clear validation message | P1 |
| SITE-025 | Get a single site | API | SITE-020 | GET `/api/admin/sites/qa-site` | `200` with a page count and the domain list | P1 |
| SITE-026 | Add a domain mapping | API | SITE-020 | POST `/api/admin/sites/qa-site/domains` with `{"domain":"qa-site.localhost","primary":true}` | `200/201`; the domain is attached and appears in GET `/api/admin/sites/qa-site` | P1 |
| SITE-027 | Add a second, non-primary domain | API | SITE-026 | POST another domain with `"primary": false` | Both domains are listed; exactly one is marked primary | P2 |
| SITE-028 | Domain appears in the UI | UI | SITE-026 | Reload `/sites` | The site's URL column reflects the primary domain | P2 |
| SITE-029 | Seeded domain mappings intact | API | — | GET `/api/admin/sites` | `tut-gb` has `www.tut.co.uk` (primary) and `tut-gb.localhost`; `tut-de` has `www.tut.de` and `tut-de.localhost` | P2 |

---

## 15. Translations (`/translations`) — Language Matrix

> **This entire page is non-functional in this build.** It has **no data fetch at all**, so it
> permanently shows an empty state regardless of backend data. The underlying i18n dictionary
> service exists but has **no REST endpoint** to reach it (§20).
>
> The cases below verify that the page fails *gracefully* and confirm the gap. Do not spend
> significant time here, and do not file each dead control separately.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| TRN-001 | Page loads without crashing | UI | — | Open `/translations` | The page renders with a breadcrumb and toolbar. No crash, no blank screen. | P1 |
| TRN-002 | **Permanently empty** | UI | TRN-001 | Inspect the translation grid | **Known gap (§20).** Always shows "No translation keys found" with an **Import Translations** call to action. Verify with F12 → Network that **no data request is made at all.** | P1 |
| TRN-003 | Translation Health panel | UI | TRN-001 | Read the floating Translation Health panel | Shows 0% / 0 / 0 / 0 — consistent with the empty grid | P3 |
| TRN-004 | Header buttons are inert | UI | TRN-001 | Click **Import Translations** and **Export XLIFF** | **Known gap (§20).** Both inert. | P2 |
| TRN-005 | Empty-state CTA is inert | UI | TRN-002 | Click the **Import Translations** button inside the empty state | **Known gap (§20).** Inert. | P2 |
| TRN-006 | Filters do not crash | UI | TRN-001 | Use the search box, the status chips (All/Translated/Outdated/Missing), and the Section dropdown | All controls respond without error. They have no visible effect because there is no data — that is expected here. | P2 |
| TRN-007 | Pagination is inert | UI | TRN-001 | Inspect the pagination controls | Present but inert with 0 results | P3 |
| TRN-008 | No dictionary API exists | API | — | Try GET `/api/author/i18n/dictionary` and any similar i18n route you can find | **Known gap (§20).** No i18n dictionary endpoint exists — `404`. Confirms TRN-002's root cause. | P2 |
| TRN-009 | No machine-translation API | API | — | Look for any translate/machine-translate endpoint | **Known gap (§20).** The DeepL connector is implemented but unreachable — no endpoint. Confirm. | P2 |

### 15.1 Language copy — the one i18n feature that works (API only)

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| I18N-001 | Create a language copy | API | SITE-020 (`qa-site` with `en` + `de`); add a page under `content.qa-site.en` | POST `/api/admin/sites/qa-site/languages/de?sourceLocale=en` | `200`; the entire `en` subtree is deep-copied under the `de` locale | P0 |
| I18N-002 | Copied nodes start as DRAFT | API | I18N-001 | GET the copied nodes | **Every copied node has `status: DRAFT`**, regardless of the source node's status | P0 |
| I18N-003 | Copy preserves structure | API | I18N-001 | Compare the `en` and `de` subtrees | The same node names, hierarchy, and component structure exist in both | P0 |
| I18N-004 | Copy preserves properties | API | I18N-001 | Compare properties on a matching page in each locale | Property values are copied across | P1 |
| I18N-005 | Copied content appears in the UI | UI | I18N-001 | Open `/content` and drill into `qa-site` | Both `en` and `de` subtrees are browsable with matching structure | P1 |
| I18N-006 | Publishing a copy is independent | API | I18N-001 | Publish a page in `de` only | Only the `de` page becomes `PUBLISHED`; its `en` counterpart stays `DRAFT` | P1 |
| I18N-007 | Language copy to an unsupported locale | API | SITE-020 | POST `/api/admin/sites/qa-site/languages/ja?sourceLocale=en` — `ja` is not in `supportedLocales` | Record the behaviour: either a clear validation error, or the copy is created anyway. An unvalidated copy into an unsupported locale is at least a Minor finding. | P2 |
| I18N-008 | Invalid sourceLocale | API | SITE-020 | POST with `?sourceLocale=zz` | A clear error, not a `500` and not a silent empty copy | P2 |

---

## 16. Product Information Management (PIM)

> **Baseline (§3.5):** 1 schema (**Luxury Vehicle v2026** v1.0), 1 catalog (**TUT 2026 Model
> Lineup**, 2026, `ACTIVE`), 4 products: `TUT-SOVEREIGN-2026`, `TUT-VANGUARD-2026`,
> `TUT-ECLIPSE-2026`, `TUT-APEX-2026`.
>
> **Two important cautions for this whole section:**
> 1. **Much of the PIM UI shows hardcoded placeholder data** (prices, stock, completion rates,
>    technical specs, localization strings). §20 lists exactly which. Do not test those values
>    for correctness against real data.
> 2. **PIM has no role-based authorization at all** — any authenticated user can create, update,
>    and delete products, catalogs, and schemas. This cannot be verified in local-dev mode
>    (§3.2), but it is recorded here as a known risk for a secured environment.

### 16.1 Catalog list (`/pim`)

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PIM-001 | Catalog list loads | UI | — | Open `/pim` | Breadcrumb "Dashboard › Products › Catalogs", toolbar, and the catalog table render | P0 |
| PIM-002 | Seeded catalog is listed | UI | PIM-001 | Inspect the table | **TUT 2026 Model Lineup** is listed with status `Active` | P0 |
| PIM-003 | Table columns | UI | PIM-001 | Inspect the header | Columns: Catalog Name (+ thumbnail, ID), Season, Status, Product Count, Last Sync, actions | P1 |
| PIM-004 | **Product Count is always 0** | UI | PIM-002 | Read the Product Count column | **Known gap (§20).** Shows `0` even though the catalog has 4 products. Confirm. | P1 |
| PIM-005 | Search by name | UI | PIM-001 | Type `lineup` in the search box | The TUT 2026 Model Lineup row matches | P1 |
| PIM-006 | Search by ID | UI | PIM-001 | Paste the catalog's ID into the search box | The row matches | P2 |
| PIM-007 | Search with no matches | UI | PIM-001 | Type `zzzznotfound` | A "No catalogs found" empty state, distinct from the load-error state | P1 |
| PIM-008 | Status filter | UI | PIM-001 | Choose **Active**, then **Draft**, then **Archived** | `Active` shows the seeded catalog; the others show none | P1 |
| PIM-009 | **Season filter is static** | UI | PIM-001 | Open the Season dropdown and try each option | **Known gap (§20).** The options are a hardcoded list (All Seasons / Summer 2026 / Spring 2026 / Winter 2025 / Permanent), **not derived from real data**, so filtering may match nothing. Confirm. | P2 |
| PIM-010 | Catalog Name sort header | UI | PIM-001 | Click the **Catalog Name** header | **Known gap (§20).** The sort icon is decorative — clicking does not sort. Confirm. | P2 |
| PIM-011 | Catalog name links to detail | UI | PIM-002 | Click **TUT 2026 Model Lineup** | Navigates to `/pim/{id}` | P0 |
| PIM-012 | Pagination | UI | Create 12+ catalogs via API (PIM-030) | Page through the list | Client-side pagination at 10 per page; prev/next and page numbers work; no duplicated or skipped rows | P2 |
| PIM-013 | Row action menu is inert | UI | PIM-001 | Open a row's `⋮` menu and click each of View Details, Edit Catalog, Duplicate, Export CSV, Delete | **Known gap (§20).** All five are inert. Verify no request is sent and no data changes. | P1 |
| PIM-014 | Header buttons are inert | UI | PIM-001 | Click **Export** and **Create Catalog** | **Known gap (§20).** Both inert — catalogs cannot be created from the UI. Use the API (PIM-030). | P1 |
| PIM-015 | Load-error state | UI | Stop the Author service | Reload `/pim` | An error banner distinguishes "API failed" from "genuinely empty". Restart Author afterwards. | P1 |

### 16.2 Catalog detail (`/pim/{id}`)

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PIM-020 | Catalog detail loads | UI | PIM-011 | Open the seeded catalog | Header with status, season, product count, last-updated; a stats bento; the product table | P0 |
| PIM-021 | **All four products listed** | UI | PIM-020 | Inspect the product table | `TUT-SOVEREIGN-2026`, `TUT-VANGUARD-2026`, `TUT-ECLIPSE-2026`, `TUT-APEX-2026` are all present | P0 |
| PIM-022 | Product table columns | UI | PIM-020 | Inspect the header | Columns: checkbox, SKU, Product Name (+ thumbnail), Schema, Price, Stock, Sync Status, actions | P1 |
| PIM-023 | **Price / Stock / Schema are placeholders** | UI | PIM-021 | Read the Price, Stock, and Schema columns | **Known gap (§20).** Price is always `$0.00`, Stock always `0`, Schema always blank — all hardcoded. Confirm and **do not** report each product separately. | P1 |
| PIM-024 | **Stats bento is placeholder** | UI | PIM-020 | Read Completion Rate, Stock Value, Pending Sync, Media Health | **Known gap (§20).** All hardcoded to 0/static. Confirm. | P1 |
| PIM-025 | **Total Inventory is $0.00** | UI | PIM-020 | Read the footer Total Inventory | `$0.00`, because Price and Stock are hardcoded (PIM-023). Consistent with the known gap. | P2 |
| PIM-026 | Search products by SKU | UI | PIM-020 | Type `SOVEREIGN` in the product search box | Only `TUT-SOVEREIGN-2026` remains | P1 |
| PIM-027 | Search products by name | UI | PIM-020 | Search by a product's display name | The matching product is shown | P1 |
| PIM-028 | Product selection | UI | PIM-020 | Check two products, then use the header checkbox | Individual, select-all, and indeterminate states behave correctly | P2 |
| PIM-029 | Product name links to the editor | UI | PIM-021 | Click a product's name | Navigates to `/pim/{catalogId}/{productId}` | P0 |
| PIM-030 | Product pagination | UI | PIM-020 | Read "Displaying X–Y of Z" and use prev/next | Pagination is accurate and consistent with the 4 seeded products | P2 |
| PIM-031 | Header action buttons are inert | UI | PIM-020 | Click **Publish**, **Archive**, **Export**, **Carryforward** | **Known gap (§20).** All four inert. Note that Carryforward *does* work via API (PIM-070). | P1 |
| PIM-032 | Product row menu is inert | UI | PIM-020 | Open a product row's `⋮` menu and click each of Edit Product, Duplicate, Force Sync, View History, Remove from Catalog | **Known gap (§20).** All five inert. | P1 |
| PIM-033 | Quick Action cards are inert | UI | PIM-020 | Click AI Data Enrichment, Channel Distribution, Change Journal | **Known gap (§20).** All three decorative. | P3 |

### 16.3 Product editor (`/pim/{id}/{productId}`)

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PIM-040 | Product editor loads | UI | PIM-029 | Open a seeded product | Sticky header with SKU, accordion sections, and the right sidebar all render | P0 |
| PIM-041 | **Breadcrumb is hardcoded** | UI | PIM-040 | Read the breadcrumb | **Known gap (§20).** Shows "Electronics" and "X-Series OLED" regardless of the actual catalog and product — clearly wrong for a TUT vehicle. Confirm; file **once**. | P1 |
| PIM-042 | General Info fields load | UI | PIM-040 | Expand **General Info** | Product Name, Brand, Primary Category, MSRP, Status, Long Description are shown, populated from the real product | P1 |
| PIM-043 | Edit a field marks it dirty | UI | PIM-042 | Change the Product Name | An unsaved-changes indicator appears in the header | P1 |
| PIM-044 | **Save Draft persists** | UI+API | PIM-043 | Click **Save Draft**, then GET `/api/pim/v1/products/TUT-SOVEREIGN-2026` | The button shows "Saving…"; the API reflects the new attribute value. **This is one of the few genuinely functional PIM UI actions.** | P0 |
| PIM-045 | Saved value survives a reload | UI | PIM-044 | Press F5 | The saved value is still shown | P0 |
| PIM-046 | MSRP accepts numbers | UI | PIM-042 | Enter `125000.50` in MSRP | Accepted as a number; saves correctly | P1 |
| PIM-047 | MSRP rejects text | UI | PIM-042 | Type `abc` into MSRP | Rejected or ignored — not stored as a string, no crash | P1 |
| PIM-048 | Status dropdown | UI | PIM-042 | Open the Status dropdown | Offers Draft / Published / Archived | P1 |
| PIM-049 | **Publish button** | UI+API | PIM-040 | Click **Publish**, then GET the product | `status` becomes `PUBLISHED`. This calls the real status endpoint and also triggers the PIM→CMS bridge (§17.3). | P0 |
| PIM-050 | Long Description accepts text | UI | PIM-042 | Enter multi-paragraph text and save | Text is preserved, including line breaks | P1 |
| PIM-051 | **Technical Specs are hardcoded** | UI | PIM-040 | Expand **Technical Specs** | **Known gap (§20).** Resolution "3840 x 2160 (4K)" and Refresh Rate "120Hz Native" are hardcoded TV specs — wrong for a vehicle. Panel Type / HDR / Connectivity / Weight are also hardcoded defaults, not fetched. Confirm; file **once**. | P1 |
| PIM-052 | **Asset Linker is empty and inert** | UI | PIM-040 | Expand **Asset Linker**; click **Add Media** and **Open DAM Picker** | **Known gap (§20).** The grid is always empty (never populated from the API) and both controls are inert — there is no DAM picker despite the label. Confirm. | P1 |
| PIM-053 | Product Variants table | UI | PIM-040 | Inspect the **Product Variants** section | Columns SKU Suffix / Region / Stock / Status / Actions, populated from the real variants API. Record how many variants each seeded product has. | P1 |
| PIM-054 | Variant controls are inert | UI | PIM-053 | Click **Add Variant** and a row's pencil **Edit** icon | **Known gap (§20).** Both inert — variants can only be managed via API (PIM-060). | P1 |
| PIM-055 | **Localization is hardcoded** | UI | PIM-040 | Expand **Localization** | **Known gap (§20).** Four locale fields (German/French/Spanish/Japanese) contain hardcoded sample strings, not real localization data, and Save Draft does not submit them. Confirm; file **once**. | P1 |
| PIM-056 | Data Health card is live | UI | PIM-040 | Read the **Data Health** card, then clear the Product Name field | The score and its checklist (Product name set / Assets linked / SKU set) recompute live from the current form state | P2 |
| PIM-057 | Quick Navigation rail | UI | PIM-040 | Click each jump-link in the right rail | The page scrolls to that section and the active state highlights | P2 |
| PIM-058 | **Danger Zone is inert** | UI | PIM-040 | Click **Archive Product** and **Delete Product** | **Known gap (§20).** Both inert — no confirmation, no API call, nothing deleted. **If either DOES delete without confirmation, report immediately as a Blocker.** | P0 |
| PIM-059 | Version History button is inert | UI | PIM-040 | Click **Version History** | **Known gap (§20).** Inert — versions are API-only (PIM-080). | P2 |

### 16.4 Product / variant / catalog CRUD via API

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PIM-060 | Create a catalog | API | — | POST `/api/pim/v1/catalogs` with `{"name":"QA Catalog","year":2027,"season":"Summer 2027","description":"qa","schemaId":"<seeded schema id>","userId":"qa-tester"}` | `200/201`; created with status `DRAFT` | P0 |
| PIM-061 | Year below 2000 rejected | API | — | POST a catalog with `"year": 1999` | `400`/`422` with a clear validation message | P1 |
| PIM-062 | Activate a catalog | API | PIM-060 | POST `/api/pim/v1/catalogs/{id}/activate` | `200`; status becomes `ACTIVE` | P0 |
| PIM-063 | Activating an ACTIVE catalog is refused | API | PIM-062 | POST activate again | ✅ **FIXED 2026-09-14.** Now `409 CONFLICT` with a clear message — verified live (BUGS_AND_FINDINGS.md). Was `500`. | P1 |
| PIM-064 | **Two ACTIVE catalogs in the same year** | API | — | Create two catalogs both with `year: 2028`, then activate **both** | ✅ **FIXED 2026-09-14** (BUGS_AND_FINDINGS.md, GAP-103). The second activation is now rejected with `409` naming the year and the already-active catalog. Was: both silently succeeded. | P1 |
| PIM-065 | Archive a catalog | API | PIM-062 | POST `/api/pim/v1/catalogs/{id}/archive` | `200`; status becomes `ARCHIVED` | P1 |
| PIM-066 | Deleting an ACTIVE catalog is refused | API | PIM-062 | DELETE an `ACTIVE` catalog | Refused — it must be archived first. Record the actual status (likely `500` rather than `409`). | P1 |
| PIM-067 | Delete an archived catalog | API | PIM-065 | DELETE the archived catalog | `200`; a subsequent GET fails | P1 |
| PIM-068 | Create a product | API | PIM-060 | POST `/api/pim/v1/products` with `{"sku":"QA-SKU-001","name":"QA Product","catalogId":"<id>","attributes":{},"userId":"qa-tester"}` | `200/201`; the product is created | P0 |
| PIM-069 | New product appears in the UI | UI | PIM-068 | Open `/pim/{catalogId}` | `QA-SKU-001` is listed in the product table | P1 |
| PIM-070 | Update product attributes | API | PIM-068 | PUT `/api/pim/v1/products/QA-SKU-001` with `{"attributes":{"horsepower":600},"userId":"qa-tester"}` | `200`; the attribute is stored; **other existing attributes are preserved** (partial merge) | P0 |
| PIM-071 | Schema validation rejects bad attributes | API | PIM-068 | PUT attributes that violate the catalog's schema (e.g. a string where a number is required) | Rejected with a validation error. Record the status — a `4xx` is correct; a `500` is a finding. | P1 |
| PIM-072 | Product not found | API | — | GET `/api/pim/v1/products/NO-SUCH-SKU` | `404` — this GET path was already correct (`ResponseEntity.notFound().build()`). The **write** paths (update/delete/status/restore) were the ones that surfaced `500` for a missing SKU; ✅ **fixed 2026-09-14** (BUGS_AND_FINDINGS.md) — all now `404`. | P1 |
| PIM-073 | Product status transition | API | PIM-068 | PUT `/api/pim/v1/products/QA-SKU-001/status` with `{"status":"PUBLISHED","userId":"qa-tester"}` | `200`; status becomes `PUBLISHED` | P0 |
| PIM-074 | Product status is unvalidated | API | PIM-073 | PUT status `ARCHIVED`, then straight back to `PUBLISHED`, then `DRAFT` | Every transition is accepted with no validation — this is the documented behaviour. Confirm. | P2 |
| PIM-075 | Delete a product | API | PIM-068 | DELETE `/api/pim/v1/products/QA-SKU-001` | `200`; the product, its variants, and its asset refs are removed | P1 |
| PIM-076 | Create a variant | API | PIM-068 | POST `/api/pim/v1/products/QA-SKU-001/variants` with `{"variantSku":"QA-SKU-001-EU","attributes":{},"pricing":{"EUR":125000},"inventory":{"stock":5}}` | `200/201`; the variant is created | P1 |
| PIM-077 | Variant appears in the UI | UI | PIM-076 | Open the product editor | The variant is listed in the Product Variants table | P1 |
| PIM-078 | Update a variant | API | PIM-076 | PUT `/api/pim/v1/variants/{variantId}` with new pricing | `200`; the change is stored | P1 |
| PIM-079 | Delete a variant | API | PIM-076 | DELETE `/api/pim/v1/variants/{variantId}` | `200`; the variant is gone; the parent product survives | P1 |
| PIM-080 | Link a DAM asset | API | DAM-024, PIM-068 | POST `/api/pim/v1/products/QA-SKU-001/assets` with `{"assetPath":"<real asset path>","role":"hero","orderIndex":0}` | `200/201`; the link is created | P1 |
| PIM-081 | **Bogus asset path is accepted** | API | PIM-068 | POST an asset link with `"assetPath":"/no/such/asset.png"` | **Known gap (§20).** The link is accepted with **no existence check** against DAM. Confirm and report as a data-integrity finding. | P1 |
| PIM-082 | Update / unlink an asset ref | API | PIM-080 | PUT `/api/pim/v1/products/assets/{refId}` with a new role; then DELETE it | Both succeed | P2 |
| PIM-083 | Product version history | API | PIM-070 | GET `/api/pim/v1/products/{id}/versions` | Versions are listed newest-first; a new version exists for each create/update/status change | P1 |
| PIM-084 | Restore a product version | API | PIM-083 | POST `/api/pim/v1/products/{id}/versions/1/restore?userId=qa-tester` | `200`; `attributes` and `name` revert to that version's values | P1 |
| PIM-085 | Product search | API | — | GET `/api/pim/v1/search?q=sovereign&page=0&size=10` | The matching seeded product is returned from Elasticsearch | P1 |
| PIM-086 | Product search facets | API | — | GET `/api/pim/v1/search/facets?q=tut` | Results plus facet aggregations by status and catalog | P2 |
| PIM-087 | Reindex a catalog | API | — | POST `/api/pim/v1/search/reindex/catalog/{catalogId}` | `200`; a subsequent search reflects current data | P2 |
| PIM-088 | Reindex all | API | — | POST `/api/pim/v1/search/reindex/all` | `200`; the whole product index is rebuilt | P2 |
| PIM-089 | New product is searchable | API | PIM-068 | Create a product, then immediately search for its name | The product is found — the index is updated incrementally on create | P1 |
| PIM-090 | Deleted product leaves the index | API | PIM-075 | Delete a product, then search for it | It is no longer returned | P1 |
| PIM-091 | Trailing slash returns 500 | API | — | GET `/api/pim/v1/products/` — with a trailing slash | ✅ **FIXED 2026-09-14.** Now `404` with a clear RFC 7807 body suggesting the trailing slash is the issue — verified live (BUGS_AND_FINDINGS.md). Was `500`. | P2 |

### 16.5 Year-over-year carryforward (API only)

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PIM-100 | Carry products forward | API | Seeded 2026 catalog + a new 2027 catalog (PIM-060) | POST `/api/pim/v1/products/carryforward` with `{"sourceCatalogId":"<2026 id>","targetCatalogId":"<2027 id>","userId":"qa-tester"}` | `200`; all four products are cloned into the 2027 catalog with new SKUs suffixed by the target year (e.g. `TUT-SOVEREIGN-2026-2027`) | P0 |
| PIM-101 | Carried products inherit attributes | API | PIM-100 | GET a carried product | Its own `attributes` map is **empty**, but the resolved response shows values inherited from the source product | P0 |
| PIM-102 | Override an inherited attribute | API | PIM-100 | PUT attributes on a carried product, setting one field | Only that field becomes an override; the rest still resolve from the source | P1 |
| PIM-103 | Carryforward is idempotent | API | PIM-100 | Repeat PIM-100 verbatim | Already-carried SKUs are **skipped silently** (no error, no duplicates) | P1 |
| PIM-104 | Carryforward delta report | API | PIM-102 | GET `/api/pim/v1/products/carryforward/delta?sourceCatalogId=<2026>&targetCatalogId=<2027>` | Reports modified / new / not-carried-forward SKUs; the product you overrode in PIM-102 appears as modified | P1 |
| PIM-105 | Merge inherited attributes | API | PIM-100 | POST `/api/pim/v1/products/{sku}/merge-inherited?userId=qa-tester` | `200`; inherited values are baked into the product's own `attributes` and the carryforward chain is broken | P1 |
| PIM-106 | Source change no longer propagates | API | PIM-105 | Change an attribute on the **source** product, then re-read the merged product | The merged product keeps its baked value — it no longer follows the source | P1 |

### 16.6 Schema Editor (`/pim/schema`)

A genuinely functional drag-and-drop JSON Schema builder — one of the richest working surfaces
in the app. Test it thoroughly.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| SCH-001 | Schema editor loads | UI | — | Open `/pim/schema` | Three columns render: Active Schema + field-type palette, the visual builder, and the field properties panel | P0 |
| SCH-002 | Seeded schema loads | UI | SCH-001 | Choose **Luxury Vehicle v2026** in the schema selector | The builder populates with its attribute groups: General, Performance, Design, Technology, Pricing | P0 |
| SCH-003 | Seeded groups and fields | UI | SCH-002 | Inspect the groups | General contains `name`, `tagline`, `description`, `bodyStyle`, `year`; Performance contains `engineType`, `horsepower`, `torque`, `acceleration0to100`, `topSpeed`, `transmission`; Pricing contains `basePrice_GBP`, `basePrice_EUR`, `basePrice_CAD` | P1 |
| SCH-004 | Schema name / version / description | UI | SCH-002 | Inspect the inline header inputs | Name shows "Luxury Vehicle v2026", version `1.0`; all three are editable | P1 |
| SCH-005 | **JSON view** | UI | SCH-002 | Click the **JSON** toggle | A live-generated, read-only JSON Schema preview is shown, reflecting the current builder state | P0 |
| SCH-006 | JSON view reflects an edit | UI | SCH-005 | Switch to Builder, add a field, then return to JSON view | The new field appears in the JSON | P1 |
| SCH-007 | **Drag a field type onto a group** | UI | SCH-002 | Drag **Text Input** from the palette onto the General group | A new text field is added to that group | P0 |
| SCH-008 | All six field types | UI | SCH-002 | Drag each of Text Input, Numeric, Select, Assets, Date & Time, Relation onto a group | All six add a field of the correct type with the right type icon | P0 |
| SCH-009 | **Add Attribute Group** | UI | SCH-002 | Click **Add Attribute Group** | A new blank group is appended | P0 |
| SCH-010 | Rename a group by double-click | UI | SCH-009 | Double-click the new group's name and type `QA Group` | The name updates inline | P1 |
| SCH-011 | Rename a group via the icon | UI | SCH-009 | Click the group's **Rename** icon | The same inline rename is offered | P2 |
| SCH-012 | Toggle group required | UI | SCH-009 | Click the group's star (**Toggle required**) icon | The required state toggles and is visually indicated | P1 |
| SCH-013 | Delete a group | UI | SCH-009 | Click the group's delete icon | The group and its fields are removed | P1 |
| SCH-014 | **Reorder groups by drag** | UI | SCH-002 | Drag a group by its handle above another group | The group order changes; JSON view reflects the new order | P1 |
| SCH-015 | **Reorder fields by drag** | UI | SCH-002 | Drag a field within a group to a new position | The field order changes within the group | P1 |
| SCH-016 | Move a field between groups | UI | SCH-002 | Drag a field from General into Performance | Record the behaviour: whether cross-group moves are supported, and whether the field survives intact | P1 |
| SCH-017 | Select a field | UI | SCH-002 | Click a field row | The right-hand Field Properties panel populates with that field's values | P0 |
| SCH-018 | Field properties panel empty state | UI | SCH-001 | Deselect / load a schema without selecting a field | Shows "Click a field or drag a type to add one." | P2 |
| SCH-019 | Edit **Label** | UI | SCH-017 | Change the Label and click **Apply Changes** | The field row shows the new label | P0 |
| SCH-020 | Edit **Internal ID** | UI | SCH-017 | Change the Internal ID and Apply | The field's `#slug` updates; JSON view uses the new key | P0 |
| SCH-021 | **Required** toggle | UI | SCH-017 | Turn on Required and Apply | A "Required" badge chip appears on the field row; JSON view lists it in `required` | P1 |
| SCH-022 | **Localized** toggle | UI | SCH-017 | Turn on Localized and Apply | A "Localized" badge chip appears on the field row | P1 |
| SCH-023 | **Validation Regex** | UI | SCH-017 | Enter `^[A-Z]{3}-[0-9]{4}$` and Apply | A "Regex" badge chip appears; the pattern is reflected in JSON view | P1 |
| SCH-024 | **Reset** in the properties panel | UI | SCH-019 | Change several values, then click **Reset** (without applying) | The panel reverts to the field's last-applied values; the field row is unchanged | P1 |
| SCH-025 | Apply is required to commit | UI | SCH-017 | Change the Label but do **not** click Apply; select a different field, then return | Record whether the unapplied edit was discarded or silently kept. Discarding is correct; silently keeping it without Apply is confusing — note either way. | P2 |
| SCH-026 | Delete a field | UI | SCH-002 | Click a field's delete icon | The field is removed from its group and from JSON view | P1 |
| SCH-027 | Inherited vs Local indicator | UI | SCH-002 | Inspect the field rows | Each shows an Inherited or Local indicator | P2 |
| SCH-028 | Schema Summary counts | UI | SCH-002 | Read the Schema Summary card | Field and group counts are live and accurate. **Note:** the progress bar is cosmetic (`fields × 6%`), not a real completeness metric — known gap. | P2 |
| SCH-029 | **New Schema** dialog | UI | SCH-001 | Click **New Schema** | A modal opens with Schema Name and Version inputs plus Cancel / Create Schema | P0 |
| SCH-030 | Create a schema | UI+API | SCH-029 | Enter `QA Schema` / `1.0` and click **Create Schema**; then GET `/api/pim/v1/schemas` | The schema is created via the API and appears in the schema selector | P0 |
| SCH-031 | Cancel the New Schema dialog | UI | SCH-029 | Click **Cancel** | The dialog closes; nothing is created | P1 |
| SCH-032 | Create with an empty name | UI | SCH-029 | Leave the name blank and click Create Schema | Rejected with a clear validation message — not a silent failure and not a nameless schema | P1 |
| SCH-033 | **Save FAB persists the schema** | UI+API | SCH-030, then add a group and two fields | Click the floating **Save** button (bottom-right); then GET `/api/pim/v1/schemas/{id}` | A transient "Saved" pill appears; the API reflects the new groups and fields. **This is the key persistence test for this page.** | P0 |
| SCH-034 | Saved schema survives a reload | UI | SCH-033 | Press F5 and reselect your schema | All groups and fields are still present with their settings | P0 |
| SCH-035 | Save failure is surfaced | UI | Stop the Author service | Click **Save** | A "Failed" pill appears. **It must not falsely report "Saved".** Restart Author afterwards. | P1 |
| SCH-036 | Save is disabled with no schema | UI | SCH-001 | Before selecting any schema, inspect the Save FAB | Disabled | P2 |
| SCH-037 | Switch schemas mid-edit | UI | SCH-033 | Make unsaved changes, then switch to a different schema in the selector | Record whether you are warned. Silent loss of unsaved schema work is at least a Major finding. | P1 |
| SCH-038 | Schema list loading / empty states | UI | — | Hard-reload `/pim/schema` | A loading skeleton appears, then the schema list. With no schemas, a "No schemas yet" empty state. | P2 |
| SCH-039 | Schema versioning via API | API | SCH-030 | POST `/api/pim/v1/schemas/{id}/new-version` with `{"newVersion":"2.0","schemaDef":{...},"userId":"qa-tester"}` | `200/201`; a new version is created that inherits from the parent | P1 |
| SCH-040 | List versions by name | API | SCH-039 | GET `/api/pim/v1/schemas/by-name/QA%20Schema` | Both `1.0` and `2.0` are returned | P1 |
| SCH-041 | Deactivate a schema | API | SCH-030 | POST `/api/pim/v1/schemas/{id}/deactivate` | `200`; the schema is excluded from the active listing | P1 |
| SCH-042 | Deleting a schema in use | API | — | DELETE the **seeded** schema, which the seeded catalog references | Rejected with `409` via a database constraint. **The seeded catalog must survive.** | P1 |
| SCH-043 | Delete an unused schema | API | SCH-030 | DELETE a schema no catalog references | `200`; it is removed | P1 |
| SCH-044 | Schema change affects validation | API | SCH-033 | Add a required numeric field to the seeded schema, save, then PUT a product with a non-numeric value for it | The product update is rejected by schema validation, proving the editor's output really drives validation | P1 |

### 16.7 Import Wizard (`/pim/import`)

A 5-step CSV/JSON/Excel product import.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| IMP-001 | Wizard loads at step 1 | UI | — | Open `/pim/import` | A 5-segment stepper (Upload / Format / Mapping / Preview / Execute) with "STEP 1 OF 5"; step 1 is current | P0 |
| IMP-002 | Target Catalog dropdown | UI | IMP-001 | Open the Target Catalog dropdown | It is populated from the real catalog API and includes **TUT 2026 Model Lineup** | P0 |
| IMP-003 | Select a file by browsing | UI | IMP-002 | Click **browse** and select `qa-products.csv` | The file name and size are displayed | P0 |
| IMP-004 | Select a file by drag-and-drop | UI | IMP-001 | Drag `qa-products.csv` onto the drop zone | The file is accepted | P1 |
| IMP-005 | **Replace file** | UI | IMP-003 | Click **Replace file** | The selection clears so a different file can be chosen | P1 |
| IMP-006 | Next is blocked without input | UI | IMP-001 | Before choosing a catalog and file, click **Next Step** | **Next is disabled** until the step's requirements are met | P1 |
| IMP-007 | Advance to step 2 | UI | IMP-003 | Click **Next Step** | Step 2 (Format) is shown; the stepper marks step 1 complete | P0 |
| IMP-008 | File Format selection | UI | IMP-007 | Click each of CSV / JSON / EXCEL | The selection changes; CSV reveals the delimiter control | P1 |
| IMP-009 | **Delimiter is never sent** | UI | IMP-008 | Choose the semicolon delimiter, complete the import, and inspect the request in F12 → Network | **Known gap (§20).** The delimiter is held in UI state but **never transmitted** — the request carries only `sourceType`. So choosing a delimiter has no effect on parsing. Confirm with a semicolon-delimited file: it will parse incorrectly. | P1 |
| IMP-010 | **"First row is header" is never sent** | UI | IMP-007 | Toggle it off, then import and inspect the request | **Known gap (§20).** Not transmitted — has no effect. Confirm. | P1 |
| IMP-011 | **Encoding is never sent** | UI | IMP-007 | Change the encoding dropdown, then import and inspect the request | **Known gap (§20).** Not transmitted — decorative only. Confirm. | P2 |
| IMP-012 | Advance to step 3 (Mapping) | UI | IMP-007 | Click **Next Step** | Step 3 loads and **automatically calls schema inference** on the uploaded file (visible in F12 → Network as a POST to `/api/pim/v1/imports/infer-schema`) | P0 |
| IMP-013 | Source columns are detected | UI | IMP-012 | Inspect the mapping table | Your CSV's columns (`sku`, `name`, `price`, `description`) are listed, each with a sample value from the file | P0 |
| IMP-014 | Destination dropdown | UI | IMP-013 | Open a row's destination dropdown | 16 destination options are offered, including **"— Skip this column —"** | P1 |
| IMP-015 | Map a column | UI | IMP-014 | Map `sku` → SKU and `name` → Name | Each row's Status indicator changes from "Action Required" to "Mapped" | P0 |
| IMP-016 | Skip a column | UI | IMP-014 | Set `description` to **Skip this column** | The row is marked as skipped and does not count against the unmapped total | P1 |
| IMP-017 | Schema Match progress | UI | IMP-015 | Watch the validation sidebar as you map | The Schema Match percentage rises; once everything is mapped, an "All columns mapped" success banner appears | P1 |
| IMP-018 | Mapping loading / empty states | UI | IMP-012 | Watch step 3 load; then try a file with no detectable columns | A loading skeleton while inferring; a "No columns detected" empty state for an unparseable file | P2 |
| IMP-019 | Mapping Guide link is inert | UI | IMP-013 | Click **View Mapping Guide →** | **Known gap (§20).** Inert — no destination. | P3 |
| IMP-020 | **Step 4 Preview is a placeholder** | UI | IMP-015 | Click **Next Step** to reach step 4 | **Known gap (§20).** Step 4 **never shows real row data** — only a fixed "Preview ready after mapping..." message, regardless of the file. Confirm. This means **you cannot preview what will be imported before committing.** | P1 |
| IMP-021 | Advance to step 5 | UI | IMP-020 | Click **Next Step** | Step 5 (Execute) shows a pre-import summary: Target Catalog, File, Fields Mapped | P0 |
| IMP-022 | **Start Import succeeds** | UI+API | IMP-021 | Click **Start Import** | A progress ring runs; on completion, Created / Updated / Skipped counts are shown. Verify via GET `/api/pim/v1/products?catalogId=<id>` that the products really exist. | P0 |
| IMP-023 | Imported products appear in the UI | UI | IMP-022 | Open `/pim/{catalogId}` | The imported products are listed in the product table | P0 |
| IMP-024 | **View Catalog** link | UI | IMP-022 | Click **View Catalog** | Navigates to `/pim` | P2 |
| IMP-025 | Import with a bad row | UI | IMP-021 | Import `qa-products-bad.csv` (one row missing its SKU) | The result reports the failure — a non-zero Skipped or error count, naming the problem row. **Valid rows must still be imported.** | P0 |
| IMP-026 | Error state and **Retry** | UI | Stop the Author service | Click **Start Import** | An error message appears with a **Retry** button. Restart Author, click Retry, and confirm the import then succeeds. | P1 |
| IMP-027 | **Back** navigation | UI | IMP-021 | Click **Back** repeatedly to step 1 | Each step is revisitable and retains its earlier selections (catalog, file, format, mapping) | P1 |
| IMP-028 | Re-import updates existing products | UI+API | IMP-022 | Change a value in the CSV and import the same file again into the same catalog | Products are matched by SKU and **updated** rather than duplicated. The Updated count is non-zero and Created is 0. | P0 |
| IMP-029 | Import a JSON file | UI | — | Prepare a JSON product file; select JSON in step 2 and import | The import succeeds for JSON as well as CSV | P1 |
| IMP-030 | Import an Excel file | UI | — | Prepare an `.xlsx` product file; select EXCEL and import | The import succeeds for Excel | P1 |
| IMP-031 | Wrong format for the file | UI | IMP-003 | Upload a CSV but select **JSON** as the format | A clear parse error is reported. **Not a 500 and not a silent partial import.** | P1 |
| IMP-032 | Schema inference via API | API | — | POST multipart to `/api/pim/v1/imports/infer-schema?sourceType=CSV` with `qa-products.csv` | `200`; a draft JSON Schema derived from the file's columns | P1 |
| IMP-033 | Import via API | API | — | POST multipart to `/api/pim/v1/imports?catalogId=<id>&sourceType=CSV&userId=qa-tester&skuField=sku&nameField=name&updateExisting=true` | `200` with an `ImportResult` (created / updated / skipped / errors) | P1 |
| IMP-034 | Import into an archived catalog | API | PIM-065 | Import into an `ARCHIVED` catalog | Record the behaviour. Allowing writes into an archived catalog is arguably a finding — note the result either way. | P2 |
---

## 17. Publishing, Replication & Scheduling

Publishing is the point of the whole system, and much of it is observable only outside the UI.

### 17.1 Publishing and replication to the Publish tier

**How it works:** publishing a page fires an event *after the database transaction commits*. A
listener sends a message to RabbitMQ. The Publish tier consumes it and upserts the node. Pages,
site-roots, and XF variations replicate as a **whole subtree** so their components travel with
them; other node types replicate as a single node.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PUB-001 | Publish a page | API | Create `qa-pub-page` with 2 saved components | POST `/api/author/content/node/status?path=content.tut-usa.qa-pub-page&status=PUBLISHED&userId=qa-tester` | `200`; the author-side node status is `PUBLISHED` | P0 |
| PUB-002 | **Page reaches the Publish tier** | API | PUB-001 | Wait a few seconds, then query the Publish service on **:8081** for the same path | The node exists on Publish with status `PUBLISHED`. **This is the core replication test.** | P0 |
| PUB-003 | **Components replicate with the page** | API | PUB-001 | On the Publish tier, fetch the page's full tree | Both child components arrived too — a page must not replicate as a bare shell | P0 |
| PUB-004 | Replication message in RabbitMQ | — | PUB-001 | Open `http://localhost:15672` (guest/guest) → Exchanges → `flexcms.replication` | Message activity is visible on publish | P1 |
| PUB-005 | Replication log entry created | API | PUB-001 | GET `/api/admin/replication/log?page=0&size=10` | A new entry exists for your publish, newest first | P1 |
| PUB-006 | **Replication log status is always PENDING** | API | PUB-005 | Inspect the entry's `status`, and GET `/api/admin/replication/status` | **Known gap (§20).** Every entry stays `PENDING` forever; `completedEvents` and `failedEvents` are permanently `0`, and `pendingEvents` only grows. **Do not use this endpoint to judge whether replication worked** — use PUB-002 instead. Confirm the gap. | P1 |
| PUB-007 | Unpublish deactivates on Publish | API | PUB-002 | POST status `DRAFT` for the same path, then re-query the Publish tier | The node on Publish is deactivated (set back to `DRAFT`) — for the **whole subtree**, not just the root | P0 |
| PUB-008 | Delete removes from Publish | API | PUB-002 | DELETE the node on Author, then query the Publish tier | The node (and its subtree) is removed from Publish | P0 |
| PUB-009 | Archiving deactivates | API | PUB-002 | POST status `ARCHIVED` | The node is deactivated on the Publish tier (any transition *away from* PUBLISHED triggers deactivation) | P1 |
| PUB-010 | Publish via the editor button | UI+API | Editor open on `qa-pub-page` | Click **Publish** in the editor, then check the Publish tier | The same replication happens from the UI path | P0 |
| PUB-011 | Publish via the workflow | API | WF-014 | Advance a workflow to its `published` step, then check the Publish tier | Replication also fires from the workflow path | P0 |
| PUB-012 | Bulk publish replicates each page | API | TREE-090 | Bulk publish two pages, then check both on the Publish tier | Both arrive | P1 |
| PUB-013 | Publish an XF variation | API | XF-023 | Publish an XF variation, then check the Publish tier | The variation replicates as a subtree (like a page), with its components | P1 |
| PUB-014 | A failed transaction does not replicate | API | — | Attempt a publish that fails (e.g. a non-existent path) | No replication message is sent and no node appears on Publish — replication is strictly after-commit | P1 |
| PUB-015 | Content search index follows replication | API | PUB-002 | After publishing, query Elasticsearch (`http://localhost:9200/_search?q=<page name>`) | The content document is indexed. **Note:** the content index is only updated as a side effect of successful replication — there is **no API to rebuild it** (§20). | P2 |

### 17.2 Scheduled publishing (API only)

A background job runs every 60 seconds.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| SPB-001 | Schedule a future publish | API | Create `qa-sched-page` | PUT `/api/author/content/node/schedule-publish?path=content.tut-usa.qa-sched-page&publishAt=<now + 2 minutes, ISO-8601>` | `200`; GET the node and confirm `scheduledPublishAt` is set | P0 |
| SPB-002 | **Scheduled publish fires** | API | SPB-001 | Wait up to ~2.5 minutes, then GET the node | Status has flipped to `PUBLISHED` **automatically**, with no manual action | P0 |
| SPB-003 | Schedule field is cleared after firing | API | SPB-002 | GET the node | `scheduledPublishAt` has been cleared | P1 |
| SPB-004 | Scheduled publish replicates | API | SPB-002 | Check the Publish tier for the node | It arrived — the scheduler uses the same publish path as a manual publish | P0 |
| SPB-005 | Clear a schedule | API | SPB-001 | PUT schedule-publish with a `null` publishAt, then wait 2 minutes | The schedule is cleared and the page is **never** auto-published | P1 |
| SPB-006 | A past date publishes on the next tick | API | Create `qa-sched-past` | PUT schedule-publish with a timestamp in the past; wait up to ~70 seconds | The page is published on the next scheduler tick | P1 |
| SPB-007 | Schedule a deactivation | API | PUB-001 (a published page) | PUT `/api/author/content/node/schedule-deactivate?path=...&deactivateAt=<now + 2 minutes>` | `200`; `scheduledDeactivateAt` is set | P0 |
| SPB-008 | **Scheduled deactivation fires** | API | SPB-007 | Wait up to ~2.5 minutes, then GET the node and check the Publish tier | The status moved away from `PUBLISHED` automatically, and the node was deactivated on Publish | P0 |
| SPB-009 | Both schedules on one node | API | Create `qa-sched-both` | Set publishAt = now + 2 min and deactivateAt = now + 4 min; wait ~5 minutes | The page publishes, then deactivates, in the right order | P1 |
| SPB-010 | Invalid date format | API | — | PUT schedule-publish with `publishAt=not-a-date` | `400` with a clear validation message. **Not a 500.** | P1 |
| SPB-011 | Schedule is not exposed in the UI | UI | SPB-001 | Look for any scheduling control in the editor or Content Tree | **Known gap.** Scheduled publishing has **no UI at all** — record this as a functional gap for authors, who cannot schedule without API access. | P1 |

### 17.3 PIM → CMS bridge

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| PUB-020 | Product publish triggers page replication | API | Create a page whose component properties include `productSku: "TUT-APEX-2026"`, and publish that page | PUT `/api/pim/v1/products/TUT-APEX-2026/status` with `{"status":"PUBLISHED","userId":"qa-tester"}` | Publishing the **product** triggers re-replication of every content page that references that SKU. Check the replication log (PUB-005) for new entries against your page. **This is the only automatic cross-module effect in the system.** | P1 |
| PUB-021 | Unrelated pages are not re-replicated | API | PUB-020 | Publish a product SKU that no page references | No page replication is triggered | P2 |

---

## 18. Content Versioning & Rollback (API only)

Version history has **no UI** — the Content Tree's "Version history" rail icon and the editor's
history controls are inert (§20). These are important authoring features and must be tested via
the API.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| VER-001 | Version history is recorded | API | Create `qa-ver-page`; update its properties three times with different titles | GET `/api/author/content/node/versions?nodeId=<id>&page=0&size=20` | Multiple versions are listed with increasing version numbers | P0 |
| VER-002 | Version numbers are monotonic | API | VER-001 | Inspect the version numbers | They increase by one and are never reused | P1 |
| VER-003 | Versions capture prior values | API | VER-001 | Inspect the stored properties in an early version | The version holds the property values as they were **before** that edit | P0 |
| VER-004 | **Restore a version** | API | VER-001 | POST `/api/author/content/node/restore?nodeId=<id>&versionNumber=1&userId=qa-tester` | `200`; GET the node and confirm `properties` and `resourceType` match version 1 | P0 |
| VER-005 | Restore snapshots the current state first | API | VER-004 | After restoring, GET the version list again | A **new** version was created capturing the pre-restore state, so the restore itself is undoable | P0 |
| VER-006 | Restore does not change the path | API | VER-004 | GET the node | The path, status, and locale are unchanged — restore covers properties and resourceType only | P1 |
| VER-007 | Restore a non-existent version | API | VER-001 | POST restore with `versionNumber=9999` | A clean `404`/`400`. **Not a 500 and not a silent no-op.** | P1 |
| VER-008 | Restored value shows in the UI | UI | VER-004 | Reload `/content` and the editor for that page | The restored values are displayed | P1 |
| VER-009 | No-op edits do not create versions | API | TREE-070 | Note the version count, PUT identical properties, re-check | The count is unchanged — duplicate snapshots are suppressed | P2 |
| VER-010 | Version pagination | API | Make 25 edits to one node | GET versions with `size=10`, pages 0/1/2 | Pagination is correct with no duplicated or skipped versions | P2 |
| VER-011 | No diff endpoint exists | API | VER-001 | Look for any endpoint comparing two versions | **Known gap.** No diff capability exists in either CMS or PIM. Confirm. | P3 |
| VER-012 | Versioning has no UI | UI | VER-001 | Click the "Version history" icon in the Content Tree right rail, and the editor's history control | **Known gap (§20).** Both inert — authors cannot see or restore versions without API access. Record as a functional gap. | P1 |

---

## 19. Other API-Only Authoring Features

These are real, implemented authoring capabilities with **no UI whatsoever**. They must be
covered, and the absence of a UI for each is itself worth recording once as a functional gap.

### 19.1 Content locking / concurrent editing

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| LCK-001 | Lock a node | API | Create `qa-lock-page` | POST `/api/author/content/node/lock?path=content.tut-usa.qa-lock-page&userId=user-a` | `200`; GET the node and confirm `lockedBy` = `user-a` and `lockedAt` is set | P0 |
| LCK-002 | **A different user cannot update** | API | LCK-001 | PUT properties with `"userId":"user-b"` | `409 Conflict` — the lock is enforced | P0 |
| LCK-003 | The lock holder can update | API | LCK-001 | PUT properties with `"userId":"user-a"` | `200`; the update succeeds | P0 |
| LCK-004 | Unlock | API | LCK-001 | POST `/api/author/content/node/unlock?path=...&userId=user-a` | `200`; `lockedBy` and `lockedAt` are cleared | P0 |
| LCK-005 | Update after unlock | API | LCK-004 | PUT properties as `user-b` | `200`; the update now succeeds | P1 |
| LCK-006 | Lock an already-locked node | API | LCK-001 | POST lock as `user-b` | Rejected with a clear conflict — a second user must not be able to steal the lock silently | P1 |
| LCK-007 | Unlock as the wrong user | API | LCK-001 | POST unlock as `user-b` | Record the behaviour. If any user can unlock another's lock, that undermines the whole feature — report it. | P1 |
| LCK-008 | Lock state is visible in the API | API | LCK-001 | GET the node | `lockedBy` and `lockedAt` are present in the response | P2 |
| LCK-009 | **The editor ignores locks** | UI | LCK-001 | With the node locked by `user-a`, open it in the editor, change a property, and click **Save** | **Record precisely what happens.** The editor shows no lock indicator. If the save fails, confirm the error is clearly explained rather than silent. If it *succeeds* despite the lock, that is a Major finding — locking is not enforced through the UI path. | P0 |

### 19.2 Node ACLs / fine-grained permissions

> **`N/A (local-dev)` for enforcement:** in local-dev every request is `ROLE_ADMIN`, and **the
> ADMIN role bypasses ACL evaluation entirely**. You can still verify that ACL entries are
> stored and returned correctly, but you cannot verify that they actually restrict access.
> Mark enforcement cases `N/A` and note that they need a Keycloak-enabled environment.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| ACL-001 | Grant permissions | API | Create `qa-acl-page` | POST `/api/author/acl` with `{"nodePath":"content.tut-usa.qa-acl-page","principal":"user:qa-bob","permissions":["READ","WRITE"],"allow":true,"inherit":true}` | `200/201`; the entry is created | P1 |
| ACL-002 | Read direct ACL entries | API | ACL-001 | GET `/api/author/acl?nodePath=content.tut-usa.qa-acl-page` | The entry you created is returned with both permissions | P1 |
| ACL-003 | Read effective (inherited) entries | API | ACL-001 on a parent; a child node beneath it | GET `/api/author/acl/effective?nodePath=<child path>` | The parent's inheritable entry appears in the child's effective list | P1 |
| ACL-004 | Grant replaces, not merges | API | ACL-001 | POST again for the **same** node and principal with only `["READ"]` | The entry is **replaced** — `WRITE` is gone, not merged | P1 |
| ACL-005 | Empty permissions rejected | API | — | POST an ACL with `"permissions": []` | `400`/`422` — the permission set must be non-empty | P1 |
| ACL-006 | Invalid permission value | API | — | POST with `"permissions":["FLY"]` | `400` with a clear validation message. Not a 500. | P2 |
| ACL-007 | A DENY entry | API | — | POST with `"allow": false` for a principal | The deny entry is stored and returned | P2 |
| ACL-008 | Role and everyone principals | API | — | Create entries for `role:CONTENT_AUTHOR` and for `everyone` | Both principal forms are accepted | P2 |
| ACL-009 | Revoke | API | ACL-001 | DELETE `/api/author/acl?nodePath=...&principal=user:qa-bob` | `200`; the entry no longer appears | P1 |
| ACL-010 | Enforcement | API | ACL-007 | Attempt a denied operation as that principal | **N/A (local-dev)** — ADMIN bypasses ACLs. Record as N/A and flag for a secured environment. | P1 |
| ACL-011 | ACLs have no UI | UI | ACL-001 | Look for any permissions screen in the Admin UI | **Known gap.** There is no ACL UI at all. Record as a functional gap. | P1 |

### 19.3 Content import / export

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| IEX-001 | Export a subtree as JSON | API | A page with components | GET `/api/author/content/export?path=content.tut-usa.home&format=json` | `200`; a JSON download containing the node and its descendants | P0 |
| IEX-002 | Export as ZIP | API | — | GET `/api/author/content/export?path=content.tut-usa.home&format=zip` | `200`; a `.zip` containing a single `content.json` entry | P1 |
| IEX-003 | Export includes components | API | IEX-001 | Inspect the exported JSON | Child component nodes and their properties are present | P0 |
| IEX-004 | Export a non-existent path | API | — | Export a path that does not exist | A clean `404` | P1 |
| IEX-005 | Import a JSON package | API | IEX-001 | POST multipart to `/api/author/content/import` with the exported `.json` and `overwriteExisting=false` | `200` with an `ImportResult` (created / updated / skipped / errors) | P0 |
| IEX-006 | Existing paths are skipped, not errored | API | IEX-005 | Import the same file again with `overwriteExisting=false` | The nodes are reported as **skipped**, not as errors | P1 |
| IEX-007 | Overwrite mode | API | IEX-005 | Edit a title in the exported JSON, then import with `overwriteExisting=true` | The existing node is fully overwritten with the file's values | P0 |
| IEX-008 | Import a ZIP package | API | IEX-002 | Import the `.zip` | Handled identically to JSON (format detected by extension) | P1 |
| IEX-009 | Round-trip to a new location | API | IEX-001 | Export a subtree, edit the paths in the JSON to a new parent, then import | The subtree is recreated at the new location with its structure intact | P1 |
| IEX-010 | Per-node failures are not fatal | API | — | Import a file where one node is malformed | Valid nodes are still imported; the bad node is listed in `errors`. **One bad node must not abort the whole import.** | P1 |
| IEX-011 | Import a corrupt file | API | — | Import a `.json` containing invalid JSON | A clear `400`/`422`. **Not a 500, and no partial garbage written.** | P1 |
| IEX-012 | Import a wrong file type | API | — | Import a `.png` renamed to `.json` | Rejected with a clear message | P2 |
| IEX-013 | Import/export has no UI | UI | IEX-001 | Look for any import or export control for **content** in the Admin UI | **Known gap.** Content import/export is entirely API-only. (The `/pim/import` wizard covers products, not content.) Record as a functional gap. | P1 |

### 19.4 Live Copy / multi-site inheritance

Blueprint-and-rollout inheritance, so one site's content can drive another's.

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| LC-001 | Create a live copy | API | SITE-020 (`qa-site`) | POST `/api/author/livecopy` with `{"sourcePath":"content.tut-usa.home","targetParentPath":"content.qa-site.en","targetName":"home","deep":true,"userId":"qa-tester"}` | `200/201`; the subtree is copied to `content.qa-site.en.home` and a live-copy relationship is registered | P0 |
| LC-002 | Deep copy includes descendants | API | LC-001 | GET the copied subtree | Components and child nodes were copied too | P0 |
| LC-003 | Live copy status | API | LC-001 | GET `/api/author/livecopy/status?targetPath=content.qa-site.en.home` | Confirms it is a live copy and returns the relationship detail | P1 |
| LC-004 | List live copies of a blueprint | API | LC-001 | GET `/api/author/livecopy?sourcePath=content.tut-usa.home` | Your copy is listed | P1 |
| LC-005 | **Rollout propagates changes** | API | LC-001 | Change a property on the blueprint (`content.tut-usa.home`), then POST `/api/author/livecopy/rollout?sourcePath=content.tut-usa.home&userId=qa-tester` | `200`; the live copy now reflects the blueprint's new property value | P0 |
| LC-006 | Rollout with excluded properties | API | — | Create a live copy with `"excludedProps":"jcr:title"`, change the blueprint title, then roll out | All properties update **except** the excluded title | P1 |
| LC-007 | Rollout on a bad blueprint path | API | — | POST rollout with a non-existent `sourcePath` | A clean `404` — not an ambiguous "0 updated" success | P1 |
| LC-008 | Per-copy errors are not fatal | API | LC-001 with two copies | Make one copy un-writable (e.g. lock it), then roll out | The healthy copy still updates; the failure is reported per relationship | P1 |
| LC-009 | Duplicate target rejected | API | LC-001 | Repeat LC-001 verbatim | `409 Conflict` — the target path already exists | P1 |
| LC-010 | Missing source rejected | API | — | POST a live copy with a non-existent `sourcePath` | `404` | P1 |
| LC-011 | **Detach** a live copy | API | LC-001 | DELETE `/api/author/livecopy?targetPath=content.qa-site.en.home&deep=true` | `200`; the relationship is removed but **the content itself remains** | P0 |
| LC-012 | Rollout after detach does nothing | API | LC-011 | Change the blueprint, then roll out | The detached copy is **not** updated — detachment really breaks inheritance | P0 |
| LC-013 | Live copy has no UI | UI | LC-001 | Look for any blueprint/live-copy screen in the Admin UI | **Known gap.** No UI exists. Note that this is closely related to the Editor's inheritance features (§8.8), which *do* have UI — record the inconsistency. | P1 |

### 19.5 Audit log

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| AUD-001 | Actions are audited | API | Create, update, and publish `qa-audit-page` | GET `/api/author/audit?entityType=CONTENT_NODE&page=0&size=20` | Entries exist for your CREATE, UPDATE, and PUBLISH actions, newest first | P1 |
| AUD-002 | Filter by path | API | AUD-001 | GET `/api/author/audit/path/content.tut-usa.qa-audit-page` | Only that node's entries are returned | P1 |
| AUD-003 | Filter by user | API | AUD-001 | GET `/api/author/audit/user/qa-tester` | Only your actions are returned | P1 |
| AUD-004 | Filter by action | API | AUD-001 | GET `/api/author/audit?action=PUBLISH` | Only publish events are returned | P1 |
| AUD-005 | Filter by date range | API | AUD-001 | GET `/api/author/audit?from=<today ISO>&to=<tomorrow ISO>` | Only today's entries are returned | P2 |
| AUD-006 | Audit entries are immutable | API | AUD-001 | Try POST, PUT, and DELETE against `/api/author/audit` | All rejected — the audit trail is append-only from within the application | P1 |
| AUD-007 | Delete is audited | API | Delete a `qa-` page | GET the audit log filtered by `action=DELETE` | The deletion is recorded | P1 |
| AUD-008 | Lock/unlock is audited | API | LCK-001, LCK-004 | Filter the audit log by `action=LOCK` and `UNLOCK` | Both are recorded | P2 |
| AUD-009 | Audit log has no UI | UI | AUD-001 | Look for an audit/activity-log screen. Also click "View Complete Activity Logs" on the Dashboard. | **Known gap (§20).** The Dashboard link is inert and there is no audit UI. Record as a functional gap. | P1 |

---

## 20. Known Gaps Register

Everything in this section is **already known**. For each case, the expected result is that the
control is **inert or absent**, so confirming that is a **PASS**.

> **Report a finding here only if the behaviour is *worse* than described** — for example, a
> button listed as inert that actually deletes data, or a button that throws a visible error
> instead of doing nothing.
>
> Some entries are marked **⚑ file once**. These are known gaps that nonetheless cause real user
> harm (silent loss of work, visibly wrong data). File **one** consolidated finding for each,
> then move on.

### 20.1 Phantom routes — linked in the UI but not implemented

| ID | Route | Linked from | Expected | Pri |
|---|---|---|---|---|
| GAP-001 | `/settings` | Sidebar "Settings" + top-bar gear icon | 404 or empty page | P2 |
| GAP-002 | `/login/forgot-password` | Login page "Forgot Password?" | 404 | P3 |
| GAP-003 | `/privacy`, `/status`, `/support` | Login page footer links | 404 | P3 |
| GAP-004 | `/sites/{id}` | No such route — site rows and cards do not drill in | No navigation, or 404 | P2 |

### 20.2 Global chrome stubs

| ID | Control | Location | Expected | Pri |
|---|---|---|---|---|
| GAP-010 | Global search box ("Quick search… ⌘K") | Top bar | Typing does nothing; no results, no `⌘K` shortcut | P2 |
| GAP-011 | Notifications bell | Top bar | Static unread dot; no click behaviour | P3 |
| GAP-012 | Theme toggle (contrast icon) | Top bar | Inert — no theme change | P3 |
| GAP-013 | User avatar / menu | Top bar | No dropdown opens | P3 |
| GAP-014 | System Health widget ("92% healthy") | Sidebar bottom | Static; not live data | P3 |

### 20.3 Whole pages and sections that are non-functional

| ID | Area | Expected | Pri |
|---|---|---|---|
| GAP-020 | **Translations page** (`/translations`) | No data fetch exists at all — permanently empty regardless of backend data (§15) | P1 |
| GAP-021 | **Import Wizard step 4 (Preview)** | Never shows real row data; only a fixed placeholder message — you cannot preview an import before committing ⚑ **file once** | P1 |
| GAP-022 | **DAM Asset Detail metadata form** | Save/Discard are inert and no metadata-update endpoint exists, so all edits are silently lost on reload ⚑ **file once** | P1 |
| GAP-023 | **Editor Assets tab** | Only a static link to `/dam` — no in-editor asset browser or picker | P1 |
| GAP-024 | **DAM Asset Detail preview surface** | A static gradient placeholder; the real image is never rendered | P1 |
| GAP-025 | **DAM Renditions panel** | Always empty, even though renditions really are generated | P1 |
| GAP-026 | **DAM Usage References panel** | Always empty, even when the asset is in use | P1 |

### 20.4 Inert buttons and menus (no handler wired)

| ID | Controls | Location | Pri |
|---|---|---|---|
| GAP-030 | **+ Create New Page**, Publish All, Filter/Sort/More toolbar icons | Content Tree | P1 |
| GAP-031 | Row menu: Publish, Duplicate, Move, **Delete** | Content Tree row `⋮` | P1 |
| GAP-032 | Right context rail (Version history, Page info, Comments, Settings) | Content Tree, Experience Fragments | P3 |
| GAP-033 | Filter, Export, "View Complete Activity Logs", row `…` | Dashboard | P3 |
| GAP-034 | **Create New Site**, Publish Selected, and the **entire** row menu (Open, Edit Settings, Publish Now, Duplicate, Go Offline, Delete) | Sites | P1 |
| GAP-035 | Filters, Export | Workflows header | P3 |
| GAP-036 | Import Schema, Register Component, quick-action cards | Component Registry | P2 |
| GAP-037 | **+ Create Fragment**, Manage Channels, toolbar icons | Experience Fragments | P1 |
| GAP-038 | Bulk Download, bulk Move, Archive, Trash | DAM | P2 |
| GAP-039 | Preview toolbar (Zoom in/out, Crop, Colour adjust, Fullscreen); right rail (Version History, Comments, Share, **Delete Asset**); Advanced IPTC/XMP toggle | DAM Asset Detail | P2 |
| GAP-040 | Export, Create Catalog, Filter icon, and the **entire** row menu (View Details, Edit Catalog, Duplicate, Export CSV, Delete) | PIM Catalog List | P1 |
| GAP-041 | Publish, Archive, Export, Carryforward, the entire product row menu, quick-action cards | PIM Catalog Detail | P1 |
| GAP-042 | Version History, Add Variant, variant Edit pencil, Add Media, Open DAM Picker, Preview Live Store, **Archive Product**, **Delete Product** | PIM Product Editor | P1 |
| GAP-043 | Import Translations, Export XLIFF | Translations | P2 |
| GAP-044 | View Mapping Guide link | Import Wizard step 3 | P3 |
| GAP-045 | Settings gear | Editor top bar | P3 |

> **GAP-031, GAP-042 — safety check.** These lists include inert **Delete** controls. Confirm
> they are genuinely inert. **If any of them actually deletes something — especially without a
> confirmation dialog — stop and report it immediately as a Blocker.**

### 20.5 Hardcoded / placeholder data — do not test for correctness

| ID | Data | Location | Pri |
|---|---|---|---|
| GAP-050 | Workflows and Storage Used stats (always `—`); Content Updates chart; Smart Tasks panel | Dashboard | P3 |
| GAP-051 | Performance Index (always `94/100`) | Content Tree | P3 |
| GAP-052 | Pages count (always `0`, despite `tut-usa` having 9 pages) | Sites | P1 |
| GAP-053 | Last Modified / Last Modified By (always `—`); status always `active`, so Draft and Deprecated counts always read `0` | Component Registry | P2 |
| GAP-054 | Product Count (always `0`, despite 4 real products) | PIM Catalog List | P1 |
| GAP-055 | Completion Rate, Stock Value, Pending Sync, Missing Thumbnails (all 0/static); Price (always `$0.00`), Stock (always `0`), Schema (always blank), Total Inventory (always `$0.00`) | PIM Catalog Detail | P1 |
| GAP-056 | Breadcrumb reads "Electronics" / "X-Series OLED" regardless of the real catalog and product ⚑ **file once** | PIM Product Editor | P1 |
| GAP-057 | Technical Specs: Resolution "3840 x 2160 (4K)" and Refresh Rate "120Hz Native" hardcoded (TV specs on a vehicle); Panel Type/HDR/Connectivity/Weight are hardcoded defaults ⚑ **file once** | PIM Product Editor | P1 |
| GAP-058 | Localization tab's four locale fields contain hardcoded sample translations and are never saved ⚑ **file once** | PIM Product Editor | P1 |
| GAP-059 | Storefront Sync channel dots (Shopify/Amazon/Walmart) are static | PIM Product Editor | P3 |
| GAP-060 | Colour Space (always `sRGB`) | DAM Asset Detail | P3 |
| GAP-061 | Schema Summary progress bar is cosmetic (`fields × 6%`), not a real completeness metric | PIM Schema Editor | P3 |

### 20.6 Controls whose value is captured but never sent to the backend

| ID | Control | Location | Effect | Pri |
|---|---|---|---|---|
| GAP-070 | Column Delimiter | Import Wizard step 2 | Never transmitted — a semicolon-delimited file parses incorrectly regardless of the selection | P1 |
| GAP-071 | "First row is header" toggle | Import Wizard step 2 | Never transmitted — no effect | P1 |
| GAP-072 | Character Encoding | Import Wizard step 2 | Never transmitted — decorative | P2 |
| GAP-073 | Rows-per-page selector | Component Registry | Not read; page size is fixed | P2 |
| GAP-074 | Pagination page buttons | Component Registry | Change page state but the table renders the full list unsliced, so visible rows never change | P1 |
| GAP-075 | Season filter options | PIM Catalog List | A hardcoded list, not derived from data — may match nothing | P2 |
| GAP-076 | Catalog Name sort header | PIM Catalog List | Sort icon is decorative; clicking does not sort | P2 |
| GAP-077 | Sort by Newest First / Deadline | Workflows | Both are no-ops; original order is kept | P2 |

### 20.7 Implemented backend features with no way to reach them

| ID | Capability | Gap | Pri |
|---|---|---|---|
| GAP-080 | **i18n dictionary CRUD** (set/import/get translations) | Service fully implemented; **no REST endpoint** — this is why the Translations page is empty | P1 |
| GAP-081 | **Machine translation** (DeepL connector) | Connector fully wired; **no REST endpoint** | P1 |
| GAP-082 | **On-demand DAM renditions** (`hero-desktop`, `hero-mobile`, `og-image`) | Implemented and unit-tested; **no controller** — only the 4 auto profiles are obtainable | P2 |
| GAP-083 | **Content search index rebuild** | Implemented; **no controller**. Contrast with PIM, whose reindex endpoints work. The content index only updates as a side effect of replication, so if replication fails the index goes stale silently. | P1 |
| GAP-084 | **DAM asset replication to Publish** | Implemented but never invoked by upload or delete — **assets never reach the Publish tier** | P1 |
| GAP-085 | **Content versioning UI** | Fully working API; no UI at all (§18) | P1 |
| GAP-086 | **Scheduled publishing UI** | Fully working API + scheduler; no UI at all (§17.2) | P1 |
| GAP-087 | **ACL / permissions UI** | Fully working API; no UI at all (§19.2) | P1 |
| GAP-088 | **Content import/export UI** | Fully working API; no UI at all (§19.3) | P1 |
| GAP-089 | **Live copy / blueprint UI** | Fully working API; no UI at all (§19.4) | P1 |
| GAP-090 | **Audit log UI** | Fully working API; no UI, and the Dashboard's activity-log link is inert (§19.5) | P1 |
| GAP-091 | **Template / component registration** | Templates and components are seed-data only — no write API and no UI | P2 |

### 20.8 Behavioural gaps and spec mismatches

| ID | Issue | Where | Expected during testing | Pri |
|---|---|---|---|---|
| GAP-100 | **Replication log status never advances** past `PENDING`; completed/failed counters are permanently `0` | `/api/admin/replication/status` | Confirm. Do not use it as a replication oracle. | P1 |
| GAP-101 | **Workflow `for-user` ignores the userId** — returns all ACTIVE instances, so the "inbox" is not per-user | `/api/author/workflow/for-user` | Confirm | P1 |
| GAP-102 | **Workflows never auto-complete** — the seeded definition has no `end` step, so instances stay `ACTIVE` forever | Workflow engine | Confirm | P2 |
| GAP-103 | **Only-one-ACTIVE-catalog-per-year is documented but not enforced** | PIM catalogs | ✅ **FIXED 2026-09-14** (BUGS_AND_FINDINGS.md). Activating a catalog now checks `findByYearAndStatus` for the same year and rejects with `409` if another is already ACTIVE. Confirm two can no longer both be activated (PIM-064). | P1 |
| GAP-104 | **Product asset links are not validated** against DAM — a bogus path is accepted | PIM asset refs | Confirm | P1 |
| GAP-105 | **PIM has no role-based authorization at all** — any authenticated user can write anything | All PIM endpoints | `N/A (local-dev)`; flag for a secured environment | P1 |
| GAP-106 | **PIM and workflow errors return HTTP 500** instead of 404/409 for ordinary user errors (product not found, catalog not found, invalid workflow action, duplicate site) | PIM + workflow + site endpoints | Record the actual status in each affected case. This is a real API-quality defect worth **one** consolidated finding. ⚑ **file once** | P1 |
| GAP-107 | **Trailing slashes return 500** rather than 404 on several endpoints | `/api/pim/v1/products/`, `/api/author/xf/` | ✅ **PARTIALLY FIXED 2026-09-14.** `NoResourceFoundException` (the PIM case) now maps to a proper `404` (PIM-091). `/api/author/xf/` turned out to already be `404` — it matches an empty `{xfPath}` path variable rather than hitting `NoResourceFoundException`, so only its message is confusing (XF-039), not its status. | P2 |
| GAP-108 | **Direct status endpoint performs no state-machine validation** — any status can go to any other, bypassing approval entirely | `/api/author/content/node/status` | This is documented behaviour. Confirm it works; do not report as a bug, but note the governance implication. | P2 |
| GAP-109 | **Workflow approve/reject in the UI reports success even when the API call fails** | Workflows page | Confirm (WF-013) and report — silent false success is a genuine defect ⚑ **file once** | P0 |
| GAP-110 | **Asset search silently defaults to `siteId=corporate` when omitted** | `GET /api/author/assets?q=...` | ✅ **FIXED 2026-09-14** (BUGS_AND_FINDINGS.md). Omitting `siteId` with `q` now returns `422` with a clear message instead of silently searching `"corporate"`. Confirm via DAM-095. No Admin UI impact either way — its DAM search filters client-side and never calls this parameter. | P2 |

---

## 21. Cross-Cutting Tests

### 21.1 Error handling and resilience

| ID | Test Case | Track | Pre | Steps | Expected Result | Pri |
|---|---|---|---|---|---|---|
| XC-001 | Backend down on every page | UI | Stop the Author service | Visit `/dashboard`, `/content`, `/sites`, `/workflows`, `/components`, `/experience-fragments`, `/dam`, `/pim` in turn | **Every** page shows a clear error or empty state. **None** may show a blank screen, an infinite spinner, or a raw stack trace. List any page that fails this. Restart Author afterwards. | P0 |
| XC-002 | Backend recovery | UI | XC-001 | Restart Author, then reload each page | All pages recover without needing a browser restart or cache clear | P1 |
| XC-003 | Error bodies are well-formed | API | — | Trigger several errors (404, 409, 422) | Every response is RFC-7807 shaped with `errorCode`, `correlationId`, and `timestamp` | P1 |
| XC-004 | No stack traces leak to the client | API | — | Trigger a 500 (e.g. GAP-107) | The response body carries a generic message and a `correlationId` — **never** a Java stack trace or SQL text | P0 |
| XC-005 | No internal details in the UI | UI | XC-001 | Inspect any error message shown in the UI | No Java class names, SQL, file paths, or stack traces are shown to the user | P1 |
| XC-006 | Slow network | UI | F12 → Network → throttle to "Slow 3G" | Load `/content` and `/components` | Loading states are shown; the UI stays usable; nothing times out into a broken state | P2 |
| XC-007 | Elasticsearch down | UI+API | Stop the elasticsearch container | Use PIM product search (PIM-085) | A clear failure or degraded result — not a crash of the whole PIM page. Restart the container afterwards. | P1 |
| XC-008 | RabbitMQ down | API | Stop the rabbitmq container | Publish a page (PUB-001) | Record the behaviour: the publish should either fail clearly or succeed locally with replication deferred. **A silent success that never replicates and gives no warning is a Major finding.** Restart the container afterwards. | P1 |
| XC-009 | Redis down | UI | Stop the redis container | Browse the Admin UI | The app degrades gracefully. Restart afterwards. | P2 |
| XC-010 | MinIO down | UI | Stop the minio container | Try a DAM upload (DAM-011) | A clear failure. **Not a silent success that loses the file.** Restart afterwards. | P1 |

### 21.2 Input validation (apply across all forms)

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| XC-020 | Empty required fields | UI | Submit each significant form with required fields blank (New Schema dialog, DAM upload, PIM product editor, Import Wizard) | A clear per-field validation message. **No silent failure and no server 500.** | P1 |
| XC-021 | Whitespace-only input | UI | Enter only spaces into required text fields | Treated as empty and rejected — not accepted as a valid value | P2 |
| XC-022 | Leading/trailing whitespace | UI | Enter `  qa-test  ` into a name field and save | Record whether it is trimmed. Untrimmed names that create odd paths are a finding. | P2 |
| XC-023 | Maximum length | UI | Paste 10,000 characters into a text field | Either a clear length limit is enforced, or it is stored intact. **No truncation without warning and no crash.** | P2 |
| XC-024 | SQL-injection-style input | UI+API | Enter `'; DROP TABLE content_nodes; --` into a title field, save, and reload | Stored and displayed as **literal text**. The database is unaffected. Verify via pgAdmin that tables still exist. | P0 |
| XC-025 | XSS in a text field | UI+API | Enter `<img src=x onerror=alert(1)>` into a title, save, then view it in the Content Tree, the editor, and Preview | **No alert fires anywhere.** The value is escaped or sanitized. **A firing alert is a Critical security finding.** | P0 |
| XC-026 | XSS in a rich-text field | UI+API | EDIT-090 / TREE-069 | The `<script>` is sanitized server-side | P0 |
| XC-027 | Unicode and emoji | UI | Enter `Grüße 日本語 🚗` into text fields, save, and reload | Preserved exactly, with no mojibake, in both the UI and the API response | P1 |
| XC-028 | Path-traversal input | API | Create a node with `"name":"../../etc/passwd"` | Sanitized or rejected — **it must not escape the content tree**. Verify the resulting path. | P0 |
| XC-029 | Very large numbers | UI | Enter `99999999999999999999` in a numeric field | Handled cleanly — rejected or stored — with no overflow and no crash | P2 |
| XC-030 | Negative numbers | UI | Enter `-100` into MSRP and into a component's price field | Either rejected with a message, or accepted. Record which — a negative price accepted silently is a finding. | P2 |

### 21.3 Accessibility

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| XC-040 | Keyboard-only navigation | UI | Using only Tab / Shift+Tab / Enter / Space / arrows, navigate `/content` and open a row's action menu | All interactive controls are reachable and operable; focus order follows the visual order | P1 |
| XC-041 | Visible focus indicator | UI | Tab through each page | Every focused control has a clearly visible focus ring | P1 |
| XC-042 | Escape closes overlays | UI | Open the schema modal, the DAM upload dialog, and a row action menu; press Escape on each | Each closes without performing an action | P1 |
| XC-043 | Focus is trapped in modals | UI | Open the DAM upload dialog and Tab repeatedly | Focus stays within the dialog and does not escape to the page behind | P2 |
| XC-044 | Focus returns after closing | UI | Open and close a modal | Focus returns to the control that opened it | P2 |
| XC-045 | Form labels | UI | Inspect each form field | Every input has a visible, associated label — not placeholder text alone | P1 |
| XC-046 | Error announcement | UI | Trigger a validation error | The error is associated with its field and is not conveyed by colour alone | P2 |
| XC-047 | Images have alt text | UI | Inspect DAM thumbnails and component images | Meaningful `alt` text or an explicit decorative marking | P2 |
| XC-048 | Colour contrast | UI | Run browser DevTools' accessibility/contrast check on `/content` and `/pim` | Text meets WCAG AA contrast. List any failures. | P2 |
| XC-049 | Status is not colour-only | UI | Inspect status badges in the Content Tree and Sites | Status is conveyed by text as well as colour | P2 |
| XC-050 | Zoom to 200% | UI | Set browser zoom to 200% on `/content` | Content remains readable and usable; nothing is clipped or unreachable | P2 |

### 21.4 Design-system conventions

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| XC-060 | Every page has a breadcrumb | UI | Visit all admin pages | Present everywhere (NAV-008) | P2 |
| XC-061 | Every data page has an empty state | UI | Reach the empty state of each list (search for `zzzznotfound`) | Every list has a purposeful empty state — never a blank region | P1 |
| XC-062 | Every data page has a loading state | UI | Hard-reload each data page | A skeleton or spinner appears before content | P2 |
| XC-063 | Empty vs. error are distinguishable | UI | Compare a genuinely-empty list against the same list with the backend stopped | "No results" and "failed to load" are clearly different messages. Conflating them is a finding. | P1 |
| XC-064 | Consistent date formatting | UI | Compare Last Modified / Uploaded / Last Sync across Content Tree, DAM, Sites, and PIM | Dates use a consistent format across the app | P3 |
| XC-065 | Consistent button placement | UI | Compare primary/secondary button order across dialogs | Consistent ordering | P3 |
| XC-066 | Destructive actions are confirmed | UI | Attempt every **working** delete (DAM-056, DAM-060, XF-024) | Each asks for confirmation, or is trivially undoable. **An unconfirmed working delete is a Major finding.** | P0 |
| XC-067 | Terminology is consistent | UI | Look for status wording across pages | "Published" is used consistently. If some places say "Live" (§2), record it as a terminology inconsistency. | P3 |

### 21.5 End-to-end authoring journeys

Run these last. They chain features together the way a real author would, and often surface
integration problems the isolated cases miss.

| ID | Journey | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| E2E-001 | **Create → build → publish → verify** | UI+API | 1. Create `qa-journey-1` via API (TREE-060). 2. Open it in the editor. 3. Add four components from different groups. 4. Fill in properties on each. 5. Reorder them. 6. Save. 7. Preview in Draft. 8. Publish. 9. Preview in Live. 10. Confirm the node on the Publish tier. | The page is authored, published, replicated, and visible on Publish with all four components in the final order and with the correct property values | P0 |
| E2E-002 | **Full approval workflow** | UI+API | 1. Create `qa-journey-2`. 2. Add and save components. 3. Start a `standard-publish` workflow via API. 4. In the Workflow Inbox, approve it. 5. Advance to `publish` via API. 6. Verify on the Publish tier. | The content moves DRAFT → IN_REVIEW → APPROVED → PUBLISHED through the workflow, and replicates | P0 |
| E2E-003 | **Asset into a page** | UI | 1. Upload `qa-image-small.png` to DAM. 2. Confirm renditions were generated. 3. Copy its URL. 4. Add an image component to a page and set the image. 5. Save and preview. | The image renders in the preview. **Record how many manual steps the missing asset picker (GAP-023) costs.** | P0 |
| E2E-004 | **Experience Fragment reuse** | UI | 1. Edit the Global Navigation fragment; add a component. 2. Save. 3. Open two different `tut-usa` pages. 4. Confirm both show the change in their locked Navigation band. 5. Publish the fragment. | One fragment edit propagates to every page that uses it | P0 |
| E2E-005 | **Multi-site rollout** | API | 1. Create `qa-site` (SITE-020). 2. Live-copy a `tut-usa` page into it (LC-001). 3. Change the blueprint. 4. Roll out. 5. Confirm the copy updated. 6. Detach. 7. Change the blueprint again and confirm the copy no longer follows. | Blueprint inheritance works and detachment genuinely breaks it | P1 |
| E2E-006 | **Language copy and independent publish** | API | 1. Create `qa-site` with `en` + `de`. 2. Author a page in `en`. 3. Create the `de` language copy. 4. Publish only `de`. | The `de` copy exists as DRAFT, then publishes independently while `en` stays DRAFT | P1 |
| E2E-007 | **Product to page** | UI+API | 1. Create a catalog and schema. 2. Import products from CSV. 3. Edit one product and Save Draft. 4. Publish it. 5. Create a page with a component referencing that SKU. 6. Publish the page. 7. Republish the product and confirm the page re-replicates (PUB-020). | PIM and CMS integrate: a product publish drives re-replication of the pages that reference it | P1 |
| E2E-008 | **Schema drives validation** | UI+API | 1. In the Schema Editor, add a required numeric field to a schema and save. 2. Try to import a CSV with a non-numeric value in that column. 3. Try the same via a direct product PUT. | The schema you built in the UI really governs product validation in both paths | P1 |
| E2E-009 | **Version and roll back** | API | 1. Create a page. 2. Edit its properties three times. 3. Inspect the version list. 4. Restore version 1. 5. Confirm the values. 6. Restore the post-restore version to get back to the latest. | Version history is complete and both directions of rollback work | P0 |
| E2E-010 | **Schedule and walk away** | API | 1. Create a page and add components. 2. Schedule publish for now + 2 min. 3. Schedule deactivate for now + 4 min. 4. Wait ~5 min, checking the node and the Publish tier at each stage. | The page publishes and then deactivates automatically, with replication at both transitions | P1 |
| E2E-011 | **Concurrent editors** | UI+API | 1. Lock a page as `user-a` (LCK-001). 2. Open it in the editor and try to save. 3. Also open the same page in two browser tabs and save from both (EDIT-130). | Record precisely what happens. Any path that silently loses an author's work is at least a Major finding. | P0 |
| E2E-012 | **Export, import, verify** | API | 1. Author a page with components. 2. Export it as ZIP. 3. Delete the page. 4. Import the ZIP. 5. Compare against the original. | The page is fully restored, including all components and properties | P1 |

---

## 22. Test Execution Log

Copy this table into your test report and fill in one row per test case executed.

| ID | Result | Tester | Date | Browser | Finding ID | Notes |
|---|---|---|---|---|---|---|
| ENV-001 | | | | | | |
| ENV-002 | | | | | | |
| … | | | | | | |

### 22.1 Session summary template

```
TEST SESSION SUMMARY
Tester:            
Date:              
Build / commit:    
Environment:       Local (Author :8080, Publish :8081, Admin UI :3000)
Browser(s):        

Baseline check:    Seed data matched §3.5?   Yes / No — if No, describe:

Coverage
  Total cases in scope:      
  Executed:                  
  PASS:                      
  FAIL:                      
  BLOCKED:                   
  N/A:                       
  Not executed (with reason):

Findings raised
  Blocker:    
  Critical:   
  Major:      
  Minor:      
  Cosmetic:   
  Total:      

Top 5 risks in this build (tester's judgement):
  1.
  2.
  3.
  4.
  5.

Areas needing a second pass:

Notes for the next tester:
```

### 22.2 Coverage map

Use this to confirm nothing was skipped wholesale.

| § | Area | ID prefix | Cases | Executed | Pass | Fail |
|---|---|---|---|---|---|---|
| 4 | Environment smoke | `ENV-` | 15 | | | |
| 5 | Navigation & shell | `NAV-` | 16 | | | |
| 6 | Dashboard | `DSH-` | 12 | | | |
| 7 | Content Tree | `TREE-` | 73 | | | |
| 8 | Page Editor | `EDIT-` | 113 | | | |
| 9 | Preview | `PRV-` | 21 | | | |
| 10 | Workflows | `WF-` | 37 | | | |
| 11 | Component Registry | `COMP-` | 27 | | | |
| 12 | Experience Fragments | `XF-` | 38 | | | |
| 13 | DAM | `DAM-` | 67 | | | |
| 14 | Sites | `SITE-` | 28 | | | |
| 15 | Translations | `TRN-` | 9 | | | |
| 15.1 | Language copy | `I18N-` | 8 | | | |
| 16.1–16.5 | PIM catalogs & products | `PIM-` | 88 | | | |
| 16.6 | PIM Schema Editor | `SCH-` | 44 | | | |
| 16.7 | PIM Import Wizard | `IMP-` | 34 | | | |
| 17 | Publishing & replication | `PUB-` | 17 | | | |
| 17.2 | Scheduled publishing | `SPB-` | 11 | | | |
| 18 | Versioning & rollback | `VER-` | 12 | | | |
| 19.1 | Locking | `LCK-` | 9 | | | |
| 19.2 | ACLs | `ACL-` | 11 | | | |
| 19.3 | Import / export | `IEX-` | 13 | | | |
| 19.4 | Live copy | `LC-` | 13 | | | |
| 19.5 | Audit log | `AUD-` | 9 | | | |
| 20 | Known gaps register | `GAP-` | 75 | | | |
| 21.1–21.4 | Cross-cutting | `XC-` | 40 | | | |
| 21.5 | End-to-end journeys | `E2E-` | 12 | | | |
| | **Total** | | **852** | | | |

Of these, **75 are Known Gaps Register entries** (§20) that only confirm known-inert behaviour,
leaving **777 functional test cases**.

**Rough effort estimate:** a full pass is about **5–7 working days** for one tester. If you have
less time, run in this order: all **P0** cases (~1.5 days) → **P1** (~2.5 days) → §21.5
end-to-end journeys → then P2/P3.

---

## 23. Appendix — Quick Reference

### 23.1 Seeded content paths

```
content
├── tut-usa
│   ├── home                        (template: global-home-page)
│   ├── vehicles                    (model-overview-page)
│   ├── innovation                  (innovation-hub-page)
│   ├── news-and-updates            (news-updates-landing-page)
│   ├── owners                      (owners-hub-landing-page)
│   ├── offers-and-finance          (offers-financing-leasing-page)
│   ├── accessories                 (accessories-lifestyle-collection-page)
│   ├── learn                       (learning-education-hub-page)
│   └── contact-and-concierge       (contact-concierge-support-page)
└── experience-fragments
    └── tut-usa
        └── global
            ├── navigation
            │   └── master
            └── footer
                └── master
```

All nine pages are `DRAFT` with **no components**. Locale `en` is a property, not a path segment.

### 23.2 Most-used API calls

```bash
# Read a node
curl "http://localhost:8080/api/author/content/node?path=content.tut-usa.home"

# Read a page with its component tree
curl "http://localhost:8080/api/author/content/page?path=content.tut-usa.home"

# List direct children
curl "http://localhost:8080/api/author/content/children?path=content.tut-usa"

# List all nodes
curl "http://localhost:8080/api/author/content/list?page=0&size=50"

# Create a page
curl -X POST "http://localhost:8080/api/author/content/node" \
  -H "Content-Type: application/json" \
  -d '{"parentPath":"content.tut-usa","name":"qa-page","resourceType":"flexcms/page","properties":{"jcr:title":"QA Page","siteId":"tut-usa","template":"default-page"},"userId":"qa-tester"}'

# Update properties (partial merge)
curl -X PUT "http://localhost:8080/api/author/content/node/properties" \
  -H "Content-Type: application/json" \
  -d '{"path":"content.tut-usa.qa-page","properties":{"jcr:title":"QA Renamed"},"userId":"qa-tester"}'

# Publish
curl -X POST "http://localhost:8080/api/author/content/node/status?path=content.tut-usa.qa-page&status=PUBLISHED&userId=qa-tester"

# Delete
curl -X DELETE "http://localhost:8080/api/author/content/node?path=content.tut-usa.qa-page&userId=qa-tester"

# Version history / restore
curl "http://localhost:8080/api/author/content/node/versions?nodeId=<id>&page=0&size=20"
curl -X POST "http://localhost:8080/api/author/content/node/restore?nodeId=<id>&versionNumber=1&userId=qa-tester"

# Lock / unlock
curl -X POST "http://localhost:8080/api/author/content/node/lock?path=content.tut-usa.qa-page&userId=user-a"
curl -X POST "http://localhost:8080/api/author/content/node/unlock?path=content.tut-usa.qa-page&userId=user-a"

# Sites, components, templates
curl "http://localhost:8080/api/admin/sites"
curl "http://localhost:8080/api/content/v1/component-registry"
curl "http://localhost:8080/api/author/content/templates"

# Experience Fragments  (NOTE: no trailing slash — see XF-039)
curl "http://localhost:8080/api/author/xf?siteId=tut-usa&locale=en"

# Assets  (NOTE: no trailing slash)
curl "http://localhost:8080/api/author/assets?page=0&size=20"
curl -X POST "http://localhost:8080/api/author/assets" \
  -F "file=@qa-image-small.png" -F "path=/qa" -F "siteId=tut-usa" -F "userId=qa-tester"

# PIM  (NOTE: no trailing slash — see PIM-091)
curl "http://localhost:8080/api/pim/v1/catalogs"
curl "http://localhost:8080/api/pim/v1/schemas"
curl "http://localhost:8080/api/pim/v1/products?catalogId=<id>&page=0&size=100"

# Workflow
curl -X POST "http://localhost:8080/api/author/workflow/start" \
  -H "Content-Type: application/json" \
  -d '{"workflowName":"standard-publish","contentPath":"content.tut-usa.qa-page","userId":"qa-tester"}'
curl -X POST "http://localhost:8080/api/author/workflow/advance" \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"<id>","action":"submit","userId":"qa-tester"}'

# Replication monitoring  (status field is unreliable — see GAP-100)
curl "http://localhost:8080/api/admin/replication/status"
curl "http://localhost:8080/api/admin/replication/log?page=0&size=20"

# Audit
curl "http://localhost:8080/api/author/audit?entityType=CONTENT_NODE&page=0&size=20"
```

### 23.3 Gotchas that will waste your time

1. **No trailing slashes.** `/api/pim/v1/products/` and `/api/author/xf/` return `500`/`404`.
   Drop the slash (GAP-107).
2. **Pages have no locale segment.** It is `content.tut-usa.home`, not `content.tut-usa.en.home`.
3. **Pages start empty.** An empty editor canvas is the correct baseline, not a bug.
4. **`PUBLISHED`, never `LIVE`.**
5. **Don't trust the replication status endpoint.** Check the Publish tier directly (GAP-100).
6. **Many buttons are inert by design.** Check §20 before filing.
7. **The Sites page count is always 0** and **PIM prices are always $0.00** — hardcoded (§20.5).
8. **Scheduled jobs run every 60 seconds.** Allow up to ~70s before calling a schedule broken.
9. **Local-dev grants ROLE_ADMIN to everyone**, which also **bypasses ACL checks entirely**.
10. **Only `tut-usa` has content**, though 5 sites are listed. That is correct.
11. **Always pass `siteId` on asset search.** `GET /api/author/assets?q=...` without it silently
    searches a hardcoded `"corporate"` site and returns an empty result for real assets — confirmed
    defect, GAP-110 / DAM-095.

### 23.4 Related documents

| Document | Contents |
|---|---|
| `docs/QA_TEST_PLAN.md` | The broader plan across all modules, including delivery APIs and GraphQL |
| `docs/TEST_DATA_SPECIFICATION.md` | Seed data definitions and re-seeding |
| `docs/FLEXCMS_BUSINESS_CONTEXT.md` | Business context and the TUT scenario |
| `docs/EXPERIENCE_FRAGMENTS.md` | Experience Fragment design detail |
| `hints_for_agent.md` | Known environment problems and their fixes |
| `CLAUDE.md` | Architecture, conventions, and build commands |
