package com.flexcms.plugin.model;

import java.util.Locale;
import java.util.Map;

/**
 * Context available during component rendering.
 */
public class RenderContext {

    private String siteId;
    private Locale locale;
    private String requestPath;
    private String runMode;  // "author" or "publish"
    private String domain;
    private Map<String, String> requestParameters;

    public RenderContext() {}

    public RenderContext(String siteId, Locale locale, String requestPath, String runMode) {
        this.siteId = siteId;
        this.locale = locale;
        this.requestPath = requestPath;
        this.runMode = runMode;
    }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public Locale getLocale() { return locale; }
    public void setLocale(Locale locale) { this.locale = locale; }

    public String getRequestPath() { return requestPath; }
    public void setRequestPath(String requestPath) { this.requestPath = requestPath; }

    public String getRunMode() { return runMode; }
    public void setRunMode(String runMode) { this.runMode = runMode; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public Map<String, String> getRequestParameters() { return requestParameters; }
    public void setRequestParameters(Map<String, String> requestParameters) { this.requestParameters = requestParameters; }

    public boolean isAuthor() { return "author".equals(runMode); }
    public boolean isPublish() { return "publish".equals(runMode); }

    /**
     * Resolve an internal content path to a public URL.
     */
    public String resolveLink(String contentPath) {
        if (contentPath == null) return null;
        // Strip /content/{siteId}/{locale} prefix to get clean URL
        String prefix = "/content/" + siteId + "/" + locale.getLanguage() + "/";
        if (contentPath.startsWith(prefix)) {
            return "/" + contentPath.substring(prefix.length());
        }
        return contentPath;
    }
}
