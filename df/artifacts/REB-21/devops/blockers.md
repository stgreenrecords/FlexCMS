# REB-21 — Implementation blockers and findings

Every item below was **observed at runtime** by the REB-21 suite against the
running local stack, or reproduced directly against the author API, and each names
the exact file and symbol. Run of record: 2026-08-23, 10 tests / 0 failures, 9
operation rows (see `summary.md`). None is caused by this suite; all are outside
the `devops` lane and are reported for SA routing.

---

## R21-1 — The asset upload endpoint performs no validation of any kind

> **RESOLVED 2026-08-23.** `AssetIngestService.ingest()` rejects empty uploads, enforces
> a size cap (`flexcms.dam.max-upload-bytes`, default 100 MB — matching what the admin
> dialog advertises), and refuses executables by **Tika-detected** type, so renaming
> `payload.exe` to `photo.png` does not get past it. Validation sits in the service, not
> the controller, so the REB-07 import path and any future ingest route are covered too.
> A positive allow-list was deliberately *not* introduced: the DAM legitimately holds
> fonts and stylesheets (REB-07 imported 22 and 15), so that remains an `sa` policy
> question. Verified live by REB-21 `S9`, now PASS.


**Severity:** highest-impact finding in this task. An unauthenticated-by-default
local endpoint stores arbitrary bytes under an arbitrary path.

**Where:** `flexcms-author` → `AuthorAssetController.uploadAsset(MultipartFile, String, String, String)`

```java
public ResponseEntity<Asset> uploadAsset(
        @RequestParam("file") MultipartFile file,
        @NotBlank @RequestParam String path,
        @NotBlank @RequestParam String siteId,
        @NotBlank @RequestParam String userId) throws IOException {
    Asset asset = assetService.ingest(path, file.getOriginalFilename(),
            file.getBytes(), siteId, userId);
    return ResponseEntity.ok(asset);
}
```

**What:** `path`, `siteId`, and `userId` are validated for blankness; the **file
is not validated at all**. There is no size limit, no emptiness check, no MIME
allow-list, and no magic-byte inspection — `getBytes()` goes straight to
`ingest()`.

The admin upload dialog *looks* like it enforces limits:

```tsx
<FileUpload accept="image/*,video/*,.pdf,.zip,.xlsx" maxSize={100 * 1024 * 1024} maxFiles={20} />
```

Those constraints live entirely in the browser. Any client calling the API
directly — curl, a script, a compromised page — bypasses them completely.

**Observed** (both stored successfully and returned an asset id):

```
POST /api/author/assets?path=…/reb21-…-empty.png&siteId=tut-usa&userId=admin
     (0 bytes, declared image/png)                       -> HTTP 200, asset created

POST /api/author/assets?path=…/reb21-…-payload.exe&siteId=tut-usa&userId=admin
     (bytes 4D 5A 90 00 — a DOS/PE executable header)     -> HTTP 200, asset created
```

**Why it matters beyond tidiness:** the DAM serves these bytes back through
`GET /api/author/assets/{id}/content` with a `Content-Type` derived from the
upload, so the store will hand back whatever was put in it. A zero-byte "image"
also produces an asset that every consumer must special-case.

**Suggested lane:** `backend-dev`, with `sa` confirming the intended policy —
at minimum reject empty files, enforce a server-side size cap, and validate the
declared type against the actual magic bytes rather than trusting the client.

---

## R21-2 — DAM keyword search fails with HTTP 500 for every query

> **RESOLVED 2026-08-23.** The `OR :query = ANY(tags)` clause is gone from
> `AssetRepository.search`; neither the table nor the entity ever had a `tags` column,
> and the adjacent `metadata::text ILIKE` clause already covers tags held in the JSONB
> document. Verified live by REB-21 `S4`, now PASS — a site-scoped search finds the
> uploaded asset. **The latent scoping issue documented below is still open:** a keyword
> search that omits `siteId` is silently scoped to the `corporate` site.


**Severity:** high. The feature has never worked.

**Where:**
- `flexcms-core` → `AssetRepository.search(String siteId, String query, Pageable)`
- `flexcms-dam` → `AssetIngestService.searchAssets(...)` (line 173)

```sql
SELECT * FROM assets
WHERE site_id = :siteId AND status = 'ACTIVE'
  AND (name ILIKE '%' || :query || '%'
       OR title ILIKE '%' || :query || '%'
       OR :query = ANY(tags)          -- <-- no such column
       OR metadata::text ILIKE '%' || :query || '%')
ORDER BY modified_at DESC
```

**What:** the native query references a `tags` column that the `assets` table does
not have. Confirmed against the live schema — `assets` has `id, path, name, title,
description, mime_type, file_size, original_filename, storage_key, storage_bucket,
width, height, color_space, aspect_ratio, duration, video_codec, audio_codec,
frame_rate, metadata, …` and no `tags`.

**Observed:**

```
GET /api/author/assets?q=reb21-…&siteId=tut-usa   -> 500
GET /api/author/assets?q=reb21-…                  -> 500
GET /api/author/assets?size=10                    -> 200   (listing is fine)
GET /api/author/assets/folder?folderPath=…        -> 200   (folder listing is fine)

author.log:
  PSQLException: ERROR: column "tags" does not exist
  at com.flexcms.dam.service.AssetIngestService.searchAssets(AssetIngestService.java:173)
```

