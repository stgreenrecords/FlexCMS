# Static Site Compilation (Warm-Up Build Pipeline)

## 1. Problem Statement

In the current architecture, every page request follows this flow:

```
Browser → CDN (miss) → Next.js/Nuxt SSR → @flexcms/sdk → FlexCMS API (JSON) → Render HTML → CDN caches
```

This means the **first visitor** to any page after publish/cache-eviction pays the full latency cost: SDK fetch + JSON resolution + component rendering + HTML serialization. For enterprise sites with thousands of pages, this creates:

- **Cold-start penalty** after every deployment or content change
- **Unpredictable TTFB** for real users
- **Unnecessary compute** — the same page is re-rendered on every cache miss even though content hasn't changed

## 2. Solution: Ahead-of-Time Static Compilation

When content is published (replication event), a **build worker** pre-renders the affected pages into static HTML + JS + CSS + images and uploads the output to S3-compatible object storage. The CDN serves these pre-built artifacts directly — **zero server-side rendering at request time**.

```
                                   AUTHORING TIME
                                   ─────────────
Author publishes page
        │
        ▼
  ReplicationEvent (RabbitMQ)
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
  Publish DB updated                   Static Build Worker
  (existing flow)                      (new: consumes same events)
                                               │
                                               ▼
                                       ┌───────────────────┐
                                       │  Render Engine     │
                                       │  (Headless browser │
                                       │   or Next.js export│
                                       │   or custom SSG)   │
                                       └───────┬───────────┘
                                               │
                                               ▼
                                       ┌───────────────────┐
                                       │  Static Output     │
                                       │  HTML + JS + CSS   │
                                       │  + images          │
                                       └───────┬───────────┘
                                               │
                                               ▼
                                       ┌───────────────────┐
                                       │  S3 Static Bucket  │
                                       │  (versioned,       │
                                       │   per-site prefix) │
                                       └───────┬───────────┘
                                               │
                                               ▼
                                       ┌───────────────────┐
                                       │  CDN Origin = S3   │
                                       │  (immediate serve) │
                                       └───────────────────┘

                                   REQUEST TIME
                                   ────────────
Browser → CDN → S3 (pre-built HTML) → instant response
                 (no SSR, no API call, no rendering)
```

## 3. Incremental Compilation (Only Changed Pages)

The build worker does **not** rebuild the entire site on every publish. It tracks what changed and only recompiles affected pages.

### 3.1 Compilation Granularity

| Replication Event Type | What Gets Recompiled |
|---|---|
| Single page published | That page only |
| Component on a page changed | The page containing that component |
| Shared component (header/footer) changed | All pages in the site that include it |
| Navigation structure changed | All pages (nav is global) |
| Asset replaced (same path) | All pages that reference that asset |
| Site-wide config changed (theme, etc.) | Full site rebuild |
| Tree activation | All pages in the subtree |

### 3.2 Dependency Graph

The build worker maintains a **dependency graph** per site:

```
Page "/about"
  ├── depends on: component "flexcms/shared-header"
  ├── depends on: component "flexcms/shared-footer"  
  ├── depends on: asset "/dam/corporate/images/hero.jpg"
  ├── depends on: navigation tree
  └── depends on: site config (theme, locale)

When "flexcms/shared-header" is republished:
  → Find all pages that depend on it
  → Recompile only those pages
```

This graph is stored in Redis (fast lookups) and backed by a PostgreSQL table (durability).

## 4. Storage Architecture

### 4.1 S3 Bucket Structure

```
s3://flexcms-static/
├── sites/
│   ├── corporate/
│   │   ├── en/
│   │   │   ├── index.html                    # homepage
│   │   │   ├── about/index.html              # /about
│   │   │   ├── products/index.html           # /products
│   │   │   ├── products/widget-x/index.html  # /products/widget-x
│   │   │   └── ...
│   │   ├── de/
│   │   │   ├── index.html
│   │   │   └── ...
│   │   └── _assets/                          # site-specific compiled JS/CSS
│   │       ├── main.[hash].js
│   │       ├── main.[hash].css
│   │       └── chunks/
│   ├── brand-b/
│   │   └── ...
│   └── ...
├── _shared/                                   # cross-site shared assets
│   ├── fonts/
│   └── icons/
└── _meta/
    ├── corporate/
    │   ├── manifest.json                      # build manifest (page → hash mapping)
    │   ├── dependency-graph.json              # component/asset → page dependencies
    │   └── build-log.json                     # last build timestamps per page
    └── ...
```

### 4.2 Build Manifest (`manifest.json`)

```json
{
  "siteId": "corporate",
  "locale": "en",
  "builtAt": "2026-03-24T12:00:00Z",
  "pages": {
    "/": { "hash": "a1b2c3d4", "builtAt": "2026-03-24T12:00:00Z", "contentVersion": 42 },
    "/about": { "hash": "e5f6a7b8", "builtAt": "2026-03-24T11:55:00Z", "contentVersion": 15 },
    "/products": { "hash": "c9d0e1f2", "builtAt": "2026-03-24T11:30:00Z", "contentVersion": 8 }
  },
  "assets": {
    "main.js": "main.f8e7d6c5.js",
    "main.css": "main.a1b2c3d4.css"
  }
}
```

### 4.3 Serving Strategy

```
CDN Configuration:
  Origin:  s3://flexcms-static/sites/{siteId}/{locale}/
  
  Routing rules:
    /                      → index.html
    /about                 → about/index.html
    /products/widget-x     → products/widget-x/index.html
    /_assets/*             → _assets/* (immutable, max-age=1yr)
    
  Headers:
    HTML:   Cache-Control: public, max-age=0, s-maxage=31536000, must-revalidate
    JS/CSS: Cache-Control: public, max-age=31536000, immutable
    
  Fallback:
    If S3 returns 404 → fall through to Next.js/Nuxt SSR (dynamic fallback)
```

