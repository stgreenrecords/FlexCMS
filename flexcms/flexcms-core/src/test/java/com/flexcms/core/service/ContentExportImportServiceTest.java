package com.flexcms.core.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.zip.ZipInputStream;
import java.io.ByteArrayInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ContentExportService and ContentImportService.
 */
@ExtendWith(MockitoExtension.class)
class ContentExportImportServiceTest {

    @Mock
    private ContentNodeRepository nodeRepository;

    @InjectMocks
    private ContentExportService exportService;

    @InjectMocks
    private ContentImportService importService;

    private ContentNode rootNode;
    private ContentNode childNode;

    @BeforeEach
    void setUp() {
        rootNode = new ContentNode("content.corporate.en.about", "about", "flexcms/page");
        rootNode.setLocale("en");
        rootNode.setSiteId("corporate");
        rootNode.setStatus(NodeStatus.PUBLISHED);
        rootNode.setProperties(new HashMap<>());

        childNode = new ContentNode("content.corporate.en.about.team", "team", "flexcms/page");
        childNode.setLocale("en");
        childNode.setSiteId("corporate");
        childNode.setStatus(NodeStatus.PUBLISHED);
        childNode.setParentPath("content.corporate.en.about");
        childNode.setProperties(new HashMap<>());
    }

    // -------------------------------------------------------------------------
    // ContentExportService
    // -------------------------------------------------------------------------

    @Test
    void buildPackage_includesRootAndDescendants() {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of(childNode));

        ContentExportService.ExportPackage pkg = exportService.buildPackage("content.corporate.en.about");

        assertThat(pkg.rootPath()).isEqualTo("content.corporate.en.about");
        assertThat(pkg.nodes()).hasSize(2);
        assertThat(pkg.nodes()).contains(rootNode, childNode);
        assertThat(pkg.version()).isEqualTo("1.0");
        assertThat(pkg.exportedAt()).isNotNull();
    }

    @Test
    void buildPackage_noDescendants_returnsOnlyRoot() {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of());

        ContentExportService.ExportPackage pkg = exportService.buildPackage("content.corporate.en.about");

        assertThat(pkg.nodes()).hasSize(1);
    }

    @Test
    void exportJson_returnsValidJsonBytes() {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of(childNode));

        byte[] json = exportService.exportJson("content.corporate.en.about");

        assertThat(json).isNotEmpty();
        String jsonStr = new String(json);
        assertThat(jsonStr).contains("\"rootPath\"");
        assertThat(jsonStr).contains("content.corporate.en.about");
        assertThat(jsonStr).contains("\"version\"");
    }

    @Test
    void exportZip_returnsValidZipWithContentJson() throws Exception {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of());

        byte[] zip = exportService.exportZip("content.corporate.en.about");

        assertThat(zip).isNotEmpty();
        // Verify it's a valid ZIP with content.json entry
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zip))) {
            var entry = zis.getNextEntry();
            assertThat(entry).isNotNull();
            assertThat(entry.getName()).isEqualTo("content.json");
            byte[] content = zis.readAllBytes();
            assertThat(content).isNotEmpty();
        }
    }

    @Test
    void buildPackage_throwsNotFoundException_whenRootMissing() {
        when(nodeRepository.findByPath("content.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> exportService.buildPackage("content.missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("content.missing");
    }

    // -------------------------------------------------------------------------
    // ContentImportService — JSON
    // -------------------------------------------------------------------------

    @Test
    void importJson_createsNodes_whenNotExisting() throws Exception {
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));

        // Build a valid JSON package using the export service
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of(childNode));
        byte[] json = exportService.exportJson("content.corporate.en.about");

        // Reset mocks for import
        reset(nodeRepository);
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));

        ContentImportService.ImportResult result = importService.importJson(json, false);

        assertThat(result.created()).isEqualTo(2);
        assertThat(result.updated()).isEqualTo(0);
        assertThat(result.skipped()).isEqualTo(0);
        assertThat(result.errors()).isEmpty();
        verify(nodeRepository, times(2)).save(any(ContentNode.class));
    }

    @Test
    void importJson_skipsExistingNodes_whenOverwriteFalse() throws Exception {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of());
        byte[] json = exportService.exportJson("content.corporate.en.about");

        reset(nodeRepository);
        when(nodeRepository.existsByPath("content.corporate.en.about")).thenReturn(true);

        ContentImportService.ImportResult result = importService.importJson(json, false);

        assertThat(result.skipped()).isEqualTo(1);
        assertThat(result.created()).isEqualTo(0);
        verify(nodeRepository, never()).save(any());
    }

    @Test
    void importJson_overwritesExistingNodes_whenOverwriteTrue() throws Exception {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of());
        byte[] json = exportService.exportJson("content.corporate.en.about");

        reset(nodeRepository);
        when(nodeRepository.existsByPath("content.corporate.en.about")).thenReturn(true);
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));

        ContentImportService.ImportResult result = importService.importJson(json, true);

        assertThat(result.updated()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(0);
        verify(nodeRepository).save(any(ContentNode.class));
    }

    @Test
    void importJson_invalidJson_returnsFailureResult() {
        ContentImportService.ImportResult result = importService.importJson("not-valid-json".getBytes(), false);

        assertThat(result.hasErrors()).isTrue();
        assertThat(result.errors().get(0)).contains("Failed to parse JSON");
    }

    @Test
    void importJson_emptyNodeList_returnsZeroCounts() throws Exception {
        // Build a package with no nodes (empty list won't actually be zero but simulated)
        ContentImportService.ImportResult result = importService.importJson(
                "{\"version\":\"1.0\",\"exportedAt\":\"2024-01-01T00:00:00Z\",\"rootPath\":\"content.x\",\"nodes\":[]}"
                        .getBytes(), false);

        assertThat(result.created()).isEqualTo(0);
        assertThat(result.errors()).isEmpty();
    }

    // -------------------------------------------------------------------------
    // ContentImportService — ZIP
    // -------------------------------------------------------------------------

    @Test
    void importZip_importsFromZipArchive() throws Exception {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(rootNode));
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of());
        byte[] zip = exportService.exportZip("content.corporate.en.about");

        reset(nodeRepository);
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));

        ContentImportService.ImportResult result = importService.importZip(zip, false);

        assertThat(result.created()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();
    }

    @Test
    void importZip_invalidZip_returnsFailureResult() {
        ContentImportService.ImportResult result = importService.importZip("not-a-zip".getBytes(), false);

        assertThat(result.hasErrors()).isTrue();
    }

    // -------------------------------------------------------------------------
    // ImportResult helpers
    // -------------------------------------------------------------------------

    @Test
    void importResult_total_sumAllCounts() {
        var result = new ContentImportService.ImportResult(3, 2, 1, List.of("error"));
        assertThat(result.total()).isEqualTo(7);
    }

    @Test
    void importResult_hasErrors_trueWhenErrorsPresent() {
        var result = new ContentImportService.ImportResult(0, 0, 0, List.of("error1"));
        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    void importResult_hasErrors_falseWhenNoErrors() {
        var result = new ContentImportService.ImportResult(1, 0, 0, List.of());
        assertThat(result.hasErrors()).isFalse();
    }
}
