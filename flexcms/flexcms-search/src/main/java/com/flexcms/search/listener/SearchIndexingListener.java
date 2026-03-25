package com.flexcms.search.listener;

import com.flexcms.core.event.ContentIndexEvent;
import com.flexcms.search.service.SearchIndexService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens to {@link ContentIndexEvent} application events fired by the replication layer
 * and delegates to {@link SearchIndexService} to keep the Elasticsearch index in sync.
 *
 * <p>Handlers are invoked {@code @Async} so that search indexing does not block the
 * replication transaction. Failures are logged but do not roll back the content
 * activation — the index can always be rebuilt via {@link IndexRebuildService}.</p>
 */
@Component
public class SearchIndexingListener {

    private static final Logger log = LoggerFactory.getLogger(SearchIndexingListener.class);

    @Autowired
    private SearchIndexService searchIndexService;

    /**
     * Index a content node when it is activated (published) or remove it when
     * it is deactivated or deleted.
     */
    @EventListener
    @Async
    public void onContentIndexEvent(ContentIndexEvent event) {
        try {
            if (event.getAction() == ContentIndexEvent.Action.INDEX && event.getNode() != null) {
                searchIndexService.index(event.getNode());
                log.debug("Indexed published content: {}", event.getPath());
            } else if (event.getAction() == ContentIndexEvent.Action.REMOVE) {
                searchIndexService.remove(event.getPath());
                log.debug("Removed de-published content from index: {}", event.getPath());
            }
        } catch (Exception e) {
            log.error("Search indexing failed for path '{}': {}", event.getPath(), e.getMessage(), e);
        }
    }
}
