# Digital Asset Management (DAM) System

## 1. DAM Architecture

```
  Author UI (Upload/Edit)
       |
  +----v----+       +---------------+
  | DAM API |------>| Ingest Queue  |
  +---------+       | (RabbitMQ)    |
       |            +-------+-------+
       v                    |
  +----------+        +-----v------+        +------------------+
  | Metadata |        | Rendition  |        | Object Storage   |
  | Store    |        | Pipeline   |------->| (S3/MinIO)       |
  | (PgSQL)  |        | (async)    |        |  /originals/     |
  +----------+        +------------+        |  /renditions/     |
                           |                |  /temp/           |
                      +----v----+           +------------------+
                      | Workers |                    |
                      | - Image |           +--------v---------+
                      | - Video |           | CDN               |
                      | - PDF   |           | (CloudFront)      |
                      +---------+           +------------------+
```

---

## 2. Asset Data Model

```java
@Entity
@Table(name = "assets")
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Path in DAM tree: "/dam/corporate/images/hero-banner.jpg"
    @Column(name = "path", unique = true, nullable = false)
    private String path;

    private String name;             // "hero-banner.jpg"
    private String title;            // "Hero Banner Background"
    private String description;

    // File info
    private String mimeType;         // "image/jpeg"
    private Long fileSize;           // bytes
    private String originalFilename; // as uploaded

    // Storage
    private String storageKey;       // S3 key: "originals/uuid/hero-banner.jpg"
    private String storageBucket;

    // Image-specific metadata
    private Integer width;
    private Integer height;
    private String colorSpace;
    private Double aspectRatio;

    // Video-specific metadata
    private Double duration;         // seconds
    private String videoCodec;
    private String audioCodec;
    private Integer frameRate;

    // Taxonomy & organization
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;  // EXIF, IPTC, XMP, custom fields

    @ElementCollection
    private Set<String> tags;

    private String siteId;
    private String folderId;

    // Status
    @Enumerated(EnumType.STRING)
    private AssetStatus status;      // PROCESSING, ACTIVE, ARCHIVED, DELETED

    // Audit
    private String createdBy;
    private Instant createdAt;
    private String modifiedBy;
    private Instant modifiedAt;

    // Renditions
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "asset")
    private List<AssetRendition> renditions;

    // Usage tracking
    @OneToMany(mappedBy = "asset")
    private List<AssetReference> references;
}

@Entity
@Table(name = "asset_renditions")
public class AssetRendition {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private Asset asset;

    private String renditionKey;     // "thumbnail", "web-large", "hero-desktop", "original"
    private String storageKey;       // S3 key
    private String mimeType;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private String format;           // "webp", "avif", "jpeg"

    private Instant generatedAt;
}

@Entity
@Table(name = "asset_references")
public class AssetReference {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private Asset asset;

    private String contentNodePath;  // Which content node references this asset
    private String propertyName;     // Which property ("backgroundImage", "thumbnail")
}
```

---

## 3. Rendition Pipeline

### 3.1 Rendition Profiles Configuration

```json
{
  "image": {
    "profiles": {
      "thumbnail": {"width": 200, "height": 200, "fit": "cover", "format": "webp", "quality": 80},
      "web-small": {"width": 480, "format": "webp", "quality": 85},
      "web-medium": {"width": 960, "format": "webp", "quality": 85},
      "web-large": {"width": 1440, "format": "webp", "quality": 85},
      "hero-desktop": {"width": 1920, "format": "webp", "quality": 90},
      "hero-mobile": {"width": 768, "format": "webp", "quality": 85},
      "og-image": {"width": 1200, "height": 630, "fit": "cover", "format": "jpeg", "quality": 90},
      "original": {"keepOriginal": true}
    },
    "autoGenerate": ["thumbnail", "web-small", "web-medium", "web-large"]
  },
  "video": {
    "profiles": {
      "thumbnail": {"frame": "1s", "width": 480, "format": "jpeg"},
      "preview": {"maxDuration": "10s", "width": 720, "format": "mp4", "quality": "medium"},
      "web-720p": {"width": 1280, "height": 720, "format": "mp4", "codec": "h264"},
      "web-1080p": {"width": 1920, "height": 1080, "format": "mp4", "codec": "h264"}
    },
    "autoGenerate": ["thumbnail", "preview"]
  },
  "document": {
    "profiles": {
      "thumbnail": {"page": 1, "width": 400, "format": "png"},
      "preview": {"pages": "1-5", "format": "png", "width": 800}
    }
  }
}
```

