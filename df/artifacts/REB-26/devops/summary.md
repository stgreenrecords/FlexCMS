# REB-26 — devops run summary

Exhaustive per-UI-component sample-site editing sweep for the TUT-USA reference
site. Every number below is aggregated directly from the artifacts the run of
record produced — `component-editing-matrix.csv`, `field-coverage.csv`, and
`frontend/apps/selenium-e2e/reports/junit/reb26-suite.xml` — not carried over from
an earlier run.

## Run of record

| | |
|---|---|
| Date | 2026-08-21 13:37–13:41 local (CEDT) |
| Command | `cd frontend/apps/selenium-e2e && node scripts/selenium-gate.cjs --mode full` (REB-26 stage) |
| Suite | `src/cases/admin/component-editing-sweep.spec.ts` |
| Mocha result | **24 tests, 0 failures**, 291.87 s |
| JUnit XML | `reports/junit/reb26-suite.xml`, retained at `reports/retained/full/junit/reb26-suite.xml` |
| Console log | `reports/logs/full/test_reb26_ci.log` |
| Failure screenshots | none — the suite produced no failures |

The sweep was run **twice** on 2026-08-21, and both runs produced identical
matrices — 406/406 `PASS`, 2172 field rows, the same layer and category counts:

| Run | Command | Frontends | Result |
|---|---|---|---|
| 13:18–13:24 | `pnpm test:reb26:ci` standalone | Next.js **dev** servers | 24 tests / 0 failures, 406/406 PASS, 352.68 s |
| 13:37–13:41 | full gate, REB-26 stage (**run of record**) | Next.js **production** builds | 24 tests / 0 failures, 406/406 PASS, 291.87 s |

The production-build run is the record because the reference site's dev server
serves HTML for `/_next/static/chunks/*.js`, which logs four `Uncaught
SyntaxError` console errors on every page. REB-26 only records console errors as
an observation, so the dev run passed anyway — but REB-12's link-integrity
scenario asserts on them, so the whole gate must run against production builds.

Environment (all four services live, local workstation):

| Service | URL | Started as |
|---|---|---|
| Author | `http://localhost:8080` | `mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author,local` (JDK 26) |
| Publish | `http://localhost:8081` | `mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=publish,local` (JDK 26) |
| Admin UI | `http://localhost:3000` | `pnpm start` (Next.js production build) |
| Reference site | `http://localhost:3001` | `pnpm exec next start -p 3001` (production build) |
| Infra | postgres, redis, rabbitmq, minio, elasticsearch | `docker compose -f infra/local/docker-compose.dev.yml up -d` |

## Totals (AC1, AC2, AC7)

| Metric | Value |
|---|---|
| Active component contracts in `component-contracts.json` | **406** |
| Rows in `component-editing-matrix.csv` | **406** |
| Distinct `resourceType` values covered | **406** |
| Contracts with no matrix row | **0** |
| PASS | **406** |
| FAIL | **0** |
| BLOCKED | **0** |
| UNSUPPORTED_UI | **0** |
| SKIPPED (with reason) | **0** |

Component groups — every group is complete, and the distribution matches the
inventory baseline in `task.md` exactly:

| Component group | Components | PASS |
|---|---:|---:|
| Account, Portal & Transactional | 24 | 24 |
| Brand, Corporate, Investor & Governance | 19 | 19 |
| Calls to Action, Promotions & Campaigns | 43 | 43 |
| Commerce, Catalog & Merchandising | 31 | 31 |
| Community, Social Proof & Engagement | 31 | 31 |
| Editorial & Article Content | 69 | 69 |
| Education, Learning & Developer Content | 14 | 14 |
| Events, Booking, Travel & Hospitality | 24 | 24 |
| Forms, Data Capture & Consent | 42 | 42 |
| Layout & Page Structure | 32 | 32 |
| Location, Local & Physical Presence | 13 | 13 |
| Media, Visual Storytelling & Assets | 33 | 33 |
| Navigation, Search & Discovery | 29 | 29 |
| Support, Documentation & Knowledge | 2 | 2 |
| **Total** | **406** | **406** |

## Verification layers proven (AC3, AC4, AC5)

Each component's `verifiedLayers` cell lists the layers it actually proved.

| Layer | Components | Meaning |
|---|---:|---|
| `ui` | 406 | Editor accepted the authored value and still showed it after a full reload |
| `author-api` | 406 | Value persisted on the component node; structured values intact |
| `headless` | 406 | Delivery REST JSON carries the value |
| `graphql` | 406 | GraphQL delivery API resolves the fixture page |
| `publish` | 406 | Publish environment (`:8081`) serves the value after replication |
| `rendered` | 405 | Reference site surfaces the authored marker |
| `preview` | 405 | Draft preview route surfaces the authored marker |
| `rendered-links` | 60 | Navigation/commerce component rendered links |
| `rendered-asset` | 52 | Authored asset resolved to a non-broken `<img>` |
| `rendered-reference` | 11 | Authored reference rendered as an anchor |
| `rendered-form` | **0** | No form component rendered an interactive control (see `R26-4`) |