## 5. Build Worker Architecture

### 5.1 Worker Process

The build worker is a **separate deployable** — a Node.js service that:
1. Consumes `ReplicationEvent` messages from a dedicated RabbitMQ queue
2. Determines which pages need recompilation (via dependency graph)
3. Calls the FlexCMS Headless API to get page JSON
4. Renders HTML using the same `@flexcms/react` (or Vue/Angular) components
5. Extracts and bundles JS/CSS assets
6. Uploads output to S3
7. Invalidates CDN cache for affected URLs
8. Updates the build manifest

```
┌─────────────────────────────────────────────────────────┐
│  Static Build Worker (Node.js)                           │
│                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ Event        │  │ Dependency    │  │ Render        │ │
│  │ Consumer     │→ │ Resolver      │→ │ Engine        │ │
│  │ (RabbitMQ)   │  │ (what pages?) │  │ (React SSG)  │ │
│  └──────────────┘  └───────────────┘  └──────┬───────┘ │
│                                               │         │
│  ┌──────────────┐  ┌───────────────┐  ┌──────▼───────┐ │
│  │ CDN Purge    │← │ Manifest      │← │ S3 Uploader  │ │
│  │ Trigger      │  │ Updater       │  │              │ │
│  └──────────────┘  └───────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Render Strategies

The build worker supports multiple render strategies:

| Strategy | Technology | When to Use |
|---|---|---|
| **Next.js Static Export** | `next build && next export` | React sites — full Next.js feature set |
| **Nuxt Static Generation** | `nuxt generate` | Vue sites — full Nuxt feature set |
| **Custom SSG via SDK** | `@flexcms/sdk` + `ReactDOMServer` | Lightweight, no Next.js overhead |
| **Headless Browser** | Playwright/Puppeteer | Universal — renders any framework output |

The default strategy is **Custom SSG via SDK** for maximum control and speed:

```typescript
// build-worker: render a single page to static HTML
async function renderPage(pagePath: string, site: string, locale: string): Promise<StaticOutput> {
  // 1. Fetch page JSON from FlexCMS API
  const client = new FlexCmsClient({ apiUrl: FLEXCMS_API_URL });
  const pageData = await client.getPage(pagePath, { site, locale });

  // 2. Render React component tree to HTML string
  const html = ReactDOMServer.renderToString(
    <FlexCmsProvider client={client} componentMap={siteComponentMap}>
      <FlexCmsPage pageData={pageData} />
    </FlexCmsProvider>
  );

  // 3. Wrap in full HTML document with <head>, CSS, JS references
  const fullHtml = wrapInDocument(html, pageData, site, locale);

  // 4. Return output
  return { html: fullHtml, path: pagePath, contentVersion: pageData.page.lastModified };
}
```

### 5.3 Concurrency & Rate Limiting

- Build worker processes pages in **parallel** (configurable concurrency, default: 4)
- Large tree activations (1000+ pages) are queued and processed in batches
- Each site has a **build lock** — only one build per site runs at a time; subsequent events are queued and deduplicated
- Stale builds are detected via content version comparison — if the page version in the manifest matches the published version, skip

## 6. Fallback Strategy (Hybrid Serving)

Not all pages need static compilation. The architecture supports a **hybrid model**:

```
Request arrives at CDN:
  │
  ├─ Static file exists in S3?
  │   YES → Serve from S3 (fastest, 0ms compute)
  │
  └─ NO → Fall through to SSR (Next.js/Nuxt)
           → Render dynamically
           → Optionally trigger async build for this page
```

This handles:
- **Newly created pages** not yet compiled (graceful degradation to SSR)
- **Preview/draft mode** which is always dynamic (never compiled)
- **Personalized content** that varies per user (cannot be statically compiled)
- **Build failures** — SSR acts as safety net

## 7. Database Schema Addition

```sql
-- Build job tracking
CREATE TABLE static_build_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64) NOT NULL REFERENCES sites(site_id),
    locale          VARCHAR(10) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, BUILDING, COMPLETED, FAILED
    trigger_event   VARCHAR(20) NOT NULL,  -- CONTENT_PUBLISH, TREE_PUBLISH, ASSET_CHANGE, FULL_REBUILD
    trigger_path    VARCHAR(2048),
    pages_total     INTEGER DEFAULT 0,
    pages_completed INTEGER DEFAULT 0,
    pages_failed    INTEGER DEFAULT 0,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Per-page build status (the manifest, persisted)
CREATE TABLE static_build_pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64) NOT NULL,
    locale          VARCHAR(10) NOT NULL,
    page_path       VARCHAR(2048) NOT NULL,
    content_version BIGINT NOT NULL,
    output_hash     VARCHAR(64) NOT NULL,
    s3_key          VARCHAR(2048) NOT NULL,
    built_at        TIMESTAMPTZ NOT NULL,
    build_job_id    UUID REFERENCES static_build_jobs(id),
    UNIQUE(site_id, locale, page_path)
);

-- Component → page dependency graph
CREATE TABLE static_build_dependencies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64) NOT NULL,
    locale          VARCHAR(10) NOT NULL,
    page_path       VARCHAR(2048) NOT NULL,
    depends_on_type VARCHAR(20) NOT NULL,  -- COMPONENT, ASSET, NAVIGATION, CONFIG
    depends_on_key  VARCHAR(2048) NOT NULL,
    UNIQUE(site_id, locale, page_path, depends_on_type, depends_on_key)
);

CREATE INDEX idx_build_deps_key ON static_build_dependencies(depends_on_type, depends_on_key);
CREATE INDEX idx_build_pages_site ON static_build_pages(site_id, locale);
```

