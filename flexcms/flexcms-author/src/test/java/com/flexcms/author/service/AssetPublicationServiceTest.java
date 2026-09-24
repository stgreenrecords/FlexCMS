package com.flexcms.author.service;

import com.flexcms.author.service.AssetPublicationService.AssetPublicationResult;
import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.service.AuditService;
import com.flexcms.dam.service.AssetIngestService;
import com.flexcms.replication.model.ReplicationEvent.ReplicationAction;
import com.flexcms.replication.service.ReplicationAgent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetPublicationServiceTest {

    @Mock private AssetIngestService assetService;
    @Mock private ReplicationAgent replicationAgent;
    @Mock private AuditService auditService;

    @InjectMocks
    private AssetPublicationService service;

    private final UUID id = UUID.randomUUID();
    private final UUID eventId = UUID.randomUUID();

    private Asset asset(AssetStatus status) {
        Asset a = new Asset();
        a.setId(id);
        a.setPath("/content/dam/tut-usa/logo.png");
        a.setStatus(status);
        return a;
    }

    @Test
    void publish_replicatesActivation_auditsAndReturnsCanonicalUrl() {
        when(assetService.getAssetById(id)).thenReturn(Optional.of(asset(AssetStatus.ACTIVE)));
        when(replicationAgent.replicateAsset(id, ReplicationAction.ACTIVATE, "admin")).thenReturn(eventId);

        AssetPublicationResult result = service.publish(id, "admin");

        assertThat(result.assetId()).isEqualTo(id);
        assertThat(result.action()).isEqualTo("ACTIVATE");
        assertThat(result.replicationEventId()).isEqualTo(eventId);
        assertThat(result.url()).isEqualTo("/dam/renditions/" + id);
        verify(auditService).log(AuditService.ENTITY_ASSET, id, "/content/dam/tut-usa/logo.png",
                AuditService.ACTION_PUBLISH, "admin");
    }

    @Test
    void publish_assetStillProcessing_isConflict_andNothingIsSent() {
        when(assetService.getAssetById(id)).thenReturn(Optional.of(asset(AssetStatus.PROCESSING)));

        assertThatThrownBy(() -> service.publish(id, "admin")).isInstanceOf(ConflictException.class);
        verifyNoInteractions(replicationAgent, auditService);
    }

    @Test
    void publish_unknownAsset_isNotFound() {
        when(assetService.getAssetById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publish(id, "admin")).isInstanceOf(NotFoundException.class);
        verifyNoInteractions(replicationAgent);
    }

    @Test
    void unpublish_replicatesDeactivation_andAudits() {
        when(assetService.getAssetById(id)).thenReturn(Optional.of(asset(AssetStatus.ACTIVE)));
        when(replicationAgent.replicateAsset(id, ReplicationAction.DEACTIVATE, "admin")).thenReturn(eventId);

        AssetPublicationResult result = service.unpublish(id, "admin");

        assertThat(result.action()).isEqualTo("DEACTIVATE");
        verify(auditService).log(AuditService.ENTITY_ASSET, id, "/content/dam/tut-usa/logo.png",
                AuditService.ACTION_UNPUBLISH, "admin");
    }

    @Test
    void unpublish_unknownAsset_isNotFound() {
        when(assetService.getAssetById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.unpublish(id, "admin")).isInstanceOf(NotFoundException.class);
    }
}
