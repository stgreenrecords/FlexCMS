# Frontend Libraries (ClientLibs) & Website Deployment

## 1. Client Library Framework

The ClientLib system manages JS and CSS dependencies for components and pages, ensuring correct loading order, minification, bundling, and cache-busting.

### 1.1 ClientLib Definition

Each component or feature can declare a client library:

```json
{
  "name": "myapp.hero-banner",
  "category": "components",
  "dependencies": ["flexcms.core", "flexcms.animations"],
  "embed": ["vendor.swiper"],

  "css": [
    "css/hero-banner.css",
    "css/hero-responsive.css"
  ],
  "js": [
    "js/hero-banner.js",
    "js/hero-animations.js"
  ],

  "preprocessors": {
    "css": "scss",
    "js": "typescript"
  }
}
```

### 1.2 ClientLib Data Model

```java
@Entity
@Table(name = "client_libraries")
public class ClientLibrary {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;           // "myapp.hero-banner"

    private String category;        // "components", "page", "vendor"
    private String version;         // "1.2.0" or auto-computed hash

    @ElementCollection
    private List<String> dependencies;  // Load these first

    @ElementCollection
    private List<String> embeds;        // Inline into this bundle

    @ElementCollection
    @OrderColumn
    private List<String> cssFiles;      // Ordered CSS sources

    @ElementCollection
    @OrderColumn
    private List<String> jsFiles;       // Ordered JS sources

    // Compiled/bundled output
    private String compiledCssKey;      // S3 key for compiled CSS bundle
    private String compiledJsKey;       // S3 key for compiled JS bundle
    private String cssHash;             // Content hash for cache-busting
    private String jsHash;

    private Instant lastCompiled;
    private boolean minified;
}
```

### 1.3 ClientLib Manager Service

