# FlexCMS Admin UI — Designer Brief & Requirements

> **Purpose:** This document provides the complete scope of work for the principal UI/UX designer. Every admin interface in FlexCMS (Content Management, Digital Asset Management, Product Information Management, Workflows, Settings) shares one unified design system. The designer must deliver a cohesive visual language and page-level mockups that frontend developers (AI agents) will implement pixel-perfectly.

---

## 1. Product Context

FlexCMS is an enterprise content management platform with three independent pillars:

| Pillar | What it manages | Admin users |
|---|---|---|
| **CMS** (Content) | Pages, components, navigation, templates, multi-site, multi-language | Content authors, editors, reviewers, publishers |
| **DAM** (Digital Assets) | Images, videos, documents, renditions, metadata | Creative teams, marketing |
| **PIM** (Products) | Product catalogs, schemas, variants, pricing, imports | Product managers, merchandisers |

All three are managed through **one unified Admin UI** — a single Next.js application at `http://admin.flexcms.example.com`. Users navigate between CMS, DAM, and PIM sections seamlessly without context-switching between different tools.

---

## 2. What We Need From The Designer

### 2.1 Deliverables Checklist

| # | Deliverable | Format | Priority |
|---|---|---|---|
| 1 | **Design Tokens / Theme Specification** | Figma variables or JSON token file (see §3 for the token structure we already use) | 🔴 P0 — Blocks everything |
| 2 | **Icon Set** | SVG, consistent stroke weight (1.5px), 24×24 grid. Need ~80 icons (see §6.3) | 🔴 P0 |
| 3 | **Component Library (Figma)** | Auto-layout components matching the variants in §6.1 (Button, Input, Label, Card, Badge, Table, Dialog, etc.) | 🔴 P0 |
| 4 | **Global Shell / Layout** | Top nav, sidebar, breadcrumbs, user menu, theme toggle, notification bell — the persistent wrapper | 🔴 P0 |
| 5 | **Page Mockups — CMS Admin** (9 pages) | Desktop (1440px) + Tablet (1024px). See §4.1 | 🟡 P1 |
| 6 | **Page Mockups — DAM Admin** (4 pages) | Desktop + Tablet. See §4.2 | 🟡 P1 |
| 7 | **Page Mockups — PIM Admin** (11 pages) | Desktop + Tablet. See §4.3 | 🟡 P1 |
| 8 | **Page Mockups — Shared Admin** (4 pages) | Desktop + Tablet. See §4.4 | 🟡 P1 |
| 9 | **Empty States & Error States** | For every data list/grid page | 🟢 P2 |
| 10 | **Loading Skeletons** | Shimmer patterns for every page that fetches data | 🟢 P2 |
| 11 | **Dark Theme Variant** | Full pass of every page in dark mode | 🟢 P2 |
| 12 | **Motion / Transition Spec** | Page transitions, drawer open/close, toast animations, drag-and-drop affordances | 🟢 P2 |

### 2.2 Delivery Format Requirements

- **Tool:** Figma (shared workspace)
- **Component naming:** Must match `@flexcms/ui` component names exactly (e.g., `Button/default/md`, `Card/with-header`, `Badge/destructive`)
- **Responsive breakpoints:** Desktop 1440px, Tablet 1024px (mobile not required — admin is desktop-first)
- **Color format:** Hex (6-digit). Must map 1-to-1 to our CSS custom property tokens (see §3)
- **Typography:** System font stack (`system-ui, -apple-system, sans-serif`) unless a specific typeface is chosen. Provide font sizes in `rem`.
- **Spacing:** 4px base grid (0.25rem). All padding/margins must be multiples of 4px.
- **Shadows:** Provide box-shadow values as CSS strings
- **Corner radius:** Express as token names (`--radius-sm`, `--radius-md`, `--radius-lg`) not raw pixel values

---

## 3. Existing Design Token Structure

We already have a theme token system implemented. The designer must provide **values** for every token below (for both light and dark themes). This is the contract between design and code.

### 3.1 Color Tokens (Required)

