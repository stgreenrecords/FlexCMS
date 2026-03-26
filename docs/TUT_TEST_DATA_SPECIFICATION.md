# TUT Luxury Cars — Test Data Specification

> **Purpose:** This document defines the complete test data set for FlexCMS validation. It covers 4 multi-market websites for TUT (a luxury car manufacturer), including content pages, experience fragments, component definitions, PIM product catalog, and DAM assets. A developer agent will use this document to generate SQL seed files and populate the database.

---

## 1. Business Context

**Company:** TUT — a global luxury automobile manufacturer.

**Markets (4 websites):**

| Site ID    | Market        | Languages | Default Locale | Domain (conceptual)     |
|------------|---------------|-----------|----------------|-------------------------|
| `tut-gb`   | Great Britain | en        | en             | www.tut-cars.co.uk      |
| `tut-de`   | Germany       | de        | de             | www.tut-cars.de         |
| `tut-fr`   | France        | fr        | fr             | www.tut-cars.fr         |
| `tut-ca`   | Canada        | en, fr    | en             | www.tut-cars.ca         |

**Content goals:** Showcase latest models, communicate innovation and safety leadership, provide product catalog, and deliver localized experiences per market. Each market has its own navigation structure (via Experience Fragments) but shares the same page templates and component library.

---

## 2. Site Definitions

```sql
-- Sites table entries
INSERT INTO sites (site_id, title, description, content_root, dam_root, config_root,
                   default_locale, supported_locales, allowed_templates, active)
VALUES
('tut-gb', 'TUT Great Britain',  'TUT luxury cars — UK market',     'tut-gb',  'dam.tut', 'conf.tut-gb', 'en',    'en',     'tut/templates/landing-page,tut/templates/content-page,tut/templates/model-page,tut/templates/catalog-page', TRUE),
('tut-de', 'TUT Germany',        'TUT Luxusautos — Deutscher Markt','tut-de',  'dam.tut', 'conf.tut-de', 'de',    'de',     'tut/templates/landing-page,tut/templates/content-page,tut/templates/model-page,tut/templates/catalog-page', TRUE),
('tut-fr', 'TUT France',         'TUT voitures de luxe — France',   'tut-fr',  'dam.tut', 'conf.tut-fr', 'fr',    'fr',     'tut/templates/landing-page,tut/templates/content-page,tut/templates/model-page,tut/templates/catalog-page', TRUE),
('tut-ca', 'TUT Canada',         'TUT luxury cars — Canadian market','tut-ca',  'dam.tut', 'conf.tut-ca', 'en',    'en,fr',  'tut/templates/landing-page,tut/templates/content-page,tut/templates/model-page,tut/templates/catalog-page', TRUE);
```

---

## 3. Component Definitions

All TUT sites share one component library. Components follow the pattern established by WKND: `tut/components/{name}`.

### 3.1 Component Registry

| # | resource_type | name | title | group | is_container | Description |
|---|---|---|---|---|---|---|
| 1 | `tut/components/page` | page | TUT Page | TUT Structure | false | Page wrapper — holds root container |
| 2 | `tut/components/xfpage` | xfpage | TUT XF Page | TUT Structure | true | Experience Fragment page variation |
| 3 | `tut/components/container` | container | Container | TUT Structure | true | Responsive layout grid — holds child components |
| 4 | `tut/components/hero-banner` | hero-banner | Hero Banner | TUT Content | false | Full-width hero with background image/video, overlay headline, subtext, and CTA button |
| 5 | `tut/components/title` | title | Title | TUT Content | false | Heading component (h1–h6) with optional overline text |
| 6 | `tut/components/text` | text | Text | TUT Content | false | Rich text block (HTML) |
| 7 | `tut/components/image` | image | Image | TUT Content | false | Responsive image with alt text, optional caption and link |
| 8 | `tut/components/teaser` | teaser | Teaser | TUT Content | false | Card with image, title, description, and CTA link |
| 9 | `tut/components/teaser-list` | teaser-list | Teaser List | TUT Content | false | Auto-generated grid of teasers from child pages or manual selection |
| 10 | `tut/components/carousel` | carousel | Carousel | TUT Content | true | Slide carousel — children are individual slides (teasers or images) |
| 11 | `tut/components/tabs` | tabs | Tabs | TUT Content | true | Tabbed content — each child container is a tab panel |
| 12 | `tut/components/accordion` | accordion | Accordion | TUT Content | true | Expandable sections — each child is a panel with title + content |
| 13 | `tut/components/video` | video | Video | TUT Content | false | Video player with poster image, autoplay option |
| 14 | `tut/components/spec-table` | spec-table | Specification Table | TUT Content | false | Key-value table for technical specifications |
| 15 | `tut/components/comparison-table` | comparison-table | Comparison Table | TUT Content | false | Side-by-side model comparison grid |
| 16 | `tut/components/feature-grid` | feature-grid | Feature Grid | TUT Content | true | Grid of feature cards (icon + title + description) |
| 17 | `tut/components/feature-item` | feature-item | Feature Item | TUT Content | false | Single feature card — child of feature-grid |
| 18 | `tut/components/cta-banner` | cta-banner | CTA Banner | TUT Content | false | Full-width call-to-action strip with heading, text, button |
| 19 | `tut/components/quote` | quote | Quote | TUT Content | false | Testimonial / pull quote with attribution |
| 20 | `tut/components/gallery` | gallery | Gallery | TUT Content | true | Image gallery — children are image components |
| 21 | `tut/components/contact-form` | contact-form | Contact Form | TUT Form | false | Enquiry form (name, email, phone, message, preferred dealer) |
| 22 | `tut/components/dealer-locator` | dealer-locator | Dealer Locator | TUT Content | false | Interactive map with dealer locations |
| 23 | `tut/components/product-card` | product-card | Product Card | TUT PIM | false | PIM-linked card — pulls product data by SKU |
| 24 | `tut/components/breadcrumb` | breadcrumb | Breadcrumb | TUT Navigation | false | Auto-generated page path breadcrumb |
| 25 | `tut/components/navigation` | navigation | Navigation | TUT Navigation | false | Primary site navigation (auto-built from page tree) |
| 26 | `tut/components/language-navigation` | language-navigation | Language Navigation | TUT Navigation | false | Language/region switcher |
| 27 | `tut/components/footer` | footer | Footer | TUT Navigation | true | Site footer — holds child components (text, links, social) |
| 28 | `tut/components/separator` | separator | Separator | TUT Content | false | Visual divider / horizontal rule |
| 29 | `tut/components/social-share` | social-share | Social Share | TUT Content | false | Social media sharing buttons |

