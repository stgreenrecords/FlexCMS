package com.flexcms.core.repository;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.AssetStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the native replication statements in {@link AssetRepository} and
 * {@link AssetRenditionRepository} against real PostgreSQL ({@code ON CONFLICT},
 * {@code CAST(... AS jsonb)}, and the site lookup cannot be validated with mocks).
 */
@DataJpaTest
@Testcontainers
@ActiveProfiles("integration")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AssetRepositoryIT {

    @Container
    static final PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("flexcms_test")
                    .withUsername("flexcms")
                    .withPassword("flexcms");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AssetRenditionRepository renditionRepository;

    @Autowired
    private EntityManager entityManager;

    private static final Instant CREATED = Instant.parse("2026-09-01T10:00:00Z");

    @BeforeEach
    void cleanUp() {
        renditionRepository.deleteAll();
        assetRepository.deleteAll();
        entityManager.flush();
    }

    private int upsert(UUID id, String path, String storageKey, String siteId, String metadataJson) {
        return assetRepository.upsertReplicated(id, path, "logo.png", "Logo", null, "image/png", 1234L,
                "logo.png", storageKey, "flexcms-assets", 640, 480, null, 1.333, null, null, null, null,
                metadataJson, siteId, "/content/dam/site", "alice", CREATED, "bob", CREATED.plusSeconds(60));
    }

    private Asset reload(UUID id) {
        entityManager.clear();
        return assetRepository.findById(id).orElseThrow();
    }

    @Test
    void upsertReplicated_insertsRowUnderTheCallersId_asActive() {
        UUID id = UUID.randomUUID();

        int rows = upsert(id, "/content/dam/site/logo.png", "originals/a/logo.png", null, "{\"alt\":\"Logo\"}");

        assertThat(rows).isEqualTo(1);
        Asset saved = reload(id);
        assertThat(saved.getPath()).isEqualTo("/content/dam/site/logo.png");
        assertThat(saved.getStatus()).isEqualTo(AssetStatus.ACTIVE);
        assertThat(saved.getStorageKey()).isEqualTo("originals/a/logo.png");
        assertThat(saved.getWidth()).isEqualTo(640);
        assertThat(saved.getMetadata()).containsEntry("alt", "Logo");
        assertThat(saved.getCreatedBy()).isEqualTo("alice");
    }

    @Test
    void upsertReplicated_updatesExistingRow_keepingOneRow() {
        UUID id = UUID.randomUUID();
        upsert(id, "/content/dam/site/logo.png", "originals/a/logo.png", null, "{}");

        upsert(id, "/content/dam/site/logo.png", "originals/b/logo.png", null, "{}");

        assertThat(assetRepository.count()).isEqualTo(1);
        assertThat(reload(id).getStorageKey()).isEqualTo("originals/b/logo.png");
    }

    @Test
    void upsertReplicated_unknownSite_storesNullSiteInsteadOfFailing() {
        UUID id = UUID.randomUUID();

        upsert(id, "/content/dam/site/logo.png", "originals/a/logo.png", "site-not-on-this-tier", "{}");

        assertThat(reload(id).getSiteId()).isNull();
    }

    @Test
    void deleteByPathAndIdNot_removesPredecessorAtSamePath_withItsRenditions() {
        UUID oldId = UUID.randomUUID();
        UUID newId = UUID.randomUUID();
        upsert(oldId, "/content/dam/site/logo.png", "originals/a/logo.png", null, "{}");
        renditionRepository.insertReplicated(UUID.randomUUID(), oldId, "thumbnail", "renditions/a/thumbnail.webp",
                "image/webp", 10L, 100, 75, "webp", CREATED);

        renditionRepository.deleteReplicatedByAssetPathAndIdNot("/content/dam/site/logo.png", newId);
        int removed = assetRepository.deleteByPathAndIdNot("/content/dam/site/logo.png", newId);
        upsert(newId, "/content/dam/site/logo.png", "originals/b/logo.png", null, "{}");

        assertThat(removed).isEqualTo(1);
        entityManager.clear();
        assertThat(assetRepository.findById(oldId)).isEmpty();
        assertThat(assetRepository.findById(newId)).isPresent();
        assertThat(renditionRepository.findByAssetId(oldId)).isEmpty();
    }

    @Test
    void deleteByPathAndIdNot_leavesTheSameIdAlone() {
        UUID id = UUID.randomUUID();
        upsert(id, "/content/dam/site/logo.png", "originals/a/logo.png", null, "{}");

        assertThat(assetRepository.deleteByPathAndIdNot("/content/dam/site/logo.png", id)).isZero();
    }

    @Test
    void renditions_replaceAndLookupByKey() {
        UUID id = UUID.randomUUID();
        upsert(id, "/content/dam/site/logo.png", "originals/a/logo.png", null, "{}");
        renditionRepository.insertReplicated(UUID.randomUUID(), id, "thumbnail", "renditions/x/thumbnail.webp",
                "image/webp", 10L, 100, 75, "webp", CREATED);
        renditionRepository.insertReplicated(UUID.randomUUID(), id, "web-small", "renditions/x/web-small.webp",
                "image/webp", 20L, 320, 240, "webp", CREATED);
        entityManager.clear();

        assertThat(renditionRepository.findByAssetId(id))
                .extracting(AssetRendition::getRenditionKey)
                .containsExactly("thumbnail", "web-small");
        assertThat(renditionRepository.findByAssetIdAndRenditionKey(id, "web-small"))
                .get().extracting(AssetRendition::getStorageKey).isEqualTo("renditions/x/web-small.webp");

        assertThat(renditionRepository.deleteReplicatedByAssetId(id)).isEqualTo(2);
        assertThat(renditionRepository.findByAssetId(id)).isEmpty();
    }

    @Test
    void deleteReplicated_removesRow() {
        UUID id = UUID.randomUUID();
        upsert(id, "/content/dam/site/logo.png", "originals/a/logo.png", null, "{}");

        assertThat(assetRepository.deleteReplicated(id)).isEqualTo(1);
        entityManager.clear();
        assertThat(assetRepository.findById(id)).isEmpty();
        assertThat(assetRepository.deleteReplicated(id)).isZero();
    }

    @Test
    void findAllById_returnsOnlyExisting() {
        UUID id = UUID.randomUUID();
        upsert(id, "/content/dam/site/logo.png", "originals/a/logo.png", null, "{}");

        assertThat(assetRepository.findAllById(List.of(id, UUID.randomUUID())))
                .extracting(Asset::getId).containsExactly(id);
    }
}
