# Product Information Management (PIM)

## 1. Design Philosophy

PIM is one of the **three independent pillars** of FlexCMS:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CONTENT   │    │     DAM     │    │     PIM     │
│  (CMS Core) │    │   (Assets)  │    │  (Products) │
│             │    │             │    │             │
│ Pages       │    │ Images      │    │ Catalogs    │
│ Components  │    │ Videos      │    │ Products    │
│ Templates   │    │ Documents   │    │ Variants    │
│ Navigation  │    │ Renditions  │    │ Attributes  │
│ Workflows   │    │ Metadata    │    │ Pricing     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                  ┌───────▼───────┐
                  │  Integration  │
                  │    Layer      │
                  │               │
                  │ Content refs  │
                  │ product by    │
                  │ SKU in JSONB; │
                  │ DAM refs      │
                  │ product by    │
                  │ asset path    │
                  └───────────────┘
```

**Key principles:**
1. **PIM has its own database** — separate PostgreSQL schema (`flexcms_pim`), own Flyway migrations, own connection pool. PIM data does not pollute the CMS content tree.
2. **PIM has its own REST + GraphQL API** — independent of the CMS headless API. Frontend teams can query products without knowing CMS internals.
3. **Native cross-references** — CMS content nodes reference products by SKU; products reference DAM assets by path. These references are **loose coupling** (string identifiers), not foreign keys across databases.
4. **Schema-driven products** — Product structures are defined by **Product Schemas** (JSON Schema). Adding a product type (e.g., "Electronics 2027") means creating a new schema version, not changing code.
5. **Year-over-year carryforward** — Products can be cloned from one catalog year to another; only delta changes are required. Unchanged attributes inherit from the source.

---

## 2. Data Model

### 2.1 Core Entities

```
┌──────────────────┐
│  ProductSchema    │  Defines the shape of products (like a "type" definition)
│──────────────────│  e.g., "Electronics v2026", "Apparel v2026"
│  id               │
│  name             │  Each schema has a JSON Schema defining attributes
│  version          │  Schemas are versioned — 2026 → 2027 inherit + override
│  schema (JSONB)   │
│  parent_version   │  Points to previous year's schema for inheritance
└───────┬──────────┘
        │ 1:N
┌───────▼──────────┐
│  Catalog          │  Groups products for a business context
│──────────────────│  e.g., "Summer 2026", "B2B Wholesale 2027"
│  id               │
│  name             │
│  year / season    │
│  status           │  DRAFT → ACTIVE → ARCHIVED
│  schema_id        │
└───────┬──────────┘
        │ 1:N
┌───────▼──────────┐
│  Product          │  A single product entry
│──────────────────│
│  id               │
│  sku (unique)     │  Global product identifier (referenced by CMS + DAM)
│  catalog_id       │
│  schema_id        │
│  attributes (JSONB)│  Conforms to the ProductSchema definition
│  status           │  DRAFT → REVIEW → PUBLISHED → ARCHIVED
│  source_product_id│  Points to previous year's version (for carryforward)
│  overridden_fields│  Tracks which fields were manually changed vs inherited
└───────┬──────────┘
        │ 1:N
┌───────▼──────────┐
│  ProductVariant   │  SKU-level variants (size, color, etc.)
│──────────────────│
│  id               │
│  product_id       │
│  variant_sku      │  e.g., "SHOE-X1-RED-42"
│  attributes (JSONB)│  Variant-specific overrides
│  pricing (JSONB)  │  Price tiers, currencies
│  inventory (JSONB)│  Stock levels, warehouse data
└──────────────────┘

┌──────────────────┐
│  ProductAssetRef  │  Links products ↔ DAM assets (loose coupling)
│──────────────────│
│  product_id       │
│  asset_path       │  DAM path (e.g., "/dam/products/shoe-x1/hero.jpg")
│  role             │  "hero", "gallery", "thumbnail", "swatch", "document"
│  order_index      │
└──────────────────┘

┌──────────────────┐
│  ImportJob        │  Tracks bulk imports from external sources
│──────────────────│
│  id               │
│  source_type      │  API, CSV, EXCEL, JSON
│  status           │  PENDING → PROCESSING → COMPLETED → FAILED
│  total / success  │
│  error_log (JSONB)│
└──────────────────┘
```

### 2.2 Schema Inheritance (Year-over-Year)

```
ProductSchema "Electronics v2026"
  ├── attributes: name, description, brand, weight, dimensions, warranty
  ├── attribute groups: General, Physical, Warranty
  └── validations: name required, weight > 0

