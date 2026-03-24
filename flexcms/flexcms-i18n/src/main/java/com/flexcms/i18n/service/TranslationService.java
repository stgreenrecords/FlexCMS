package com.flexcms.i18n.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.i18n.model.LanguageCopy;
import com.flexcms.i18n.repository.LanguageCopyRepository;
import com.flexcms.plugin.spi.TranslationConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Manages language copies and translation workflows.
 */
@Service
public class TranslationService {

    private static final Logger log = LoggerFactory.getLogger(TranslationService.class);

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private LanguageCopyRepository languageCopyRepo;

    @Autowired(required = false)
    private List<TranslationConnector> translationConnectors = new ArrayList<>();

    /**
     * Create language copies for a page and all its components.
     */
    @Transactional
    public LanguageCopyResult createLanguageCopy(String sourcePath, String sourceLocale,
                                                  String targetLocale) {
        ContentNode sourceNode = nodeRepository.findByPath(sourcePath)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourcePath));

        String targetPath = sourcePath.replace("." + sourceLocale + ".", "." + targetLocale + ".");

        // Deep copy the node and all descendants
        List<ContentNode> sourceTree = nodeRepository.findDescendants(sourcePath);
        sourceTree.add(0, sourceNode);

        List<ContentNode> targetTree = new ArrayList<>();
        for (ContentNode source : sourceTree) {
            ContentNode copy = source.deepCopy();
            copy.setPath(source.getPath().replace("." + sourceLocale + ".", "." + targetLocale + "."));
            copy.setParentPath(source.getParentPath() != null
                    ? source.getParentPath().replace("." + sourceLocale + ".", "." + targetLocale + ".")
                    : null);
            copy.setLocale(targetLocale);
            copy.setStatus(NodeStatus.DRAFT);
            targetTree.add(copy);
        }

        nodeRepository.saveAll(targetTree);

        // Record language copy relationship
        LanguageCopy lc = new LanguageCopy();
        lc.setSourcePath(sourcePath);
        lc.setTargetPath(targetPath);
        lc.setSourceLocale(sourceLocale);
        lc.setTargetLocale(targetLocale);
        lc.setSyncStatus(LanguageCopy.SyncStatus.IN_SYNC);
        lc.setLastSyncedAt(Instant.now());
        languageCopyRepo.save(lc);

        return new LanguageCopyResult(targetPath, targetTree.size(), true, null);
    }

    /**
     * Auto-translate using a registered translation connector.
     */
    @Transactional
    public LanguageCopyResult machineTranslate(String sourcePath, String sourceLocale,
                                                String targetLocale, String providerId) {
        // First create the language copy
        LanguageCopyResult copyResult = createLanguageCopy(sourcePath, sourceLocale, targetLocale);
        if (!copyResult.success()) return copyResult;

        TranslationConnector connector = translationConnectors.stream()
                .filter(c -> c.getProviderId().equals(providerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Translation provider not found: " + providerId));

        // Collect translatable text from target nodes
        String targetPath = copyResult.targetPath();
        List<ContentNode> targetNodes = nodeRepository.findDescendants(targetPath);
        ContentNode targetRoot = nodeRepository.findByPath(targetPath).orElse(null);
        if (targetRoot != null) targetNodes.add(0, targetRoot);

        List<TranslationConnector.TranslationUnit> units = new ArrayList<>();
        Map<String, NodePropertyRef> unitMap = new HashMap<>();

        for (ContentNode node : targetNodes) {
            for (Map.Entry<String, Object> prop : node.getProperties().entrySet()) {
                if (prop.getValue() instanceof String text && isTranslatable(prop.getKey())) {
                    String unitId = node.getPath() + "#" + prop.getKey();
                    units.add(new TranslationConnector.TranslationUnit(unitId, text));
                    unitMap.put(unitId, new NodePropertyRef(node.getPath(), prop.getKey()));
                }
            }
        }

        if (!units.isEmpty()) {
            Map<String, String> translations = connector.translate(units, sourceLocale, targetLocale);
            for (Map.Entry<String, String> entry : translations.entrySet()) {
                NodePropertyRef ref = unitMap.get(entry.getKey());
                if (ref != null) {
                    nodeRepository.findByPath(ref.nodePath()).ifPresent(node -> {
                        node.setProperty(ref.propertyName(), entry.getValue());
                        nodeRepository.save(node);
                    });
                }
            }
        }

        // Update sync status
        languageCopyRepo.findBySourcePathAndTargetLocale(sourcePath, targetLocale)
                .ifPresent(lc -> {
                    lc.setSyncStatus(LanguageCopy.SyncStatus.IN_SYNC);
                    lc.setLastSyncedAt(Instant.now());
                    languageCopyRepo.save(lc);
                });

        return new LanguageCopyResult(copyResult.targetPath(), copyResult.nodeCount(), true, null);
    }

    private boolean isTranslatable(String propertyName) {
        return propertyName.contains("title") || propertyName.contains("description")
                || propertyName.contains("text") || propertyName.contains("label")
                || propertyName.contains("alt") || propertyName.contains("caption")
                || propertyName.startsWith("jcr:");
    }

    public record LanguageCopyResult(String targetPath, int nodeCount, boolean success, String error) {}
    private record NodePropertyRef(String nodePath, String propertyName) {}
}