```java
@Service
public class ClientLibManager {

    @Autowired
    private ClientLibRepository clientLibRepo;

    @Autowired
    private AssetCompiler assetCompiler;

    @Autowired
    private S3Service s3Service;

    /**
     * Register a new client library from a component plugin.
     */
    public ClientLibrary register(ClientLibDefinition definition) {
        ClientLibrary lib = new ClientLibrary();
        lib.setName(definition.getName());
        lib.setCategory(definition.getCategory());
        lib.setDependencies(definition.getDependencies());
        lib.setEmbeds(definition.getEmbeds());
        lib.setCssFiles(definition.getCss());
        lib.setJsFiles(definition.getJs());

        compile(lib);
        return clientLibRepo.save(lib);
    }

    /**
     * Compile: preprocess (SCSS/TS) -> concatenate -> minify -> hash -> upload to S3.
     */
    public void compile(ClientLibrary lib) {
        // 1. Compile CSS (SCSS -> CSS -> Autoprefixer -> Minify)
        StringBuilder cssBundle = new StringBuilder();

        // First embed dependencies inline
        for (String embed : lib.getEmbeds()) {
            ClientLibrary embedded = clientLibRepo.findByName(embed);
            if (embedded != null && embedded.getCompiledCssKey() != null) {
                cssBundle.append(s3Service.downloadAsString(embedded.getCompiledCssKey()));
                cssBundle.append("\n");
            }
        }

        // Then append own CSS files
        for (String cssFile : lib.getCssFiles()) {
            String source = loadSourceFile(lib, cssFile);
            if (cssFile.endsWith(".scss")) {
                source = assetCompiler.compileSass(source);
            }
            cssBundle.append(source).append("\n");
        }

        String minCss = assetCompiler.minifyCss(cssBundle.toString());
        String cssHash = DigestUtils.md5Hex(minCss).substring(0, 8);

        // 2. Compile JS (TypeScript -> JS -> Bundle -> Minify)
        StringBuilder jsBundle = new StringBuilder();

        for (String embed : lib.getEmbeds()) {
            ClientLibrary embedded = clientLibRepo.findByName(embed);
            if (embedded != null && embedded.getCompiledJsKey() != null) {
                jsBundle.append(s3Service.downloadAsString(embedded.getCompiledJsKey()));
                jsBundle.append(";\n");
            }
        }

        for (String jsFile : lib.getJsFiles()) {
            String source = loadSourceFile(lib, jsFile);
            if (jsFile.endsWith(".ts")) {
                source = assetCompiler.compileTypeScript(source);
            }
            jsBundle.append(source).append(";\n");
        }

        String minJs = assetCompiler.minifyJs(jsBundle.toString());
        String jsHash = DigestUtils.md5Hex(minJs).substring(0, 8);

        // 3. Upload to S3
        String cssKey = "clientlibs/" + lib.getName() + "." + cssHash + ".css";
        String jsKey = "clientlibs/" + lib.getName() + "." + jsHash + ".js";

        s3Service.upload(cssKey, minCss.getBytes(), "text/css");
        s3Service.upload(jsKey, minJs.getBytes(), "application/javascript");

        // 4. Update library record
        lib.setCompiledCssKey(cssKey);
        lib.setCompiledJsKey(jsKey);
        lib.setCssHash(cssHash);
        lib.setJsHash(jsHash);
        lib.setLastCompiled(Instant.now());
        lib.setMinified(true);
    }

    /**
     * Resolve all client libraries needed for a page (with dependency ordering).
     */
    public List<ClientLibrary> resolveForPage(ContentNode page) {
        Set<String> needed = new LinkedHashSet<>();

        // 1. Always include core
        needed.add("flexcms.core");

        // 2. Collect clientlibs from template
        String template = page.getProperty("template", String.class);
        TemplateDefinition tmpl = templateRegistry.get(template);
        if (tmpl.getClientLibs() != null) {
            needed.addAll(tmpl.getClientLibs());
        }

        // 3. Collect clientlibs from components on the page
        List<ContentNode> components = nodeRepository.findDescendants(page.getPath());
        for (ContentNode comp : components) {
            ComponentDefinition def = componentRegistry.get(comp.getResourceType());
            if (def != null && def.getClientLib() != null) {
                needed.add(def.getClientLib());
            }
        }

        // 4. Page-level custom clientlibs
        List<String> customLibs = page.getProperty("clientLibs", List.class);
        if (customLibs != null) {
            needed.addAll(customLibs);
        }

        // 5. Topological sort by dependencies
        return topologicalSort(needed);
    }

    /**
     * Generate HTML tags for resolved clientlibs.
     */
    public String renderCssTags(List<ClientLibrary> libs) {
        StringBuilder html = new StringBuilder();
        for (ClientLibrary lib : libs) {
            if (lib.getCompiledCssKey() != null) {
                html.append(String.format(
                    "<link rel=\"stylesheet\" href=\"%s/%s\" />\n",
                    cdnBaseUrl, lib.getCompiledCssKey()
                ));
            }
        }
        return html.toString();
    }

    public String renderJsTags(List<ClientLibrary> libs) {
        StringBuilder html = new StringBuilder();
        for (ClientLibrary lib : libs) {
            if (lib.getCompiledJsKey() != null) {
                html.append(String.format(
                    "<script src=\"%s/%s\" defer></script>\n",
                    cdnBaseUrl, lib.getCompiledJsKey()
                ));
            }
        }
        return html.toString();
    }
}
```

### 1.4 Vendor Library Management

```java
@RestController
@RequestMapping("/api/admin/clientlibs")
@PreAuthorize("hasRole('DEVELOPER')")
public class ClientLibAdminController {

    // Add external library from CDN/npm
    @PostMapping("/vendor")
    public ClientLibrary addVendorLibrary(@RequestBody AddVendorLibRequest request) {
        // Supports: npm packages, CDN URLs, uploaded files
        // Example: { "name": "vendor.swiper", "npm": "swiper@11.0.0", "files": ["swiper-bundle.min.js", "swiper-bundle.min.css"] }
        // Example: { "name": "vendor.gsap", "cdn": "https://cdn.jsdelivr.net/npm/gsap@3.12.0/dist/gsap.min.js" }
        return clientLibManager.registerVendor(request);
    }

    // Recompile all client libraries
    @PostMapping("/compile-all")
    public CompileResult compileAll() {
        return clientLibManager.compileAll();
    }

    // List all registered client libraries
    @GetMapping
    public List<ClientLibSummary> listAll() {
        return clientLibManager.listAll();
    }

    // Get dependency graph visualization
    @GetMapping("/dependency-graph")
    public DependencyGraph getDependencyGraph() {
        return clientLibManager.buildDependencyGraph();
    }
}
```

