# ECMS-03 — Solution design: publish-tier asset delivery and asset replication

- Role: `sa` (Mode B)
- Date: 2026-09-24 local
- Closes: `R-REB-21-003`
- Decision record: `DEC-ECMS-002` in `df/runtime/decisions.md`

## Problem (verified 2026-09-24)

1. Authored content references DAM assets as `/api/author/assets/{id}/content` — the only
   URL the platform issues (`DirectDamClient.streamUrl`, admin "Copy URL").
2. That endpoint is author-only (`@ConditionalOnProperty runmode=author`, role-guarded).
3. The publish database (`flexcms_publish`) has an empty `assets` table — assets are never
   replicated. `ReplicationAgent.replicateAsset()` exists but is called only by tests, and
   `ReplicationReceiver` would mishandle an `ASSET` event (it routes it into content
   activation and would upsert a bogus content node).
4. `SecurityConfig` already permits `GET /dam/renditions/**` and `PublishPageController`
   already excludes `/dam/**` from its catch-all — the intended public URL contract exists
   but nothing handles it.
5. The reference site keeps `/api/author/assets/...` relative, so the browser requests it
   from the site host, where nothing serves it.
6. Latent: `DamClient.getRenditionUrl()` (plugin SPI, documented as returning a URL)
   returns the raw S3 storage key.

## Options

| Option | Summary | Verdict |
|---|---|---|
| A | Publish-tier asset delivery endpoint; replicate asset **metadata** rows to publish; binaries stay in the shared object store | **Chosen** |
| B | Copy binaries to a separate static/CDN bucket at activation | Rejected for now: needs a second bucket, lifecycle sync, and deploy config; A can move to B later without changing the URL contract |

Both tiers are already configured against the same bucket (`flexcms.dam.s3.bucket`, base
`application.yml`). Author/publish separation is preserved because the publish endpoint
serves **only assets whose metadata row has been replicated** — an unpublished asset's
binary may exist in the bucket, but the publish tier has no row and answers 404.

## Design

### 1. Canonical public asset URL (single owner)

`com.flexcms.core.util.AssetUrls` owns the contract:

- Original: `/dam/renditions/{assetId}`
- Rendition: `/dam/renditions/{assetId}/{renditionKey}` (`renditionKey` = `[a-z0-9-]+`)
- Legacy form accepted for extraction and rewritten on delivery:
  `/api/author/assets/{assetId}/content`, relative or absolute (`http(s)://host…`).
- `extractAssetIds(Object)` — recursive over maps/lists/strings; finds ids in both forms.
- `rewriteLegacyReferences(Object)` — deep copy with every legacy URL replaced by the
  canonical one.

URLs are relative, so each tier serves them for whatever API host the client called.

### 2. Serving (both tiers)

- `AssetDeliveryService` (`flexcms-dam`, service layer): resolves an **ACTIVE** asset by id
  and optional rendition key (falls back to the original when the rendition does not
  exist), returns a `DeliverableAsset(storageKey, mimeType, fileSize, etag)`.
- `AssetDeliveryController` (`flexcms-headless`, controller layer, `GET /dam/renditions/{id}`
  and `/{id}/{renditionKey}`): streams from S3 with `Cache-Control: public, max-age=86400`,
  `ETag` (derived from the storage key, which is unique per upload), and `304` on a matching
  `If-None-Match`. Unknown/inactive asset → `NotFoundException` → RFC 7807 404.
- `flexcms-headless` gains a dependency on `flexcms-dam` (no cycle: dam → core, plugin-api).

### 3. Replication

Author side (`flexcms-replication`):

- `ReplicationEvent` gains `assetId` and `assetPayload` (asset columns + renditions list) so
  publish needs no call back to author.
- `ReplicationAgent.replicateAsset(assetId, action, userId)` builds the payload from
  `AssetRepository`; `replicateAssetDelete(assetId, path, userId)` for deletions.
- `ReplicationAgent.replicateReferencedAssets(nodes, userId)` extracts asset ids from the
  published nodes' properties and replicates each ACTIVE asset found.
