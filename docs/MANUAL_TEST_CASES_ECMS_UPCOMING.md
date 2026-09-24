# FlexCMS — Manual Test Cases: Upcoming Enterprise-CMS Parity Work

> **Status: NONE OF THIS IS BUILT YET.** Every case in this document belongs to the
> `ECMS-01`…`ECMS-66` backlog created in `df/artifacts/ECMS-00/gap-analysis.md` — the
> enterprise-CMS parity program. As of this writing every one of those 66 tasks is
> `NEEDS_ARCHITECTURE`, `READY_FOR_DESIGN`, or `READY_FOR_DEV` on `df/runtime/board.md`;
> **none are `DONE`.** Running these cases against the current running stack will fail
> every one of them — that is expected, not a defect. This document exists so that the
> moment a task reaches `DONE`, its verification test cases already exist instead of
> being written from scratch under delivery pressure.
>
> **Total: 264 test cases**, one per acceptance criterion across all 66 tasks,
> generated directly from the same source data as the task specs
> (`df/artifacts/ECMS-NN/task.md`) so the two can never drift apart silently.

---

## 1. How to use this document

### 1.1 Before running any case for a task

1. Open `df/runtime/board.md` and confirm the task's row shows `DONE`.
2. Confirm every task named in that task's **Dependencies** also shows `DONE` — most
   acceptance criteria assume the dependency's behaviour already exists.
3. Open `df/artifacts/{task-id}/task.md` and read it in full — it names the exact
   files, endpoints, or screens the delivering lane implemented, which this document
   does not repeat (that would drift from the real implementation the moment a file
   is renamed).
