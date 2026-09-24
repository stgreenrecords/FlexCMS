package com.flexcms.core.event;

import org.springframework.context.ApplicationEvent;

import java.util.UUID;

/**
 * Published when a DAM asset is deleted on the author side.
 *
 * <p>Assets are now replicated to the publish tier so published pages can serve them
 * ({@code R-REB-21-003}). A deletion that stayed local would leave the publish tier
 * serving an asset the author had removed, so {@code AssetIngestService.deleteAsset()}
 * announces it and a listener in {@code flexcms-replication} replicates the deletion.
 * Consumers bind with {@code AFTER_COMMIT} so a rolled-back deletion is never
 * replicated — the same contract as {@link ContentDeletedEvent}.</p>
 *
 * <p>The row is gone by the time this fires, so the event carries the identifying
 * details rather than the entity.</p>
 */
public class AssetDeletedEvent extends ApplicationEvent {

    private final UUID assetId;
    private final String path;
    private final String siteId;
    private final String userId;

    public AssetDeletedEvent(Object source, UUID assetId, String path, String siteId, String userId) {
        super(source);
        this.assetId = assetId;
        this.path = path;
        this.siteId = siteId;
        this.userId = userId;
    }

    public UUID getAssetId() {
        return assetId;
    }

    /** DAM path the asset had before deletion. */
    public String getPath() {
        return path;
    }

    public String getSiteId() {
        return siteId;
    }

    public String getUserId() {
        return userId;
    }
}