- Triggers:
  - page / site-root / XF-variation tree publish and single-node publish →
    `ContentPublishReplicationListener` replicates referenced assets after the content;
  - explicit `POST /api/author/assets/{id}/publish` and `/unpublish` →
    `AssetPublicationService` (`flexcms-author`);
  - asset deletion → `AssetIngestService` publishes core `AssetDeletedEvent`; the listener
    replicates the deletion `AFTER_COMMIT` (same pattern as `ContentDeletedEvent`).
- Page **unpublish does not retract assets** — an asset may be used by other published
  pages. Reference-counted retraction needs `ECMS-02`.

Publish side:

- `ReplicationReceiver` handles `ASSET` events **before** content handling:
  `ACTIVATE` → upsert asset row by id (preserving the author id so URLs match) and replace
  its renditions; `DEACTIVATE`/`DELETE` → delete the row (renditions cascade).
  A stale row with the same path but a different id is removed first (path is unique).
- Publishes core `AssetPublicationChangedEvent`; `flexcms-publish` listener calls
  `CdnPurgeService.purgePaths(["/dam/renditions/{id}", "/dam/renditions/{id}/*"])`.
  (No-op when no CDN provider is configured.)
- Upserts are native SQL in `AssetRepository` (JPA `merge` cannot insert a caller-chosen id
  for a `@GeneratedValue` entity); covered by an `*IT` against real PostgreSQL.

### 4. Delivery JSON

`ContentDeliveryService.renderPage` / `renderXfVariation` return
`AssetUrls.rewriteLegacyReferences(result)` — satisfies "never point at `/api/author/...`"
for every page and fragment consumer (REST, GraphQL page resolver, reference sites) without
touching stored content. Authoring APIs (`/api/author/content/*`) are unchanged.

### 5. SPI fix

`DirectDamClient` / `AssetIngestService.getRenditionUrl` return canonical URLs instead of
storage keys, matching the `DamClient` contract.

### 6. Reference site (frontend)

- `site-nextjs` rewrites: `/dam/renditions/:path*` → the live route's API base;
  `/draft-dam/renditions/:path*` → the preview route's API base (author). Each route keeps
  its own host, so draft previews show unpublished assets and the live site never does.
- `normalizePageAssetUrls` converts legacy/absolute author URLs to canonical, and in
  preview mode to `/draft-dam/...`.
- Admin DAM "Copy URL" copies the canonical URL.

## Security / privacy

- `/dam/renditions/**` was already `permitAll` for GET. On publish it only exposes
  replicated (published) assets. On author it exposes active assets to anyone who can reach
  the author host — acceptable because author is not internet-facing (same stance as the
  author delivery APIs); noted as a risk for deployments that expose author.
- Rendition key and id are validated; no path traversal into the bucket is possible because
  storage keys come from the database, never from the request.

## Test strategy (maps to `docs/MANUAL_TEST_CASES_ECMS_UPCOMING.md` ECMS-03-TC01..05)

| TC | Evidence |
|---|---|
| TC01 | This document + `DEC-ECMS-002` |
| TC02 | Unit: listener replicates referenced assets on tree publish; receiver upserts/deletes; asset publish/unpublish/delete produce the right events. Live: publish a page → asset row appears on publish; unpublish/delete asset → gone. |
| TC03 | Unit: `AssetUrls` rewrite + `ContentDeliveryService` rewrite. Live: publish page JSON on `:8081` contains `/dam/renditions/{id}` and no `/api/author/`; `GET :8081/dam/renditions/{id}` → 200 |
| TC04 | Unit: controller sets `Cache-Control`/`ETag`, returns 304; CDN listener purges the asset paths |
| TC05 | Selenium: publish a page referencing a DAM image; load the page on the site backed by publish; `naturalWidth > 0` |

## Rollback

All changes are additive except the delivery rewrite. Reverting the commit restores prior
behaviour; replicated asset rows on publish are inert without the controller.

## Delivery split

- `ECMS-03A` — `backend-dev`: sections 1–5. Dependencies: none.
- `ECMS-03B` — `frontend-dev`: section 6 + Selenium TC05. Dependencies: `ECMS-03A`.