Plus the existing `flexcms/experience-fragment` component for XF references.

### 3.2 Component Authoring Properties

Each component's `properties` JSONB stores its authored data. Below is the property contract for each component:

#### `tut/components/hero-banner`
```json
{
  "title": "string — main headline",
  "subtitle": "string — secondary text",
  "fileReference": "string — DAM path to background image",
  "videoReference": "string — DAM path to background video (optional, overrides image)",
  "overlayOpacity": "number — 0.0-1.0 (default 0.5)",
  "ctaText": "string — button label",
  "ctaLink": "string — internal page path or external URL",
  "textAlignment": "string — left | center | right (default center)",
  "height": "string — full | large | medium (default full)"
}
```

#### `tut/components/title`
```json
{
  "text": "string — heading text",
  "level": "string — h1 | h2 | h3 | h4 | h5 | h6 (default h2)",
  "overline": "string — small text above heading (optional)",
  "alignment": "string — left | center | right (default left)"
}
```

#### `tut/components/text`
```json
{
  "text": "string — HTML rich text content"
}
```

#### `tut/components/image`
```json
{
  "fileReference": "string — DAM path",
  "alt": "string — alt text",
  "caption": "string — visible caption (optional)",
  "link": "string — click-through URL (optional)",
  "width": "string — full | large | medium | small (default full)"
}
```

#### `tut/components/teaser`
```json
{
  "title": "string — card title",
  "description": "string — HTML text",
  "fileReference": "string — DAM path to image",
  "ctaText": "string — button label",
  "ctaLink": "string — target path",
  "pretitle": "string — small label above title (optional)",
  "style": "string — default | featured | minimal (default default)"
}
```

#### `tut/components/teaser-list`
```json
{
  "source": "string — children | manual",
  "parentPath": "string — page path to list children of (when source=children)",
  "manualItems": "array — list of {path} refs (when source=manual)",
  "maxItems": "number — limit (default 6)",
  "columns": "number — 2 | 3 | 4 (default 3)",
  "showDescription": "boolean (default true)"
}
```

#### `tut/components/carousel`
Container — children are `tut/components/teaser` or `tut/components/image`.
```json
{
  "autoplay": "boolean (default false)",
  "delay": "number — ms between slides (default 5000)",
  "showIndicators": "boolean (default true)"
}
```

#### `tut/components/tabs`
Container — each child is a `tut/components/container` where the container's `properties.tabLabel` becomes the tab title.
```json
{
  "orientation": "string — horizontal | vertical (default horizontal)"
}
```

#### `tut/components/accordion`
Container — each child is a `tut/components/container` where `properties.panelTitle` becomes the accordion heading.
```json
{
  "allowMultipleOpen": "boolean (default false)"
}
```

#### `tut/components/video`
```json
{
  "fileReference": "string — DAM path to video file",
  "posterImage": "string — DAM path to poster frame",
  "autoplay": "boolean (default false)",
  "muted": "boolean (default true)",
  "loop": "boolean (default false)",
  "title": "string — accessible title"
}
```

#### `tut/components/spec-table`
```json
{
  "title": "string — table heading",
  "specs": [
    {"label": "string", "value": "string", "unit": "string (optional)"}
  ]
}
```

#### `tut/components/comparison-table`
```json
{
  "title": "string — section heading",
  "models": ["string — SKU or path ref"],
  "attributes": ["string — attribute keys to compare"]
}
```

#### `tut/components/feature-grid`
Container — children are `tut/components/feature-item`.
```json
{
  "columns": "number — 2 | 3 | 4 (default 3)",
  "title": "string — section heading (optional)"
}
```

#### `tut/components/feature-item`
```json
{
  "icon": "string — icon name (e.g., shield, engine, battery, steering)",
  "title": "string — feature title",
  "description": "string — short description"
}
```

#### `tut/components/cta-banner`
```json
{
  "title": "string — banner headline",
  "text": "string — supporting text",
  "ctaText": "string — button label",
  "ctaLink": "string — target path",
  "theme": "string — dark | light | brand (default dark)"
}
```

#### `tut/components/quote`
```json
{
  "text": "string — quote text",
  "author": "string — attribution name",
  "role": "string — attribution title/role (optional)"
}
```

#### `tut/components/gallery`
Container — children are `tut/components/image`.
```json
{
  "columns": "number — 2 | 3 | 4 (default 3)",
  "enableLightbox": "boolean (default true)"
}
```

#### `tut/components/contact-form`
```json
{
  "title": "string — form heading",
  "recipientEmail": "string — where submissions go",
  "showPhoneField": "boolean (default true)",
  "showDealerSelect": "boolean (default true)",
  "thankYouMessage": "string — confirmation text",
  "privacyPolicyLink": "string — path to privacy page"
}
```

#### `tut/components/dealer-locator`
```json
{
  "title": "string — section heading",
  "country": "string — gb | de | fr | ca (auto from site)",
  "defaultZoom": "number (default 6)",
  "dealers": [
    {"name": "string", "address": "string", "lat": "number", "lng": "number", "phone": "string"}
  ]
}
```

#### `tut/components/product-card`
```json
{
  "sku": "string — PIM product SKU",
  "showPrice": "boolean (default true)",
  "showSpecs": "boolean (default false)",
  "ctaText": "string — button label (default 'Discover')",
  "ctaLink": "string — link to model page"
}
```

#### `tut/components/navigation`
```json
{
  "rootPath": "string — tree root to generate nav from",
  "depth": "number — navigation depth (default 2)",
  "showBrand": "boolean — show TUT logo (default true)"
}
```

#### `tut/components/language-navigation`
```json
{
  "rootPath": "string — site root to detect available languages"
}
```

#### `tut/components/breadcrumb`
```json
{
  "showHidden": "boolean — include hidden pages (default false)",
  "startLevel": "number — tree depth to start from (default 2)"
}
```

