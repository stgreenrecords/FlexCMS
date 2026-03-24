# Content Model & Component Framework

## 1. Content Tree Structure

All content is organized as a hierarchical tree, inspired by JCR (Java Content Repository) but implemented on PostgreSQL with the `ltree` extension for efficient path queries.

### 1.1 Node Hierarchy

```
/
├── content/                          # All site content lives here
│   ├── site-a/                       # Site tenant root
│   │   ├── en/                       # Language root
│   │   │   ├── homepage              # Page node (resource_type: "flexcms/page")
│   │   │   │   ├── jcr:content       # Page properties container
│   │   │   │   │   ├── hero          # Component node (resource_type: "myapp/hero-banner")
│   │   │   │   │   ├── main          # Parsys/Container (resource_type: "flexcms/container")
│   │   │   │   │   │   ├── text-1    # Component (resource_type: "flexcms/rich-text")
│   │   │   │   │   │   ├── image-1   # Component (resource_type: "flexcms/image")
│   │   │   │   │   │   └── cta-1     # Component (resource_type: "myapp/call-to-action")
│   │   │   │   │   └── footer        # Component (resource_type: "flexcms/footer")
│   │   │   ├── about/                # Another page
│   │   │   └── products/             # Page with children
│   │   │       ├── product-a/
│   │   │       └── product-b/
│   │   └── fr/                       # French language copy
│   └── site-b/                       # Another site tenant
├── conf/                             # Configuration
│   ├── site-a/
│   │   ├── templates/                # Allowed templates for this site
│   │   ├── policies/                 # Component policies (allowed components per container)
│   │   └── settings/                 # Site settings (CDN, analytics, etc.)
│   └── site-b/
├── dam/                              # Digital Asset Manager root
│   ├── site-a/
│   │   ├── images/
│   │   ├── videos/
│   │   └── documents/
│   └── shared/                       # Cross-site shared assets
└── etc/                              # System config
    ├── components/                   # Component registry
    ├── templates/                    # Template definitions
    └── workflows/                    # Workflow definitions
```

---

## 2. Content Node Data Model

### 2.1 Core Node Entity

```java
@Entity
@Table(name = "content_nodes")
public class ContentNode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Path in the content tree: "content.site_a.en.homepage.jcr_content.hero"
    @Column(name = "path", columnDefinition = "ltree", unique = true, nullable = false)
    private String path;

    // Human-readable name (last segment of path)
    @Column(name = "name", nullable = false)
    private String name;

    // Component type identifier: "flexcms/hero-banner", "myapp/custom-widget"
    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    // Parent node path
    @Column(name = "parent_path", columnDefinition = "ltree")
    private String parentPath;

    // Ordering among siblings
    @Column(name = "order_index")
    private Integer orderIndex;

    // Content properties stored as JSONB for flexibility
    @Column(name = "properties", columnDefinition = "jsonb")
    private Map<String, Object> properties;

    // Versioning
    @Column(name = "version")
    private Long version;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private NodeStatus status; // DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED

    // Audit
    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "modified_by")
    private String modifiedBy;

    @Column(name = "modified_at")
    private Instant modifiedAt;

    // Site and language context
    @Column(name = "site_id")
    private String siteId;

    @Column(name = "locale")
    private String locale;
}
```

### 2.2 Node Properties (JSONB)

Properties are stored as JSONB, allowing each component type to define its own schema:

```json
{
  "jcr:title": "Welcome to Our Site",
  "jcr:description": "Homepage of Site A",
  "heroImage": "/dam/site-a/images/hero-bg.jpg",
  "heroText": "<p>Discover amazing things</p>",
  "ctaLabel": "Learn More",
  "ctaLink": "/content/site-a/en/about",
  "backgroundColor": "#ffffff",
  "analytics:trackingId": "hero-cta-main"
}
```

### 2.3 Version History

```java
@Entity
@Table(name = "content_node_versions")
public class ContentNodeVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "node_id")
    private UUID nodeId;

    @Column(name = "version_number")
    private Long versionNumber;

    @Column(name = "properties", columnDefinition = "jsonb")
    private Map<String, Object> properties;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "version_label")
    private String versionLabel; // e.g., "1.0", "published-2024-01-15"
}
```

