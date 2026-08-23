# REB-21 — Test scenarios (devops)

Scenario design for the DAM authoring and asset-reference suite. Every scenario is
implemented in `frontend/apps/selenium-e2e/src/cases/admin/dam-authoring-suite.spec.ts`
and runs against the live local stack (author `:8080`, publish `:8081`, admin
`:3000`, reference site `:3001`).

## What the platform actually offers

The suite was designed against the real API and UI surface. Four facts, all
verified before the suite was written, shaped every scenario:

| Fact | Consequence for the design |
|---|---|
| **The DAM is empty.** REB-07 copied 182 captured assets into both frontends' `public/` folders and uploaded **none** to the DAM (`"damUploaded": 0`). | There are no seeded assets to browse, search, or reference. The suite uploads everything it verifies and deletes it afterwards. |
| **There is no publish-side asset delivery.** `flexcms-dam` has no controller; nothing maps `/dam/renditions/**`. | `S7` cannot assert "the published page shows the image". It asserts what *is* true — the reference survives into publish delivery JSON — and records the delivery gap with a public-folder positive control. |
| **Upload is unvalidated.** No size, emptiness, or type checks server-side. | `S9` is a real scenario rather than a formality: it probes an empty file and an executable and records what the API accepts. |
| **The admin search is client-side.** The page filters one `?size=200` fetch in the browser and never calls the API's `q`. | `S4` covers both paths separately, because they are different code — and the API one turns out to be broken (`R21-2`). |

## How an operation is covered

Each scenario records one row per operation in `dam-operation-matrix.csv`, with a
column per surface:

| Surface | What it proves |
|---|---|
| `apiEvidence` | What the author API did — status codes, ids, byte counts, stored metadata |
| `uiEvidence` | What the admin UI showed, or why it has no surface for that operation |
| `publishEvidence` | What the publish environment served, or could not serve |

`PASS` means the operation behaved as contracted on every surface it claims;
`BLOCKED` means a known, evidenced product gap stopped a surface from verifying;
`FAIL` is reserved for genuinely unexpected behaviour. `S10` asserts no row is
`FAIL` and that every `BLOCKED` row carries a reason.

## Scenario list

### S1 — Library smoke, and the state of the DAM itself
Opens `/dam`, asserts no error state and that the Upload control exists, and
records the live asset count. When the count is zero it records *why* — REB-07's
`damUploaded: 0` — rather than reporting an empty library as a pass or a failure.

### S2 — Upload and byte-exact content round trip (AC1)
Uploads a genuine 1×1 PNG to a run-unique path, then asserts the stored metadata
(`mimeType`, `fileSize`, `siteId`) and, critically, that
`GET /{id}/content` returns **exactly** the uploaded bytes with the stored content
type. Byte equality rather than a status check: a truncating or re-encoding
pipeline would pass a 200 assertion.

### S3 — Asset detail route
Opens `/dam/{id}` and asserts the preview image actually resolves
(`naturalWidth > 0`), not merely that an `<img>` exists — a broken image is still
in the DOM.

### S4 — Library listing, UI search, API search (AC1)
UI: the uploaded asset appears; searching the run id keeps it; a non-matching
term filters it out; clearing restores it. The search box is a controlled React
input, so the page object drives it with real key events — `WebElement.clear()`
empties the DOM value without firing React's `onChange`, which leaves the filter
active on a term the box no longer displays.

API: the same keyword through `GET /api/author/assets?q=…`, with and without a
`siteId`. This currently answers 500 for every query (`R21-2`) and is recorded as
`BLOCKED`; the scenario stays forward-compatible and asserts the search *finds the
asset* if it is ever fixed.

### S5 — Folder listing (AC1)
Uploads a second, non-image asset (a minimal PDF), lists the run's DAM folder, and
asserts both uploads are present. Also asserts the PDF streams back as
`application/pdf` with identical bytes — proving the content type is preserved per
asset rather than coerced.

### S6 — Reference the asset from authored content (AC1)
Creates a test-owned page with a real contract component
(`editorial-article-content/story-card`, whose `image` field is `isAsset: true`),
points the asset field at the asset's content URL, and verifies the value persists
verbatim on the author API and appears in the author delivery JSON. The field is
authored through the API, not the editor: the editor renders asset fields as
`String(value)` in a text input (REB-19 blocker `B-1`), so a UI edit would persist
a string in place of a reference.

### S7 — Publish the asset-backed page (AC2)
Publishes the page, waits for the publish environment to serve JSON carrying the
asset id, then asks whether the publish environment can serve the asset's **bytes**
via either `/dam/renditions/{id}` or the author binary path. Both answer 500, so
the row is `BLOCKED` with `R21-3`.

The same scenario loads `/tut-usa/home` on the reference site and counts broken
images as a **positive control**: that page renders its public-folder images
cleanly, which proves the image-health mechanism works and isolates the failure to
DAM-backed URLs.

### S8 — Delete safety (AC3)
Uploads a throwaway asset, deletes it **by path** (the endpoint takes no id),
asserts the metadata lookup then 404s, and asserts a sibling test-owned asset is
still retrievable — so the delete is proven scoped rather than broad.

### S9 — Upload validation
Attempts a zero-byte file and a file with a DOS/PE executable header. Both are
accepted and stored (`R21-1`). Recorded as `BLOCKED` with the exact statuses.

### S10 — Evidence completeness
Asserts a row per operation, no `FAIL` rows, and a reason on every `BLOCKED` or
`SKIPPED` row.

## Fixture strategy (AC3)

- **Assets** use a run-unique prefix, `content/dam/tut-usa/reb21-{timestamp}/…`.
  Deletion only ever targets paths this run uploaded, so seeded or shared assets
  can never be touched — there are none today, but the constraint holds regardless.
- **The fixture page** reuses one fixed path, `content.tut-usa.reb21-asset-reference`.
  It gets published in `S7`, and nothing in the platform can retract published
  content (REB-26 `R26-1`/`R26-2`), so a timestamped page name would leave one
  permanent publish-side orphan per run. Assets are the opposite case — deletion
  works — so they are run-unique.
- Cleanup runs in `after()` and reports anything it could not remove as an
  `ASSET LEAK` line, so a silent leak cannot pass unnoticed.

## Deliberate non-goals

- **No UI upload dialog automation.** Driving a native file chooser through
  WebDriver is brittle; the upload API is exercised directly and the dialog's
  presence is asserted. The dialog's client-side `accept`/`maxSize` limits are
  documented in `R21-1` precisely because they are *not* a server-side guarantee.
- **No mutation of REB-07's public-folder assets.** They are read-only positive
  controls for image health.
- **No mass DAM import.** Populating the DAM with REB-07's 182 assets would change
  shared state well beyond a test fixture and is an `sa` scope decision
  (`R21-4`) — and would still not render publicly until `R21-3` is fixed.

## Run instructions

```bash
# Prerequisites: author :8080, publish :8081, admin :3000, site :3001 running.
# Backends need the `local` profile; frontends must be production builds —
# see hints_for_agent.md for both.
cd frontend/apps/selenium-e2e

pnpm test:reb21          # spec reporter
pnpm test:reb21:ci       # JUnit XML -> reports/junit/reb21-suite.xml
pnpm ci:gate:full        # includes REB-21 alongside REB-12/13/18/19/20/26
```
