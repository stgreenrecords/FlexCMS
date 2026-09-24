package com.flexcms.core.event;

import org.springframework.context.ApplicationEvent;

import java.util.UUID;

/**
 * Published on the publish tier after a replicated asset has been activated, replaced, or
 * removed.
 *
 * <p>Asset URLs are served with a long {@code Cache-Control} lifetime, so a CDN in front of
 * the publish tier keeps a replaced or withdrawn binary until it is told otherwise. The
 * replication receiver fires this event and a listener in {@code flexcms-publish} purges
 * the asset's URLs; the receiver itself stays free of any CDN dependency.</p>
 */
public class AssetPublicationChangedEvent extends ApplicationEvent {

    private final UUID assetId;
    private final String path;
    private final boolean available;

    public AssetPublicationChangedEvent(Object source, UUID assetId, String path, boolean available) {
        super(source);
        this.assetId = assetId;
        this.path = path;
        this.available = available;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public String getPath() {
        return path;
    }

    /** {@code true} when the asset is now served, {@code false} when it was withdrawn. */
    public boolean isAvailable() {
        return available;
    }
}
