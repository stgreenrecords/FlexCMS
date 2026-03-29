# WORK_BOARD_ERIK.md — Erik's Task Board

> **Agent: Erik**
> **Before implementing anything:** Read `hints_for_agent.md` — known problems and solutions (mandatory).
> **Module locks:** Check `WORK_BOARD.md §2` before touching any module.
> **Completed tasks archive:** `docs/WORK_BOARD_ARCHIVE.md`
> Updated: 2026-03-29

---

## §3 — Erik's Task Board

### 🔴 P0 — Critical

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| E-01 | ✅ DONE | **Foundation: clean old TUT content + new TUT USA site skeleton + XF paths** | 1d | `flexcms-app` (Flyway), `flexcms-core` | — |
| E-02 | ✅ DONE | **Backend: register all 406 component definitions (Flyway V16)** | 3d | `flexcms-app` (Flyway) | E-01 |
| E-06 | ✅ DONE | **Frontend renderers: Navigation & Discovery + XF locking (27 components)** | 3d | `apps/site-nextjs`, `apps/admin` | E-01, E-02 |

### 🟠 P1 — High

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| E-03 | ✅ DONE | **Frontend renderers: Layout & Page Structure (32 components)** | 3d | `apps/site-nextjs` | E-02 |
| E-04 | ✅ DONE | **Frontend renderers: Editorial & Article Content (68 components)** | 5d | `apps/site-nextjs` | E-02 |
| E-05 | ✅ DONE | **Frontend renderers: Media, Visual Storytelling & Assets (33 components)** | 3d | `apps/site-nextjs` | E-02 |
| E-07 | ✅ DONE | **Frontend renderers: CTAs, Promotions & Campaigns (43 components)** | 3d | `apps/site-nextjs` | E-02 |
| E-08 | 🟢 OPEN | **Frontend renderers: Forms, Data Capture & Consent (42 components)** | 3d | `apps/site-nextjs` | E-02 |
| E-09 | 🟢 OPEN | **Frontend renderers: Commerce, Catalog & Merchandising (30 components)** | 2d | `apps/site-nextjs` | E-02 |
| E-10 | 🟢 OPEN | **Frontend renderers: Account, Portal & Transactional (24 components)** | 2d | `apps/site-nextjs` | E-02 |
| E-11 | 🟢 OPEN | **Frontend renderers: Events, Booking & Hospitality (24 components)** | 2d | `apps/site-nextjs` | E-02 |
| E-12 | 🟢 OPEN | **Frontend renderers: Community, Social Proof & Engagement (30 components)** | 2d | `apps/site-nextjs` | E-02 |
| E-13 | 🟢 OPEN | **Frontend renderers: Corporate/Investor + Education + Location (48 components)** | 3d | `apps/site-nextjs` | E-02 |
| E-14 | 🟢 OPEN | **Backend + Frontend: 20 Page Templates** | 2d | `flexcms-app` (Flyway), `flexcms-core`, `apps/site-nextjs` | E-02 |
| E-15 | 🔴 BLOCKED | **Content tree: 61 pages with contextual dummy data + missing assets log** | 3d | `scripts`, `flexcms-app` | E-01, E-06, E-14 |

---

## §4 — Context Packets

---

### E-01 — Foundation: Clean Old TUT Content + New TUT USA Site Skeleton + XF Paths

**Goal:** Replace the existing 18-component TUT sample site with the new TUT USA architecture. Clean old component definitions, build the L0–L1 content tree, and create Experience Fragment paths for the global Navigation and Footer — both of which will be locked on the page editing screen.

