# FlexCMS - Modern Content Management System Architecture

## 1. Vision

FlexCMS is a modern, headless-first CMS built on Spring Boot (backend) and React (frontend authoring UI). It provides enterprise-grade content management with unlimited extensibility for custom components, templates, and backend logic — while maintaining simplicity for content authors.

---

## 2. High-Level Architecture

```
                        +---------------------+
                        |     CDN Layer        |
                        | (CloudFront/Akamai/  |
                        |  Cloudflare/Fastly)  |
                        +----------+----------+
                                   |
                    +--------------+--------------+
                    |                             |
          +---------v--------+          +---------v--------+
          |  Publish Cluster |          |  Headless API    |
          |  (Read-Only)     |          |  (GraphQL/REST)  |
          |  - SSR Renderer  |          |  - Content API   |
          |  - Page Resolver |          |  - Asset API     |
          |  - Template Eng. |          |  - Search API    |
          +--------+---------+          +---------+--------+
                   |                              |
                   +----------+-------------------+
                              |
                    +---------v---------+
                    |  Content Store    |
                    |  (PostgreSQL)     |
                    |  - Content Repo   |
                    |  - Version Store  |
                    |  - Workflow State |
                    +---------+---------+
                              ^
                              |  Replication
                    +---------+---------+
                    |  Author Cluster   |
                    |  (Read-Write)     |
                    |  - Authoring UI   |
                    |  - Workflow Eng.  |
                    |  - Preview Render |
                    |  - Component Reg. |
                    +-------------------+

          +-------------------+     +-------------------+
          |  DAM Service      |     |  Search Service   |
          |  - Asset Ingest   |     |  (Elasticsearch)  |
          |  - Renditions     |     |                   |
          |  - Metadata       |     |                   |
          |  - S3/Blob Store  |     |                   |
          +-------------------+     +-------------------+
```

---

## 3. Core Design Principles

### 3.1 Separation of Author and Publish
- **Author environment**: Read-write, handles content creation, workflows, previews
- **Publish environment**: Read-only, optimized for delivery, horizontally scalable
- Content flows from Author -> Publish via an async replication queue (RabbitMQ/Kafka)