```
Surface Colors:
  --color-background           Page background
  --color-foreground           Primary text color
  --color-card                 Card / panel background
  --color-card-foreground      Text on cards
  --color-popover              Dropdown / popover background
  --color-popover-foreground   Text on popovers

Brand Colors:
  --color-primary              Primary action (buttons, links)
  --color-primary-foreground   Text on primary color
  --color-secondary            Secondary surfaces / subtle buttons
  --color-secondary-foreground Text on secondary color
  --color-accent               Hover / active highlights
  --color-accent-foreground    Text on accent

Semantic Colors:
  --color-muted                Disabled / subtle backgrounds
  --color-muted-foreground     Placeholder / hint text
  --color-destructive          Danger / delete actions
  --color-destructive-foreground Text on destructive
  --color-success              (NEW — designer to define) Publish / success states
  --color-success-foreground   (NEW) Text on success
  --color-warning              (NEW) Draft / needs-attention states
  --color-warning-foreground   (NEW) Text on warning
  --color-info                 (NEW) Informational badges / banners
  --color-info-foreground      (NEW) Text on info

Border & Input:
  --color-border               Default border
  --color-input                Input field border
  --color-ring                 Focus ring

Sidebar (NEW — designer to define):
  --color-sidebar-background
  --color-sidebar-foreground
  --color-sidebar-primary
  --color-sidebar-accent
  --color-sidebar-border
```

### 3.2 Radius Tokens

```
  --radius-sm    Small elements (Badge, small Button)
  --radius-md    Medium elements (Input, default Button)
  --radius-lg    Large elements (Card, Dialog)
  --radius-xl    (NEW) Extra-large (sheets, full panels)
```

### 3.3 Shadow Tokens (NEW — designer to define)

```
  --shadow-sm     Subtle elevation (cards on page)
  --shadow-md     Medium elevation (dropdowns, popovers)
  --shadow-lg     High elevation (dialogs, modals)
```

### 3.4 Typography Scale (NEW — designer to define)

```
  --font-size-xs     (used for: meta labels, timestamps)
  --font-size-sm     (used for: badges, table cells, helper text)
  --font-size-base   (used for: body text, inputs, buttons)
  --font-size-lg     (used for: section headings, card titles)
  --font-size-xl     (used for: page titles)
  --font-size-2xl    (used for: dashboard stat numbers)
  --font-size-3xl    (used for: hero stat / empty state heading)

  --font-weight-normal
  --font-weight-medium
  --font-weight-semibold
  --font-weight-bold

  --line-height-tight    (used for: headings)
  --line-height-normal   (used for: body)
  --line-height-relaxed  (used for: long paragraphs)
```

### 3.5 Spacing Scale

```
  All spacing uses a 4px grid: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24
  Mapped to rem: 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6
```

---

## 4. Complete Page Inventory (28 pages total)

### 4.1 CMS Admin Pages (9 pages)

| # | Route | Page Name | Key UI Elements |
|---|---|---|---|
| 1 | `/` | **Dashboard** | Stat cards (4), recent edits table, workflow inbox list, quick-action buttons, activity chart | 
| 2 | `/sites` | **Site Manager** | Site list cards/table, create site dialog, site status badges |
| 3 | `/sites/[id]/pages` | **Content Tree Browser** | Collapsible tree sidebar, page list/grid view toggle, page status badges, context menu (edit, publish, move, delete), breadcrumbs |
| 4 | `/sites/[id]/pages/[path]/edit` | **Visual Page Editor** | Split layout: left sidebar (component palette), center (WYSIWYG canvas with drag zones), right sidebar (property panel with auto-generated form), top toolbar (save, publish, preview, undo/redo, responsive toggle) |
| 5 | `/sites/[id]/assets` | **DAM Browser** | Grid/list toggle, folder tree sidebar, asset thumbnail cards, upload dropzone, filter bar (mime type, date, tags), multi-select actions |
| 6 | `/sites/[id]/i18n` | **Translation Manager** | Language matrix table, translation status badges (translated / outdated / missing), export XLIFF button, inline edit |
| 7 | `/workflows` | **Workflow Inbox** | Task list with filters (status, assignee, date), task detail drawer, approve/reject/comment actions, timeline |
| 8 | `/components` | **Component Registry** | Component cards grid, search/filter bar, component detail panel (schema viewer, dialog preview, data contract JSON) |
| 9 | `/sites/[id]/pages/[path]/preview` | **Content Preview** | Iframe preview with viewport toggle (desktop/tablet/mobile), side-by-side edit mode, publish button |

