# REB-26 — Test scenarios (devops)

Scenario design for the exhaustive per-UI-component sample-site editing suite.
Every scenario below is implemented in
`frontend/apps/selenium-e2e/src/cases/admin/component-editing-sweep.spec.ts` and
runs against the live local stack (author `:8080`, publish `:8081`, admin `:3000`,
reference site `:3001`).

Coverage claim: **100% of the active component contracts**. The suite derives its
work list from `Design/tut-usa/generated/component-contracts.json` at run time, so
"100%" means the current generated count, not a number hard-coded in a test.

## How a component is covered

Each component contract produces one scenario instance that walks five layers:

| # | Layer | What it proves | Evidence |
|---|---|---|---|
| 1 | `ui` | The editor renders a control per contracted field, accepts an authored value, and still shows it after a full page reload | `probeField`, `writeFieldValue`, `readFieldValue` after `refreshAndWait` |
| 2 | `author-api` | The authored value is persisted on the component node, and structured (list/object/asset) values survive the editor's save unchanged | `GET /api/author/content/node` |
| 3 | `headless` | The value is served by the delivery API for the page | `GET /api/content/v1/pages/{path}` |
| 3b | `graphql` | The GraphQL delivery API resolves the same page | `query { page(path:…) { title } }`, once per batch |
| 4 | `rendered` | The reference site renders the authored value; assets resolve to a real image; references render as links | page source + `imageSourcesContaining` / `brokenImageSources` / `linkHrefsContaining` |
| 4b | `preview` | The draft preview route renders the authored value from the author API | `GET :3001/preview/{site}/{page}` |
| 5 | `publish` | The value is served by the **publish** environment after a tree-replicating publish | `POST /api/author/content/bulk/publish` then `GET :8081/api/content/v1/pages/{path}` |

A component is `PASS` only when `ui`, `author-api`, `headless`, and `publish` are
all proven. `rendered` is recorded when the reference site surfaces the value;
components the site renderer does not surface get a note instead of a pass,
because the renderer's component map is smaller than the contract set and that is
a rendering-coverage question, not an authoring defect.

## Scenario list

### S1 — Generation completeness (no browser)

- Asserts every active contract lands in exactly one batch, and that batch
  membership is unique per `resourceType`.
- Asserts no active contract has zero authorable fields.
- Records a blocker for any contract with no editor-authorable field at all
  (every field lossy), which would make the component unauthorable today.

### S2.n — Per-batch authoring sweep (one Mocha test per batch)

For each batch of `REB26_BATCH_SIZE` components (default 20):

1. **Fixture page.** Create an ephemeral page under `content.tut-usa` with the
   `global-home-page` template. Seeded demo pages are never mutated.
2. **Seed.** Create one component node per contract with contract-shaped values
   for every field; `flexcmsTemplateDetached: true` so the node is editable.
   Asset fields are seeded with a **real imported image** from the REB-07 asset
   pipeline, so a rendered `<img>` can be proven to resolve rather than 404.
   Container components additionally get a child node.
3. **Author through the UI.** Select each component as the single *unlocked*
   Layers entry whose label equals the contract title, probe every contracted
   field, and author:
   - the component's primary editable field (deterministic preference order:
     scalar text → richtext text → textarea → text → number → toggle → select);
   - every rich-text field (category assertion);
   - every reference field (category assertion).
4. **Save once** for the whole page, then reload and re-read every authored value.
5. **Verify** layers 2–5 as described above.
6. **Clean up.** Delete the fixture page and confirm it is gone.
7. **Record.** Write `component-editing-matrix.csv` and `field-coverage.csv`
   after every batch, so a long run leaves usable evidence even if interrupted.
8. **Assert.** The batch must produce zero `FAIL` rows.

### S3 — Matrix completeness (no browser)

- Matrix row count equals the active contract count.
- Every active `resourceType` has a row (`AC1`, `AC2`).
- No component ends the run in `FAIL`.

### S4 — Publish-side residue after author deletion

- Asserts the author environment no longer holds the fixture page (cleanup worked).
- Queries the publish environment for the same path and records, with live
  evidence, whether deleting a published page removes it there. Today it does not
  — see `R26-1`/`R26-2` in `blockers.md`. This scenario is what produces that
  evidence, rather than a human asserting it from reading code.

### Fixture strategy — one reused page

All batches share the fixture path `content.tut-usa.reb26-component-sweep`, which
each batch deletes and recreates. The sweep must publish its fixture to satisfy
AC5, and no supported API can un-publish content (`R26-1`, `R26-2`), so a
per-batch page name would leave one permanently published orphan per batch on
every run. Reusing one path bounds the residue to a single path that each run
overwrites. Consequences the suite handles explicitly:

- Publish verification polls until **this batch's** authored values appear, never
  merely until "some components" exist — the previous batch's content is already
  being served at that path.
- The publish-side page accumulates components across batches, because a
  published page is never pruned. Assertions look components up by name, so this
  is inert; it is recorded as an observation rather than hidden.

## Category-specific assertions (AC6)

| Category | Detection | Assertion |
|---|---|---|
| Asset | `isAsset` field | Seeded with a real imported image; author API + headless keep the URL; reference site renders an `<img>` whose `naturalWidth > 0` |
| Rich text | `isRichText` field | Authored through the UI with markup; value round-trips through all layers unchanged |
| Reference | `isReference` field | Authored through the UI; round-trips; rendered page is checked for an anchor carrying the marker |
| Container | `isContainer` | A child node seeded before the edit must still exist after the editor's save |
| Form / data capture | group `Forms, Data Capture & Consent` | Rendered page must expose interactive controls (`input`/`select`/`textarea`/`button`/ARIA checkbox-radio) |
| Navigation & search, Commerce & catalog | group name | Rendered page must expose links |
| List / object | `type: array` / `object` | **Not** authored through the UI (blocker B-1); seeded structured through the API and asserted to still be an array/object after the editor's save |

## Deliberate non-goals

- **No UI authoring of list/object/asset fields.** The editor renders them as
  `String(value)` in a text input, so a UI edit would persist a string where the
  contract requires structured data. Authoring them through the UI and asserting
  success would certify data corruption as correct behaviour.
- **No PIM writes.** Commerce components are authored with reference/scalar test
  values only; no product data is created or mutated.
- **No mutation of seeded sample-site content.** Every edit happens on an
  ephemeral fixture page that is deleted at the end of its batch.

## Run instructions

```bash
# Prerequisites: author :8080, publish :8081, admin :3000, site :3001 all running
cd frontend/apps/selenium-e2e

pnpm test:reb26          # full sweep, spec reporter
pnpm test:reb26:ci       # full sweep, JUnit XML -> reports/junit/reb26-suite.xml
pnpm ci:gate:full        # includes REB-26 alongside REB-12/13/18/19
```

Development-only knobs (both are logged loudly when set):

| Variable | Default | Effect |
|---|---|---|
| `REB26_BATCH_SIZE` | `20` | Components per fixture page |
| `REB26_MAX_BATCHES` | unset | Truncates the sweep; **S3 then fails on purpose**, so a truncated run can never be mistaken for full coverage |
