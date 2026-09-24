package com.flexcms.dam.client;

import com.flexcms.core.model.Asset;
import com.flexcms.core.util.AssetUrls;
import com.flexcms.dam.service.AssetIngestService;
import com.flexcms.plugin.dam.DamAssetData;
import com.flexcms.plugin.dam.DamClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * In-process DAM client — resolves assets by calling {@link AssetIngestService}
 * directly in the same JVM.
 *
 * <p>This is the default {@link DamClient} implementation. It is auto-discovered
 * by Spring and injected into any ComponentModel that declares
 * {@code @Autowired private DamClient damClient;}.</p>
 *
 * <p>When the CMS and DAM modules are deployed as separate services, this class
 * can be replaced by a REST-based implementation without changing any
 * ComponentModel code.</p>
 */
@Service
public class DirectDamClient implements DamClient {

    @Autowired
    private AssetIngestService assetIngestService;

    @Override
    public Optional<DamAssetData> getAssetByPath(String path) {
        return assetIngestService.getAsset(path).map(this::toData);
    }

    @Override
    public List<DamAssetData> getBulkByPath(Collection<String> paths) {
        List<DamAssetData> result = new ArrayList<>();
        for (String path : paths) {
            assetIngestService.getAsset(path).map(this::toData).ifPresent(result::add);
        }
        return result;
    }

    @Override
    public String getRenditionUrl(String assetPath, String renditionKey) {
        return assetIngestService.getRenditionUrl(assetPath, renditionKey);
    }

    @Override
    public List<Map<String, Object>> enrichProductAssets(List<Map<String, Object>> assetRefs) {
        if (assetRefs == null || assetRefs.isEmpty()) {
            return List.of();
        }

        List<Map<String, Object>> enriched = new ArrayList<>(assetRefs.size());
        for (Map<String, Object> ref : assetRefs) {
            String assetPath = (String) ref.get("assetPath");
            Map<String, Object> row = new LinkedHashMap<>(ref);

            if (assetPath != null && !assetPath.isBlank()) {
                assetIngestService.getAsset(assetPath).ifPresent(asset -> {
                    row.put("url",          streamUrl(asset));
                    row.put("thumbnailUrl", renditionUrl(asset, "thumbnail"));
                    row.put("width",        asset.getWidth());
                    row.put("height",       asset.getHeight());
                    row.put("mimeType",     asset.getMimeType());
                    row.put("name",         asset.getName());
                    row.put("fileSize",     asset.getFileSize());
                });
            }

            enriched.add(row);
        }
        return enriched;
    }

    @Override
    public boolean exists(String path) {
        return assetIngestService.getAsset(path).isPresent();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private DamAssetData toData(Asset asset) {
        return new DamAssetData(
                asset.getPath(),
                asset.getName(),
                asset.getMimeType(),
                asset.getFileSize() != null ? asset.getFileSize() : 0L,
                asset.getWidth(),
                asset.getHeight(),
                streamUrl(asset),
                renditionUrl(asset, "thumbnail")
        );
    }

    /**
     * Canonical public URL of the original. This used to be the author-only streaming
     * endpoint, which the publish tier does not serve, so every URL handed to a
     * component model was dead on the live site ({@code R-REB-21-003}).
     */
    private static String streamUrl(Asset asset) {
        return AssetUrls.original(asset.getId());
    }

    /**
     * Canonical rendition URL. Built without touching the lazy rendition collection: the
     * delivery endpoint falls back to the original when the rendition does not exist.
     */
    private static String renditionUrl(Asset asset, String renditionKey) {
        return AssetUrls.rendition(asset.getId(), renditionKey);
    }
}
