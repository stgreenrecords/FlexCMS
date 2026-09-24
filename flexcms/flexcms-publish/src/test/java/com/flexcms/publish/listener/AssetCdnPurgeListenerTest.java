package com.flexcms.publish.listener;

import com.flexcms.cdn.service.CdnPurgeService;
import com.flexcms.core.event.AssetPublicationChangedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AssetCdnPurgeListenerTest {

    @Mock
    private CdnPurgeService cdnPurgeService;

    @InjectMocks
    private AssetCdnPurgeListener listener;

    @Test
    void replacedAsset_purgesOriginalAndEveryRenditionUrl() {
        // ECMS-03-TC04: a replaced asset must not stay stale at the edge for a day.
        UUID id = UUID.randomUUID();

        listener.onAssetPublicationChanged(new AssetPublicationChangedEvent(this, id, "/content/dam/logo.png", true));

        verify(cdnPurgeService).purgePaths(List.of("/dam/renditions/" + id, "/dam/renditions/" + id + "/*"));
    }

    @Test
    void withdrawnAsset_isPurgedToo() {
        UUID id = UUID.randomUUID();

        listener.onAssetPublicationChanged(new AssetPublicationChangedEvent(this, id, "/content/dam/logo.png", false));

        verify(cdnPurgeService).purgePaths(List.of("/dam/renditions/" + id, "/dam/renditions/" + id + "/*"));
    }
}
