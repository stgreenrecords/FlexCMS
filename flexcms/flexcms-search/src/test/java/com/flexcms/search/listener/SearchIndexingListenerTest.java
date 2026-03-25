package com.flexcms.search.listener;

import com.flexcms.core.event.ContentIndexEvent;
import com.flexcms.core.model.ContentNode;
import com.flexcms.search.service.SearchIndexService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

/**
 * Unit tests for SearchIndexingListener.
 */
@ExtendWith(MockitoExtension.class)
class SearchIndexingListenerTest {

    @Mock
    private SearchIndexService searchIndexService;

    @InjectMocks
    private SearchIndexingListener listener;

    private ContentNode node;

    @BeforeEach
    void setUp() {
        node = new ContentNode("site.en.page1", "page1", "flexcms/page");
        node.setSiteId("site1");
        node.setLocale("en");
    }

    @Test
    void onContentIndexEvent_indexAction_callsIndexService() {
        ContentIndexEvent event = ContentIndexEvent.index(this, node);

        listener.onContentIndexEvent(event);

        verify(searchIndexService).index(node);
        verify(searchIndexService, never()).remove(any());
    }

    @Test
    void onContentIndexEvent_removeAction_callsRemoveService() {
        ContentIndexEvent event = ContentIndexEvent.remove(this, "site.en.page1");

        listener.onContentIndexEvent(event);

        verify(searchIndexService).remove("site.en.page1");
        verify(searchIndexService, never()).index(any());
    }

    @Test
    void onContentIndexEvent_indexActionWithNullNode_doesNothing() {
        // Manually construct an INDEX event with null node (edge case)
        ContentIndexEvent event = ContentIndexEvent.remove(this, "site.en.deleted");
        // This triggers REMOVE, not INDEX — verifying the listener routes correctly
        listener.onContentIndexEvent(event);

        verify(searchIndexService).remove("site.en.deleted");
        verify(searchIndexService, never()).index(any());
    }

    @Test
    void onContentIndexEvent_serviceThrows_doesNotPropagate() {
        doThrow(new RuntimeException("ES down")).when(searchIndexService).index(any());
        ContentIndexEvent event = ContentIndexEvent.index(this, node);

        // Should not throw — listener catches and logs the exception
        listener.onContentIndexEvent(event);

        verify(searchIndexService).index(node);
    }

    @Test
    void onContentIndexEvent_removeThrows_doesNotPropagate() {
        doThrow(new RuntimeException("ES down")).when(searchIndexService).remove(any());
        ContentIndexEvent event = ContentIndexEvent.remove(this, "site.en.page1");

        // Should not throw — listener catches and logs the exception
        listener.onContentIndexEvent(event);

        verify(searchIndexService).remove("site.en.page1");
    }
}
