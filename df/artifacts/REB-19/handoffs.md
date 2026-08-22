# REB-19 — Handoffs

## 2026-08-19 — `devops` → next role

- **Task id:** `REB-19`
- **Current state:** `DONE`
- **Previous role result:** `devops` implemented the contract-driven page editor
  authoring matrix suite, wired it into the CI gate, and met the developer
  testing bar (full build green, 495 backend tests green, Selenium smoke and full
  gates green, 8 passing / 2 documented-blocker pending / 0 failing in REB-19).
- **Files changed / artifacts created:** listed in `devops/summary.md`.
- **Checks performed:** see the validation table in `devops/summary.md`.
- **Known risks:** six pre-existing implementation blockers are recorded in
  `devops/blockers.md`. B-5 (publishing from the editor never replicates to the
  publish environment) is a user-visible product defect and needs SA routing to
  `backend-dev`; it is not caused by this task.
- **Next role/action:** `devops` may start `REB-26`, whose only dependency was
  `REB-19`. Everything it needs is described below.

---

## AC7 — How REB-26 enumerates every component and reuses these helpers

REB-26 must produce one editing scenario (or an explicit blocker row) for **every
active component** in `Design/tut-usa/generated/component-contracts.json` —
currently 406 components across 14 groups. REB-19 built that machinery; REB-26
should add no new knowledge of field types.

### 1. Enumerate the components

```ts
import {
  activeComponentContracts,     // all 406 active contracts
  componentGroupNames,          // the 14 group names
  componentsInGroup,            // contracts for one group
  authorableFields,             // the fields the editor actually renders
  authoringValueFor,            // traceable sample value per field
  contractNodeName,             // stable node name for a component instance
} from '../../fixtures/component-contracts';

for (const contract of activeComponentContracts()) {
  for (const entry of authorableFields(contract)) {
    // entry.key, entry.control, entry.semantics, entry.inputTestId
  }
}
```

`authorableFields()` already applies the editor's own visibility filter (keys
starting with `_`, `children`, and `flexcmsTemplateDetached` are excluded) and
mirrors `schemaToFields()` in `frontend/apps/admin/src/app/editor/page.tsx`. If
the editor's mapping ever changes, `editorControlFor()` is the single place to
follow it.

### 2. Drive the editor per field type

```ts
const editor = new EditorAuthoringPage(driver);
await editor.open(contentPath);
await editor.detachAllInheritance();
await editor.selectComponentLayer(contract.title);

const probe = await editor.probeField(entry);       // present? which element? disabled?
await editor.writeFieldValue(entry, value);         // routes by control type
await editor.readFieldValue(entry);                 // reads back per control type
await editor.clearFieldValue(entry);                // empty-state coverage
await editor.save();
```

`writeFieldValue` handles `text`/`textarea`/`number` (select-all + retype, because
React-controlled inputs ignore `WebElement.clear()`), `toggle` (click and confirm
the state actually flipped), and `select` (open, pick, return the chosen option
text).

### 3. Respect the lossy-field rule

**Do not author `list`, `object`, or `asset` fields through the UI** in a way that
you then treat as correct persistence. `entry.isLossyInEditor` marks them: the
editor renders `String(value)` in a plain text input, so a UI edit writes a string
where the contract requires structured data (blocker B-1). For those fields,
either assert the *probe* only, or set the value through
`AuthorApiClient.updateNodeProperties()` and verify rendering — that is what
REB-19's S3 does for assets.

### 4. Verify across layers

`AuthorApiClient` covers every layer REB-19 asserts on:
`getNode` (author API) → `getAuthorRenderedPage` (headless JSON) →
site render (`EditorAuthoringPage.openPublicSitePage` + `imageSourcesContaining`
/ `brokenImageSources` / `severeConsoleErrors`) → `bulkPublish` +
`getPublishRenderedPage` (publish environment).

### 5. Record coverage

```ts
const recorder = new MatrixRecorder('REB-26');
recorder.add({ scenarioId, groupName, resourceType, componentTitle, fieldKey,
               editorControl, fieldSemantics, verifiedLayers, outcome, notes });
recorder.write();   // -> df/artifacts/REB-26/devops/matrix-coverage.csv
```

Every component must yield at least one row; components that cannot be exercised
must get an explicit `BLOCKED` row naming the reason, so "406 components" is
provably covered rather than silently truncated.

### 6. Fixture strategy to copy

Create an ephemeral page under `content.tut-usa` with the `global-home-page`
template, seed component nodes through the author API with
`flexcmsTemplateDetached: true` (otherwise template-embedded components are
locked), and delete the page in `after`. Never mutate seeded demo pages.

At 406 components a single page would be unusable — batch the sweep into pages of
~20 components each, and keep each batch's page for the duration of that batch
only.

### 7. Scale warning

Expect roughly 1,400 authorable fields in total. REB-19's 14-component run takes
about 8 s for the probe scenario, so plan for batching, and make sure the run
records progress incrementally rather than only at the end.

### 8. Environment prerequisite

The publish-environment assertions require the seeded site to be published first:

```bash
python scripts/publish_tut_usa_site.py
```

On a fresh database nothing is replicated, and publish-side checks fail with
HTTP 500 or "author has N components but publish has 0".
