# REB-19 — Implementation blockers (AC5)

Every blocker below was **observed by the suite at runtime**, not inferred from
reading code, and each names the exact file and symbol. None of them is caused by
REB-19's own changes; they are pre-existing gaps that the authoring matrix
exposes. All were outside the `devops` lane, so they were reported here for SA
routing rather than fixed in the REB-19 session.

**Status:** B-5 and B-7 were fixed in a follow-up `backend-dev` session
(`BUG-PUBLISH-REPLICATION`, `BUG-CONTENT-DELETE`). B-1, B-2, B-3, B-4, and B-6
remain open.

---

## B-1 — Editor has no control type for list, object, or asset fields

**Where:** `frontend/apps/admin/src/app/editor/page.tsx` → `schemaToFields()` and
`PropertyField()`

**What:** `PropField['type']` is only
`'text' | 'number' | 'toggle' | 'select' | 'textarea'`. Fields whose JSON Schema
type is `array` or `object` fall through to the default branch and render as
`<Input type="text" value={String(value ?? '')}>`, i.e. the author sees
`[object Object]`. If an author edits such a field, `onChange` writes a **string**
where the contract requires structured data, silently corrupting the component.

**Scale:** across the 406 active components, 265 `array` fields and 66 `object`
fields are affected.

**Suggested lane:** `frontend-dev` (new list/object editors), with `sa` deciding
the authoring UX first.

---

## B-2 — Asset fields have no DAM picker

**Where:** `frontend/apps/admin/src/app/editor/page.tsx` → `schemaToFields()`

**What:** the component registry marks asset fields with `"x-asset": true` (see
`GET /api/content/v1/component-registry`, e.g.
`tut-usa/editorial-article-content/story-card` → `image`), and the generated
contracts carry `isAsset: true`. `schemaToFields()` reads only `type`, `enum`, and
`format`, so the marker is ignored and the author gets a free-text box in which to
paste a URL by hand. The editor's Assets tab is not wired to property fields.

**Scale:** 91 asset fields across 86 components.

**Consequence for testing:** REB-19 S3 proves the asset *reference* round trip
end to end (author API → headless → rendered `<img>`), but cannot prove asset
*selection*, because there is no selection affordance to drive.

**Suggested lane:** `frontend-dev`, after `designer` provides the picker design.

---

## B-3 — Component order is never persisted

**Where:** `frontend/apps/admin/src/app/editor/page.tsx` → `handleSave()`

**What:** `handleSave()` sends one
`PUT /api/author/content/node/properties` per component and nothing else. It never
writes `orderIndex`, even though the backend models and honours it —
`ContentNode.orderIndex` and
`ContentNodeRepository.findByParentPathOrderByOrderIndex`. Drag-to-reorder and the
"Move up"/"Move down" buttons in `SortableCanvasItem` therefore only mutate React
state: the new order is lost on reload.

Adding, duplicating, and deleting components have the same root cause —
`handleSave()` filters to `components.filter((c) => c.nodePath)`, so a component
added from the palette (no `nodePath` yet) is never created server-side, and
`deleteComponent()` never issues a delete.

**Suggested lane:** `frontend-dev` for the editor save path; may need a
`backend-dev` reorder endpoint if per-node `orderIndex` writes are not enough.

---

## B-4 — Undo/redo (and Settings) are rendered but not wired

**Where:** `frontend/apps/admin/src/app/editor/page.tsx` lines ~840-841 and ~850

**What:**

```tsx
<IconButton title="Undo" dataTestId="editor-undo-button"><UndoIcon /></IconButton>
<IconButton title="Redo" dataTestId="editor-redo-button"><RedoIcon /></IconButton>
...
<IconButton title="Settings" dataTestId="editor-settings-button"><GearIcon /></IconButton>
```

`IconButton` takes an optional `onClick`, and these three pass none. The editor
also keeps no history stack, so there is nothing to undo to. The buttons look
functional to an author but do nothing. Verified at runtime: clicking each button
produces no change in property values, layer count, or canvas item count.

**Suggested lane:** `frontend-dev`.

---

## B-5 — Publishing from the editor never reaches the publish environment

> **RESOLVED 2026-08-19** by `BUG-PUBLISH-REPLICATION`. Publishing now emits
> `ContentStatusChangedEvent` from `ContentNodeService.updateStatus`, and
> `ContentPublishReplicationListener` replicates after commit for every publish
> path. REB-19 S10 no longer records this blocker.

**Severity:** highest-impact finding in this task — an author who publishes from
the page editor sees "Published" in the UI while the publish environment keeps
serving nothing.

**Where:**
- `frontend/apps/admin/src/app/editor/page.tsx` → `handlePublish()`
- `flexcms-author` → `AuthorContentController.updateStatus()`

