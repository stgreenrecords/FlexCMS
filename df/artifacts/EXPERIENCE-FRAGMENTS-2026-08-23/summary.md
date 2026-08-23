# Experience Fragment editing — 2026-08-23

Reported directly: *"editing of experience fragments doesn't work for me."*

It didn't, for six independent reasons — three in the admin page, three in the backend.
Any one of them alone was enough to make the feature unusable, and none of them
produced a visible error.

## The page could not load anything

| Fault | Detail |
|---|---|
| Wrong URL | It called `GET /api/author/xf/list`. The list mapping is `GET /api/author/xf`, so `/list` fell into the controller's `@GetMapping("/{*xfPath}")` catch-all and answered `404 Experience Fragment not found: content.list` |
| A site that does not exist | `siteId=corporate` was hardcoded; the only configured site is `tut-usa`. Against the *correct* URL that still returns `[]` |
| Field names that never matched | The response carries `xf_path`, `title`, `updated_at`; the mapper read `name`, `path`, `modifiedAt`. Every row would have rendered as "Untitled" with an empty path — nothing to open even once loaded |

And the failure was silent: `.catch(() => { /* API unavailable */ })` swallowed the 404,
so a broken page was indistinguishable from an empty one.

## Nothing on the page did anything

Every item in the row menu — Edit Variations, Publish, Duplicate, Delete, New Fragment
Here, Rename — was `onClick={() => onActionMenu(null)}`. They closed the menu. The
fragment name was plain text, so there was no way to open a fragment at all.

The footer read **"Showing 1 – 2 of 38 fragments"** beside two rows, with pagination
offering eight pages whose buttons had no handlers, and the Usage Overview claimed 38
fragments across 6 sites, 72% translated and 12 A/B variants. None of it came from
anywhere.

## Three backend faults behind it

**1. `XF_ROOT` was not under `content.`** — `"experience-fragments"` rather than
`"content.experience-fragments"`. `buildXfPath` therefore wrote new fragments to a
second tree at the database root, while every read path — the controller's
`PathUtils.toContentPath`, `getExperienceFragment`, `deleteExperienceFragment` — 
normalises onto `content.`. **A fragment created through the API could never be
fetched, edited or deleted through that same API.** Create returned 200 and the thing
it made was unreachable, including from the content tree. Verified: my first duplicate
left five orphaned nodes at `experience-fragments.tut-usa.en.global.*` that no endpoint
could address.

**2. Every variation change returned 500.** `addVariation` and `deleteVariation` bound
`Instant.now()` as a JDBC parameter:

```
Can't infer the SQL type to use for an instance of java.time.Instant.
```

So a variation could never be added — and a fragment with no variation cannot be
edited, because the components live under the variation, not the folder. Both call
sites now use SQL `NOW()`, matching the upsert that already did.

**3. The editor's "Edit in Experience Fragments →" pointed at the wrong node.** It
linked to the fragment *folder*, whose children are variations. The editable components
are one level down, under `.../master`.

## What the fixes are

- The page resolves its site from `/api/admin/sites`, calls the correct list URL, maps
  the real field names, and fetches each fragment's variations to show a real count,
  status and edit target.
- Failures are surfaced in the UI instead of swallowed.
- The fragment name opens the editor **on the variation**.
- Actions are wired to endpoints that exist: Edit Variations, Publish (via
  `POST /node/status` across the fragment's variations — there is no fragment-level
  publish), Duplicate (create, then copy each variation across), Delete, New Fragment
  Here (create, then add a master so the result is editable).
- **Rename was removed rather than wired.** The XF API has no rename or
  move-within-parent operation. Shipping a button that cannot work is the defect being
  fixed here, so the honest move was to take it out.
- Counts and the Usage Overview are computed from the loaded fragments and the site's
  own configuration. The fake pagination control is deleted — this list is fetched in
  one request and is not paginated.

Also fixed, spotted while verifying: the canvas showed *"Renders nothing on the page"*
under the site navigation, which plainly does render. The collapsed-component check I
added earlier measured only the host's own box, and a sticky or fixed renderer is out
of flow with zero in-flow height. It now checks descendants too.

## A mistake of mine, recorded

Duplicate and New Fragment Here originally *predicted* the new fragment's path from the
source path's segments. `buildXfPath` inserts a locale segment the seeded fragments do
not have, so the guess never matched what was created and the follow-up `addVariation`
calls hit a path that did not exist. Because those responses were unchecked, the copy
silently ended up with no variations — the exact state that makes a fragment
uneditable. Both now use the path the create response returns, and check every
response.

Testing this also left five orphaned nodes and a metadata row in the author database,
which fault 1 made unreachable through the API; they were removed directly and the
seeded set verified back to its original nine nodes.

## Verification

`flexcms-author`: **51 tests, 0 failures.** Five are new or corrected:

- `createExperienceFragment_rootsThePathUnderContent`
- `createExperienceFragment_pathSurvivesContentPathNormalisation` — asserts create's
  path is a fixed point of `toContentPath`, i.e. the API can address what it just made
- `createExperienceFragment_ancestorsAreRootedUnderContentToo`
- `addVariation_doesNotBindATemporalParameter` / `deleteVariation_…` — a mocked
  `JdbcTemplate` accepts the `Instant` happily, which is why the unit tests never
  caught this; the assertion is on the call shape instead

Two existing tests were **encoding the bugs** and were corrected:
`createExperienceFragment_savesXfFolderAndMetadata` left the created path to a *comment*
("The path would be experience-fragments.demo-site.en.site.header" — the wrong value,
and a comment cannot fail), and `deleteVariation_deletesSubtreeAndUpdatesTimestamp`
asserted the two-argument call that always failed in production.

Live, through the UI, against `tut-usa`:

```
list                 2 fragments, "Showing 2 of 2 fragments", no error
open Global Navigation  -> /editor?path=/experience-fragments/tut-usa/global/navigation/master
                           canvas renders tut-usa/navigation-search-discovery/navigation
                           properties show real fields, incl. the nested Account Entry
                           group and the Primary Links repeater
Duplicate            -> navigation-copy created, variations: master, status DRAFT
Publish              -> status PUBLISHED
Delete               -> removed; list back to 2
seeded set intact:   true
```
