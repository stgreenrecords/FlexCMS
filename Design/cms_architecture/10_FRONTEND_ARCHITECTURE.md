# Frontend Architecture & Backend/Frontend Contract

## 1. Separation Philosophy

FlexCMS enforces **strict separation** between backend (content management + API) and frontend (rendering + authoring UI). The two sides communicate through a **formal JSON contract** — the Component Registry Schema. This enables:

- **Independent team velocity**: Backend and frontend teams work in parallel; neither blocks the other
- **Zero HTML duplication**: The backend never generates HTML. All markup lives exclusively in the frontend layer
- **Framework freedom**: Any frontend framework (React, Vue, Angular, Svelte, Solid, etc.) can render CMS content
- **Contract-driven development**: Both sides code against the same schema; if the contract is honored, integration works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        THE CONTRACT                                  │
│  Component Registry Schema (JSON Schema per resourceType)            │
│  REST API response shapes (OpenAPI)                                  │
│  GraphQL schema (schema.graphqls)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  BACKEND (Java / Spring Boot)       │  FRONTEND (TypeScript)         │
│  ─────────────────────────────      │  ──────────────────────────    │
│  • Content tree (PostgreSQL)        │  • @flexcms/sdk (core)         │
│  • Component models (Sling Model)   │  • @flexcms/react adapter     │
│  • Workflow engine                  │  • @flexcms/vue adapter        │
│  • DAM + rendition pipeline         │  • @flexcms/angular adapter   │
│  • Replication (RabbitMQ)           │  • @flexcms/ui (design system) │
│  • REST + GraphQL APIs              │  • Admin UI (Next.js)          │
│  • Search (Elasticsearch)           │  • Site renderers (Next/Nuxt)  │
│                                     │                                │
│  OUTPUT: JSON only                  │  OUTPUT: HTML + CSS + JS       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Contract: Component Registry Schema

Every component type registered in FlexCMS has a **data schema** (JSON Schema draft-07) that formally defines the shape of data the backend will produce and the frontend must render.

### 2.1 Contract Endpoint

```
GET /api/content/v1/component-registry

Response:
{
  "components": [
    {
      "resourceType": "myapp/hero-banner",
      "name": "hero-banner",
      "title": "Hero Banner",
      "group": "Marketing",
      "isContainer": false,
      "dataSchema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "title":          { "type": "string" },
          "subtitle":       { "type": "string" },
          "theme":          { "type": "string", "enum": ["light", "dark", "gradient"], "default": "light" },
          "height":         { "type": "string", "enum": ["small", "medium", "full"], "default": "medium" },
          "imageUrl":       { "type": "string", "format": "uri", "description": "CDN URL for desktop hero image" },
          "imageMobileUrl": { "type": "string", "format": "uri" },
          "imageAlt":       { "type": "string" },
          "ctaLabel":       { "type": "string" },
          "ctaUrl":         { "type": "string" }
        },
        "required": ["title"]
      },
      "dialog": { ... }
    }
  ],
  "version": "1.0.0",
  "generatedAt": "2026-03-24T10:00:00Z"
}
```

### 2.2 Contract Rules

1. **Backend guarantees** the `data` object inside each component matches its `dataSchema`
2. **Frontend assumes** the `data` shape and renders accordingly — if a field is absent, the schema's `default` applies
3. **Breaking changes** (removing a required field, changing types) require a contract version bump
4. **Additive changes** (new optional fields) are non-breaking and don't require frontend updates

### 2.3 Page Response Shape (THE Universal Contract)

Every page response — whether REST or GraphQL — conforms to this shape:

```typescript
interface PageResponse {
  page: {
    path: string;
    title: string;
    description: string;
    template: string;
    locale: string;
    lastModified: string;
  };
  components: ComponentNode[];
}

interface ComponentNode {
  name: string;
  resourceType: string;         // maps to a frontend renderer
  data: Record<string, any>;    // conforms to the component's dataSchema
  children?: ComponentNode[];   // recursive for containers
}
```

This is the **only** shape the frontend ever receives. The backend never sends HTML, CSS, layout instructions, or framework-specific code.

---

## 3. Frontend SDK Architecture

### 3.1 Package Structure