#### `tut/components/footer`
Container — children can be text, separator, navigation components.
```json
{
  "copyrightText": "string — e.g. '2026 TUT Motors Ltd. All rights reserved.'",
  "socialLinks": [
    {"platform": "string — facebook | instagram | youtube | linkedin | x", "url": "string"}
  ]
}
```

---

## 4. Page Hierarchy

All sites follow the same page structure. Paths use ltree dot notation.

### 4.1 Content Tree (per site, shown for `tut-gb` / `en`)

```
tut-gb                                              # site root (tut/components/page)
└── tut-gb.en                                       # language root (tut/components/page)
    ├── tut-gb.en.home                              # Home (tut/components/page, template: landing-page)
    ├── tut-gb.en.models                            # Models Overview (tut/components/page, template: catalog-page)
    │   ├── tut-gb.en.models.sovereign              # TUT Sovereign (tut/components/page, template: model-page)
    │   ├── tut-gb.en.models.veloce                 # TUT Veloce (tut/components/page, template: model-page)
    │   ├── tut-gb.en.models.atlas                  # TUT Atlas (tut/components/page, template: model-page)
    │   ├── tut-gb.en.models.lumina                 # TUT Lumina (tut/components/page, template: model-page)
    │   └── tut-gb.en.models.regale                 # TUT Regale (tut/components/page, template: model-page)
    ├── tut-gb.en.innovation                        # Innovation Hub (tut/components/page, template: content-page)
    │   ├── tut-gb.en.innovation.performance        # Performance Engineering
    │   ├── tut-gb.en.innovation.electrification    # Electrification
    │   └── tut-gb.en.innovation.autonomous         # Autonomous Driving
    ├── tut-gb.en.safety                            # Safety (tut/components/page, template: content-page)
    │   ├── tut-gb.en.safety.active-systems         # Active Safety Systems
    │   └── tut-gb.en.safety.crash-protection       # Crash Protection
    ├── tut-gb.en.about                             # About TUT (tut/components/page, template: content-page)
    │   ├── tut-gb.en.about.heritage                # Heritage & History
    │   ├── tut-gb.en.about.sustainability          # Sustainability
    │   ├── tut-gb.en.about.careers                 # Careers
    │   └── tut-gb.en.about.contact                 # Contact Us
    └── tut-gb.en.legal                             # Legal (tut/components/page, template: content-page)
        ├── tut-gb.en.legal.privacy                 # Privacy Policy
        ├── tut-gb.en.legal.terms                   # Terms of Use
        └── tut-gb.en.legal.cookies                 # Cookie Policy
```

**Total pages per single-language site: 20**

### 4.2 Canada (bilingual)

Canada has the same structure duplicated under two language roots:
```
tut-ca
├── tut-ca.en                                       # English Canada
│   ├── tut-ca.en.home
│   ├── tut-ca.en.models
│   │   ├── ... (same 5 models)
│   └── ... (same structure)
└── tut-ca.fr                                       # French Canada
    ├── tut-ca.fr.home (Accueil)
    ├── tut-ca.fr.models (Modeles)
    │   ├── ... (same 5 models, French content)
    └── ... (same structure, all French)
```

**Total pages per bilingual site: 40 (20 en + 20 fr)**

### 4.3 Page Count Summary

| Site | Languages | Pages per Language | Total Pages |
|------|-----------|-------------------|-------------|
| tut-gb | en | 20 | 20 |
| tut-de | de | 20 | 20 |
| tut-fr | fr | 20 | 20 |
| tut-ca | en, fr | 20 | 40 |
| **Total** | | | **100** |

---

## 5. Experience Fragments

Each market has its own header and footer XF so navigation can be customized per country while keeping a consistent structure. XFs are reused across all pages within that market/language.

### 5.1 XF Hierarchy

```
experience-fragments                                                  # global XF root
├── experience-fragments.tut                                          # TUT brand XF folder
│   ├── experience-fragments.tut.gb                                   # GB market
│   │   └── experience-fragments.tut.gb.en                            # en locale
│   │       ├── experience-fragments.tut.gb.en.header                 # Header XF
│   │       │   └── .header.master                                    # master variation
│   │       │       ├── navigation (tut/components/navigation)
│   │       │       ├── language-navigation (tut/components/language-navigation)
│   │       │       └── search (tut/components/search — not defined but placeholder)
│   │       ├── experience-fragments.tut.gb.en.footer                 # Footer XF
│   │       │   └── .footer.master
│   │       │       ├── footer (tut/components/footer)
│   │       │       └── text — copyright
│   │       └── experience-fragments.tut.gb.en.cookie-banner          # Cookie consent XF
│   │           └── .cookie-banner.master
│   ├── experience-fragments.tut.de
│   │   └── experience-fragments.tut.de.de                            # de locale
│   │       ├── header / footer / cookie-banner (same structure, German content)
│   ├── experience-fragments.tut.fr
│   │   └── experience-fragments.tut.fr.fr                            # fr locale
│   │       ├── header / footer / cookie-banner (same structure, French content)
│   └── experience-fragments.tut.ca
│       ├── experience-fragments.tut.ca.en                            # CA English
│       │   ├── header / footer / cookie-banner
│       └── experience-fragments.tut.ca.fr                            # CA French
│           ├── header / footer / cookie-banner
```

### 5.2 XF Details

#### Header XF — Navigation Content per Market

| Market | Nav Items (Level 1) | Market-Specific Links |
|--------|--------------------|-----------------------|
| GB | Models, Innovation, Safety, About, Contact | "Book a Test Drive" (links to UK dealers) |
| DE | Modelle, Innovation, Sicherheit, Uber Uns, Kontakt | "Probefahrt Buchen" (links to DE dealers), "TUT Magazin" |
| FR | Modeles, Innovation, Securite, A Propos, Contact | "Essai Routier" (links to FR dealers) |
| CA (en) | Models, Innovation, Safety, About, Contact | "Find a Dealer" (CA dealer locator), "Bilingual Toggle" |
| CA (fr) | Modeles, Innovation, Securite, A Propos, Contact | "Trouver un Concessionnaire", "Bilingual Toggle" |

#### Footer XF — Content per Market

