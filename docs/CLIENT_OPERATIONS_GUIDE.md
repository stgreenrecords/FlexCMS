# FlexCMS — Client Operations Guide

> **How to build real websites using FlexCMS + PIM + DAM**
>
> This guide covers everything a client needs to know: from initial setup to day-to-day content operations.
> Written for: Content Authors, Site Administrators, Product Managers, and Implementation Partners.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Initial Setup — Getting FlexCMS Running](#2-initial-setup--getting-flexcms-running)
3. [Architecture for Clients](#3-architecture-for-clients)
4. [Step-by-Step: Creating Your First Website](#4-step-by-step-creating-your-first-website)
5. [Working with Content (CMS)](#5-working-with-content-cms)
6. [Working with Digital Assets (DAM)](#6-working-with-digital-assets-dam)
7. [Working with Products (PIM)](#7-working-with-products-pim)
8. [Multi-Site & Multi-Language](#8-multi-site--multi-language)
9. [Content Reuse with Experience Fragments](#9-content-reuse-with-experience-fragments)
10. [Workflow & Publishing](#10-workflow--publishing)
11. [Frontend Development — Building Component Renderers](#11-frontend-development--building-component-renderers)
12. [API Reference for Integrators](#12-api-reference-for-integrators)
13. [Administration & Monitoring](#13-administration--monitoring)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Platform Overview

### What is FlexCMS?

FlexCMS is an enterprise **headless Content Management System** with three independent pillars:

| Pillar | Purpose | Example |
|--------|---------|---------|
| **Content (CMS)** | Manage page trees, components, and content hierarchy | Website pages, landing pages, articles |
| **Digital Assets (DAM)** | Upload, store, process, and deliver images/videos/documents | Product photos, hero banners, PDFs |
| **Products (PIM)** | Manage product catalogs, schemas, attributes, and variants | Car models, product specs, pricing |

### Key Concepts

```
┌──────────────────────────────────────────────────────────┐
│  AUTHOR environment (read-write)                         │
│  • Authors create & edit content, upload assets,         │
│    manage products                                       │
│  • Content goes through workflow (draft → review →       │
│    approve → publish)                                    │
│  • Published content replicates to PUBLISH environment   │
└──────────────────┬───────────────────────────────────────┘
                   │  RabbitMQ replication
┌──────────────────▼───────────────────────────────────────┐
│  PUBLISH environment (read-only)                         │
│  • Serves content via REST + GraphQL APIs                │
│  • Frontend apps (Next.js, Nuxt, mobile) fetch JSON here │
│  • Behind CDN for global performance                     │
└──────────────────────────────────────────────────────────┘
```

**FlexCMS never generates HTML.** It returns JSON only. Your frontend application (Next.js, Nuxt, React, Vue, mobile app) renders the HTML using the FlexCMS SDK.

---

## 2. Initial Setup — Getting FlexCMS Running

### Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| **Docker Desktop** | Latest | Runs PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch |
| **Java 21** | Eclipse Temurin | Backend runtime |
| **Maven 3.9+** | Latest | Backend build tool |
| **Node.js 20+** | LTS | Frontend runtime |
| **pnpm 9+** | Latest | Frontend package manager |

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/flexcms.git
cd flexcms
```

### Step 2: Start Everything with One Command

```powershell
# Windows PowerShell
flex start local all
```

```bash
# macOS / Linux
./flex start local all
```

This command:
1. Starts all infrastructure containers (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch, pgAdmin)
2. Compiles all backend modules
3. Launches the Author backend on **port 8080**
4. Launches the Publish backend on **port 8081**
5. Launches the Admin UI on **port 3000**

### Step 3: Verify Services

```bash
flex status
```

Expected output:
```
UP  PostgreSQL     :5432
UP  Redis          :6379
UP  RabbitMQ       :5672
UP  MinIO          :9000
UP  Elasticsearch  :9200
UP  pgAdmin 4      :5050
UP  Author API     :8080
UP  Publish API    :8081
UP  Admin UI       :3000
```

### Step 4: Access the Applications

| Application | URL | Purpose |
|---|---|---|
| **Admin UI** | http://localhost:3000 | Content authoring interface |
| **Author API** | http://localhost:8080 | REST + GraphQL APIs (read-write) |
| **Publish API** | http://localhost:8081 | REST + GraphQL APIs (read-only delivery) |
| **pgAdmin (DB Browser)** | http://localhost:5050 | Browse database tables |
| **MinIO Console** | http://localhost:9001 | Browse uploaded assets |
| **RabbitMQ Management** | http://localhost:15672 | Monitor message queues |

### Stopping the Platform

```bash
flex stop local
```

### Resetting All Data

```bash
flex reset    # ⚠️ Deletes all data volumes — fresh start
```

---

## 3. Architecture for Clients

### The Content Tree

All content in FlexCMS is organized as a **tree** — similar to a file system:

```
content/
├── my-company-gb/           # Site: Great Britain
│   └── en/                  # Locale: English
│       ├── home             # Home page
│       ├── products/        # Products section
│       │   ├── product-a    # Product detail page
│       │   └── product-b    # Product detail page
│       └── about            # About page
├── my-company-de/           # Site: Germany
│   └── de/                  # Locale: German
│       ├── home
│       └── ...
```

**Key rules:**
- Every **site** is a top-level node (e.g., `my-company-gb`)
- Each site has **locale branches** (e.g., `en`, `de`, `fr`)
- Pages are nodes in the tree
- Components are child nodes of pages
- URLs map directly to tree paths: `/products/product-a` → `content.my-company-gb.en.products.product-a`

### Components

Every page is composed of **components** — reusable building blocks:

```
page: /products/product-a
├── header    → experience-fragment (shared site header)
├── breadcrumb → breadcrumb component
├── main      → container (layout wrapper)
│   ├── hero        → hero-banner (full-width image + text)
│   ├── description → text-image (text + product image)
│   ├── specs       → product-specs (reads from PIM)
│   └── cta         → cta-banner (call to action)
└── footer    → experience-fragment (shared site footer)
```

Each component type has a **data schema** — a contract that defines what properties it accepts. The backend guarantees output matches the schema; the frontend renders based on it.

---

## 4. Step-by-Step: Creating Your First Website

### Overview of Steps

```
1. Define your component types     →  What building blocks will pages use?
2. Create your site                →  Define the site with locales
3. Upload assets to DAM            →  Images, videos, documents
4. Create products in PIM          →  If you have a product catalog
5. Create experience fragments     →  Shared header/footer
6. Build the page tree             →  Create pages + add components
7. Publish content                 →  Move through workflow to go live
8. Build frontend renderers        →  React/Vue components that render JSON
```

### Step 1: Define Component Types

Before authoring content, register the component types your site will use. This is done via the API or a database migration.

**Example: Register a Hero Banner component**

```bash
curl -X POST http://localhost:8080/api/author/content/component-definitions \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "mysite/hero-banner",
    "name": "hero-banner",
    "title": "Hero Banner",
    "groupName": "Marketing",
    "isContainer": false,
    "dataSchema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "subtitle": { "type": "string" },
        "backgroundImage": { "type": "string" },
        "ctaLabel": { "type": "string" },
        "ctaLink": { "type": "string" }
      },
      "required": ["title", "backgroundImage"]
    }
  }'
```

**Built-in components** (available out of the box):

| Component | Resource Type | Purpose |
|-----------|--------------|---------|
| Page | `flexcms/page` | Page node |
| Container | `flexcms/container` | Layout wrapper (single, 2-col, 3-col) |
| Rich Text | `flexcms/rich-text` | HTML content block |
| Image | `flexcms/image` | Responsive image |
| Header | `flexcms/shared-header` | Site header |
| Footer | `flexcms/shared-footer` | Site footer |
| Site Root | `flexcms/site-root` | Site root node |
| XF Reference | `flexcms/experience-fragment` | Reference to shared content |

### Step 2: Create Your Site

```bash
curl -X POST http://localhost:8080/api/admin/sites \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "my-company-gb",
    "title": "My Company — United Kingdom",
    "defaultLocale": "en",
    "supportedLocales": ["en"],
    "userId": "admin"
  }'
```

Then create the root content nodes:

```bash
# Site root
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content",
    "name": "my-company-gb",
    "resourceType": "flexcms/site-root",
    "properties": { "jcr:title": "My Company GB" },
    "userId": "admin"
  }'

# Locale root
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.my-company-gb",
    "name": "en",
    "resourceType": "flexcms/container",
    "properties": { "jcr:title": "English", "jcr:language": "en" },
    "userId": "admin"
  }'
```

### Step 3: Upload Assets to DAM

```bash
# Upload a hero banner image
curl -X POST http://localhost:8080/api/author/assets \
  -F "file=@hero-banner.jpg" \
  -F "path=/dam/my-company/banners/hero-banner.jpg" \
  -F "siteId=my-company-gb" \
  -F "userId=admin"
```

After upload, the DAM automatically:
- Detects MIME type
- Extracts image dimensions
- Generates responsive renditions (thumbnail, web-small, web-medium, web-large)
- Stores the original + renditions in S3/MinIO

You can browse uploaded assets at: **http://localhost:9001** (MinIO Console)

### Step 4: Create Products in PIM

#### 4a: Create a Product Schema

```bash
curl -X POST http://localhost:8080/api/pim/v1/schemas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vehicle v2026",
    "version": "2026.1",
    "attributeSchema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "tagline": { "type": "string" },
        "bodyStyle": { "type": "string", "enum": ["Sedan", "SUV", "Coupé", "GT"] },
        "horsepower": { "type": "number" },
        "price": { "type": "number" }
      },
      "required": ["name"]
    }
  }'
```

#### 4b: Create a Catalog

```bash
curl -X POST http://localhost:8080/api/pim/v1/catalogs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2026 Model Lineup",
    "year": 2026,
    "season": "Full Year",
    "status": "ACTIVE"
  }'
```

#### 4c: Create Products

```bash
curl -X POST http://localhost:8080/api/pim/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "MY-CAR-2026",
    "name": "My Car Model",
    "catalogId": "<catalog-uuid>",
    "schemaId": "<schema-uuid>",
    "status": "ACTIVE",
    "attributes": {
      "name": "My Car Model",
      "tagline": "Drive the future",
      "bodyStyle": "Sedan",
      "horsepower": 500,
      "price": 150000
    }
  }'
```

#### 4d: Link Products to DAM Assets

```bash
curl -X POST http://localhost:8080/api/pim/v1/products/MY-CAR-2026/assets \
  -H "Content-Type: application/json" \
  -d '{
    "assetPath": "/dam/my-company/models/my-car.jpg",
    "role": "hero",
    "sortOrder": 0
  }'
