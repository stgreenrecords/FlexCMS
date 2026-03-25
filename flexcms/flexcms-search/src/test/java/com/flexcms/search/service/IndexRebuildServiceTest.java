package com.flexcms.search.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for IndexRebuildService.
 */
@ExtendWith(MockitoExtension.class)
class IndexRebuildServiceTest {

    @Mock
    private SearchIndexService searchIndexService;

    @Mock
    private ContentNodeRepository contentNodeRepository;

    @InjectMocks
    private IndexRebuildService indexRebuildService;

    private List<ContentNode> sampleNodes;

    @BeforeEach
    void setUp() {
        sampleNodes = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            ContentNode node = new ContentNode("site.en.page" + i, "page" + i, "flexcms/page");
            node.setSiteId("site1");
            node.setStatus(NodeStatus.PUBLISHED);
            sampleNodes.add(node);
        }
    }

    @Test
    void rebuildSite_indexesAllPublishedNodes() {
        when(contentNodeRepository.findBySiteIdAndStatus("site1", NodeStatus.PUBLISHED))
                .thenReturn(sampleNodes);

        int count = indexRebuildService.rebuildSite("site1");

        assertThat(count).isEqualTo(5);
        verify(contentNodeRepository).findBySiteIdAndStatus("site1", NodeStatus.PUBLISHED);
        verify(searchIndexService, atLeastOnce()).indexAll(any());
    }

    @Test
    void rebuildSite_returnsZero_whenNoPublishedNodes() {
        when(contentNodeRepository.findBySiteIdAndStatus("empty-site", NodeStatus.PUBLISHED))
                .thenReturn(List.of());

        int count = indexRebuildService.rebuildSite("empty-site");

        assertThat(count).isEqualTo(0);
        verify(searchIndexService, never()).indexAll(any());
    }

    @Test
    void rebuildAll_indexesAllSites() {
        when(contentNodeRepository.findByStatus(NodeStatus.PUBLISHED)).thenReturn(sampleNodes);

        int count = indexRebuildService.rebuildAll();

        assertThat(count).isEqualTo(5);
        verify(contentNodeRepository).findByStatus(NodeStatus.PUBLISHED);
        verify(searchIndexService, atLeastOnce()).indexAll(any());
    }

    @Test
    void purgeAndRebuildSite_deletesThenReindexes() {
        when(contentNodeRepository.findBySiteIdAndStatus("site1", NodeStatus.PUBLISHED))
                .thenReturn(sampleNodes);

        int count = indexRebuildService.purgeAndRebuildSite("site1");

        assertThat(count).isEqualTo(5);
        verify(searchIndexService).removeBySite("site1");
        verify(searchIndexService, atLeastOnce()).indexAll(any());
    }

    @Test
    void rebuildSite_processesBatchesCorrectly() {
        // Create 1200 nodes — ensures multiple BATCH_SIZE (500) batches
        List<ContentNode> largeList = new ArrayList<>();
        for (int i = 0; i < 1200; i++) {
            largeList.add(new ContentNode("site.en.page" + i, "page" + i, "flexcms/page"));
        }
        when(contentNodeRepository.findBySiteIdAndStatus("big-site", NodeStatus.PUBLISHED))
                .thenReturn(largeList);

        int count = indexRebuildService.rebuildSite("big-site");

        assertThat(count).isEqualTo(1200);
        // 1200 / 500 = 3 batches (500 + 500 + 200)
        verify(searchIndexService, times(3)).indexAll(any());
    }
}
