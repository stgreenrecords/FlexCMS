# Multi-Site & Multi-Language Management

## 1. Multi-Site Architecture

### 1.1 Site Tenant Model

Each site is an isolated tenant within a shared CMS instance. Sites share the same infrastructure but have independent content trees, configurations, templates, and assets.

```java
@Entity
@Table(name = "sites")
public class Site {
    @Id
    private String siteId;          // e.g., "corporate", "brand-a", "blog"

    private String title;            // "Corporate Website"
    private String description;

    // Domain mappings (multiple domains can map to one site)
    @OneToMany(cascade = CascadeType.ALL)
    private List<DomainMapping> domains;

    // Content tree root
    private String contentRoot;      // "/content/corporate"
    private String damRoot;          // "/dam/corporate"
    private String configRoot;       // "/conf/corporate"

    // Supported languages
    @ElementCollection
    private List<String> supportedLocales;  // ["en", "fr", "de", "ja"]
    private String defaultLocale;            // "en"

    // Template policies
    @ElementCollection
    private List<String> allowedTemplates;

    // Site-level settings
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> settings;   // CDN config, analytics, theme, etc.

    private boolean active;
    private Instant createdAt;
}

@Entity
@Table(name = "domain_mappings")
public class DomainMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String domain;           // "www.corporate.com"
    private String siteId;           // "corporate"
    private String locale;           // Optional: "en" (for locale-specific domains)
    private String pathPrefix;       // Optional: "/us" (for path-based locale)
    private boolean primary;         // Primary domain for canonical URLs
    private boolean httpsRequired;
}
```

### 1.2 Site Resolution

```java
@Service
public class SiteResolver {

    @Autowired
    private SiteRepository siteRepository;

    @Autowired
    private DomainMappingRepository domainMappings;

    @Cacheable(value = "site-resolution", key = "#request.serverName + ':' + #request.requestURI")
    public SiteContext resolve(HttpServletRequest request) {
        String host = request.getServerName();
        String path = request.getRequestURI();

        // 1. Find domain mapping
        DomainMapping mapping = domainMappings.findByDomain(host)
            .orElseThrow(() -> new SiteNotFoundException("No site for domain: " + host));

        // 2. Load site
        Site site = siteRepository.findById(mapping.getSiteId())
            .orElseThrow();

        // 3. Resolve locale from path, domain, or header
        String locale = resolveLocale(mapping, path, request);

        // 4. Build context
        return SiteContext.builder()
            .site(site)
            .locale(locale)
            .domain(host)
            .contentRoot(site.getContentRoot() + "/" + locale)
            .damRoot(site.getDamRoot())
            .configRoot(site.getConfigRoot())
            .build();
    }

    private String resolveLocale(DomainMapping mapping, String path, HttpServletRequest request) {
        // Strategy 1: Domain-level locale (fr.corporate.com -> fr)
        if (mapping.getLocale() != null) {
            return mapping.getLocale();
        }

        // Strategy 2: Path prefix (/fr/about -> fr)
        Site site = siteRepository.findById(mapping.getSiteId()).orElseThrow();
        for (String locale : site.getSupportedLocales()) {
            if (path.startsWith("/" + locale + "/") || path.equals("/" + locale)) {
                return locale;
            }
        }

        // Strategy 3: Accept-Language header
        String acceptLang = request.getHeader("Accept-Language");
        if (acceptLang != null) {
            String preferred = Locale.LanguageRange.parse(acceptLang).stream()
                .map(lr -> lr.getRange().substring(0, 2))
                .filter(site.getSupportedLocales()::contains)
                .findFirst()
                .orElse(null);
            if (preferred != null) return preferred;
        }

        // Fallback: site default
        return site.getDefaultLocale();
    }
}
```

### 1.3 Multi-Site Content Sharing

Sites can share content through **Live Copies** and **Content Fragments**:

```java
@Entity
@Table(name = "live_copies")
public class LiveCopy {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String sourcePath;       // "/content/corporate/en/shared/legal"
    private String targetPath;       // "/content/brand-a/en/legal"

    private boolean autoSync;        // Auto-update when source changes
    private boolean allowOverrides;  // Target can override specific properties

    @ElementCollection
    private Set<String> overriddenProperties;  // Properties that won't sync
}
```