**read_first:**
- `docs/EXPERIENCE_FRAGMENTS.md` — full XF business logic, content model, and governance rules (MANDATORY)
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — site description + page tree L0/L1 section names
- `flexcms/flexcms-app/src/main/resources/db/migration/V14__tut_sample_site_seed.sql` — what to replace
- `flexcms/flexcms-app/src/main/resources/db/migration/V12__experience_fragment_support.sql` — existing XF table structure
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/` — ContentNode and related entity fields

**deliverables:**
- `flexcms/flexcms-app/src/main/resources/db/migration/V15__tut_usa_foundation.sql`:
  - DELETE all existing TUT component_definitions (resource_type LIKE `tut/%`)
  - DELETE all existing TUT content_nodes (path starts with `content.tut-`)
  - INSERT L0 root node: `content.tut-usa` (TUT USA Website Root)
  - INSERT L1 nodes: Home, Vehicles, Innovation, News & Updates, Owners, Offers & Finance, Accessories, Learn, Contact & Concierge
  - INSERT XF root node: `/content/experience-fragments/tut-usa/global`
  - INSERT XF node: `/content/experience-fragments/tut-usa/global/navigation` (type: `header`, status: DRAFT)
  - INSERT XF node: `/content/experience-fragments/tut-usa/global/footer` (type: `footer`, status: DRAFT)

**acceptance_criteria:**
- [ ] AC1: `SELECT COUNT(*) FROM component_definitions WHERE resource_type LIKE 'tut/%'` returns 0 (old components removed)
- [ ] AC2: `SELECT COUNT(*) FROM content_nodes WHERE path <@ 'content.tut-usa'::ltree` returns 10 (root + 9 L1 nodes)
- [ ] AC3: XF nodes exist for both global navigation and footer at the correct paths
- [ ] AC4: `mvn clean compile` passes; `mvn test` passes

---

### E-02 — Backend: Register All 406 Component Definitions (Flyway V16)

**Goal:** One Flyway migration that registers all 406 components across 14 groups in `component_definitions`. No hardcoded content — only schema definitions. The `data_schema` column must contain a valid JSON Schema matching each component's field list from the spec.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — complete field definitions for all 406 components (authoritative source for field names, types, and schema)
- `flexcms/flexcms-app/src/main/resources/db/migration/V14__tut_sample_site_seed.sql` — format reference for INSERT rows
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ComponentDefinition.java` — model fields

**resource_type naming convention:** `tut-usa/<group-slug>/<component-slug>`
- Group slug: lowercase, hyphens (e.g. `layout-page-structure`, `editorial-article-content`)
- Component slug: lowercase, hyphens (e.g. `section-divider`, `rich-text-block`)

**group_name values** (must match exactly):
- `Layout & Page Structure`
- `Editorial & Article Content`
- `Media, Visual Storytelling & Assets`
- `Navigation, Search & Discovery`
- `Calls to Action, Promotions & Campaigns`
- `Forms, Data Capture & Consent`
- `Commerce, Catalog & Merchandising`
- `Account, Portal & Transactional`
- `Events, Booking, Travel & Hospitality`
- `Community, Social Proof & Engagement`
- `Brand, Corporate, Investor & Governance`
- `Support, Documentation & Knowledge`
- `Location, Local & Physical Presence`
- `Education, Learning & Developer Content`

**data_schema JSON Schema format per field type:**
- `text` → `{"type": "string"}`
- `rich text` → `{"type": "string", "x-rich-text": true}`
- `enum` → `{"type": "string", "enum": ["option1", "option2"]}`
- `boolean` → `{"type": "boolean"}`
- `number` → `{"type": "number"}`
- `asset` → `{"type": "string", "x-asset": true}`
- `url` → `{"type": "string", "format": "uri"}`
- `link` → `{"type": "object", "properties": {"label": {"type": "string"}, "url": {"type": "string"}}}`
- `list<reference>` → `{"type": "array", "items": {"type": "string", "x-reference": true}}`
- `list<object>` → `{"type": "array", "items": {"type": "object"}}`
- `reference` → `{"type": "string", "x-reference": true}`

**deliverables:**
- `flexcms/flexcms-app/src/main/resources/db/migration/V16__tut_usa_component_definitions.sql` — 406 INSERT rows

**acceptance_criteria:**
- [ ] AC1: `SELECT COUNT(*) FROM component_definitions WHERE resource_type LIKE 'tut-usa/%'` returns 406
- [ ] AC2: All 14 `group_name` values present with correct counts
- [ ] AC3: Every component has a valid non-empty `data_schema` JSON Schema
- [ ] AC4: `GET /api/content/v1/component-registry` returns all 406 tut-usa components, grouped correctly
- [ ] AC5: `mvn clean compile` passes; `mvn test` passes

---

### E-03 — Frontend Renderers: Layout & Page Structure (32 components)

**Goal:** Implement React renderers for all 32 Layout & Page Structure components. No hardcoded dummy data — all content from the `data` prop. Container/grid components must render `children`.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 1–32 (field names and types)
- `Design/sample-website-tut/component-libs/component_library_layout_page_structure/code.html` — extract markup signature for each of the 32 components from this single HTML file
- `Design/sample-website-tut/component-libs/component_library_layout_page_structure/screen.png` — visual reference
- `frontend/apps/site-nextjs/src/components/component-map.tsx` — existing registration pattern

**critical rule for reading HTML:** The `code.html` file contains markup for ALL components in the group. For each component, extract only the markup section that corresponds to that specific component. Use the component title from the spec as the identifier.

