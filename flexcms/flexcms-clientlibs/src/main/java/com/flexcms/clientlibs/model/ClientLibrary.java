package com.flexcms.clientlibs.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "client_libraries")
public class ClientLibrary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    private String category;
    private String version;

    @Column(name = "dependencies", columnDefinition = "TEXT[]")
    private String[] dependencies;

    @Column(name = "embeds", columnDefinition = "TEXT[]")
    private String[] embeds;

    @Column(name = "css_files", columnDefinition = "TEXT[]")
    private String[] cssFiles;

    @Column(name = "js_files", columnDefinition = "TEXT[]")
    private String[] jsFiles;

    @Column(name = "compiled_css_key")
    private String compiledCssKey;

    @Column(name = "compiled_js_key")
    private String compiledJsKey;

    @Column(name = "css_hash")
    private String cssHash;

    @Column(name = "js_hash")
    private String jsHash;

    @Column(name = "last_compiled")
    private Instant lastCompiled;

    private boolean minified;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public ClientLibrary() {}

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String[] getDependencies() { return dependencies; }
    public void setDependencies(String[] dependencies) { this.dependencies = dependencies; }
    public String[] getEmbeds() { return embeds; }
    public void setEmbeds(String[] embeds) { this.embeds = embeds; }
    public String[] getCssFiles() { return cssFiles; }
    public void setCssFiles(String[] cssFiles) { this.cssFiles = cssFiles; }
    public String[] getJsFiles() { return jsFiles; }
    public void setJsFiles(String[] jsFiles) { this.jsFiles = jsFiles; }
    public String getCompiledCssKey() { return compiledCssKey; }
    public void setCompiledCssKey(String compiledCssKey) { this.compiledCssKey = compiledCssKey; }
    public String getCompiledJsKey() { return compiledJsKey; }
    public void setCompiledJsKey(String compiledJsKey) { this.compiledJsKey = compiledJsKey; }
    public String getCssHash() { return cssHash; }
    public void setCssHash(String cssHash) { this.cssHash = cssHash; }
    public String getJsHash() { return jsHash; }
    public void setJsHash(String jsHash) { this.jsHash = jsHash; }
    public Instant getLastCompiled() { return lastCompiled; }
    public void setLastCompiled(Instant lastCompiled) { this.lastCompiled = lastCompiled; }
    public boolean isMinified() { return minified; }
    public void setMinified(boolean minified) { this.minified = minified; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}

