# FlexCMS — Retest & Verification Plan

> **Purpose:** Replace formal, box-ticking "testing" with **evidence-based verification against a
> live, seeded stack.** Every functional area is retested the way a real user exercises it, and
> nothing is marked done without a captured artifact proving it works.
>
> **Owner:** runs through the Agent Factory (`agents/FACTORY.md`). Each area below is a queued
> retest task (`RT-xx`) with evidence-based acceptance criteria.

---

## 1. Why the current results are untrustworthy (root cause)

| Symptom you saw | Root cause |
|---|---|
| "All tasks DONE" but can't edit page dummy data | The page-editor "save" test asserts against a **mocked** API that always returns `{"success":true}`. The real `PUT /api/author/content/node/properties` round-trip was never verified. |
| Missing images on the demo website | 152 assets are listed in `Design/sample-website-tut/missing-assets.txt` — **specified but never generated/uploaded**. Seeded pages reference DAM paths that 404. |
| Green E2E suite, broken product | **All 19 Playwright specs intercept `**/api/**`** and serve fixture JSON. Tests exercise the UI against fake data, never the backend/DB/seed. |
| "Live mode" doesn't help | `USE_LIVE_API` is only honored by the shared fixture; the 19 per-spec inline `page.route` blocks ignore it, so mocks are never actually turned off. |
| Formal ACs passed, feature absent | ACs were "component implemented / build passes", not "user action produces the expected observable outcome." |

**Principle going forward:** *A test that cannot fail when the feature is broken is not a test.*
Mocked-UI tests are kept only for fast component-rendering checks — they are **never** evidence that a
feature works end to end.

---

## 2. The verification pyramid (tiers)

Run bottom-up. A higher tier may not be marked green while a lower tier for the same area is red.

| Tier | What it proves | Runs against | Can be mocked? |
|---|---|---|---|
| **T0 Build** | It compiles / type-checks | — | n/a |
| **T1 Unit** | Logic in isolation | in-process | yes |
| **T2 Contract** | `component_definitions.data_schema` matches what each renderer reads | schema JSON + renderer props | fixtures ok |
| **T3 Live API/DB** | Real endpoints + real Postgres/seed behave per spec | **running Author/Publish + seeded DB** | **NO** |
| **T4 E2E journeys** | Real user flows in the browser, **no API mocks** | **Admin UI + live backend** | **NO** |
| **T5 Asset & render integrity** | Demo site renders every page; **every image resolves (HTTP 200)** | **site-nextjs + Author/DAM** | **NO** |
| **T6 Exploratory smoke** | Human sanity pass on the top journeys | full stack | no |

The quick automated gate for T3/T5 is `scripts/live_smoke.py` (see §5). It targets exactly the two
reported failures: page-edit round-trip and broken images.

---

## 3. Definition of Done (upgraded)

A retest task may only reach the factory `done` station when **all** of these hold:

1. The relevant tier(s) pass **against the live seeded stack** (not mocks).
2. **Evidence is attached** to the task (see §4) — no evidence, no pass.
3. Any defect found is filed as a new factory task in `ready` (bug-driven loop, §6) — not silently fixed and forgotten.
4. The reviewer at the `review` station **re-ran the evidence command themselves** (or replayed the trace) — a different person than the builder.

> "It builds" and "the mocked test is green" are **necessary but not sufficient**. They never close a retest task.

---

## 4. Evidence requirements (per tier)

Store evidence under `docs/retest-runs/<RT-id>/` and link it in the task's completion note.

| Tier | Required artifact |
|---|---|
| T3 Live API/DB | Saved request+response transcript (method, URL, status, key response fields) **and**, where state changes, a before/after `SELECT` from Postgres (via pgAdmin/`psql`). |
| T4 E2E journeys | Playwright **trace.zip** + screenshot, run with mocks OFF (`USE_LIVE_API=1`). The spec must fail if the backend is down. |
| T5 Asset/render | For each tested page: a screenshot **and** a list of every `<img>`/background URL with its HTTP status — all must be 200. |
| T6 Exploratory | Dated checklist (§7) with pass/fail + notes per journey. |

Evidence must show the **real value**, e.g. the edited title string appearing in the headless JSON,
not just a 200 status.

---