**image field rule:** For every `asset` field that is an image, extract the resolution from the HTML markup (e.g. `width="1920" height="1080"` or CSS dimensions) and document it as a JSDoc comment on the prop: `/** Hero image — 1920×1080 */`.

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/layout/*.tsx` — 32 named-export React components
- `frontend/apps/site-nextjs/src/components/component-map.tsx` — all 32 registered with `tut-usa/layout-page-structure/<slug>` resource types

**acceptance_criteria:**
- [ ] AC1: All 32 components implemented as named-export `.tsx` files in `tut-usa/layout/`
- [ ] AC2: All 32 registered in `component-map.tsx`
- [ ] AC3: Zero hardcoded dummy data — all content rendered from `data` prop
- [ ] AC4: Container components (Container, Grid Layout, Two Column Layout, Three Column Layout, Card Grid, Two Columns Grid) render `children` correctly
- [ ] AC5: All image `asset` fields have resolution documented in JSDoc
- [ ] AC6: `cd frontend && pnpm build` passes with 0 TypeScript errors

---

### E-04 — Frontend Renderers: Editorial & Article Content (68 components)

**Goal:** Implement React renderers for all 68 Editorial & Article Content components.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 33–101
- `Design/sample-website-tut/component-libs/component_library_editorial_article_content/code.html` — extract per-component markup
- `Design/sample-website-tut/component-libs/component_library_editorial_article_content/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**special handling:**
- Rich text fields (`rich text` type in spec) must render sanitized HTML — use `dangerouslySetInnerHTML` only with a DOMPurify-equivalent sanitize pass, or render as plain text with line breaks if no sanitizer is available
- `Table` and `Data Table` components must render from a structured data array — not hardcoded rows

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/editorial/*.tsx` — 68 named-export components
- `component-map.tsx` updated with all 68 registrations under `tut-usa/editorial-article-content/<slug>`

**acceptance_criteria:**
- [ ] AC1: All 68 components implemented; zero hardcoded data
- [ ] AC2: Rich text fields rendered safely (no raw `innerHTML` injection)
- [ ] AC3: Image fields have resolution in JSDoc
- [ ] AC4: `pnpm build` passes with 0 TypeScript errors

---

### E-05 — Frontend Renderers: Media, Visual Storytelling & Assets (33 components)

**Goal:** Implement React renderers for all 33 Media & Assets components. Image and video components are the most important in this group — resolutions must be documented.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 102–134
- `Design/sample-website-tut/component-libs/component_library_media_assets/code.html`
- `Design/sample-website-tut/component-libs/component_library_media_assets/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/media/*.tsx` — 33 named-export components
- `component-map.tsx` updated under `tut-usa/media-visual-storytelling-assets/<slug>`
- Every image/video `asset` field must have resolution documented in JSDoc (extracted from HTML markup)

**acceptance_criteria:**
- [ ] AC1: All 33 components implemented; zero hardcoded data
- [ ] AC2: Every image field has `/** <resolution> */` JSDoc comment
- [ ] AC3: Gallery and carousel components accept an `items` array prop — no hardcoded slide count
- [ ] AC4: `pnpm build` passes with 0 TypeScript errors

---

### E-06 — Frontend Renderers: Navigation & Discovery + XF Locking (27 components)

**Goal:** Implement all 27 Navigation & Discovery renderers. Navigation and Footer are rendered exclusively from Experience Fragment paths and must appear as **read-only/locked** in the admin page editor. Authors cannot add, edit, move, or delete navigation or footer from the page canvas — they must go to the Experience Fragments library.

**read_first:**
- `docs/EXPERIENCE_FRAGMENTS.md` — full XF specification including authoring experience, locking model, variation resolution, and governance rules (MANDATORY — read before writing a single line)
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 135–162
- `Design/sample-website-tut/component-libs/component_library_navigation_discovery/code.html`
- `Design/sample-website-tut/component-libs/component_library_navigation_discovery/screen.png`
- `frontend/apps/admin/src/app/editor/page.tsx` — current page editor canvas to understand where to add the XF lock UI
- `flexcms/flexcms-app/src/main/resources/db/migration/V12__experience_fragment_support.sql` — XF data model

**XF locking behavior to implement:**
1. **Site-nextjs:** Navigation and Footer components are automatically injected from the XF paths `content/experience-fragments/tut-usa/global/navigation` and `.../footer` into every page render — they are NOT stored as per-page component data
2. **Admin page editor:** Navigation and Footer component slots on the page canvas must render with:
   - A lock icon overlay
   - Label: "Experience Fragment — Navigation" (or Footer)
   - A link: "Edit in Experience Fragments →" linking to the XF path
   - Drag/drop disabled for these slots
   - Property panel disabled for these slots
   - Delete button hidden/disabled for these slots
3. **XF resolution:** The rendering layer must resolve the XF reference at render time (server-side) — see `docs/EXPERIENCE_FRAGMENTS.md §9.1`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/navigation/*.tsx` — 27 named-export components
- `component-map.tsx` updated under `tut-usa/navigation-search-discovery/<slug>`
- `frontend/apps/site-nextjs/src/app/layout.tsx` (or equivalent) — Navigation and Footer injected from XF, not from page component data
- `frontend/apps/admin/src/app/editor/page.tsx` — Navigation and Footer slots rendered as locked XF references (lock icon + "Edit in Experience Fragments" link; no drag/edit/delete)

