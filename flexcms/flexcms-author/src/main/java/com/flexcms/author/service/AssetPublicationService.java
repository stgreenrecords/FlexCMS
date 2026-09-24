package com.flexcms.author.service;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.service.AuditService;
import com.flexcms.core.util.AssetUrls;
import com.flexcms.dam.service.AssetIngestService;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.service.ReplicationAgent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Explicit publish and unpublish of a single DAM asset.
 *
 * <p>Most assets reach the publish tier implicitly, when a page that references them is
 * published ({@code ReplicationAgent.replicateReferencedAssets}). This covers the rest:
 * assets used outside published content (a download linked from another system, a
 * brand file) and withdrawing an asset without deleting it. Page unpublish deliberately
 * does not withdraw assets, because another published page may still use them; reference
 * counting needs the reference index from {@code ECMS-02}.</p>
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
public class AssetPublicationService {

    private static final Logger log = LoggerFactory.getLogger(AssetPublicationService.class);

    @Autowired
    private AssetIngestService assetService;

    @Autowired
    private ReplicationAgent replicationAgent;

    @Autowired
    private AuditService auditService;

    /** Outcome of a publish or unpublish request. */
    public record AssetPublicationResult(UUID assetId, String path, String action,
                                         UUID replicationEventId, String url) {}

    /**
     * Send an asset to the publish tier, where its canonical URL starts resolving.
     *
     * @throws NotFoundException when no asset has that id
     * @throws ConflictException when the asset is not {@code ACTIVE} (still processing, archived)
     */
    @Transactional
    public AssetPublicationResult publish(UUID assetId, String userId) {
        Asset asset = load(assetId);
        if (asset.getStatus() != AssetStatus.ACTIVE) {
            throw new ConflictException("ASSET_NOT_ACTIVE",
                    "Asset " + asset.getPath() + " is " + asset.getStatus() + " and cannot be published");
        }
        UUID eventId = replicationAgent.replicateAsset(assetId, ReplicationEvent.ReplicationAction.ACTIVATE, userId);
        auditService.log(AuditService.ENTITY_ASSET, assetId, asset.getPath(), AuditService.ACTION_PUBLISH, userId);
        log.info("Published asset {} ({}) by {}", asset.getPath(), assetId, userId);
        return new AssetPublicationResult(assetId, asset.getPath(), ReplicationEvent.ReplicationAction.ACTIVATE.name(),
                eventId, AssetUrls.original(assetId));
    }

    /**
     * Withdraw an asset from the publish tier; it stays on author. Its URL answers 404 on
     * publish once the event is applied, and the CDN copies are purged.
     *
     * @throws NotFoundException when no asset has that id
     */
    @Transactional
    public AssetPublicationResult unpublish(UUID assetId, String userId) {
        Asset asset = load(assetId);
        UUID eventId = replicationAgent.replicateAsset(assetId, ReplicationEvent.ReplicationAction.DEACTIVATE, userId);
        auditService.log(AuditService.ENTITY_ASSET, assetId, asset.getPath(), AuditService.ACTION_UNPUBLISH, userId);
        log.info("Unpublished asset {} ({}) by {}", asset.getPath(), assetId, userId);
        return new AssetPublicationResult(assetId, asset.getPath(), ReplicationEvent.ReplicationAction.DEACTIVATE.name(),
                eventId, AssetUrls.original(assetId));
    }

    private Asset load(UUID assetId) {
        return assetService.getAssetById(assetId)
                .orElseThrow(() -> NotFoundException.forId("Asset", assetId));
    }
}