| Market | Specifics |
|--------|-----------|
| GB | Links: Privacy, Terms, Cookies; Social: Instagram, YouTube, LinkedIn; Copyright: "TUT Motors Ltd." |
| DE | Links: Datenschutz, AGB, Impressum (Impressum is DE-specific legal requirement); Social: same |
| FR | Links: Confidentialite, CGU, Mentions Legales (FR-specific); Social: same |
| CA (en) | Links: Privacy, Terms, Cookies, Accessibility (CA requirement); Social: same; "TUT Motors Canada Inc." |
| CA (fr) | Links: Confidentialite, Conditions, Temoins, Accessibilite; Same social; Same company |

### 5.3 How Pages Reference XFs

Every page includes two XF references in its component tree:
```json
{
  "name": "header-xf",
  "resourceType": "flexcms/experience-fragment",
  "data": {
    "fragmentPath": "experience-fragments.tut.gb.en.header.master"
  }
}
```
```json
{
  "name": "footer-xf",
  "resourceType": "flexcms/experience-fragment",
  "data": {
    "fragmentPath": "experience-fragments.tut.gb.en.footer.master"
  }
}
```

This means **changing the navigation for all GB pages requires editing only one XF node** — the CMS advantage.

### 5.4 XF Count Summary

| Market | Language(s) | XFs per Language | Total XFs |
|--------|-------------|-----------------|-----------|
| GB | en | 3 (header, footer, cookie) | 3 |
| DE | de | 3 | 3 |
| FR | fr | 3 | 3 |
| CA | en, fr | 3 | 6 |
| **Total** | | | **15** |

Each XF has 1 variation (master) = **15 XF variation nodes** + **15 XF folder nodes** + ancestry nodes.

---

## 6. Page Component Composition

This section defines which components go inside each page type and how they are structured (component hierarchy).

### 6.1 Home Page (`home`)

```
page (tut/components/page)
├── header-xf (flexcms/experience-fragment → market header)
├── root (tut/components/container)
│   ├── hero (tut/components/hero-banner)
│   │   title: "Experience TUT"
│   │   subtitle: "Luxury Redefined"
│   │   fileReference: dam.tut.en.hero-home.jpg
│   │   ctaText: "Explore Models"
│   │   ctaLink: .../models
│   │
│   ├── models-section (tut/components/container)
│   │   ├── models-title (tut/components/title)
│   │   │   text: "Our Models", level: h2, overline: "THE RANGE"
│   │   └── models-grid (tut/components/teaser-list)
│   │       source: children, parentPath: .../models, maxItems: 5, columns: 3
│   │
│   ├── innovation-highlight (tut/components/container)
│   │   ├── innovation-title (tut/components/title)
│   │   │   text: "Pioneering Innovation", level: h2
│   │   └── innovation-features (tut/components/feature-grid)
│   │       ├── feature-1 (tut/components/feature-item)
│   │       │   icon: engine, title: "Twin-Turbo V8", description: "..."
│   │       ├── feature-2 (tut/components/feature-item)
│   │       │   icon: battery, title: "All-Electric Range", description: "..."
│   │       └── feature-3 (tut/components/feature-item)
│   │           icon: steering, title: "Autonomous Level 3", description: "..."
│   │
│   ├── video-section (tut/components/video)
│   │   title: "The Art of Engineering"
│   │   fileReference: dam.tut.en.brand-film.mp4
│   │   posterImage: dam.tut.en.brand-film-poster.jpg
│   │
│   ├── safety-banner (tut/components/cta-banner)
│   │   title: "Safety Without Compromise"
│   │   text: "5-star Euro NCAP across every model."
│   │   ctaText: "Our Safety Philosophy"
│   │   ctaLink: .../safety
│   │
│   ├── testimonial (tut/components/quote)
│   │   text: "The Sovereign is the finest car I have ever driven."
│   │   author: "James Richardson"
│   │   role: "Automotive Journalist, The Sunday Times"
│   │
│   └── contact-cta (tut/components/cta-banner)
│       title: "Book Your Test Drive"
│       ctaText: "Find a Dealer"
│       ctaLink: .../about/contact
│
└── footer-xf (flexcms/experience-fragment → market footer)
```

**Components used: 15** | **Reused on other pages:** hero-banner, teaser-list, feature-grid, cta-banner, quote

---

### 6.2 Models Overview Page (`models`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb (tut/components/breadcrumb)
│   ├── hero (tut/components/hero-banner)
│   │   title: "The TUT Range"
│   │   subtitle: "Five Icons of Luxury"
│   │   height: large
│   │
│   ├── models-grid (tut/components/teaser-list)
│   │   source: children, parentPath: .../models, columns: 3, showDescription: true
│   │
│   ├── comparison (tut/components/comparison-table)
│   │   title: "Compare Models"
│   │   models: ["TUT-SOVEREIGN-2026", "TUT-VELOCE-2026", "TUT-ATLAS-2026", "TUT-LUMINA-2026", "TUT-REGALE-2026"]
│   │   attributes: ["power", "acceleration_0_100", "top_speed", "range_km", "price_from"]
│   │
│   └── test-drive-cta (tut/components/cta-banner)
│       title: "Ready to Experience TUT?"
│       ctaText: "Book a Test Drive"
│       ctaLink: .../about/contact
│
└── footer-xf
```

---

### 6.3 Individual Model Page (`models/sovereign`, etc.)

Each of the 5 model pages follows this template:

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero (tut/components/hero-banner)
│   │   title: "{Model Name}"
│   │   subtitle: "{Model tagline}"
│   │   fileReference: dam.tut.en.models.{model}-hero.jpg
│   │   ctaText: "Configure Yours"
│   │
│   ├── product-intro (container)
│   │   ├── title — "{Model Name}", h1, overline: "{Segment}"
│   │   ├── text — intro paragraph
│   │   └── product-card (tut/components/product-card)
│   │       sku: "TUT-{MODEL}-2026"
│   │       showPrice: true, showSpecs: true
│   │
│   ├── gallery (tut/components/gallery)
│   │   columns: 3, enableLightbox: true
│   │   ├── image-1 (tut/components/image) — exterior front
│   │   ├── image-2 (tut/components/image) — exterior rear
│   │   ├── image-3 (tut/components/image) — interior dashboard
│   │   ├── image-4 (tut/components/image) — interior rear seats
│   │   ├── image-5 (tut/components/image) — detail shot
│   │   └── image-6 (tut/components/image) — in motion
│   │
│   ├── highlights (tut/components/tabs)
│   │   ├── tab-design (container, tabLabel: "Design")
│   │   │   ├── text — design philosophy paragraph
│   │   │   └── image — design detail shot
│   │   ├── tab-performance (container, tabLabel: "Performance")
│   │   │   ├── text — performance description
│   │   │   └── spec-table (tut/components/spec-table)
│   │   │       title: "Performance", specs: [{label:"Power", value:"...", unit:"hp"}, ...]
│   │   └── tab-technology (container, tabLabel: "Technology")
│   │       ├── text — tech description
│   │       └── feature-grid (3 feature-items)
│   │
│   ├── specs (tut/components/spec-table)
│   │   title: "Full Specifications"
│   │   specs: [engine, power, torque, 0-100, top_speed, weight, length, width, boot_capacity, ...]
│   │
│   └── related-models (container)
│       ├── title — "Explore Other Models"
│       └── teaser-list — source: manual, manualItems: [other 4 models], columns: 4
│
└── footer-xf
```