### 4.2 DAM Admin Pages (4 pages)

| # | Route | Page Name | Key UI Elements |
|---|---|---|---|
| 10 | `/dam` | **DAM Dashboard** | Storage usage stat card, recent uploads grid, asset type distribution chart |
| 11 | `/dam/browse` | **Asset Browser** (global) | Same as §4.1 #5 but site-independent |
| 12 | `/dam/[assetId]` | **Asset Detail** | Large preview, metadata form (title, alt, tags, copyright), rendition list with thumbnails, usage references list (which pages use this asset) |
| 13 | `/dam/upload` | **Bulk Upload** | Drag-and-drop zone, upload queue with progress bars, metadata pre-fill form, folder selector |

### 4.3 PIM Admin Pages (11 pages)

| # | Route | Page Name | Key UI Elements |
|---|---|---|---|
| 14 | `/pim` | **PIM Dashboard** | Stat cards (catalogs, products, pending imports), recent edit activity, import job status list |
| 15 | `/pim/schemas` | **Schema Browser** | Schema list with version badges, create-new-version button, search |
| 16 | `/pim/schemas/[id]` | **Schema Editor** | Visual attribute-group builder (drag-and-drop attribute ordering), field type picker, validation rules editor, inheritance tree visualization (parent → child schema), diff view between versions |
| 17 | `/pim/catalogs` | **Catalog List** | Filterable table (year, season, status), create catalog dialog, status badges |
| 18 | `/pim/catalogs/[id]` | **Catalog Detail** | Product data grid (sortable, filterable, paginated), bulk selection actions (publish, archive, export), carryforward button |
| 19 | `/pim/catalogs/[id]/carryforward` | **Carryforward Wizard** | Multi-step wizard: select source catalog → preview products → configure overrides → execute → result summary |
| 20 | `/pim/products` | **Product Search** | Faceted search (sidebar facets + search bar), product grid/list toggle, sort controls |
| 21 | `/pim/products/[sku]` | **Product Editor** | Auto-generated form from schema (grouped into collapsible sections), inherited-field visual indicator (e.g., subtle background or icon), variant editor (sub-table), asset linker (DAM picker), version history link |
| 22 | `/pim/products/[sku]/history` | **Product Version History** | Version timeline, diff viewer (side-by-side attribute comparison), restore button |
| 23 | `/pim/import` | **Import Wizard** | Multi-step: upload file → select format (CSV/Excel/JSON) → map fields (drag-connect UI or dropdown mapping) → preview first 10 rows → execute |
| 24 | `/pim/import/jobs` | **Import Job History** | Job list table with status badges, expandable error log per job, re-run button |

### 4.4 Shared / System Admin Pages (4 pages)

| # | Route | Page Name | Key UI Elements |
|---|---|---|---|
| 25 | `/settings` | **System Settings** | Tab navigation (General, Themes, Users, API Keys), section cards with form fields |
| 26 | `/settings/users` | **User Management** | User table, invite dialog, role assignment dropdown, status toggle |
| 27 | `/settings/themes` | **Theme Editor** | Live color picker per token, preview panel showing sample components with live theme, export/import theme JSON |
| 28 | `/login` | **Login Page** | Centered card: logo, email input, password input, sign-in button, "forgot password" link, optional SSO button |

---

## 5. Recurring UI Patterns (Design Once, Reuse Everywhere)

The designer should create these as **reusable pattern templates** (not just one-off page designs):

### 5.1 Layout Patterns

