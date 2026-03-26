package com.flexcms.pim.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.flexcms.pim.converter.PimJsonbConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.UUID;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "catalogs")
public class Catalog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int year;

    private String season;
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schema_id", nullable = false)
    private ProductSchema schema;

    @Enumerated(EnumType.STRING)
    private CatalogStatus status = CatalogStatus.DRAFT;

    @Column(columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    @Convert(converter = PimJsonbConverter.class)
    private java.util.Map<String, Object> settings;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ProductSchema getSchema() { return schema; }
    public void setSchema(ProductSchema schema) { this.schema = schema; }
    public CatalogStatus getStatus() { return status; }
    public void setStatus(CatalogStatus status) { this.status = status; }
    public java.util.Map<String, Object> getSettings() { return settings; }
    public void setSettings(java.util.Map<String, Object> settings) { this.settings = settings; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }

    public enum CatalogStatus { DRAFT, ACTIVE, ARCHIVED }
}

