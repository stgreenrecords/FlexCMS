# REB-19 — Test scenarios (devops)

Suite: `frontend/apps/selenium-e2e/src/cases/admin/editor-authoring-matrix.spec.ts`
Run with `pnpm --filter @flexcms/selenium-e2e test:reb19` (JUnit: `test:reb19:ci`).

## Fixture strategy

The suite never mutates seeded demo pages. `before` creates an ephemeral page
`content.tut-usa.reb19-<timestamp>` on the `global-home-page` template and seeds
**one representative component per component group** (14 groups, 14 components)
through the author API, each with `flexcmsTemplateDetached: true` so it is
editable. All *editing* then happens through the admin UI. `after` deletes the
page again (set `REB19_KEEP_FIXTURE=1` to keep it for debugging).

Representatives are chosen deterministically by
`groupRepresentatives()` in `src/fixtures/component-contracts.ts` — preferring a
non-container component that carries both an asset field and a plain text field,
then the widest field surface, then contract index. No component is hard-coded.

## Scenario coverage

| ID | Scenario (from the task) | What is verified | Result |
|---|---|---|---|
| S1 | Contract-driven authoring matrix foundation | For a representative of every one of the 14 active component groups, each contract field renders the control the shared model predicts (`text`/`textarea`/`number`/`toggle`/`select`), addressed by contract-derived `data-testid`. 69 field rows recorded. | PASS |
| S2 | Text field round trip | Marker text authored in the UI is verified through **UI after reload → author API property → headless JSON `components[].data` → rendered page text** on the public site. | PASS |
| S3 | Image/asset field round trip | A real imported asset from the REB-07 pipeline is authored, then verified through author API, headless JSON, and a rendered `<img>` whose `naturalWidth > 0` (not a broken image). | PASS |
| S4 | Optional/empty fields | An optional scalar field is cleared; the component still renders, the page is not a 404 shell, and the browser console has **zero** SEVERE entries. | PASS |
| S5 | Long content | A >220-character value (past the renderer's preview threshold) is authored; the editor input holds it in full after reload, headless JSON matches exactly, and both the head and the tail of the value appear in the rendered HTML. | PASS |
| S6 | Template constraints | The palette offers **only** component types in `global-home-page`'s `allowedComponentTypes`, and a component outside the allow-list is not offered. | PASS |
| S7 | Component order | Reorder controls are exercised, then the persisted child order is read back from the author API. | **BLOCKED** — see blockers.md B-3 |
| S8 | Undo/redo | Toolbar undo/redo are clicked and the editor state is compared before/after. | **BLOCKED** — see blockers.md B-4 |
| S9 | Preview | Preview opens `/preview?path=…&mode=draft` in a new tab; asserts unsaved editor state is **not** silently persisted, then that saving does persist it. Observed behaviour recorded. | PASS |
| S10 | Publish after edit | An edited page is published and the change is verified on the publish environment (`:8081`). | PASS, with blocker B-5 recorded for the editor's publish button |

Totals: **8 passing, 2 pending (documented blockers), 0 failing.**

The two pending scenarios are deliberate. AC5 requires missing editor
capabilities to be reported as implementation blockers with exact file/symbol
references; encoding the broken behaviour in a green assertion would make the bug
permanent instead of visible. Each pending test performs the real probe first and
only then records the blocker and marks itself pending, so it flips to a genuine
pass as soon as the capability is implemented.

## Verification layers per successful edit (AC3)

Every passing edit scenario asserts across the layers listed in `verifiedLayers`
of `matrix-coverage.csv`:

- `ui` — value present in the editor after a full page reload;
- `author-api` — `GET /api/author/content/node` properties;
- `headless` — `GET /api/content/v1/pages/{path}` `components[].data`;
- `rendered` — text or `<img>` present on the rendered site (`:3001`);
- `publish` — `GET /api/content/v1/pages/{path}` on the publish instance (`:8081`).

## Machine-generated evidence

`matrix-coverage.csv` is written by the run itself (`src/reports/matrix.ts`), not
by hand: 79 rows — 76 PASS, 3 BLOCKED.