### 3.2 Component-Driven Architecture
- Everything is a **Component** — the atomic unit of content
- Components are composed into **Templates** (page layouts)
- Templates are assigned to **Pages** (URL-addressable content nodes)
- Developers extend the system by registering new components with:
  - A **Sling Model** (backend data model + logic in Java/Kotlin)
  - A **Dialog definition** (JSON schema for authoring UI)
  - A **Data Schema** (JSON Schema contract defining the component's output shape)
  - A **Frontend Renderer** (React, Vue, Angular, or any framework component — lives in the frontend codebase)
- Backend and frontend teams work independently against the **Component Registry Schema** contract

### 3.3 Content as a Tree (JCR-Inspired, SQL-Backed)
- Content is stored as a hierarchical tree of nodes (like JCR/AEM) but backed by PostgreSQL with `ltree` extension
- Each node has properties (key-value), a resource type (component type), and children
- This enables path-based content resolution: `/content/site-a/en/homepage/hero`

### 3.4 Headless-Only Backend
- The backend is a **pure JSON API** — it never generates HTML, CSS, or framework-specific markup
- All content is accessible via REST and GraphQL APIs
- SSR is handled entirely by the frontend meta-framework (Next.js, Nuxt, Angular SSR)
- This enables complete **framework freedom**: swap React for Vue or Angular without touching the backend
- The separation is enforced by a formal **Component Registry Schema** contract

### 3.5 Framework-Agnostic Frontend
- A core TypeScript SDK (`@flexcms/sdk`) provides data fetching and component mapping
- Framework-specific adapters wrap the SDK for React (`@flexcms/react`), Vue (`@flexcms/vue`), and Angular (`@flexcms/angular`)
- Any additional frontend framework can be supported by writing a thin adapter
- Admin UI is built with Next.js + a shared design system (`@flexcms/ui`) with full theming support

### 3.6 Plugin Architecture
- New components, services, and workflows are added as **plugins** (Spring Boot modules)
- Plugins are hot-registered at startup via classpath scanning
- No core code modification needed for extensions

---

## 4. Technology Stack

| Layer              | Technology                              |
|--------------------|-----------------------------------------|
| Backend Framework  | Spring Boot 3.x (Java 21 / Kotlin)     |
| Database           | PostgreSQL 16 with ltree extension      |
| Search             | Elasticsearch 8.x                       |
| Message Queue      | RabbitMQ (replication + async events)   |
| Cache              | Redis 7.x (L2 cache + session)         |
| Object Storage     | S3-compatible (MinIO for dev, AWS S3)   |
| Frontend SDK       | @flexcms/sdk (TypeScript, framework-agnostic) |
| React Adapter      | @flexcms/react (React 18+)             |
| Vue Adapter        | @flexcms/vue (Vue 3)                   |
| Angular Adapter    | @flexcms/angular (Angular 17+)         |
| Design System      | @flexcms/ui (Radix UI + Tailwind CSS + CVA) |
| Admin UI           | Next.js 14+ (App Router) + @flexcms/ui |
| Site SSR (React)   | Next.js + @flexcms/react               |
| Site SSR (Vue)     | Nuxt 3 + @flexcms/vue                  |
| API                | REST (Spring MVC) + GraphQL (Spring GraphQL) |
| CDN                | CloudFront / Cloudflare / Akamai / Fastly |
| Containerization   | Docker + Kubernetes                     |
| CI/CD              | GitHub Actions / Jenkins                |

---

## 5. Module Structure

```
flexcms/                               # Java backend (Spring Boot)
├── flexcms-core/                      # Core domain: content tree, nodes, properties
├── flexcms-author/                    # Author environment (authoring APIs, workflow)
├── flexcms-publish/                   # Publish environment (JSON API delivery)
├── flexcms-headless/                  # Headless API (REST + GraphQL)
├── flexcms-dam/                       # Digital Asset Management
├── flexcms-replication/               # Content replication (author -> publish)
├── flexcms-search/                    # Search indexing and query
├── flexcms-cache/                     # Caching layer and invalidation
├── flexcms-cdn/                       # CDN integration and purge APIs
├── flexcms-i18n/                      # Multi-language management
├── flexcms-multisite/                 # Multi-site tenant management
├── flexcms-plugin-api/                # Plugin SPI for extensions
├── flexcms-clientlibs/                # JS/CSS library management framework
└── flexcms-app/                       # Spring Boot application entry point

frontend/                              # TypeScript frontend (pnpm monorepo)
├── packages/
│   ├── sdk/                           # @flexcms/sdk — framework-agnostic core
│   ├── react/                         # @flexcms/react — React adapter
│   ├── vue/                           # @flexcms/vue — Vue 3 adapter
│   ├── angular/                       # @flexcms/angular — Angular adapter
│   └── ui/                            # @flexcms/ui — Design system (Radix + Tailwind)
├── apps/
│   ├── admin/                         # Next.js Admin UI (authoring interface)
│   ├── site-nextjs/                   # Reference site: Next.js (React SSR)
│   └── site-nuxt/                     # Reference site: Nuxt 3 (Vue SSR)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 6. Key Flows

### 6.1 Content Authoring Flow
1. Author logs into Admin UI (Next.js SPA at admin.example.com)
2. Opens page in visual editor (WYSIWYG with component drag-drop)
3. Adds/edits components via dialog forms (auto-generated from JSON schema)
4. Saves draft -> content node updated in Author DB via REST API
5. Submits for approval -> workflow engine routes to reviewers
6. Reviewer approves -> content marked "approved"
7. Author publishes -> replication agent pushes to Publish queue

### 6.2 Content Delivery Flow (SSR via Next.js/Nuxt)
1. Request hits CDN -> cache miss -> hits Next.js/Nuxt SSR server
2. SSR server calls FlexCMS Headless API (REST or GraphQL) via `@flexcms/sdk`
3. API resolves content node from tree, runs Sling Models, returns JSON
4. `@flexcms/react` (or `@flexcms/vue`) maps each component's `resourceType` to a frontend renderer
5. Framework renders full HTML with hydration markers
6. Response returned with cache headers -> CDN caches it

### 6.3 Content Delivery Flow (Client-Side SPA)
1. Client calls FlexCMS API via `@flexcms/sdk` from the browser
2. API returns structured JSON with component data, asset URLs, i18n
3. Framework adapter renders components client-side

### 6.4 Replication Flow
1. Publish action triggers replication event
2. Event published to RabbitMQ topic
3. Each Publish instance consumes the event
4. Content node + associated assets replicated to Publish DB/store
5. Cache invalidation triggered for affected paths
6. CDN purge API called for affected URLs

---

## 7. Scalability Model

```
Author Cluster (2-3 nodes):
  - Stateless app servers behind LB
  - Shared PostgreSQL (primary + replicas)
  - Shared Redis for sessions/cache
  - Shared S3 for DAM

Publish Cluster (N nodes, auto-scale):
  - Stateless app servers behind LB
  - PostgreSQL read replicas (each region)
  - Local Redis cache per node + shared Redis
  - CDN in front for static + dynamic caching
  - Elasticsearch replicas for search

Replication:
  Author DB -> RabbitMQ -> Publish DB replicas
  Author S3 -> S3 Cross-Region Replication -> Publish S3
```

---

## 8. Security Architecture

- **Authentication**: OAuth 2.0 / OIDC (Keycloak or Auth0)
- **Authorization**: RBAC with per-node ACLs on content tree
- **API Security**: JWT tokens, rate limiting, CORS policies
- **Content Security**: XSS sanitization on all rich text fields
- **Audit Trail**: All content changes logged with user, timestamp, diff
- **Publish Isolation**: Publish environment has no write access to content store
