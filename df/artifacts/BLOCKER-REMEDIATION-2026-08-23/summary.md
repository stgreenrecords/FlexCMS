# Blocker remediation — 2026-08-23

Cross-lane repair of the blockers raised by REB-19, REB-20, REB-21, REB-26, and
INFRA-TESTCONTAINERS-DOCKER29.

## Why this exists as its own artifact

The blockers were found by `devops` E2E work but live in `backend-dev` and
`frontend-dev` code. The human directed that they be fixed in this session rather
than routed, so the work crosses lanes deliberately and is recorded here instead of
inside any one task's folder.

## Scope decision

**Nineteen** open blockers were triaged across the five tasks — REB-19's `B-1`,
`B-2`, `B-3`, `B-4`, `B-6` (its `B-5` and `B-7` were already closed by earlier
backend work), REB-26's `R26-1`–`R26-4`, REB-20's `R20-1`–`R20-5`, REB-21's
`R21-1`–`R21-4`, and `I29-1`.

**Fourteen were fixed:** the eleven with a single defensible correct behaviour, plus
`B-1` (asked for directly after the human saw `[object Object]` in the editor's CTA
fields), `B-3`, and `B-4`. `B-1` is partial — its data-loss half is fixed, its richer
authoring UX is still design work.

**Five still need a human or `sa` decision**, because the decision itself determines
what "fixed" would mean:

| Left open | Why |
|---|---|
| `B-2` DAM asset picker | Explicitly gated on a designer's picker design; it is a user-facing surface, so building one would be inventing the visual language |
| `B-6` template constraints presentational | Enforcing them server-side would break existing content **and** REB-19/REB-26's own fixtures, which deliberately seed component types a template disallows. "Fixing" it silently would be destructive |
| `R21-3` no publish-side asset delivery | Requires choosing a URL contract and a storage strategy (replicate assets into the publish DB/S3 via `replicateAsset()`, or publish them to static storage). Picking one sets platform architecture |
| `R21-4` DAM is empty (`damUploaded: 0`) | Reopening REB-07's scope, and mutating shared state well beyond a test fixture; also pointless publicly until `R21-3` exists |
| `R26-4` site renders read-only previews | 14 group renderers vs 406 components — a scope call. Its headline symptom (42 of 42 form components render no interactive control) is bounded and fixable inside the existing group renderers, independent of that question |

`B-1` is recorded as **partially** resolved: the data-loss half is fixed, the richer
authoring UX it asks for is still design work.

## Fixes

