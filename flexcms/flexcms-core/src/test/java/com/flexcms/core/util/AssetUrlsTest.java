package com.flexcms.core.util;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AssetUrlsTest {

    private static final UUID A = UUID.fromString("11111111-2222-3333-4444-555555555555");
    private static final UUID B = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    // ── URL building ──────────────────────────────────────────────────────────

    @Test
    void original_isCanonicalRelativeUrl() {
        assertThat(AssetUrls.original(A)).isEqualTo("/dam/renditions/" + A);
    }

    @Test
    void rendition_appendsKey_andFallsBackToOriginalForBlankKey() {
        assertThat(AssetUrls.rendition(A, "thumbnail")).isEqualTo("/dam/renditions/" + A + "/thumbnail");
        assertThat(AssetUrls.rendition(A, null)).isEqualTo(AssetUrls.original(A));
        assertThat(AssetUrls.rendition(A, " ")).isEqualTo(AssetUrls.original(A));
    }

    @Test
    void isValidRenditionKey_acceptsHyphenatedLowercase_rejectsTraversalAndUppercase() {
        assertThat(AssetUrls.isValidRenditionKey("web-small")).isTrue();
        assertThat(AssetUrls.isValidRenditionKey("thumbnail")).isTrue();
        assertThat(AssetUrls.isValidRenditionKey("../originals")).isFalse();
        assertThat(AssetUrls.isValidRenditionKey("Thumb")).isFalse();
        assertThat(AssetUrls.isValidRenditionKey("a/b")).isFalse();
        assertThat(AssetUrls.isValidRenditionKey("")).isFalse();
        assertThat(AssetUrls.isValidRenditionKey(null)).isFalse();
    }

    // ── extractAssetIds ───────────────────────────────────────────────────────

    @Test
    void extractAssetIds_findsLegacyRelativeAbsoluteAndCanonical_inNestedStructures() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("image", "/api/author/assets/" + A + "/content");
        props.put("cards", List.of(
                Map.of("src", "http://localhost:8080/api/author/assets/" + B + "/content"),
                Map.of("src", "/dam/renditions/" + A + "/thumbnail")));
        props.put("count", 3);

        assertThat(AssetUrls.extractAssetIds(props)).containsExactly(A, B);
    }

    @Test
    void extractAssetIds_findsUrlsInsideRichTextHtml() {
        String html = "<p>Hi</p><img src=\"/api/author/assets/" + A + "/content\"><img src='/dam/renditions/" + B + "'>";

        assertThat(AssetUrls.extractAssetIds(Map.of("text", html))).containsExactlyInAnyOrder(A, B);
    }

    @Test
    void extractAssetIds_ignoresUnrelatedStrings_andNull() {
        assertThat(AssetUrls.extractAssetIds(Map.of("title", "Home", "link", "/content/tut-usa/home"))).isEmpty();
        assertThat(AssetUrls.extractAssetIds(null)).isEmpty();
        // A path that looks similar but is not an asset URL (no /content suffix).
        assertThat(AssetUrls.extractAssetIds("/api/author/assets/" + A)).isEmpty();
    }

    // ── rewriteLegacyReferences ───────────────────────────────────────────────

    @Test
    void rewriteLegacyReferences_replacesRelativeAndAbsoluteAuthorUrls() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("image", "/api/author/assets/" + A + "/content");
        props.put("hero", "https://author.example.com/api/author/assets/" + B + "/content");
        props.put("html", "<img src=\"http://localhost:8080/api/author/assets/" + A + "/content\">");

        Map<String, Object> out = AssetUrls.rewriteLegacyReferences(props);

        assertThat(out.get("image")).isEqualTo("/dam/renditions/" + A);
        assertThat(out.get("hero")).isEqualTo("/dam/renditions/" + B);
        assertThat(out.get("html")).isEqualTo("<img src=\"/dam/renditions/" + A + "\">");
        assertThat(out.toString()).doesNotContain("/api/author/");
    }

    @Test
    void rewriteLegacyReferences_deepCopiesAndLeavesInputAndNonStringsUntouched() {
        Instant now = Instant.now();
        Map<String, Object> nested = new LinkedHashMap<>();
        nested.put("src", "/api/author/assets/" + A + "/content");
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("items", List.of(nested));
        props.put("modified", now);
        props.put("flag", true);

        Map<String, Object> out = AssetUrls.rewriteLegacyReferences(props);

        @SuppressWarnings("unchecked")
        Map<String, Object> outNested = (Map<String, Object>) ((List<?>) out.get("items")).get(0);
        assertThat(outNested.get("src")).isEqualTo("/dam/renditions/" + A);
        assertThat(nested.get("src")).isEqualTo("/api/author/assets/" + A + "/content");
        assertThat(out.get("modified")).isSameAs(now);
        assertThat(out.get("flag")).isEqualTo(true);
    }

    @Test
    void rewriteLegacyReferences_keepsCanonicalUrlsAndMapOrder() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("z", "/dam/renditions/" + A + "/thumbnail");
        props.put("a", "plain");

        Map<String, Object> out = AssetUrls.rewriteLegacyReferences(props);

        assertThat(out).containsExactly(Map.entry("z", "/dam/renditions/" + A + "/thumbnail"), Map.entry("a", "plain"));
    }
}