**Components per model page: ~25** (with gallery images and tab children).

---

### 6.4 Innovation Section Pages

#### Innovation Hub (`innovation`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero — "Driving the Future"
│   ├── intro-text (text) — overview paragraph
│   ├── innovation-cards (teaser-list)
│   │   source: children, parentPath: .../innovation, columns: 3
│   └── cta-banner — "See It In Action" → link to models
└── footer-xf
```

#### Performance Engineering (`innovation/performance`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero — "Performance Engineering"
│   ├── text — intro
│   ├── feature-grid (4 items: Twin-Turbo, Active Aero, Torque Vectoring, Carbon Ceramic Brakes)
│   ├── video — engine test footage
│   ├── spec-table — performance benchmarks
│   └── cta-banner — "Experience the Power" → models
└── footer-xf
```

#### Electrification (`innovation/electrification`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero — "The Electric Future"
│   ├── text — intro
│   ├── feature-grid (4 items: 800V Architecture, Solid-State Battery, Ultra-Fast Charging, Regenerative Braking)
│   ├── image — Lumina charging station
│   ├── accordion — FAQ (range anxiety, charging times, battery warranty, ...)
│   └── cta-banner — "Discover TUT Lumina" → models/lumina
└── footer-xf
```

#### Autonomous Driving (`innovation/autonomous`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero — "Autonomous Driving"
│   ├── text — intro
│   ├── feature-grid (3 items: LiDAR Fusion, Highway Pilot, Valet Parking)
│   ├── video — autonomous demo
│   ├── text — regulatory status per market (market-specific content!)
│   └── cta-banner
└── footer-xf
```

---

### 6.5 Safety Section Pages

#### Safety Hub (`safety`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero — "Safety Without Compromise"
│   ├── text — intro
│   ├── feature-grid (4 items: 5-Star Euro NCAP, Pre-Collision, Night Vision, Occupant Cell)
│   ├── teaser-list — children of /safety, columns: 2
│   └── quote — industry expert on TUT safety
└── footer-xf
```

#### Active Safety Systems (`safety/active-systems`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero — "Active Safety Systems"
│   ├── text — intro
│   ├── feature-grid (6 items: Adaptive Cruise Control, Lane Keep Assist, Blind Spot Monitor, AEB, Cross-Traffic Alert, Driver Attention Monitor)
│   ├── video — active safety demo
│   └── cta-banner — "Configure Your Safety Package"
└── footer-xf
```

#### Crash Protection (`safety/crash-protection`)

```
page
├── header-xf
├── root (container)
│   ├── breadcrumb
│   ├── hero — "Crash Protection"
│   ├── text — intro
│   ├── feature-grid (4 items: Reinforced Cage, 10 Airbags, Crumple Zones, Pedestrian Protection)
│   ├── image — crash test photo
│   ├── spec-table — crash test ratings per model
│   └── cta-banner
└── footer-xf
```

---

### 6.6 About Section Pages

#### About TUT (`about`)
```
page → header-xf, breadcrumb, hero("About TUT"), text(brand story), carousel(heritage images), teaser-list(children of /about), cta-banner, footer-xf
```

#### Heritage (`about/heritage`)
```
page → header-xf, breadcrumb, hero("Heritage & History"), text(founding story), carousel(timeline images), accordion(decade-by-decade history), quote(founder quote), footer-xf
```

#### Sustainability (`about/sustainability`)
```
page → header-xf, breadcrumb, hero("Sustainability"), text(commitment), feature-grid(4 items: Carbon Neutral 2030, Recycled Materials, Renewable Energy, Green Supply Chain), image(factory solar panels), cta-banner, footer-xf
```

#### Careers (`about/careers`)
```
page → header-xf, breadcrumb, hero("Join TUT"), text(culture), feature-grid(3 items: Engineering, Design, Corporate), teaser-list(manual: featured positions), cta-banner("View Open Positions"), footer-xf
```

#### Contact Us (`about/contact`)
```
page → header-xf, breadcrumb, title("Contact Us"), text(intro), dealer-locator(country-specific dealers), contact-form, footer-xf
```

---

### 6.7 Legal Pages

All three legal pages (`legal/privacy`, `legal/terms`, `legal/cookies`) follow the same simple structure:
```
page → header-xf, breadcrumb, title, text (long-form legal content), footer-xf
```

These are **market-specific** — e.g., DE requires Impressum, FR requires "Mentions Legales".

---

### 6.8 Component Reuse Matrix

Shows which components appear on which page types:

| Component | Home | Models Overview | Model Detail | Innovation Pages | Safety Pages | About Pages | Legal | Contact |
|-----------|:----:|:--------------:|:------------:|:----------------:|:------------:|:-----------:|:-----:|:-------:|
| hero-banner | X | X | X | X | X | X | | |
| breadcrumb | | X | X | X | X | X | X | X |
| title | X | | X | X | X | X | X | X |
| text | | | X | X | X | X | X | X |
| image | | | X | X | X | X | | |
| teaser-list | X | X | X | X | X | X | | |
| carousel | | | | | | X | | |
| tabs | | | X | | | | | |
| accordion | | | | X | | X | | |
| video | X | | | X | X | | | |
| spec-table | | | X | X | X | | | |
| comparison-table | | X | | | | | | |
| feature-grid | X | | X | X | X | X | | |
| cta-banner | X | X | X | X | X | X | | |
| quote | X | | | | X | X | | |
| gallery | | | X | | | | | |
| contact-form | | | | | | | | X |
| dealer-locator | | | | | | | | X |
| product-card | | | X | | | | | |
| XF header | X | X | X | X | X | X | X | X |
| XF footer | X | X | X | X | X | X | X | X |