```

### Step 5: Create Experience Fragments

Experience Fragments (XFs) let you author shared content (headers, footers, promo bars) once and reference them across all pages.

```bash
# Create XF folder
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.experience-fragments.my-company-gb.en",
    "name": "header",
    "resourceType": "flexcms/xf-folder",
    "properties": { "jcr:title": "Site Header" },
    "userId": "admin"
  }'

# Create master variation
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.experience-fragments.my-company-gb.en.header",
    "name": "master",
    "resourceType": "flexcms/xf-page",
    "properties": { "jcr:title": "Header Master" },
    "userId": "admin"
  }'

# Add navigation component inside the XF
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.experience-fragments.my-company-gb.en.header.master",
    "name": "navigation",
    "resourceType": "mysite/navigation",
    "properties": {
      "rootPath": "content.my-company-gb.en",
      "brandName": "My Company",
      "depth": 2
    },
    "userId": "admin"
  }'
```

### Step 6: Build the Page Tree

```bash
# Create home page
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.my-company-gb.en",
    "name": "home",
    "resourceType": "flexcms/page",
    "properties": {
      "jcr:title": "Home",
      "sling:resourceType": "flexcms/page"
    },
    "userId": "admin"
  }'

# Add hero banner component to home page
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.my-company-gb.en.home",
    "name": "hero",
    "resourceType": "mysite/hero-banner",
    "properties": {
      "title": "Welcome to My Company",
      "subtitle": "Innovation meets excellence",
      "backgroundImage": "/dam/my-company/banners/hero-banner.jpg",
      "ctaLabel": "Explore",
      "ctaLink": "/products"
    },
    "userId": "admin"
  }'