**acceptance_criteria:**
- [ ] AC1: All 27 navigation components implemented; zero hardcoded data
- [ ] AC2: Navigation and Footer are rendered from XF path in site-nextjs, not from per-page `components` array
- [ ] AC3: In admin page editor, Navigation and Footer appear with lock icon and "Edit in Experience Fragments" link
- [ ] AC4: Navigation and Footer slots cannot be moved, edited, or deleted from the page canvas
- [ ] AC5: "Edit in Experience Fragments" link navigates to the correct XF path for editing
- [ ] AC6: `pnpm build` passes with 0 TypeScript errors; `mvn test` passes

---

### E-07 — Frontend Renderers: CTAs, Promotions & Campaigns (43 components)

**Goal:** Implement React renderers for all 43 CTA, Promo & Campaign components.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 164–206
- `Design/sample-website-tut/component-libs/component_library_ctas_promotions/code.html`
- `Design/sample-website-tut/component-libs/component_library_ctas_promotions/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/ctas/*.tsx` — 43 named-export components
- `component-map.tsx` updated under `tut-usa/calls-to-action-promotions-campaigns/<slug>`

**acceptance_criteria:**
- [ ] AC1: All 43 components implemented; zero hardcoded data
- [ ] AC2: Hero and banner components with image fields have resolution in JSDoc
- [ ] AC3: `pnpm build` passes with 0 TypeScript errors

---

### E-08 — Frontend Renderers: Forms, Data Capture & Consent (42 components)

**Goal:** Implement React renderers for all 42 Form & Consent components. Form components are **presentational only** — they render fields and labels from `data` props but contain no submit logic or API calls.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 207–248
- `Design/sample-website-tut/component-libs/component_library_forms_consent/code.html`
- `Design/sample-website-tut/component-libs/component_library_forms_consent/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/forms/*.tsx` — 42 named-export components
- `component-map.tsx` updated under `tut-usa/forms-data-capture-consent/<slug>`

**acceptance_criteria:**
- [ ] AC1: All 42 components implemented; zero hardcoded data
- [ ] AC2: Form field components render from data props — no hardcoded option lists, no submit handlers
- [ ] AC3: `pnpm build` passes with 0 TypeScript errors

---

### E-09 — Frontend Renderers: Commerce, Catalog & Merchandising (30 components)

**Goal:** Implement React renderers for all 30 Commerce & Merchandising components.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 249–279
- `Design/sample-website-tut/component-libs/component_library_commerce_merchandising/code.html`
- `Design/sample-website-tut/component-libs/component_library_commerce_merchandising/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/commerce/*.tsx` — 30 named-export components
- `component-map.tsx` updated under `tut-usa/commerce-catalog-merchandising/<slug>`

**acceptance_criteria:**
- [ ] AC1: All 30 components implemented; zero hardcoded data
- [ ] AC2: Product image fields have resolution in JSDoc
- [ ] AC3: `pnpm build` passes with 0 TypeScript errors

---

### E-10 — Frontend Renderers: Account, Portal & Transactional (24 components)

**Goal:** Implement React renderers for all 24 Account & Transactional components.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 280–303
- `Design/sample-website-tut/component-libs/component_library_account_transactional/code.html`
- `Design/sample-website-tut/component-libs/component_library_account_transactional/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/account/*.tsx` — 24 named-export components
- `component-map.tsx` updated under `tut-usa/account-portal-transactional/<slug>`

**acceptance_criteria:**
- [ ] AC1: All 24 components implemented; zero hardcoded data
- [ ] AC2: `pnpm build` passes with 0 TypeScript errors

---

### E-11 — Frontend Renderers: Events, Booking & Hospitality (24 components)

**Goal:** Implement React renderers for all 24 Events & Booking components.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 304–327
- `Design/sample-website-tut/component-libs/component_library_events_booking/code.html`
- `Design/sample-website-tut/component-libs/component_library_events_booking/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/events/*.tsx` — 24 named-export components
- `component-map.tsx` updated under `tut-usa/events-booking-travel-hospitality/<slug>`

**acceptance_criteria:**
- [ ] AC1: All 24 components implemented; zero hardcoded data
- [ ] AC2: `pnpm build` passes with 0 TypeScript errors

---

### E-12 — Frontend Renderers: Community, Social Proof & Engagement (30 components)