### 3.2 Rendition Worker Service

```java
@Service
public class RenditionPipelineService {

    @Autowired
    private S3Service s3Service;

    @Autowired
    private AssetRenditionRepository renditionRepo;

    @Autowired
    private ImageProcessingService imageProcessor;

    @Autowired
    private VideoProcessingService videoProcessor;

    @RabbitListener(queues = "flexcms.dam.renditions")
    public void processRendition(RenditionRequest request) {
        Asset asset = request.getAsset();
        String profileKey = request.getProfileKey();
        RenditionProfile profile = request.getProfile();

        // Download original from S3
        byte[] original = s3Service.download(asset.getStorageKey());

        byte[] renditionData;
        RenditionMetadata metadata;

        if (asset.getMimeType().startsWith("image/")) {
            var result = imageProcessor.process(original, profile);
            renditionData = result.getData();
            metadata = result.getMetadata();
        } else if (asset.getMimeType().startsWith("video/")) {
            var result = videoProcessor.process(original, profile);
            renditionData = result.getData();
            metadata = result.getMetadata();
        } else {
            return; // Unsupported type
        }

        // Upload rendition to S3
        String renditionKey = String.format("renditions/%s/%s.%s",
            asset.getId(), profileKey, profile.getFormat());
        s3Service.upload(renditionKey, renditionData, metadata.getMimeType());

        // Save rendition record
        AssetRendition rendition = AssetRendition.builder()
            .asset(asset)
            .renditionKey(profileKey)
            .storageKey(renditionKey)
            .mimeType(metadata.getMimeType())
            .fileSize((long) renditionData.length)
            .width(metadata.getWidth())
            .height(metadata.getHeight())
            .format(profile.getFormat())
            .generatedAt(Instant.now())
            .build();

        renditionRepo.save(rendition);
    }
}
```

---

## 4. DAM API

```java
@RestController
@RequestMapping("/api/dam")
public class DamController {

    @Autowired
    private DamService damService;

    // Upload asset
    @PostMapping("/upload")
    @PreAuthorize("hasRole('CONTENT_AUTHOR')")
    public Asset uploadAsset(
        @RequestParam("file") MultipartFile file,
        @RequestParam("folder") String folderPath,
        @RequestParam(required = false) String title,
        @RequestParam(required = false) Set<String> tags
    ) {
        return damService.upload(file, folderPath, title, tags);
    }

    // Bulk upload
    @PostMapping("/upload/bulk")
    @PreAuthorize("hasRole('CONTENT_AUTHOR')")
    public List<Asset> bulkUpload(
        @RequestParam("files") List<MultipartFile> files,
        @RequestParam("folder") String folderPath
    ) {
        return damService.bulkUpload(files, folderPath);
    }

    // Browse assets in a folder
    @GetMapping("/browse")
    public Page<AssetSummary> browse(
        @RequestParam String folder,
        @RequestParam(required = false) String mimeTypeFilter,
        @RequestParam(defaultValue = "modifiedAt") String sortBy,
        @RequestParam(defaultValue = "DESC") String sortDir,
        Pageable pageable
    ) {
        return damService.browse(folder, mimeTypeFilter, sortBy, sortDir, pageable);
    }

    // Search assets
    @GetMapping("/search")
    public Page<AssetSummary> search(
        @RequestParam String query,
        @RequestParam(required = false) String siteId,
        @RequestParam(required = false) Set<String> tags,
        @RequestParam(required = false) String mimeType,
        @RequestParam(required = false) Integer minWidth,
        @RequestParam(required = false) Integer minHeight,
        Pageable pageable
    ) {
        return damService.search(query, siteId, tags, mimeType, minWidth, minHeight, pageable);
    }

    // Get asset with rendition URLs
    @GetMapping("/{assetId}")
    public AssetDetail getAsset(@PathVariable UUID assetId) {
        return damService.getAssetDetail(assetId);
    }

    // Get specific rendition URL (CDN-backed)
    @GetMapping("/{assetId}/rendition/{profileKey}")
    public ResponseEntity<Void> getRendition(
        @PathVariable UUID assetId,
        @PathVariable String profileKey
    ) {
        String cdnUrl = damService.getRenditionUrl(assetId, profileKey);
        return ResponseEntity.status(302).header("Location", cdnUrl).build();
    }

    // Smart crop / on-demand rendition
    @GetMapping("/{assetId}/transform")
    public ResponseEntity<byte[]> transform(
        @PathVariable UUID assetId,
        @RequestParam(required = false) Integer width,
        @RequestParam(required = false) Integer height,
        @RequestParam(defaultValue = "webp") String format,
        @RequestParam(defaultValue = "85") int quality,
        @RequestParam(defaultValue = "cover") String fit
    ) {
        return damService.transformOnDemand(assetId, width, height, format, quality, fit);
    }

    // Update asset metadata
    @PatchMapping("/{assetId}/metadata")
    @PreAuthorize("hasRole('CONTENT_AUTHOR')")
    public Asset updateMetadata(
        @PathVariable UUID assetId,
        @RequestBody Map<String, Object> metadata
    ) {
        return damService.updateMetadata(assetId, metadata);
    }

    // Find where asset is used
    @GetMapping("/{assetId}/references")
    public List<AssetReference> getReferences(@PathVariable UUID assetId) {
        return damService.getReferences(assetId);
    }

    // Move asset
    @PostMapping("/{assetId}/move")
    @PreAuthorize("hasRole('CONTENT_AUTHOR')")
    public Asset moveAsset(@PathVariable UUID assetId, @RequestParam String targetFolder) {
        return damService.move(assetId, targetFolder);
    }

    // Create folder
    @PostMapping("/folders")
    @PreAuthorize("hasRole('CONTENT_AUTHOR')")
    public DamFolder createFolder(@RequestBody CreateFolderRequest request) {
        return damService.createFolder(request.getPath(), request.getTitle());
    }
}
```