---

## 3. Component Framework

### 3.1 Component Definition

Every component in FlexCMS is defined by three artifacts:

```
my-component/
├── component.json           # Component metadata and dialog definition
├── MyComponentModel.java    # Backend Component Model (data logic)
└── my-component.html        # Thymeleaf template (SSR rendering)
    OR
└── MyComponent.tsx          # React component (headless rendering)
```

### 3.2 Component Metadata (`component.json`)

```json
{
  "name": "hero-banner",
  "title": "Hero Banner",
  "group": "Marketing",
  "description": "Full-width hero banner with image, text, and CTA",
  "icon": "image",
  "resourceType": "myapp/hero-banner",
  "allowedParents": ["flexcms/container", "flexcms/page-content"],
  "category": "content",

  "dialog": {
    "tabs": [
      {
        "title": "Content",
        "fields": [
          {
            "name": "title",
            "type": "text",
            "label": "Title",
            "required": true,
            "maxLength": 120,
            "placeholder": "Enter hero title..."
          },
          {
            "name": "subtitle",
            "type": "richtext",
            "label": "Subtitle",
            "toolbar": ["bold", "italic", "link"]
          },
          {
            "name": "backgroundImage",
            "type": "asset-picker",
            "label": "Background Image",
            "required": true,
            "mimeTypes": ["image/jpeg", "image/png", "image/webp"]
          },
          {
            "name": "ctaLabel",
            "type": "text",
            "label": "CTA Button Label"
          },
          {
            "name": "ctaLink",
            "type": "path-picker",
            "label": "CTA Link",
            "rootPath": "/content"
          }
        ]
      },
      {
        "title": "Style",
        "fields": [
          {
            "name": "theme",
            "type": "select",
            "label": "Theme",
            "options": [
              {"value": "light", "label": "Light"},
              {"value": "dark", "label": "Dark"},
              {"value": "gradient", "label": "Gradient"}
            ],
            "default": "light"
          },
          {
            "name": "height",
            "type": "select",
            "label": "Height",
            "options": [
              {"value": "small", "label": "Small (300px)"},
              {"value": "medium", "label": "Medium (500px)"},
              {"value": "full", "label": "Full Viewport"}
            ],
            "default": "medium"
          },
          {
            "name": "cssClasses",
            "type": "tags",
            "label": "Additional CSS Classes"
          }
        ]
      }
    ]
  },

  "policies": {
    "maxInstances": 1,
    "editPermissions": ["content-author", "admin"]
  }
}
```

### 3.3 Component Model (Backend Logic)

The Component Model is a Java/Kotlin class that encapsulates all backend logic for a component. Each authored property is declared as a **class field** annotated with `@ValueMapValue`. The framework automatically injects values from the content node's JSONB properties.

Component models have full access to Spring beans, services, external APIs — **no limits on customization**.

#### Annotations:

| Annotation | Purpose |
|---|---|
| `@ValueMapValue` | Inject a property from node's JSONB map |
| `@Self` | Inject the ContentNodeData or RenderContext |
| `@ChildResource` | Inject child nodes |
| `@Autowired` | Inject Spring services (standard DI) |

#### Field-Injection Style (Recommended):

