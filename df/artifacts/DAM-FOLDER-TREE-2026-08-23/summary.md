# DAM folder tree — 2026-08-23

Requested directly: *"for DAM assets I want to have tree folder system, currently all
assets displayed in flat list."*

## What was actually there

The `/dam` page already had a sidebar under a comment reading `{/* Left panel: folder
tree */}`. It was not a folder tree, and it was not connected to folders at all:

```tsx
const folderNames = ['images', 'videos', 'documents', 'archives'];
...
count: assets.filter((a) => a.folder === name).length,
```

`folder` came from `inferFolder(type)` — a switch on the asset's MIME type. So the four
"folders" were file-type buckets with folder icons, and `Asset.folderPath`, the field
recording where an asset is actually stored, was never read by the page. The structure
an author organised their library into was invisible and unnavigable, which is the flat
list described in the request.

## Backend

Folders are not rows. `AssetIngestService.ingest()` derives `folderPath` from the asset
path (`path.substring(0, path.lastIndexOf('/'))`), and nothing else records them, so
the folder list has to be derived by grouping.

| Change | Why |
|---|---|
| `AssetFolderSummary(path, assetCount)` record | Projection for the grouped query |
| `AssetRepository.findFolderSummaries(siteId, status)` | Groups `folder_path` over active assets. `siteId` is nullable, so the tree can span sites the way the unscoped asset listing already does |
| `AssetIngestService.listFolders(siteId)` | Blank and null site both mean "all sites" |
| `GET /api/author/assets/folders` | Returns `{folders: [{path, assetCount}], totalCount}` |

**A defect found on the way.** `listFolder(folderPath, siteId, …)` accepted a `siteId`
and then dropped it — it called `findByFolderPathAndStatus`, which has no site
predicate, so two sites sharing a folder name would have shown each other's assets. The
finder is now `findByFolderPathAndSiteIdAndStatus`. The existing unit test had encoded
the bug: it passed `"corporate"` and stubbed a finder with no site parameter. It now
stubs the site-aware finder, and a second test asserts the site actually reaches the
query.

## Frontend

The tree is assembled client-side from the flat folder list, because the endpoint can
only report folders that *directly* hold an asset. `content/dam/a/b` implies
`content/dam` and `content/dam/a`; those intermediate nodes are reconstructed from the
path segments and carry `directCount: 0` with a `totalCount` rolled up from below.

Decisions worth stating, because each could reasonably have gone the other way:

- **Selecting a folder lists its whole subtree**, not just its direct children. There
  are no folder tiles in the grid, so a direct-only listing would make every
  intermediate folder look empty. It also keeps the grid and the sidebar counts
  consistent — the badge is the subtree total, and that is exactly what clicking
  yields.
- **Expansion state is an override map, not a materialised set.** Defaults are computed
  during render (`defaultExpandedFolders`: open everything up to 40 nodes, otherwise
  the top two levels) and user toggles are stored as explicit overrides. This avoids an
  effect writing state back on every tree change — the shape that produced React error
  #185 in the B-4 undo/redo attempt.
- **Paths are normalised before use as keys.** Stored `folderPath` values are not
  consistent: API-ingested assets carry `content/dam/<site>/...`, while uploads this
  page made previously carried `/dam/images`. Without normalising, one folder files
  under two keys.
- **The chevron and the folder label are separate buttons.** Opening a parent to reach
  a child should not reload the parent's whole subtree on the way past.

The breadcrumb now spells out the selected path with each ancestor selectable, and
"Assets" clears the filter.

## A second defect, in the upload path

Fixing where uploads land exposed that they never landed anywhere. The page posted a
hardcoded `siteId: 'corporate'`; `assets.site_id` is a foreign key into `sites`, and the
only configured site is `tut-usa`. Every upload from this page failed the insert with
HTTP 500 — and the page then inserted a **local placeholder asset**, so the grid showed
the upload as though it had succeeded.

With a folder tree that lie gets worse: the phantom asset invents a folder that does not
exist. So:

- sites are read from `GET /api/admin/sites`, and each declares its own `damRoot`
- the upload target is the selected folder, or the resolved site's DAM root
- the site is resolved from the folder (by DAM root, then by a site id appearing as a
  path segment), falling back to the first configured site
- a failed upload no longer fabricates an asset; the dialog reports how many files could
  not be stored, and the dialog says where the upload is going before it is made

## Verification

New suite `dam-folder-tree-suite.spec.ts` — 7 scenarios, all passing, added to the
Selenium gate's `full` mode as `test:damtree:ci`. It uploads its own run-unique nested
fixture and deletes it afterwards.

| Scenario | Asserts |
|---|---|
| S1 | The endpoint reports each folder with an asset, scoped to the site — **and** that a folder with no direct assets is *not* reported, pinning the derivation contract rather than treating the absence as an oversight |
| S2 | The tree renders from stored paths, and the four MIME-type buckets are gone |
| S3 | `brand` and `marketing/campaigns` are reconstructed although neither holds an asset |
| S4 | Counts are subtree totals: `brand` 3, `logos` 2, run root 5 |
| S5 | Collapse/expand works without changing the selection |
| S6 | A leaf shows only its own assets; a parent shows all descendants; an unrelated subtree does not leak |
| S7 | The breadcrumb spells out the path, ancestors are selectable, and "Assets" clears the filter |

Backend: `flexcms-dam` 27 tests, `flexcms-author` 46 tests, 0 failures.
Admin typecheck clean, `next build` 18/18 pages.

Visually confirmed against a seeded library: two roots (`content`, `dam`) with correct
rollups — `All Assets` 8, `content` 3, `dam` 5, `brand` 3, `logos` 2, `icons` 1 — and
selecting `brand` lists exactly its three descendants.

## Four unrelated failing tests, fixed here

`ScheduledPublishingServiceTest` had **4 failures** before any of this work, left behind
by the earlier R20-3 scheduler fix: `clearScheduledPublish`/`clearScheduledDeactivate`
were changed to re-read the node by path (that re-read *is* the lost-update fix), but
the tests still stubbed only the due-node finder, so the re-read returned empty and the
save never happened. I made that change and did not re-run the author module afterwards.

A fifth test in the same class passed only vacuously — it asserted a schedule had been
cleared on a node that never had one. It now sets schedules on both nodes and asserts
the failed node *keeps* its schedule for retry.

## Known limitations

- **Empty folders cannot exist.** With folders derived from asset paths, a folder with
  no assets anywhere beneath it has nothing to derive it from. Creating one, and
  "move to folder", would need a real folder entity — not built, since neither was
  asked for.
- **The tree spans every site**, matching the asset list the page already shows
  (`listAll` ignores site). The endpoint takes a `siteId` whenever the page grows a site
  selector.
- **Grid filtering is client-side over the first 200 assets**, unchanged from before.
  Beyond that the tree is complete but the grid is not.