---

## 5. Asset Delivery (CDN-Optimized)

### 5.1 CDN URL Generation

```java
@Service
public class AssetDeliveryService {

    @Value("${flexcms.cdn.dam-base-url}")
    private String cdnBaseUrl;  // "https://assets.cdn.example.com"

    @Value("${flexcms.cdn.signing-key}")
    private String signingKey;

    public String getDeliveryUrl(Asset asset, String renditionKey) {
        AssetRendition rendition = asset.getRendition(renditionKey);
        if (rendition == null) {
            rendition = asset.getRendition("original");
        }

        // Build CDN URL with cache-busting version
        String url = String.format("%s/%s?v=%d",
            cdnBaseUrl,
            rendition.getStorageKey(),
            asset.getModifiedAt().getEpochSecond()
        );

        // Optional: signed URLs for restricted assets
        if (asset.isRestricted()) {
            url = signUrl(url, Duration.ofHours(1));
        }

        return url;
    }

    // Dynamic image transformation URL (Imgix-style)
    public String getTransformUrl(Asset asset, Map<String, String> params) {
        StringBuilder url = new StringBuilder(cdnBaseUrl)
            .append("/transform/")
            .append(asset.getId());

        if (!params.isEmpty()) {
            url.append("?");
            url.append(params.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&")));
        }

        return url.toString();
    }
}
```

### 5.2 Smart Responsive Images

```html
<!-- Generated by image component model -->
<picture>
    <source type="image/avif"
            srcset="https://assets.cdn.example.com/renditions/uuid/web-small.avif 480w,
                    https://assets.cdn.example.com/renditions/uuid/web-medium.avif 960w,
                    https://assets.cdn.example.com/renditions/uuid/web-large.avif 1440w"
            sizes="(max-width: 480px) 100vw, (max-width: 960px) 100vw, 1440px"/>
    <source type="image/webp"
            srcset="https://assets.cdn.example.com/renditions/uuid/web-small.webp 480w,
                    https://assets.cdn.example.com/renditions/uuid/web-medium.webp 960w,
                    https://assets.cdn.example.com/renditions/uuid/web-large.webp 1440w"
            sizes="(max-width: 480px) 100vw, (max-width: 960px) 100vw, 1440px"/>
    <img src="https://assets.cdn.example.com/renditions/uuid/web-medium.jpeg"
         alt="Product hero image"
         loading="lazy"
         width="960" height="540"/>
</picture>
```
