# REB-26 — Implementation blockers and findings (AC8)

Every item below was **observed at runtime** by the REB-26 sweep or by a direct
reproduction against the running local stack, not inferred from reading code, and
each names the exact file and symbol. Run of record: 2026-08-21,
`pnpm test:reb26:ci`, 24 tests / 0 failures, 406/406 components `PASS` (see
`summary.md`). None is caused by REB-26's own changes — the exhaustive sweep
exposes them. All are outside the `devops` lane, so they are
reported here for SA routing rather than fixed in this session.

REB-19 already recorded `B-1` (no list/object/asset control), `B-2` (no DAM
picker), `B-3` (order never persisted), `B-4` (undo/redo not wired), and `B-6`
(template constraints presentational only). This task confirms `B-1` at full
scale and adds the findings below.

---

## R26-1 — Deleting a published page never removes it from the publish environment

> **RESOLVED 2026-08-23.** `ContentNodeService.delete()` now publishes a
> `ContentDeletedEvent`, and `ContentPublishReplicationListener.onContentDeleted()`
> turns it into the `ReplicationAction.DELETE` the receiver always handled, via the
> new `ReplicationAgent.replicateDelete()` (the existing `replicate()` could not be
> reused — it resolves the node first, and the node is gone by then). Verified live:
> create -> publish -> `:8081` serves -> delete -> `:8081` no longer serves, with
> `Replicated deletion of …` on the author and `Deleted content from publish: …` on
> the publish instance. REB-26 `S4` now reports "Publish environment no longer serves
> /tut-usa/reb26-component-sweep after archive + delete".


**Severity:** highest-impact finding in this task. An author deletes a page in the
admin UI; the public publish environment keeps serving it indefinitely.

**Where:**
- `flexcms-core` → `ContentNodeService.delete(String path, String userId)`
- `flexcms-replication` → `ReplicationReceiver` (`case DELETE -> deleteContent(event)`)

**What:** the delete path is local-only:

```java
public void delete(String path, String userId) {
    nodeRepository.deleteSubtree(path);
    auditService.log(AuditService.ENTITY_CONTENT, null, path,
            AuditService.ACTION_DELETE, userId);
}
```

It never asks `flexcms-replication` for anything. `ReplicationReceiver` already
implements a `DELETE` action (`case DELETE -> deleteContent(event)`), but a
repository-wide search shows **no producer anywhere emits
`ReplicationAction.DELETE`** — the only producers are `ACTIVATE` (publish) and
`DEACTIVATE` (`ContentPublishReplicationListener`, `ScheduledPublishingService`,
`WorkflowEngine`). The receiving half of delete replication exists and is
unreachable.

**Observed:**

```
DELETE /api/author/content/node?path=content.tut-usa.reb26-probe&userId=admin -> 200
GET    /api/author/content/node?path=content.tut-usa.reb26-probe              -> 404
GET    :8081/api/content/v1/pages/tut-usa/reb26-probe                         -> 200   (still served)
```

**Re-confirmed** by the 2026-08-21 run's `S4`: after the sweep archived and deleted
the fixture, the author API answered `404` for
`content.tut-usa.reb26-component-sweep` while `:8081` still served that page with
406 accumulated components.

**Suggested lane:** `backend-dev`, with `sa` confirming the intended semantics
(delete-on-publish vs. unpublish-then-delete).

---

## R26-2 — Unpublishing (archive/deactivate) does not stop the publish environment serving a page

> **RESOLVED 2026-08-23.** `ReplicationReceiver.deactivateContent()` now walks the
> whole subtree instead of flipping only the page node, and publish-instance delivery
> filters on `PUBLISHED` in `ContentDeliveryService.renderPage()`. The status check is
> gated on `flexcms.runmode` so the author keeps serving drafts, which the editor
> preview and REB-20's publish-isolation guard both depend on. Verified live by
> REB-20 `S9` and REB-26 `S4`.


**Severity:** high. This is the workaround an author would reach for after R26-1,
and it does not work either.

**Where:** `flexcms-replication` → `ReplicationReceiver.deactivateContent(ReplicationEvent)`

```java
private void deactivateContent(ReplicationEvent event) {
    nodeRepository.findByPath(event.getPath()).ifPresent(node -> {
        node.setStatus(NodeStatus.DRAFT);
        nodeRepository.save(node);
        ...
    });
    eventPublisher.publishEvent(ContentIndexEvent.remove(this, event.getPath()));
}
```

**What:** two gaps compound.

1. Deactivation only flips the **page node's** status to `DRAFT` on the publish
   side. The page's child component nodes are left untouched, so the subtree
   survives — the mirror image of publishing, which correctly replicates the whole
   subtree via `replicateTree`.
2. The publish delivery API serves a page **regardless of its status**, so a node
   sitting at `DRAFT` on publish is still delivered.

**Observed** (`POST /api/author/content/node/status?status=ARCHIVED` on a
published fixture page — the author-side transition and the DEACTIVATE
replication both succeed):

```
author.log: Replicated content: content.tut-usa.reb26-cleanup-test (DEACTIVATE) by admin
author.log: Deactivated node content.tut-usa.reb26-cleanup-test on publish (status PUBLISHED -> ARCHIVED)

publish DB nodes under that path, before archive: 3
publish DB nodes under that path, after  archive: 3
GET :8081/api/content/v1/pages/tut-usa/reb26-cleanup-test -> 200
```

**Consequence for this suite:** REB-26 must publish its fixture to satisfy AC5,
and no supported API can remove it afterwards. The suite therefore reuses **one**
fixture page path (`reb26-component-sweep`) for the whole run, so the residue is a
single path that each run overwrites, instead of one orphan per batch. `S4`
asserts the author side is clean and records this blocker with live evidence.