| Pattern | Where Used | Description |
|---|---|---|
| **Shell / App Frame** | All pages | Persistent top bar (logo, search, notifications, user avatar, theme toggle) + collapsible left sidebar (navigation) + main content area + optional right sidebar |
| **Master-Detail** | Content tree, DAM browse, PIM products | Left panel: list/tree. Right panel: detail/editor. |
| **Data Grid Page** | Catalogs, products, users, workflows, import jobs | Toolbar (search + filters + view toggle) → data table/grid → pagination footer |
| **Editor Page** | Page editor, product editor, schema editor, asset detail | Breadcrumb → toolbar → form/canvas → action bar (save, publish, cancel) |
| **Wizard / Stepper** | Import wizard, carryforward, bulk publish | Step indicator bar → step content → back/next/finish buttons |
| **Dashboard** | `/`, `/pim`, `/dam` | Stat card row → chart/table row → recent activity list |

### 5.2 Component Patterns

| Pattern | Where Used | Description |
|---|---|---|
| **Empty State** | Every list/grid | Illustration + heading + description + CTA button |
| **Confirmation Dialog** | Delete, publish, archive | Icon + title + description + cancel/confirm buttons |
| **Notification Toast** | Save success, publish complete, errors | Icon + message + optional action link + dismiss |
| **Context Menu** | Tree nodes, table rows, asset cards | Right-click or "⋯" button → action list |
| **Command Palette** | Global (Ctrl+K) | Search input + categorized results (pages, assets, products, actions) |
| **Inline Edit** | Table cells, translation matrix | Click text → become editable input → save on blur/Enter |
| **Drag Indicator** | Page editor, schema editor | Ghost preview during drag, drop zone highlight |
| **Status Flow** | Content, products, import jobs | Badge chain showing: Draft → Review → Published (with active state) |

---

## 6. Component Inventory

### 6.1 UI Components Requiring Design (42 components)

#### Already Implemented (need design review/polish) — 12 components:
| Component | Variants |
|---|---|
| Button | 6 variants × 4 sizes = 24 states + disabled + loading |
| Input | text, email, password, number, search + disabled + error + with icon |
| Label | default + required indicator + error state |
| Textarea | default + disabled + error + auto-resize |
| Badge | 6 color variants (default, secondary, destructive, outline, success, warning) |
| Card | with/without header, footer, hover state |
| Separator | horizontal, vertical |
| Skeleton | text line, circle, rectangle, card-shaped |
| Avatar | image, initials, 3 sizes (sm/md/lg) |

#### Need Design + Implementation — 30 components:
| Component | Variants / Notes |
|---|---|
| **Select / Dropdown** | single select, multi-select, searchable, with groups |
| **Checkbox** | default, indeterminate, disabled |
| **Radio Group** | vertical, horizontal, with description |
| **Switch / Toggle** | on/off, disabled, with label |
| **Dialog / Modal** | small (confirm), medium (form), large (preview), full-screen |
| **Sheet / Drawer** | left, right, bottom — used for property panels, detail views |
| **Dropdown Menu** | with icons, with keyboard shortcuts, nested submenu |
| **Context Menu** | right-click menu — same structure as dropdown |
| **Popover** | with arrow, configurable placement |
| **Tooltip** | text-only, rich (with title + description) |
| **Toast / Notification** | success, error, warning, info, with action button |
| **Tabs** | horizontal, vertical, with badge counts |
| **Accordion / Collapsible** | single-open, multi-open, with icon |
| **Data Table** | sortable headers, selectable rows, pagination, column resize, row actions |
| **Tree View** | expandable nodes, icons, context menu, drag-to-reorder |
| **Breadcrumb** | with links, truncated with "…" for deep paths |
| **Pagination** | page numbers, prev/next, page size selector |
| **Progress Bar** | determinate, indeterminate |
| **Spinner / Loader** | inline, overlay, full-page |
| **Command Palette** | search input, categorized results, keyboard navigation |
| **Date Picker** | single date, date range |
| **Color Picker** | for theme editor — hex input + visual picker |
| **File Upload / Dropzone** | drag-and-drop, click-to-browse, progress indicator |
| **Tag Input** | add/remove tags, autocomplete suggestions |
| **Rich Text Toolbar** | bold, italic, heading, link, image, list — for Tiptap editor |
| **Sidebar Navigation** | collapsible groups, active indicator, badge counts, nested items |
| **Top Navigation Bar** | logo, global search, notifications, user menu |
| **Stat Card** | icon + label + value + trend indicator |
| **Step Indicator** | horizontal stepper for wizards — completed / active / upcoming states |
| **Diff Viewer** | side-by-side comparison with additions (green) and removals (red) |