---

## 7. Content Localization

### 7.1 Translation Strategy

All content is authored in **English (GB)** as the master language. Other markets translate from English with market-specific adaptations:

| Content Element | GB (en) | DE (de) | FR (fr) | CA (en) | CA (fr) |
|----------------|---------|---------|---------|---------|---------|
| Page titles | Original | Translated | Translated | Same as GB | Translated from CA-en |
| Hero text | Original | Translated | Translated | Adapted (spellings) | Translated |
| Legal pages | UK law | German law (Impressum) | French law (Mentions Legales) | Canadian law (bilingual) | Canadian law (bilingual) |
| Dealer data | UK dealers | German dealers | French dealers | Canadian dealers | Canadian dealers |
| Navigation | Original | Translated labels | Translated labels | Adapted | Translated labels |
| Pricing | GBP | EUR | EUR | CAD | CAD |
| Model names | Same globally (TUT Sovereign, Veloce, Atlas, Lumina, Regale) ||||

### 7.2 Market-Specific Content Differences

| Market | Unique Content |
|--------|---------------|
| **GB** | Right-hand drive mention, GBP pricing, DVLA references, UK dealer list |
| **DE** | Impressum page (legal requirement), TUV certifications, Autobahn no-speed-limit references, EUR pricing |
| **FR** | Mentions Legales, French safety certifications, EUR pricing |
| **CA** | Bilingual legal requirement, CAD pricing, Transport Canada certifications, both metric and imperial units |

---

## 8. PIM — Product Catalog

### 8.1 Product Schema

**Schema name:** `luxury-vehicle`
**Version:** `2026`

```json
{
  "type": "object",
  "properties": {
    "model_name": {"type": "string", "description": "Full model name"},
    "segment": {"type": "string", "enum": ["Luxury Sedan", "Grand Tourer", "Luxury SUV", "Electric", "Executive Sedan"]},
    "tagline": {"type": "string"},
    "body_type": {"type": "string", "enum": ["Sedan", "Coupe", "SUV", "Shooting Brake"]},
    "engine_type": {"type": "string", "enum": ["V8 Twin-Turbo", "V6 Twin-Turbo", "V12", "Electric", "Hybrid"]},
    "displacement_cc": {"type": "integer"},
    "power_hp": {"type": "integer"},
    "power_kw": {"type": "integer"},
    "torque_nm": {"type": "integer"},
    "acceleration_0_100": {"type": "number", "description": "Seconds"},
    "top_speed_kmh": {"type": "integer"},
    "range_km": {"type": "integer", "description": "EV range or fuel range"},
    "fuel_consumption_l100km": {"type": "number"},
    "co2_gkm": {"type": "integer"},
    "drivetrain": {"type": "string", "enum": ["RWD", "AWD"]},
    "transmission": {"type": "string"},
    "weight_kg": {"type": "integer"},
    "length_mm": {"type": "integer"},
    "width_mm": {"type": "integer"},
    "height_mm": {"type": "integer"},
    "wheelbase_mm": {"type": "integer"},
    "boot_capacity_l": {"type": "integer"},
    "seating": {"type": "integer"},
    "doors": {"type": "integer"},
    "price_gbp": {"type": "integer"},
    "price_eur": {"type": "integer"},
    "price_cad": {"type": "integer"},
    "euro_ncap_stars": {"type": "integer"},
    "key_features": {"type": "array", "items": {"type": "string"}},
    "available_colors": {"type": "array", "items": {"type": "string"}},
    "hero_image_dam_path": {"type": "string"},
    "gallery_dam_paths": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["model_name", "segment", "body_type", "engine_type", "power_hp", "price_gbp"]
}
```

**Attribute Groups** (for admin UI form layout):
1. **General** — model_name, segment, tagline, body_type
2. **Powertrain** — engine_type, displacement_cc, power_hp, power_kw, torque_nm, drivetrain, transmission
3. **Performance** — acceleration_0_100, top_speed_kmh, range_km, fuel_consumption_l100km, co2_gkm
4. **Dimensions** — weight_kg, length_mm, width_mm, height_mm, wheelbase_mm, boot_capacity_l, seating, doors
5. **Pricing** — price_gbp, price_eur, price_cad
6. **Safety & Ratings** — euro_ncap_stars, key_features
7. **Visuals** — available_colors, hero_image_dam_path, gallery_dam_paths

### 8.2 Catalog

| Field | Value |
|-------|-------|
| **name** | TUT 2026 Collection |
| **year** | 2026 |
| **season** | Annual |
| **description** | Complete TUT luxury vehicle range for 2026 model year |
| **status** | PUBLISHED |

### 8.3 Products (5 vehicles)

#### TUT Sovereign

| Attribute | Value |
|-----------|-------|
| **SKU** | `TUT-SOVEREIGN-2026` |
| model_name | TUT Sovereign |
| segment | Luxury Sedan |
| tagline | "The Pinnacle of Luxury" |
| body_type | Sedan |
| engine_type | V8 Twin-Turbo |
| displacement_cc | 3996 |
| power_hp | 530 |
| power_kw | 390 |
| torque_nm | 750 |
| acceleration_0_100 | 4.1 |
| top_speed_kmh | 270 |
| range_km | 750 |
| fuel_consumption_l100km | 10.8 |
| co2_gkm | 245 |
| drivetrain | AWD |
| transmission | 9-speed automatic |
| weight_kg | 2150 |
| length_mm | 5200 |
| width_mm | 1950 |
| height_mm | 1490 |
| wheelbase_mm | 3100 |
| boot_capacity_l | 520 |
| seating | 5 |
| doors | 4 |
| price_gbp | 125000 |
| price_eur | 145000 |
| price_cad | 215000 |
| euro_ncap_stars | 5 |
| key_features | Air suspension, Rear-seat entertainment, Night vision, Massage seats, Head-up display |
| available_colors | Obsidian Black, Arctic White, Sovereign Blue, British Racing Green, Burgundy Wine |