# Add XF reference for header
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.my-company-gb.en.home",
    "name": "header",
    "resourceType": "flexcms/experience-fragment",
    "properties": {
      "fragmentPath": "content.experience-fragments.my-company-gb.en.header.master"
    },
    "userId": "admin"
  }'
```

### Step 7: Publish Content

```bash
# Start publish workflow
curl -X POST http://localhost:8080/api/author/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "contentPath": "content.my-company-gb.en.home",
    "workflowName": "standard-publish",
    "userId": "admin"
  }'

# Move through workflow steps (Submit → Approve → Publish)
# The response from /start returns an instanceId — use it here:
curl -X POST http://localhost:8080/api/author/workflow/advance \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "<instance-uuid-from-start>",
    "action": "submit",
    "userId": "admin"
  }'
```

### Step 8: Build Frontend Component Renderers

In your Next.js project, create a component for each type:

```tsx
// components/HeroBanner.tsx
export function HeroBanner({ data }: { data: Record<string, unknown> }) {
  return (
    <section
      className="relative h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${data.backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex flex-col items-center justify-center h-full text-white">
        <h1 className="text-6xl font-bold">{data.title as string}</h1>
        <p className="text-xl mt-4">{data.subtitle as string}</p>
        {data.ctaLabel && (
          <a href={data.ctaLink as string} className="mt-8 px-8 py-3 bg-white text-black">
            {data.ctaLabel as string}
          </a>
        )}
      </div>
    </section>
  );
}
```

Register it in the component map:

```tsx
// component-map.tsx
import { ComponentMapper } from '@flexcms/sdk';
import { HeroBanner } from './HeroBanner';

