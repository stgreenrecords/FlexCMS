# FlexCMS — Modern Enterprise Content Management System

[![CI](https://github.com/FlexCMS/flexcms/actions/workflows/ci.yml/badge.svg)](https://github.com/FlexCMS/flexcms/actions/workflows/ci.yml)

> **AI Agent Quick Context:** FlexCMS is a **headless-only** Spring Boot 3.x + Java 21 CMS. The backend is a pure JSON API — it **never generates HTML**. It uses a PostgreSQL ltree-backed content tree, separates Author (read-write) and Publish (read-only) environments connected via RabbitMQ replication, and delivers content via REST + GraphQL APIs behind CDN. Frontend rendering is handled by a framework-agnostic TypeScript SDK (`@flexcms/sdk`) with adapters for React (`@flexcms/react`), Vue (`@flexcms/vue`), and Angular (`@flexcms/angular`). SSR is done by Next.js/Nuxt/Angular SSR. Admin UI is built with Next.js + `@flexcms/ui` design system (Radix + Tailwind + theme tokens). Backend and frontend teams work independently against a **Component Registry Schema** contract. See § "AI Agent Onboarding Guide" at the bottom for full context map.

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Architecture Summary](#2-architecture-summary)
3. [Technology Stack](#3-technology-stack)
4. [Module Map](#4-module-map)
5. [Enterprise Readiness Assessment](#5-enterprise-readiness-assessment)
6. [Gap Analysis — What Is Missing](#6-gap-analysis--what-is-missing)
7. [Improvement Plan (Phased Roadmap)](#7-improvement-plan-phased-roadmap)
8. [Getting Started](#8-getting-started)
9. [AI Agent Onboarding Guide](#9-ai-agent-onboarding-guide)

---

## 1. Project Vision

FlexCMS is designed to be a **production-grade, open-architecture CMS** suitable for powering any enterprise company website — from corporate portals and multi-brand marketing sites to headless backends for mobile apps and IoT. It implements proven enterprise CMS patterns (component model, author/publish separation, path-based resource resolution) on a modern Spring Boot + PostgreSQL foundation.

**Key design goals:**
- **Headless-only backend:** All content delivered as JSON via REST & GraphQL; the backend never generates HTML
- **Framework-agnostic frontend:** Core TypeScript SDK with adapters for React, Vue, Angular (swap frameworks without touching backend)
- **Contract-driven separation:** Backend and frontend teams work independently against a Component Registry Schema contract
- **Component-driven:** Atomic content units with pluggable backend logic (ComponentModel SPI)
- **Author/Publish separation:** Read-write authoring → async replication → read-only delivery tier
- **Themeable Admin UI:** Next.js admin interface with `@flexcms/ui` design system — unified buttons, inputs, labels with light/dark/custom brand theme support
- **Multi-site & multi-language:** Tenant-isolated sites with full i18n, translation workflows, and XLIFF export
- **Plugin architecture:** Extend via Spring Boot starters — no core code modification required
- **Enterprise DAM:** Full digital asset management with rendition pipeline, CDN delivery, reference tracking
- **Production scalability:** Kubernetes-native, multi-layer caching (browser → CDN → Redis → Caffeine), auto-scaling publish tier

---

## 2. Architecture Summary

```
                        ┌─────────────────────┐
                        │     CDN Layer        │
                        │ (CloudFront/Akamai/  │
                        │  Cloudflare/Fastly)  │
                        └──────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼────────┐  ┌───────▼───────┐  ┌────────▼──────────┐
    │ Frontend SSR     │  │  Admin UI     │  │  SPA / Mobile     │
    │ (Next.js / Nuxt) │  │  (Next.js)    │  │  (@flexcms/sdk)   │
    │ @flexcms/react   │  │  @flexcms/ui  │  │                   │
    │ @flexcms/vue     │  │  @flexcms/react│  │                   │
    └────────┬─────────┘  └───────┬───────┘  └────────┬──────────┘
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │  JSON API (REST + GraphQL)
                    ┌─────────────▼──────────────┐
                    │   Publish Cluster           │
                    │   (JSON API only — no HTML) │
                    │   - REST + GraphQL          │
                    │   - Page Resolver           │
                    │   - Component Models        │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Content Store             │
                    │   (PostgreSQL 16 + ltree)   │
                    └─────────────┬──────────────┘
                                  ▲
                                  │  RabbitMQ Replication
                    ┌─────────────┴──────────────┐
                    │   Author Cluster            │
                    │   (Read-Write)              │
                    │   - Author REST APIs        │
                    │   - Workflow Engine          │
                    │   - DAM Ingest              │
                    └────────────────────────────┘

          ┌───────────────────┐     ┌───────────────────┐
          │  DAM Service       │     │  Search Service   │
          │  MinIO/S3 + CDN    │     │  Elasticsearch 8  │
          └───────────────────┘     └───────────────────┘
```

**Key architectural flows:**
- Content is authored → passes through workflow (draft → review → approve → publish) → replicated via RabbitMQ to Publish tier → cache invalidation + CDN purge
- Headless clients call REST/GraphQL → content resolved from tree → component models adapt data → JSON response with CDN-backed asset URLs
- DAM assets uploaded → stored in S3/MinIO → rendition pipeline auto-generates responsive variants → served via CDN

---

## 3. Technology Stack

| Layer | Technology | Status |
|---|---|---|
| Language | Java 21 | ✅ Configured |
| Backend Framework | Spring Boot 3.3.0 | ✅ Implemented |
| Database | PostgreSQL 16 + ltree + pg_trgm | ✅ Schema + Flyway migrations |
| Search | Elasticsearch 8.13.4 | 🟡 Skeleton (index service stubbed) |
| Message Queue | RabbitMQ | ✅ Implemented (replication agent/receiver) |
| Object Storage | MinIO (dev) / S3 (prod) | ✅ Implemented (ingest + renditions) |
| Cache L2 | Redis 7 | ✅ Configured (cache config + invalidation) |
| Cache L3 | Caffeine | ✅ Configured (local cache config) |
| API - REST | Spring MVC | ✅ Implemented (headless + author + contract APIs) |
| API - GraphQL | Spring GraphQL | 🟡 Schema defined, resolver partial |
| Frontend SDK | @flexcms/sdk (TypeScript) | ✅ Implemented (client, mapper, walker, types) |
| React Adapter | @flexcms/react | ✅ Implemented (Provider, Page, Component, hooks) |
| Vue 3 Adapter | @flexcms/vue | ✅ Implemented (Plugin, Page, Component, composables) |
| Angular Adapter | @flexcms/angular | 🟡 Scaffolded (factory, re-exports) |
| Design System | @flexcms/ui (Radix + Tailwind + CVA) | ✅ Implemented (Button, Input, Label, Card, Badge, etc.) |
| Theming | CSS custom properties (light/dark/brand) | ✅ Implemented (token system + applyTheme) |
| Admin UI | Next.js 14+ App Router + @flexcms/ui | 🟡 Scaffolded (layout, dashboard, ThemeProvider) |
| Ref. Site (React) | Next.js + @flexcms/react | ✅ Implemented (component map, catch-all route) |
| Ref. Site (Vue) | Nuxt 3 + @flexcms/vue | ✅ Implemented (plugin, catch-all route) |
| Component Contract | /api/content/v1/component-registry | ✅ Implemented (endpoint + dataSchema + migration) |
| Static Build Worker | Node.js + RabbitMQ + S3 | 🟡 Scaffolded (event consumer, renderer, S3 publisher, manifest) |
| Static S3 Hosting | MinIO (dev) / S3 + CDN (prod) | 🟡 Schema + worker scaffolded; CDN routing not configured |
| PIM Module | flexcms-pim (own DB + REST API) | 🟡 Scaffolded (models, repos, service, controller, CSV importer, migration) |
| CDN Integration | CloudFront / Cloudflare / Fastly / Akamai | 🟡 Abstraction + surrogate keys implemented |
| Security | Spring Security (OAuth2/OIDC planned) | 🔴 Placeholder only (all endpoints `permitAll`) |
| Containerization | Docker Compose (dev) | ✅ Working |
| Kubernetes | K8s manifests | 🔴 Designed in docs, not implemented |
| CI/CD | GitHub Actions / Jenkins | 🔴 Not implemented |

---

## 4. Module Map

```
flexcms/
├── flexcms-core/          # Domain models, repositories, core services
│   ├── model/             # ContentNode, Site, Asset, Workflow*, versions, etc.
│   ├── repository/        # JPA repositories (content, site, DAM, workflow, audit)
│   ├── service/           # ContentNodeService, ContentDeliveryService, ComponentRegistry
│   └── converter/         # JSONB <-> Map converter
│
├── flexcms-plugin-api/    # Extension SPI (ComponentModel, CdnProvider, WorkflowStep, etc.)
│   ├── annotation/        # @FlexCmsComponent, @ValueMapValue, @ChildResource, @Self
│   ├── spi/               # ComponentModel, AbstractComponentModel, ContentNodeData, etc.
│   └── model/             # RenderContext
│
├── flexcms-author/        # Author-side APIs + Workflow Engine
│   ├── controller/        # AuthorContentController, WorkflowController, SiteAdmin, DAM, Replication
│   └── service/           # WorkflowEngine (full implementation)
│
├── flexcms-publish/       # Publish-side page resolver + controller
│
├── flexcms-headless/      # REST + GraphQL APIs for headless delivery
│   ├── controller/        # PageApi, NodeApi, SearchApi, NavigationApi
│   └── graphql/           # ContentQueryResolver + schema.graphqls
│
├── flexcms-dam/           # Digital Asset Management
│   ├── service/           # AssetIngestService, S3Service, ImageProcessing, RenditionPipeline
│   └── config/            # S3Config (MinIO)
│
├── flexcms-replication/   # Author→Publish replication via RabbitMQ
│   ├── service/           # ReplicationAgent, ReplicationReceiver
│   ├── model/             # ReplicationEvent
│   └── config/            # RabbitMQ exchange/queue topology
│
├── flexcms-cache/         # Multi-layer caching
│   ├── config/            # RedisCacheConfig, LocalCacheConfig (Caffeine)
│   ├── filter/            # CacheControlFilter (HTTP headers)
│   └── service/           # CacheInvalidationService
│
├── flexcms-cdn/           # CDN integration + purge
│   └── service/           # CdnPurgeService, SurrogateKeyService
│
├── flexcms-i18n/          # Multi-language + translation
│   ├── service/           # I18nService, TranslationService
│   ├── repository/        # I18nDictionaryRepository, LanguageCopyRepository
│   └── model/             # I18nDictionary, LanguageCopy
│
├── flexcms-multisite/     # Multi-site management
│   ├── service/           # SiteResolver, SiteManagementService
│   └── model/             # SiteContext
│
├── flexcms-search/        # Elasticsearch integration
│   ├── service/           # SearchIndexService
│   ├── repository/        # ContentSearchRepository
│   └── document/          # ContentNodeDocument
│
├── flexcms-clientlibs/    # JS/CSS library management
│   ├── service/           # ClientLibManager
│   ├── repository/        # ClientLibRepository
│   └── model/             # ClientLibrary
│
├── flexcms-pim/           # Product Information Management (separate DB)
│   ├── model/             # Product, ProductSchema, Catalog, ProductVariant, ProductAssetRef
│   ├── repository/        # ProductRepository, CatalogRepository, ProductSchemaRepository
│   ├── service/           # ProductService (CRUD + carryforward + resolve)
│   ├── controller/        # ProductApiController (/api/pim/v1/)
│   ├── importer/          # ProductImportSource SPI, CsvImportSource, ImportConfig
│   ├── config/            # PimDataSourceConfig (separate database)
│   └── resources/db/pim/  # PIM-specific Flyway migrations (V1)
│
└── flexcms-app/           # Spring Boot application (entry point)
    ├── FlexCmsApplication # Main class (@SpringBootApplication)
    ├── config/            # SecurityConfig (placeholder)
    └── resources/
        ├── application.yml, application-author.yml, application-publish.yml
        ├── db/migration/  # V1-V7 Flyway migrations + seed data
        └── graphql/       # (linked from flexcms-headless)
```

### Frontend Monorepo (`frontend/`)

```
frontend/                              # TypeScript (pnpm + Turborepo)
├── packages/
│   ├── sdk/                           # @flexcms/sdk — framework-agnostic core
│   │   └── src/                       # client.ts, mapper.ts, walker.ts, types.ts
│   ├── react/                         # @flexcms/react — React adapter
│   │   └── src/                       # FlexCmsProvider, FlexCmsPage, FlexCmsComponent, hooks
│   ├── vue/                           # @flexcms/vue — Vue 3 adapter
│   │   └── src/                       # FlexCmsPlugin, FlexCmsPage, FlexCmsComponent, composables
│   ├── angular/                       # @flexcms/angular — Angular adapter
│   │   └── src/                       # createFlexCmsProviders, re-exports
│   └── ui/                            # @flexcms/ui — Design System (Radix + Tailwind + CVA)
│       └── src/
│           ├── components/            # Button, Input, Label, Card, Badge, Textarea, etc.
│           ├── themes/                # lightTheme, darkTheme, applyTheme(), createTheme()
│           └── lib/                   # cn() utility (clsx + tailwind-merge)
├── apps/
│   ├── admin/                         # Next.js Admin UI
│   │   └── src/app/                   # Dashboard, ThemeProvider, layout
│   ├── build-worker/                  # Static compilation worker (Node.js)
│   │   └── src/                       # event-consumer, dependency-resolver, page-renderer, s3-publisher, manifest
│   ├── site-nextjs/                   # Reference site: Next.js (React SSR)
│   │   └── src/                       # component-map.tsx, catch-all [...slug] route
│   └── site-nuxt/                     # Reference site: Nuxt 3 (Vue SSR)
│       ├── plugins/                   # flexcms.ts plugin
│       └── pages/                     # [...slug].vue catch-all route
├── package.json                       # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json                         # Turborepo build orchestration
└── tsconfig.base.json                 # Shared TypeScript config
```

**Source code stats:** ~95 Java source files, 8 CMS Flyway migrations + 1 PIM migration, 1 GraphQL schema, 3 YAML configs, ~40 TypeScript/TSX source files, 8 frontend packages, 0 tests.

---

## 5. Enterprise Readiness Assessment

### Readiness Scorecard

| Capability | Design Maturity | Implementation Maturity | Enterprise Ready? |
|---|---|---|---|
| **Content Model (tree + JSONB)** | ██████████ 10/10 | ████████░░ 8/10 | ✅ Yes |
| **Author/Publish Separation** | ██████████ 10/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **Component Framework (ComponentModel SPI)** | ██████████ 10/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **Content Replication (RabbitMQ)** | █████████░ 9/10 | ████████░░ 8/10 | ✅ Yes |
| **Headless API (REST)** | █████████░ 9/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **Headless API (GraphQL)** | █████████░ 9/10 | ████░░░░░░ 4/10 | 🔴 No |
| **Backend/Frontend Contract** | ██████████ 10/10 | ████████░░ 8/10 | ✅ Yes |
| **Frontend SDK (@flexcms/sdk)** | █████████░ 9/10 | ████████░░ 8/10 | ✅ Yes |
| **React Adapter (@flexcms/react)** | █████████░ 9/10 | ████████░░ 8/10 | ✅ Yes |
| **Vue Adapter (@flexcms/vue)** | █████████░ 9/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **Angular Adapter (@flexcms/angular)** | ███████░░░ 7/10 | ███░░░░░░░ 3/10 | 🔴 Scaffold only |
| **Design System (@flexcms/ui)** | █████████░ 9/10 | ██████░░░░ 6/10 | 🟡 Core components done |
| **Theming (light/dark/brand)** | █████████░ 9/10 | ████████░░ 8/10 | ✅ Yes |
| **Admin UI (Next.js)** | █████████░ 9/10 | ██░░░░░░░░ 2/10 | 🔴 **Scaffolded — needs build-out** |
| **Ref. Site SSR (Next.js/Nuxt)** | █████████░ 9/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **DAM System** | █████████░ 9/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **Multi-site Management** | █████████░ 9/10 | ██████░░░░ 6/10 | 🟡 Partial |
| **Multi-language / i18n** | █████████░ 9/10 | ██████░░░░ 6/10 | 🟡 Partial |
| **Workflow Engine** | █████████░ 9/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **Caching (multi-layer)** | ██████████ 10/10 | ███████░░░ 7/10 | 🟡 Mostly |
| **CDN Integration** | █████████░ 9/10 | █████░░░░░ 5/10 | 🟡 Partial |
| **Database Schema + Migrations** | ██████████ 10/10 | █████████░ 9/10 | ✅ Yes |
| **Security (AuthN/AuthZ)** | ████████░░ 8/10 | █░░░░░░░░░ 1/10 | 🔴 **Critical Gap** |
| **Testing** | ░░░░░░░░░░ 0/10 | ░░░░░░░░░░ 0/10 | 🔴 **Critical Gap** |
| **Observability / Monitoring** | ██░░░░░░░░ 2/10 | ░░░░░░░░░░ 0/10 | 🔴 **Critical Gap** |
| **CI/CD Pipeline** | ███░░░░░░░ 3/10 | ░░░░░░░░░░ 0/10 | 🔴 **Critical Gap** |
| **Documentation (API / Dev)** | ████████░░ 8/10 | ████░░░░░░ 4/10 | 🟡 Architecture + design docs |
| **Error Handling / Resilience** | ████░░░░░░ 4/10 | ██░░░░░░░░ 2/10 | 🔴 No |
| **Performance / Load Testing** | ██░░░░░░░░ 2/10 | ░░░░░░░░░░ 0/10 | 🔴 No |

### Summary Verdict

> **FlexCMS is NOT enterprise-ready today, but the architecture is production-caliber.** The design is exceptionally strong (9/10) — it models proven enterprise CMS patterns with a clean backend/frontend contract separation. The backend core is ~75% implemented, the frontend SDK + three framework adapters + design system are built, and reference sites demonstrate end-to-end rendering. However, **four critical gaps** block enterprise deployment: (1) zero security implementation, (2) zero test coverage, (3) no observability/monitoring, and (4) no CI/CD pipeline. The Admin UI is scaffolded but needs full build-out.

### What's Working Well
- ✅ **Content tree model** with ltree-backed hierarchy, JSONB properties, and full CRUD
- ✅ **Component model** with SPI, registry, field-injection (`@ValueMapValue`), and adapter pattern (ComponentModel SPI)
- ✅ **Backend/Frontend contract** — Component Registry Schema endpoint (`/api/content/v1/component-registry`) with `dataSchema` JSON Schema per component
- ✅ **Frontend SDK** (`@flexcms/sdk`) — framework-agnostic client, component mapper, tree walker
- ✅ **Three framework adapters** — `@flexcms/react` (Provider, Page, Component, hooks), `@flexcms/vue` (Plugin, Page, Component, composables), `@flexcms/angular` (scaffolded)
- ✅ **Design system** (`@flexcms/ui`) — Button, Input, Label, Card, Badge, Textarea, Separator, Skeleton, Avatar with CSS custom property theming
- ✅ **Theme system** — light/dark/custom brand themes via token maps + `applyTheme()` runtime switching
- ✅ **Reference sites** — Next.js (React SSR) and Nuxt 3 (Vue SSR) with component maps and catch-all routes
- ✅ **Headless-only publish** — Thymeleaf removed; `PublishPageController` returns JSON only
- ✅ **Replication pipeline** — full RabbitMQ-based author→publish flow with event model
- ✅ **DAM ingestion** — S3/MinIO upload, MIME detection (Tika), image dimension extraction, rendition pipeline
- ✅ **Workflow engine** — JSON-defined workflows with step transitions and replication hooks
- ✅ **Database** — clean Flyway migrations (V1-V7), seed data with core components + templates + default workflow
- ✅ **Multi-layer cache config** — Redis L2, Caffeine L3, HTTP Cache-Control filter, invalidation service
- ✅ **Docker Compose** — complete local development stack (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)
- ✅ **Turborepo monorepo** — frontend packages build in dependency order via `pnpm` workspaces

---

## 6. Gap Analysis — What Is Missing

### 🔴 P0 — Critical (Blocks Production)

| # | Gap | Impact | Effort |
|---|---|---|---|
| 1 | **Security is completely disabled** — `SecurityConfig` sets `permitAll()` on all endpoints. No OAuth2/OIDC, no RBAC, no per-node ACLs, no JWT validation. | Any unauthenticated user can create/delete content, publish to production, access admin APIs. | 3-4 weeks |
| 2 | **Admin UI needs full build-out** — Next.js app is scaffolded (layout, dashboard, ThemeProvider) but content tree browser, page editor, DAM browser, workflow UI are not implemented. | Authors cannot create or manage content via UI. | 8-12 weeks |
| 3 | **Zero test coverage** — No unit tests, integration tests, or E2E tests exist anywhere in the codebase (backend or frontend). | Cannot verify correctness, regressions go undetected, blocks CI/CD. | 4-6 weeks (ongoing) |
| 4 | **No CI/CD pipeline** — No GitHub Actions, Jenkins, or any build/deploy automation. | Manual builds only. No automated quality gates. | 1-2 weeks |
| 5 | **No observability** — No metrics (Micrometer/Prometheus), no distributed tracing (OpenTelemetry), no structured logging, no health checks beyond Spring Boot default. | Cannot monitor production, detect performance issues, or debug distributed failures. | 2-3 weeks |

### 🟡 P1 — High (Blocks Enterprise Deployment)

| # | Gap | Impact | Effort |
|---|---|---|---|
| 6 | **GraphQL resolver is incomplete** — Schema is defined but only `ContentQueryResolver` is partially implemented. Most queries return stubs. | Headless clients relying on GraphQL have limited functionality. | 2-3 weeks |
| 7 | **Angular adapter is scaffold-only** — `@flexcms/angular` has factory + re-exports but no Angular-native components, directives, or DI providers. No reference Angular SSR site. | Angular teams cannot adopt FlexCMS without writing their own adapter layer. | 2-3 weeks |
| 8 | **Error handling is ad-hoc** — No global `@ControllerAdvice`, no standardized error response format, no circuit breakers, no retry policies. | Inconsistent API errors, poor DX, cascading failures in production. | 1-2 weeks |
| 9 | **Input validation missing** — No `@Valid`, no request DTOs with constraints, no XSS sanitization on rich text fields. | Injection attacks, malformed data in DB. | 1-2 weeks |
| 10 | **Elasticsearch integration is skeleton** — `SearchIndexService` and `ContentSearchRepository` exist but full-text search indexing/querying is not wired. | Search doesn't work. | 2-3 weeks |
| 11 | **No API documentation** — No OpenAPI/Swagger spec, no GraphQL docs, no Postman collections. | Developers cannot discover or consume APIs. | 1 week |
| 12 | **No rate limiting** — No request throttling on public APIs. | DDoS vulnerability, resource exhaustion. | 1 week |
| 13 | **Scheduled publishing not implemented** — Workflow defines a "scheduled" step type but timer logic is missing. | Content cannot be scheduled for future publication. | 1-2 weeks |

### 🟢 P2 — Medium (Enhances Enterprise Value)

| # | Gap | Impact | Effort |
|---|---|---|---|
| 14 | **No content preview** — Preview rendering for authors before publish is not built. | Authors publish blindly. | 2-3 weeks |
| 15 | **Live copy / content sharing** — Table exists but service logic is stubbed. | Cross-site content reuse doesn't work. | 2 weeks |
| 16 | **Translation connector integration** — SPI exists but no concrete connector (DeepL, Google Translate) is implemented. | Machine translation unavailable. | 1-2 weeks |
| 17 | **ClientLib pipeline lower priority** — Backend-side SCSS/TS compilation is less needed now that frontend frameworks handle bundling (Next.js/Nuxt/Vite). The `flexcms-clientlibs` module may be repurposed or deprecated. | Legacy SSR sites that don't use a frontend framework cannot serve compiled assets. | 1 week (decision) |
| 18 | **No audit trail UI** — `audit_log` table + repository exist but no admin API to query audit events. | Compliance teams cannot review changes. | 1 week |
| 19 | **No bulk operations** — No bulk publish, bulk delete, bulk import/export of content trees. | Operational inefficiency at scale. | 2 weeks |
| 20 | **No Kubernetes manifests** — K8s deployment described in design docs but no actual YAML/Helm charts. | Cannot deploy to K8s without manual config. | 1-2 weeks |
| 21 | **ACL enforcement not implemented** — `node_acls` table exists but no security interceptor checks permissions. | All users can access all content. | 2-3 weeks |
| 22 | **CDN provider implementations** — `CdnProvider` SPI exists, `CdnPurgeService` + `SurrogateKeyService` exist, but no concrete provider (CloudFront, Cloudflare, etc.) is implemented. | CDN purge doesn't actually work. | 1-2 weeks per provider |
| 23 | **Cache warming service** — Not implemented despite design doc. | Cold starts after deployment cause slow responses. | 1 week |
| 24 | **No sitemap/robots.txt generation** — Essential for SEO. | Search engines cannot crawl efficiently. | 1 week |

---

## 7. Improvement Plan (Phased Roadmap)

### Phase 1 — Foundation Hardening (Weeks 1-6)
*Goal: Make the backend production-safe and testable*

| Week | Task | Module | Details |
|---|---|---|---|
| 1-2 | **Security implementation** | `flexcms-app`, `flexcms-core` | Integrate Spring Security OAuth2 Resource Server; JWT validation; RBAC role-based access (ADMIN, CONTENT_AUTHOR, CONTENT_REVIEWER, CONTENT_PUBLISHER, VIEWER); separate author API security from publish API; implement method-level `@PreAuthorize` |
| 2-3 | **Per-node ACL enforcement** | `flexcms-core` | Implement security interceptor that checks `node_acls` table before every CRUD operation; inherit ACLs from parent nodes; cache ACL lookups in Redis |
| 3-4 | **Testing foundation** | All modules | Add JUnit 5 + Mockito unit tests for all services; add Testcontainers-based integration tests for repositories (PostgreSQL) and replication (RabbitMQ); target 70%+ code coverage |
| 4-5 | **Error handling & validation** | All modules | Global `@ControllerAdvice` with RFC 7807 Problem Details; `@Valid` on all request DTOs; XSS sanitization (OWASP Java HTML Sanitizer) on rich text; custom exception hierarchy |
| 5-6 | **CI/CD pipeline** | Root | GitHub Actions: build → test → lint → Docker build → push to registry; Flyway migration validation in CI; SonarQube integration for code quality |

### Phase 2 — API Completeness & Frontend Polish (Weeks 7-12)
*Goal: Fully functional headless CMS backend + production-quality frontend SDK*

| Week | Task | Module | Details |
|---|---|---|---|
| 7-8 | **Complete GraphQL resolvers** | `flexcms-headless` | Implement all Query resolvers (page, pages, search, navigation, asset, components); add pagination; implement field-level resolvers for nested types |
| 8-9 | **Elasticsearch integration** | `flexcms-search` | Implement full-text indexing on content publish; search query with filters, facets, highlighting; auto-reindex on replication events |
| 9-10 | **Angular adapter build-out + reference site** | `frontend/packages/angular`, `frontend/apps/site-angular` | Implement `FlexCmsModule`, `FlexCmsPageComponent`, `FlexCmsComponentDirective`, `ComponentMapperService` with DI; create Angular SSR reference site using `@angular/ssr` |
| 10-11 | **API documentation** | `flexcms-headless`, `flexcms-author` | SpringDoc OpenAPI for REST endpoints; GraphiQL + docs for GraphQL; Postman collection export; auto-generate SDK TypeScript types from GraphQL via `graphql-codegen` |
| 11-12 | **Observability stack** | `flexcms-app` | Micrometer + Prometheus metrics; OpenTelemetry distributed tracing; structured JSON logging (Logback); custom metrics for replication lag, cache hit rate, content operations |

### Phase 2.5 — Static Site Compilation / Warm-Up Build (Weeks 12-15)
*Goal: Published pages are pre-compiled to static HTML+JS+CSS and served directly from CDN — zero SSR at request time*

| Week | Task | Module | Details |
|---|---|---|---|
| 12-13 | **Build worker core** | `frontend/apps/build-worker` | Complete the Node.js build worker: RabbitMQ event consumer → dependency resolver → React SSR page renderer → S3 uploader → manifest manager. Wire up incremental compilation (only changed pages rebuild). Deploy as separate container. |
| 13-14 | **Dependency graph & incremental builds** | `build-worker`, `flexcms-core` | Populate `static_build_dependencies` table on publish. Implement smart resolution: shared component change → rebuild all pages; single page change → rebuild that page only; asset change → rebuild pages referencing it. |
| 14-15 | **CDN origin routing + hybrid fallback** | `flexcms-cdn`, CDN config | Configure CDN to serve static HTML from S3 bucket as primary origin; fall back to Next.js/Nuxt SSR for uncached/unbuilt pages. Set up cache headers: HTML `max-age=0, s-maxage=1yr`; JS/CSS `immutable`. Admin UI dashboard shows build status per site. |

> **See full design:** `Design/cms_architecture/11_STATIC_SITE_COMPILATION.md`

### Phase 3 — Admin UI Build-Out (Weeks 13-24)
*Goal: Content authors can create and manage content via the Admin UI*

| Week | Task | Module | Details |
|---|---|---|---|
| 13-14 | **Design system expansion** | `frontend/packages/ui` | Add Dialog, DropdownMenu, Popover, Tabs, DataTable, Toast, Command Palette, Sidebar, TreeView components to `@flexcms/ui`; Storybook for component documentation |
| 15-17 | **Content tree browser + page editor** | `frontend/apps/admin` | Page tree sidebar with expand/collapse; node CRUD; property editing with auto-generated forms from `component.json` dialog schemas via `@flexcms/ui` components; inline editor |
| 18-19 | **Visual Page Editor** | `frontend/apps/admin` | WYSIWYG drag-and-drop component editor (dnd-kit); component palette; inline editing; responsive preview (mobile/tablet/desktop viewport toggle) |
| 20-21 | **DAM UI** | `frontend/apps/admin` | Asset browser with thumbnails; drag-drop upload; metadata editing; image crop tool; usage references; folder navigation |
| 22-23 | **Workflow UI** | `frontend/apps/admin` | Inbox/task list; submit/approve/reject actions; workflow status visualization; comments; scheduled publish date picker |
| 23-24 | **Content Preview** | `frontend/apps/admin` | Preview rendering via embedded iframe calling reference Next.js site in preview mode; side-by-side edit/preview split |

### Phase 4 — Enterprise Features (Weeks 25-36)
*Goal: Production-ready for enterprise deployment*

| Week | Task | Details |
|---|---|---|
| 25-26 | **Scheduled publishing** | Implement timer-based workflow step; cron-based scheduler; publish queue |
| 26-27 | **Bulk operations** | Bulk publish/unpublish; bulk move; content import/export (JSON/ZIP) |
| 27-28 | **CDN provider implementations** | Implement CloudFront + Cloudflare providers; surrogate-key-based purge; edge caching rules |
| 28-29 | **Translation connectors** | Implement DeepL + Google Translate connectors; XLIFF import/export; translation job dashboard |
| 29-30 | **Live copy & content sharing** | Cross-site content inheritance; auto-sync; override management |
| 30-31 | **ClientLib build pipeline** | Integrate libsass-java + Nashorn/GraalJS for SCSS/TS compilation; dependency graph resolution |
| 31-32 | **Kubernetes deployment** | Helm charts; HPA for publish tier; secrets management; health probes; rolling updates |
| 33-34 | **Performance optimization** | Load testing (Gatling); query optimization; N+1 detection; connection pool tuning; JVM tuning |
| 34-35 | **SEO tooling** | Sitemap.xml generation; robots.txt; canonical URLs; meta tag management; structured data (JSON-LD) |
| 35-36 | **Compliance & audit** | Audit log admin API + UI; GDPR data export/deletion; content retention policies; backup strategy |

### Phase 5 — Product Information Management / PIM (Weeks 37-48)
*Goal: Full PIM system as an independent pillar alongside Content and DAM*

| Week | Task | Details |
|---|---|---|
| 37-38 | **PIM core: schemas, catalogs, products** | Complete ProductService with full CRUD, schema validation against JSON Schema, catalog management, product versioning history |
| 38-39 | **Year-over-year carryforward** | Implement full inheritance merge (source product attributes + overrides); batch carryforward wizard; diff view for overridden vs inherited fields |
| 39-40 | **Import pipeline (CSV/Excel/JSON/API)** | Complete ImportService with pluggable parsers; field mapping profiles; batch upsert; error tracking; auto-schema inference from source |
| 40-41 | **PIM ↔ CMS integration** | PimClient injectable into ComponentModels; product enrichment at render time; RabbitMQ events for product.published → page rebuild triggers |
| 41-42 | **PIM ↔ DAM integration** | Product asset linker UI; DAM picker in product editor; asset role management (hero, gallery, swatch); broken reference detection |
| 42-43 | **PIM Admin UI pages** | Admin UI: catalog browser, product grid with faceted search, product editor (auto-generated from schema), variant editor, import wizard |
| 43-44 | **PIM visual schema editor** | Drag-and-drop attribute group builder; field type picker; inheritance visualization; schema diff between versions |
| 44-45 | **PIM search (Elasticsearch)** | Index products in Elasticsearch; faceted search with attribute-based filters; product search API with aggregations |
| 45-46 | **PIM API: GraphQL extension** | Extend GraphQL schema with Product, Catalog, ProductSchema, ProductVariant types; implement resolvers |
| 47-48 | **PIM scalability & testing** | Load testing with 1M+ products; batch import optimization; Redis caching for product reads; integration tests |

> **See full design:** `Design/cms_architecture/12_PIM_SYSTEM.md`

---

## 8. Getting Started

### Prerequisites
- Java 21 (Eclipse Temurin recommended)
- Maven 3.9+
- Node.js 20+ and pnpm 9+
- Docker & Docker Compose

### Local Development Setup

```bash
# 1. Start infrastructure services
cd flexcms
docker-compose up -d

# 2. Wait for services to be healthy
docker-compose ps   # Ensure all services show "healthy" or "running"

# 3. Build all backend modules
mvn clean install

# 4. Run backend in Author mode (default)
cd flexcms-app
mvn spring-boot:run -Dspring-boot.run.profiles=author

# 5. (Separate terminal) Install frontend dependencies and build
cd ../../frontend
pnpm install
pnpm build

# 6. Run Admin UI (port 3000)
cd apps/admin
pnpm dev

# 7. Run reference Next.js site (port 3001)
cd ../site-nextjs
pnpm dev
```

### Service Endpoints

| Service | URL |
|---|---|
| Author API | http://localhost:8080/api/author/ |
| Headless REST API | http://localhost:8080/api/content/v1/ |
| Component Registry (Contract) | http://localhost:8080/api/content/v1/component-registry |
| GraphiQL | http://localhost:8080/graphiql |
| Publish JSON API (when running) | http://localhost:8081 |
| Admin UI (Next.js) | http://localhost:3000 |
| Reference Site (Next.js) | http://localhost:3001 |
| Reference Site (Nuxt) | http://localhost:3002 |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |
| Elasticsearch | http://localhost:9200 |

### Key API Endpoints

```bash
# Get the component registry contract (frontend teams use this)
curl http://localhost:8080/api/content/v1/component-registry | jq .

# Create a site
curl -X POST http://localhost:8080/api/admin/sites \
  -H "Content-Type: application/json" \
  -d '{"siteId":"corporate","title":"Corporate Website","contentRoot":"/content/corporate","damRoot":"/dam/corporate","configRoot":"/conf/corporate"}'

# Get a page (headless)
curl http://localhost:8080/api/content/v1/pages/content/corporate/en/homepage \
  -H "X-FlexCMS-Site: corporate" \
  -H "X-FlexCMS-Locale: en"

# Create a content node
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{"parentPath":"content.corporate.en","name":"about","resourceType":"flexcms/page","properties":{"jcr:title":"About Us"},"userId":"admin"}'

# Upload an asset
curl -X POST http://localhost:8080/api/dam/upload \
  -F "file=@hero.jpg" \
  -F "folder=/dam/corporate/images"

# GraphQL query
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ page(path:\"/content/corporate/en/homepage\") { title components { name resourceType data } } }"}'
```

---

## 9. AI Agent Onboarding Guide

> This section is designed to help AI coding agents quickly understand the codebase and contribute effectively.

### START HERE — Work Board

**Before doing ANYTHING, read [`WORK_BOARD.md`](WORK_BOARD.md).** It is the single source of truth for all implementation work:
- What tasks are available (status OPEN)
- What's in progress and by whom
- What was paused and needs handoff (with exact continuation instructions)
- Module lock table (prevents two agents from editing the same module)
- Context packets for every task (exactly which files to read)
- Acceptance criteria for every task
- How to document your progress so the next agent can continue

### Project Identity
- **What:** Enterprise CMS platform built on Spring Boot + PostgreSQL + TypeScript SDK
- **Why:** Open-architecture alternative to expensive proprietary CMS platforms ($500K+/yr); fully customisable, self-hosted
- **Who:** For enterprises needing multi-site, multi-language websites with headless delivery
- **Stage:** Core backend is working; frontend SDK + adapters + design system implemented; Admin UI scaffolded; security/testing not started.

### Architecture Mental Model
```
FlexCMS core concepts:
  Content Tree   →  PostgreSQL rows with ltree paths + JSONB properties
  ComponentModel →  Java SPI class (adapt content node → JSON view model)
  Cache Layers   →  Redis + Caffeine + CDN (CloudFront/Cloudflare/Akamai)
  Plugin System  →  Spring Boot starter modules (no core modification needed)
  Author/Publish →  Two separate environments connected via RabbitMQ replication
  Frontend       →  React/Vue/Angular components (via @flexcms/react|vue|angular)
  Admin UI       →  Next.js + @flexcms/ui (Radix + Tailwind + theme tokens)

KEY RULE: Backend NEVER generates HTML. It only returns JSON.
          Frontend owns ALL rendering (SSR via Next.js/Nuxt, CSR via SDK).
          The contract between them is the Component Registry Schema.
```

### Where to Find Things

| Need to understand... | Start here |
|---|---|
| **🚨 Available work items + how to contribute** | **[`WORK_BOARD.md`](WORK_BOARD.md)** — read this FIRST |
| Overall architecture & vision | `Design/cms_architecture/01_ARCHITECTURE_OVERVIEW.md` |
| Content model & component framework | `Design/cms_architecture/02_CONTENT_MODEL_AND_COMPONENTS.md` |
| Author/Publish + Replication + Workflows | `Design/cms_architecture/03_AUTHOR_PUBLISH_REPLICATION.md` |
| **Frontend architecture & contract** | **`Design/cms_architecture/10_FRONTEND_ARCHITECTURE.md`** |
| **Static site compilation design** | **`Design/cms_architecture/11_STATIC_SITE_COMPILATION.md`** |
| **PIM system design** | **`Design/cms_architecture/12_PIM_SYSTEM.md`** |
| **Admin UI designer brief + style guide** | **`Design/DesignerPrompt.md`** |
| Database schema (tables, indexes, queries) | `Design/cms_architecture/09_DATABASE_SCHEMA.md` |
| Flyway migrations (actual SQL) | `flexcms-app/src/main/resources/db/migration/V1-V8` |
| Domain models (JPA entities) | `flexcms-core/src/main/java/com/flexcms/core/model/` |
| Repositories (data access) | `flexcms-core/src/main/java/com/flexcms/core/repository/` |
| Core business logic | `flexcms-core/src/main/java/com/flexcms/core/service/` |
| Extension points (SPI) | `flexcms-plugin-api/src/main/java/com/flexcms/plugin/spi/` |
| Author APIs (CRUD, workflow, DAM) | `flexcms-author/src/main/java/com/flexcms/author/controller/` |
| Headless delivery APIs | `flexcms-headless/src/main/java/com/flexcms/headless/controller/` |
| **Component Registry Contract API** | **`flexcms-headless/.../ComponentRegistryController.java`** |
| GraphQL schema | `flexcms-headless/src/main/resources/graphql/schema.graphqls` |
| Replication pipeline | `flexcms-replication/src/main/java/com/flexcms/replication/` |
| DAM (asset ingest, renditions) | `flexcms-dam/src/main/java/com/flexcms/dam/service/` |
| Caching + invalidation | `flexcms-cache/src/main/java/com/flexcms/cache/` |
| Docker infrastructure | `flexcms/docker-compose.yml` |
| Application config | `flexcms-app/src/main/resources/application*.yml` |
| **Frontend SDK (core)** | **`frontend/packages/sdk/src/`** |
| **React adapter** | **`frontend/packages/react/src/`** |
| **Vue adapter** | **`frontend/packages/vue/src/`** |
| **Design system (UI components)** | **`frontend/packages/ui/src/`** |
| **Theme tokens (light/dark/brand)** | **`frontend/packages/ui/src/themes/`** |
| **Admin UI (Next.js)** | **`frontend/apps/admin/src/`** |
| **Reference site (React/Next.js)** | **`frontend/apps/site-nextjs/src/`** |
| **Reference site (Vue/Nuxt)** | **`frontend/apps/site-nuxt/`** |
| **Static build worker** | **`frontend/apps/build-worker/src/`** |
| **PIM models + service** | **`flexcms-pim/src/main/java/com/flexcms/pim/`** |
| **PIM REST API** | **`flexcms-pim/.../controller/ProductApiController.java`** |
| **PIM import SPI** | **`flexcms-pim/.../importer/ProductImportSource.java`** |
| **PIM database migrations** | **`flexcms-pim/src/main/resources/db/pim/`** |

### Key Patterns to Follow
1. **Backend = JSON only, Frontend = HTML only** — The backend NEVER generates HTML. The `PublishPageController` returns JSON. All rendering (SSR, CSR) is handled by `@flexcms/react`, `@flexcms/vue`, or `@flexcms/angular` in Next.js/Nuxt/Angular SSR.
2. **Component Registry Contract** — Every component has a `dataSchema` (JSON Schema) stored in `component_definitions.data_schema`. The backend guarantees output matches the schema; the frontend renders based on it. Access via `GET /api/content/v1/component-registry`.
3. **Content is a tree** — all content lives under paths like `content.corporate.en.homepage.jcr_content.hero`. Use `.` as path separator (ltree convention).
4. **ComponentModel (field-injection)** — when adding a new backend component: extend `AbstractComponentModel`, annotate property fields with `@ValueMapValue`, inject services with `@Autowired`, and add derived getters for computed values. See `flexcms-plugin-api/spi/AbstractComponentModel.java`.
5. **Component Frontend Renderer** — when adding a new frontend component: create a React/Vue/Angular component, register it in the `ComponentMapper` with `mapper.register('myapp/hero-banner', HeroBanner)`. See `site-nextjs/src/components/component-map.tsx`.
6. **Author vs Publish** — services gated by `@ConditionalOnProperty(name = "flexcms.runmode")`. Author services are read-write; publish services are read-only.
7. **Replication events** — content changes on Author trigger `ReplicationEvent` → RabbitMQ → consumed by publish instances → cache invalidation + CDN purge.
8. **JSONB for flexibility** — component properties are stored as JSONB. Each component type defines its own property schema in `component.json`.
9. **Design system theming** — All `@flexcms/ui` components use CSS custom properties (`var(--color-primary)`, etc.). Theme switching swaps properties on `<html>` via `applyTheme()`. Brand themes can override any token.
10. **Content + DAM + PIM = three independent pillars** — PIM has its own database (`flexcms_pim`), own REST API (`/api/pim/v1/`), own Flyway migrations. CMS references products by SKU (string in JSONB); PIM references DAM assets by path (string). No cross-database foreign keys — loose coupling via identifiers.
11. **Product carryforward** — New year's catalog copies products from previous year. Products have `sourceProduct` pointer + `overriddenFields` array. Unchanged fields are inherited at read time via `getResolvedAttributes()`. Only changed fields are stored locally.
12. **Import SPI** — New import formats are added by implementing `ProductImportSource` and registering as a Spring bean. Built-in: CSV (`CsvImportSource`). `ImportConfig` provides field mapping, defaults, and transforms.
13. **Admin UI Style Guide (MANDATORY)** — Before implementing ANY admin UI page, read `Design/DesignerPrompt.md` §8. Never hardcode colors (use `var(--color-*)` tokens), never use raw HTML elements (use `@flexcms/ui` components), every page must have breadcrumbs, empty states, loading skeletons, and follow the AppShell layout. 24 rules are non-negotiable.

### Known Technical Debt
- `SecurityConfig` has `permitAll()` everywhere — this is a **placeholder**, not a design choice. Must be replaced.
- `PageApiController.getChildren()` creates a new `ContentNodeService()` manually instead of using DI — this is a bug.
- Content paths use `.` separator in DB but `/` in URLs — conversion happens in controllers but is inconsistent.
- No pagination on several endpoints that return lists.
- `ReplicationReceiver.fetchNodeFromAuthor()` is referenced but not shown — likely calls Author REST API, but implementation may be incomplete.
- `ContentNode.getChildren()` returns `List<ContentNodeData>` which is populated by `ContentNodeService.loadChildrenRecursive()` — this could be an N+1 problem at scale.

### Quick Commands for Agents

**Claude Code slash commands** (use these — they automate the full protocol):
```
/implement          Pick the next available task, read context, implement, validate, update board
/pick P1-04         Implement a specific task by ID
/continue           Resume a paused task (reads handoff notes)
/status             Show work board summary (open/in-progress/paused/done counts)
/finish             Complete or pause your current task with proper documentation
/validate           Full project build + work board consistency check
```

**Manual build commands:**
```bash
# Build backend
cd flexcms && mvn clean install

# Start local infra (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)
cd flexcms && docker-compose up -d

# Run backend (author mode)
cd flexcms/flexcms-app && mvn spring-boot:run -Dspring-boot.run.profiles=author

# Frontend — install dependencies
cd frontend && pnpm install

# Frontend — build all packages (SDK → adapters → apps)
cd frontend && pnpm build

# Frontend — dev mode for admin UI
cd frontend/apps/admin && pnpm dev

# Frontend — dev mode for reference Next.js site
cd frontend/apps/site-nextjs && pnpm dev

# Check PostgreSQL
docker exec -it flexcms-postgres psql -U flexcms -d flexcms_author

# Get component registry contract
curl http://localhost:8080/api/content/v1/component-registry

# Check RabbitMQ queues
curl -u guest:guest http://localhost:15672/api/queues

# Check Elasticsearch
curl http://localhost:9200/_cat/indices
```

---

## License

TBD — License not yet defined. Must be determined before enterprise distribution.

---

*Last updated: 2026-03-24 | Architecture assessment by Principal Software Architect*