The four layers required for `PASS` — `ui`, `author-api`, `headless`, `publish` —
were proven for **all 406** components. Author-only verification is never
sufficient: every batch publishes the fixture and polls `:8081` until *that
batch's* authored values appear.

**The one component short of `rendered`/`preview`** is contract 266,
`tut-usa/commerce-catalog-merchandising/star-rating`. Its only editor-authorable
field is a `number`, which cannot embed a run marker, so there is nothing to trace
in rendered HTML. The matrix records this explicitly (`rendered layer not
traceable: only a number control is authorable, which carries no marker`) rather
than counting it as a renderer defect. Its `ui`, `author-api`, `headless`,
`graphql`, `publish`, and `rendered-links` layers all pass.

## Editor control coverage

| Metric | Value |
|---|---|
| Authorable fields across all contracts | 1630 |
| Components where the editor rendered **every** contracted control | **406 of 406** |
| Components with a missing control | **0** |

No `AC8` blocker of the form "the editor renders no control for X" was raised by
this run: every contracted field got a control of the expected tag for its type.

## Field-level coverage

`field-coverage.csv` — 2172 rows (one per field per verification pass):

| Outcome | Rows |
|---|---:|
| PASS | 1724 |
| BLOCKED | 448 |

The 448 `BLOCKED` field rows are **not** run failures; each is a recorded product
gap with its own note:

| Cause | Rows | Note recorded |
|---|---:|---|
| `list` field renders as a plain text input | 264 | authored through the author API instead (REB-19 `B-1`) |
| `asset` field renders as a plain text input | 91 | authored through the author API instead (`B-1`) |
| `object` field renders as a plain text input | 66 | authored through the author API instead (`B-1`) |
| Authored reference produced no anchor on the reference site | 18 | renderer gap, `R26-4` |
| Image-like asset field produced no `<img>` | 9 | renderer gap, `R26-4` |

By editor control: 1903 `text`, 106 `toggle`, 92 `textarea`, 71 `number`. No row
used a `select` control — every `enum` in the contracts is still an empty array,
so that path stays unreachable (unchanged from REB-19).

By field semantics: 1154 scalar, 528 list, 273 asset, 132 object, 60 reference,
25 rich text.

## Category-specific assertions (AC6)

| Category | Result |
|---|---|
| **Asset** | 91 asset fields seeded with real REB-07 imported images. 53 resolved to a non-broken `<img>` on the reference site; 9 image-like fields produced no `<img>` (`R26-4`); the remaining 29 are non-image assets (`downloadFile`, `audioFile`, `file`, `media`) where no `<img>` is expected and the row is recorded `PASS` with that reason. Zero broken images. |
| **Rich text** | All 25 `isRichText` fields authored through the UI with markup and round-tripped unchanged through every layer. |
| **Reference** | All 30 reference fields authored and persisted. 12 rendered as an anchor carrying the marker; 18 produced no anchor (`R26-4`). |
| **Container** | 9 container components each kept a pre-seeded child node across the editor's save. |
| **Form / data capture** | All 42 components author and deliver correctly, but **42 of 42 rendered no interactive control** on the reference site — the headline finding of `R26-4`. |
| **Navigation & search / Commerce** | 60 components proved rendered links. |
| **List / object** | 528 list and 132 object field rows: seeded structured through the API, asserted still array/object after the editor's save. Never authored through the UI — doing so would persist `String(value)` and certify data corruption as success. |

## Fixture hygiene (AC5, requirement 12)

- No seeded sample-site page was mutated. All authoring happened on the
  test-owned fixture page `content.tut-usa.reb26-component-sweep`.
- The fixture is archived and deleted after every batch. Post-run check:
  author `GET /api/author/content/node?path=content.tut-usa.reb26-component-sweep`
  → **404** (clean).
- Publish side: `GET :8081/api/content/v1/pages/tut-usa/reb26-component-sweep`
  → **200**, still serving 406 accumulated components. This is `R26-1`/`R26-2`,
  a pre-existing platform defect, and `S4` is the scenario that produces the
  evidence for it. Residue is bounded to this one reused path, which each run
  overwrites.

## Blockers (AC8)

Four pre-existing defects are recorded with live evidence and exact source
symbols in [`blockers.md`](blockers.md). None is caused by this suite; all are
outside the `devops` lane and are reported for SA routing:

| ID | Summary | Suggested lane |
|---|---|---|
| `R26-1` | Deleting a published page never removes it from the publish environment — no producer emits `ReplicationAction.DELETE` | `backend-dev` + `sa` |
| `R26-2` | Unpublish (archive/deactivate) does not stop publish serving a page — subtree untouched, delivery ignores status | `backend-dev` + `sa` |
| `R26-3` | Numeric property fields cannot be cleared; clear-then-retype corrupts the value (`42` → clear → `1004` yields `10040`) | `frontend-dev` |
| `R26-4` | Reference site renders interactive components as read-only field previews — 14 group renderers, not 406 component renderers | `frontend-dev` + `sa` |

`R26-1` was re-confirmed live by this run's `S4`. `R26-3` remains worked around in
`EditorAuthoringPage.clearAndType()` (type over the selection instead of clearing
first), which is why 71 `number` fields authored cleanly here.

## Reruns and failures during this session

Recorded per the test-evidence rules — the run of record above was the **second**
attempt:

1. **First attempt, discarded.** Both backends had been started with profiles
   `author` / `publish` but **not** `local`. `flexcms.local-dev: true` exists only
   in `application-local.yml`, and `SecurityConfiguration` gates the permissive
   chain on `@Value("${flexcms.local-dev:false}")`, so every author write answered
   `401`. All 21 batches died on `createNode`, the sweep "finished" in under two
   minutes, and the matrix was overwritten with 406 `UNSUPPORTED_UI` rows — the
   grading logic turns "nothing was authored" into `UNSUPPORTED_UI`, so the CSV
   alone did not reveal the cause; only the JUnit XML carried the `401`.
2. **Fix.** Restarted both backends with `author,local` / `publish,local` and
   verified an unauthenticated author read answers `200` before relaunching.
   Recorded at the top of `hints_for_agent.md` so the next session does not repeat
   it.
3. **Second attempt** — the run of record: 24 tests, 0 failures, 406/406 PASS.

No check was skipped.

## Reproducing

```bash
# 1. Infra
docker compose -f infra/local/docker-compose.dev.yml up -d

# 2. Backends — the `local` profile is mandatory (see hints_for_agent.md)
export JAVA_HOME="/c/Program Files/Java/jdk-26.0.2.1"
cd flexcms
mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author,local   # :8080
mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=publish,local  # :8081

# 3. Frontends
cd frontend/apps/admin && pnpm dev          # :3000
cd frontend/apps/site-nextjs && pnpm dev    # :3001

# 4. Sweep
cd frontend/apps/selenium-e2e && pnpm test:reb26:ci
```

Sanity check before starting a long run — this must print `200`, not `401`:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:8080/api/author/content/node?path=content.tut-usa.home"
```

## Developer testing bar (df/03-orchestration-rules.md)

All three conditions were met on 2026-08-21 before this task was reported
complete:

| Check | Command | Result |
|---|---|---|
| Backend unit suite | `cd flexcms && mvn test` (JDK 26) | **505 tests, 0 failures, 0 errors, 0 skipped**, `BUILD SUCCESS` across all modules |
| Frontend build | `cd frontend && pnpm build` | **9 of 9 tasks successful** |
| Selenium full gate | `node scripts/selenium-gate.cjs --mode full` | **PASS** — artifacts retained under `reports/retained/full` |

Full-gate suite breakdown (all JUnit files regenerated by this gate run):

| Suite | Tests | Failures | Time |
|---|---:|---:|---:|
| REB-12 template-by-template public site | 22 | 0 | 131.2 s |
| REB-13 admin authoring and round-trip | 4 | 0 | 3.7 s |
| REB-18 content tree and page lifecycle | 2 | 0 | 14.9 s |
| REB-19 page editor authoring matrix | 10 | 0 | 18.4 s |
| **REB-26 exhaustive per-component sweep** | **24** | **0** | **291.9 s** |

The gate's critical/high traceability enforcement passed; no uncovered rows were
reported.

**One gate failure was diagnosed and fixed on the way**, and it was not in
REB-26: the first full-gate attempt failed at `test:templates:ci` because the
frontends were running as Next.js **dev** servers, which serve HTML for
`/_next/static/chunks/*.js`. Every reference-site page therefore logged four
`Uncaught SyntaxError: Unexpected token '<'` console errors, and REB-12's
`TUT link integrity` scenario asserts zero severe console errors across all 65
pages. Rebuilding and serving both frontends from their production output cleared
every console error (verified with a direct WebDriver console probe on
`/tut-usa/home`) and the gate passed end to end. No product code was changed.

## Artifacts

| File | Contents |
|---|---|
| `component-editing-matrix.csv` | 406 rows, one per component contract (AC1, AC2, AC7) |
| `field-coverage.csv` | 2172 field-level rows with control, semantics, layers, outcome |
| `test-scenarios.md` | Scenario design: S1, S2.1–S2.21, S3, S4 and category assertions |
| `blockers.md` | `R26-1`…`R26-4` with source symbols and live evidence (AC8) |
| `summary.md` | This file |
| `frontend/apps/selenium-e2e/reports/junit/reb26-suite.xml` | JUnit XML, 24 tests / 0 failures |