## 5. Automated live smoke (`scripts/live_smoke.py`)

A zero-dependency probe of the running stack. It is the fast T3/T5 gate and directly reproduces the
two reported bugs. Run after `flex start local all` + seeding:

```bash
python3 scripts/live_smoke.py --page content/tut-usa/home
```

It checks: service health; component-registry non-empty; a page returns a component tree;
**page-edit round-trip** (GET props → PUT a sentinel prop → GET confirms it persisted → revert);
and **image integrity** (fetch the rendered demo page, extract every image URL, HEAD each, fail on any non-200).
Exit code ≠ 0 on any failure. This should be wired into CI as a stack-up job and into
`factory.py validate` usage for retest tasks.

---

## 6. Bug-driven loop (how findings feed the factory)

1. A retest task at T3–T6 finds a real defect.
2. File it immediately: `flex agent add --id BUG-xx --title "…" --priority P0 --modules <mod> --station ready`
   with a reproduction (the failing evidence) in the description.
3. The retest task goes to `fail` → `rework` only if it cannot proceed; otherwise it stays open and
   lists the `BUG-xx` it spawned.
4. A worker fixes `BUG-xx`, attaches the now-passing evidence, and the reviewer replays it.
5. The retest task closes only when its area is green **and** every spawned `BUG-xx` is `done`.

---

## 7. Functional-area retest matrix

Each row is a queued `RT-xx` task. "Cases" reference the existing `docs/QA_TEST_PLAN.md` IDs so we
reuse the 430 documented cases instead of reinventing them — but they must be executed **live**, with
evidence, per §3–§4.

| RT | Area | Tier focus | Reuses QA cases | Directly targets |
|----|------|-----------|-----------------|------------------|
| **RT-00** | Live test harness — make `USE_LIVE_API` truly disable all mocks; add stack-up Playwright project | T4 infra | — | "green tests, broken product" |
| **RT-01** | Asset integrity — generate/upload (or placeholder) the 152 missing images; verify every DAM ref resolves | T5 | TUT-007→010, TUT-030, SDK-016 | **missing images** |
| **RT-02** | Page-edit round-trip — edit dummy data in the editor → persist → headless reflects → site renders | T3+T4 | UI-021→037, AUTH-017/018, HEAD-001 | **can't edit page data** |
| **RT-03** | Content/Author/Headless/GraphQL live API | T3 | CMS-*, AUTH-*, HEAD-*, GQL-* | data correctness |
| **RT-04** | Demo site end-to-end render — all 61 pages render with components + images | T5 | TUT-016→030, SDK-010→019 | broken demo site |
| **RT-05** | DAM + PIM live | T3+T4 | DAM-*, PIM-*, UI-038→079 | asset/product flows |
| **RT-06** | Workflow + replication + cache/CDN | T3 | WF-*, REP-*, CACHE-* | publish pipeline |
| **RT-07** | Admin UI journeys in LIVE mode (tree, DAM, PIM, sites, preview, workflows) | T4 | UI-001→105 | admin usability |
| **RT-08** | Evidence gate — wire `live_smoke.py` into CI (stack-up job) + factory validate usage | infra | Appendix D | prevent regression |

Dependencies: RT-00 unblocks RT-02/04/05/07; RT-01 unblocks RT-04; RT-08 after RT-00.

---

## 8. Execution order (recommended sprint)

1. **RT-00 + RT-01** (P0) — get a real test harness and stop the image bleed. Without these, everything else stays fake.
2. **RT-02** (P0) — prove the single most-reported flow (editing) works end to end.
3. **RT-03, RT-04** (P1) — data correctness + demo site render.
4. **RT-05, RT-06, RT-07** (P1) — remaining pillars and admin journeys.
5. **RT-08** (P2) — lock the gains into CI so this can't silently rot again.

Track all of it on the factory board: `flex agent status`.
```

## 9. What changes permanently

- **`validate` is no longer sufficient to close a task** — retest/feature tasks require live evidence (FACTORY.md §5 updated).
- **CI gains a stack-up job** (RT-08) running `live_smoke.py` against a real backend + seed, so "green tests / broken product" is caught automatically.
- **`missing-assets.txt` becomes a tracked backlog**, not a dumping ground — RT-01 drives it to zero.