---

## 2. Custom Website Application Deployment

FlexCMS supports deploying full custom web applications that extend the CMS.

### 2.1 Deployment Architecture

```
Developer Workstation
       |
       | git push / deploy CLI
       v
+------------------+
|  Build Pipeline  |
|  (CI/CD)         |
|  - Compile Java  |
|  - Compile SCSS  |
|  - Bundle React  |
|  - Run tests     |
+--------+---------+
         |
    +----v----+
    | Artifact |
    | Registry |
    | (Docker) |
    +----+----+
         |
    +----v----+               +----------+
    | Author  |  Replication  | Publish   |
    | Deploy  +-------------->+ Deploy    |
    | (k8s)   |               | (k8s)    |
    +---------+               +----------+
```

### 2.2 Plugin Deployment Model

Custom applications are deployed as Spring Boot starter modules:

```xml
<!-- Custom app pom.xml -->
<project>
    <parent>
        <groupId>com.flexcms</groupId>
        <artifactId>flexcms-plugin-parent</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>myapp-components</artifactId>

    <dependencies>
        <!-- FlexCMS Plugin API -->
        <dependency>
            <groupId>com.flexcms</groupId>
            <artifactId>flexcms-plugin-api</artifactId>
        </dependency>

        <!-- Custom dependencies -->
        <dependency>
            <groupId>com.stripe</groupId>
            <artifactId>stripe-java</artifactId>
            <version>24.0.0</version>
        </dependency>
    </dependencies>
</project>
```

### 2.3 Custom App Structure

```
myapp-components/
├── src/main/java/com/myapp/
│   ├── components/
│   │   ├── HeroBannerModel.java
│   │   ├── ProductCarouselModel.java
│   │   ├── CheckoutFormModel.java
│   │   └── CustomFooterModel.java
│   ├── services/
│   │   ├── ProductCatalogService.java
│   │   ├── StripePaymentService.java
│   │   └── InventoryService.java
│   ├── workflows/
│   │   ├── LegalReviewStep.java
│   │   └── SeoValidationStep.java
│   ├── schedulers/
│   │   └── PriceUpdateScheduler.java
│   └── config/
│       └── MyAppAutoConfiguration.java
├── src/main/resources/
│   ├── components/
│   │   ├── hero-banner/
│   │   │   ├── component.json         # Dialog definition
│   │   │   └── hero-banner.html       # Thymeleaf template
│   │   ├── product-carousel/
│   │   │   ├── component.json
│   │   │   └── product-carousel.html
│   │   └── checkout-form/
│   │       ├── component.json
│   │       └── checkout-form.html
│   ├── clientlibs/
│   │   ├── myapp.core/
│   │   │   ├── clientlib.json
│   │   │   ├── css/main.scss
│   │   │   └── js/main.ts
│   │   └── myapp.checkout/
│   │       ├── clientlib.json
│   │       ├── css/checkout.scss
│   │       └── js/checkout.ts
│   ├── templates/
│   │   ├── marketing-landing-page.json
│   │   ├── product-detail-page.json
│   │   └── checkout-page.json
│   ├── workflows/
│   │   └── ecommerce-publish.json
│   └── i18n/
│       ├── messages_en.properties
│       ├── messages_fr.properties
│       └── messages_de.properties
└── Dockerfile
```

### 2.4 Docker Deployment