```
frontend/
├── packages/
│   ├── sdk/                    # @flexcms/sdk — framework-agnostic core
│   │   ├── src/
│   │   │   ├── client.ts       # FlexCmsClient (REST + GraphQL fetcher)
│   │   │   ├── mapper.ts       # ComponentMapper registry
│   │   │   ├── types.ts        # TypeScript interfaces (PageResponse, ComponentNode, etc.)
│   │   │   ├── walker.ts       # Component tree recursive walker
│   │   │   └── index.ts        # Public API barrel export
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── react/                  # @flexcms/react — React adapter
│   │   ├── src/
│   │   │   ├── FlexCmsProvider.tsx
│   │   │   ├── FlexCmsPage.tsx
│   │   │   ├── FlexCmsComponent.tsx
│   │   │   ├── useFlexCmsPage.ts
│   │   │   ├── useFlexCmsClient.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── vue/                    # @flexcms/vue — Vue 3 adapter
│   │   ├── src/
│   │   │   ├── FlexCmsPlugin.ts
│   │   │   ├── FlexCmsPage.vue
│   │   │   ├── FlexCmsComponent.vue
│   │   │   ├── useFlexCmsPage.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── angular/                # @flexcms/angular — Angular adapter
│   │   ├── src/
│   │   │   ├── flexcms.module.ts
│   │   │   ├── flexcms-page.component.ts
│   │   │   ├── flexcms-component.directive.ts
│   │   │   ├── component-mapper.service.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ui/                     # @flexcms/ui — Design System
│       ├── src/
│       │   ├── components/     # Button, Input, Label, Select, Dialog, DataTable, etc.
│       │   ├── themes/         # Theme tokens (light, dark, brand-custom)
│       │   ├── hooks/          # useTheme, useToast
│       │   └── index.ts
│       └── package.json
│
├── apps/
│   ├── admin/                  # Next.js Admin UI (content authoring)
│   ├── site-nextjs/            # Reference: Next.js site (React SSR)
│   └── site-nuxt/              # Reference: Nuxt 3 site (Vue SSR)
│
├── package.json                # pnpm workspace root
├── pnpm-workspace.yaml
└── turbo.json                  # Turborepo build orchestration
```

### 3.2 SDK Core (`@flexcms/sdk`)

```typescript
// client.ts — Framework-agnostic CMS data fetcher
export class FlexCmsClient {
  constructor(private config: FlexCmsConfig) {}

  async getPage(path: string, options?: { locale?: string; site?: string }): Promise<PageResponse>
  async getNavigation(site: string, locale: string, depth?: number): Promise<NavigationItem[]>
  async getComponentRegistry(): Promise<ComponentRegistryResponse>
  async search(query: string, options?: SearchOptions): Promise<SearchResult>
  async getAsset(id: string): Promise<Asset>
}

// mapper.ts — Component type → renderer mapping
export class ComponentMapper<TRenderer = unknown> {
  register(resourceType: string, renderer: TRenderer): void
  resolve(resourceType: string): TRenderer | undefined
  has(resourceType: string): boolean
  getAll(): Map<string, TRenderer>
}
```

### 3.3 React Adapter (`@flexcms/react`)

```tsx
// FlexCmsProvider.tsx — Context provider
<FlexCmsProvider client={client} componentMap={componentMap}>
  <App />
</FlexCmsProvider>

// FlexCmsPage.tsx — Renders a full page from CMS JSON
<FlexCmsPage path="/about" />

// FlexCmsComponent.tsx — Renders one component by resourceType
<FlexCmsComponent node={componentNode} />

// useFlexCmsPage.ts — Hook for data fetching
const { page, components, loading, error } = useFlexCmsPage('/about');
```

### 3.4 Vue Adapter (`@flexcms/vue`)

```vue
<!-- FlexCmsPage.vue -->
<FlexCmsPage path="/about" />

<!-- FlexCmsComponent.vue -->
<FlexCmsComponent :node="componentNode" />

// useFlexCmsPage.ts (composable)
const { page, components, loading, error } = useFlexCmsPage('/about');
```

### 3.5 Angular Adapter (`@flexcms/angular`)

```typescript
// FlexCmsModule — import in AppModule
@NgModule({ imports: [FlexCmsModule.forRoot({ apiUrl: '...' })] })

// Template usage
<flexcms-page path="/about"></flexcms-page>
<flexcms-component [node]="componentNode"></flexcms-component>
```

