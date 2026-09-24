package com.flexcms.publish.listener;

import com.flexcms.cdn.service.CdnPurgeService;
import com.flexcms.core.event.AssetPublicationChangedEvent;
import com.flexcms.core.util.AssetUrls;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * Purges an asset's public URLs from the CDN once its publish row changes.
 *
 * <p>{@code AssetDeliveryController} serves assets with a day-long {@code Cache-Control},
 * so without a purge a replaced image stays stale and a withdrawn one stays reachable at
 * the edge. Bound {@code AFTER_COMMIT}: purging before the receiver's transaction commits
 * would let the CDN re-fetch the old row. {@link CdnPurgeService} is a no-op when no CDN
 * provider is configured.</p>
 */
@Component
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
public class AssetCdnPurgeListener {

    private static final Logger log = LoggerFactory.getLogger(AssetCdnPurgeListener.class);

    @Autowired
    private CdnPurgeService cdnPurgeService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAssetPublicationChanged(AssetPublicationChangedEvent event) {
        String original = AssetUrls.original(event.getAssetId());
        List<String> patterns = List.of(original, original + "/*");
        log.debug("Purging CDN paths for asset {} ({}): {}", event.getAssetId(),
                event.isAvailable() ? "replaced" : "withdrawn", patterns);
        cdnPurgeService.purgePaths(patterns);
    }
}
