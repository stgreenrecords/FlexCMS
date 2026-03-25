package com.flexcms.core.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RichTextSanitizerTest {

    private RichTextSanitizer sanitizer;

    @BeforeEach
    void setUp() {
        sanitizer = new RichTextSanitizer();
    }

    // --- containsHtml ---

    @Test
    void containsHtml_returnsFalse_forPlainText() {
        assertThat(sanitizer.containsHtml("Hello world")).isFalse();
    }

    @Test
    void containsHtml_returnsTrue_whenAngleBracketPresent() {
        assertThat(sanitizer.containsHtml("<p>text</p>")).isTrue();
    }

    @Test
    void containsHtml_returnsFalse_forNull() {
        assertThat(sanitizer.containsHtml(null)).isFalse();
    }

    // --- sanitizeIfHtml: plain text pass-through ---

    @Test
    void sanitizeIfHtml_returnsUnchanged_forPlainText() {
        String input = "Hello, world!";
        assertThat(sanitizer.sanitizeIfHtml(input)).isEqualTo(input);
    }

    @Test
    void sanitizeIfHtml_returnsNull_forNull() {
        assertThat(sanitizer.sanitizeIfHtml(null)).isNull();
    }

    // --- script tag removal ---

    @Test
    void sanitize_removesScriptTags() {
        String result = sanitizer.sanitize("<p>Safe</p><script>alert('xss')</script>");
        assertThat(result).contains("<p>Safe</p>");
        assertThat(result).doesNotContain("<script");
        assertThat(result).doesNotContain("alert");
    }

    @Test
    void sanitize_removesInlineEventHandlers() {
        String result = sanitizer.sanitize("<img src=\"x\" onerror=\"alert(1)\">");
        assertThat(result).doesNotContain("onerror");
        assertThat(result).doesNotContain("alert");
    }

    @Test
    void sanitize_removesJavascriptHref() {
        String result = sanitizer.sanitize("<a href=\"javascript:alert(1)\">click</a>");
        // href with javascript: protocol is stripped or the link is removed
        assertThat(result).doesNotContain("javascript:");
    }

    // --- safe element preservation ---

    @Test
    void sanitize_preservesSafeParagraph() {
        String result = sanitizer.sanitize("<p>Hello <strong>world</strong></p>");
        assertThat(result).contains("<p>");
        assertThat(result).contains("<strong>");
        assertThat(result).contains("Hello");
    }

    @Test
    void sanitize_preservesSafeHeadings() {
        String result = sanitizer.sanitize("<h1>Title</h1><h2>Subtitle</h2>");
        assertThat(result).contains("<h1>");
        assertThat(result).contains("<h2>");
    }

    @Test
    void sanitize_preservesSafeList() {
        String result = sanitizer.sanitize("<ul><li>Item 1</li><li>Item 2</li></ul>");
        assertThat(result).contains("<ul>");
        assertThat(result).contains("<li>");
    }

    @Test
    void sanitize_preservesSafeHttpsLink() {
        String result = sanitizer.sanitize("<a href=\"https://example.com\">Link</a>");
        assertThat(result).contains("href=\"https://example.com\"");
        assertThat(result).contains("Link");
    }

    @Test
    void sanitize_preservesSafeImage() {
        String result = sanitizer.sanitize("<img src=\"https://example.com/img.png\" alt=\"test\">");
        assertThat(result).contains("src=\"https://example.com/img.png\"");
        assertThat(result).contains("alt=\"test\"");
    }

    @Test
    void sanitize_preservesCodeBlock() {
        String result = sanitizer.sanitize("<pre><code>int x = 1;</code></pre>");
        assertThat(result).contains("<pre>");
        assertThat(result).contains("<code>");
    }

    @Test
    void sanitize_preservesSafeTable() {
        String result = sanitizer.sanitize(
                "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table>");
        assertThat(result).contains("<table>");
        assertThat(result).contains("<th>");
        assertThat(result).contains("<td>");
    }

    // --- dangerous element stripping ---

    @Test
    void sanitize_removesStyleTag() {
        String result = sanitizer.sanitize("<style>body{background:url(evil)}</style><p>text</p>");
        assertThat(result).doesNotContain("<style");
        assertThat(result).doesNotContain("background");
    }

    @Test
    void sanitize_removesObjectEmbed() {
        String result = sanitizer.sanitize("<object data=\"evil.swf\"></object><p>ok</p>");
        assertThat(result).doesNotContain("<object");
        assertThat(result).contains("<p>");
    }

    @Test
    void sanitize_removesIframe() {
        String result = sanitizer.sanitize("<iframe src=\"evil.com\"></iframe><p>ok</p>");
        assertThat(result).doesNotContain("<iframe");
        assertThat(result).contains("<p>");
    }

    // --- sanitizeIfHtml delegates to OWASP policy for HTML strings ---

    @Test
    void sanitizeIfHtml_sanitizesHtmlInput() {
        String result = sanitizer.sanitizeIfHtml("<p>Safe</p><script>bad()</script>");
        assertThat(result).contains("<p>Safe</p>");
        assertThat(result).doesNotContain("<script");
    }
}
