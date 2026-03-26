# WKND Adventures — FlexCMS Sample Website

A sample website based on Adobe's WKND Adventures demo, reimplemented for FlexCMS. Demonstrates content modelling, Experience Fragments, adventure pages, and a magazine section.

## Structure

```
sample-website/
├── data/                         # SQL seed files (run in order)
│   ├── 01_site_components.sql    # Site record + component definitions
│   ├── 02_templates.sql          # Page templates
│   ├── 03_experience_fragments.sql # Header, footer, contributor XFs
│   ├── 04_home.sql               # Home page content
│   ├── 05_adventures.sql         # 8 adventure pages
│   ├── 06_magazine.sql           # 5 magazine articles
│   └── 07_faqs_about.sql         # FAQ and About pages
├── frontend/                     # Next.js 14 standalone website (port 3100)
│   ├── src/
│   │   ├── app/
│   │   │   └── (site)/[[...slug]]/page.tsx  # Catch-all route
│   │   ├── components/
│   │   │   ├── ComponentRenderer.tsx
│   │   │   ├── component-map.ts
│   │   │   └── renderers/        # One renderer per component type
│   │   └── lib/
│   │       └── flexcms.ts        # GraphQL client
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── install.sh                    # Linux/macOS install script
├── install.ps1                   # Windows install script
├── uninstall.sh                  # Linux/macOS uninstall script
└── uninstall.ps1                 # Windows uninstall script
```

## Install

### Prerequisites

- FlexCMS backend running on `http://localhost:8080`
- PostgreSQL accessible (default: `localhost:5432/flexcms`)

### Linux / macOS

```bash
cd sample-website
./install.sh
# or with custom DB settings:
./install.sh --host localhost --port 5432 --db flexcms --user flexcms --password secret
```

### Windows

```powershell
cd sample-website
.\install.ps1
# or:
.\install.ps1 -Host localhost -Port 5432 -Db flexcms -User flexcms -Password secret
```

### Environment variables

You can also configure via env vars:

| Variable              | Default          |
|-----------------------|------------------|
| `FLEXCMS_DB_HOST`     | `localhost`      |
| `FLEXCMS_DB_PORT`     | `5432`           |
| `FLEXCMS_DB_NAME`     | `flexcms_author` |
| `FLEXCMS_DB_USER`     | `flexcms`        |
| `FLEXCMS_DB_PASSWORD` | *(empty)*        |

## Uninstall

```bash
# Linux/macOS (will prompt for confirmation)
./uninstall.sh

# Windows
.\uninstall.ps1
```

## Run the frontend

```bash
cd sample-website/frontend
npm install        # or: pnpm install
npm run dev        # starts on http://localhost:3100
```

Point `NEXT_PUBLIC_FLEXCMS_API` at the GraphQL endpoint if not using the default:

```bash
NEXT_PUBLIC_FLEXCMS_API=http://localhost:8080/graphql npm run dev
```

## Content paths

All WKND content lives under the `wknd` site:

| Page              | FlexCMS path                              |
|-------------------|-------------------------------------------|
| Home              | `wknd.language-masters.en`               |
| Adventures        | `wknd.language-masters.en.adventures`    |
| Magazine          | `wknd.language-masters.en.magazine`      |
| About             | `wknd.language-masters.en.about-us`      |
| FAQs              | `wknd.language-masters.en.faq`           |
| Header XF         | `experience-fragments.wknd.language-masters.en.site.header.master` |
| Footer XF         | `experience-fragments.wknd.language-masters.en.site.footer.master` |