export const componentMap = new ComponentMapper()
  .registerAll({
    'mysite/hero-banner': HeroBanner,
    // ... other components
  });
```

---

## 5. Working with Content (CMS)

### Content Operations via Admin UI

| Operation | How |
|-----------|-----|
| **Browse content tree** | Admin UI → Content → expand tree sidebar |
| **Create a page** | Click "+" button in tree → select template → fill properties |
| **Edit a page** | Click page in tree → property panel opens → edit fields |
| **Move a page** | Drag & drop in tree or use context menu → Move |
| **Delete a page** | Context menu → Delete (moves to trash) |
| **Publish a page** | Context menu → Publish → workflow starts |

### Content Operations via API

```bash
# List all pages under a path
GET /api/author/content/list?parentPath=content.my-company-gb.en

# Get a single page with all components
GET /api/content/v1/pages/content/my-company-gb/en/home

# Update a component's properties
PUT /api/author/content/node
{
  "path": "content.my-company-gb.en.home.hero",
  "properties": { "title": "Updated Headline" },
  "userId": "admin"
}

# Delete a node
DELETE /api/author/content/node?path=content.my-company-gb.en.home.hero&userId=admin
```

### Content Delivery (for frontend apps)

```bash
# REST API — get page as JSON
GET http://localhost:8081/api/content/v1/pages/content/my-company-gb/en/home
Headers: X-FlexCMS-Site: my-company-gb, X-FlexCMS-Locale: en