```java
@FlexCmsComponent(resourceType = "myapp/hero-banner", title = "Hero Banner", group = "Marketing")
public class HeroBannerModel extends AbstractComponentModel {

    // --- Content properties (injected from node JSONB) ---

    @ValueMapValue
    private String title;

    @ValueMapValue
    private String subtitle;

    @ValueMapValue(name = "backgroundImage")
    private String backgroundImagePath;

    @ValueMapValue
    private String ctaLabel;

    @ValueMapValue
    private String ctaLink;

    @ValueMapValue(name = "theme")
    private String theme = "light";        // default value if property not authored

    @ValueMapValue(name = "height")
    private String height = "medium";

    // --- Context (injected by framework) ---

    @Self
    private ContentNodeData resource;      // the current content node

    @Self
    private RenderContext context;         // site, locale, request info

    // --- Spring services (injected via standard DI) ---

    @Autowired
    private DamService damService;

    @Autowired
    private I18nService i18nService;

    @Autowired
    private ExternalProductApi productApi;

    // --- Post-injection hook for derived/computed values ---

    @Override
    protected void postInject() {
        // Resolve i18n fallback for CTA label
        if (ctaLabel == null) {
            ctaLabel = i18nService.translate("cta.default", context.getLocale());
        }
    }

    // --- Derived getters (auto-exported to model alongside @ValueMapValue fields) ---

    /** DAM-resolved desktop hero image URL */
    public String getImageUrl() {
        if (backgroundImagePath == null) return null;
        return damService.getAsset(backgroundImagePath)
                .getRenditionUrl("hero-desktop"); // 1920px
    }

    /** DAM-resolved mobile hero image URL */
    public String getImageMobileUrl() {
        if (backgroundImagePath == null) return null;
        return damService.getAsset(backgroundImagePath)
                .getRenditionUrl("hero-mobile"); // 768px
    }

    /** Alt text from DAM asset metadata */
    public String getImageAlt() {
        if (backgroundImagePath == null) return "";
        return damService.getAsset(backgroundImagePath)
                .getMetadata("alt", "");
    }

    /** Resolved public URL for CTA link */
    public String getCtaUrl() {
        return context.resolveLink(ctaLink);
    }

    /** External API call: featured product for the current site */
    public Object getFeaturedProduct() {
        return productApi.getFeaturedProduct(context.getSiteId());
    }

    // --- Cache key (optional override) ---

    @Override
    public String getCacheKey(ContentNodeData node, RenderContext context) {
        return node.getPath() + ":" + context.getLocale() + ":" + node.getVersion();
    }
}
```

**How it works:**
1. Spring creates the bean as a singleton, injecting `@Autowired` services
2. Per request, the framework calls `adapt(node, context)` on `AbstractComponentModel`
3. `@ValueMapValue` fields are populated from `node.getProperties()` (JSONB)
4. `@Self` fields receive the `ContentNodeData` and `RenderContext`
5. `@ChildResource` fields receive child nodes (for container components)
6. `postInject()` runs for custom initialization logic
7. The model map is built by collecting all `@ValueMapValue` field values + derived getter return values

**Output model map** (auto-generated from fields + getters):
```json
{
  "title": "Welcome to Our Site",
  "subtitle": "<p>Discover amazing things</p>",
  "theme": "dark",
  "height": "full",
  "ctaLabel": "Learn More",
  "ctaLink": "/content/site-a/en/about",
  "imageUrl": "https://cdn.example.com/renditions/uuid/hero-desktop.webp",
  "imageMobileUrl": "https://cdn.example.com/renditions/uuid/hero-mobile.webp",
  "imageAlt": "Hero background",
  "ctaUrl": "/about",
  "featuredProduct": { "name": "Product X", "price": 99.99 }
}
```

#### Programmatic Style (Advanced — Full Manual Control):

For components that need complete control over the model construction, implement `ComponentModel` directly:

```java
@FlexCmsComponent(resourceType = "myapp/dynamic-feed", title = "Dynamic Feed", group = "Content")
public class DynamicFeedModel implements ComponentModel {

    @Autowired
    private ExternalFeedService feedService;

    @Override
    public Map<String, Object> adapt(ContentNodeData node, RenderContext context) {
        String feedUrl = node.getProperty("feedUrl", String.class);
        int maxItems = node.getProperty("maxItems", 10);

        return Map.of(
            "items", feedService.fetch(feedUrl, maxItems),
            "layout", node.getProperty("layout", "list"),
            "lastFetched", Instant.now().toString()
        );
    }
}
```

### 3.4 Component Template (SSR - Thymeleaf)

```html
<!-- templates/components/myapp/hero-banner.html -->
<section th:classappend="${'hero hero--' + model.theme + ' hero--' + model.height}"
         data-component="hero-banner">

    <picture class="hero__background">
        <source media="(max-width: 768px)" th:srcset="${model.imageMobileUrl}"/>
        <img th:src="${model.imageUrl}" th:alt="${model.imageAlt}" loading="eager"/>
    </picture>

    <div class="hero__content">
        <h1 class="hero__title" th:text="${model.title}">Hero Title</h1>
        <div class="hero__subtitle" th:utext="${model.subtitle}">Subtitle here</div>

        <a th:if="${model.ctaUrl}"
           th:href="${model.ctaUrl}"
           th:text="${model.ctaLabel}"
           class="hero__cta btn btn--primary">
            Learn More
        </a>
    </div>
</section>
```

