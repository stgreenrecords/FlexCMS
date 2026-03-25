package com.flexcms.replication.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.pim.event.ProductPublishedMessage;
import com.flexcms.replication.model.ReplicationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Author-tier listener that reacts to PIM product-published notifications.
 *
 * <p>When a PIM product transitions to {@code PUBLISHED}, this listener:
 * <ol>
 *   <li>Finds all CMS content nodes that reference the published product via the
 *       {@code productSku} property (JSONB convention)</li>
 *   <li>Triggers re-replication of each matching node via {@link ReplicationAgent}</li>
 * </ol>
 *
 * <p>This ensures that any page components displaying product data are refreshed
 * on the publish tier and the static-site build worker rebuilds affected pages.</p>
 *
 * <p>Only active on the author tier ({@code flexcms.runmode=author}, the default).</p>
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
public class ProductPublishListener {

    private static final Logger log = LoggerFactory.getLogger(ProductPublishListener.class);

    @Autowired
    private ContentNodeRepository contentNodeRepository;

    @Autowired
    private ReplicationAgent replicationAgent;

    /**
     * Consume a product-published message and trigger page rebuilds.
     *
     * @param message the published product notification from PIM
     */
    @RabbitListener(queues = "#{authorProductQueue.name}")
    public void onProductPublished(ProductPublishedMessage message) {
        String sku = message.getSku();
        String initiatedBy = message.getPublishedBy() != null ? message.getPublishedBy() : "pim-system";

        log.info("Product '{}' published — scanning CMS pages for rebuild (initiatedBy={})", sku, initiatedBy);

        List<ContentNode> affectedNodes = contentNodeRepository.findByProductSku(sku);

        if (affectedNodes.isEmpty()) {
            log.debug("No CMS pages reference product '{}' — no rebuild needed", sku);
            return;
        }

        int rebuilt = 0;
        int failed = 0;

        for (ContentNode node : affectedNodes) {
            try {
                replicationAgent.replicate(node.getPath(), ReplicationEvent.ReplicationAction.ACTIVATE, initiatedBy);
                log.info("Triggered page rebuild for '{}' (references product '{}')", node.getPath(), sku);
                rebuilt++;
            } catch (Exception e) {
                log.error("Failed to trigger page rebuild for '{}' (product '{}'): {}",
                        node.getPath(), sku, e.getMessage());
                failed++;
            }
        }

        log.info("Product '{}' page rebuild complete: {} pages rebuilt, {} failed",
                sku, rebuilt, failed);
    }
}