# GraphQL — get page with components
POST http://localhost:8081/graphql
{
  "query": "{ page(path: \"/content/my-company-gb/en/home\") { title components { name resourceType data } } }"
}
```

---

## 6. Working with Digital Assets (DAM)

### Asset Lifecycle

```
Upload → Auto-detect type → Extract metadata → Generate renditions → Store in S3/MinIO
```

### Supported Formats

| Type | Formats |
|------|---------|
| Images | JPEG, PNG, WebP, SVG, GIF, TIFF |
| Videos | MP4, WebM, MOV |
| Documents | PDF, DOCX, XLSX, PPTX |

### Auto-Generated Renditions

When you upload an image, the DAM automatically creates:

| Rendition | Size | Use Case |
|-----------|------|----------|
| `thumbnail` | 150×150 | Admin UI previews |
| `web-small` | 480px wide | Mobile |
| `web-medium` | 960px wide | Tablet |
| `web-large` | 1440px wide | Desktop |
| `hero-desktop` | 1920px wide | Full-width banners |
| `hero-mobile` | 768px wide | Mobile banners |

### DAM API

```bash
# Upload an asset
POST /api/author/assets
Content-Type: multipart/form-data
  file: <binary>
  path: /dam/my-company/images/photo.jpg
  siteId: my-company-gb
  userId: admin

# List assets in a folder
GET /api/author/assets?folder=/dam/my-company/images

# Get asset metadata
GET /api/author/assets/metadata?path=/dam/my-company/images/photo.jpg

# Delete an asset
DELETE /api/author/assets?path=/dam/my-company/images/photo.jpg&userId=admin
```

### Referencing Assets in Content

When authoring components, reference assets by their DAM path:

```json
{
  "backgroundImage": "/dam/my-company/banners/hero.jpg",
  "productImage": "/dam/my-company/models/car-1.png"
}
```

The frontend SDK resolves these paths to CDN URLs automatically.

---

## 7. Working with Products (PIM)

### PIM Concepts

| Concept | Description |
|---------|-------------|
| **Product Schema** | Defines the structure (attributes, types, validation) for a product category |
| **Catalog** | Groups products by year/season/collection |
| **Product** | A single product with attributes validated against its schema |
| **Product Variant** | Variations of a product (colors, sizes, trims) |
| **Product Version** | Historical snapshots for year-over-year comparison |
| **Carryforward** | Copy last year's products into a new catalog, inheriting unchanged attributes |

### PIM API

```bash
# CRUD for schemas
POST/GET/PUT/DELETE /api/pim/v1/schemas

# CRUD for catalogs
POST/GET/PUT/DELETE /api/pim/v1/catalogs

# CRUD for products
POST/GET/PUT/DELETE /api/pim/v1/products
GET /api/pim/v1/products?catalogId=<uuid>&status=ACTIVE

# Product variants
POST /api/pim/v1/products/<sku>/variants
GET /api/pim/v1/products/<sku>/variants

# Import products from CSV/Excel/JSON
POST /api/pim/v1/import
Content-Type: multipart/form-data
  file: products.csv
  schemaId: <uuid>
  catalogId: <uuid>
  format: CSV
```

### Using Products in CMS Pages

Products are referenced by **SKU** in CMS components:

```json
{
  "resourceType": "mysite/product-teaser",
  "properties": {
    "productSku": "MY-CAR-2026",
    "displayMode": "hero"
  }
}
```

At render time, the frontend SDK calls the PIM API to fetch product data and merges it with the component template.

---

## 8. Multi-Site & Multi-Language

### Site Configuration

Each site is independent with its own:
- Content tree (`content.{siteId}`)
- DAM folder (`/dam/{siteId}`)
- Experience fragments (`content.experience-fragments.{siteId}`)
- Locale branches (`content.{siteId}.{locale}`)

### Adding a New Locale

```bash
# Create locale root
curl -X POST http://localhost:8080/api/author/content/node \
  -H "Content-Type: application/json" \
  -d '{
    "parentPath": "content.my-company-gb",
    "name": "fr",
    "resourceType": "flexcms/container",
    "properties": { "jcr:title": "French", "jcr:language": "fr" },
    "userId": "admin"
  }'
