package com.flexcms.author.service;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.service.ContentNodeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExperienceFragmentServiceTest {

    @Mock private ContentNodeRepository nodeRepository;
    @Mock private ContentNodeService nodeService;
    @Mock private JdbcTemplate jdbc;

    @InjectMocks
    private ExperienceFragmentService xfService;

    // ── Helpers ────────────────────────────────────────────────────────────────

    private ContentNode xfFolder(String path) {
        ContentNode n = new ContentNode(path, path.substring(path.lastIndexOf('.') + 1), "flexcms/xf-folder");
        n.setSiteId("wknd");
        n.setLocale("en");
        return n;
    }

    private ContentNode xfPage(String path) {
        ContentNode n = new ContentNode(path, path.substring(path.lastIndexOf('.') + 1), "flexcms/xf-page");
        n.setSiteId("wknd");
        n.setLocale("en");
        return n;
    }

    // ── createExperienceFragment ────────────────────────────────────────────

    @Test
    void createExperienceFragment_savesXfFolderAndMetadata() {
        // The path would be experience-fragments.wknd.en.site.header
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode result = xfService.createExperienceFragment(
                "wknd", "en", "site", "header", "Site Header", "Global header", "admin");

        assertThat(result.getResourceType()).isEqualTo("flexcms/xf-folder");
        assertThat(result.getSiteId()).isEqualTo("wknd");
        assertThat(result.getLocale()).isEqualTo("en");
        verify(nodeRepository, atLeastOnce()).save(any(ContentNode.class));
    }

    @Test
    void createExperienceFragment_throwsConflictWhenPathAlreadyExists() {
        when(nodeRepository.existsByPath(contains("header"))).thenReturn(true);

        assertThatThrownBy(() ->
                xfService.createExperienceFragment("wknd", "en", "site", "header",
                        "Site Header", "Global header", "admin"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void createExperienceFragment_noCategoryProducesShortPath() {
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode result = xfService.createExperienceFragment(
                "wknd", "en", null, "footer", "Footer", null, "admin");

        // path should not contain a category segment
        assertThat(result.getPath()).doesNotContain("null");
    }

    // ── addVariation ────────────────────────────────────────────────────────

    @Test
    void addVariation_createsXfPageUnderFolder() {
        String xfPath = "experience-fragments.wknd.en.site.header";
        ContentNode folder = xfFolder(xfPath);
        when(nodeRepository.findByPath(xfPath)).thenReturn(Optional.of(folder));
        when(nodeRepository.existsByPath(xfPath + ".master")).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode variation = xfService.addVariation(xfPath, "master", "Master Variation", "admin");

        assertThat(variation.getResourceType()).isEqualTo("flexcms/xf-page");
        assertThat(variation.getPath()).isEqualTo(xfPath + ".master");
    }

    @Test
    void addVariation_throwsConflictWhenVariationAlreadyExists() {
        String xfPath = "experience-fragments.wknd.en.site.header";
        when(nodeRepository.findByPath(xfPath)).thenReturn(Optional.of(xfFolder(xfPath)));
        when(nodeRepository.existsByPath(xfPath + ".master")).thenReturn(true);

        assertThatThrownBy(() -> xfService.addVariation(xfPath, "master", "Master", "admin"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void addVariation_throwsNotFoundForMissingXfFolder() {
        when(nodeRepository.findByPath(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                xfService.addVariation("experience-fragments.wknd.en.site.missing",
                        "master", "Master", "admin"))
                .isInstanceOf(NotFoundException.class);
    }

    // ── read operations ────────────────────────────────────────────────────

    @Test
    void listExperienceFragments_returnsRowsFromJdbc() {
        List<Map<String, Object>> rows = List.of(
                Map.of("xf_path", "experience-fragments.wknd.en.site.header", "title", "Header"),
                Map.of("xf_path", "experience-fragments.wknd.en.site.footer", "title", "Footer")
        );
        when(jdbc.queryForList(anyString(), eq("wknd"), eq("en"))).thenReturn(rows);

        List<Map<String, Object>> result = xfService.listExperienceFragments("wknd", "en");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).get("title")).isEqualTo("Header");
    }

    @Test
    void getExperienceFragment_returnsNodeWhenResourceTypeMatches() {
        String path = "experience-fragments.wknd.en.site.header";
        when(nodeRepository.findByPath(path)).thenReturn(Optional.of(xfFolder(path)));

        Optional<ContentNode> result = xfService.getExperienceFragment(path);

        assertThat(result).isPresent();
        assertThat(result.get().getResourceType()).isEqualTo("flexcms/xf-folder");
    }

    @Test
    void getExperienceFragment_returnsEmptyForWrongResourceType() {
        String path = "experience-fragments.wknd.en.site.header";
        ContentNode notAFolder = new ContentNode(path, "header", "flexcms/page");
        when(nodeRepository.findByPath(path)).thenReturn(Optional.of(notAFolder));

        Optional<ContentNode> result = xfService.getExperienceFragment(path);

        assertThat(result).isEmpty();
    }

    @Test
    void listVariations_returnsOnlyXfPageChildren() {
        String xfPath = "experience-fragments.wknd.en.site.header";
        ContentNode masterPage = xfPage(xfPath + ".master");
        ContentNode mobilePage = xfPage(xfPath + ".mobile");
        ContentNode container  = new ContentNode(xfPath + ".meta", "meta", "flexcms/container");

        when(nodeService.getChildren(xfPath))
                .thenReturn(List.of(masterPage, mobilePage, container));

        List<ContentNode> variations = xfService.listVariations(xfPath);

        assertThat(variations).hasSize(2)
                .extracting(ContentNode::getResourceType)
                .containsOnly("flexcms/xf-page");
    }

    @Test
    void getVariation_returnsVariationByType() {
        String xfPath = "experience-fragments.wknd.en.site.header";
        ContentNode master = xfPage(xfPath + ".master");
        when(nodeRepository.findByPath(xfPath + ".master")).thenReturn(Optional.of(master));

        Optional<ContentNode> result = xfService.getVariation(xfPath, "master");

        assertThat(result).isPresent();
    }

    @Test
    void getDefaultVariation_prefersMasterVariation() {
        String xfPath = "experience-fragments.wknd.en.site.header";
        ContentNode master = xfPage(xfPath + ".master");
        when(nodeRepository.findByPath(xfPath + ".master")).thenReturn(Optional.of(master));

        Optional<ContentNode> result = xfService.getDefaultVariation(xfPath);

        assertThat(result).isPresent();
        assertThat(result.get().getPath()).contains("master");
    }

    @Test
    void getDefaultVariation_fallsBackToFirstVariationIfNoMaster() {
        String xfPath = "experience-fragments.wknd.en.site.header";
        ContentNode email = xfPage(xfPath + ".email");
        when(nodeRepository.findByPath(xfPath + ".master")).thenReturn(Optional.empty());
        when(nodeService.getChildren(xfPath)).thenReturn(List.of(email));

        Optional<ContentNode> result = xfService.getDefaultVariation(xfPath);

        assertThat(result).isPresent();
        assertThat(result.get().getPath()).contains("email");
    }

    // ── resolveReference ───────────────────────────────────────────────────

    @Test
    void resolveReference_returnsVariationWithChildren() {
        String varPath = "experience-fragments.wknd.en.site.header.master";
        ContentNode loaded = xfPage(varPath);
        when(nodeService.getWithChildren(varPath)).thenReturn(Optional.of(loaded));

        Optional<ContentNode> result = xfService.resolveReference(varPath);

        assertThat(result).isPresent();
    }

    @Test
    void resolveReference_returnsEmptyForNonXfPage() {
        String path = "experience-fragments.wknd.en.site.header.master";
        ContentNode wrongType = new ContentNode(path, "master", "flexcms/page");
        when(nodeService.getWithChildren(path)).thenReturn(Optional.of(wrongType));

        Optional<ContentNode> result = xfService.resolveReference(path);

        assertThat(result).isEmpty();
    }

    // ── delete operations ──────────────────────────────────────────────────

    @Test
    void deleteExperienceFragment_deletesSubtreeAndMetadata() {
        String path = "experience-fragments.wknd.en.site.header";
        when(nodeRepository.findByPath(path)).thenReturn(Optional.of(xfFolder(path)));

        xfService.deleteExperienceFragment(path, "admin");

        verify(nodeRepository).deleteSubtree(path);
        verify(jdbc).update(contains("DELETE FROM experience_fragment_metadata"), eq(path));
    }

    @Test
    void deleteExperienceFragment_throwsNotFoundForMissingPath() {
        when(nodeRepository.findByPath(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                xfService.deleteExperienceFragment("experience-fragments.wknd.en.site.missing", "admin"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void deleteVariation_deletesSubtreeAndUpdatesTimestamp() {
        String xfPath = "experience-fragments.wknd.en.site.header";
        String varPath = xfPath + ".mobile";
        when(nodeRepository.findByPath(varPath)).thenReturn(Optional.of(xfPage(varPath)));

        xfService.deleteVariation(xfPath, "mobile", "admin");

        verify(nodeRepository).deleteSubtree(varPath);
        verify(jdbc).update(contains("UPDATE experience_fragment_metadata"), any(), eq(xfPath));
    }
}
