package com.flexcms.replication.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.pim.event.ProductPublishedMessage;
import com.flexcms.replication.model.ReplicationEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProductPublishListener.
 */
@ExtendWith(MockitoExtension.class)
class ProductPublishListenerTest {

    @Mock
    private ContentNodeRepository contentNodeRepository;

    @Mock
    private ReplicationAgent replicationAgent;

    @InjectMocks
    private ProductPublishListener listener;

    private ContentNode pageNode;

    @BeforeEach
    void setUp() {
        pageNode = new ContentNode("content.corporate.en.products.widget", "widget", "flexcms/product-page");
        pageNode.setId(UUID.randomUUID());
        pageNode.getProperties().put("productSku", "WIDGET-2024");
    }

    @Test
    void onProductPublished_triggersReplicationForMatchingPages() {
        when(contentNodeRepository.findByProductSku("WIDGET-2024"))
                .thenReturn(List.of(pageNode));
        when(replicationAgent.replicate(any(), any(), any()))
                .thenReturn(UUID.randomUUID());

        ProductPublishedMessage msg = new ProductPublishedMessage("WIDGET-2024", UUID.randomUUID(), "pim-editor");

        listener.onProductPublished(msg);

        verify(contentNodeRepository).findByProductSku("WIDGET-2024");
        verify(replicationAgent).replicate(
                eq("content.corporate.en.products.widget"),
                eq(ReplicationEvent.ReplicationAction.ACTIVATE),
                eq("pim-editor"));
    }

    @Test
    void onProductPublished_noMatchingPages_doesNotReplicate() {
        when(contentNodeRepository.findByProductSku("UNKNOWN-SKU"))
                .thenReturn(List.of());

        ProductPublishedMessage msg = new ProductPublishedMessage("UNKNOWN-SKU", null, "user1");

        listener.onProductPublished(msg);

        verify(replicationAgent, never()).replicate(any(), any(), any());
    }

    @Test
    void onProductPublished_multiplePages_replicatesAll() {
        ContentNode page1 = new ContentNode("site.en.products.p1", "p1", "flexcms/page");
        ContentNode page2 = new ContentNode("site.en.products.p2", "p2", "flexcms/page");
        when(contentNodeRepository.findByProductSku("MULTI-SKU"))
                .thenReturn(List.of(page1, page2));
        when(replicationAgent.replicate(any(), any(), any()))
                .thenReturn(UUID.randomUUID());

        listener.onProductPublished(new ProductPublishedMessage("MULTI-SKU", null, "user1"));

        verify(replicationAgent, times(2)).replicate(any(), any(), any());
    }

    @Test
    void onProductPublished_replicationFailure_continuesForRemainingPages() {
        ContentNode page1 = new ContentNode("site.en.p1", "p1", "flexcms/page");
        ContentNode page2 = new ContentNode("site.en.p2", "p2", "flexcms/page");
        when(contentNodeRepository.findByProductSku("FAIL-SKU"))
                .thenReturn(List.of(page1, page2));
        when(replicationAgent.replicate(eq("site.en.p1"), any(), any()))
                .thenThrow(new RuntimeException("Replication error"));
        when(replicationAgent.replicate(eq("site.en.p2"), any(), any()))
                .thenReturn(UUID.randomUUID());

        // Should not throw — errors are caught and logged
        listener.onProductPublished(new ProductPublishedMessage("FAIL-SKU", null, "user1"));

        // Both pages were attempted
        verify(replicationAgent, times(2)).replicate(any(), any(), any());
    }

    @Test
    void onProductPublished_nullPublishedBy_usesDefaultInitiator() {
        when(contentNodeRepository.findByProductSku("SKU-1"))
                .thenReturn(List.of(pageNode));
        when(replicationAgent.replicate(any(), any(), any()))
                .thenReturn(UUID.randomUUID());

        // publishedBy is null — should use "pim-system" fallback
        ProductPublishedMessage msg = new ProductPublishedMessage("SKU-1", null, null);

        listener.onProductPublished(msg);

        verify(replicationAgent).replicate(
                any(),
                eq(ReplicationEvent.ReplicationAction.ACTIVATE),
                eq("pim-system"));
    }
}
