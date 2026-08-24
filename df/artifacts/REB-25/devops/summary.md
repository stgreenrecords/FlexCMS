# REB-25 — cross-cutting E2E hardening

Harness: `frontend/apps/selenium-e2e/src/harness/`
Suite: `frontend/apps/selenium-e2e/src/cases/admin/harness-hardening-suite.spec.ts`
Commands: `pnpm test:reb25` / `pnpm test:reb25:ci` (added to the gate's `full` mode)
Matrix: `df/artifacts/REB-25/devops/hardening-matrix.csv`

**Result: 10 scenarios, 10 passing. 10 matrix rows — 9 PASS, 1 BLOCKED.**

## What was built

Six modules behind one barrel (`src/harness/index.ts`), so a new suite has an obvious
default rather than reinventing each of these:

| Module | Provides |
|---|---|
| `preflight.ts` | Reachability of admin, author API, author health, publish API and public site, with a diagnostic naming the endpoint, its URL and the env var that redirects it |
| `publishVerification.ts` | `PublishVerifier` — page/node/XF reads, marker polling, `serves()`, and the guard below |
| `testData.ts` | `TestDataNamespace` — per-run namespaced names for content/asset/SKU/catalog/fragment/live-copy, plus a cleanup registry and audit |
| `browserHealth.ts` | Severe console errors with a justified ignore list, broken image/video/font detection, failed same-origin requests |
| `accessibility.ts` | Landmarks, single `h1`, accessible names, keyboard reachability, focus indicator |
| `failureTaxonomy.ts` | `FindingLog` over four classes: product defect, environment blocker, unsupported UI, test bug |

Each guarantee here exists because the corresponding mistake was made earlier in this
program, and the suite asserts the guarantee rather than the happy path.

### The publish guard (scenario 2, AC2)

The failure this prevents is quiet and total: point a "publish" assertion at the author
URL and it passes for **every** page, because the author instance serves content whether
or not it was ever published. The suite stays green and proves nothing.

So `PublishVerifier` validates at construction — it refuses an empty publish URL, and
refuses one whose host matches the author API or author health host. `S2` asserts both
refusals, then asserts the real verifier is healthy **and** that a path which was never
published is not served, so `serves()` cannot be a function that always says yes.

**AC2 is satisfied by placement rather than by editing seven suites.** `AuthorApiClient`
now derives its publish base from `publishVerifier(env).baseUrl`, and every publish read
in REB-18/19/20/21/23/26 already flows through that client — so they all inherit the
guard without a change to their call sites, and without risking 124 passing tests.
REB-22 is the one suite that built publish URLs itself; it reads the same
`env.publishUrl`, and the guard now fires on client construction in the same run.

### Cleanup in dependency order (scenarios 3–4, AC3)

REB-23's probe runs stranded ten catalogs and nine products, because teardown deleted in
discovery order and could not even see the dependents it had to remove first. The
registry fixes both halves: the deleter is registered **at creation**, closing over the
identifier the create response returned, and teardown runs newest-first so dependents go
before what they depend on.

`S4` proves the ordering with a source and its dependent, proves a *failed* delete is
recorded rather than thrown (one stuck entity must not hide the audit), and proves
retention is explicit — `retain(id, reason)` puts an entity in a separate bucket with its
reason, which is the distinction AC3 turns on. Retaining an untracked id throws.

### Console health that can still find defects (scenario 5)

Filtering too eagerly is how a suite stops finding things. Two defects in this program
were visible *only* in the console — `/components` rendering an empty document with a
`TypeError`, and the editor's React render loop — so `S5` asserts that **no ignore rule
matches a real `TypeError`**, and that every rule carries a written justification. The
list is three specific entries: a missing favicon, React's DevTools advisory, and Next's
Fast Refresh notice.

## Findings

**1 BLOCKED row — missing stable selectors (scenario 8, AC4).** `/sites`, `/dashboard`
and `/dam` have no `data-testid` on their headings, so suites match on visible copy and
break when the copy changes. `/dam` is the worst case: it renders no `h1` at all, so
there is nothing to match. Recorded with file references
(`admin/(admin)/{sites,dashboard,dam}/page.tsx`) as an actionable frontend follow-up
rather than worked around silently. The shell selector every suite depends on
(`sidebar-nav`) is asserted present, since its loss would break navigation helpers across
the whole program.

**1 classified finding — accessibility naming gaps** on the admin routes, classified
`unsupported-ui` rather than failed. An unlabelled icon-only control is a real defect,
but failing the gate on it would block CI on frontend-lane work; `S7` asserts the
*structural* checks (landmarks, single `h1`, keyboard reachability) and classifies the
naming and focus-indicator gaps.

## A mistake in the suite, and the class it belongs to

`S3` first asserted `expect(first.sku()).to.equal(first.sku().toUpperCase())` — two calls
to a generator whose whole purpose is to return a *different* name each time, so it
compared two different SKUs. A `test-bug` in the taxonomy's own terms: the helper behaved
correctly and the assertion was wrong. Fixed by capturing once.

## Acceptance criteria

- **AC1** — helpers exist for preflight, publish verification, unique test data, cleanup,
  screenshots (existing `attachFailureScreenshot`, asserted in `S9`), console/network
  checks and accessibility smoke.
- **AC2** — satisfied through `AuthorApiClient`, so every existing publish read inherits
  the guard; see the reasoning above for why that beats editing each suite.
- **AC3** — the registry distinguishes deleted, deliberately retained, and failed, and
  `clean` is false whenever anything failed.
- **AC4** — missing selectors and the accessibility gaps are recorded with file
  references and an action, via the BLOCKED matrix row and the `FindingLog`.
- **AC5** — this file plus the matrix CSV. `S9` asserts the JUnit directory exists, holds
  more than five reports, and that **every** report is parseable and carries a `tests="…"`
  count — a truncated report is worse than a missing one, because CI reads it as a pass.
  That is the contract REB-14's retention depends on.

## Note for REB-14

The gate's `full` mode now runs 13 suites. `S9` checks the artifacts CI will collect, but
it checks them *locally*: it cannot verify retention or upload behaviour, which remains
REB-14's own scope.