---

## 2. Multi-Language Management

### 2.1 Language Copy Structure

```
/content/corporate/
├── en/                     # English (source language)
│   ├── homepage
│   ├── about/
│   │   ├── team
│   │   └── careers
│   └── products/
│       ├── product-a
│       └── product-b
├── fr/                     # French (translation)
│   ├── homepage            # Translated copy of en/homepage
│   ├── about/
│   │   ├── team
│   │   └── careers
│   └── products/
│       ├── product-a
│       └── product-b
├── de/                     # German
│   └── ...
└── ja/                     # Japanese
    └── ...
```

### 2.2 Translation Management Service

```java
@Service
public class TranslationService {

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private TranslationJobRepository jobRepository;

    @Autowired
    private List<TranslationConnector> translationConnectors;

    /**
     * Create language copies for a page and all its components.
     */
    @Transactional
    public LanguageCopyResult createLanguageCopy(
        String sourcePath,
        String sourceLocale,
        String targetLocale,
        TranslationMethod method
    ) {
        ContentNode sourceNode = nodeRepository.findByPath(sourcePath)
            .orElseThrow();

        // Calculate target path: replace locale segment
        String targetPath = sourcePath.replace("/" + sourceLocale + "/", "/" + targetLocale + "/");

        // Deep copy the node and all descendants
        List<ContentNode> sourceTree = nodeRepository.findByPathDescendants(sourcePath);
        List<ContentNode> targetTree = new ArrayList<>();

        for (ContentNode source : sourceTree) {
            ContentNode copy = source.deepCopy();
            copy.setPath(source.getPath().replace("/" + sourceLocale + "/", "/" + targetLocale + "/"));
            copy.setLocale(targetLocale);
            copy.setStatus(NodeStatus.DRAFT);

            // Mark translatable properties
            Map<String, Object> props = copy.getProperties();
            markAsUntranslated(props, getTranslatableFields(source.getResourceType()));

            targetTree.add(copy);
        }

        nodeRepository.saveAll(targetTree);

        // Optionally auto-translate
        if (method == TranslationMethod.MACHINE) {
            return machineTranslate(targetTree, sourceLocale, targetLocale);
        } else if (method == TranslationMethod.VENDOR) {
            return createTranslationJob(sourceTree, targetTree, sourceLocale, targetLocale);
        }

        return LanguageCopyResult.success(targetPath, targetTree.size());
    }

    /**
     * Export content for external translation (XLIFF format).
     */
    public byte[] exportXliff(String path, String sourceLocale, String targetLocale) {
        List<ContentNode> nodes = nodeRepository.findByPathDescendants(path);
        XliffDocument xliff = new XliffDocument(sourceLocale, targetLocale);

        for (ContentNode node : nodes) {
            Map<String, String> translatableFields = extractTranslatableText(node);
            for (Map.Entry<String, String> field : translatableFields.entrySet()) {
                xliff.addUnit(
                    node.getPath() + "#" + field.getKey(),
                    field.getValue(),
                    null // target text (empty for new translations)
                );
            }
        }

        return xliff.toBytes();
    }

    /**
     * Import translated content from XLIFF.
     */
    @Transactional
    public ImportResult importXliff(byte[] xliffData, String targetLocale) {
        XliffDocument xliff = XliffDocument.parse(xliffData);
        int updated = 0;

        for (XliffUnit unit : xliff.getUnits()) {
            String[] parts = unit.getId().split("#");
            String nodePath = parts[0];
            String propertyName = parts[1];

            ContentNode node = nodeRepository.findByPath(nodePath).orElse(null);
            if (node != null && unit.getTarget() != null) {
                node.setProperty(propertyName, unit.getTarget());
                nodeRepository.save(node);
                updated++;
            }
        }

        return new ImportResult(updated, xliff.getUnits().size());
    }
}
```

### 2.3 i18n Dictionary Service

For UI labels, error messages, and other non-content strings:

```java
@Service
public class I18nService {

    @Autowired
    private I18nDictionaryRepository dictionaryRepo;

    private final Map<String, ResourceBundle> bundleCache = new ConcurrentHashMap<>();

    /**
     * Translate a key for a given locale.
     * Falls back: exact locale -> language -> site default -> key itself
     */
    public String translate(String key, Locale locale) {
        return translate(key, locale, null);
    }

    public String translate(String key, Locale locale, Map<String, Object> params) {
        // Lookup chain: fr_CA -> fr -> en -> key
        String value = dictionaryRepo.findTranslation(key, locale.toString());
        if (value == null) {
            value = dictionaryRepo.findTranslation(key, locale.getLanguage());
        }
        if (value == null) {
            value = dictionaryRepo.findTranslation(key, "en"); // fallback
        }
        if (value == null) {
            return key; // return key as-is if no translation found
        }

        // Interpolate parameters: "Hello {name}" -> "Hello World"
        if (params != null) {
            for (Map.Entry<String, Object> param : params.entrySet()) {
                value = value.replace("{" + param.getKey() + "}", String.valueOf(param.getValue()));
            }
        }

        return value;
    }
}
```

### 2.4 Translation Connector SPI

External translation services integrate via a plugin SPI:

```java
public interface TranslationConnector {
    String getProviderId();  // "google-translate", "deepl", "smartling"

    TranslationResult translate(
        List<TranslationUnit> units,
        String sourceLocale,
        String targetLocale
    );

    TranslationJobStatus getJobStatus(String jobId);
    TranslationResult getJobResult(String jobId);
}

// Example: DeepL connector
@Component
public class DeepLTranslationConnector implements TranslationConnector {

    @Value("${flexcms.translation.deepl.api-key}")
    private String apiKey;

    @Override
    public String getProviderId() { return "deepl"; }

    @Override
    public TranslationResult translate(List<TranslationUnit> units, String src, String target) {
        // Call DeepL API...
    }
}
```

---

## 3. Multi-Site Management UI

### 3.1 Site Admin APIs

```java
@RestController
@RequestMapping("/api/admin/sites")
@PreAuthorize("hasRole('SITE_ADMIN')")
public class SiteAdminController {

    @PostMapping
    public Site createSite(@RequestBody CreateSiteRequest request) {
        // Creates site config, content root, DAM folder, and config tree
    }

    @GetMapping
    public List<SiteSummary> listSites() {
        // List all sites with status, page count, last modified
    }

    @PutMapping("/{siteId}/domains")
    public Site updateDomains(@PathVariable String siteId, @RequestBody List<DomainMapping> domains) {
        // Update domain mappings
    }

    @PostMapping("/{siteId}/languages/{locale}")
    public LanguageCopyResult addLanguage(
        @PathVariable String siteId,
        @PathVariable String locale,
        @RequestParam(defaultValue = "COPY") TranslationMethod method
    ) {
        // Add a new language to the site (creates full language copy)
    }

    @PostMapping("/{siteId}/blueprint")
    public Site createFromBlueprint(
        @PathVariable String siteId,
        @RequestBody BlueprintRequest blueprint
    ) {
        // Create a new site from an existing site blueprint/template
    }
}
```

### 3.2 Blueprint / Site Templates

```json
{
  "name": "corporate-blueprint",
  "title": "Corporate Website Blueprint",
  "description": "Standard corporate website with homepage, about, products, contact",
  "structure": {
    "pages": [
      {"path": "homepage", "template": "marketing-landing-page", "title": "Home"},
      {"path": "about", "template": "content-page", "title": "About Us", "children": [
        {"path": "team", "template": "team-page", "title": "Our Team"},
        {"path": "careers", "template": "listing-page", "title": "Careers"}
      ]},
      {"path": "products", "template": "listing-page", "title": "Products"},
      {"path": "contact", "template": "form-page", "title": "Contact Us"},
      {"path": "blog", "template": "blog-listing", "title": "Blog"}
    ],
    "damFolders": ["images", "videos", "documents", "logos"],
    "configurations": {
      "allowedTemplates": ["marketing-landing-page", "content-page", "listing-page", "form-page", "blog-listing", "blog-post"],
      "defaultWorkflow": "standard-publish",
      "cdnEnabled": true
    }
  }
}
```