| ID | Defect | Fix |
|---|---|---|
| `R20-1` | `move()` left the moved node's `parentPath` pointing at its old parent, so a page vanished from its new parent's `/children` and lingered in the old one | `ContentNodeService.move()` sets the subtree root's `parentPath` to the target explicitly; substitution still handles descendants |
| `R20-2` | Any node that ever had a workflow was undeletable (FK, opaque HTTP 500) | Migration `V19` adds `ON DELETE CASCADE` to `workflow_instances.content_node_id` |
| `R20-3` | Scheduled publish never transitioned the author status — public served a page the author showed as `DRAFT` | Scheduler calls `ContentNodeService.updateStatus()`, so the transition, audit entry, and `ContentStatusChangedEvent` all happen |
| `R20-4` | Scheduled deactivation changed nothing anywhere | Same routing, to `ARCHIVED` |
| `R20-5` | `bulkDelete` counted a never-existing path as `succeeded` | `delete()` resolves the node first and throws `NotFoundException`, which `bulkDelete` already reports per path |
| `R21-1` | Upload accepted anything — a 0-byte file and a DOS/PE executable were both stored | `AssetIngestService.ingest()` rejects empty files, enforces a configurable size cap (default 100 MB), and refuses executables by **Tika-detected** type |
| `R21-2` | Keyword search 500'd for every query — native SQL referenced a non-existent `tags` column | Clause removed; `metadata::text ILIKE` already covers tags held in the JSONB document |
| `R26-1` | Deleting a published page left it served forever — nothing ever emitted `ReplicationAction.DELETE` | `delete()` publishes `ContentDeletedEvent`; a new listener calls the new `ReplicationAgent.replicateDelete()` |
| `R26-2` | Deactivation flipped only the page node and delivery ignored status | `deactivateContent()` walks the subtree; publish-instance delivery filters on `PUBLISHED` |
| `I29-1` | PIM seed wrote `products.status = 'ACTIVE'`, which `ProductStatus` cannot parse — every seeded product unreadable | PIM `V5` repairs existing rows; `V4` corrected for fresh installs. `catalogs`/`product_variants` left alone — `ACTIVE` is valid there |
| `R26-3` | Numeric fields could not be cleared, and clear-then-retype corrupted the value (`42` → clear → `1004` yielded `10040`) | `PropertyField` keeps the raw keystrokes in local state and coerces on change; empty reports `undefined` |
| `B-3` | The editor silently discarded component additions, deletions, and reordering — `handleSave()` only PUT properties for components that already had a `nodePath`, so anything else vanished on reload while the UI reported success | Backend gained `ContentNodeService.reorderChildren()` and `POST /node/reorder` — nothing in the system could previously *change* an order, only append. `handleSave()` now reconciles against a baseline captured at load: creates added components and adopts their paths, deletes baseline paths that are gone, and persists the surviving order. Template-embedded placeholders are excluded so Save cannot detach them from inheritance as a side effect |
| `B-4` | Undo/redo buttons were rendered with no `onClick` — pure decoration | A history of `components` snapshots, recorded in an effect. Snapshots rather than inverse operations, because every mutation already flows through `setComponents`, so add/delete/duplicate/reorder/property-edit are covered uniformly. Editing after an undo drops the redo branch; history is capped at 50 |
| `B-1` | Array and object fields fell through to the text branch, so an author saw `[object Object]` and editing the box replaced the structure with that literal string — 265 array + 66 object fields | `PropField` gained `object`/`list`; `schemaToFields()` recurses into the shape the registry publishes. An object with declared properties renders nested inputs, an array renders a repeater with add/remove/reorder, and an undeclared shape gets a validated JSON editor that writes only when the text parses. Nested edits preserve keys the schema does not mention |

## Verification

Backend: `mvn clean test` — **510 tests, 0 failures, 0 errors** (was 505; five new
regression tests). Frontend: `pnpm build` 9/9. Admin typecheck clean.

Live verification mattered more than the unit tests, because the E2E suites were
written forward-compatible: their `BLOCKED` rows flip to `PASS` on their own when
the product is fixed, with no edit to the specs.

| Suite | Before | After |
|---|---|---|
| REB-20 | 8 PASS / 5 BLOCKED | **13 PASS / 0 BLOCKED**, and the run emits no blocker section at all. Counts are *operations recorded* in the matrix — 13 operations across 12 mocha scenarios, both reported by the run |
| REB-21 | 6 PASS / 3 BLOCKED | **8 PASS / 1 BLOCKED** — the remaining one is `R21-3`, which is intentionally still open |
| REB-26 | 406 PASS; 1724 / 448 field rows; `S4`: publish still serves the deleted page with 406 components | **24 tests / 0 failures**; 406 PASS; **2053 / 119** field rows; `S4`: *"Publish environment no longer serves /tut-usa/reb26-component-sweep after archive + delete"* |

329 REB-26 field rows moved from `BLOCKED` to `PASS`, all of them structured fields
that previously recorded "renders as a plain text input". The 119 that remain are the
blockers deliberately left open: 91 asset fields awaiting the `B-2` picker, 27
rendering gaps under `R26-4`, and one contract inconsistency (below).

The REB-26 model was updated alongside the B-1 fix, because the editor's DOM contract
changed: structured fields now render a `-group`/`-list` container instead of a
single `-input`. The fixture gained a `structured` control with a `containerTestId`,
`probeField` follows it, and the sweep records those fields as `PASS ("renders a
structured editor")`. This *strengthens* the assertion — the sweep now requires a
structured editor to exist where it previously required the broken text input, so a
B-1 regression would fail the run rather than quietly re-record a blocker.

Direct probes:

