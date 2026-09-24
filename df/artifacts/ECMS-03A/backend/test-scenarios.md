# ECMS-03A — Test scenarios (backend-dev)

Developer testing bar per `DEC-DF-007`. Maps each acceptance criterion to its automated
tests and to the manual cases in `docs/MANUAL_TEST_CASES_ECMS_UPCOMING.md` (`ECMS-03-TC01..05`).
TC05 (rendered image on the reference site) belongs to `ECMS-03B`.

- Date: 2026-09-24 local
- Stack for live runs: author `:8080`, publish `:8081`, started with `flex start local author,publish`
- Live script: [`live-verify.sh`](live-verify.sh), run with `MSYS_NO_PATHCONV=1 PROBE_PNG=<png> bash live-verify.sh`
- Live result: [`live-verify-2026-09-24.out`](live-verify-2026-09-24.out), **29 passed, 0 failed**
- Build: `mvn verify` green (all unit tests plus `AssetRepositoryIT`, `ContentNodeRepositoryIT`,
  `ProductRepositoryIT`, `ReplicationAgentIT`, `ReplicationReceiverIT`)

## AC → evidence

| AC | Scenario | Automated | Live (`live-verify.sh`) | Manual TC |
|---|---|---|---|---|
| AC1 | URL contract; ids extracted from legacy relative/absolute, canonical, and rich-text URLs; legacy rewritten, input untouched | `AssetUrlsTest` (9) | — | TC03 |
| AC2 | Original and rendition stream with `Cache-Control: public, max-age=86400`, `ETag`, `nosniff`, sandbox CSP; `304` on matching `If-None-Match` without reading storage; missing rendition falls back to original; unknown / inactive / malformed key → 404 RFC 7807 | `AssetDeliveryServiceTest` (9), `AssetDeliveryControllerTest` (7) | "serving on author" block (6 checks) | TC03, TC04 |
| AC3 | Tree and single-node publish send referenced ACTIVE assets **before** the content; inactive skipped; one failed send does not stop the rest; payload survives the broker; publish writes the row under the author id, replaces renditions, clears a same-path predecessor; unknown site → `NULL` | `ReplicationAgentTest`, `ReplicationReceiverTest`, `ReplicationAgentIT` (payload round-trip, asset-then-tree order), `ReplicationReceiverIT` (3 asset cases), `AssetRepositoryIT` (8) | publish 404 before page publish → row created → 200, same bytes as author | TC02 |
| AC4 | `POST /api/author/assets/{id}/publish` · `/unpublish` (audited; 409 for non-ACTIVE, 404 unknown); delete emits `AssetDeletedEvent` and is replicated after commit; publish answers 404 afterwards | `AssetPublicationServiceTest` (5), `AssetIngestServiceTest` (delete event), `ContentPublishReplicationListenerTest` (2), `ReplicationAgentIT.assetDeletedEvent_afterCommit_…` | unpublish → publish 404, author still 200; re-publish → 200; throwaway upload → publish → delete → 404 on both tiers | TC02 |
| AC5 | Page and XF delivery JSON rewritten to canonical; stored content unchanged | `ContentDeliveryServiceTest.renderPage_rewritesAuthorOnlyAssetUrls_…` | publish and author page JSON contain `/dam/renditions/{id}` and no `/api/author/`; author node still stores the legacy URL | TC03 |
| AC6 | Publish purges `/dam/renditions/{id}` and `/{id}/*` after commit on activate and withdraw | `AssetCdnPurgeListenerTest` (2), `ReplicationReceiverTest` (event published) | Not observable locally (no CDN provider configured, purge is a no-op) | TC04 |
| AC7 | `getRenditionUrl` / `DirectDamClient` return canonical URLs, not storage keys | `AssetIngestServiceTest.getRenditionUrl_returnsCanonicalDeliveryUrl_…` | — | — |
| AC8 | This file; `mvn verify` green | — | — | — |

## Defect found and fixed while testing (outside the original ACs)

**Replication triggered by `AFTER_COMMIT` listeners never persisted its log.**
`ContentPublishReplicationListener` runs after the author transaction commits. The agent's
`@Transactional` methods joined that finished transaction, so the RabbitMQ message went out but
the `replication_log` row was discarded. Across the local database's whole history there were
no `CONTENT` or `TREE` rows. This predates ECMS-03, and the new asset-delete replication inherited it.

- Fix: `@Transactional(propagation = REQUIRES_NEW)` on the three listener methods.
- Proof: `ReplicationAgentIT.publishViaStatusEvent_afterCommit_persistsReplicationLog` and
  `…assetDeletedEvent_afterCommit_sendsDeleteAndPersistsLog` both **fail with the annotation removed**
  and pass with it (checked 2026-09-24). Live: the probe page's `TREE` row and the throwaway
  asset's `DELETE` row are now persisted.
- Recorded in `hints_for_agent.md`.

## Known limits (by design, `DEC-ECMS-002`)

- Unpublishing a page does not withdraw its assets, because another published page may still use them.
  Reference-counted retraction needs `ECMS-02`.
- Only URL references are detected (`/dam/renditions/…`, `/api/author/assets/{id}/content`).
  Content that stores a bare DAM path (`/content/dam/...`) is not linked to an asset.
- On author, `/dam/renditions/**` serves every ACTIVE asset without authentication. That's acceptable
  while author is not internet-facing.
- The reference site still keeps asset URLs relative to its own host. Until `ECMS-03B` adds the
  proxy rewrite, a browser on `:3001` cannot load them. Rendered images (TC05) are `ECMS-03B` scope.

## Test data hygiene

The live script creates `content.tut-usa.ecms03-probe` and `/content/dam/tut-usa/ecms03/probe.png`
and deletes both. It also unpublishes the shared sample image it borrows, so the script can be rerun.
After the run, no `ecms03` asset or node remains on either tier.
