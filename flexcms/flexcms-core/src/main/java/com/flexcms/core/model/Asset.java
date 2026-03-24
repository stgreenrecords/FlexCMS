package com.flexcms.core.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "assets")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String path;

    @Column(nullable = false)
    private String name;

    private String title;
    private String description;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "storage_bucket")
    private String storageBucket;

    private Integer width;
    private Integer height;

    @Column(name = "color_space")
    private String colorSpace;

    @Column(name = "aspect_ratio")
    private Double aspectRatio;

    private Double duration;

    @Column(name = "video_codec")
    private String videoCodec;

    @Column(name = "audio_codec")
    private String audioCodec;

    @Column(name = "frame_rate")
    private Integer frameRate;

    @Column(name = "metadata", columnDefinition = "jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> metadata = new HashMap<>();

    @Column(name = "site_id")
    private String siteId;

    @Column(name = "folder_path")
    private String folderPath;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private AssetStatus status = AssetStatus.PROCESSING;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "modified_by")
    private String modifiedBy;

    @Column(name = "modified_at")
    private Instant modifiedAt;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "asset", fetch = FetchType.LAZY)
    private List<AssetRendition> renditions = new ArrayList<>();

    public Asset() {}

    public AssetRendition getRendition(String key) {
        return renditions.stream()
                .filter(r -> r.getRenditionKey().equals(key))
                .findFirst()
                .orElse(null);
    }

    public String getRenditionUrl(String key) {
        AssetRendition rendition = getRendition(key);
        return rendition != null ? rendition.getStorageKey() : storageKey;
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }

    public String getStorageBucket() { return storageBucket; }
    public void setStorageBucket(String storageBucket) { this.storageBucket = storageBucket; }

    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    public String getColorSpace() { return colorSpace; }
    public void setColorSpace(String colorSpace) { this.colorSpace = colorSpace; }

    public Double getAspectRatio() { return aspectRatio; }
    public void setAspectRatio(Double aspectRatio) { this.aspectRatio = aspectRatio; }

    public Double getDuration() { return duration; }
    public void setDuration(Double duration) { this.duration = duration; }

    public String getVideoCodec() { return videoCodec; }
    public void setVideoCodec(String videoCodec) { this.videoCodec = videoCodec; }

    public String getAudioCodec() { return audioCodec; }
    public void setAudioCodec(String audioCodec) { this.audioCodec = audioCodec; }

    public Integer getFrameRate() { return frameRate; }
    public void setFrameRate(Integer frameRate) { this.frameRate = frameRate; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public String getFolderPath() { return folderPath; }
    public void setFolderPath(String folderPath) { this.folderPath = folderPath; }

    public AssetStatus getStatus() { return status; }
    public void setStatus(AssetStatus status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getModifiedAt() { return modifiedAt; }

    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }

    public List<AssetRendition> getRenditions() { return renditions; }
    public void setRenditions(List<AssetRendition> renditions) { this.renditions = renditions; }

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); modifiedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { modifiedAt = Instant.now(); }
}
