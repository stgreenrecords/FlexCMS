package com.flexcms.multisite.model;

/**
 * Resolved site context for the current request.
 */
public class SiteContext {

    private final String siteId;
    private final String locale;
    private final String domain;
    private final String contentRoot;
    private final String damRoot;
    private final String configRoot;

    private SiteContext(Builder builder) {
        this.siteId = builder.siteId;
        this.locale = builder.locale;
        this.domain = builder.domain;
        this.contentRoot = builder.contentRoot;
        this.damRoot = builder.damRoot;
        this.configRoot = builder.configRoot;
    }

    public String getSiteId() { return siteId; }
    public String getLocale() { return locale; }
    public String getDomain() { return domain; }
    public String getContentRoot() { return contentRoot; }
    public String getDamRoot() { return damRoot; }
    public String getConfigRoot() { return configRoot; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String siteId;
        private String locale;
        private String domain;
        private String contentRoot;
        private String damRoot;
        private String configRoot;

        public Builder siteId(String siteId) { this.siteId = siteId; return this; }
        public Builder locale(String locale) { this.locale = locale; return this; }
        public Builder domain(String domain) { this.domain = domain; return this; }
        public Builder contentRoot(String contentRoot) { this.contentRoot = contentRoot; return this; }
        public Builder damRoot(String damRoot) { this.damRoot = damRoot; return this; }
        public Builder configRoot(String configRoot) { this.configRoot = configRoot; return this; }
        public SiteContext build() { return new SiteContext(this); }
    }
}