### 3.5 Component for Headless (React/JSON)

For headless delivery, the Component Model output is directly serialized as JSON:

```json
{
  "resourceType": "myapp/hero-banner",
  "properties": {
    "title": "Welcome to Our Site",
    "subtitle": "<p>Discover amazing things</p>",
    "theme": "dark",
    "height": "full",
    "imageUrl": "https://cdn.example.com/dam/hero-bg.1920.jpg",
    "imageMobileUrl": "https://cdn.example.com/dam/hero-bg.768.jpg",
    "imageAlt": "Hero background",
    "ctaLabel": "Learn More",
    "ctaUrl": "/about",
    "featuredProduct": {
      "name": "Product X",
      "price": 99.99
    }
  }
}
```

---

## 4. Template Framework

### 4.1 Template Definition

Templates define the page structure — which components are fixed, which zones are editable, and what components are allowed.

```json
{
  "name": "marketing-landing-page",
  "title": "Marketing Landing Page",
  "description": "Full-width landing page with hero, content zones, and footer",
  "thumbnail": "/etc/templates/thumbnails/marketing-landing.png",
  "allowedSites": ["site-a", "site-b"],
  "resourceType": "flexcms/page",

  "structure": {
    "children": [
      {
        "name": "header",
        "resourceType": "flexcms/shared-header",
        "locked": true,
        "configPath": "/conf/${siteId}/components/header"
      },
      {
        "name": "hero",
        "resourceType": "flexcms/container",
        "policy": "hero-zone",
        "allowedComponents": ["myapp/hero-banner", "myapp/video-hero"],
        "maxChildren": 1
      },
      {
        "name": "main",
        "resourceType": "flexcms/container",
        "policy": "main-content",
        "allowedComponents": [
          "flexcms/rich-text",
          "flexcms/image",
          "flexcms/two-column",
          "flexcms/three-column",
          "myapp/product-carousel",
          "myapp/testimonial-grid",
          "myapp/call-to-action",
          "myapp/form-container"
        ],
        "maxChildren": 20
      },
      {
        "name": "sidebar",
        "resourceType": "flexcms/container",
        "policy": "sidebar-widgets",
        "allowedComponents": ["myapp/sidebar-nav", "myapp/related-content"],
        "maxChildren": 5,
        "optional": true
      },
      {
        "name": "footer",
        "resourceType": "flexcms/shared-footer",
        "locked": true,
        "configPath": "/conf/${siteId}/components/footer"
      }
    ]
  },

  "initialContent": {
    "hero": {
      "children": [
        {
          "resourceType": "myapp/hero-banner",
          "properties": {
            "title": "Page Title",
            "theme": "light",
            "height": "medium"
          }
        }
      ]
    }
  },

  "pageProperties": {
    "tabs": [
      {
        "title": "Basic",
        "fields": [
          {"name": "jcr:title", "type": "text", "label": "Page Title", "required": true},
          {"name": "jcr:description", "type": "textarea", "label": "Meta Description"},
          {"name": "navTitle", "type": "text", "label": "Navigation Title"},
          {"name": "hideInNav", "type": "checkbox", "label": "Hide in Navigation"}
        ]
      },
      {
        "title": "SEO",
        "fields": [
          {"name": "seo:canonicalUrl", "type": "text", "label": "Canonical URL"},
          {"name": "seo:robots", "type": "select", "label": "Robots", "options": [
            {"value": "index,follow", "label": "Index, Follow"},
            {"value": "noindex,nofollow", "label": "No Index, No Follow"}
          ]},
          {"name": "seo:ogImage", "type": "asset-picker", "label": "OG Image"}
        ]
      },
      {
        "title": "Advanced",
        "fields": [
          {"name": "vanityUrl", "type": "text", "label": "Vanity URL"},
          {"name": "redirectTarget", "type": "path-picker", "label": "Redirect Target"},
          {"name": "clientLibs", "type": "tags", "label": "Additional Client Libraries"},
          {"name": "customCss", "type": "code", "label": "Custom CSS", "language": "css"},
          {"name": "customJs", "type": "code", "label": "Custom JavaScript", "language": "javascript"}
        ]
      }
    ]
  }
}
```