#### TUT Veloce

| Attribute | Value |
|-----------|-------|
| **SKU** | `TUT-VELOCE-2026` |
| model_name | TUT Veloce |
| segment | Grand Tourer |
| tagline | "Born to Perform" |
| body_type | Coupe |
| engine_type | V12 |
| displacement_cc | 5998 |
| power_hp | 710 |
| power_kw | 522 |
| torque_nm | 900 |
| acceleration_0_100 | 3.2 |
| top_speed_kmh | 320 |
| range_km | 600 |
| fuel_consumption_l100km | 14.2 |
| co2_gkm | 322 |
| drivetrain | RWD |
| transmission | 7-speed dual-clutch |
| weight_kg | 1780 |
| length_mm | 4700 |
| width_mm | 2000 |
| height_mm | 1340 |
| wheelbase_mm | 2750 |
| boot_capacity_l | 280 |
| seating | 2 |
| doors | 2 |
| price_gbp | 195000 |
| price_eur | 225000 |
| price_cad | 335000 |
| euro_ncap_stars | 5 |
| key_features | Carbon ceramic brakes, Active aerodynamics, Launch control, Track mode, Carbon fibre roof |
| available_colors | Veloce Red, Titanium Silver, Carbon Black, Pearl White, Racing Yellow |

#### TUT Atlas

| Attribute | Value |
|-----------|-------|
| **SKU** | `TUT-ATLAS-2026` |
| model_name | TUT Atlas |
| segment | Luxury SUV |
| tagline | "Command Every Road" |
| body_type | SUV |
| engine_type | V8 Twin-Turbo |
| displacement_cc | 3996 |
| power_hp | 550 |
| power_kw | 405 |
| torque_nm | 770 |
| acceleration_0_100 | 4.5 |
| top_speed_kmh | 260 |
| range_km | 680 |
| fuel_consumption_l100km | 12.5 |
| co2_gkm | 283 |
| drivetrain | AWD |
| transmission | 9-speed automatic |
| weight_kg | 2480 |
| length_mm | 5100 |
| width_mm | 2020 |
| height_mm | 1750 |
| wheelbase_mm | 3050 |
| boot_capacity_l | 650 |
| seating | 7 |
| doors | 5 |
| price_gbp | 145000 |
| price_eur | 168000 |
| price_cad | 245000 |
| euro_ncap_stars | 5 |
| key_features | Terrain response system, Air suspension, Third-row seating, Towing package, Panoramic roof |
| available_colors | Atlas Grey, Summit White, Deep Ocean Blue, Forest Green, Sahara Gold |

#### TUT Lumina

| Attribute | Value |
|-----------|-------|
| **SKU** | `TUT-LUMINA-2026` |
| model_name | TUT Lumina |
| segment | Electric |
| tagline | "The Electric Future, Today" |
| body_type | Sedan |
| engine_type | Electric |
| displacement_cc | 0 |
| power_hp | 680 |
| power_kw | 500 |
| torque_nm | 850 |
| acceleration_0_100 | 2.9 |
| top_speed_kmh | 260 |
| range_km | 620 |
| fuel_consumption_l100km | 0 |
| co2_gkm | 0 |
| drivetrain | AWD |
| transmission | Single-speed direct drive |
| weight_kg | 2350 |
| length_mm | 5000 |
| width_mm | 1960 |
| height_mm | 1460 |
| wheelbase_mm | 3000 |
| boot_capacity_l | 480 |
| seating | 5 |
| doors | 4 |
| price_gbp | 135000 |
| price_eur | 155000 |
| price_cad | 225000 |
| euro_ncap_stars | 5 |
| key_features | 800V architecture, Ultra-fast charging (10-80% in 18min), Solid-state battery, Over-the-air updates, Autonomous Level 3 |
| available_colors | Lumina White, Electric Blue, Moonlight Silver, Aurora Green, Cosmic Black |

#### TUT Regale

| Attribute | Value |
|-----------|-------|
| **SKU** | `TUT-REGALE-2026` |
| model_name | TUT Regale |
| segment | Executive Sedan |
| tagline | "Executive Excellence" |
| body_type | Sedan |
| engine_type | V6 Twin-Turbo |
| displacement_cc | 2996 |
| power_hp | 420 |
| power_kw | 309 |
| torque_nm | 600 |
| acceleration_0_100 | 4.8 |
| top_speed_kmh | 250 |
| range_km | 820 |
| fuel_consumption_l100km | 9.2 |
| co2_gkm | 209 |
| drivetrain | AWD |
| transmission | 9-speed automatic |
| weight_kg | 1950 |
| length_mm | 4900 |
| width_mm | 1900 |
| height_mm | 1470 |
| wheelbase_mm | 2950 |
| boot_capacity_l | 500 |
| seating | 5 |
| doors | 4 |
| price_gbp | 85000 |
| price_eur | 98000 |
| price_cad | 145000 |
| euro_ncap_stars | 5 |
| key_features | Matrix LED headlights, Adaptive damping, Wireless CarPlay/Android Auto, Premium Harman Kardon audio, 4-zone climate |
| available_colors | Regale Silver, Executive Black, Navy Blue, Champagne Gold, Glacier White |

### 8.4 Product Variants

Each product has trim-level variants:

| Variant Pattern | Variants per Model |
|----------------|-------------------|
| **Sovereign** | Sovereign, Sovereign S (sport), Sovereign L (long wheelbase) |
| **Veloce** | Veloce, Veloce S (track pack), Veloce Roadster (convertible) |
| **Atlas** | Atlas, Atlas Sport, Atlas Extended (7-seat) |
| **Lumina** | Lumina, Lumina Performance, Lumina Range+ (extended battery) |
| **Regale** | Regale, Regale Sport, Regale Business (fleet spec) |

Each variant adjusts: power_hp, price, weight_kg, acceleration_0_100, and key_features.

---

## 9. DAM — Digital Assets

### 9.1 Asset Folder Structure

