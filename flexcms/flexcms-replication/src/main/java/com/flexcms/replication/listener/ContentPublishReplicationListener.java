package com.flexcms.replication.listener;

import com.flexcms.core.event.ContentDeletedEvent;
import com.flexcms.core.event.ContentStatusChangedEvent;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.service.ReplicationAgent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Replicates content to the publish environment whenever its status changes.
 *
 * <p>Before this listener existed, replication was triggered by one caller only —
 * {@code AuthorContentController.bulkPublish()} — so publishing through any other
 * path (the admin page editor's Publish button, a direct
 * {@code POST /api/author/content/node/status} call, or scheduled publishing)
 * changed the node's status without ever sending it to the publish instance. The
 * author saw "Published" while the publish environment served nothing.</p>
 *
 * <p>Listening to {@link ContentStatusChangedEvent} moves that rule out of the
 * controller and behind the status transition itself, so every publish path
 * behaves identically.</p>
 *
 * <p>Bound with {@link TransactionPhase#AFTER_COMMIT} so a status change that is
 * rolled back is never replicated. Replication failures are logged and swallowed:
 * the content is legitimately published on the author side, and a failed
 * replication must not roll the transition back — it is recoverable by
 * re-publishing.</p>
 */
@Component
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
public class ContentPublishReplicationListener {

    private static final Logger log = LoggerFactory.getLogger(ContentPublishReplicationListener.class);

    /** Node types whose whole subtree must travel together, so components are not lost. */
    private static final String PAGE_RESOURCE_TYPE = "flexcms/page";
    private static final String SITE_ROOT_RESOURCE_TYPE = "flexcms/site-root";
    /**
     * An Experience Fragment variation holds component children exactly as a page
     * does — the components an author edits live under `.../master`, not under the
     * fragment folder.
     */
    private static final String XF_VARIATION_RESOURCE_TYPE = "flexcms/xf-page";

    @Autowired
    private ReplicationAgent replicationAgent;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onContentStatusChanged(ContentStatusChangedEvent event) {
        String path = event.getPath();
        if (path == null) {
            return;
        }

        try {
            if (event.isPublished()) {
                if (isTreeReplicationCandidate(event.getResourceType())) {
                    replicationAgent.replicateTree(path, event.getUserId());
                    log.debug("Replicated subtree for published node {}", path);
                } else {
                    replicationAgent.replicate(path, ReplicationEvent.ReplicationAction.ACTIVATE, event.getUserId());
                    log.debug("Replicated published node {}", path);
                }
            } else if (event.isUnpublished()) {
                replicationAgent.replicate(path, ReplicationEvent.ReplicationAction.DEACTIVATE, event.getUserId());
                log.debug("Deactivated node {} on publish (status {} -> {})",
                        path, event.getPreviousStatus(), event.getNewStatus());
            }
        } catch (Exception e) {
            // The author-side transition already committed; losing replication is
            // recoverable, rolling the publish back is not what the author asked for.
            log.error("Replication failed for '{}' after status change {} -> {}: {}",
                    path, event.getPreviousStatus(), event.getNewStatus(), e.getMessage(), e);
        }
    }

    /**
     * Removes deleted content from the publish environment.
     *
     * <p>{@code ReplicationReceiver} has always handled
     * {@code ReplicationAction.DELETE}, but until {@link ContentDeletedEvent} existed
     * nothing produced one: deleting a published page removed it from the author and
     * left the public site serving it forever. Bound AFTER_COMMIT for the same reason
     * as the status listener — a rolled-back delete must not reach publish.</p>
     *
     * <p>A failure is logged rather than rethrown: the author-side delete has already
     * committed, and the node cannot be resurrected by failing here. The residue is
     * recoverable by re-issuing the delete once replication is healthy.</p>
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onContentDeleted(ContentDeletedEvent event) {
        String path = event.getPath();
        if (path == null) {
            return;
        }
        try {
            // replicateDelete, not replicate: the latter resolves the node first and
            // the node is already gone by the time a deletion is announced.
            replicationAgent.replicateDelete(path, event.getNodeId(), event.getSiteId(),
                    event.getLocale(), event.getUserId());
            log.debug("Replicated deletion of {}", path);
        } catch (Exception e) {
            log.error("Delete replication failed for '{}': {}", path, e.getMessage(), e);
        }
    }

    /**
     * Nodes that own child component nodes, so publishing one must carry its whole
     * subtree; anything else replicates as a single node.
     *
     * <p>Experience Fragment variations were missing from this list, so publishing one
     * replicated the variation and left its components on the author instance. The
     * fragment then existed on publish as an empty shell — the headless XF API served
     * it with `components: []` — while the equivalent page operation worked. Publishing
     * each component individually was the only way to get reusable content live.</p>
     */
    private boolean isTreeReplicationCandidate(String resourceType) {
        return PAGE_RESOURCE_TYPE.equals(resourceType)
                || SITE_ROOT_RESOURCE_TYPE.equals(resourceType)
                || XF_VARIATION_RESOURCE_TYPE.equals(resourceType);
    }
}