4. If the lane recorded its own test evidence under `df/artifacts/{task-id}/{lane}/`
   (unit/Selenium results, per `DEC-DF-007`'s developer testing bar), read it first —
   this pass exists to **independently** confirm that evidence, not repeat it blindly.

### 1.2 Columns

Same convention as `docs/MANUAL_TEST_CASES_AUTHORING.md` and
`docs/RETEST_2026-09-14_EXCEPTION_HANDLING_FIXES.md`:

| Column | Meaning |
|---|---|
| **ID** | `{task-id}-TC{nn}` — quote this in any finding. |
| **Test Case** | Short name of what's being verified — the AC's first clause, never cut mid-word. |
| **Track** | Follows the task's **owner lane**, not a guess at the AC's wording: `API` for `backend-dev`/`data-engineer`/`devops`, `UI` for `frontend-dev`/`designer`, `Docs (pre-architecture)` for `sa` — see §1.6. |
| **Steps** | What to do. Because implementation file/endpoint names don't exist yet at the time of writing, each step points you at the task's own `task.md` and its lane's evidence folder for the exact target, then names the action. |
| **Expected Result** | The acceptance criterion itself, verbatim from `task.md` — if what you see differs at all, it's a finding, not a judgement call. |
| **Pri** | Inherited from the task's priority (P0–P3). All acceptance criteria on a task share its priority; they gate the same `DONE` transition together. |

### 1.3 Result codes and findings

Identical to `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.3–1.4: **PASS** / **FAIL** /
**BLOCKED** / **N/A**, and the same finding template. Two additions specific to this
backlog:

- **A task marked `DONE` that fails one of its own acceptance criteria here is a
  process finding, not just a product one** — per `DEC-DF-007` the delivery lane may
  not report `DONE` without the developer testing bar being met, so a failure here
  means that bar was not actually satisfied. Flag it as **Critical** regardless of
  the AC's own priority, and report it back through `df/runtime/risks.md` so `sa` can
  route it as `RETURNED_TO_DEV`.
- **Docs-track cases** (architecture/process ACs) are read, not run. A "FAIL" there
  means the named artifact is missing or doesn't address what the AC requires — e.g.
  no `df/runtime/decisions.md` entry when the AC required one.

### 1.4 Suggested execution order

Test cases are grouped in this document by capability area, in the same order as
`df/artifacts/ECMS-00/gap-analysis.md`. Within a capability area, test the
**foundational / dependency-free tasks first** — `df/artifacts/ECMS-00/gap-analysis.md`
names the first wave: **ECMS-03, ECMS-01, ECMS-02, ECMS-04, ECMS-08, ECMS-25,
ECMS-41, ECMS-18, ECMS-23, ECMS-48**. Everything else depends on one or more of
these, directly or transitively.

### 1.5 Coverage

| Owner lane | Track | Tasks | Test cases |
|---|---|---:|---:|
| `sa` | Docs (pre-architecture) | 32 | 126 |
| `designer` | UI | 18 | 66 |
| `backend-dev` | API | 9 | 41 |
| `frontend-dev` | UI | 7 | 31 |
| **Total** | | **66** | **264** |

Read `sa`/`Docs (pre-architecture)` rows per §1.6 before assuming they're runnable today — they aren't; they're the traceability check for the eventual split.

### 1.6 Tasks owned by `sa` (`NEEDS_ARCHITECTURE`) — how to test them

32 of the 66 tasks start owned by `sa`, not a delivery lane, because they touch
schemas, public APIs, or more than one lane (`df/roles/sa.md`). Per that role's own
checklist, `sa` must split such a task into single-lane child tasks with a solution
design **before any delivery work starts** — so an `sa`-owned task's acceptance
criteria describe the *shape* the eventual child task(s) must deliver, not something
directly runnable yet.

**Do not** try to exercise a `Docs`-track row against a running system. Instead:

1. Confirm `sa` has produced `df/artifacts/{task-id}/solution-design.md`.
2. Confirm one or more child tasks exist on `df/runtime/board.md`, each owned by a
   single delivery lane, each with its own valid `## Dependencies` section.
3. Confirm every criterion listed here appears as an acceptance criterion on at
   least one child task — same wording, or a documented refinement of it.
4. **Generate that child task's own test cases the same way this document was
   generated** — one row per its acceptance criterion, tracked by *its* owner
   lane — before it reaches `DONE`. This document's `Docs` rows are the
   traceability check that the split didn't drop anything, not a substitute for
   testing the child task's real behaviour once built.

---

## 2. Test cases by capability area

## 2.1 Foundational services (used by many other areas)

Tasks: ECMS-01, ECMS-02, ECMS-03 (3 tasks, 16 test cases)

### ECMS-01 — Taxonomy and tagging service for pages, assets, and fragments

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-01/task.md`

*Why it matters:* Give every content type a shared, governed tag vocabulary so content can be classified, filtered, and searched consistently across sites and languages.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-01-TC01 | Tag namespaces and hierarchical tags (e.g | API | **Pre:** `ECMS-01` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-01/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Tag namespaces and hierarchical tags (e.g. `products:vehicles/suv`) with CRUD API under `/api/author/tags`, following model → repository → service → controller layering. | P1 |
| ECMS-01-TC02 | Each tag stores a title per locale | API | **Pre:** `ECMS-01` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-01/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Each tag stores a title per locale; API returns the locale-appropriate title with fallback to the default locale. | P1 |
| ECMS-01-TC03 | Pages (content nodes) and DAM assets can be tagged and untagged | API | **Pre:** `ECMS-01` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-01/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Pages (content nodes) and DAM assets can be tagged and untagged; tags are returned in author and headless JSON. | P1 |
| ECMS-01-TC04 | Deleting or merging a tag in use returns 409 unless an explicit `force`/`mergeInto` is given | API | **Pre:** `ECMS-01` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-01/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Deleting or merging a tag in use returns 409 unless an explicit `force`/`mergeInto` is given; merge re-points all references. | P1 |
| ECMS-01-TC05 | Content search and asset search can filter by tag (including a tag's descendants). | API | **Pre:** `ECMS-01` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-01/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Content search and asset search can filter by tag (including a tag's descendants). | P1 |
| ECMS-01-TC06 | Flyway migration for the tag tables | API | **Pre:** `ECMS-01` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-01/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Flyway migration for the tag tables; RFC 7807 errors for not-found/conflict via existing exception types. | P1 |

### ECMS-02 — Reference index and 'where used' API for pages, assets, and fragments

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-02/task.md`

*Why it matters:* Let authors see every place a page, asset, or fragment is used before changing, unpublishing, or deleting it.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-02, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-02-TC01 | Solution design decides between maintaining a reference table on write vs | Docs (pre-architecture) | **Pre:** `ECMS-02` show `DONE`.<br>1. Read `df/artifacts/ECMS-02/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design decides between maintaining a reference table on write vs. querying JSONB on read, with a measured cost on the seeded dataset. | P1 |
| ECMS-02-TC02 | API returns inbound references for a page path, asset path/id, or fragment path, including the… | Docs (pre-architecture) | **Pre:** `ECMS-02` show `DONE`.<br>1. Read `df/artifacts/ECMS-02/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | API returns inbound references for a page path, asset path/id, or fragment path, including the referring node path, property name, and status (draft/published). | P1 |
| ECMS-02-TC03 | References inside component properties (links, `x-asset` fields, fragment references) are detected… | Docs (pre-architecture) | **Pre:** `ECMS-02` show `DONE`.<br>1. Read `df/artifacts/ECMS-02/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | References inside component properties (links, `x-asset` fields, fragment references) are detected from the component `dataSchema`, not by string guessing. | P1 |
| ECMS-02-TC04 | Delete and unpublish endpoints can report affected references (dry-run flag) so the UI can warn. | Docs (pre-architecture) | **Pre:** `ECMS-02` show `DONE`.<br>1. Read `df/artifacts/ECMS-02/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Delete and unpublish endpoints can report affected references (dry-run flag) so the UI can warn. | P1 |
| ECMS-02-TC05 | Reference data stays correct after move, rename, copy, and delete. | Docs (pre-architecture) | **Pre:** `ECMS-02` show `DONE`.<br>1. Read `df/artifacts/ECMS-02/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Reference data stays correct after move, rename, copy, and delete. | P1 |

### ECMS-03 — Publish-tier asset delivery and asset replication

**Priority:** P0 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-03/task.md`

*Why it matters:* Published pages must be able to show their images and documents to the public; today they cannot.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-03, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-03-TC01 | Solution design decides: publish-tier asset controller serving binaries/renditions vs | Docs (pre-architecture) | **Pre:** `ECMS-03` show `DONE`.<br>1. Read `df/artifacts/ECMS-03/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design decides: publish-tier asset controller serving binaries/renditions vs. publishing binaries to static/CDN storage at activation. Records the decision in `df/runtime/decisions.md`. | P0 |
| ECMS-03-TC02 | Publishing a page publishes (or verifies published) every asset it references | Docs (pre-architecture) | **Pre:** `ECMS-03` show `DONE`.<br>1. Read `df/artifacts/ECMS-03/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Publishing a page publishes (or verifies published) every asset it references; unpublishing/deleting an asset retracts it from public delivery. | P0 |
| ECMS-03-TC03 | A published page's asset URLs resolve with 200 on the publish tier and never point at… | Docs (pre-architecture) | **Pre:** `ECMS-03` show `DONE`.<br>1. Read `df/artifacts/ECMS-03/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | A published page's asset URLs resolve with 200 on the publish tier and never point at `/api/author/...`. | P0 |
| ECMS-03-TC04 | Correct `Cache-Control` and CDN purge on asset republish. | Docs (pre-architecture) | **Pre:** `ECMS-03` show `DONE`.<br>1. Read `df/artifacts/ECMS-03/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Correct `Cache-Control` and CDN purge on asset republish. | P0 |
| ECMS-03-TC05 | Selenium: publish a page with an image, load it from the publish URL, assert the image loads… | Docs (pre-architecture) | **Pre:** `ECMS-03` show `DONE`.<br>1. Read `df/artifacts/ECMS-03/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: publish a page with an image, load it from the publish URL, assert the image loads (naturalWidth > 0). | P0 |

## 2.2 Page authoring experience

Tasks: ECMS-04, ECMS-05, ECMS-06, ECMS-07, ECMS-08, ECMS-09, ECMS-10, ECMS-11, ECMS-12, ECMS-13, ECMS-14, ECMS-15, ECMS-16, ECMS-17 (14 tasks, 60 test cases)

### ECMS-04 — Page copy and rename API

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-04/task.md`

*Why it matters:* Authors can duplicate a page (optionally with its subtree) and rename it, which every enterprise page console offers.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-04-TC01 | `POST /api/author/content/node/copy` copies a node (and optionally its subtree) to a target parent… | API | **Pre:** `ECMS-04` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-04/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | `POST /api/author/content/node/copy` copies a node (and optionally its subtree) to a target parent with a new name; copies get fresh ids, status DRAFT, and new version history. | P1 |
| ECMS-04-TC02 | `POST /api/author/content/node/rename` changes the last path segment, rewrites descendant paths,… | API | **Pre:** `ECMS-04` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-04/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | `POST /api/author/content/node/rename` changes the last path segment, rewrites descendant paths, and keeps ids and version history. | P1 |
| ECMS-04-TC03 | Both reject a target path that already exists with 409 and a missing source with 404. | API | **Pre:** `ECMS-04` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-04/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Both reject a target path that already exists with 409 and a missing source with 404. | P1 |
| ECMS-04-TC04 | Rename and copy are audited and replicate correctly (a renamed published page is retracted at the… | API | **Pre:** `ECMS-04` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-04/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Rename and copy are audited and replicate correctly (a renamed published page is retracted at the old path and republished at the new one, or the behaviour is decided and documented). | P1 |
| ECMS-04-TC05 | Service-layer transactions | API | **Pre:** `ECMS-04` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-04/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Service-layer transactions; unit + IT coverage including subtree path rewriting. | P1 |

### ECMS-05 — Content Tree page operations wired end to end

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `frontend-dev` &nbsp;·&nbsp; **Dependencies:** ECMS-04 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-05/task.md`

*Why it matters:* Make the Content Tree a working page console: every page operation an author needs, from the UI.

> **Gate:** do not run these cases until ECMS-05 **and** ECMS-04 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-05-TC01 | Create page dialog: parent, name, title, template (from `/api/author/content/templates`) | UI | **Pre:** `ECMS-05` and its dependencies (ECMS-04) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-05/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Create page dialog: parent, name, title, template (from `/api/author/content/templates`); creates via API and appears in the tree. | P1 |
| ECMS-05-TC02 | Row and multi-select actions: copy, move (target picker), rename, delete (with confirmation),… | UI | **Pre:** `ECMS-05` and its dependencies (ECMS-04) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-05/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Row and multi-select actions: copy, move (target picker), rename, delete (with confirmation), lock/unlock, publish, unpublish, publish later / unpublish later (date-time). | P1 |
| ECMS-05-TC03 | Every destructive action asks for confirmation | UI | **Pre:** `ECMS-05` and its dependencies (ECMS-04) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-05/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Every destructive action asks for confirmation; every API failure shows a visible error — no optimistic success. | P1 |
| ECMS-05-TC04 | Lock state is shown on rows and in the editor header | UI | **Pre:** `ECMS-05` and its dependencies (ECMS-04) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-05/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Lock state is shown on rows and in the editor header; a page locked by another user is read-only in the editor. | P1 |
| ECMS-05-TC05 | Uses `@flexcms/ui` components and tokens | UI | **Pre:** `ECMS-05` and its dependencies (ECMS-04) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-05/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Uses `@flexcms/ui` components and tokens; loading and empty states present; follows `Design/UI/.../content_tree_*`. | P1 |
| ECMS-05-TC06 | Selenium scenarios for each action, verifying the backend result, not just the UI. | UI | **Pre:** `ECMS-05` and its dependencies (ECMS-04) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-05/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium scenarios for each action, verifying the backend result, not just the UI. | P1 |

### ECMS-06 — Page properties contract and validation

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** ECMS-01 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-06/task.md`

*Why it matters:* Turn page metadata from free-form JSON into a defined, validated contract every page carries.

> **Gate:** do not run these cases until ECMS-06 **and** ECMS-01 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-06-TC01 | A versioned page-properties schema (title, navTitle, description, tags, vanityUrl, redirectTarget,… | API | **Pre:** `ECMS-06` and its dependencies (ECMS-01) show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-06/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | A versioned page-properties schema (title, navTitle, description, tags, vanityUrl, redirectTarget, onTime, offTime, thumbnail asset, robots, canonicalOverride, ogTitle/ogDescription/ogImage, hideInNav). | P1 |
| ECMS-06-TC02 | Create/update of a page validates against the schema and returns 422 with field errors on violation. | API | **Pre:** `ECMS-06` and its dependencies (ECMS-01) show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-06/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Create/update of a page validates against the schema and returns 422 with field errors on violation. | P1 |
| ECMS-06-TC03 | onTime/offTime map onto the existing scheduling columns so there is one source of truth. | API | **Pre:** `ECMS-06` and its dependencies (ECMS-01) show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-06/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | onTime/offTime map onto the existing scheduling columns so there is one source of truth. | P1 |
| ECMS-06-TC04 | Properties are exposed in author and headless page JSON under a stable key. | API | **Pre:** `ECMS-06` and its dependencies (ECMS-01) show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-06/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Properties are exposed in author and headless page JSON under a stable key. | P1 |
| ECMS-06-TC05 | Existing seeded pages remain valid (migration or defaults). | API | **Pre:** `ECMS-06` and its dependencies (ECMS-01) show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-06/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Existing seeded pages remain valid (migration or defaults). | P1 |

### ECMS-07 — Page properties dialog

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-06 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-07/task.md`

*Why it matters:* Authors can view and edit every page property without touching the API.

> **Gate:** do not run these cases until ECMS-07 **and** ECMS-06 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-07-TC01 | Design package for a tabbed properties dialog (Basic, SEO, Social, Scheduling, Advanced) reachable… | UI | **Pre:** `ECMS-07` and its dependencies (ECMS-06) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-07/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a tabbed properties dialog (Basic, SEO, Social, Scheduling, Advanced) reachable from the Content Tree and the editor. | P1 |
| ECMS-07-TC02 | Frontend: all ECMS-06 fields editable with validation messages from the API's field errors. | UI | **Pre:** `ECMS-07` and its dependencies (ECMS-06) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-07/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Frontend: all ECMS-06 fields editable with validation messages from the API's field errors. | P1 |
| ECMS-07-TC03 | On/off time and publish-later are editable here and reflected in the tree. | UI | **Pre:** `ECMS-07` and its dependencies (ECMS-06) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-07/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | On/off time and publish-later are editable here and reflected in the tree. | P1 |
| ECMS-07-TC04 | Selenium: edit each field, reload, and assert it persisted. | UI | **Pre:** `ECMS-07` and its dependencies (ECMS-06) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-07/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: edit each field, reload, and assert it persisted. | P1 |

### ECMS-08 — Version compare, labels, and historical as-of view API

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-08/task.md`

*Why it matters:* Give authors and compliance a real version history: labelled versions, diffs, and the ability to see the page as it was on any date.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-08-TC01 | Versions can carry a label and comment | API | **Pre:** `ECMS-08` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-08/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Versions can carry a label and comment; `POST .../node/versions` creates an on-demand labelled version. | P1 |
| ECMS-08-TC02 | Diff API returns structured property-level differences between two versions of a node, and… | API | **Pre:** `ECMS-08` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-08/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Diff API returns structured property-level differences between two versions of a node, and component-level differences for a page subtree. | P1 |
| ECMS-08-TC03 | As-of API returns the page JSON (including components) as it was at a given timestamp. | API | **Pre:** `ECMS-08` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-08/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | As-of API returns the page JSON (including components) as it was at a given timestamp. | P1 |
| ECMS-08-TC04 | Publishing creates a version automatically. | API | **Pre:** `ECMS-08` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-08/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Publishing creates a version automatically. | P1 |
| ECMS-08-TC05 | Unit + IT coverage for diff correctness and as-of reconstruction. | API | **Pre:** `ECMS-08` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-08/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Unit + IT coverage for diff correctness and as-of reconstruction. | P1 |

### ECMS-09 — Version history, compare, and as-of view in the editor

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-08 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-09/task.md`

*Why it matters:* Authors can browse, compare, restore, and time-travel versions from the UI.

> **Gate:** do not run these cases until ECMS-09 **and** ECMS-08 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-09-TC01 | Design package (may adapt `product_version_history`) for a version panel: list with labels,… | UI | **Pre:** `ECMS-09` and its dependencies (ECMS-08) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-09/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package (may adapt `product_version_history`) for a version panel: list with labels, side-by-side compare, restore with confirmation. | P1 |
| ECMS-09-TC02 | An as-of mode in the editor/preview renders the page at a chosen date, read-only. | UI | **Pre:** `ECMS-09` and its dependencies (ECMS-08) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-09/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | An as-of mode in the editor/preview renders the page at a chosen date, read-only. | P1 |
| ECMS-09-TC03 | Restore creates a new version and the UI refreshes. | UI | **Pre:** `ECMS-09` and its dependencies (ECMS-08) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-09/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Restore creates a new version and the UI refreshes. | P1 |
| ECMS-09-TC04 | Selenium: create versions, compare, restore, and verify the as-of view. | UI | **Pre:** `ECMS-09` and its dependencies (ECMS-08) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-09/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: create versions, compare, restore, and verify the as-of view. | P1 |

### ECMS-10 — Review annotations API

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-10/task.md`

*Why it matters:* Reviewers can leave comments pinned to a page or a specific component for structured review before go-live.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-10-TC01 | Annotation entity attached to a node path (page or component) with author, text, status… | API | **Pre:** `ECMS-10` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-10/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Annotation entity attached to a node path (page or component) with author, text, status (open/resolved), timestamps, and replies. | P2 |
| ECMS-10-TC02 | CRUD + resolve API | API | **Pre:** `ECMS-10` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-10/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | CRUD + resolve API; list by page including descendant components. | P2 |
| ECMS-10-TC03 | Annotations are excluded from published content and from replication. | API | **Pre:** `ECMS-10` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-10/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Annotations are excluded from published content and from replication. | P2 |
| ECMS-10-TC04 | Deleting the annotated node removes or orphans its annotations per a documented rule. | API | **Pre:** `ECMS-10` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-10/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Deleting the annotated node removes or orphans its annotations per a documented rule. | P2 |

### ECMS-11 — Annotate mode in the editor

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-10 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-11/task.md`

*Why it matters:* Reviewers annotate components directly on the canvas.

> **Gate:** do not run these cases until ECMS-11 **and** ECMS-10 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-11-TC01 | Design package for an annotate mode: markers on components, thread panel, resolve. | UI | **Pre:** `ECMS-11` and its dependencies (ECMS-10) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-11/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for an annotate mode: markers on components, thread panel, resolve. | P2 |
| ECMS-11-TC02 | Frontend: create, reply, resolve annotations | UI | **Pre:** `ECMS-11` and its dependencies (ECMS-10) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-11/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Frontend: create, reply, resolve annotations; count badge in the editor header. | P2 |
| ECMS-11-TC03 | Selenium: annotate a component, reload, resolve. | UI | **Pre:** `ECMS-11` and its dependencies (ECMS-10) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-11/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: annotate a component, reload, resolve. | P2 |

### ECMS-12 — Rich text editor with policy-driven formatting

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-19 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-12/task.md`

*Why it matters:* Authors format text in a real rich text editor, limited to what brand rules allow for that component.

> **Gate:** do not run these cases until ECMS-12 **and** ECMS-19 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-12-TC01 | Design package for RTE toolbar and dialogs (links, tables, special characters). | UI | **Pre:** `ECMS-12` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-12/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for RTE toolbar and dialogs (links, tables, special characters). | P1 |
| ECMS-12-TC02 | Frontend: RTE for `rich-text` fields with headings, lists, links (internal page picker + external),… | UI | **Pre:** `ECMS-12` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-12/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Frontend: RTE for `rich-text` fields with headings, lists, links (internal page picker + external), tables, inline images from DAM. | P1 |
| ECMS-12-TC03 | Enabled features come from the component's policy (ECMS-19) | UI | **Pre:** `ECMS-12` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-12/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Enabled features come from the component's policy (ECMS-19); disallowed formatting is unavailable and stripped on paste. | P1 |
| ECMS-12-TC04 | Paste from Word/Google Docs is cleaned to allowed markup. | UI | **Pre:** `ECMS-12` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-12/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Paste from Word/Google Docs is cleaned to allowed markup. | P1 |
| ECMS-12-TC05 | Output remains safe after `RichTextSanitizer` | UI | **Pre:** `ECMS-12` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-12/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Output remains safe after `RichTextSanitizer`; Selenium covers each formatting feature and paste filtering. | P1 |

### ECMS-13 — Editor productivity: inline text editing and copy/cut/paste

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `frontend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-13/task.md`

*Why it matters:* Speed up page building with inline text editing and component clipboard operations.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-13-TC01 | Double-click a text-like component to edit inline on the canvas | UI | **Pre:** `ECMS-13` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-13/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Double-click a text-like component to edit inline on the canvas; Enter/Escape/blur commit or cancel. | P2 |
| ECMS-13-TC02 | Copy, cut, and paste components (keyboard shortcuts + chip menu), including into another container… | UI | **Pre:** `ECMS-13` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-13/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Copy, cut, and paste components (keyboard shortcuts + chip menu), including into another container and another page in the same session. | P2 |
| ECMS-13-TC03 | Paste respects container policies (rejected with a message when not allowed). | UI | **Pre:** `ECMS-13` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-13/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Paste respects container policies (rejected with a message when not allowed). | P2 |
| ECMS-13-TC04 | All operations participate in undo/redo and persist on save. | UI | **Pre:** `ECMS-13` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-13/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | All operations participate in undo/redo and persist on save. | P2 |
| ECMS-13-TC05 | Follows `visual_page_editor` design | UI | **Pre:** `ECMS-13` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-13/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Follows `visual_page_editor` design; Selenium coverage for each operation. | P2 |

### ECMS-14 — Responsive layout mode (per-breakpoint size, hide, order)

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-14/task.md`

*Why it matters:* Authors guarantee mobile-ready pages without a developer by adjusting layout per breakpoint.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-14, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-14-TC01 | Solution design defines the layout data model (grid columns per breakpoint, hidden flags, order)… | Docs (pre-architecture) | **Pre:** `ECMS-14` show `DONE`.<br>1. Read `df/artifacts/ECMS-14/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design defines the layout data model (grid columns per breakpoint, hidden flags, order) stored on components, and how renderers consume it. | P2 |
| ECMS-14-TC02 | Layout mode in the editor: resize component column span, hide, and reorder per breakpoint. | Docs (pre-architecture) | **Pre:** `ECMS-14` show `DONE`.<br>1. Read `df/artifacts/ECMS-14/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Layout mode in the editor: resize component column span, hide, and reorder per breakpoint. | P2 |
| ECMS-14-TC03 | Site renderers honour the layout data on each breakpoint. | Docs (pre-architecture) | **Pre:** `ECMS-14` show `DONE`.<br>1. Read `df/artifacts/ECMS-14/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Site renderers honour the layout data on each breakpoint. | P2 |
| ECMS-14-TC04 | Split into backend (contract) and frontend (editor + renderers) child tasks. | Docs (pre-architecture) | **Pre:** `ECMS-14` show `DONE`.<br>1. Read `df/artifacts/ECMS-14/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Split into backend (contract) and frontend (editor + renderers) child tasks. | P2 |

### ECMS-15 — Framework-agnostic visual editing of external frontends

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-15/task.md`

*Why it matters:* Offer in-context editing for sites not built on the bundled renderers (SPAs, other frameworks), so authoring is one experience across channels.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-15, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-15-TC01 | Spike report evaluating an attribute-based instrumentation SDK (editable regions declared in… | Docs (pre-architecture) | **Pre:** `ECMS-15` show `DONE`.<br>1. Read `df/artifacts/ECMS-15/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Spike report evaluating an attribute-based instrumentation SDK (editable regions declared in markup) plus an editor shell that loads the external app in an iframe. | P3 |
| ECMS-15-TC02 | Prototype against `site-nuxt` proving edit-in-place round-trips through the author API. | Docs (pre-architecture) | **Pre:** `ECMS-15` show `DONE`.<br>1. Read `df/artifacts/ECMS-15/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Prototype against `site-nuxt` proving edit-in-place round-trips through the author API. | P3 |
| ECMS-15-TC03 | Recommendation with effort estimate and follow-on task split. | Docs (pre-architecture) | **Pre:** `ECMS-15` show `DONE`.<br>1. Read `df/artifacts/ECMS-15/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Recommendation with effort estimate and follow-on task split. | P3 |

### ECMS-16 — Spreadsheet-style bulk property editor

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-06 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-16/task.md`

*Why it matters:* Edit a property across many pages at once (e.g. fix descriptions site-wide).

> **Gate:** do not run these cases until ECMS-16 **and** ECMS-06 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-16, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-16-TC01 | Bulk properties API with per-path result reporting (like existing bulk operations). | Docs (pre-architecture) | **Pre:** `ECMS-16` and its dependencies (ECMS-06) show `DONE`.<br>1. Read `df/artifacts/ECMS-16/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Bulk properties API with per-path result reporting (like existing bulk operations). | P3 |
| ECMS-16-TC02 | Grid UI: pick a subtree and columns, edit cells, save with per-row errors. | Docs (pre-architecture) | **Pre:** `ECMS-16` and its dependencies (ECMS-06) show `DONE`.<br>1. Read `df/artifacts/ECMS-16/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Grid UI: pick a subtree and columns, edit cells, save with per-row errors. | P3 |
| ECMS-16-TC03 | Split into backend and frontend child tasks. | Docs (pre-architecture) | **Pre:** `ECMS-16` and its dependencies (ECMS-06) show `DONE`.<br>1. Read `df/artifacts/ECMS-16/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Split into backend and frontend child tasks. | P3 |

### ECMS-17 — Audit log viewer

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-17/task.md`

*Why it matters:* Compliance and admins can see who did what and when without API access.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-17-TC01 | Design package for an audit log screen with filters and a per-page history drawer. | UI | **Pre:** `ECMS-17` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-17/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for an audit log screen with filters and a per-page history drawer. | P2 |
| ECMS-17-TC02 | Frontend: filter by entity type, path, user, action, and date range | UI | **Pre:** `ECMS-17` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-17/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Frontend: filter by entity type, path, user, action, and date range; paginated; link to the affected node. | P2 |
| ECMS-17-TC03 | Per-page audit tab reachable from the Content Tree. | UI | **Pre:** `ECMS-17` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-17/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Per-page audit tab reachable from the Content Tree. | P2 |
| ECMS-17-TC04 | Selenium: perform actions and find them in the log. | UI | **Pre:** `ECMS-17` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-17/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: perform actions and find them in the log. | P2 |

## 2.3 Components, templates, policies, and style system

Tasks: ECMS-18, ECMS-19, ECMS-20, ECMS-21, ECMS-22 (5 tasks, 22 test cases)

### ECMS-18 — Editable templates: write API, lifecycle, and structure propagation

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-18/task.md`

*Why it matters:* Template authors create and change page types in the browser, without a deployment, and existing pages follow structure changes.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-18, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-18-TC01 | Template CRUD API with enable/disable and per-site availability. | Docs (pre-architecture) | **Pre:** `ECMS-18` show `DONE`.<br>1. Read `df/artifacts/ECMS-18/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Template CRUD API with enable/disable and per-site availability. | P1 |
| ECMS-18-TC02 | Structure (locked components) changes propagate to every page using the template | Docs (pre-architecture) | **Pre:** `ECMS-18` show `DONE`.<br>1. Read `df/artifacts/ECMS-18/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Structure (locked components) changes propagate to every page using the template; initial content affects only new pages. | P1 |
| ECMS-18-TC03 | Server-side enforcement: creating a component in a container its template/policy disallows returns… | Docs (pre-architecture) | **Pre:** `ECMS-18` show `DONE`.<br>1. Read `df/artifacts/ECMS-18/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Server-side enforcement: creating a component in a container its template/policy disallows returns 422. | P1 |
| ECMS-18-TC04 | Templates are versioned | Docs (pre-architecture) | **Pre:** `ECMS-18` show `DONE`.<br>1. Read `df/artifacts/ECMS-18/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Templates are versioned; deleting a template in use returns 409. | P1 |
| ECMS-18-TC05 | Solution design covers propagation strategy (render-time merge vs | Docs (pre-architecture) | **Pre:** `ECMS-18` show `DONE`.<br>1. Read `df/artifacts/ECMS-18/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design covers propagation strategy (render-time merge vs. write-time sync) and migration of the 21 seeded templates. | P1 |

### ECMS-19 — Content policies and component style variants

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-18 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-19/task.md`

*Why it matters:* Brand and legal guardrails are enforced by reusable policies, and one component can offer several approved looks without new code.

> **Gate:** do not run these cases until ECMS-19 **and** ECMS-18 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-19, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-19-TC01 | Reusable policy entities: container policy (allowed components) and component policy (enabled RTE… | Docs (pre-architecture) | **Pre:** `ECMS-19` and its dependencies (ECMS-18) show `DONE`.<br>1. Read `df/artifacts/ECMS-19/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Reusable policy entities: container policy (allowed components) and component policy (enabled RTE features, allowed image ratios, default values, feature toggles). | P1 |
| ECMS-19-TC02 | Style groups on component policies, single-select or multi-select, mapping style names to CSS… | Docs (pre-architecture) | **Pre:** `ECMS-19` and its dependencies (ECMS-18) show `DONE`.<br>1. Read `df/artifacts/ECMS-19/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Style groups on component policies, single-select or multi-select, mapping style names to CSS classes; defaults supported. | P1 |
| ECMS-19-TC03 | Applied styles persist on the component node and are delivered in page JSON. | Docs (pre-architecture) | **Pre:** `ECMS-19` and its dependencies (ECMS-18) show `DONE`.<br>1. Read `df/artifacts/ECMS-19/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Applied styles persist on the component node and are delivered in page JSON. | P1 |
| ECMS-19-TC04 | Policies are shared between templates | Docs (pre-architecture) | **Pre:** `ECMS-19` and its dependencies (ECMS-18) show `DONE`.<br>1. Read `df/artifacts/ECMS-19/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Policies are shared between templates; changing one propagates to all users of it. | P1 |
| ECMS-19-TC05 | Server-side enforcement of container policies (coordinated with ECMS-18). | Docs (pre-architecture) | **Pre:** `ECMS-19` and its dependencies (ECMS-18) show `DONE`.<br>1. Read `df/artifacts/ECMS-19/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Server-side enforcement of container policies (coordinated with ECMS-18). | P1 |

### ECMS-20 — Template editor UI (structure, initial content, policies, styles)

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-18, ECMS-19 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-20/task.md`

*Why it matters:* Template authors build and govern page types visually.

> **Gate:** do not run these cases until ECMS-20 **and** ECMS-18, ECMS-19 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-20-TC01 | Design package for a template editor with Structure / Initial content / Policies modes. | UI | **Pre:** `ECMS-20` and its dependencies (ECMS-18, ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-20/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a template editor with Structure / Initial content / Policies modes. | P1 |
| ECMS-20-TC02 | Frontend: lock/unlock components in structure, place initial content, assign container and… | UI | **Pre:** `ECMS-20` and its dependencies (ECMS-18, ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-20/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Frontend: lock/unlock components in structure, place initial content, assign container and component policies, define style groups. | P1 |
| ECMS-20-TC03 | Enable/disable templates and choose site availability. | UI | **Pre:** `ECMS-20` and its dependencies (ECMS-18, ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-20/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Enable/disable templates and choose site availability. | P1 |
| ECMS-20-TC04 | Selenium: create a template, create a page from it, change structure, and see the page update. | UI | **Pre:** `ECMS-20` and its dependencies (ECMS-18, ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-20/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: create a template, create a page from it, change structure, and see the page update. | P1 |

### ECMS-21 — Style picker in the editor and style classes in renderers

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-19 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-21/task.md`

*Why it matters:* Authors change a component's look in seconds from approved style options.

> **Gate:** do not run these cases until ECMS-21 **and** ECMS-19 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-21-TC01 | Design package for a style picker on the component chip. | UI | **Pre:** `ECMS-21` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-21/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a style picker on the component chip. | P1 |
| ECMS-21-TC02 | Editor offers only the styles the component policy allows, honouring single/multi-select groups. | UI | **Pre:** `ECMS-21` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-21/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Editor offers only the styles the component policy allows, honouring single/multi-select groups. | P1 |
| ECMS-21-TC03 | Site renderers (React and Vue) add the mapped classes to the component wrapper | UI | **Pre:** `ECMS-21` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-21/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Site renderers (React and Vue) add the mapped classes to the component wrapper; preview updates live. | P1 |
| ECMS-21-TC04 | Selenium: apply a style, publish, assert the class on the public page. | UI | **Pre:** `ECMS-21` and its dependencies (ECMS-19) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-21/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: apply a style, publish, assert the class on the public page. | P1 |

### ECMS-22 — Generic core component library

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-22/task.md`

*Why it matters:* Provide a maintained, accessible, SEO-friendly component set any new site can use without building from scratch.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-22, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-22-TC01 | Solution design lists the core set (title, text, image, button, teaser, list, carousel, accordion,… | Docs (pre-architecture) | **Pre:** `ECMS-22` show `DONE`.<br>1. Read `df/artifacts/ECMS-22/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design lists the core set (title, text, image, button, teaser, list, carousel, accordion, tabs, breadcrumb, navigation, search, embed, separator, container, download) with contracts. | P2 |
| ECMS-22-TC02 | Each component: `dataSchema`, dialog, React and Vue renderers, WCAG 2.1 AA, semantic HTML, JSON-LD… | Docs (pre-architecture) | **Pre:** `ECMS-22` show `DONE`.<br>1. Read `df/artifacts/ECMS-22/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Each component: `dataSchema`, dialog, React and Vue renderers, WCAG 2.1 AA, semantic HTML, JSON-LD where relevant. | P2 |
| ECMS-22-TC03 | Sample-site components may extend core components rather than duplicate them. | Docs (pre-architecture) | **Pre:** `ECMS-22` show `DONE`.<br>1. Read `df/artifacts/ECMS-22/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Sample-site components may extend core components rather than duplicate them. | P2 |
| ECMS-22-TC04 | Split into contract (backend migration) and renderer (frontend) child tasks, batched by group. | Docs (pre-architecture) | **Pre:** `ECMS-22` show `DONE`.<br>1. Read `df/artifacts/ECMS-22/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Split into contract (backend migration) and renderer (frontend) child tasks, batched by group. | P2 |

## 2.4 Multi-site management

Tasks: ECMS-23, ECMS-24 (2 tasks, 10 test cases)

### ECMS-23 — Multi-site management completeness: rollout configs, inheritance control, conflicts

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-23/task.md`

*Why it matters:* Corporate changes reach every derived site automatically, while local teams keep the local changes they need.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-23, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-23-TC01 | Rollout configurations: trigger (manual, on source activation, on source modification) and actions… | Docs (pre-architecture) | **Pre:** `ECMS-23` show `DONE`.<br>1. Read `df/artifacts/ECMS-23/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Rollout configurations: trigger (manual, on source activation, on source modification) and actions (update content, add/remove pages, reorder, activate on rollout). | P1 |
| ECMS-23-TC02 | Cancel and re-enable inheritance per page and per component | Docs (pre-architecture) | **Pre:** `ECMS-23` show `DONE`.<br>1. Read `df/artifacts/ECMS-23/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Cancel and re-enable inheritance per page and per component; re-enable restores source content. | P1 |
| ECMS-23-TC03 | Suspend/resume a whole live copy. | Docs (pre-architecture) | **Pre:** `ECMS-23` show `DONE`.<br>1. Read `df/artifacts/ECMS-23/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Suspend/resume a whole live copy. | P1 |
| ECMS-23-TC04 | Conflict rules for name collisions (source wins / local wins / rename local). | Docs (pre-architecture) | **Pre:** `ECMS-23` show `DONE`.<br>1. Read `df/artifacts/ECMS-23/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Conflict rules for name collisions (source wins / local wins / rename local). | P1 |
| ECMS-23-TC05 | Live-copy overview API with per-node status (inherited, cancelled, suspended, not rolled out). | Docs (pre-architecture) | **Pre:** `ECMS-23` show `DONE`.<br>1. Read `df/artifacts/ECMS-23/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Live-copy overview API with per-node status (inherited, cancelled, suspended, not rolled out). | P1 |
| ECMS-23-TC06 | Rollout of a nonexistent source returns 404. | Docs (pre-architecture) | **Pre:** `ECMS-23` show `DONE`.<br>1. Read `df/artifacts/ECMS-23/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Rollout of a nonexistent source returns 404. | P1 |

### ECMS-24 — Live copy console and inheritance indicators in the editor

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-23 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-24/task.md`

*Why it matters:* Site owners see which sites are in sync and manage live copies without API calls.

> **Gate:** do not run these cases until ECMS-24 **and** ECMS-23 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-24-TC01 | Design package for a live-copy overview console and editor inheritance states. | UI | **Pre:** `ECMS-24` and its dependencies (ECMS-23) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-24/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a live-copy overview console and editor inheritance states. | P1 |
| ECMS-24-TC02 | Create live copy, roll out, suspend/resume, detach from the UI. | UI | **Pre:** `ECMS-24` and its dependencies (ECMS-23) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-24/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Create live copy, roll out, suspend/resume, detach from the UI. | P1 |
| ECMS-24-TC03 | Editor shows inherited components as locked with cancel/re-enable inheritance actions. | UI | **Pre:** `ECMS-24` and its dependencies (ECMS-23) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-24/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Editor shows inherited components as locked with cancel/re-enable inheritance actions. | P1 |
| ECMS-24-TC04 | Selenium: create a live copy, change source, roll out, cancel inheritance on one component, roll… | UI | **Pre:** `ECMS-24` and its dependencies (ECMS-23) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-24/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: create a live copy, change source, roll out, cancel inheritance on one component, roll out again, assert local change survives. | P1 |

## 2.5 Translation and localisation

Tasks: ECMS-25, ECMS-26, ECMS-27, ECMS-28 (4 tasks, 17 test cases)

### ECMS-25 — i18n dictionary REST API with import/export

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-25/task.md`

*Why it matters:* Expose UI-string dictionaries so the Translations page and delivery can use them.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-25-TC01 | CRUD endpoints for dictionary keys per site and locale, with pagination and search. | API | **Pre:** `ECMS-25` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-25/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | CRUD endpoints for dictionary keys per site and locale, with pagination and search. | P1 |
| ECMS-25-TC02 | Import/export in JSON and XLIFF 1.2/2.0. | API | **Pre:** `ECMS-25` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-25/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Import/export in JSON and XLIFF 1.2/2.0. | P1 |
| ECMS-25-TC03 | Headless endpoint returns a locale dictionary with the documented fallback chain. | API | **Pre:** `ECMS-25` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-25/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Headless endpoint returns a locale dictionary with the documented fallback chain. | P1 |
| ECMS-25-TC04 | Validation and RFC 7807 errors | API | **Pre:** `ECMS-25` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-25/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Validation and RFC 7807 errors; audit entries for changes. | P1 |

### ECMS-26 — Translations page wired to the dictionary API

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `frontend-dev` &nbsp;·&nbsp; **Dependencies:** ECMS-25 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-26/task.md`

*Why it matters:* Localisation managers manage UI strings in the Translations page.

> **Gate:** do not run these cases until ECMS-26 **and** ECMS-25 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-26-TC01 | Grid loads keys × locales from the API | UI | **Pre:** `ECMS-26` and its dependencies (ECMS-25) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-26/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Grid loads keys × locales from the API; status chips (translated/missing/outdated) are computed from data. | P1 |
| ECMS-26-TC02 | Inline edit, add key, import, and export XLIFF work against the API. | UI | **Pre:** `ECMS-26` and its dependencies (ECMS-25) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-26/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Inline edit, add key, import, and export XLIFF work against the API. | P1 |
| ECMS-26-TC03 | Translation Health panel shows real completion. | UI | **Pre:** `ECMS-26` and its dependencies (ECMS-25) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-26/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Translation Health panel shows real completion. | P1 |
| ECMS-26-TC04 | Follows `translation_manager` design | UI | **Pre:** `ECMS-26` and its dependencies (ECMS-25) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-26/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Follows `translation_manager` design; Selenium coverage. | P1 |

### ECMS-27 — Translation projects, jobs, delta updates, and translation rules

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-25 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-27/task.md`

*Why it matters:* Batch, track, and audit translation work, and pay only for changed content.

> **Gate:** do not run these cases until ECMS-27 **and** ECMS-25 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-27, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-27-TC01 | Translation project and job entities with states (draft → submitted → in progress → ready for… | Docs (pre-architecture) | **Pre:** `ECMS-27` and its dependencies (ECMS-25) show `DONE`.<br>1. Read `df/artifacts/ECMS-27/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Translation project and job entities with states (draft → submitted → in progress → ready for review → approved/rejected → complete). | P2 |
| ECMS-27-TC02 | Jobs can contain pages, fragments, assets metadata, tags, and dictionaries. | Docs (pre-architecture) | **Pre:** `ECMS-27` and its dependencies (ECMS-25) show `DONE`.<br>1. Read `df/artifacts/ECMS-27/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Jobs can contain pages, fragments, assets metadata, tags, and dictionaries. | P2 |
| ECMS-27-TC03 | Delta update re-sends only content modified since the last completed job. | Docs (pre-architecture) | **Pre:** `ECMS-27` and its dependencies (ECMS-25) show `DONE`.<br>1. Read `df/artifacts/ECMS-27/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Delta update re-sends only content modified since the last completed job. | P2 |
| ECMS-27-TC04 | Translation rules declare which component properties are translatable, so URLs and ids are never… | Docs (pre-architecture) | **Pre:** `ECMS-27` and its dependencies (ECMS-25) show `DONE`.<br>1. Read `df/artifacts/ECMS-27/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Translation rules declare which component properties are translatable, so URLs and ids are never sent. | P2 |
| ECMS-27-TC05 | Machine translation via the existing connector framework | Docs (pre-architecture) | **Pre:** `ECMS-27` and its dependencies (ECMS-25) show `DONE`.<br>1. Read `df/artifacts/ECMS-27/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Machine translation via the existing connector framework; human review step. | P2 |
| ECMS-27-TC06 | Language-copy sync status is updated from real modification dates. | Docs (pre-architecture) | **Pre:** `ECMS-27` and its dependencies (ECMS-25) show `DONE`.<br>1. Read `df/artifacts/ECMS-27/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Language-copy sync status is updated from real modification dates. | P2 |

### ECMS-28 — Translation projects UI

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-27 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-28/task.md`

*Why it matters:* Localisation managers create language copies and run translation jobs from the UI.

> **Gate:** do not run these cases until ECMS-28 **and** ECMS-27 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-28-TC01 | Design package for projects, jobs, and side-by-side review. | UI | **Pre:** `ECMS-28` and its dependencies (ECMS-27) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-28/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for projects, jobs, and side-by-side review. | P2 |
| ECMS-28-TC02 | Create language copy from the Content Tree | UI | **Pre:** `ECMS-28` and its dependencies (ECMS-27) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-28/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Create language copy from the Content Tree; job list with states; side-by-side source/target review with approve/reject. | P2 |
| ECMS-28-TC03 | Selenium: create a job, machine-translate, review, approve, and verify target pages. | UI | **Pre:** `ECMS-28` and its dependencies (ECMS-27) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-28/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: create a job, machine-translate, review, approve, and verify target pages. | P2 |

## 2.6 Replication and publishing

Tasks: ECMS-29, ECMS-30, ECMS-31 (3 tasks, 11 test cases)

### ECMS-29 — Replication hardening and publish-with-references

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-02, ECMS-03 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-29/task.md`

*Why it matters:* Nothing goes live with missing images or broken fragments, and operators can see and act on replication health.

> **Gate:** do not run these cases until ECMS-29 **and** ECMS-02, ECMS-03 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-29, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-29-TC01 | Publish tier acknowledges each event | Docs (pre-architecture) | **Pre:** `ECMS-29` and its dependencies (ECMS-02, ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-29/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Publish tier acknowledges each event; the log records COMPLETED or FAILED with an error. | P1 |
| ECMS-29-TC02 | Automatic retry with backoff | Docs (pre-architecture) | **Pre:** `ECMS-29` and its dependencies (ECMS-02, ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-29/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Automatic retry with backoff; queue pause/resume; manual retry of failed events. | P1 |
| ECMS-29-TC03 | Publish-with-references API: given a page, returns (dry run) and then publishes the set of… | Docs (pre-architecture) | **Pre:** `ECMS-29` and its dependencies (ECMS-02, ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-29/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Publish-with-references API: given a page, returns (dry run) and then publishes the set of referenced assets, fragments, and optionally children. | P1 |
| ECMS-29-TC04 | Replication status endpoint counts are accurate. | Docs (pre-architecture) | **Pre:** `ECMS-29` and its dependencies (ECMS-02, ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-29/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Replication status endpoint counts are accurate. | P1 |

### ECMS-30 — Publish-with-references wizard and replication queue console

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-29 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-30/task.md`

*Why it matters:* Authors see exactly what will go live; operators see replication health.

> **Gate:** do not run these cases until ECMS-30 **and** ECMS-29 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-30-TC01 | Design package for a publish wizard (items, references, children, schedule) and a queue console. | UI | **Pre:** `ECMS-30` and its dependencies (ECMS-29) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-30/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a publish wizard (items, references, children, schedule) and a queue console. | P1 |
| ECMS-30-TC02 | Wizard shows the dry-run set, lets the author include/exclude references, and publishes or… | UI | **Pre:** `ECMS-30` and its dependencies (ECMS-29) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-30/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Wizard shows the dry-run set, lets the author include/exclude references, and publishes or schedules. | P1 |
| ECMS-30-TC03 | Queue console: pending/failed/completed counts, failed-event list with retry, pause/resume. | UI | **Pre:** `ECMS-30` and its dependencies (ECMS-29) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-30/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Queue console: pending/failed/completed counts, failed-event list with retry, pause/resume. | P1 |
| ECMS-30-TC04 | Selenium: publish with a referenced unpublished asset and assert both are live. | UI | **Pre:** `ECMS-30` and its dependencies (ECMS-29) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-30/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: publish with a referenced unpublished asset and assert both are live. | P1 |

### ECMS-31 — Preview tier for stakeholder review

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-31/task.md`

*Why it matters:* Stakeholders review content on a production-like tier before it is public.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-31, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-31-TC01 | Solution design for a preview run mode (third tier or publish instance with preview flag),… | Docs (pre-architecture) | **Pre:** `ECMS-31` show `DONE`.<br>1. Read `df/artifacts/ECMS-31/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design for a preview run mode (third tier or publish instance with preview flag), replication target, and access control. | P3 |
| ECMS-31-TC02 | Authors can 'publish to preview' and share a preview URL. | Docs (pre-architecture) | **Pre:** `ECMS-31` show `DONE`.<br>1. Read `df/artifacts/ECMS-31/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Authors can 'publish to preview' and share a preview URL. | P3 |
| ECMS-31-TC03 | Route delivery to devops/backend-dev child tasks. | Docs (pre-architecture) | **Pre:** `ECMS-31` show `DONE`.<br>1. Read `df/artifacts/ECMS-31/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Route delivery to devops/backend-dev child tasks. | P3 |

## 2.7 Staged releases and scheduling

Tasks: ECMS-32, ECMS-33 (2 tasks, 8 test cases)

### ECMS-32 — Staged releases: parallel future versions of a site section

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-32/task.md`

*Why it matters:* Campaign teams build next month's version of a section while normal edits continue, then promote it in one step.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-32, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-32-TC01 | Create a release from one or more source subtrees with a title and target date | Docs (pre-architecture) | **Pre:** `ECMS-32` show `DONE`.<br>1. Read `df/artifacts/ECMS-32/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Create a release from one or more source subtrees with a title and target date; content is copied into a separate release area linked to the source. | P2 |
| ECMS-32-TC02 | Sync from source pulls live changes into the release. | Docs (pre-architecture) | **Pre:** `ECMS-32` show `DONE`.<br>1. Read `df/artifacts/ECMS-32/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Sync from source pulls live changes into the release. | P2 |
| ECMS-32-TC03 | Promote: all pages, only modified pages, or a chosen subset replace the source | Docs (pre-architecture) | **Pre:** `ECMS-32` show `DONE`.<br>1. Read `df/artifacts/ECMS-32/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Promote: all pages, only modified pages, or a chosen subset replace the source; optional publish in the same step or at the scheduled date. | P2 |
| ECMS-32-TC04 | Nested releases supported | Docs (pre-architecture) | **Pre:** `ECMS-32` show `DONE`.<br>1. Read `df/artifacts/ECMS-32/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Nested releases supported; translation jobs can target a release. | P2 |
| ECMS-32-TC05 | Solution design addresses storage (separate ltree root), conflict rules, and permissions. | Docs (pre-architecture) | **Pre:** `ECMS-32` show `DONE`.<br>1. Read `df/artifacts/ECMS-32/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design addresses storage (separate ltree root), conflict rules, and permissions. | P2 |

### ECMS-33 — Staged releases console

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-32 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-33/task.md`

*Why it matters:* Manage releases from the UI.

> **Gate:** do not run these cases until ECMS-33 **and** ECMS-32 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-33-TC01 | Design package for release list, create, compare with source, promote dialog. | UI | **Pre:** `ECMS-33` and its dependencies (ECMS-32) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-33/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for release list, create, compare with source, promote dialog. | P2 |
| ECMS-33-TC02 | Editing inside a release uses the normal editor with a visible release banner. | UI | **Pre:** `ECMS-33` and its dependencies (ECMS-32) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-33/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Editing inside a release uses the normal editor with a visible release banner. | P2 |
| ECMS-33-TC03 | Selenium: create, edit, sync, promote, verify source updated. | UI | **Pre:** `ECMS-33` and its dependencies (ECMS-32) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-33/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: create, edit, sync, promote, verify source updated. | P2 |

## 2.8 Structured content fragments and headless delivery

Tasks: ECMS-34, ECMS-35, ECMS-36, ECMS-37 (4 tasks, 14 test cases)

### ECMS-34 — Structured content fragment models and fragments

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-01 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-34/task.md`

*Why it matters:* One source of truth for channel-neutral structured content (FAQs, bios, product copy) authored once and used everywhere.

> **Gate:** do not run these cases until ECMS-34 **and** ECMS-01 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-34, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-34-TC01 | Fragment models with typed fields: single/multi-line text (plain, markdown, rich), number, boolean,… | Docs (pre-architecture) | **Pre:** `ECMS-34` and its dependencies (ECMS-01) show `DONE`.<br>1. Read `df/artifacts/ECMS-34/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Fragment models with typed fields: single/multi-line text (plain, markdown, rich), number, boolean, date/time, enumeration, tags, content reference (asset/page), fragment reference, JSON. | P1 |
| ECMS-34-TC02 | Field rules: required, default, validation, help text | Docs (pre-architecture) | **Pre:** `ECMS-34` and its dependencies (ECMS-01) show `DONE`.<br>1. Read `df/artifacts/ECMS-34/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Field rules: required, default, validation, help text; models versioned and lockable once in use. | P1 |
| ECMS-34-TC03 | Fragments stored in folders with CRUD, variations, versioning, and publish/unpublish (replicated… | Docs (pre-architecture) | **Pre:** `ECMS-34` and its dependencies (ECMS-01) show `DONE`.<br>1. Read `df/artifacts/ECMS-34/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Fragments stored in folders with CRUD, variations, versioning, and publish/unpublish (replicated like pages). | P1 |
| ECMS-34-TC04 | Solution design decides storage (content tree nodes vs | Docs (pre-architecture) | **Pre:** `ECMS-34` and its dependencies (ECMS-01) show `DONE`.<br>1. Read `df/artifacts/ECMS-34/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design decides storage (content tree nodes vs. dedicated tables) given the existing ltree/JSONB model, and whether PIM schema validation can be reused. | P1 |

### ECMS-35 — GraphQL generated from fragment models, with persisted queries

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-34 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-35/task.md`

*Why it matters:* Front-end and mobile developers self-serve fast, cacheable structured content.

> **Gate:** do not run these cases until ECMS-35 **and** ECMS-34 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-35, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-35-TC01 | GraphQL types, list/filter/sort/paginate queries generated from fragment models and regenerated on… | Docs (pre-architecture) | **Pre:** `ECMS-35` and its dependencies (ECMS-34) show `DONE`.<br>1. Read `df/artifacts/ECMS-35/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | GraphQL types, list/filter/sort/paginate queries generated from fragment models and regenerated on model change. | P1 |
| ECMS-35-TC02 | Nested fragment-reference traversal with depth limits. | Docs (pre-architecture) | **Pre:** `ECMS-35` and its dependencies (ECMS-34) show `DONE`.<br>1. Read `df/artifacts/ECMS-35/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Nested fragment-reference traversal with depth limits. | P1 |
| ECMS-35-TC03 | Persisted queries executable by GET with cache headers and CDN purge on content change. | Docs (pre-architecture) | **Pre:** `ECMS-35` and its dependencies (ECMS-34) show `DONE`.<br>1. Read `df/artifacts/ECMS-35/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Persisted queries executable by GET with cache headers and CDN purge on content change. | P1 |
| ECMS-35-TC04 | Existing page/PIM GraphQL keeps working. | Docs (pre-architecture) | **Pre:** `ECMS-35` and its dependencies (ECMS-34) show `DONE`.<br>1. Read `df/artifacts/ECMS-35/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Existing page/PIM GraphQL keeps working. | P1 |

### ECMS-36 — Fragment model editor and fragment editor

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-34 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-36/task.md`

*Why it matters:* Content strategists define models and editors author fragments in the browser.

> **Gate:** do not run these cases until ECMS-36 **and** ECMS-34 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-36-TC01 | Design package for a model builder (can reuse PIM schema-editor patterns) and a form-style fragment… | UI | **Pre:** `ECMS-36` and its dependencies (ECMS-34) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-36/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a model builder (can reuse PIM schema-editor patterns) and a form-style fragment editor with variations and JSON preview. | P1 |
| ECMS-36-TC02 | Frontend: create/edit models, create/edit fragments, manage variations, publish. | UI | **Pre:** `ECMS-36` and its dependencies (ECMS-34) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-36/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Frontend: create/edit models, create/edit fragments, manage variations, publish. | P1 |
| ECMS-36-TC03 | Selenium: model → fragment → publish → fetch via headless API. | UI | **Pre:** `ECMS-36` and its dependencies (ECMS-34) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-36/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: model → fragment → publish → fetch via headless API. | P1 |

### ECMS-37 — Fragment component for pages (hybrid delivery)

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-34 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-37/task.md`

*Why it matters:* Reuse the same structured content on web pages and in apps.

> **Gate:** do not run these cases until ECMS-37 **and** ECMS-34 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-37, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-37-TC01 | A page component that references a fragment and chooses elements and variation to render. | Docs (pre-architecture) | **Pre:** `ECMS-37` and its dependencies (ECMS-34) show `DONE`.<br>1. Read `df/artifacts/ECMS-37/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | A page component that references a fragment and chooses elements and variation to render. | P2 |
| ECMS-37-TC02 | Editing the fragment updates every page that uses it | Docs (pre-architecture) | **Pre:** `ECMS-37` and its dependencies (ECMS-34) show `DONE`.<br>1. Read `df/artifacts/ECMS-37/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Editing the fragment updates every page that uses it; references reported via ECMS-02. | P2 |
| ECMS-37-TC03 | Split into contract (backend) and renderer (frontend) child tasks. | Docs (pre-architecture) | **Pre:** `ECMS-37` and its dependencies (ECMS-34) show `DONE`.<br>1. Read `df/artifacts/ECMS-37/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Split into contract (backend) and renderer (frontend) child tasks. | P2 |

## 2.9 Experience Fragments

Tasks: ECMS-38, ECMS-39, ECMS-40 (3 tasks, 10 test cases)

### ECMS-38 — Experience Fragment console completion

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-02 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-38/task.md`

*Why it matters:* Run site-wide promos and shared blocks entirely from the fragment console.

> **Gate:** do not run these cases until ECMS-38 **and** ECMS-02 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-38-TC01 | Design package for create-fragment, channel/variation management, and references. | UI | **Pre:** `ECMS-38` and its dependencies (ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-38/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for create-fragment, channel/variation management, and references. | P1 |
| ECMS-38-TC02 | Create fragment (site, locale, category, name, title) | UI | **Pre:** `ECMS-38` and its dependencies (ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-38/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Create fragment (site, locale, category, name, title); add/rename/delete channel variations. | P1 |
| ECMS-38-TC03 | References panel lists every page using the fragment. | UI | **Pre:** `ECMS-38` and its dependencies (ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-38/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | References panel lists every page using the fragment. | P1 |
| ECMS-38-TC04 | Selenium coverage for each action. | UI | **Pre:** `ECMS-38` and its dependencies (ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-38/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium coverage for each action. | P1 |

### ECMS-39 — Experience Fragment export and variations inheriting from master

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-23 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-39/task.md`

*Why it matters:* Reuse web-authored blocks outside the site (email, partner sites) and keep channel variations in sync with the master.

> **Gate:** do not run these cases until ECMS-39 **and** ECMS-23 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-39, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-39-TC01 | Plain HTML and JSON export of a variation, produced by the frontend render service (the backend… | Docs (pre-architecture) | **Pre:** `ECMS-39` and its dependencies (ECMS-23) show `DONE`.<br>1. Read `df/artifacts/ECMS-39/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Plain HTML and JSON export of a variation, produced by the frontend render service (the backend stays JSON-only). | P2 |
| ECMS-39-TC02 | A variation can be created as a live copy of the master and inherits its changes (via ECMS-23). | Docs (pre-architecture) | **Pre:** `ECMS-39` and its dependencies (ECMS-23) show `DONE`.<br>1. Read `df/artifacts/ECMS-39/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | A variation can be created as a live copy of the master and inherits its changes (via ECMS-23). | P2 |
| ECMS-39-TC03 | Export URLs cacheable and purged on publish. | Docs (pre-architecture) | **Pre:** `ECMS-39` and its dependencies (ECMS-23) show `DONE`.<br>1. Read `df/artifacts/ECMS-39/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Export URLs cacheable and purged on publish. | P2 |

### ECMS-40 — Experience Fragment building blocks

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-38 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-40/task.md`

*Why it matters:* Assemble new fragments faster from approved component groups.

> **Gate:** do not run these cases until ECMS-40 **and** ECMS-38 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-40-TC01 | Select components in a fragment and save them as a reusable block. | UI | **Pre:** `ECMS-40` and its dependencies (ECMS-38) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-40/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Select components in a fragment and save them as a reusable block. | P3 |
| ECMS-40-TC02 | Insert blocks into other fragments from the palette. | UI | **Pre:** `ECMS-40` and its dependencies (ECMS-38) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-40/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Insert blocks into other fragments from the palette. | P3 |
| ECMS-40-TC03 | Selenium coverage. | UI | **Pre:** `ECMS-40` and its dependencies (ECMS-38) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-40/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium coverage. | P3 |

## 2.10 Digital Asset Management

Tasks: ECMS-41, ECMS-42, ECMS-43, ECMS-44, ECMS-45 (5 tasks, 23 test cases)

### ECMS-41 — Asset metadata and lifecycle API

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-41/task.md`

*Why it matters:* Assets can be described, reorganised, and deduplicated after upload.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-41-TC01 | `PATCH /api/author/assets/{id}` updates title, description, and custom metadata. | API | **Pre:** `ECMS-41` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-41/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | `PATCH /api/author/assets/{id}` updates title, description, and custom metadata. | P1 |
| ECMS-41-TC02 | Move and rename assets between folders, updating folder counts and keeping renditions. | API | **Pre:** `ECMS-41` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-41/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Move and rename assets between folders, updating folder counts and keeping renditions. | P1 |
| ECMS-41-TC03 | Embedded EXIF/XMP/IPTC metadata extracted at ingest into `metadata`. | API | **Pre:** `ECMS-41` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-41/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Embedded EXIF/XMP/IPTC metadata extracted at ingest into `metadata`. | P1 |
| ECMS-41-TC04 | Duplicate detection by content checksum: upload reports an existing identical asset (warn or reject… | API | **Pre:** `ECMS-41` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-41/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Duplicate detection by content checksum: upload reports an existing identical asset (warn or reject per flag). | P1 |
| ECMS-41-TC05 | Audit entries | API | **Pre:** `ECMS-41` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-41/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Audit entries; unit + IT coverage. | P1 |

### ECMS-42 — Asset Detail page wired end to end

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `frontend-dev` &nbsp;·&nbsp; **Dependencies:** ECMS-41, ECMS-02 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-42/task.md`

*Why it matters:* Authors can inspect and manage an asset on its detail page.

> **Gate:** do not run these cases until ECMS-42 **and** ECMS-41, ECMS-02 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-42-TC01 | Real image/video/PDF preview. | UI | **Pre:** `ECMS-42` and its dependencies (ECMS-41, ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-42/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Real image/video/PDF preview. | P1 |
| ECMS-42-TC02 | Metadata form saves via ECMS-41 and survives reload | UI | **Pre:** `ECMS-42` and its dependencies (ECMS-41, ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-42/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Metadata form saves via ECMS-41 and survives reload; Discard reverts. | P1 |
| ECMS-42-TC03 | Renditions panel lists real renditions with download. | UI | **Pre:** `ECMS-42` and its dependencies (ECMS-41, ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-42/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Renditions panel lists real renditions with download. | P1 |
| ECMS-42-TC04 | Usage panel lists references (ECMS-02). | UI | **Pre:** `ECMS-42` and its dependencies (ECMS-41, ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-42/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Usage panel lists references (ECMS-02). | P1 |
| ECMS-42-TC05 | Move, rename, and delete from the page, with confirmation and visible errors. | UI | **Pre:** `ECMS-42` and its dependencies (ECMS-41, ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-42/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Move, rename, and delete from the page, with confirmation and visible errors. | P1 |
| ECMS-42-TC06 | Follows `asset_detail` design | UI | **Pre:** `ECMS-42` and its dependencies (ECMS-41, ECMS-02) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-42/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Follows `asset_detail` design; Selenium coverage. | P1 |

### ECMS-43 — Metadata schemas and folder profiles

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-41 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-43/task.md`

*Why it matters:* Creative ops define what metadata assets must carry, and uploads get sensible defaults automatically.

> **Gate:** do not run these cases until ECMS-43 **and** ECMS-41 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-43, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-43-TC01 | Metadata schemas per folder or asset type (text, date, dropdown, tags, required fields). | Docs (pre-architecture) | **Pre:** `ECMS-43` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-43/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Metadata schemas per folder or asset type (text, date, dropdown, tags, required fields). | P2 |
| ECMS-43-TC02 | Folder metadata profiles pre-fill values on upload | Docs (pre-architecture) | **Pre:** `ECMS-43` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-43/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Folder metadata profiles pre-fill values on upload; processing profiles choose extra renditions. | P2 |
| ECMS-43-TC03 | Bulk metadata edit and CSV import/export. | Docs (pre-architecture) | **Pre:** `ECMS-43` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-43/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Bulk metadata edit and CSV import/export. | P2 |
| ECMS-43-TC04 | Split into backend and frontend child tasks. | Docs (pre-architecture) | **Pre:** `ECMS-43` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-43/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Split into backend and frontend child tasks. | P2 |

### ECMS-44 — Asset versioning, check-out, expiry/licence, and review

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-41 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-44/task.md`

*Why it matters:* Controlled creative review with an audit trail, and no expired asset reaches the public.

> **Gate:** do not run these cases until ECMS-44 **and** ECMS-41 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-44, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-44-TC01 | Asset versions on binary replace with compare and restore. | Docs (pre-architecture) | **Pre:** `ECMS-44` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-44/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Asset versions on binary replace with compare and restore. | P2 |
| ECMS-44-TC02 | Check-in/check-out preventing concurrent edits. | Docs (pre-architecture) | **Pre:** `ECMS-44` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-44/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Check-in/check-out preventing concurrent edits. | P2 |
| ECMS-44-TC03 | Expiry date and licence status | Docs (pre-architecture) | **Pre:** `ECMS-44` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-44/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Expiry date and licence status; expired assets flagged and blocked from publish. | P2 |
| ECMS-44-TC04 | Review/approval state usable by workflows (ECMS-48). | Docs (pre-architecture) | **Pre:** `ECMS-44` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-44/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Review/approval state usable by workflows (ECMS-48). | P2 |

### ECMS-45 — Collections, share links, bulk ingestion, and asset reports

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-41 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-45/task.md`

*Why it matters:* Package assets for partners without email attachments and measure asset reuse.

> **Gate:** do not run these cases until ECMS-45 **and** ECMS-41 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-45, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-45-TC01 | Static and query-based collections. | Docs (pre-architecture) | **Pre:** `ECMS-45` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-45/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Static and query-based collections. | P3 |
| ECMS-45-TC02 | Expiring share links and multi-asset download with rendition choice (optional watermark). | Docs (pre-architecture) | **Pre:** `ECMS-45` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-45/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Expiring share links and multi-asset download with rendition choice (optional watermark). | P3 |
| ECMS-45-TC03 | Folder upload and bulk import from object storage. | Docs (pre-architecture) | **Pre:** `ECMS-45` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-45/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Folder upload and bulk import from object storage. | P3 |
| ECMS-45-TC04 | Reports: usage, downloads, expiry, storage. | Docs (pre-architecture) | **Pre:** `ECMS-45` and its dependencies (ECMS-41) show `DONE`.<br>1. Read `df/artifacts/ECMS-45/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Reports: usage, downloads, expiry, storage. | P3 |

## 2.11 On-demand media delivery

Tasks: ECMS-46, ECMS-47 (2 tasks, 8 test cases)

### ECMS-46 — On-demand image delivery: URL transforms, presets, focal-point crop

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-03 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-46/task.md`

*Why it matters:* Deliver one master image in any size, crop, and format on demand, cutting production cost and improving page speed.

> **Gate:** do not run these cases until ECMS-46 **and** ECMS-03 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-46, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-46-TC01 | Image endpoint accepting width, height, crop, fit, quality, and format (auto WebP/AVIF by Accept… | Docs (pre-architecture) | **Pre:** `ECMS-46` and its dependencies (ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-46/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Image endpoint accepting width, height, crop, fit, quality, and format (auto WebP/AVIF by Accept header). | P2 |
| ECMS-46-TC02 | Named presets defined by admins | Docs (pre-architecture) | **Pre:** `ECMS-46` and its dependencies (ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-46/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Named presets defined by admins; authors and renderers reference presets, not raw parameters. | P2 |
| ECMS-46-TC03 | Focal point stored per asset and used for crops | Docs (pre-architecture) | **Pre:** `ECMS-46` and its dependencies (ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-46/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Focal point stored per asset and used for crops; in-browser crop/rotate UI. | P2 |
| ECMS-46-TC04 | Results cached and CDN-served | Docs (pre-architecture) | **Pre:** `ECMS-46` and its dependencies (ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-46/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Results cached and CDN-served; purge on asset change. | P2 |
| ECMS-46-TC05 | Renderers emit responsive `srcset` from presets. | Docs (pre-architecture) | **Pre:** `ECMS-46` and its dependencies (ECMS-03) show `DONE`.<br>1. Read `df/artifacts/ECMS-46/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Renderers emit responsive `srcset` from presets. | P2 |

### ECMS-47 — Video and rich media: adaptive streaming, sets, viewers

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-46 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-47/task.md`

*Why it matters:* High-quality video on any network from one upload, and rich product media without custom code.

> **Gate:** do not run these cases until ECMS-47 **and** ECMS-46 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-47, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-47-TC01 | Transcode to adaptive streams (HLS/DASH) with profiles | Docs (pre-architecture) | **Pre:** `ECMS-47` and its dependencies (ECMS-46) show `DONE`.<br>1. Read `df/artifacts/ECMS-47/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Transcode to adaptive streams (HLS/DASH) with profiles; posters and thumbnails; captions. | P3 |
| ECMS-47-TC02 | Image sets and spin sets managed as single assets. | Docs (pre-architecture) | **Pre:** `ECMS-47` and its dependencies (ECMS-46) show `DONE`.<br>1. Read `df/artifacts/ECMS-47/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Image sets and spin sets managed as single assets. | P3 |
| ECMS-47-TC03 | Responsive, accessible viewers (zoom, 360, video) usable from components. | Docs (pre-architecture) | **Pre:** `ECMS-47` and its dependencies (ECMS-46) show `DONE`.<br>1. Read `df/artifacts/ECMS-47/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Responsive, accessible viewers (zoom, 360, video) usable from components. | P3 |

## 2.12 Workflows, projects, and governance

Tasks: ECMS-48, ECMS-49, ECMS-50, ECMS-51, ECMS-52, ECMS-53, ECMS-54, ECMS-55, ECMS-56, ECMS-57 (10 tasks, 34 test cases)

### ECMS-48 — Workflow engine v2

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-48/task.md`

*Why it matters:* Enforce the four-eyes principle before publication with workflows that assign real people and complete properly.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-48, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-48-TC01 | Workflow model CRUD API with validation. | Docs (pre-architecture) | **Pre:** `ECMS-48` show `DONE`.<br>1. Read `df/artifacts/ECMS-48/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Workflow model CRUD API with validation. | P1 |
| ECMS-48-TC02 | Step types: participant (user or group), process (plugin step), OR/AND split, sub-workflow, end. | Docs (pre-architecture) | **Pre:** `ECMS-48` show `DONE`.<br>1. Read `df/artifacts/ECMS-48/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Step types: participant (user or group), process (plugin step), OR/AND split, sub-workflow, end. | P1 |
| ECMS-48-TC03 | Per-user/group inbox query | Docs (pre-architecture) | **Pre:** `ECMS-48` show `DONE`.<br>1. Read `df/artifacts/ECMS-48/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Per-user/group inbox query; delegate, step back, and comment on work items. | P1 |
| ECMS-48-TC04 | Instances complete at an end step | Docs (pre-architecture) | **Pre:** `ECMS-48` show `DONE`.<br>1. Read `df/artifacts/ECMS-48/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Instances complete at an end step; configurable step→content-status mapping. | P1 |
| ECMS-48-TC05 | Timeouts and escalation. | Docs (pre-architecture) | **Pre:** `ECMS-48` show `DONE`.<br>1. Read `df/artifacts/ECMS-48/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Timeouts and escalation. | P1 |
| ECMS-48-TC06 | Ship request-for-publication, request-for-deletion, and publish-later models. | Docs (pre-architecture) | **Pre:** `ECMS-48` show `DONE`.<br>1. Read `df/artifacts/ECMS-48/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Ship request-for-publication, request-for-deletion, and publish-later models. | P1 |
| ECMS-48-TC07 | Illegal transitions return 409/400, never 500. | Docs (pre-architecture) | **Pre:** `ECMS-48` show `DONE`.<br>1. Read `df/artifacts/ECMS-48/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Illegal transitions return 409/400, never 500. | P1 |

### ECMS-49 — Event-triggered workflows and notifications

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-48 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-49/task.md`

*Why it matters:* Automated processing on upload or creation with no manual hand-offs, and nothing stalls unnoticed.

> **Gate:** do not run these cases until ECMS-49 **and** ECMS-48 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-49, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-49-TC01 | Launcher rules: on content event (created/modified/deleted/asset ingested) under a path, start a… | Docs (pre-architecture) | **Pre:** `ECMS-49` and its dependencies (ECMS-48) show `DONE`.<br>1. Read `df/artifacts/ECMS-49/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Launcher rules: on content event (created/modified/deleted/asset ingested) under a path, start a workflow model. | P2 |
| ECMS-49-TC02 | In-app notifications for assigned work items and watched content | Docs (pre-architecture) | **Pre:** `ECMS-49` and its dependencies (ECMS-48) show `DONE`.<br>1. Read `df/artifacts/ECMS-49/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | In-app notifications for assigned work items and watched content; optional email. | P2 |
| ECMS-49-TC03 | Users can watch a page or folder. | Docs (pre-architecture) | **Pre:** `ECMS-49` and its dependencies (ECMS-48) show `DONE`.<br>1. Read `df/artifacts/ECMS-49/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Users can watch a page or folder. | P2 |

### ECMS-50 — Visual workflow model editor

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-48 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-50/task.md`

*Why it matters:* Process owners build approval flows without code.

> **Gate:** do not run these cases until ECMS-50 **and** ECMS-48 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-50-TC01 | Design package for a step/transition canvas. | UI | **Pre:** `ECMS-50` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-50/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a step/transition canvas. | P2 |
| ECMS-50-TC02 | Create and edit models with all ECMS-48 step types | UI | **Pre:** `ECMS-50` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-50/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Create and edit models with all ECMS-48 step types; validation errors shown inline. | P2 |
| ECMS-50-TC03 | Selenium: build a two-step model and run it. | UI | **Pre:** `ECMS-50` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-50/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: build a two-step model and run it. | P2 |

### ECMS-51 — Inbox v2 and workflow administration console

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `frontend-dev` &nbsp;·&nbsp; **Dependencies:** ECMS-48 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-51/task.md`

*Why it matters:* Every user has a clear personal queue, and admins can monitor and repair workflows.

> **Gate:** do not run these cases until ECMS-51 **and** ECMS-48 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-51-TC01 | Inbox lists only the current user's (and their groups') items | UI | **Pre:** `ECMS-51` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-51/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Inbox lists only the current user's (and their groups') items; delegate, step back, comment. | P1 |
| ECMS-51-TC02 | Approve/reject show success only after the API confirms | UI | **Pre:** `ECMS-51` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-51/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Approve/reject show success only after the API confirms; failures are visible and the item stays. | P1 |
| ECMS-51-TC03 | All sort and filter controls work. | UI | **Pre:** `ECMS-51` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-51/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | All sort and filter controls work. | P1 |
| ECMS-51-TC04 | Admin console: running/completed/failed instances with terminate, retry, reassign. | UI | **Pre:** `ECMS-51` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-51/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Admin console: running/completed/failed instances with terminate, retry, reassign. | P1 |
| ECMS-51-TC05 | Follows `workflow_inbox` design | UI | **Pre:** `ECMS-51` and its dependencies (ECMS-48) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-51/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Follows `workflow_inbox` design; Selenium coverage including the API-failure case. | P1 |

### ECMS-52 — Users, groups, and role management API

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-52/task.md`

*Why it matters:* Admins manage who can do what from inside the product.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-52, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-52-TC01 | Solution design: proxy Keycloak's admin API vs | Docs (pre-architecture) | **Pre:** `ECMS-52` show `DONE`.<br>1. Read `df/artifacts/ECMS-52/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Solution design: proxy Keycloak's admin API vs. a local group model mapped to Keycloak identities; records the decision. | P2 |
| ECMS-52-TC02 | List/search users, manage groups and group membership, map groups to roles. | Docs (pre-architecture) | **Pre:** `ECMS-52` show `DONE`.<br>1. Read `df/artifacts/ECMS-52/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | List/search users, manage groups and group membership, map groups to roles. | P2 |
| ECMS-52-TC03 | Groups usable as ACL principals and workflow participants. | Docs (pre-architecture) | **Pre:** `ECMS-52` show `DONE`.<br>1. Read `df/artifacts/ECMS-52/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Groups usable as ACL principals and workflow participants. | P2 |

### ECMS-53 — User, group, and permissions management UI

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `frontend-dev` &nbsp;·&nbsp; **Dependencies:** ECMS-52 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-53/task.md`

*Why it matters:* Isolate brand or country teams to their own subtree without API calls.

> **Gate:** do not run these cases until ECMS-53 **and** ECMS-52 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-53-TC01 | Users and groups screens per `user_management` design. | UI | **Pre:** `ECMS-53` and its dependencies (ECMS-52) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-53/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Users and groups screens per `user_management` design. | P2 |
| ECMS-53-TC02 | Permissions console: per-path ACL editor (allow/deny READ/WRITE/DELETE/PUBLISH/MANAGE_ACL),… | UI | **Pre:** `ECMS-53` and its dependencies (ECMS-52) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-53/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Permissions console: per-path ACL editor (allow/deny READ/WRITE/DELETE/PUBLISH/MANAGE_ACL), inherited entries shown, effective permissions for a chosen user. | P2 |
| ECMS-53-TC03 | Selenium coverage (enforcement verified in a Keycloak-enabled profile). | UI | **Pre:** `ECMS-53` and its dependencies (ECMS-52) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-53/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium coverage (enforcement verified in a Keycloak-enabled profile). | P2 |

### ECMS-54 — Closed user groups for published content

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-52 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-54/task.md`

*Why it matters:* Serve partner portals and member-only sections from the same site.

> **Gate:** do not run these cases until ECMS-54 **and** ECMS-52 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-54, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-54-TC01 | Mark a subtree as restricted to groups | Docs (pre-architecture) | **Pre:** `ECMS-54` and its dependencies (ECMS-52) show `DONE`.<br>1. Read `df/artifacts/ECMS-54/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Mark a subtree as restricted to groups; publish tier and site renderers require login and group membership. | P3 |
| ECMS-54-TC02 | Permission-aware caching so protected pages stay fast and never leak. | Docs (pre-architecture) | **Pre:** `ECMS-54` and its dependencies (ECMS-52) show `DONE`.<br>1. Read `df/artifacts/ECMS-54/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Permission-aware caching so protected pages stay fast and never leak. | P3 |

### ECMS-55 — Project workspaces

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-48 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-55/task.md`

*Why it matters:* One dashboard per campaign or initiative.

> **Gate:** do not run these cases until ECMS-55 **and** ECMS-48 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-55, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-55-TC01 | Project entity grouping pages, assets, fragments, tasks, team, and due dates. | Docs (pre-architecture) | **Pre:** `ECMS-55` and its dependencies (ECMS-48) show `DONE`.<br>1. Read `df/artifacts/ECMS-55/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Project entity grouping pages, assets, fragments, tasks, team, and due dates. | P3 |
| ECMS-55-TC02 | Project dashboard tiles (tasks, assets, releases, translation jobs). | Docs (pre-architecture) | **Pre:** `ECMS-55` and its dependencies (ECMS-48) show `DONE`.<br>1. Read `df/artifacts/ECMS-55/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Project dashboard tiles (tasks, assets, releases, translation jobs). | P3 |
| ECMS-55-TC03 | Project templates. | Docs (pre-architecture) | **Pre:** `ECMS-55` and its dependencies (ECMS-48) show `DONE`.<br>1. Read `df/artifacts/ECMS-55/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Project templates. | P3 |

### ECMS-56 — Maintenance jobs: version, audit, and workflow purge

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-56/task.md`

*Why it matters:* Keep storage bounded in long-running installations.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-56-TC01 | Configurable retention policies for content versions (keep N / keep newer than D, always keep… | API | **Pre:** `ECMS-56` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-56/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Configurable retention policies for content versions (keep N / keep newer than D, always keep labelled), audit log, completed workflows, replication log. | P3 |
| ECMS-56-TC02 | Scheduled jobs with dry-run and run-now endpoints | API | **Pre:** `ECMS-56` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-56/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Scheduled jobs with dry-run and run-now endpoints; results recorded. | P3 |
| ECMS-56-TC03 | Unit + IT coverage. | API | **Pre:** `ECMS-56` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-56/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Unit + IT coverage. | P3 |

### ECMS-57 — Operations dashboard at /settings

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `frontend-dev` &nbsp;·&nbsp; **Dependencies:** ECMS-56 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-57/task.md`

*Why it matters:* Admins see system health and run maintenance from the UI.

> **Gate:** do not run these cases until ECMS-57 **and** ECMS-56 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-57-TC01 | `/settings` per `system_settings` design: service health, replication queue summary, maintenance… | UI | **Pre:** `ECMS-57` and its dependencies (ECMS-56) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-57/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | `/settings` per `system_settings` design: service health, replication queue summary, maintenance jobs with last run and run-now. | P3 |
| ECMS-57-TC02 | Selenium coverage. | UI | **Pre:** `ECMS-57` and its dependencies (ECMS-56) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-57/task.md` → `## Read first` and the frontend-dev evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium coverage. | P3 |

## 2.13 Forms

Tasks: ECMS-58 (1 tasks, 3 test cases)

### ECMS-58 — Forms: builder, rules, submissions, document of record

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-58/task.md`

*Why it matters:* Digital applications and onboarding without a separate forms product.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-58, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-58-TC01 | Spike defining an MVP: form container with field components, visual show/hide/validation rules,… | Docs (pre-architecture) | **Pre:** `ECMS-58` show `DONE`.<br>1. Read `df/artifacts/ECMS-58/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Spike defining an MVP: form container with field components, visual show/hide/validation rules, submission storage, submit actions (store, email, REST, start workflow), and a PDF document of record. | P3 |
| ECMS-58-TC02 | Security review (spam protection, PII handling, retention). | Docs (pre-architecture) | **Pre:** `ECMS-58` show `DONE`.<br>1. Read `df/artifacts/ECMS-58/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Security review (spam protection, PII handling, retention). | P3 |
| ECMS-58-TC03 | Follow-on task split and estimate. | Docs (pre-architecture) | **Pre:** `ECMS-58` show `DONE`.<br>1. Read `df/artifacts/ECMS-58/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Follow-on task split and estimate. | P3 |

## 2.14 Search, SEO, and personalisation

Tasks: ECMS-59, ECMS-60, ECMS-61, ECMS-62, ECMS-63 (5 tasks, 19 test cases)

### ECMS-59 — SEO foundation: vanity URLs, redirects, hreflang, canonical, social metadata

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** ECMS-06 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-59/task.md`

*Why it matters:* Protect organic traffic during migrations and campaigns.

> **Gate:** do not run these cases until ECMS-59 **and** ECMS-06 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-59, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-59-TC01 | Vanity URL resolution on publish delivery, unique per site. | Docs (pre-architecture) | **Pre:** `ECMS-59` and its dependencies (ECMS-06) show `DONE`.<br>1. Read `df/artifacts/ECMS-59/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Vanity URL resolution on publish delivery, unique per site. | P1 |
| ECMS-59-TC02 | Redirect rules (page-level and a managed map, 301/302) with an API. | Docs (pre-architecture) | **Pre:** `ECMS-59` and its dependencies (ECMS-06) show `DONE`.<br>1. Read `df/artifacts/ECMS-59/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Redirect rules (page-level and a managed map, 301/302) with an API. | P1 |
| ECMS-59-TC03 | Page JSON includes canonical, robots, OG/Twitter fields, and hreflang alternates derived from… | Docs (pre-architecture) | **Pre:** `ECMS-59` and its dependencies (ECMS-06) show `DONE`.<br>1. Read `df/artifacts/ECMS-59/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Page JSON includes canonical, robots, OG/Twitter fields, and hreflang alternates derived from language copies. | P1 |
| ECMS-59-TC04 | Sitemap includes hreflang alternates and excludes noindex pages. | Docs (pre-architecture) | **Pre:** `ECMS-59` and its dependencies (ECMS-06) show `DONE`.<br>1. Read `df/artifacts/ECMS-59/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Sitemap includes hreflang alternates and excludes noindex pages. | P1 |

### ECMS-60 — SEO delivery on the site and redirect manager

**Priority:** P1 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-59 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-60/task.md`

*Why it matters:* Search engines see correct metadata; marketers manage redirects themselves.

> **Gate:** do not run these cases until ECMS-60 **and** ECMS-59 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-60-TC01 | Design package for a redirect manager. | UI | **Pre:** `ECMS-60` and its dependencies (ECMS-59) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-60/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for a redirect manager. | P1 |
| ECMS-60-TC02 | `site-nextjs` and `site-nuxt` emit title, description, canonical, robots, hreflang, OG/Twitter, and… | UI | **Pre:** `ECMS-60` and its dependencies (ECMS-59) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-60/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | `site-nextjs` and `site-nuxt` emit title, description, canonical, robots, hreflang, OG/Twitter, and JSON-LD; honour redirects and vanity URLs. | P1 |
| ECMS-60-TC03 | Admin redirect manager with CSV import/export. | UI | **Pre:** `ECMS-60` and its dependencies (ECMS-59) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-60/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Admin redirect manager with CSV import/export. | P1 |
| ECMS-60-TC04 | Selenium: assert meta tags and redirect responses on the public site. | UI | **Pre:** `ECMS-60` and its dependencies (ECMS-59) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-60/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: assert meta tags and redirect responses on the public site. | P1 |

### ECMS-61 — Content search v2: reindex, facets, suggestions

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `backend-dev` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-61/task.md`

*Why it matters:* Visitors and authors find content quickly without an external search product.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-61-TC01 | Admin reindex endpoint for content (full and per site) using `IndexRebuildService`. | API | **Pre:** `ECMS-61` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-61/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Admin reindex endpoint for content (full and per site) using `IndexRebuildService`. | P2 |
| ECMS-61-TC02 | Facets (template, tag, locale, site), suggestions/autocomplete, field boosting, language analysers. | API | **Pre:** `ECMS-61` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-61/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Facets (template, tag, locale, site), suggestions/autocomplete, field boosting, language analysers. | P2 |
| ECMS-61-TC03 | Author-side search across drafts for omnisearch (ECMS-62). | API | **Pre:** `ECMS-61` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-61/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Author-side search across drafts for omnisearch (ECMS-62). | P2 |
| ECMS-61-TC04 | IT coverage against the Elasticsearch container. | API | **Pre:** `ECMS-61` show `DONE`.<br>1. Find the endpoint/behaviour in `df/artifacts/ECMS-61/task.md` → `## Read first` and the backend-dev evidence folder; call it directly (curl/Postman) and inspect the response.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | IT coverage against the Elasticsearch container. | P2 |

### ECMS-62 — Admin omnisearch and site search component

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** ECMS-61 &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-62/task.md`

*Why it matters:* Authors jump to any page, asset, or fragment; visitors search the site with suggestions.

> **Gate:** do not run these cases until ECMS-62 **and** ECMS-61 all show `DONE` on `df/runtime/board.md` — most acceptance criteria below depend on the dependency's behaviour existing first.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-62-TC01 | Design package for omnisearch results. | UI | **Pre:** `ECMS-62` and its dependencies (ECMS-61) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-62/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for omnisearch results. | P2 |
| ECMS-62-TC02 | ⌘K omnisearch across pages, assets, fragments, and tags. | UI | **Pre:** `ECMS-62` and its dependencies (ECMS-61) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-62/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | ⌘K omnisearch across pages, assets, fragments, and tags. | P2 |
| ECMS-62-TC03 | Site search component with live suggestions and facets. | UI | **Pre:** `ECMS-62` and its dependencies (ECMS-61) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-62/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Site search component with live suggestions and facets. | P2 |
| ECMS-62-TC04 | Selenium coverage. | UI | **Pre:** `ECMS-62` and its dependencies (ECMS-61) show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-62/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium coverage. | P2 |

### ECMS-63 — Native personalisation: visitor context, segments, targeted experiences, A/B

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-63/task.md`

*Why it matters:* Persona-based content and simple experiments without a separate product.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-63, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-63-TC01 | Spike defining visitor context stores (device, geo, time, behaviour), a segment rule editor,… | Docs (pre-architecture) | **Pre:** `ECMS-63` show `DONE`.<br>1. Read `df/artifacts/ECMS-63/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Spike defining visitor context stores (device, geo, time, behaviour), a segment rule editor, per-component experience variants, and A/B allocation with basic reporting. | P3 |
| ECMS-63-TC02 | Privacy and consent requirements documented. | Docs (pre-architecture) | **Pre:** `ECMS-63` show `DONE`.<br>1. Read `df/artifacts/ECMS-63/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Privacy and consent requirements documented. | P3 |
| ECMS-63-TC03 | Follow-on task split. | Docs (pre-architecture) | **Pre:** `ECMS-63` show `DONE`.<br>1. Read `df/artifacts/ECMS-63/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Follow-on task split. | P3 |

## 2.15 Delivery performance

Tasks: ECMS-64 (1 tasks, 3 test cases)

### ECMS-64 — Real-user monitoring and Core Web Vitals

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-64/task.md`

*Why it matters:* Performance and engagement insight per page without third-party scripts.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-64, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-64-TC01 | Lightweight beacon from the site renderers (LCP, INP, CLS) to a collection endpoint, sampled. | Docs (pre-architecture) | **Pre:** `ECMS-64` show `DONE`.<br>1. Read `df/artifacts/ECMS-64/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Lightweight beacon from the site renderers (LCP, INP, CLS) to a collection endpoint, sampled. | P3 |
| ECMS-64-TC02 | Per-page dashboard in the admin. | Docs (pre-architecture) | **Pre:** `ECMS-64` show `DONE`.<br>1. Read `df/artifacts/ECMS-64/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Per-page dashboard in the admin. | P3 |
| ECMS-64-TC03 | Privacy-safe (no personal data). | Docs (pre-architecture) | **Pre:** `ECMS-64` show `DONE`.<br>1. Read `df/artifacts/ECMS-64/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Privacy-safe (no personal data). | P3 |

## 2.16 Platform and extensibility

Tasks: ECMS-65, ECMS-66 (2 tasks, 6 test cases)

### ECMS-65 — Package manager UI

**Priority:** P3 &nbsp;·&nbsp; **Owner lane:** `designer` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-65/task.md`

*Why it matters:* Move content between environments without API calls.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-65-TC01 | Design package for package build/upload/install. | UI | **Pre:** `ECMS-65` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-65/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Design package for package build/upload/install. | P3 |
| ECMS-65-TC02 | Build a package from a path (JSON/ZIP), download it, upload and install with overwrite option, show… | UI | **Pre:** `ECMS-65` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-65/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Build a package from a path (JSON/ZIP), download it, upload and install with overwrite option, show created/updated/skipped/errors. | P3 |
| ECMS-65-TC03 | Selenium: export, delete, import, verify restored. | UI | **Pre:** `ECMS-65` show `DONE`.<br>1. Find the screen in `df/artifacts/ECMS-65/task.md` → `## Read first` and the designer evidence folder; perform the action in the Admin UI and observe the result.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Selenium: export, delete, import, verify restored. | P3 |

### ECMS-66 — Outbound webhooks and event subscriptions

**Priority:** P2 &nbsp;·&nbsp; **Owner lane:** `sa` &nbsp;·&nbsp; **Dependencies:** none &nbsp;·&nbsp; **Task spec:** `df/artifacts/ECMS-66/task.md`

*Why it matters:* Build integrations on top of FlexCMS without forking it.

> **This task is pre-architecture (`NEEDS_ARCHITECTURE`).** Its criteria below are the shape the eventual delivery must take, not yet a runnable UI/API surface — see §1.6. When `sa` splits ECMS-66, each child task needs its own AC-per-row test case section generated the same way; don't try to hand-test these `Docs` rows against a live system.

| ID | Test Case | Track | Steps | Expected Result | Pri |
|---|---|---|---|---|---|
| ECMS-66-TC01 | Subscriptions for content published/unpublished/deleted, asset ingested, workflow transitions,… | Docs (pre-architecture) | **Pre:** `ECMS-66` show `DONE`.<br>1. Read `df/artifacts/ECMS-66/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Subscriptions for content published/unpublished/deleted, asset ingested, workflow transitions, product published. | P2 |
| ECMS-66-TC02 | Signed payloads (HMAC), retries with backoff, delivery log, disable-on-failure. | Docs (pre-architecture) | **Pre:** `ECMS-66` show `DONE`.<br>1. Read `df/artifacts/ECMS-66/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Signed payloads (HMAC), retries with backoff, delivery log, disable-on-failure. | P2 |
| ECMS-66-TC03 | Admin API for subscriptions. | Docs (pre-architecture) | **Pre:** `ECMS-66` show `DONE`.<br>1. Read `df/artifacts/ECMS-66/solution-design.md` and the child task(s) it produced; confirm one of them carries this exact criterion as one of its own acceptance criteria, worded the same or a documented refinement of it.<br>2. Compare the outcome to **Expected Result** exactly — no partial credit.<br>3. Capture evidence (response body / screenshot) either way, per `docs/MANUAL_TEST_CASES_AUTHORING.md` §1.4. | Admin API for subscriptions. | P2 |

---

## 3. Execution log

One row per test case, filled in as each task reaches `DONE` and is verified. Copy this table (or generate it fresh — it's mechanical) into your working tracker; it is intentionally not pre-filled here since it would be 66 tasks × its ACs of empty rows checked into the repo for no benefit before any task is done.

```
| ID | Result | Tester | Date | Task DONE date | Notes |
|---|---|---|---|---|---|
```

Per-task rollup: mark a task **verified** only once every one of its `-TCnn` rows is PASS or an accepted N/A. A single FAIL blocks the task's verified status regardless of how many other criteria passed.

## 4. Related documents

| Document | Contents |
|---|---|
| `df/artifacts/ECMS-00/gap-analysis.md` | The comparison this backlog comes from, and why each task exists |
| `df/artifacts/ECMS-NN/task.md` | Full spec for each task: business goal, current state, dependencies, read-first files |
| `docs/MANUAL_TEST_CASES_AUTHORING.md` | The 852-case suite for FlexCMS's **existing** authoring surface — run that, not this, for anything already `DONE` |
| `df/runtime/board.md` | Live task states — the single source of truth for whether a task is ready to test |
| `df/runtime/risks.md` | Where to log a `DONE` task that fails its own acceptance criteria here |