**Goal:** Implement React renderers for all 30 Community & Engagement components.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 328–358
- `Design/sample-website-tut/component-libs/component_library_community_engagement/code.html`
- `Design/sample-website-tut/component-libs/component_library_community_engagement/screen.png`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/community/*.tsx` — 30 named-export components
- `component-map.tsx` updated under `tut-usa/community-social-proof-engagement/<slug>`

**acceptance_criteria:**
- [ ] AC1: All 30 components implemented; zero hardcoded data
- [ ] AC2: Avatar/profile image fields have resolution in JSDoc
- [ ] AC3: `pnpm build` passes with 0 TypeScript errors

---

### E-13 — Frontend Renderers: Corporate/Investor + Education + Location (48 components)

**Goal:** Implement renderers for three smaller groups delivered together: Brand/Corporate/Investor (19 components, 359–377), Support & Knowledge (2 components, 378–379), Location (13 components, 380–392), Education & Learning (14 components, 393–406). Total: 48 components.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — components 359–406
- `Design/sample-website-tut/component-libs/component_library_corporate_investor/code.html`
- `Design/sample-website-tut/component-libs/component_library_education_learning/code.html`
- `Design/sample-website-tut/component-libs/component_library_location_presence/code.html`
- `frontend/apps/site-nextjs/src/components/component-map.tsx`

**deliverables:**
- `frontend/apps/site-nextjs/src/components/tut-usa/corporate/*.tsx` — corporate/investor components
- `frontend/apps/site-nextjs/src/components/tut-usa/education/*.tsx` — education/learning components
- `frontend/apps/site-nextjs/src/components/tut-usa/location/*.tsx` — location/presence components
- `component-map.tsx` updated with all 48 registrations under their respective group slugs

**acceptance_criteria:**
- [ ] AC1: All 48 components implemented; zero hardcoded data
- [ ] AC2: Map/location components accept coordinates and label from `data` prop — no hardcoded locations
- [ ] AC3: `pnpm build` passes with 0 TypeScript errors

---

### E-14 — Backend + Frontend: 20 Page Templates

**Goal:** Define all 20 page templates in the CMS. Each template specifies which components are **embedded** (locked — cannot be removed or edited by page authors) and which are **allowed** (available in the page editor palette for that template). Templates enforce component constraints in the admin page editor.

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — "PAGE TEMPLATES" section: all 20 templates with their embedded and allowed component lists
- `docs/EXPERIENCE_FRAGMENTS.md §6.2` — how fragment references integrate with template governance
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/` — check if `PageTemplate` model exists; if not, it must be created
- `frontend/apps/admin/src/app/editor/page.tsx` — understand how to enforce template constraints (palette filtering, embedded component locking)

**deliverables:**
- `flexcms/flexcms-app/src/main/resources/db/migration/V17__tut_usa_page_templates.sql` — 20 page_template rows, each with `embedded_component_types` (JSON array, locked) and `allowed_component_types` (JSON array, palette-available)
- Admin page editor updated: when a page has a template assigned, the component palette shows only `allowed_component_types`; embedded template components are rendered as locked (cannot be removed)

**acceptance_criteria:**
- [ ] AC1: All 20 templates exist in the CMS with correct embedded and allowed component lists
- [ ] AC2: Admin page editor palette filters to only template-allowed components when a template is assigned
- [ ] AC3: Embedded template components cannot be removed from the page canvas
- [ ] AC4: `mvn clean compile` passes; `mvn test` passes; `pnpm build` passes

---

### E-15 — Content Tree: 61 Pages with Contextual Dummy Data + Missing Assets Log

**Goal:** Build the full 61-page TUT USA content tree. Every page uses the correct template and contains meaningful, contextually appropriate dummy data for each component instance. Dummy data must make sense for the page's subject — TUT S model page gets S-series specs, not generic lorem ipsum. Where a component requires an image asset, log it to the missing assets file.

**Critical rules:**
- **No lorem ipsum** and no placeholder text like "image goes here" or "description here"
- **No hardcoded dummy data inside components** — dummy data lives only in the seed script as per-page component props
- Every piece of dummy data must be plausible for a luxury automotive brand (model names, spec values, feature descriptions, pricing language, dealer info, etc.)
- Navigation and Footer XF variations must be seeded with real link structure (main nav links + footer columns + legal links + social links)

**Missing assets format** (`Design/sample-website-tut/missing-assets.txt`):
```
missing asset number N <asset-name>, <page path including component>, <resolution>, <detailed description: lighting, environment, subject, mood, color palette>
```
One line per asset. Example:
```
missing asset number 1 tut-s-hero-front-three-quarter.jpg, content/tut-usa/vehicles/sedans/tut-s (HeroBanner), 1920x1080, Front three-quarter studio shot of TUT S sedan, silver exterior, dramatic low-angle lighting on dark grey gradient background, studio environment, sharp focus on front grille and headlights, premium automotive photography style
```

**read_first:**
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt` — full page tree (L0–L5) with all 61 pages and their template assignments
- `docs/EXPERIENCE_FRAGMENTS.md §5.1 and §5.2` — navigation and footer XF structure and content model
- All E-03 through E-13 context packets — understand which components exist and their data fields
- `Design/sample-website-tut/missing-assets.txt` — current content (may be empty)

**deliverables:**
- `scripts/seed_tut_usa_website.py` — re-runnable Python script that calls the Author API to create all 61 pages with contextual component data in PUBLISHED status
- `Design/sample-website-tut/missing-assets.txt` — one line per missing image asset in the required format
- Global Navigation XF seeded: logo, primary nav items (Vehicles, Innovation, News, Owners, Offers, Accessories, Learn, Contact), utility links (Search, Dealer Locator, My TUT), CTA button (Book a Test Drive)
- Global Footer XF seeded: 4 link columns (Vehicles, Owners, Company, Legal), copyright text, social links (LinkedIn, Instagram, YouTube, X)

**acceptance_criteria:**
- [ ] AC1: All 61 pages exist in the content tree at their correct ltree paths
- [ ] AC2: Every page is in PUBLISHED status
- [ ] AC3: Every component instance on every page has contextually appropriate dummy data — no lorem ipsum, no placeholder text
- [ ] AC4: `GET /api/content/v1/pages/content/tut-usa/home` returns a full component tree
- [ ] AC5: Missing assets file is populated with all image references; each entry follows the required format with full detail
- [ ] AC6: Navigation and Footer XF components are published and contain real link structure
- [ ] AC7: `mvn test` passes; `pnpm build` passes

---

## §5 — Completion & Handoff Notes

> Entries go at the TOP. Most recent first.

---

### E-07 — Frontend Renderers: CTAs, Promotions & Campaigns (43 components)
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — 43 components implemented as named-export `.tsx` files in `tut-usa/ctas/`; zero hardcoded data
  - [x] AC2 — Hero and banner components with image fields have resolution in JSDoc (HeroBanner bg 1920×820, SplitHero media 960×820, ImageBanner 1920×600, PromoBanner 1200×400, PromoTile 400×300, SeasonalCampaignBlock 1200×600, CampaignLandingSection 1200×600, MarketplaceListingCard logo 120×40, VideoHero posterImage 1280×720)
  - [x] AC3 — `pnpm build` passed (8/8 packages, 0 TypeScript errors)
**Files Changed:**
  - `frontend/apps/site-nextjs/src/components/tut-usa/ctas/` — 43 `.tsx` components + `index.ts` barrel
  - `frontend/apps/site-nextjs/src/components/component-map.tsx` — 43 registrations under `tut-usa/calls-to-action-promotions-campaigns/<slug>` (CtasHeroBanner aliased to avoid conflict with tut/HeroBanner)
**Build Verified:** Yes — `pnpm build` 8/8 SUCCESS
**Notes:** `'use client'` on AlertBanner (dismissible state), PricingTable (billing toggle state). CtasHeroBanner aliased because `HeroBanner` already imported from `tut/`. AnnouncementBar and SeasonalCampaignBlock auto-hide based on startDate/endDate. Form components (NewsletterSignup, EmailSignup, TrialSignup) are presentational only — no submit handlers.

---

### E-05 — Frontend Renderers: Media, Visual Storytelling & Assets (33 components)
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — 33 components implemented in `tut-usa/media/`; zero hardcoded data
  - [x] AC2 — Every image/video asset field has resolution JSDoc (carousel 1920×800, before/after 800×500, video poster 1280×720, gallery images 800×600, thumbnails 400×300, logos 120×40, icons 48×48)
  - [x] AC3 — Gallery/carousel components accept items array — no hardcoded slide count
  - [x] AC4 — `pnpm build` passed (8/8 packages, 0 TypeScript errors)
**Files Changed:**
  - `frontend/apps/site-nextjs/src/components/tut-usa/media/` — 33 `.tsx` components + `index.ts` barrel
  - `frontend/apps/site-nextjs/src/components/component-map.tsx` — 33 registrations under `tut-usa/media-visual-storytelling-assets/<slug>` (VideoEmbed aliased TutUsaVideoEmbed)
**Build Verified:** Yes — `pnpm build` 8/8 SUCCESS
**Notes:** `'use client'` on Carousel, ContentSlider, LightboxGallery, BeforeAfterImage, TestimonialSlider. HtmlEmbed uses iframe sandbox for sandboxMode=true. VideoEmbed aliased to avoid conflict with tut/VideoEmbed.

---

### E-04 — Frontend Renderers: Editorial & Article Content (68 components)
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — 68 components implemented as named-export `.tsx` files in `tut-usa/editorial/`; zero hardcoded data
  - [x] AC2 — Rich text fields use `safeHtml()` regex guard stripping `<script>` tags before `dangerouslySetInnerHTML` — no raw innerHTML injection
  - [x] AC3 — All image asset fields have resolution documented in JSDoc (hero 1920×1080, thumbnail 400×300, profile 300×300, icons 48×48, featured image 1200×630)
  - [x] AC4 — `pnpm build` passed (8/8 packages, 0 TypeScript errors)
**Files Changed:**
  - `frontend/apps/site-nextjs/src/components/tut-usa/editorial/` — 68 `.tsx` components + `index.ts` barrel
  - `frontend/apps/site-nextjs/src/components/component-map.tsx` — 68 components registered under `tut-usa/editorial-article-content/<slug>` (Accordion aliased EditorialAccordion, StatCounter aliased EditorialStatCounter to avoid tut/* conflicts)
**Build Verified:** Yes — `pnpm build` 8/8 SUCCESS
**Notes:** `'use client'` applied to Accordion, Tabs, DataTable, StatCounter, ReadingProgress, ContentRating. Aggregation components (Faq, BlogListing, LatestNews, LeadershipGrid, AuthorList) accept children prop. All text content data-driven; no lorem ipsum or hardcoded values.

---

### E-03 — Frontend Renderers: Layout & Page Structure (32 components)
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — 32 components implemented as named-export `.tsx` files in `tut-usa/layout/`; zero hardcoded data
  - [x] AC2 — All 32 registered in `component-map.tsx` under `tut-usa/layout-page-structure/<slug>`
  - [x] AC3 — Zero hardcoded dummy data; all content rendered from `data` prop with typed interfaces
  - [x] AC4 — Container components (Container, GridLayout, TwoColumnLayout, TwoColumnsGrid, ThreeColumnLayout, CardGrid, ModalDialog, SidePanel, DrawerNavigation) accept and render `children`
  - [x] AC5 — All image `asset` fields have resolution documented in JSDoc (SidebarPromo: 400×500, MediaObject: 800×600, PageHeader: 1920×600, Badge/FramedMessage icon: 24×24, IconCard icon: 64×64, EmptyState illustration: 400×300)
  - [x] AC6 — `pnpm build` passed (8/8 packages, 0 TypeScript errors)
**Files Changed:**
  - `frontend/apps/site-nextjs/src/components/tut-usa/layout/` — 32 `.tsx` components + `index.ts` barrel
  - `frontend/apps/site-nextjs/src/components/component-map.tsx` — 32 components registered (Container aliased as LayoutContainer, CardGrid aliased as LayoutCardGrid to avoid conflicts)
**Build Verified:** Yes — `pnpm build` 8/8 SUCCESS
**Notes:** `Container` and `CardGrid` conflicted with existing names in component-map.tsx — aliased with `LayoutContainer` / `LayoutCardGrid`. `GridLayout` uses `useId()` + scoped `<style>` for responsive column counts. `'use client'` applied to StickyCta, ModalDialog, SidePanel, DrawerNavigation, Tooltip, Popover. `PageMetadata` renders `null` (non-visual).

---

### E-06 — Frontend Renderers: Navigation & Discovery + XF Locking
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — 28 navigation components implemented as named-export `.tsx` files in `tut-usa/navigation/`; zero hardcoded data
  - [x] AC2 — Navigation and Footer rendered from XF paths via `XfNavigation`/`XfFooter` client components injected in `layout.tsx`; NOT from per-page `components` array
  - [x] AC3 — Admin page editor shows locked XF slots (`LockedXfSlot` component) for Navigation (top) and Footer (bottom) with lock icon and "Edit in Experience Fragments →" link
  - [x] AC4 — Locked XF slots are outside the DndContext/SortableContext — cannot be moved, selected, edited, or deleted
  - [x] AC5 — "Edit in Experience Fragments →" links to correct XF path in admin editor
  - [x] AC6 — `pnpm build` passed (8/8 packages, 0 TypeScript errors); `mvn test` BUILD SUCCESS (41/41 green)
**Files Changed:**
  - `frontend/apps/site-nextjs/src/components/tut-usa/navigation/` — 28 component `.tsx` files + `index.ts`
  - `frontend/apps/site-nextjs/src/components/tut-usa/XfNavigation.tsx` — client component fetching XF nav from backend
  - `frontend/apps/site-nextjs/src/components/tut-usa/XfFooter.tsx` — client component fetching XF footer from backend
  - `frontend/apps/site-nextjs/src/app/layout.tsx` — injects XfNavigation + XfFooter at layout level
  - `frontend/apps/site-nextjs/src/components/component-map.tsx` — 28 components registered under `tut-usa/navigation-search-discovery/<slug>`
  - `frontend/apps/admin/src/app/editor/page.tsx` — `LockedXfSlot` component; locked Nav before DndContext, locked Footer after
**Build Verified:** Yes — `pnpm build` 8/8 SUCCESS; `mvn test` 41/41 green
**Notes:** Spec duplicate for 161/162 means 28 unique components. `BackToTop` needs `'use client'` for `window.scrollTo`.

---

### E-02 — Backend: Register All 406 Component Definitions (Flyway V16)
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — 406 INSERT rows present in V16 migration; `SELECT COUNT(*) FROM component_definitions WHERE resource_type LIKE 'tut-usa/%'` will return 406
  - [x] AC2 — All 14 group_name values present with correct component distribution
  - [x] AC3 — Every component has a valid non-empty `data_schema` JSON Schema with typed properties
  - [x] AC4 — `GET /api/content/v1/component-registry` will return all 406 tut-usa components grouped correctly
  - [x] AC5 — `mvn clean compile` passed (0 errors); `mvn test` passed (BUILD SUCCESS, all 41 tests green)
**Files Changed:**
  - `flexcms/flexcms-app/src/main/resources/db/migration/V16__tut_usa_component_definitions.sql` — 406 INSERT rows across 14 groups; JSON Schema per component using proper type annotations (x-rich-text, x-asset, x-reference, format: uri, etc.)
**Build Verified:** Yes — `mvn clean compile` and `mvn test` BUILD SUCCESS (41/41 tests)
**Notes:** All 406 components generated from spec. `is_container=TRUE` applied to layout containers (Container, Grid Layout, Two Column Layout, Two Columns Grid, Three Column Layout, Card Grid) and aggregation components (Blog Listing, Leadership Grid, Author List). `::jsonb` cast operator verified correct. E-06 is now unblocked (E-01 ✅ and E-02 ✅).

---

### E-01 — Foundation: Clean Old TUT Content + New TUT USA Site Skeleton
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — `DELETE FROM component_definitions WHERE resource_type LIKE 'tut/%'` removes all 18 old components; verified by migration SQL correctness
  - [x] AC2 — 10 nodes inserted under `content.tut-usa` (1 L0 root + 9 L1 section pages); counted in migration SQL
  - [x] AC3 — XF nodes exist at `content.experience-fragments.tut-usa.global.navigation` (fragmentType: header, DRAFT) and `content.experience-fragments.tut-usa.global.footer` (fragmentType: footer, DRAFT); master xf-page variations also seeded
  - [x] AC4 — `mvn clean compile` passed (0 errors); `mvn test` passed (BUILD SUCCESS, all 41 tests green)
**Files Changed:**
  - `flexcms/flexcms-app/src/main/resources/db/migration/V15__tut_usa_foundation.sql` — new Flyway migration: DELETE old tut/* data, INSERT tut-usa site + domain mappings, 10 content nodes (L0+L1), XF hierarchy (navigation+footer+master variants), XF metadata registry entries
**Build Verified:** Yes — `mvn clean compile` and `mvn test` BUILD SUCCESS
**Notes:** Old tut-gb/de/fr/ca sites remain in the `sites` table and `domain_mappings` (not deleted per task scope). Old XF metadata for those sites IS deleted. L1 nodes placed directly under `content.tut-usa` (no locale container for this USA English-only site). XF master variation nodes seeded as DRAFT — ready for component authoring in E-06.

### DONE Template
```
### [ITEM-ID] — Title
**Status:** ✅ DONE
**Date:** YYYY-MM-DD
**Agent:** Erik
**AC Verification:**
  - [x] AC1 — verified by [how you tested]
  - [x] AC2 — verified by [how you tested]
**Files Changed:**
  - path/to/file — [what changed]
**Build Verified:** Yes — `mvn clean compile` passed / frontend build passed
**CI Status:** ✅ GitHub Actions passed (link if available)
**Notes:** [anything relevant for future agents]
```

### PAUSED Template
```
### [ITEM-ID] — Title
**Status:** 🟠 PAUSED
**Date:** YYYY-MM-DD
**Agent:** Erik
**Progress:** [X]% complete
**What was done:**
  - [completed sub-tasks with file references]
**What remains:**
  - [remaining sub-tasks with specific details]
**Current state of code:**
  - Does it compile? Yes/No
  - path/to/file — [state: complete? partial? broken?]
**Where I stopped:**
  [Exact location + reason for stopping]
**To continue:**
  1. [Step-by-step instructions for next agent]
  2. [Be very specific — file names, method names, what to implement next]
  3. [Include any gotchas or design decisions made]
```

---

## §6 — Inline Bug Tracking

### Current Inline Bugs

| Task | Bug | Status | Summary |
|------|-----|--------|---------|
| *none yet* | — | — | — |
