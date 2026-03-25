# @flexcms/site-angular — Angular 17 SSR Reference Site

A complete reference implementation showing how to build a **server-side rendered Angular 17** website powered by FlexCMS. The backend serves JSON only; this app handles all rendering.

## Architecture

```
FlexCMS API (Spring Boot)
      │  JSON (PageResponse)
      ▼
Express SSR Server (server.ts)
      │  Angular Universal render
      ▼
AppComponent → CmsPageComponent
                    │  FlexCmsPageService.load(path)
                    ▼
             FlexCmsPageComponent   ← @flexcms/angular
                    │  per node
                    ▼
          FlexCmsComponentComponent
                    │  resourceType lookup
                    ▼
            FLEXCMS_COMPONENT_MAP   ← component-map.ts
         ┌──────────┼──────────────┐
    RichText    Container       Hero …
```

## Quick Start

### Development (live reload, no SSR)
```bash
cd frontend/apps/site-angular
pnpm install
ng serve --port 3003
```
Then open http://localhost:3003.

### Production SSR
```bash
# 1. Build browser + server bundles
ng build && ng run site-angular:server

# 2. Start the Express SSR server
node dist/site-angular/server/server.mjs
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3003` | HTTP server port |
| `FLEXCMS_API_URL` | `http://localhost:8080` | FlexCMS backend URL |
| `FLEXCMS_DEFAULT_SITE` | `corporate` | CMS site ID |
| `FLEXCMS_DEFAULT_LOCALE` | `en` | Default locale |

## Adding a New CMS Component

1. **Create the Angular component** in `src/flexcms/components/`:
   ```typescript
   // src/flexcms/components/card.component.ts
   @Component({ selector: 'app-card', standalone: true, template: `...` })
   export class CardComponent implements FlexCmsComponent {
     @Input() data: Record<string, unknown> = {};
     @Input() children: ComponentNode[] = [];
   }
   ```

2. **Register in the component map** (`src/flexcms/component-map.ts`):
   ```typescript
   import { CardComponent } from './components/card.component';

   export const FLEXCMS_COMPONENT_MAP = {
     // ...existing
     'myapp/card': CardComponent,

     // Or lazy-load (code-split):
     'myapp/heavy': () => import('./components/heavy.component')
                          .then(m => m.HeavyComponent),
   };
   ```

That's it. The CMS dialog schema defines the data contract; this file is the only integration point.

## Registered Components

| Resource Type | File | Description |
|---|---|---|
| `flexcms/rich-text` | `rich-text.component.ts` | HTML content rendered via `[innerHTML]` |
| `flexcms/image` | `image.component.ts` | Responsive DAM image with caption |
| `flexcms/hero` | `hero.component.ts` | Full-width hero banner with CTA |
| `flexcms/container` | `container.component.ts` | Grid/flex layout container (renders children) |
| `flexcms/shared-header` | `header.component.ts` | Site navigation header |
| `flexcms/shared-footer` | `footer.component.ts` | Site footer with links |

## Key Files

```
src/
├── main.ts                      Browser bootstrap
├── main.server.ts               SSR entry (consumed by @angular/ssr)
├── app/
│   ├── app.component.ts         Root shell (<router-outlet>)
│   ├── app.config.ts            Client providers (provideFlexCms, router)
│   ├── app.config.server.ts     Server providers (provideServerRendering)
│   ├── app.routes.ts            Route definitions (wildcard → CMS page)
│   └── pages/
│       └── cms-page.component.ts  Catch-all route (fetches + renders CMS pages)
└── flexcms/
    ├── component-map.ts         Maps resourceType → Angular component
    └── components/              Sample component renderers
server.ts                        Express SSR server (production)
```

## Comparison with site-nextjs

| Feature | site-nextjs | site-angular |
|---|---|---|
| Framework | Next.js 14 (App Router) | Angular 17 (standalone) |
| SSR | React Server Components | @angular/ssr (Express) |
| State | N/A (pure SSR) | Signals (FlexCmsPageService) |
| Routing | File-system based | Angular Router |
| Component registry | ComponentMapper (React) | FLEXCMS_COMPONENT_MAP |
| Provider setup | Client-side only | provideFlexCms() in both client + server config |