### 6.2 Component States (Design Every State)

For **every** component, the designer must provide all applicable states:

```
Required States:
  ☐ Default / Rest
  ☐ Hover
  ☐ Active / Pressed
  ☐ Focus (with focus ring)
  ☐ Disabled
  ☐ Loading (where applicable)
  ☐ Error (where applicable)
  ☐ Empty (where applicable, e.g., Select with no options)

For form elements, also:
  ☐ Filled
  ☐ Read-only
  ☐ With helper text
  ☐ With error message
  ☐ With success validation
```

### 6.3 Icon Set (~80 icons needed)

| Category | Icons |
|---|---|
| **Navigation** | home, pages, assets, products, workflows, settings, users, chevron-left, chevron-right, chevron-down, chevron-up, menu, close, external-link |
| **Actions** | plus, edit, trash, copy, move, download, upload, save, undo, redo, refresh, search, filter, sort-asc, sort-desc |
| **Content** | page, template, component, text, image, video, document, folder, file, link, code, heading |
| **Status** | check-circle, x-circle, alert-triangle, info-circle, clock, eye, eye-off, lock, unlock, published, draft, archived |
| **Layout** | grid-view, list-view, columns, sidebar-left, sidebar-right, maximize, minimize, split-horizontal, split-vertical |
| **Media** | image, crop, resize, rendition, palette, layers |
| **PIM** | product, catalog, schema, variant, barcode, tag, price, inventory, import, export |
| **Social/Auth** | user, users, key, shield, log-in, log-out, mail |
| **Misc** | sun (light theme), moon (dark theme), globe (language), flag, bell (notifications), star, heart, grip-dots (drag handle) |