ProductSchema "Electronics v2027" (inherits from v2026)
  ├── ADDED: energyRating (new EU regulation)
  ├── MODIFIED: warranty → renamed "warrantyMonths", type changed to integer
  └── REMOVED: (nothing removed — backward compatible)
  
Product "Laptop X1" in Catalog "2026"
  └── attributes: { name: "Laptop X1", brand: "TechCo", weight: 1.8, ... }

Product "Laptop X1" in Catalog "2027" (carryforward from 2026)
  └── source_product_id → points to 2026 version
  └── overridden_fields: ["energyRating"]  (only this was manually set)
  └── attributes: { energyRating: "A+" }   (rest inherited from 2026 version)
```

At read time, the PIM service **merges** the source product's attributes with the overridden fields — so the 2027 product appears complete even though only 1 field was edited.

### 2.3 Integration Points

| From | To | Mechanism |
|---|---|---|
| CMS → PIM | Content node has `productSku: "SHOE-X1"` in JSONB properties | CMS Sling Model calls PIM API to enrich component data |
| PIM → DAM | Product has `ProductAssetRef` rows pointing to DAM paths | PIM API returns DAM URLs in product response |
| PIM → CMS | Product publish triggers CMS page rebuild (if page references product) | RabbitMQ event: `product.published` → build worker recompiles affected pages |
| DAM → PIM | Asset metadata update triggers PIM product re-index | RabbitMQ event: `asset.updated` → PIM updates asset references |

---

## 3. Import Architecture (Multi-Source)

PIM supports ingesting products from multiple sources:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  CSV Upload │  │ Excel Upload│  │ JSON/API    │  │ Scheduled   │
│  (File)     │  │ (File)      │  │ (REST)      │  │ Feed (Cron) │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┼────────────────┼────────────────┘
                        │
                ┌───────▼───────┐
                │  ImportService │
                │               │
                │  1. Parse     │  (pluggable parsers per format)
                │  2. Validate  │  (against ProductSchema)
                │  3. Map       │  (field mapping rules)
                │  4. Upsert    │  (create or update by SKU)
                │  5. Log       │  (ImportJob tracking)
                └───────────────┘
```

### 3.1 Import Source SPI

```java
public interface ProductImportSource {
    String getSourceType();           // "CSV", "EXCEL", "JSON", "API"
    Stream<RawProductRecord> parse(InputStream input, ImportConfig config);
}

public interface FieldMappingProfile {
    String getName();
    Map<String, String> getMappings();  // sourceField → schemaAttribute
    Map<String, String> getDefaults();  // attribute → default value
    Map<String, String> getTransforms();// attribute → transform expression
}
```

### 3.2 Schema Definition from Sources

Product schemas can be auto-generated from the first import of a new source:

1. **From CSV/Excel** — PIM reads the header row, infers data types from sample rows, generates a draft ProductSchema
2. **From API** — PIM calls the external API, inspects the JSON response structure, generates a draft ProductSchema
3. **From manual definition** — Admin UI provides a visual schema editor

---

## 4. API Design

### 4.1 REST API

```
/api/pim/v1/

  Schemas:
    GET    /schemas                          List all product schemas
    POST   /schemas                          Create schema
    GET    /schemas/{id}                     Get schema (with resolved inheritance)
    PUT    /schemas/{id}                     Update schema
    POST   /schemas/{id}/new-version         Create new version (year rollover)

  Catalogs:
    GET    /catalogs                         List catalogs
    POST   /catalogs                         Create catalog
    GET    /catalogs/{id}                    Get catalog
    PUT    /catalogs/{id}                    Update catalog
    POST   /catalogs/{id}/carryforward       Clone products to new catalog year

  Products:
    GET    /products                         List (paginated, filterable)
    POST   /products                         Create
    GET    /products/{sku}                   Get by SKU (resolved — merged with source)
    PUT    /products/{sku}                   Update (tracks overridden fields)
    DELETE /products/{sku}                   Archive
    GET    /products/{sku}/variants          List variants
    POST   /products/{sku}/variants          Add variant
    GET    /products/{sku}/assets            List associated DAM assets
    POST   /products/{sku}/assets            Link DAM asset
    GET    /products/{sku}/history           Version history

  Import:
    POST   /import/csv                       Import from CSV
    POST   /import/excel                     Import from Excel
    POST   /import/json                      Import from JSON
    POST   /import/api                       Import from external API
    GET    /import/jobs                      List import jobs
    GET    /import/jobs/{id}                 Get import job status

  Search:
    GET    /products/search?q=...            Full-text product search
    POST   /products/search                  Advanced search (filters, facets)
```

### 4.2 GraphQL (extends the existing schema)