---

## 4. Admin UI Architecture

### 4.1 Technology Choices

| Concern | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Server components for perf, React ecosystem |
| Design System | `@flexcms/ui` (custom) | Unified branding, theme support |
| Primitives | Radix UI | Accessible, unstyled headless components |
| Styling | Tailwind CSS + CVA | Utility-first + variant-driven class composition |
| State | Zustand + React Query | Lightweight global state + server state cache |
| Forms | React Hook Form + Zod | Type-safe form validation against component schemas |
| Drag & Drop | dnd-kit | Page editor component reordering |
| Rich Text | Tiptap | Content editing with extensible toolbar |

### 4.2 Design System (`@flexcms/ui`)

Every UI element is a reusable, themed component. Themes are defined as CSS custom property sets:

```typescript
// themes/tokens.ts
export const themes = {
  light: {
    '--color-background': '#ffffff',
    '--color-foreground': '#0a0a0a',
    '--color-primary': '#2563eb',
    '--color-primary-foreground': '#ffffff',
    '--color-muted': '#f5f5f5',
    '--color-border': '#e5e5e5',
    '--radius-sm': '0.25rem',
    '--radius-md': '0.375rem',
    '--radius-lg': '0.5rem',
  },
  dark: {
    '--color-background': '#0a0a0a',
    '--color-foreground': '#fafafa',
    '--color-primary': '#3b82f6',
    // ... inverted tokens
  },
  // Custom brand themes loaded from CMS site settings
};

// components/Button.tsx
export const Button = ({ variant = 'default', size = 'md', ...props }) => (
  <button className={buttonVariants({ variant, size })} {...props} />
);
```

**Theme switching** is instant — changing the theme swaps CSS custom properties on `<html>`, and all components react automatically. Brand teams can define custom themes in the CMS site settings, which are fetched and applied at runtime.

### 4.3 Admin UI Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard (recent edits, workflow inbox, quick stats) |
| `/sites` | Multi-site management |
| `/sites/[siteId]/pages` | Content tree browser |
| `/sites/[siteId]/pages/[path]/edit` | Visual page editor (drag-and-drop) |
| `/sites/[siteId]/assets` | DAM browser |
| `/sites/[siteId]/i18n` | Translation management |
| `/workflows` | Workflow inbox/tasks |
| `/components` | Component registry browser |
| `/settings` | System settings, themes, users |

---

## 5. SSR Strategy (No Thymeleaf)

The backend **never renders HTML**. SSR is handled by the frontend meta-framework:

| Framework | Meta-Framework | SSR Approach |
|---|---|---|
| React | Next.js | `getServerSideProps` / Server Components |
| Vue | Nuxt 3 | `useAsyncData` / server routes |
| Angular | Angular SSR (@angular/ssr) | `provideServerRendering` |

```
Request flow (Next.js example):

Browser → CDN → Next.js Server → @flexcms/sdk → FlexCMS API (JSON) → Back to Next.js → Render HTML → CDN caches
```

The FlexCMS `flexcms-publish` module becomes a **pure JSON API server** — no Thymeleaf, no templates, no HTML generation. The `PublishPageController` is converted to a `@RestController` that returns JSON, or removed entirely in favor of the existing headless API endpoints.

---

## 6. Component Development Workflow (Backend + Frontend)

### Creating a New Component (Parallel Work)

**Backend developer** (Java):
```java
@FlexCmsComponent(resourceType = "myapp/hero-banner", title = "Hero Banner")
public class HeroBannerModel extends AbstractComponentModel {
    @ValueMapValue
    private String title;
    // ... (Sling Model fields)
}
```

**Frontend developer** (TypeScript/React):
```tsx
// components/HeroBanner.tsx — honors the dataSchema contract
function HeroBanner({ data }: { data: HeroBannerData }) {
  return (
    <section className={`hero hero--${data.theme}`}>
      <h1>{data.title}</h1>
      <p>{data.subtitle}</p>
    </section>
  );
}

// Register in component map
componentMap.register('myapp/hero-banner', HeroBanner);
```

Both developers work against the same `dataSchema` contract. They never need to coordinate beyond agreeing on the schema.