**Requirements:** Monochrome, 24×24, 1.5px stroke weight, consistent optical sizing. Deliver as individual SVGs and as a sprite sheet. We recommend using or adapting [Lucide Icons](https://lucide.dev) as a base.

---

## 7. Interaction & Layout Specifications

### 7.1 Responsive Behavior

| Breakpoint | Layout |
|---|---|
| ≥ 1440px (Desktop) | Full layout: sidebar expanded (240px) + content + optional right panel |
| 1024–1439px (Tablet) | Sidebar collapsed to icons-only (64px) + content fills remaining |
| < 1024px | Not required — admin is desktop-first. Show "please use desktop" message. |

### 7.2 Sidebar Behavior

- Default: expanded (240px width)
- Collapsible: click toggle → shrink to icon-only (64px) with tooltips on hover
- Sections: CMS, DAM, PIM, Workflows, Settings (each collapsible group)
- Active item: highlighted background + left border accent
- Badge counts on: Workflows (pending count), Import Jobs (active count)

### 7.3 Page Editor Specific

The visual page editor (`/sites/[id]/pages/[path]/edit`) is the most complex page. It has a **three-panel layout**:

```
┌──────────────────────────────────────────────────────────┐
│  Toolbar: [Save] [Publish] [Preview] [Undo] [Redo]      │
│           [Desktop|Tablet|Mobile]  [Edit|Preview]        │
├────────┬──────────────────────────────┬──────────────────┤
│ Left   │  Center: WYSIWYG Canvas     │ Right Panel      │
│ Panel  │                              │ (Property Form)  │
│ (240px)│  ┌────────────────────┐     │                  │
│        │  │ [Header Component] │     │ Title: [____]    │
│ Comp.  │  ├────────────────────┤     │ Theme: [▼ dark]  │
│ Palette│  │ [Hero Banner     ] │     │ Height: [▼ lg]   │
│        │  ├────────────────────┤     │                  │
│ - Text │  │ ➕ DROP ZONE       │     │ [Delete] [Move]  │
│ - Image│  ├────────────────────┤     │                  │
│ - Hero │  │ [Footer Component] │     │                  │
│ - Grid │  └────────────────────┘     │                  │
│ - Card │                              │                  │
│ - ...  │                              │                  │
├────────┴──────────────────────────────┴──────────────────┤
│  Status bar: Last saved 2 min ago  |  Draft  |  v3      │
└──────────────────────────────────────────────────────────┘
```

### 7.4 Data Table Standard

All data tables across CMS, DAM, and PIM must follow the same pattern:

```
┌──────────────────────────────────────────────────────────┐
│ [Search: ____________]  [Filter ▼]  [⊞ Grid] [≡ List]   │
├────┬──────────┬──────────┬────────┬────────┬─────────────┤
│ ☐  │ Name ▲   │ Status   │ Modified│ Author │ Actions    │
├────┼──────────┼──────────┼────────┼────────┼─────────────┤
│ ☐  │ About Us │ 🟢 Publ. │ 2h ago │ admin  │ ⋯          │
│ ☐  │ Products │ 🟡 Draft │ 1d ago │ editor │ ⋯          │
│ ☐  │ Contact  │ 🔴 Arch. │ 5d ago │ admin  │ ⋯          │
├────┴──────────┴──────────┴────────┴────────┴─────────────┤
│ ☐ Select all  │  [Bulk Publish] [Bulk Delete]            │
├──────────────────────────────────────────────────────────┤
│ Showing 1-20 of 156  │  [← Prev]  1 2 3 ... 8  [Next →]│
└──────────────────────────────────────────────────────────┘
```

---

## 8. Mandatory Frontend Developer (AI Agent) Style Guidelines

> **CRITICAL:** These rules are non-negotiable. Every AI agent implementing admin UI pages must follow them exactly.

### 8.1 Component Usage Rules

```
RULE 1: NEVER use raw HTML elements for interactive UI.
  ✅ <Button variant="destructive">Delete</Button>
  ❌ <button className="bg-red-500">Delete</button>

RULE 2: NEVER hardcode colors. Always use theme tokens.
  ✅ text-[var(--color-foreground)]
  ✅ bg-[var(--color-card)]
  ❌ text-gray-900
  ❌ bg-white
  ❌ #0a0a0a

RULE 3: NEVER hardcode border-radius. Use token variables.
  ✅ rounded-[var(--radius-md)]
  ❌ rounded-md
  ❌ rounded-[6px]

RULE 4: ALL form inputs MUST have a <Label>.
  ✅ <Label htmlFor="title">Page Title</Label>
       <Input id="title" />
  ❌ <Input placeholder="Page Title" />  (no label)

RULE 5: ALL action buttons must use semantic variants.
  ✅ <Button variant="destructive">Delete</Button>
  ✅ <Button variant="default">Save</Button>
  ✅ <Button variant="outline">Cancel</Button>
  ❌ <Button>Delete</Button>  (no variant for destructive action)

RULE 6: ALL status indicators must use <Badge>.
  ✅ <Badge variant="success">Published</Badge>
  ✅ <Badge variant="warning">Draft</Badge>
  ✅ <Badge variant="destructive">Archived</Badge>
  ❌ <span className="text-green-500">Published</span>

RULE 7: ALL data display surfaces must use <Card>.
  ✅ <Card><CardHeader><CardTitle>Stats</CardTitle></CardHeader>...</Card>
  ❌ <div className="border rounded p-4">Stats...</div>

RULE 8: EVERY list/grid page MUST have an empty state.
  When data is empty, show: illustration + heading + description + CTA button.
  NEVER show a blank page or just "No results."

RULE 9: EVERY async operation MUST show loading state.
  Use <Skeleton> for initial page loads.
  Use <Spinner> for button actions.
  Use progress bars for uploads/imports.

RULE 10: EVERY page MUST have a breadcrumb.
  ✅ Dashboard > Sites > Corporate > Pages > About Us > Edit
  ❌ Just a page title with no navigation context
```

### 8.2 Layout Rules

```
RULE 11: ALL pages use the shared AppShell layout.
  Every page is rendered inside <AppShell> which provides:
  - Top navigation bar
  - Collapsible sidebar
  - Main content area with padding
  Never create a page that bypasses the shell (except /login).

RULE 12: Content area max-width is 1200px centered, unless it's a
  full-width page (page editor, DAM grid browser).

RULE 13: Spacing between sections: use gap-6 (1.5rem = 24px).
  Spacing between elements within a section: use gap-4 (1rem = 16px).
  Spacing between form fields: use gap-3 (0.75rem = 12px).

RULE 14: Page structure is always:
  1. Breadcrumb
  2. Page header (title + description + primary action button)
  3. Toolbar (search, filters, view toggles) — if data page
  4. Content (table, grid, form, canvas)
  5. Footer (pagination, action bar) — if applicable

RULE 15: Sidebar navigation groups must match these sections:
  - CMS: Dashboard, Sites, Workflows, Components
  - DAM: Asset Browser, Upload
  - PIM: Dashboard, Schemas, Catalogs, Products, Import
  - System: Settings, Users
```

### 8.3 Responsive Rules

```
RULE 16: Use CSS Grid for page-level layouts, Flexbox for component internals.

RULE 17: Stat card grids: 4 columns on desktop, 2 on tablet.
  Use: grid-cols-2 lg:grid-cols-4

RULE 18: Data tables: horizontally scrollable on smaller viewports.
  Wrap in <div className="overflow-x-auto">

RULE 19: Form layouts: single column below 768px, two columns above.
  Use: grid-cols-1 md:grid-cols-2
```

### 8.4 Accessibility Rules

```
RULE 20: ALL interactive elements must be keyboard accessible.
  Dialogs must trap focus. ESC closes. Tab cycles through focusable elements.

RULE 21: ALL images must have alt text. Decorative images use alt="".

RULE 22: Color must NEVER be the only indicator.
  ✅ Badge says "Published" + green color
  ❌ Green dot with no text

RULE 23: Focus rings must be visible.
  All focusable elements use: focus-visible:ring-2 ring-[var(--color-ring)]

RULE 24: Minimum contrast ratio: 4.5:1 for text, 3:1 for large text.
  Designer must verify this for both light and dark themes.
```

### 8.5 Naming Conventions

```
RULE 25: File naming for admin pages:
  Route: /pim/products/[sku]
  File:  frontend/apps/admin/src/app/pim/products/[sku]/page.tsx

RULE 26: Component naming in @flexcms/ui:
  File:  src/components/DataTable.tsx
  Export: export function DataTable(...) or export const DataTable = ...
  Never use default exports for components.

RULE 27: Every page component MUST have a JSDoc comment explaining:
  - What the page does
  - What data it fetches
  - What actions are available
```

---

## 9. Reference & Inspiration

The designer should study these products for UX patterns (not copy — adapt):

| Product | What to reference |
|---|---|
| **Vercel Dashboard** | Clean stat cards, deployment list, project overview layout |
| **Linear** | Command palette, keyboard-first navigation, project sidebar |
| **Shopify Admin** | Product editor form, variant management, inventory tables |
| **Contentful** | Content model editor, entry editor, sidebar panels |
| **Figma** | Component palette, canvas editor, property panel (right sidebar) |
| **Notion** | Tree navigation, inline editing, block-based editing |
| **Akeneo PIM** | Product grid, attribute group editor, import mapping |

---

## 10. Summary For Designer

| Metric | Count |
|---|---|
| **Total pages to design** | 28 |
| **UI components to design** | 42 (12 existing + 30 new) |
| **Icons needed** | ~80 |
| **Theme variants** | 2 (light + dark) |
| **Breakpoints** | 2 (1440px desktop + 1024px tablet) |
| **Design tokens to fill** | ~50 (colors, radius, shadows, typography) |
| **Admin sections** | 5 (CMS, DAM, PIM, Workflows, Settings) |

**Estimated design effort:** 3–4 weeks for a senior designer (P0 deliverables in week 1, page mockups in weeks 2–3, states + dark theme in week 4).

---

*Document version: 1.0 | Created: 2026-03-24 | Author: Chief Platform Engineer*