### 4.2 Page Resolution Pipeline

```
HTTP Request: GET /about-us
      |
      v
[1. URL Mapping] -> resolve vanity URLs, redirects, short URLs
      |
      v
[2. Site Resolution] -> determine site context from domain/path
      |
      v
[3. Language Resolution] -> determine locale from path/cookie/header
      |
      v
[4. Content Tree Lookup] -> find node at /content/site-a/en/about-us
      |
      v
[5. Template Resolution] -> load template definition for the page
      |
      v
[6. Component Tree Build] -> recursively build component tree
      |
      v
[7. ComponentModel Adaptation] -> each component's model.adapt() called
      |
      v
[8. Template Rendering] -> Thymeleaf renders HTML (or JSON for headless)
      |
      v
[9. Post-Processing] -> link rewriting, CDN URL injection, minification
      |
      v
HTTP Response (with cache headers)
```

---

## 5. Plugin / Extension SPI

### 5.1 Registering a Custom Component

```java
@FlexCmsComponent(
    resourceType = "myapp/product-carousel",
    title = "Product Carousel",
    group = "Commerce",
    dialog = "classpath:components/product-carousel/dialog.json"
)
public class ProductCarouselModel extends AbstractComponentModel {

    // --- Content properties (injected from JSONB) ---

    @ValueMapValue
    private String categoryId;

    @ValueMapValue
    private int maxItems = 8;

    @ValueMapValue
    private String layout = "carousel";

    @ValueMapValue
    private boolean showPrices = true;

    // --- Spring services ---

    @Autowired
    private ProductCatalogService catalogService;

    // --- Derived getters (auto-exported) ---

    public List<Product> getProducts() {
        return catalogService.getByCategory(categoryId, maxItems);
    }
}
```

### 5.2 Registering Custom Services

```java
@Service
public class ProductCatalogService {

    @Autowired
    private RestTemplate restTemplate;

    @Cacheable(value = "products", key = "#categoryId + ':' + #limit")
    public List<Product> getByCategory(String categoryId, int limit) {
        // Full access to any Spring beans, external APIs, databases
        return restTemplate.getForObject(
            "https://api.commerce.com/products?category={cat}&limit={lim}",
            ProductListResponse.class, categoryId, limit
        ).getProducts();
    }
}
```

### 5.3 Custom Workflow Steps

```java
@FlexCmsWorkflowStep(name = "legal-review")
public class LegalReviewStep implements WorkflowStep {

    @Autowired
    private NotificationService notifications;

    @Override
    public WorkflowResult execute(WorkflowContext ctx) {
        ContentNode node = ctx.getContentNode();
        // Check if content contains legal-sensitive terms
        // Notify legal team
        notifications.send("legal-team@company.com",
            "Content review needed: " + node.getPath());
        return WorkflowResult.waiting("Pending legal review");
    }
}
```

---

## 6. Container / Parsys (Paragraph System)

The Container component is the key building block that enables drag-and-drop authoring:

```json
{
  "name": "container",
  "resourceType": "flexcms/container",
  "title": "Layout Container",
  "isContainer": true,

  "dialog": {
    "tabs": [{
      "title": "Layout",
      "fields": [
        {
          "name": "layout",
          "type": "select",
          "label": "Layout",
          "options": [
            {"value": "single", "label": "Single Column"},
            {"value": "two-equal", "label": "Two Equal Columns"},
            {"value": "two-thirds-one-third", "label": "2/3 + 1/3"},
            {"value": "three-equal", "label": "Three Equal Columns"},
            {"value": "grid-2x2", "label": "2x2 Grid"}
          ]
        }
      ]
    }]
  }
}
```

Authors drag components into containers. Each container enforces its policy (allowed components, max children). Containers can be nested for complex layouts.
