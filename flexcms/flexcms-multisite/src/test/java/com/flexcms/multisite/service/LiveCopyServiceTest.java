package com.flexcms.multisite.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.LiveCopyRelationship;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.LiveCopyRelationshipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LiveCopyService.
 */
@ExtendWith(MockitoExtension.class)
class LiveCopyServiceTest {

    @Mock
    private ContentNodeRepository nodeRepository;

    @Mock
    private LiveCopyRelationshipRepository liveCopyRepo;

    @InjectMocks
    private LiveCopyService liveCopyService;

    private ContentNode sourceRoot;
    private ContentNode targetParent;

    @BeforeEach
    void setUp() {
        sourceRoot = node("content.corporate.en.about", "about", "flexcms/page",
                Map.of("jcr:title", "About Us", "template", "basic"));
        sourceRoot.setSiteId("corporate");
        sourceRoot.setLocale("en");
        sourceRoot.setStatus(NodeStatus.PUBLISHED);

        targetParent = node("content.regional.en", "en", "flexcms/page", Map.of());
        targetParent.setSiteId("regional");
        targetParent.setLocale("en");
    }

    // -------------------------------------------------------------------------
    // createLiveCopy
    // -------------------------------------------------------------------------

    @Test
    void createLiveCopy_createsRootCopyAndRelationship() {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.existsByPath("content.regional.en")).thenReturn(true);
        when(nodeRepository.existsByPath("content.regional.en.about")).thenReturn(false);
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of());
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));
        when(liveCopyRepo.save(any(LiveCopyRelationship.class))).thenAnswer(inv -> inv.getArgument(0));

        ContentNode copy = liveCopyService.createLiveCopy(
                "content.corporate.en.about",
                "content.regional.en",
                "about",
                true, null, "admin");

        assertThat(copy.getPath()).isEqualTo("content.regional.en.about");
        assertThat(copy.getResourceType()).isEqualTo("flexcms/page");
        assertThat(copy.getProperties()).containsEntry("jcr:title", "About Us");

        // Verify relationship recorded
        var relCaptor = ArgumentCaptor.forClass(LiveCopyRelationship.class);
        verify(liveCopyRepo).save(relCaptor.capture());
        assertThat(relCaptor.getValue().getSourcePath()).isEqualTo("content.corporate.en.about");
        assertThat(relCaptor.getValue().getTargetPath()).isEqualTo("content.regional.en.about");
        assertThat(relCaptor.getValue().isDeep()).isTrue();
    }

    @Test
    void createLiveCopy_withDescendants_copiesEntireSubtree() {
        ContentNode child = node("content.corporate.en.about.team", "team", "flexcms/page", Map.of());
        child.setSiteId("corporate");
        child.setLocale("en");

        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.existsByPath("content.regional.en")).thenReturn(true);
        when(nodeRepository.existsByPath("content.regional.en.about")).thenReturn(false);
        when(nodeRepository.findDescendants("content.corporate.en.about")).thenReturn(List.of(child));
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));
        when(liveCopyRepo.save(any(LiveCopyRelationship.class))).thenAnswer(inv -> inv.getArgument(0));

        liveCopyService.createLiveCopy("content.corporate.en.about", "content.regional.en",
                "about", true, null, "admin");

        // 2 saves: root + 1 descendant
        verify(nodeRepository, times(2)).save(any(ContentNode.class));
        // 2 relationship records
        verify(liveCopyRepo, times(2)).save(any(LiveCopyRelationship.class));
    }

    @Test
    void createLiveCopy_shallowCopy_doesNotCopyDescendants() {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.existsByPath("content.regional.en")).thenReturn(true);
        when(nodeRepository.existsByPath("content.regional.en.about")).thenReturn(false);
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));
        when(liveCopyRepo.save(any(LiveCopyRelationship.class))).thenAnswer(inv -> inv.getArgument(0));

        liveCopyService.createLiveCopy("content.corporate.en.about", "content.regional.en",
                "about", false, null, "admin");

        // Only root copied — findDescendants NOT called
        verify(nodeRepository, never()).findDescendants(any());
        verify(nodeRepository, times(1)).save(any(ContentNode.class));
    }

    @Test
    void createLiveCopy_throwsWhenSourceNotFound() {
        when(nodeRepository.findByPath("content.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> liveCopyService.createLiveCopy(
                "content.missing", "content.regional.en", "about", true, null, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Source not found");
    }

    @Test
    void createLiveCopy_throwsWhenTargetParentNotFound() {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.existsByPath("content.nonexistent")).thenReturn(false);

        assertThatThrownBy(() -> liveCopyService.createLiveCopy(
                "content.corporate.en.about", "content.nonexistent", "about", true, null, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Target parent not found");
    }

    @Test
    void createLiveCopy_throwsWhenTargetAlreadyExists() {
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.existsByPath("content.regional.en")).thenReturn(true);
        when(nodeRepository.existsByPath("content.regional.en.about")).thenReturn(true);

        assertThatThrownBy(() -> liveCopyService.createLiveCopy(
                "content.corporate.en.about", "content.regional.en", "about", true, null, "admin"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Target path already exists");
    }

    // -------------------------------------------------------------------------
    // rollout
    // -------------------------------------------------------------------------

    @Test
    void rollout_mergesSourcePropertiesIntoTarget() {
        LiveCopyRelationship rel = new LiveCopyRelationship(
                "content.corporate.en.about", "content.regional.en.about", true, "admin");

        ContentNode target = node("content.regional.en.about", "about", "flexcms/page",
                new HashMap<>(Map.of("jcr:title", "Local Title", "local-prop", "keep")));

        when(liveCopyRepo.findBySourcePathOrPrefix(
                eq("content.corporate.en.about"), anyString())).thenReturn(List.of(rel));
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.findByPath("content.regional.en.about")).thenReturn(Optional.of(target));
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));

        LiveCopyService.RolloutResult result = liveCopyService.rollout("content.corporate.en.about", "admin");

        assertThat(result.updatedNodes()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();
        // Blueprint properties are merged — local-prop preserved, blueprint props overwritten
        assertThat(target.getProperties()).containsEntry("jcr:title", "About Us");
        assertThat(target.getProperties()).containsEntry("local-prop", "keep");
        assertThat(target.getProperties()).containsEntry("template", "basic");
    }

    @Test
    void rollout_respectsExcludedProps() {
        LiveCopyRelationship rel = new LiveCopyRelationship(
                "content.corporate.en.about", "content.regional.en.about", true, "admin");
        rel.setExcludedProps("jcr:title"); // title excluded → stays local

        ContentNode target = node("content.regional.en.about", "about", "flexcms/page",
                new HashMap<>(Map.of("jcr:title", "Local Title")));

        when(liveCopyRepo.findBySourcePathOrPrefix(
                eq("content.corporate.en.about"), anyString())).thenReturn(List.of(rel));
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.findByPath("content.regional.en.about")).thenReturn(Optional.of(target));
        when(nodeRepository.save(any(ContentNode.class))).thenAnswer(inv -> inv.getArgument(0));

        liveCopyService.rollout("content.corporate.en.about", "admin");

        // jcr:title excluded → local value preserved
        assertThat(target.getProperties().get("jcr:title")).isEqualTo("Local Title");
        // non-excluded properties still merged
        assertThat(target.getProperties()).containsEntry("template", "basic");
    }

    @Test
    void rollout_noRelationships_returnsZeroUpdated() {
        when(liveCopyRepo.findBySourcePathOrPrefix(anyString(), anyString())).thenReturn(List.of());

        LiveCopyService.RolloutResult result = liveCopyService.rollout("content.corporate.en.about", "admin");

        assertThat(result.updatedNodes()).isEqualTo(0);
        assertThat(result.errors()).isEmpty();
    }

    @Test
    void rollout_recordsErrorWhenTargetMissing() {
        LiveCopyRelationship rel = new LiveCopyRelationship(
                "content.corporate.en.about", "content.regional.en.about", true, "admin");

        when(liveCopyRepo.findBySourcePathOrPrefix(anyString(), anyString())).thenReturn(List.of(rel));
        when(nodeRepository.findByPath("content.corporate.en.about")).thenReturn(Optional.of(sourceRoot));
        when(nodeRepository.findByPath("content.regional.en.about")).thenReturn(Optional.empty());

        LiveCopyService.RolloutResult result = liveCopyService.rollout("content.corporate.en.about", "admin");

        assertThat(result.updatedNodes()).isEqualTo(0);
        assertThat(result.hasErrors()).isTrue();
        assertThat(result.errors().get(0)).contains("Target not found");
    }

    // -------------------------------------------------------------------------
    // detach
    // -------------------------------------------------------------------------

    @Test
    void detach_deep_deletesSubtreeRelationships() {
        liveCopyService.detach("content.regional.en.about", true);

        verify(liveCopyRepo).deleteByTargetPathOrPrefix(
                eq("content.regional.en.about"), eq("content.regional.en.about.%"));
    }

    @Test
    void detach_shallow_deletesSingleRelationship() {
        liveCopyService.detach("content.regional.en.about", false);

        verify(liveCopyRepo).deleteByTargetPath("content.regional.en.about");
        verify(liveCopyRepo, never()).deleteByTargetPathOrPrefix(any(), any());
    }

    // -------------------------------------------------------------------------
    // Query methods
    // -------------------------------------------------------------------------

    @Test
    void findLiveCopies_returnsAllCopiesForSource() {
        LiveCopyRelationship rel1 = new LiveCopyRelationship(
                "content.corporate.en.about", "content.regional1.en.about", true, "admin");
        LiveCopyRelationship rel2 = new LiveCopyRelationship(
                "content.corporate.en.about", "content.regional2.en.about", true, "admin");

        when(liveCopyRepo.findBySourcePath("content.corporate.en.about")).thenReturn(List.of(rel1, rel2));

        List<LiveCopyRelationship> copies = liveCopyService.findLiveCopies("content.corporate.en.about");

        assertThat(copies).hasSize(2);
    }

    @Test
    void isLiveCopy_returnsTrueWhenRelationshipExists() {
        when(liveCopyRepo.existsByTargetPath("content.regional.en.about")).thenReturn(true);

        assertThat(liveCopyService.isLiveCopy("content.regional.en.about")).isTrue();
    }

    @Test
    void isLiveCopy_returnsFalseWhenNoRelationship() {
        when(liveCopyRepo.existsByTargetPath("content.corporate.en.about")).thenReturn(false);

        assertThat(liveCopyService.isLiveCopy("content.corporate.en.about")).isFalse();
    }

    @Test
    void getRelationship_returnsRelationshipForTarget() {
        LiveCopyRelationship rel = new LiveCopyRelationship(
                "content.corporate.en.about", "content.regional.en.about", true, "admin");
        when(liveCopyRepo.findByTargetPath("content.regional.en.about")).thenReturn(Optional.of(rel));

        Optional<LiveCopyRelationship> found = liveCopyService.getRelationship("content.regional.en.about");

        assertThat(found).isPresent();
        assertThat(found.get().getSourcePath()).isEqualTo("content.corporate.en.about");
    }

    // -------------------------------------------------------------------------
    // LiveCopyRelationship helper
    // -------------------------------------------------------------------------

    @Test
    void relationship_getExcludedPropsList_parsesCommaSeparated() {
        LiveCopyRelationship rel = new LiveCopyRelationship("s", "t", true, "admin");
        rel.setExcludedProps("jcr:title, template , nav-hidden");

        assertThat(rel.getExcludedPropsList()).containsExactly("jcr:title", "template", "nav-hidden");
    }

    @Test
    void relationship_getExcludedPropsList_emptyWhenNull() {
        LiveCopyRelationship rel = new LiveCopyRelationship("s", "t", true, "admin");

        assertThat(rel.getExcludedPropsList()).isEmpty();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ContentNode node(String path, String name, String resourceType, Map<String, Object> props) {
        ContentNode n = new ContentNode();
        n.setPath(path);
        n.setName(name);
        n.setResourceType(resourceType);
        n.setProperties(new HashMap<>(props));
        n.setStatus(NodeStatus.DRAFT);
        return n;
    }
}