**Suggested lane:** `backend-dev` (replicate the subtree on deactivate; make the
publish resolver status-aware), with `sa` deciding whether publish-side delivery
should filter on status.

---

## R26-3 — Numeric property fields cannot be cleared, and clear-then-retype corrupts the value

> **RESOLVED 2026-08-23.** `PropertyField()`'s number branch keeps the raw keystrokes
> in local state and coerces on change, so an emptied field stays empty and reports
> `undefined` instead of snapping to 0, and a partially typed value (`-`, `1.`) is no
> longer mangled mid-entry. Verified across the 71 numeric fields in the REB-26 sweep.


**Where:** `frontend/apps/admin/src/app/editor/page.tsx` → `PropertyField()`,
number branch

```tsx
<Input
  type="number"
  value={Number(value ?? 0)}
  onChange={(e) => onChange(Number(e.target.value))}
  ...
/>
```

**What:** `Number('')` is `0`, so the instant an author empties the field it
snaps back to `0`; there is no way to author "no value" for an optional numeric
property. Worse, the standard select-all → delete → retype sequence lands the new
digits **next to** that re-inserted `0`: clearing a field holding `42` and typing
`1004` yields `10040`, and the author sees a silently wrong number.

**Observed:** the sweep's first run failed on
`tut-usa/layout-page-structure/grid-layout` with
`Input did not accept the authored value (wanted 4 chars)` — the input held
`10040` instead of `1004`. 71 numeric fields across the contracts are affected.

**Worked around in the suite** (not a fix for the product):
`EditorAuthoringPage.clearAndType()` now types over the selection in one step
instead of deleting first, which never produces the empty intermediate state.

**Suggested lane:** `frontend-dev` — keep the raw string in component state and
coerce on save, so an empty field stays empty.

---

## R26-4 — Reference site renders interactive components as read-only field previews

**Where:** `frontend/apps/site-nextjs/src/components/tutGroupedRenderers.tsx` →
`createGroupRenderer(groupName)`, wired in `component-map.tsx` through
`buildTutRendererEntries(componentContracts)`

**What:** the reference site has one renderer per **component group** (14) plus a
`defaultTutRenderer`, not one per component (406). A group renderer walks the
component's properties and previews them: it emits an `<img>` when the field name
looks like an image (`isImageField`), an `<a>` when a value is a record carrying a
`url`, and otherwise a label/value text pair. It never emits an interactive
control.

**Observed by the sweep** (rendered layer, completed 406-component run of
2026-08-21 — 24 tests / 0 failures, 406/406 `PASS`; the figures below replace the
ones first recorded from the interrupted 360-component run of 2026-08-20):

| Category | Count | Rendered result |
|---|---:|---|
| Forms, Data Capture & Consent | 42 of 42 components | no `input`/`select`/`textarea`/`button` rendered — the note `form component rendered no interactive control` is recorded for every one, and no component in the run proved a `rendered-form` layer |
| Asset fields | 53 of 91 rendered an `<img>` | 9 image-like fields (`logo`, `image`, `media`, …) produced no `<img>`; the other 29 are non-image assets (`downloadFile`, `audioFile`, `file`) where no `<img>` is expected and the row is `PASS` with that reason |
| Reference fields | 12 of 30 rendered an anchor | the remaining 18 surface as text |

Authoring is unaffected — all 406 components round-trip correctly through the
editor, author API, headless REST/GraphQL, preview, and publish. The gap is
purely in what the reference site *does* with the delivered JSON.

**Why it matters:** a "Newsletter Signup" or "Search Bar" component looks
authored and delivers correct JSON, but the sample site shows its field values as
text rather than a working form or search box, so the sample site understates what
the platform can express.

**Suggested lane:** `frontend-dev` (component-level renderers for the interactive
categories), with `sa` deciding how far the reference site is meant to go — this
may be intended scope for a later task rather than a defect in REB-09.

---

## Non-blocking observations

- **B-1's blast radius is narrower than feared.** REB-19 warned that the editor's
  save could corrupt structured data. The sweep proves it only affects fields an
  author actually *edits*: across the full run, **421 list/object/asset values
  survived the editor's save with their shape intact and 0 were coerced**, because
  `handleSave()` re-PUTs the value it loaded. The corruption risk is real but it
  requires the author to type into the lossy field, which is exactly why this suite
  authors those fields through the API instead.
- **`select` controls remain unreachable.** Every `enum` in
  `component-contracts.json` is still an empty array, so `editorControlFor()`
  never returns `'select'` for any of the 406 components. The select path in the
  shared model is implemented and exercised by `writeFieldValue`, but no active
  component can trigger it. REB-19 raised the same point; nothing has changed.
- **Rich text is contracted but not specially edited.** 25 fields are marked
  `isRichText` and are authored through a plain text/textarea control. Values
  round-trip correctly, so this is a UX gap rather than a data defect.
- **Publish payload grows under the reused fixture path.** Because a published
  page is never pruned (R26-1/R26-2), republishing the same path adds each batch's
  components to the publish-side page instead of replacing them. Harmless for the
  assertions, which look components up by name, but it is why the publish page for
  `reb26-component-sweep` ends a run holding more components than the last batch
  authored.
- **Pre-existing publish orphans.** Fixture pages published by earlier REB-18/19
  runs and by this session's exploratory probes are still served by `:8081`.
  Purging them needs direct `flexcms_publish` database access, which was not
  authorised in this session; they are listed for the human to clear or ignore.
