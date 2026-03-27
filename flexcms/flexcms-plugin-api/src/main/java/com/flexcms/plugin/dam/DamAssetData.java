package com.flexcms.plugin.dam;

/**
 * Lightweight asset data carrier for use in CMS ComponentModels.
 *
 * <p>Returned by {@link DamClient} after resolving a DAM path. ComponentModels
 * can use this DTO to build image URLs, display dimensions, or check MIME type
 * without taking a hard dependency on the DAM module's internal Asset entity.</p>
 */
public class DamAssetData {

    private String path;
    private String name;
    private String mimeType;
    private long fileSize;
    private Integer width;
    private Integer height;
    private String streamUrl;
    private String thumbnailUrl;

    public DamAssetData() {}

    public DamAssetData(String path, String name, String mimeType, long fileSize,
                        Integer width, Integer height, String streamUrl, String thumbnailUrl) {
        this.path = path;
        this.name = name;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.width = width;
        this.height = height;
        this.streamUrl = streamUrl;
        this.thumbnailUrl = thumbnailUrl;
    }

    /** DAM path (e.g. {@code "/dam/products/shoe-x1/hero.jpg"}). */
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }

    /** Pixel width; {@code null} for non-image assets. */
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    /** Pixel height; {@code null} for non-image assets. */
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    /** Direct stream/download URL for this asset. */
    public String getStreamUrl() { return streamUrl; }
    public void setStreamUrl(String streamUrl) { this.streamUrl = streamUrl; }

    /** Thumbnail rendition URL (may be null if no thumbnail rendition exists). */
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public boolean isImage() {
        return mimeType != null && mimeType.startsWith("image/");
    }

    public boolean isVideo() {
        return mimeType != null && mimeType.startsWith("video/");
    }
}
