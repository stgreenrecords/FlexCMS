package com.flexcms.core.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Component;

/**
 * Sanitizes HTML-containing rich text properties to prevent XSS attacks.
 *
 * <p>Uses the OWASP Java HTML Sanitizer with a policy that allows safe rich-text
 * elements (headings, paragraphs, lists, tables, links, images) while stripping
 * all dangerous elements and attributes (script, style, on* event handlers, etc.).
 *
 * <p>Usage: inject this component and call {@link #sanitizeIfHtml(String)} on any
 * String property value that may contain user-supplied HTML.
 */
@Component
public class RichTextSanitizer {

    /**
     * Allowed rich-text policy: a curated set of safe elements and attributes
     * suitable for CMS content authoring.
     *
     * Note: {@link HtmlPolicyBuilder#allowUrlProtocols} applies globally to all
     * URL-type attributes (href, src). It must be called on HtmlPolicyBuilder, not
     * on AttributeBuilder — so it is placed at the end of the chain before toFactory().
     */
    private static final PolicyFactory RICH_TEXT_POLICY = new HtmlPolicyBuilder()
            // Block-level structure
            .allowElements(
                    "p", "br", "hr", "div", "section", "article",
                    "h1", "h2", "h3", "h4", "h5", "h6",
                    "ul", "ol", "li", "dl", "dt", "dd",
                    "blockquote", "pre", "figure", "figcaption"
            )
            // Inline text formatting
            .allowElements(
                    "strong", "b", "em", "i", "u", "s", "del", "ins",
                    "span", "abbr", "mark", "small", "sub", "sup",
                    "code", "kbd", "samp", "var"
            )
            // Tables
            .allowElements(
                    "table", "caption", "thead", "tbody", "tfoot",
                    "tr", "th", "td", "col", "colgroup"
            )
            // Links
            .allowElements("a")
            .allowAttributes("href", "title", "target").onElements("a")
            .requireRelNofollowOnLinks()
            // Images
            .allowElements("img")
            .allowAttributes("src", "alt", "width", "height", "loading").onElements("img")
            // Safe global attributes (class for styling, id for anchors, lang, dir)
            .allowAttributes("class", "id", "lang", "dir").globally()
            // Table-specific layout attributes
            .allowAttributes("align", "valign", "colspan", "rowspan")
                    .onElements("table", "tr", "th", "td", "thead", "tbody", "tfoot")
            // Global URL protocol allowlist — applies to href (a) and src (img).
            // allowUrlProtocols() is a HtmlPolicyBuilder method, not AttributeBuilder,
            // so it must be called on the builder directly (not chained from allowAttributes).
            .allowUrlProtocols("https", "http", "mailto")
            .toFactory();

    /**
     * Sanitizes a string value if it contains HTML markup.
     * Non-HTML strings (no {@code <} character) are returned as-is for efficiency.
     *
     * @param value the input string, possibly containing HTML
     * @return sanitized HTML if the input contained HTML; the original string otherwise;
     *         {@code null} if input was {@code null}
     */
    public String sanitizeIfHtml(String value) {
        if (value == null) {
            return null;
        }
        // Fast path: skip sanitization for plain text with no HTML tags
        if (!containsHtml(value)) {
            return value;
        }
        return RICH_TEXT_POLICY.sanitize(value);
    }

    /**
     * Unconditionally sanitizes an HTML string using the rich-text policy.
     *
     * @param html the raw HTML to sanitize
     * @return sanitized HTML, or {@code null} if input was {@code null}
     */
    public String sanitize(String html) {
        if (html == null) {
            return null;
        }
        return RICH_TEXT_POLICY.sanitize(html);
    }

    /**
     * Returns {@code true} if the string contains at least one HTML tag character ({@code <}).
     */
    public boolean containsHtml(String value) {
        return value != null && value.indexOf('<') >= 0;
    }
}