```graphql
extend type Query {
  product(sku: String!): Product
  products(catalogId: ID, query: String, filters: [ProductFilter], limit: Int, offset: Int): ProductConnection
  productSchema(id: ID!): ProductSchema
  catalogs(year: Int, status: String): [Catalog!]!
}

type Product {
  id: ID!
  sku: String!
  name: String!
  catalog: Catalog!
  schema: ProductSchema!
  attributes: JSON!
  status: String!
  variants: [ProductVariant!]!
  assets: [ProductAssetReference!]!
  sourceProduct: Product
  overriddenFields: [String!]!
  createdAt: String!
  updatedAt: String!
}

type ProductVariant {
  id: ID!
  variantSku: String!
  attributes: JSON!
  pricing: JSON
  inventory: JSON
}

type ProductAssetReference {
  assetPath: String!
  role: String!
  # Resolved DAM asset (if DAM is available)
  asset: Asset
}

type Catalog {
  id: ID!
  name: String!
  year: Int!
  season: String
  status: String!
  productCount: Int!
}

type ProductSchema {
  id: ID!
  name: String!
  version: String!
  schema: JSON!
  parentVersion: ProductSchema
  attributeGroups: [AttributeGroup!]!
}

type AttributeGroup {
  name: String!
  attributes: [SchemaAttribute!]!
}

type SchemaAttribute {
  name: String!
  type: String!
  label: String
  required: Boolean!
  options: [String!]
  defaultValue: JSON
}

type ProductConnection {
  totalCount: Int!
  items: [Product!]!
  facets: [Facet!]
}

type Facet {
  field: String!
  values: [FacetValue!]!
}

type FacetValue {
  value: String!
  count: Int!
}

input ProductFilter {
  field: String!
  operator: String!   # eq, ne, gt, lt, gte, lte, in, contains
  value: JSON!
}
```

---

## 5. CMS ↔ PIM Integration Pattern

A CMS component references a product — the Sling Model enriches the data at render time:

```java
@FlexCmsComponent(resourceType = "myapp/product-card", title = "Product Card")
public class ProductCardModel extends AbstractComponentModel {

    @ValueMapValue
    private String productSku;       // authored in CMS: "SHOE-X1"

    @ValueMapValue
    private String displayVariant;   // authored in CMS: "RED-42" (optional)

    @Autowired
    private PimClient pimClient;     // PIM API client (injected by Spring)

    @Autowired
    private DamService damService;   // DAM service (injected by Spring)

    // Derived getters — auto-exported to model
    public Object getProduct() {
        return pimClient.getProduct(productSku);
    }

    public String getHeroImageUrl() {
        var assets = pimClient.getProductAssets(productSku);
        return assets.stream()
            .filter(a -> "hero".equals(a.getRole()))
            .findFirst()
            .map(a -> damService.getCdnUrl(a.getAssetPath()))
            .orElse(null);
    }
}
```

**Frontend** receives the merged JSON:
```json
{
  "productSku": "SHOE-X1",
  "product": {
    "sku": "SHOE-X1",
    "name": "Running Shoe X1",
    "attributes": { "brand": "SportCo", "material": "Mesh", "weight": 280 },
    "variants": [ ... ],
    "assets": [ { "role": "hero", "assetPath": "/dam/products/shoe-x1/hero.jpg" } ]
  },
  "heroImageUrl": "https://cdn.example.com/renditions/uuid/hero-desktop.webp"
}
```

The frontend team renders this using `@flexcms/react` — they never call the PIM API directly; the backend Sling Model does the enrichment.

---

## 6. Database Schema

PIM uses a **separate database** (`flexcms_pim`):