**Why nobody noticed:** the admin DAM page never calls the endpoint. It fetches
`GET /api/author/assets?size=200` once and filters client-side with
`a.name.toLowerCase().includes(search)`, so no UI surface reaches `q`. REB-07 also
left the DAM empty (`R21-4`), so no seeded data would have provoked it either.

**A second, latent problem in the same endpoint:** `AuthorAssetController.listAll`
falls back to `siteId != null && !siteId.isBlank() ? siteId : "corporate"` **only
when `q` is set**. So an unfiltered list spans every site, but a keyword search
without an explicit `siteId` silently searches the `corporate` site alone — a
`tut-usa` asset could never match. That will surface the moment `R21-2` is fixed.

**Suggested lane:** `backend-dev` — drop the `tags` clause or add the column, and
cover the query with a repository test (`INFRA-TESTCONTAINERS-DOCKER29` now makes
`*IT` suites actually run, so a `ProductRepositoryIT`-style asset IT would catch
this class of native-SQL breakage).

---

## R21-3 — A DAM asset referenced by published content cannot be served by the publish environment

**Severity:** high. Public visitors get a dead image.

**Where:** `flexcms-dam` (no controller), `flexcms-app` → `SecurityConfig`

**What:** the platform has **no publish-side asset delivery at all**.
`flexcms-dam` ships only `client`, `config`, and `service` packages — there is no
controller anywhere in the module, and no controller in any other module maps
`/dam/renditions/**`, even though `SecurityConfig` explicitly permits that path:

```java
.requestMatchers(HttpMethod.GET, "/dam/renditions/**").permitAll()
```

The only binary route in the system is the **author** endpoint
`/api/author/assets/{id}/content`, which the admin UI also uses for its previews.

**Observed** after publishing a page whose `story-card.image` points at a DAM
asset:

```
page status                                          -> PUBLISHED
:8081 delivery JSON for /tut-usa/reb21-asset-reference -> contains the asset id  ✔
:8081/dam/renditions/{assetId}                        -> 500
:8081/api/author/assets/{assetId}/content             -> 500
```

Both answer `500` rather than `404`, because the generic exception handler maps an
unmapped path to `INTERNAL_SERVER_ERROR` — itself misleading for anyone debugging.

**Positive control in the same scenario:** the reference site's `/tut-usa/home`
renders its images with zero broken sources, because REB-07's 182 captured assets
were copied into `frontend/apps/site-nextjs/public`. So the rendering pipeline is
healthy; it is DAM-backed URLs specifically that cannot resolve. That contrast is
almost certainly *why* REB-07 copied files into `public/` rather than relying on
the DAM.

**Suggested lane:** `backend-dev` + `sa` — decide whether publish gets an asset
delivery controller (with renditions, matching the permitted path) or whether DAM
assets are meant to be published to static storage at activation time. Until then,
authored content should not reference `/api/author/assets/...` URLs for anything
public-facing.

---

## R21-4 — The DAM is empty: REB-07 imported zero assets into it

**Severity:** medium, and squarely a scope question rather than a code fault.

**Where:** `df/artifacts/REB-07/data/dam-import-map.json`,
`scripts/import_tut_usa_captured_assets.py`

**What:** REB-07 is `DONE`, and its own evidence records:

```json
"totals": {
  "uniqueLocalAssets": 182,
  "copiedSiteNextjs": 182,
  "copiedAdmin": 182,
  "damUploaded": 0
}
```

The 182 captured assets were copied into both frontends' `public/` folders and
**none** were uploaded to the DAM; the `assets` table is empty. The import script
does have a `maybe_upload_dam(...)` path that POSTs to `/api/author/assets`, so the
capability exists but was not exercised.

**Consequence:** every DAM-dependent feature — the asset library, the (missing)
picker, renditions, asset search — has no data. Any suite that assumes "seeded
assets exist" has nothing to assert against; REB-21 therefore uploads everything it
verifies and cleans up after itself.

**Suggested lane:** `sa` to decide whether populating the DAM is in REB-07's scope
(and should be reopened) or belongs to a follow-up task. Note that filling the DAM
today would not make those assets renderable on the public site — that needs
`R21-3` first.

---

## Non-blocking observations

- **The admin DAM search and the API search are unrelated code paths.** The page
  filters client-side over a single `?size=200` fetch, so it neither exercises nor
  benefits from the server-side query. A library larger than 200 assets would also
  silently stop being fully searchable in the UI.
- **Folder browsing is not wired in the UI.** `GET /api/author/assets/folder` works
  and is verified by `S5`, but the admin page renders one flat library with no
  folder navigation, so the endpoint has no UI surface.
- **No DAM asset picker exists in the editor.** Consistent with REB-19 blocker
  `B-2`; asset fields are plain text inputs, which is why `S6` authors the
  reference through the API rather than the editor UI.
- **Unmapped paths answer 500, not 404.** `/dam/renditions/**` is permitted but
  unmapped, and the global handler turns the resulting `NoResourceFoundException`
  into `INTERNAL_SERVER_ERROR`. The same pattern was noted in REB-19/REB-26 for
  unreplicated publish pages.