```dockerfile
# Multi-stage build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:resolve
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy FlexCMS core
COPY --from=flexcms-core:latest /app/flexcms-core.jar ./

# Copy custom plugin
COPY --from=builder /app/target/myapp-components.jar ./plugins/

# Startup: FlexCMS with plugin on classpath
ENTRYPOINT ["java", \
  "-cp", "flexcms-core.jar:plugins/*", \
  "-Dflexcms.runmode=${FLEXCMS_RUNMODE}", \
  "-Dspring.profiles.active=${FLEXCMS_RUNMODE}", \
  "com.flexcms.FlexCmsApplication"]
```

### 2.5 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flexcms-author
spec:
  replicas: 2
  selector:
    matchLabels:
      app: flexcms
      tier: author
  template:
    metadata:
      labels:
        app: flexcms
        tier: author
    spec:
      containers:
        - name: flexcms
          image: myregistry/myapp-flexcms:1.0.0
          env:
            - name: FLEXCMS_RUNMODE
              value: "author"
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: flexcms-secrets
                  key: author-db-url
            - name: SPRING_RABBITMQ_HOST
              value: "rabbitmq-service"
            - name: SPRING_REDIS_HOST
              value: "redis-service"
            - name: AWS_S3_BUCKET
              value: "flexcms-dam-prod"
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 30
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flexcms-publish
spec:
  replicas: 5
  selector:
    matchLabels:
      app: flexcms
      tier: publish
  template:
    metadata:
      labels:
        app: flexcms
        tier: publish
    spec:
      containers:
        - name: flexcms
          image: myregistry/myapp-flexcms:1.0.0
          env:
            - name: FLEXCMS_RUNMODE
              value: "publish"
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: flexcms-secrets
                  key: publish-db-url
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"

---
# Ingress with CDN integration
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: flexcms-publish-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/proxy-buffering: "on"
    nginx.ingress.kubernetes.io/proxy-cache-valid: "200 10m"
spec:
  tls:
    - hosts:
        - www.corporate.com
      secretName: corporate-tls
  rules:
    - host: www.corporate.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: flexcms-publish
                port:
                  number: 8080
```

### 2.6 Deployment CLI

```bash
# FlexCMS deployment commands

# Deploy to author environment
flexcms deploy --target author --image myregistry/myapp:1.0.0

# Deploy to publish environment (rolling update)
flexcms deploy --target publish --image myregistry/myapp:1.0.0 --strategy rolling

# Deploy to both (author first, then publish after verification)
flexcms deploy --target all --image myregistry/myapp:1.0.0

# Warm caches after deployment
flexcms cache warm --site corporate

# Verify deployment
flexcms verify --target publish --checks health,content,performance
```

---

## 3. Development Workflow

### 3.1 Local Development

```yaml
# docker-compose.dev.yml
services:
  flexcms:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"    # Author mode
      - "8081:8081"    # Publish mode (preview)
      - "5005:5005"    # Debug port
    environment:
      FLEXCMS_RUNMODE: author
      SPRING_PROFILES_ACTIVE: dev,author
    volumes:
      - ./src:/app/src       # Hot reload
      - ./clientlibs:/app/clientlibs
    depends_on:
      - postgres
      - redis
      - rabbitmq
      - minio
      - elasticsearch

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: flexcms
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"

  elasticsearch:
    image: elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
```

### 3.2 Component Development Hot Reload

```java
@Configuration
@Profile("dev")
public class DevHotReloadConfig {

    /**
     * In dev mode, watch for changes in component templates,
     * clientlib sources, and component.json files.
     * Automatically recompile and refresh.
     */
    @Bean
    public FileWatcher componentFileWatcher() {
        return FileWatcher.builder()
            .watchPaths(List.of(
                "src/main/resources/components",
                "src/main/resources/clientlibs",
                "src/main/resources/templates"
            ))
            .onFileChange(event -> {
                if (event.getPath().endsWith(".json")) {
                    componentRegistry.reload(event.getPath());
                }
                if (event.getPath().endsWith(".html")) {
                    templateEngine.clearCache();
                }
                if (event.getPath().endsWith(".scss") || event.getPath().endsWith(".ts")) {
                    clientLibManager.recompile(event.getLibraryName());
                }
            })
            .build();
    }
}
```