```
FK cascade:      confdeltype = 'c' on workflow_instances_content_node_id_fkey
PIM seed:        products -> status PUBLISHED, count 4   (was ACTIVE)
delete -> publish: create 200, publish 200, :8081 serves 200, delete 200, :8081 gone
                   author.log  "Replicated deletion of content.tut-usa.r26-delete-probe"
                   publish.log "Deleted content from publish: content.tut-usa.r26-delete-probe"
scheduler:       "Scheduled publish complete: 1/1 succeeded"
                 "Scheduled deactivation complete: 1/1 succeeded"
```

## Five flaws in these fixes, caught by tests rather than by inspection

Recorded because each one would have shipped as a silent non-fix:

1. **`@Value` is not applied outside Spring.** `maxUploadBytes` sat at `0` for a
   directly-constructed service, so the size cap rejected *every* upload. Five
   existing DAM tests caught it. The field now carries a code-level default.
2. **Lost update in the scheduler.** `clearScheduledPublish(node)` re-saved the
   entity loaded *before* the status transition, writing `DRAFT` back over
   `PUBLISHED` — recreating the exact symptom being fixed. The helpers now re-read
   the node by path.
3. **No security context on the scheduler thread.** `updateStatus()` is
   `@PreAuthorize("hasPermission(#path, 'PUBLISH')")`, so every cycle failed with
   "An Authentication object was not found in the SecurityContext" and the schedule
   was never consumed. Unit tests could not catch this — they mock the service, so
   method security never evaluates. The job now runs as `system:scheduler` with
   `ROLE_ADMIN`; an identity, not a bypass.
4. **My first B-4 attempt broke three passing tests.** Tracking `canUndo`/`canRedo`
   as state — purely to grey the buttons out — put a `setState` inside an effect
   keyed on `components`, producing React error #185 ("Maximum update depth
   exceeded"). The render storm also stopped property inputs accepting typed text,
   so REB-19's `S3`, `S4`, and `S5` failed. The history effect now writes only to
   refs and cannot trigger a render; the buttons no longer disable themselves, which
   is a cosmetic loss worth trading for not having a render loop in the editor.
   Had I stopped at "S8 passes, B-4 done", I would have broken core authoring to
   wire two buttons.
5. **`replicate()` cannot replicate a deletion.** It resolves the node first, and
   the node is gone by then, so every delete logged
   `Delete replication failed: Node not found` and gave up while the API still
   answered 200. **The fix looked correct and did nothing.** Added
   `replicateDelete()`, which builds the event from details captured before the
   delete.

## Not attempted

- `R26-4`'s headline symptom (42 of 42 form components render no interactive
  control) is bounded and fixable inside the existing group renderers, independent
  of the 406-renderer scope question.

## New finding: generated contracts are stale for one field

`navigation.accountEntry` is declared `type: "string", isReference: true` in
`Design/tut-usa/generated/component-contracts.json`, but the live component registry
declares it an **object** with `{url, label, openInNewTab}`. A comparison across all
406 components and their 1630 fields found this to be the **only** disagreement
between the two sources, so it is an isolated staleness rather than a systemic drift.

The registry shape is the plausible one for a link, which points at the generated
file not having been regenerated after
`V18__correct_tut_usa_link_contracts.sql` changed the link contracts.

Deliberately not fixed here: hand-editing a generated artifact would be overwritten
on the next regeneration, and regenerating `component-contracts.json` mid-session
would ripple into the REB-12/19/26 fixtures and the QA traceability matrix. It is a
REB-04-scoped call. Consequence today is one `BLOCKED` field row in the REB-26
matrix, reported as "Editor renders no control for navigation.accountEntry" — which
reads as an editor gap but is really the contract expecting a text input for a field
the registry (and therefore the editor) treats as an object.

## Known follow-up introduced by nothing in this session

Publish delivery answers **500**, not 404, for a page that is missing or
unpublished: `ContentDeliveryService.renderPage()` signals both with
`IllegalArgumentException`, which the global handler maps to
`INTERNAL_SERVER_ERROR`. That predates this work — the new status check follows the
existing convention rather than changing status-code semantics as a side effect —
but delivery should map "not found / not published" to 404.