```sql
-- =============================================================================
-- PIM Schema — Product Information Management
-- Separate database: flexcms_pim
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- PRODUCT SCHEMAS (type definitions)
CREATE TABLE product_schemas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    version         VARCHAR(64) NOT NULL,
    description     TEXT,
    schema_def      JSONB NOT NULL,           -- JSON Schema draft-07
    attribute_groups JSONB DEFAULT '[]',       -- grouped attribute layout for UI
    parent_id       UUID REFERENCES product_schemas(id),
    active          BOOLEAN DEFAULT TRUE,
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, version)
);

-- CATALOGS
CREATE TABLE catalogs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    year            INTEGER NOT NULL,
    season          VARCHAR(64),
    description     TEXT,
    schema_id       UUID NOT NULL REFERENCES product_schemas(id),
    status          VARCHAR(20) DEFAULT 'DRAFT',
    settings        JSONB DEFAULT '{}',
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_catalogs_year ON catalogs(year, status);

-- PRODUCTS
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(512) NOT NULL,
    catalog_id      UUID NOT NULL REFERENCES catalogs(id),
    schema_id       UUID NOT NULL REFERENCES product_schemas(id),
    attributes      JSONB NOT NULL DEFAULT '{}',
    status          VARCHAR(20) DEFAULT 'DRAFT',
    source_product_id UUID REFERENCES products(id),
    overridden_fields TEXT[] DEFAULT '{}',
    version         BIGINT DEFAULT 1,
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_by      VARCHAR(255),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_catalog ON products(catalog_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_sku     VARCHAR(255) NOT NULL UNIQUE,
    attributes      JSONB NOT NULL DEFAULT '{}',
    pricing         JSONB DEFAULT '{}',
    inventory       JSONB DEFAULT '{}',
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(variant_sku);

-- PRODUCT ↔ DAM ASSET REFERENCES (loose coupling)
CREATE TABLE product_asset_refs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    asset_path      VARCHAR(2048) NOT NULL,
    role            VARCHAR(64) NOT NULL DEFAULT 'gallery',
    order_index     INTEGER DEFAULT 0,
    UNIQUE(product_id, asset_path, role)
);

CREATE INDEX idx_product_assets_product ON product_asset_refs(product_id);

-- PRODUCT VERSION HISTORY
CREATE TABLE product_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version_number  BIGINT NOT NULL,
    attributes      JSONB NOT NULL,
    changed_by      VARCHAR(255),
    changed_at      TIMESTAMPTZ DEFAULT NOW(),
    change_summary  TEXT,
    UNIQUE(product_id, version_number)
);

-- IMPORT JOBS
CREATE TABLE import_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type     VARCHAR(20) NOT NULL,
    file_name       VARCHAR(512),
    mapping_profile JSONB,
    schema_id       UUID REFERENCES product_schemas(id),
    catalog_id      UUID REFERENCES catalogs(id),
    status          VARCHAR(20) DEFAULT 'PENDING',
    total_records   INTEGER DEFAULT 0,
    success_count   INTEGER DEFAULT 0,
    error_count     INTEGER DEFAULT 0,
    error_log       JSONB DEFAULT '[]',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- FIELD MAPPING PROFILES (reusable import configurations)
CREATE TABLE field_mapping_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    source_type     VARCHAR(20) NOT NULL,
    schema_id       UUID REFERENCES product_schemas(id),
    mappings        JSONB NOT NULL,
    defaults        JSONB DEFAULT '{}',
    transforms      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Admin UI — PIM Pages

| Route | Purpose |
|---|---|
| `/pim` | PIM dashboard (catalog overview, import status, recent edits) |
| `/pim/schemas` | Schema browser + visual schema editor |
| `/pim/schemas/[id]` | Schema detail — attribute editor, group layout, inheritance view |
| `/pim/catalogs` | Catalog list (filter by year, status) |
| `/pim/catalogs/[id]` | Catalog detail — product grid, bulk actions |
| `/pim/catalogs/[id]/carryforward` | Year-over-year clone wizard |
| `/pim/products` | All products (search, filter, faceted browse) |
| `/pim/products/[sku]` | Product editor — auto-generated form from schema, variant editor, asset linker |
| `/pim/products/[sku]/history` | Version diff viewer |
| `/pim/import` | Import wizard — upload file, select format, map fields, preview, execute |
| `/pim/import/jobs` | Import job history + error log viewer |

**Product editor** is auto-generated from the ProductSchema:
- Each attribute group renders as a collapsible section
- Field types map to `@flexcms/ui` components (text→Input, number→Input[type=number], enum→Select, rich text→Tiptap, asset→DAM picker)
- Inherited fields (from source product) show with a visual indicator; editing an inherited field automatically marks it as overridden
- Validation runs in real-time against the JSON Schema

---

## 8. Scalability Considerations

| Concern | Solution |
|---|---|
| **Millions of products** | JSONB GIN indexes + pg_trgm for full-text; Elasticsearch index for faceted search |
| **Separate database** | Own connection pool, own Flyway migrations, own backups. PIM outage doesn't affect CMS. |
| **Import performance** | Batch upserts (1000 records per transaction); async processing via RabbitMQ job queue |
| **Schema evolution** | Versioned schemas with inheritance — new year = new version, not migration. Old products remain valid against their schema version. |
| **Multi-tenant** | Catalogs are tenant-scoped (via site_id or org_id). Schema sharing is optional. |
| **API scalability** | PIM can be deployed as a separate microservice with its own scaling group. Communicates with CMS via REST API + RabbitMQ events. |
| **Cache strategy** | Product data cached in Redis (TTL: 5 min for published products). Cache busted on update. |