```
dam.tut                                         # TUT shared asset root
├── dam.tut.brand                               # Brand assets
│   ├── tut-logo-dark.svg
│   ├── tut-logo-light.svg
│   └── brand-film.mp4
├── dam.tut.models                              # Per-model assets
│   ├── dam.tut.models.sovereign
│   │   ├── sovereign-hero.jpg                  # Hero banner (3840x2160)
│   │   ├── sovereign-exterior-front.jpg        # Gallery
│   │   ├── sovereign-exterior-rear.jpg
│   │   ├── sovereign-interior-dashboard.jpg
│   │   ├── sovereign-interior-rear.jpg
│   │   ├── sovereign-detail-grille.jpg
│   │   ├── sovereign-in-motion.jpg
│   │   └── sovereign-thumbnail.jpg             # Card thumbnail (800x600)
│   ├── dam.tut.models.veloce
│   │   └── (same 8 assets per model)
│   ├── dam.tut.models.atlas
│   ├── dam.tut.models.lumina
│   └── dam.tut.models.regale
├── dam.tut.innovation
│   ├── performance-hero.jpg
│   ├── electrification-hero.jpg
│   ├── autonomous-hero.jpg
│   ├── engine-test-video.mp4
│   ├── autonomous-demo-video.mp4
│   └── charging-station.jpg
├── dam.tut.safety
│   ├── safety-hero.jpg
│   ├── active-safety-hero.jpg
│   ├── crash-protection-hero.jpg
│   ├── crash-test-photo.jpg
│   └── safety-demo-video.mp4
├── dam.tut.about
│   ├── about-hero.jpg
│   ├── heritage-hero.jpg
│   ├── sustainability-hero.jpg
│   ├── careers-hero.jpg
│   ├── factory-solar.jpg
│   ├── heritage-1950s.jpg
│   ├── heritage-1970s.jpg
│   ├── heritage-1990s.jpg
│   └── heritage-2020s.jpg
└── dam.tut.homepage
    ├── home-hero-gb.jpg
    ├── home-hero-de.jpg
    ├── home-hero-fr.jpg
    ├── home-hero-ca.jpg
    └── brand-film-poster.jpg
```

### 9.2 Asset Count

| Category | Count |
|----------|-------|
| Brand assets | 3 |
| Model assets (8 per model x 5) | 40 |
| Innovation assets | 6 |
| Safety assets | 5 |
| About assets | 9 |
| Homepage assets | 5 |
| **Total** | **68** |

All image assets should be created as placeholder content nodes with JSONB properties containing `mimeType`, `width`, `height`, `fileSize` — the actual binary files would be uploaded to MinIO separately.

---

## 10. Node Count Summary

| Category | Count |
|----------|-------|
| Site root + language root nodes (ancestry) | 4 sites x ~3 ancestors = ~15 |
| Content pages (all markets + languages) | 100 |
| Experience Fragment nodes (XFs + variations + ancestry) | ~75 |
| Component nodes embedded in page properties | (stored as JSONB, not separate nodes) |
| DAM asset nodes | 68 |
| PIM products | 5 |
| PIM product variants | 15 |
| PIM catalog | 1 |
| PIM schema | 1 |
| Component definitions | 29 |
| **Total content_nodes rows** | **~258** |
| **Total PIM rows** | **~22** |

---

## 11. Implementation Notes for Developer Agent

### 11.1 SQL File Order

Generate the following SQL files, to be run in order:

| File | Contents |
|------|----------|
| `01_tut_sites_components.sql` | Sites table inserts + component_definitions inserts |
| `02_tut_experience_fragments.sql` | All XF ancestor nodes, XF folder nodes, XF variation nodes with navigation/footer components |
| `03_tut_dam_assets.sql` | DAM folder ancestry + asset content nodes |
| `04_tut_gb_pages.sql` | All tut-gb/en content pages with full component trees in JSONB |
| `05_tut_de_pages.sql` | All tut-de/de content pages (German translations) |
| `06_tut_fr_pages.sql` | All tut-fr/fr content pages (French translations) |
| `07_tut_ca_pages.sql` | All tut-ca/en and tut-ca/fr content pages |
| `08_tut_pim_schema.sql` | PIM: product schema definition (runs against flexcms_pim DB) |
| `09_tut_pim_catalog_products.sql` | PIM: catalog + 5 products + 15 variants (runs against flexcms_pim DB) |

### 11.2 Key Conventions

1. **Node IDs:** Use `md5('tut-{descriptive-key}')::uuid` for deterministic, idempotent IDs.
2. **Paths:** Dot-separated ltree. Site root is `tut-gb`, language root is `tut-gb.en`, pages below that.
3. **Component trees:** Stored as JSONB in the page node's `properties.components` array (see WKND sample for structure).
4. **XF references:** Pages reference XFs via `flexcms/experience-fragment` component with `fragmentPath` pointing to the XF variation path.
5. **All inserts:** Use `ON CONFLICT (path) DO NOTHING` or `ON CONFLICT DO UPDATE` for idempotency.
6. **Status:** All published content uses `'PUBLISHED'` (not `'LIVE'` — see V13 constraint).
7. **PIM SQL:** Runs against `flexcms_pim` database, not the main `flexcms_author` database.
8. **DAM assets:** Create content_node rows with `resourceType: 'tut/components/image'` and JSONB properties `{mimeType, width, height, fileSize, alt}`. Actual file upload to MinIO is a separate step.
9. **Translations:** Pages across markets share the same structure but different JSONB content. The `locale` column tracks the language. Content should be genuinely translated (use realistic German and French text, not placeholder).
10. **Market-specific pages:** DE gets an extra `impressum` page under legal. FR gets `mentions-legales`. CA legal pages are bilingual-adapted.

### 11.3 Validation Checklist

After data load, verify:

- [ ] All 4 sites visible in admin UI site list
- [ ] Content tree for each site shows correct page hierarchy (20 pages per language)
- [ ] Experience Fragment XFs resolve correctly — header/footer appear on every page
- [ ] Navigation component renders correct market-specific links
- [ ] Model pages show PIM-linked product-card with correct specs
- [ ] DAM assets appear in asset browser with correct folder structure
- [ ] GraphQL `page()` query returns full component tree for any page
- [ ] GraphQL `node()` query returns individual nodes by path
- [ ] PIM `products()` query returns all 5 vehicles with attributes
- [ ] Language navigation works on CA site (switch between en/fr)
- [ ] Comparison table on models overview correctly pulls 5 products
- [ ] Total content_nodes count matches expected (~258)

---

*Document version: 1.0 | Created: 2026-03-26 | Author: Chief Quality Engineer*
