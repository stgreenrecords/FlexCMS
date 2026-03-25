package com.flexcms.headless.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.plugin.model.RenderContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Public headless API for delivering Experience Fragment content.
 *
 * <p>Base URL: {@code /api/content/v1/xf}
 */
@Tag(name = "Experience Fragments (Headless)", description = "Public delivery API for Experience Fragment variations")
@RestController
@RequestMapping("/api/content/v1/xf")
public class ExperienceFragmentApiController {

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private ContentDeliveryService deliveryService;

    @Operation(summary = "Get resolved component tree for an XF variation")
    @GetMapping("/{*xfPath}/variations/{variationType}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getVariation(
            @Parameter(description = "Dot-path of the XF folder")
            @PathVariable String xfPath,
            @Parameter(description = "Variation name, e.g. master | mobile | email")
            @PathVariable String variationType) {

        String path = normalise(xfPath);
        String varPath = path + "." + variationType.toLowerCase();

        ContentNode variation = nodeRepository.findByPath(varPath)
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()))
                .orElseThrow(() -> new NotFoundException(
                        "XF variation '" + variationType + "' not found at: " + path));

        RenderContext ctx = new RenderContext();
        return ResponseEntity.ok(deliveryService.renderXfVariation(variation, ctx));
    }

    @Operation(summary = "Get the default (master) variation of an XF")
    @GetMapping("/{*xfPath}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getDefaultVariation(@PathVariable String xfPath) {
        String path = normalise(xfPath);

        Optional<ContentNode> master = nodeRepository.findByPath(path + ".master")
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()));

        ContentNode variation = master.or(() ->
                nodeService.getChildren(path).stream()
                        .filter(n -> "flexcms/xf-page".equals(n.getResourceType()))
                        .findFirst()
        ).orElseThrow(() -> new NotFoundException("No variations found for XF: " + path));

        RenderContext ctx = new RenderContext();
        return ResponseEntity.ok(deliveryService.renderXfVariation(variation, ctx));
    }

    @Operation(summary = "List available variations for an XF")
    @GetMapping("/{*xfPath}/variations")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> listVariations(@PathVariable String xfPath) {
        String path = normalise(xfPath);
        List<Map<String, Object>> result = nodeService.getChildren(path).stream()
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()))
                .map(v -> Map.<String, Object>of(
                        "variationType", v.getProperty("variationType", v.getName()),
                        "title",         v.getProperty("jcr:title", v.getName()),
                        "path",          v.getPath(),
                        "isMaster",      v.getProperty("xfMasterVariation", false)
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    private static String normalise(String path) {
        return path.startsWith("/") ? path.substring(1).replace('/', '.') : path;
    }
}