**What:** `handlePublish()` calls
`POST /api/author/content/node/status?status=PUBLISHED`. That endpoint delegates
straight to `nodeService.updateStatus(...)` and **never triggers replication**. By
contrast `AuthorContentController.bulkPublish()` explicitly calls
`replicationAgent.replicateTree(contentPath, userId)` for `flexcms/page` and
`flexcms/site-root` nodes.

**Observed:** after publishing the fixture page from the editor, the author node
status is `PUBLISHED`, but `GET /api/content/v1/pages/{path}` on `:8081` returns
the page with **zero components**. The same page published through
`POST /api/author/content/bulk/publish` then serves all components correctly.

**Recommended fix (architectural):** put the replication trigger behind the
status transition in the service layer, so every publish path — editor button,
bulk publish, scheduled publishing, and any future API client — replicates
identically. Fixing it only in the admin app would leave the REST endpoint still
publishing without replicating, and would duplicate publish semantics in the
frontend.

**Suggested lane:** `backend-dev`.

---

## B-6 — Template constraints are presentational only

**Where:** `flexcms-author` → `AuthorContentController.createNode()` →
`ContentNodeService.create(...)`

**What:** the editor palette correctly filters to the template's
`allowedComponentTypes` (verified by S6), but the author API happily creates a
component node of *any* `resourceType` under a page — REB-19's own fixture relies
on this to seed components the template does not allow. The constraint is
therefore a UI affordance, not an enforced content rule.

**Suggested lane:** `sa` to decide whether template constraints should be
enforced server-side, then `backend-dev`.

---

## B-7 — Content node deletion is broken for every node (fixtures leak on every run)

> **RESOLVED 2026-08-19** by `BUG-CONTENT-DELETE`. `deleteSubtree` now carries
> `@Modifying` and a sibling-safe predicate; the REB-19 suite cleans up its own
> fixture page again and the `FIXTURE LEAK` diagnostic no longer fires.

**Severity:** high — no content can be deleted through the author API, and every
suite that creates fixtures pollutes the shared content tree permanently.

**Where:** `flexcms-core` →
`ContentNodeRepository.deleteSubtree(String pathPrefix)`

```java
/**
 * Delete node and all descendants.
 */
@Query(value = "DELETE FROM content_nodes WHERE path::text LIKE :pathPrefix || '%'",
       nativeQuery = true)
void deleteSubtree(@Param("pathPrefix") String pathPrefix);
```

The method has **no `@Modifying` annotation** — there is no `@Modifying` anywhere
in the file. Spring Data therefore executes the statement as a query rather than
as an update, and PostgreSQL reports `No results were returned by the query.`

**Observed:**

```
DELETE /api/author/content/node?path=content.tut-usa.reb19-probe&userId=admin
-> 500 INTERNAL_SERVER_ERROR

author.log: JpaSystemException: JDBC exception executing SQL
  [No results were returned by the query.]
  [DELETE FROM content_nodes WHERE path::text LIKE ? || '%']
```

`ContentNodeService.delete(path, userId)` routes **all** deletions through
`deleteSubtree`, so this affects leaf nodes as well as subtrees, and therefore
`DELETE /api/author/content/node`, `bulkDelete`, and every UI delete path.

**Impact already visible in this environment:** the REB-18 suite's fixture pages
(`content.tut-usa.reb18-e2e-*`) accumulate — five had built up before this task —
and REB-19's own fixture pages could not be removed by its `after` hook. Left
unfixed, REB-26 will create fixture pages for 406 components and none of them can
be cleaned up.

**Fix:** annotate the repository method with `@Modifying` (plus
`@Transactional` at the service boundary, which `ContentNodeService.delete`
already has), then cover it with a repository test that deletes a node with
descendants and asserts both the node and its children are gone.

**Mitigation applied in REB-19:** the suite's `after` hook now verifies the
deletion and prints a loud `FIXTURE LEAK` diagnostic naming this blocker instead
of silently swallowing the error. Leaked REB-19 fixture nodes from earlier runs
were removed directly from `flexcms_author` and `flexcms_publish`.

**Suggested lane:** `backend-dev`.

---

## Non-blocking observations

- **Publish delivery API returns 500 for an unreplicated page.** Requesting a page
  that exists on author but has never been replicated yields HTTP 500 from
  `:8081` rather than 404. Callers cannot distinguish "not published yet" from a
  server fault; REB-19 works around it by treating any non-OK response as "no
  publish data".
- **No `select` control is reachable from the current contracts.** Every `enum` in
  `component-contracts.json` is an empty array, so `editorControlFor()` never
  returns `'select'`. The select path in the shared model is implemented and
  exercised by `writeFieldValue`, but no active component can currently trigger
  it. Worth confirming during REB-26 whether the enums were meant to be populated
  by the V16 migration.
- **Rich text is contracted but not specially edited.** 25 fields are marked
  `isRichText`, yet the editor renders them as plain `text`/`textarea` with no
  rich-text control.