```

### Language Copy

To create a translated version of a page:

```bash
# Copy English page tree to French
POST /api/author/i18n/language-copy
{
  "sourcePath": "content.my-company-gb.en",
  "targetLocale": "fr",
  "copyMode": "STRUCTURE_AND_CONTENT",
  "userId": "admin"
}
```

This creates the same page structure under `content.my-company-gb.fr` with English content — ready for translation.

---

## 9. Content Reuse with Experience Fragments

### What Are Experience Fragments?

Experience Fragments (XFs) are authored content snippets that can be **shared across multiple pages**. Common use cases:

- Site header / navigation
- Site footer
- Promotional banners
- Newsletter signup forms

### How They Work

1. **Author the XF** once (e.g., site header with navigation menu)
2. **Reference it** from any page using `flexcms/experience-fragment` component
3. **Update in one place** — all pages automatically get the updated content

```
Header XF (content.experience-fragments.my-company-gb.en.header.master)
  └── navigation component (rootPath, brandLogo, etc.)

Page: /home
  └── header → XF reference → points to header.master
Page: /about
  └── header → XF reference → points to header.master  (same XF!)
Page: /products
  └── header → XF reference → points to header.master  (same XF!)
```

### Country-Specific Variations

Each site+locale has its own XFs. This allows:
- UK header: shows GBP prices, UK-specific links
- Germany header: shows EUR prices, German links, different legal menu
- Canada header: shows bilingual language toggle (EN | FR)

---

## 10. Workflow & Publishing

### Standard Publish Workflow

```
DRAFT → Submit for Review → IN REVIEW → Approve → APPROVED → Publish → PUBLISHED
                                     ↘ Reject → DRAFT (back to author)
```

### Workflow Roles

| Role | Can Do |
|------|--------|
| **Content Author** | Create, edit, submit for review |
| **Content Reviewer** | Approve or reject submissions |
| **Content Publisher** | Publish approved content to live |
| **Admin** | All of the above + site management |

### What Happens on Publish

1. Content status changes to `PUBLISHED`
2. Replication event fires via RabbitMQ
3. Publish environment receives the content
4. Cache is invalidated (Redis + CDN)
5. Content is now live for frontend apps

---

## 11. Frontend Development — Building Component Renderers

### The Contract

Every component type has a `dataSchema` (JSON Schema) that defines its properties. Access the registry:

```bash
GET http://localhost:8080/api/content/v1/component-registry
```

Response:
```json
[
  {
    "resourceType": "flexcms/rich-text",
    "title": "Rich Text",
    "dataSchema": {
      "type": "object",
      "properties": {
        "content": { "type": "string", "description": "HTML content" }
      }
    }
  }
]
```

### React Integration (Next.js)

```bash
cd frontend
pnpm install
cd apps/site-nextjs
pnpm dev    # http://localhost:3001
```

The reference site demonstrates the full pattern:
1. `@flexcms/sdk` — fetches JSON from the API
2. `@flexcms/react` — provides `<FlexCmsPage>` and `<FlexCmsComponent>`
3. `component-map.tsx` — maps `resourceType` strings to React components

### Vue Integration (Nuxt)

```bash
cd frontend/apps/site-nuxt
pnpm dev    # http://localhost:3002
```

Uses `@flexcms/vue` plugin with `<FlexCmsPage>` and `<FlexCmsComponent>` composables.

---

## 12. API Reference for Integrators

### REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/content/v1/pages/{path}` | GET | Get page with components |
| `/api/content/v1/component-registry` | GET | List all component types |
| `/api/author/content/node` | POST | Create content node |
| `/api/author/content/node` | PUT | Update content node |
| `/api/author/content/list` | GET | List children of a path |
| `/api/admin/sites` | POST/GET | Manage sites |
| `/api/author/assets` | POST | Upload DAM asset |
| `/api/author/assets` | GET | List/search assets |
| `/api/author/workflow/start` | POST | Start workflow |
| `/api/author/workflow/advance` | POST | Advance workflow step |
| `/api/pim/v1/products` | CRUD | Manage products |
| `/api/pim/v1/catalogs` | CRUD | Manage catalogs |
| `/api/pim/v1/schemas` | CRUD | Manage product schemas |
| `/api/pim/v1/import` | POST | Import products (CSV/Excel/JSON) |
| `/graphql` | POST | GraphQL endpoint |
| `/graphiql` | GET | GraphQL playground |

### Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `X-FlexCMS-Site` | Target site | `my-company-gb` |
| `X-FlexCMS-Locale` | Target locale | `en` |
| `Content-Type` | Request format | `application/json` |

---

## 13. Administration & Monitoring

### Database Access

**pgAdmin 4** is available at http://localhost:5050 — opens directly with no login.

Three databases are pre-configured:
- **FlexCMS Author DB** (`flexcms_author`) — content tree, assets, workflows
- **FlexCMS Publish DB** (`flexcms_publish`) — replicated read-only content
- **FlexCMS PIM DB** (`flexcms_pim`) — products, catalogs, schemas

### Key Tables

| Table | Database | Purpose |
|-------|----------|---------|
| `content_nodes` | author/publish | The content tree |
| `sites` | author/publish | Site definitions |
| `assets` | author/publish | DAM asset metadata |
| `component_definitions` | author/publish | Component type registry |
| `workflow_definitions` | author | Workflow templates |
| `workflow_instances` | author | Active workflow executions |
| `products` | pim | Product catalog |
| `catalogs` | pim | Product catalogs |
| `product_schemas` | pim | Product attribute schemas |

### Infrastructure Monitoring

| Service | Management URL | What to Monitor |
|---------|---------------|-----------------|
| RabbitMQ | http://localhost:15672 | Queue depth, message rates |
| MinIO | http://localhost:9001 | Storage usage, bucket health |
| Elasticsearch | http://localhost:9200/_cat/health | Cluster health, index count |
| Redis | `docker exec flexcms-redis redis-cli info` | Memory usage, hit rate |

### Log Files

```bash
flex logs author     # Author backend logs
flex logs publish    # Publish backend logs
flex logs admin      # Admin UI logs
```

---

## 14. Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| `flex start local all` fails at compile | Java source errors | Check `mvn clean compile` output, fix errors |
| Admin UI shows empty pages | Backend not running | Check `flex status`, ensure Author API is UP |
| Assets not uploading | MinIO not running | `docker ps`, check `flexcms-minio` container |
| Content not appearing on Publish | Replication queue stuck | Check RabbitMQ at http://localhost:15672 |
| PIM API returns 500 | PIM database not initialized | Verify `flexcms_pim` database exists in pgAdmin |
| GraphQL queries return null | Wrong path format | Use `/content/...` prefix for page queries |
| Search returns empty | Elasticsearch not indexed | Check ES health at http://localhost:9200 |

### Health Check Commands

```bash
# Check all services
flex status

# Check PostgreSQL
docker exec flexcms-postgres pg_isready -U flexcms

# Check database tables exist
docker exec flexcms-postgres psql -U flexcms -d flexcms_author -c "\dt"

# Check RabbitMQ queues
curl -s -u guest:guest http://localhost:15672/api/queues | jq '.[].name'

# Check MinIO buckets
docker exec flexcms-minio mc ls local/

# Check Elasticsearch indices
curl -s http://localhost:9200/_cat/indices
```

### Getting Help

- **Architecture documentation:** `Design/cms_architecture/` (12 design documents)
- **Database schema:** `Design/cms_architecture/09_DATABASE_SCHEMA.md`
- **Frontend architecture:** `Design/cms_architecture/10_FRONTEND_ARCHITECTURE.md`
- **PIM system design:** `Design/cms_architecture/12_PIM_SYSTEM.md`
- **Dev environment issues:** `docs/DEV_ENVIRONMENT_RELIABILITY.md`
- **Test data specification:** `docs/TEST_DATA_SPECIFICATION.md`

---

*Last updated: 2026-03-26 | FlexCMS v1.0.0-SNAPSHOT*

