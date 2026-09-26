# TUT Luxury Cars — Test Data Specification

> **Purpose:** This document defines the complete test data set for the FlexCMS platform, covering CMS content, DAM assets, PIM products, experience fragments, and multi-site/multi-language configuration for the fictional luxury car company **TUT**. A developer agent will use this specification to populate the database via the existing Author API, PIM API, and DAM API.

---

## 1. Business Context

**Company:** TUT — a global luxury automobile manufacturer.

**Markets (4 sites, 3 languages):**

| Site ID | Title | Country | Locales | Default Locale | Domain |
|---|---|---|---|---|---|
| `tut-gb` | TUT United Kingdom | Great Britain | `en` | `en` | `www.tut.co.uk` |
| `tut-de` | TUT Deutschland | Germany | `de` | `de` | `www.tut.de` |
| `tut-fr` | TUT France | France | `fr` | `fr` | `www.tut.fr` |
| `tut-ca` | TUT Canada | Canada | `en`, `fr` | `en` | `www.tut.ca` |

**Business goal:** Showcase the latest luxury car models, innovations, safety features, and brand identity across all markets, leveraging CMS content reuse, experience fragments for shared navigation, and PIM for the product catalog.

---

## 2. Component Definitions Required

These components must exist in `component_definitions` before content can be authored. Some already exist from V6 seed data (marked ✅); the rest need to be registered (marked 🆕).

### 2.1 Structural Components (already seeded)

| Resource Type | Title | Container? | Status |
|---|---|---|---|
| `flexcms/page` | Page | No | ✅ Exists |
| `flexcms/container` | Layout Container | Yes | ✅ Exists |
| `flexcms/site-root` | Site Root | No | ✅ Exists |
| `flexcms/shared-header` | Header | No | ✅ Exists |
| `flexcms/shared-footer` | Footer | No | ✅ Exists |
| `flexcms/rich-text` | Rich Text | No | ✅ Exists |
| `flexcms/image` | Image | No | ✅ Exists |
| `flexcms/xf-folder` | Experience Fragment | No | ✅ Exists (V12) |
| `flexcms/xf-page` | XF Variation | Yes | ✅ Exists (V12) |
| `flexcms/experience-fragment` | XF Reference | No | ✅ Exists (V12) |

### 2.2 New Component Definitions to Register

Each component below must be inserted into `component_definitions` via the API or migration. The `data_schema` column defines the JSONB properties each component expects.

| # | Resource Type | Title | Group | Container? | Description |
|---|---|---|---|---|---|
| 1 | `tut/hero-banner` | Hero Banner | Marketing | No | Full-width hero with background image, headline, subtitle, and CTA button. Used on landing pages. |
| 2 | `tut/text-image` | Text + Image | Content | No | Side-by-side layout: rich text on one side, image on the other. Configurable alignment (image-left / image-right). |
| 3 | `tut/card-grid` | Card Grid | Content | Yes | Grid of cards (2, 3, or 4 columns). Children are `tut/card` components. |
| 4 | `tut/card` | Card | Content | No | Single card: image, title, description, optional CTA link. Used inside `tut/card-grid`. |
| 5 | `tut/product-teaser` | Product Teaser | Commerce | No | Displays a PIM product by SKU. Shows hero image, name, tagline, specs summary, and link to detail page. |
| 6 | `tut/product-specs` | Product Specifications | Commerce | No | Full spec table for a product. Reads attributes from PIM by SKU. |
| 7 | `tut/gallery` | Image Gallery | Media | No | Carousel/grid of DAM images. Used on product detail pages. |
| 8 | `tut/cta-banner` | CTA Banner | Marketing | No | Coloured banner with headline, body text, and CTA button. For cross-selling or newsletter sign-up. |
| 9 | `tut/accordion` | Accordion / FAQ | Content | Yes | Expandable sections. Children are `tut/accordion-item`. |
| 10 | `tut/accordion-item` | Accordion Item | Content | No | Single collapsible item: title + rich text body. |
| 11 | `tut/video-embed` | Video Embed | Media | No | Embedded video player (YouTube/Vimeo URL or DAM video). |
| 12 | `tut/navigation` | Navigation Menu | Navigation | No | Site navigation component. Reads page tree to build menu. Used inside XF header. |
| 13 | `tut/breadcrumb` | Breadcrumb | Navigation | No | Auto-generated breadcrumb from content tree path. |
| 14 | `tut/footer-links` | Footer Links | Navigation | No | Multi-column footer link groups. Used inside XF footer. |
| 15 | `tut/language-selector` | Language Selector | Navigation | No | Locale switcher showing available languages for the current site. |
| 16 | `tut/stat-counter` | Stat Counter | Marketing | No | Animated number counter (e.g. "500+ HP", "0–100 in 3.2s"). |
| 17 | `tut/testimonial` | Testimonial | Content | No | Customer/press quote with attribution. |
| 18 | `tut/model-comparison` | Model Comparison | Commerce | No | Side-by-side comparison table for 2–3 car models (by SKU). |

### 2.3 Component JSONB Property Schemas

#### `tut/hero-banner`
```json
{
  "title": "string (required) — headline text",
  "subtitle": "string — subheading rich text",
  "backgroundImage": "string (required) — DAM asset path",
  "ctaLabel": "string — button text",
  "ctaLink": "string — internal content path or URL",
  "theme": "enum: light | dark | gradient (default: dark)",
  "height": "enum: medium | full (default: full)",
  "overlayOpacity": "number 0–1 (default: 0.4)"
}
```

#### `tut/text-image`
```json
{
  "title": "string — section heading",
  "text": "string (required) — rich text HTML",
  "image": "string (required) — DAM asset path",
  "imageAlt": "string — alt text",
  "imagePosition": "enum: left | right (default: right)",
  "theme": "enum: light | dark (default: light)"
}
```

#### `tut/card`
```json
{
  "image": "string — DAM asset path",
  "title": "string (required)",
  "description": "string — short text",
  "ctaLabel": "string",
  "ctaLink": "string — internal path or URL"
}
```

#### `tut/card-grid`
```json
{
  "columns": "number 2|3|4 (default: 3)",
  "title": "string — optional section heading"
}
```

#### `tut/product-teaser`
```json
{
  "productSku": "string (required) — PIM product SKU",
  "displayMode": "enum: hero | compact | card (default: card)",
  "showPrice": "boolean (default: false)",
  "ctaLabel": "string (default: 'Discover')",
  "ctaLink": "string — link to product detail page"
}
```

#### `tut/product-specs`
```json
{
  "productSku": "string (required) — PIM product SKU",
  "highlightedSpecs": "string[] — attribute keys to feature prominently"
}
```

#### `tut/gallery`
```json
{
  "images": "string[] — array of DAM asset paths",
  "layout": "enum: carousel | grid (default: carousel)",
  "columns": "number 2|3|4 (default: 3, for grid only)"
}
```

#### `tut/cta-banner`
```json
{
  "title": "string (required)",
  "text": "string — body text",
  "ctaLabel": "string (required)",
  "ctaLink": "string (required)",
  "theme": "enum: primary | dark | accent (default: primary)"
}
```

#### `tut/accordion-item`
```json
{
  "title": "string (required) — question / heading",
  "body": "string (required) — rich text answer / content"
}
```

#### `tut/video-embed`
```json
{
  "videoUrl": "string — YouTube / Vimeo URL",
  "damVideo": "string — or DAM asset path",
  "posterImage": "string — DAM asset path for poster",
  "autoplay": "boolean (default: false)",
  "title": "string — accessible title"
}
```

#### `tut/navigation`
```json
{
  "rootPath": "string — content tree root to build menu from",
  "depth": "number 1–3 (default: 2)",
  "brandLogo": "string — DAM asset path",
  "brandName": "string (default: 'TUT')",
  "showLanguageSelector": "boolean (default: true)"
}
```

#### `tut/footer-links`
```json
{
  "columns": [
    {
      "heading": "string",
      "links": [{ "label": "string", "url": "string" }]
    }
  ],
  "copyrightText": "string",
  "socialLinks": [{ "platform": "string", "url": "string" }]
}
```

#### `tut/stat-counter`
```json
{
  "value": "string (required) — e.g. '500+'",
  "unit": "string — e.g. 'HP'",
  "label": "string — e.g. 'Horsepower'"
}
```

#### `tut/testimonial`
```json
{
  "quote": "string (required) — the quote text",
  "author": "string — attribution name",
  "source": "string — e.g. 'Top Gear Magazine'",
  "image": "string — DAM path for author/source logo"
}
```

#### `tut/model-comparison`
```json
{
  "productSkus": "string[] (required, 2–3 items) — PIM SKUs to compare",
  "compareAttributes": "string[] — attribute keys to show in comparison"
}
```

---

## 3. DAM Asset Plan

All images from `Design/assets/` must be uploaded into the DAM before content authoring.

### 3.1 DAM Folder Structure

```
/dam/tut/
├── shared/                        # Cross-site shared assets
│   ├── brand/
│   │   └── tut-logo.png           # (use z-image-turbo_00001_.png)
│   ├── banners/
│   │   ├── hero-home.png          # (use banner/Flux2-Klein_00001_.png)
│   │   ├── hero-models.png        # (use banner/Flux2-Klein_00002_.png)
│   │   ├── hero-innovation.png    # (use banner/Flux2-Klein_00005_.png)
│   │   ├── hero-safety.png        # (use banner/openart-image_1774524665435_8ee570b7_1774524666604_bccc0b4c.png)
│   │   ├── hero-about.png         # (use banner/openart-image_1774524670799_60639cbb_1774524671922_18d47bfd.png)
│   │   ├── hero-heritage.png      # (use banner/openart-image_1774524671714_bb094f70_1774524672752_2a5d0d5e.png)
│   │   └── cta-test-drive.png     # (use banner/openart-image_1774524675992_c9e45a26_1774524677335_26fd5455.png)
│   ├── models/
│   │   ├── tut-sovereign.png      # (use 1024x1024/z-image-turbo1_00001_.png)
│   │   ├── tut-sovereign-2.png    # (use 1024x1024/z-image-turbo1_00002_.png)
│   │   ├── tut-sovereign-3.png    # (use 1024x1024/z-image-turbo1_00003_.png)
│   │   ├── tut-vanguard.png       # (use 1024x1024/z-image-turbo2_00001_.png)
│   │   ├── tut-vanguard-2.png     # (use 1024x1024/z-image-turbo2_00002_.png)
│   │   ├── tut-vanguard-3.png     # (use 1024x1024/z-image-turbo2_00003_.png)
│   │   ├── tut-eclipse.png        # (use 1024x1024/z-image-turbo3_00001_.png)
│   │   ├── tut-eclipse-2.png      # (use 1024x1024/z-image-turbo3_00002_.png)
│   │   ├── tut-eclipse-3.png      # (use 1024x1024/z-image-turbo3_00003_.png)
│   │   ├── tut-apex.png           # (use 1024x1024/z-image-turbo4_00001_.png)
│   │   ├── tut-apex-2.png         # (use 1024x1024/z-image-turbo4_00002_.png)
│   │   └── tut-apex-3.png         # (use 1024x1024/z-image-turbo4_00003_.png)
│   ├── features/
│   │   ├── innovation-engine.png  # (use 1024x1024/Flux2-Klein_00002_.png)
│   │   ├── innovation-aero.png    # (use 1024x1024/Flux2-Klein_00003_.png)
│   │   ├── innovation-ai.png      # (use 1024x1024/Flux2-Klein_00004_.png)
│   │   ├── safety-shield.png      # (use 1024x1024/Flux2-Klein_00005_.png)
│   │   ├── safety-night.png       # (use 1024x1024/Flux2-Klein_00006_.png)
│   │   ├── safety-assist.png      # (use 1024x1024/Flux2-Klein_00007_.png)
│   │   ├── interior-cockpit.png   # (use 1024x1024/Flux2-Klein_00008_.png)
│   │   ├── interior-materials.png # (use 1024x1024/Flux2-Klein_203003_.png)
│   │   └── sustainability.png     # (use 1024x1024/Flux2-Klein_203004_.png)
│   └── lifestyle/
│       ├── driving-experience.png # (use 1024x1024/z-image-turbo_00003_.png)
│       ├── concierge.png          # (use 1024x1024/z-image-turbo_00004_.png)
│       ├── heritage-1.png         # (use 1024x1024/z-image-turbo_00005_.png)
│       ├── heritage-2.png         # (use 1024x1024/z-image-turbo_00006_.png)
│       └── craftsmanship.png      # (use 1024x1024/z-image-turbo_00007_.png)
```

### 3.2 Asset Upload Instructions

For each file listed above:
1. Read the source file from `Design/assets/banner/` or `Design/assets/1024x1024/`
2. Upload via `POST /api/author/assets` with `path`, `siteId=tut-gb` (shared assets use any site), `userId=admin`
3. The DAM will auto-generate renditions (thumbnail, web-small, web-medium, web-large, hero-desktop, hero-mobile)

---

## 4. PIM Product Catalog

### 4.1 Product Schema

**Schema name:** `Luxury Vehicle v2026`

**Attribute groups:**

| Group | Attributes |
|---|---|
| **General** | `name` (text, required), `tagline` (text), `description` (rich text), `bodyStyle` (enum: Sedan, SUV, Coupé, Convertible, GT), `year` (number) |
| **Performance** | `engineType` (enum: V8 Petrol, V12 Petrol, Hybrid, Full Electric), `horsepower` (number), `torque` (text), `acceleration0to100` (text), `topSpeed` (text), `transmission` (text) |
| **Design** | `exteriorColors` (text[]), `interiorMaterials` (text), `wheelSize` (text), `length` (text), `width` (text), `weight` (text) |
| **Technology** | `infotainment` (text), `driverAssist` (text[]), `connectivity` (text[]) |
| **Pricing** | `basePrice_GBP` (number), `basePrice_EUR` (number), `basePrice_CAD` (number) |

### 4.2 Catalog

| Field | Value |
|---|---|
| **Name** | TUT 2026 Model Lineup |
| **Year** | 2026 |
| **Season** | Full Year |
| **Status** | ACTIVE |

### 4.3 Products (4 Car Models)

#### Product 1: TUT Sovereign (Flagship Sedan)

| Attribute | Value |
|---|---|
| **SKU** | `TUT-SOVEREIGN-2026` |
| **Name** | TUT Sovereign |
| **Tagline** | The art of arrival |
| **Body Style** | Sedan |
| **Year** | 2026 |
| **Description** | The Sovereign represents the pinnacle of luxury motoring. Hand-crafted in our Oxfordshire atelier, every detail is meticulously engineered for those who demand nothing less than perfection. |
| **Engine Type** | V12 Petrol |
| **Horsepower** | 600 |
| **Torque** | 900 Nm |
| **0–100 km/h** | 3.8s |
| **Top Speed** | 310 km/h |
| **Transmission** | 8-speed automatic |
| **Exterior Colors** | British Racing Green, Midnight Sapphire, Pearl White, Obsidian Black |
| **Interior** | Hand-stitched Nappa leather, open-pore walnut veneer |
| **Wheels** | 21" forged alloy |
| **Length** | 5,395 mm |
| **Width** | 1,950 mm |
| **Weight** | 2,340 kg |
| **Infotainment** | 12.3" OLED touchscreen, 18-speaker Meridian surround |
| **Driver Assist** | Adaptive cruise, lane keep, night vision, 360° camera |
| **Connectivity** | 5G, wireless CarPlay/Android Auto, OTA updates |
| **Price GBP** | £285,000 |
| **Price EUR** | €325,000 |
| **Price CAD** | $420,000 |
| **DAM Assets** | `/dam/tut/shared/models/tut-sovereign.png` (hero), `tut-sovereign-2.png` (gallery), `tut-sovereign-3.png` (gallery) |

#### Product 2: TUT Vanguard (Performance SUV)

| Attribute | Value |
|---|---|
| **SKU** | `TUT-VANGUARD-2026` |
| **Name** | TUT Vanguard |
| **Tagline** | Command every horizon |
| **Body Style** | SUV |
| **Year** | 2026 |
| **Description** | The Vanguard blends commanding presence with athletic agility. Powered by our twin-turbo V8, it conquers any terrain while cocooning occupants in supreme luxury. |
| **Engine Type** | V8 Petrol |
| **Horsepower** | 550 |
| **Torque** | 770 Nm |
| **0–100 km/h** | 4.2s |
| **Top Speed** | 280 km/h |
| **Transmission** | 8-speed automatic AWD |
| **Exterior Colors** | Glacier White, Volcano Red, Arctic Silver, Forest Green |
| **Interior** | Semi-aniline leather, brushed aluminium trim |
| **Wheels** | 22" diamond-cut alloy |
| **Length** | 5,200 mm |
| **Width** | 2,050 mm |
| **Weight** | 2,680 kg |
| **Infotainment** | Dual 12.3" displays, 20-speaker Bowers & Wilkins |
| **Driver Assist** | Terrain response, adaptive air suspension, trailer assist |
| **Connectivity** | 5G, wireless CarPlay/Android Auto, remote park |
| **Price GBP** | £195,000 |
| **Price EUR** | €225,000 |
| **Price CAD** | $295,000 |
| **DAM Assets** | `/dam/tut/shared/models/tut-vanguard.png` (hero), `tut-vanguard-2.png`, `tut-vanguard-3.png` |

#### Product 3: TUT Eclipse (Electric GT)

| Attribute | Value |
|---|---|
| **SKU** | `TUT-ECLIPSE-2026` |
| **Name** | TUT Eclipse |
| **Tagline** | Silent thunder |
| **Body Style** | GT |
| **Year** | 2026 |
| **Description** | Our first fully electric grand tourer. The Eclipse delivers breathtaking acceleration with zero emissions, proving that sustainability and luxury are not mutually exclusive. |
| **Engine Type** | Full Electric |
| **Horsepower** | 700 |
| **Torque** | 1,100 Nm |
| **0–100 km/h** | 2.9s |
| **Top Speed** | 290 km/h |
| **Transmission** | Single-speed direct drive |
| **Exterior Colors** | Electric Blue, Mercury Silver, Carbon Black |
| **Interior** | Vegan ultra-suede, recycled carbon fibre |
| **Wheels** | 21" aero-optimised alloy |
| **Length** | 4,890 mm |
| **Width** | 1,980 mm |
| **Weight** | 2,250 kg |
| **Infotainment** | 15.6" curved OLED, augmented reality HUD |
| **Driver Assist** | Highway autopilot, auto park, predictive battery management |
| **Connectivity** | 5G, V2X communication, OTA updates, app remote control |
| **Price GBP** | £245,000 |
| **Price EUR** | €280,000 |
| **Price CAD** | $365,000 |
| **DAM Assets** | `/dam/tut/shared/models/tut-eclipse.png` (hero), `tut-eclipse-2.png`, `tut-eclipse-3.png` |

#### Product 4: TUT Apex (Hybrid Coupé)

| Attribute | Value |
|---|---|
| **SKU** | `TUT-APEX-2026` |
| **Name** | TUT Apex |
| **Tagline** | Where passion meets precision |
| **Body Style** | Coupé |
| **Year** | 2026 |
| **Description** | The Apex is a driver's car in the purest sense. Lightweight carbon construction meets plug-in hybrid technology, delivering raw thrills with conscious efficiency. |
| **Engine Type** | Hybrid |
| **Horsepower** | 650 |
| **Torque** | 850 Nm |
| **0–100 km/h** | 3.1s |
| **Top Speed** | 320 km/h |
| **Transmission** | 7-speed dual-clutch |
| **Exterior Colors** | Racing Yellow, Titanium Grey, Deep Burgundy |
| **Interior** | Alcantara sport seats, carbon fibre dash |
| **Wheels** | 20" centre-lock forged |
| **Length** | 4,680 mm |
| **Width** | 1,960 mm |
| **Weight** | 1,780 kg |
| **Infotainment** | 10.25" driver display, 9" centre touchscreen |
| **Driver Assist** | Launch control, track mode, carbon ceramic brakes |
| **Connectivity** | 5G, telemetry data logging, pit-lane timer |
| **Price GBP** | £225,000 |
| **Price EUR** | €260,000 |
| **Price CAD** | $340,000 |
| **DAM Assets** | `/dam/tut/shared/models/tut-apex.png` (hero), `tut-apex-2.png`, `tut-apex-3.png` |

---

## 5. Site Structure & Page Hierarchy

### 5.1 Common Page Tree (per site, per locale)

All 4 sites follow the same page hierarchy. The content tree uses ltree `.` separator. URLs use `/`.

```
content.{siteId}.{locale}/
├── home                          # Landing page               URL: /
├── models/                       # Model lineup hub           URL: /models
│   ├── sovereign                 # Model detail               URL: /models/sovereign
│   ├── vanguard                  # Model detail               URL: /models/vanguard
│   ├── eclipse                   # Model detail               URL: /models/eclipse
│   └── apex                      # Model detail               URL: /models/apex
├── innovation/                   # Innovation hub             URL: /innovation
│   ├── performance               # Performance technology     URL: /innovation/performance
│   ├── electrification           # EV & hybrid tech           URL: /innovation/electrification
│   └── craftsmanship             # Materials & build          URL: /innovation/craftsmanship
├── safety/                       # Safety hub                 URL: /safety
│   ├── driver-assist             # ADAS features              URL: /safety/driver-assist
│   └── structural                # Body & crash safety        URL: /safety/structural
├── about/                        # About hub                  URL: /about
│   ├── heritage                  # Company history            URL: /about/heritage
│   └── sustainability            # Environmental commitment   URL: /about/sustainability
├── contact                       # Contact & dealerships      URL: /contact
└── legal/                        # Legal pages                URL: /legal
    ├── privacy                   # Privacy policy             URL: /legal/privacy
    └── terms                     # Terms & conditions         URL: /legal/terms
```

**Total:** 17 pages × 4 sites × (1 or 2 locales) = **85 page nodes** (GB: 17, DE: 17, FR: 17, CA: 17 en + 17 fr)

### 5.2 Experience Fragments (Shared Navigation)

Experience Fragments allow the same header/footer to be reused across all pages of a site+locale. Each site+locale gets its own XF variations (to allow country-specific menu items), but the structure is shared.

#### XF Folder Structure

```
content.experience-fragments.tut-gb.en/
├── header/                               # XF folder
│   └── master/                           # XF variation (flexcms/xf-page)
│       ├── navigation                    # tut/navigation component
│       └── language-selector             # tut/language-selector
├── footer/
│   └── master/
│       └── footer-links                  # tut/footer-links component

content.experience-fragments.tut-de.de/
├── header/
│   └── master/
│       ├── navigation
│       └── language-selector
├── footer/
│   └── master/
│       └── footer-links

content.experience-fragments.tut-fr.fr/
├── header/ ...
├── footer/ ...

content.experience-fragments.tut-ca.en/
├── header/ ...
├── footer/ ...

content.experience-fragments.tut-ca.fr/
├── header/ ...
├── footer/ ...
```

**Total:** 6 locale contexts × 2 XFs (header + footer) = **12 XF folders, 12 XF variations**

Each page then includes these XFs via `flexcms/experience-fragment` references:
```json
// In each page's header component slot:
{ "resourceType": "flexcms/experience-fragment", "properties": { "fragmentPath": "content.experience-fragments.tut-gb.en.header.master" } }
// In each page's footer component slot:
{ "resourceType": "flexcms/experience-fragment", "properties": { "fragmentPath": "content.experience-fragments.tut-gb.en.footer.master" } }
```

---

## 6. Page Compositions (Component Hierarchy per Page)

Below is the exact component tree for each page type. All pages share the same structure for header/footer via XF references.

### 6.1 Page Wrapper (every page)

```
flexcms/page
├── header → flexcms/experience-fragment (fragmentPath → {site}.{locale}.header.master)
├── breadcrumb → tut/breadcrumb
├── main → flexcms/container
│   └── {page-specific components — see below}
└── footer → flexcms/experience-fragment (fragmentPath → {site}.{locale}.footer.master)
```

### 6.2 Home Page (`home`)

```
main (flexcms/container)
├── hero → tut/hero-banner
│     title: "The New TUT Sovereign" / DE: "Der neue TUT Sovereign" / FR: "Le nouveau TUT Sovereign"
│     subtitle: "Luxury redefined for 2026"
│     backgroundImage: /dam/tut/shared/banners/hero-home.png
│     ctaLabel: "Explore Models" / DE: "Modelle entdecken" / FR: "Découvrir les modèles"
│     ctaLink: → models page
│     theme: dark, height: full
│
├── model-highlights → tut/card-grid (columns: 4, title: "Our Models")
│   ├── card-1 → tut/card
│   │     image: /dam/tut/shared/models/tut-sovereign.png
│   │     title: "Sovereign"
│   │     description: "The art of arrival"
│   │     ctaLink: → models/sovereign
│   ├── card-2 → tut/card (Vanguard)
│   ├── card-3 → tut/card (Eclipse)
│   └── card-4 → tut/card (Apex)
│
├── innovation-section → tut/text-image
│     title: "Innovation Without Compromise"
│     text: "At TUT, we push the boundaries of engineering..."
│     image: /dam/tut/shared/features/innovation-engine.png
│     imagePosition: right
│
├── stats → flexcms/container (layout: three-equal)
│   ├── stat-1 → tut/stat-counter (value: "600+", unit: "HP", label: "Maximum Power")
│   ├── stat-2 → tut/stat-counter (value: "2.9s", unit: "", label: "0-100 km/h")
│   └── stat-3 → tut/stat-counter (value: "75+", unit: "years", label: "Heritage")
│
├── safety-preview → tut/text-image
│     title: "Your Safety, Perfected"
│     text: "Every TUT is engineered with our proprietary SafeShield™ architecture..."
│     image: /dam/tut/shared/features/safety-shield.png
│     imagePosition: left
│
├── testimonial → tut/testimonial
│     quote: "The TUT Sovereign is the closest thing to perfection on four wheels."
│     author: "James Henderson"
│     source: "Luxury Motoring Magazine"
│
└── cta-test-drive → tut/cta-banner
      title: "Experience TUT"
      text: "Book your personal test drive today"
      ctaLabel: "Book Test Drive"
      ctaLink: → contact page
      theme: primary
```

### 6.3 Models Hub Page (`models`)

```
main (flexcms/container)
├── hero → tut/hero-banner
│     title: "The TUT Lineup"
│     subtitle: "Four masterpieces. One vision."
│     backgroundImage: /dam/tut/shared/banners/hero-models.png
│
├── sovereign-teaser → tut/product-teaser
│     productSku: TUT-SOVEREIGN-2026, displayMode: hero, ctaLink: → models/sovereign
│
├── vanguard-teaser → tut/product-teaser
│     productSku: TUT-VANGUARD-2026, displayMode: hero, ctaLink: → models/vanguard
│
├── eclipse-teaser → tut/product-teaser
│     productSku: TUT-ECLIPSE-2026, displayMode: hero, ctaLink: → models/eclipse
│
├── apex-teaser → tut/product-teaser
│     productSku: TUT-APEX-2026, displayMode: hero, ctaLink: → models/apex
│
└── comparison → tut/model-comparison
      productSkus: [TUT-SOVEREIGN-2026, TUT-VANGUARD-2026, TUT-ECLIPSE-2026]
      compareAttributes: [horsepower, acceleration0to100, topSpeed, engineType, basePrice_GBP]
```

### 6.4 Model Detail Page (e.g. `models/sovereign`)

Each of the 4 model pages follows this structure. Only the SKU and content text changes.

```
main (flexcms/container)
├── hero → tut/hero-banner
│     title: "TUT Sovereign"
│     subtitle: "The art of arrival"
│     backgroundImage: /dam/tut/shared/models/tut-sovereign.png
│
├── intro → tut/text-image
│     title: "A masterpiece of engineering"
│     text: (product description from PIM)
│     image: /dam/tut/shared/models/tut-sovereign-2.png
│     imagePosition: right
│
├── gallery → tut/gallery
│     images: [tut-sovereign.png, tut-sovereign-2.png, tut-sovereign-3.png]
│     layout: carousel
│
├── specs → tut/product-specs
│     productSku: TUT-SOVEREIGN-2026
│     highlightedSpecs: [horsepower, torque, acceleration0to100, topSpeed]
│
├── features → tut/card-grid (columns: 3, title: "Key Features")
│   ├── card-1 → tut/card (Interior Craftsmanship, /dam/.../interior-cockpit.png)
│   ├── card-2 → tut/card (Infotainment, /dam/.../innovation-ai.png)
│   └── card-3 → tut/card (Night Vision, /dam/.../safety-night.png)
│
└── cta → tut/cta-banner
      title: "Configure Your Sovereign"
      ctaLabel: "Contact Us"
      ctaLink: → contact
```

### 6.5 Innovation Hub Page (`innovation`)

```
main (flexcms/container)
├── hero → tut/hero-banner
│     title: "Innovation at TUT"
│     backgroundImage: /dam/tut/shared/banners/hero-innovation.png
│
├── intro → flexcms/rich-text
│     content: "At TUT, innovation is not a department — it's a philosophy..."
│
├── pillars → tut/card-grid (columns: 3, title: "Our Pillars")
│   ├── card-1 → tut/card (Performance, /dam/.../innovation-engine.png, ctaLink: → innovation/performance)
│   ├── card-2 → tut/card (Electrification, /dam/.../innovation-aero.png, ctaLink: → innovation/electrification)
│   └── card-3 → tut/card (Craftsmanship, /dam/.../craftsmanship.png, ctaLink: → innovation/craftsmanship)
```

### 6.6 Innovation Sub-Pages (`innovation/performance`, etc.)

```
main (flexcms/container)
├── hero → tut/hero-banner (topic-specific banner)
├── intro → tut/text-image (topic explanation)
├── details → flexcms/rich-text (extended content)
├── video → tut/video-embed (topic demo video URL)
└── cta → tut/cta-banner (link to models)
```

### 6.7 Safety Hub & Sub-Pages

Same structure as Innovation. Safety-specific content, images from `/dam/tut/shared/features/safety-*.png`.

### 6.8 About Hub (`about`)

```
main (flexcms/container)
├── hero → tut/hero-banner
│     title: "About TUT"
│     backgroundImage: /dam/tut/shared/banners/hero-about.png
│
├── story → tut/text-image
│     title: "Our Story"
│     text: "Founded in 1949, TUT has been at the forefront of luxury automotive design..."
│     image: /dam/tut/shared/lifestyle/heritage-1.png
│
├── values → tut/card-grid (columns: 3)
│   ├── card-1 → tut/card (Heritage, /heritage-2.png)
│   ├── card-2 → tut/card (Sustainability, /sustainability.png)
│   └── card-3 → tut/card (Craftsmanship, /craftsmanship.png)
```

### 6.9 Contact Page

```
main (flexcms/container)
├── hero → tut/hero-banner (title: "Contact TUT", smaller banner)
├── intro → flexcms/rich-text ("Visit a showroom near you...")
├── faq → tut/accordion
│   ├── item-1 → tut/accordion-item (Q: "How do I book a test drive?", A: ...)
│   ├── item-2 → tut/accordion-item (Q: "Where is my nearest dealer?", A: ...)
│   └── item-3 → tut/accordion-item (Q: "Do you offer financing?", A: ...)
```

### 6.10 Legal Pages (`legal/privacy`, `legal/terms`)

```
main (flexcms/container)
└── content → flexcms/rich-text (full legal text)
```

---

## 7. Localization Strategy

### 7.1 Translation Matrix

| Content Element | EN (source) | DE | FR |
|---|---|---|---|
| Page titles & navigation | English | German translation | French translation |
| Hero headlines | English | German | French |
| Body text | English | German | French |
| CTA buttons | English | German | French |
| Product names | TUT Sovereign (unchanged) | TUT Sovereign (unchanged) | TUT Sovereign (unchanged) |
| Product descriptions | English | German | French |
| Legal pages | English version | German version | French version |
| Prices | GBP | EUR | EUR (FR), CAD (CA) |

### 7.2 Key Translated Strings

| EN | DE | FR |
|---|---|---|
| Explore Models | Modelle entdecken | Découvrir les modèles |
| Book Test Drive | Probefahrt buchen | Réserver un essai |
| Our Models | Unsere Modelle | Nos modèles |
| Innovation | Innovation | Innovation |
| Safety | Sicherheit | Sécurité |
| About Us | Über uns | À propos |
| Contact | Kontakt | Contact |
| Heritage | Tradition | Héritage |
| Performance | Leistung | Performance |
| Privacy Policy | Datenschutz | Politique de confidentialité |
| Terms & Conditions | AGB | Conditions générales |
| Configure | Konfigurieren | Configurer |
| Discover | Entdecken | Découvrir |

### 7.3 Canada-Specific Notes

- Canada EN pages share content with GB EN where possible (via live copy or identical properties).
- Canada FR pages use the same French translations as France, but prices display in CAD instead of EUR.
- The Canadian header XF may include a bilingual language selector (`EN | FR` toggle).
- Contact page includes Canadian dealer info instead of UK/EU info.

---

## 8. Content Reuse Map

This table shows which components are **authored once** and reused across pages or sites.

| Component | Authored In | Reused Via |
|---|---|---|
| Header navigation | XF per site+locale | `flexcms/experience-fragment` reference on every page |
| Footer links | XF per site+locale | `flexcms/experience-fragment` reference on every page |
| Model cards (Sovereign, etc.) | Home page card-grid | Same content structure repeated in each locale (translated) |
| Product teasers | Models hub page | Same SKU referenced from any page via `tut/product-teaser` |
| CTA "Book Test Drive" | Home page | Identical component reused on model detail pages (via copy) |
| Legal text | Legal pages | Country-specific legal content (no reuse across sites) |

---

## 9. Experience Fragment Content

### 9.1 Header XF — Navigation Properties

**GB EN:**
```json
{
  "rootPath": "content.tut-gb.en",
  "depth": 2,
  "brandLogo": "/dam/tut/shared/brand/tut-logo.png",
  "brandName": "TUT",
  "showLanguageSelector": false
}
```

**CA EN:**
```json
{
  "rootPath": "content.tut-ca.en",
  "depth": 2,
  "brandLogo": "/dam/tut/shared/brand/tut-logo.png",
  "brandName": "TUT",
  "showLanguageSelector": true
}
```

### 9.2 Footer XF — Footer Links Properties

**GB EN:**
```json
{
  "columns": [
    {
      "heading": "Models",
      "links": [
        { "label": "Sovereign", "url": "/models/sovereign" },
        { "label": "Vanguard", "url": "/models/vanguard" },
        { "label": "Eclipse", "url": "/models/eclipse" },
        { "label": "Apex", "url": "/models/apex" }
      ]
    },
    {
      "heading": "Discover",
      "links": [
        { "label": "Innovation", "url": "/innovation" },
        { "label": "Safety", "url": "/safety" },
        { "label": "About TUT", "url": "/about" }
      ]
    },
    {
      "heading": "Support",
      "links": [
        { "label": "Contact", "url": "/contact" },
        { "label": "Privacy Policy", "url": "/legal/privacy" },
        { "label": "Terms & Conditions", "url": "/legal/terms" }
      ]
    }
  ],
  "copyrightText": "© 2026 TUT Motors Ltd. All rights reserved.",
  "socialLinks": [
    { "platform": "instagram", "url": "https://instagram.com/tutmotors" },
    { "platform": "youtube", "url": "https://youtube.com/tutmotors" },
    { "platform": "linkedin", "url": "https://linkedin.com/company/tutmotors" }
  ]
}
```

---

## 10. Implementation Order

The developer agent should execute in this exact order:

### Phase 1: Foundation
1. **Register component definitions** — Insert all 18 `tut/*` components into `component_definitions` table
2. **Create sites** — Insert 4 site records into `sites` table with domain mappings
3. **Create site roots** — Create `content.{siteId}` and `content.{siteId}.{locale}` root nodes

### Phase 2: DAM Assets
4. **Upload all images** — Transfer files from `Design/assets/` to DAM via `POST /api/author/assets`

### Phase 3: PIM Products
5. **Create product schema** — `POST /api/pim/v1/schemas`
6. **Create catalog** — `POST /api/pim/v1/catalogs`
7. **Create 4 products** — `POST /api/pim/v1/products` for each car model
8. **Link product assets** — `POST /api/pim/v1/products/{sku}/assets` for DAM references

### Phase 4: Experience Fragments
9. **Create XF folders** — For each site+locale: header XF folder + footer XF folder
10. **Create XF variations** — master variation for each, with navigation/footer components

### Phase 5: Content Pages
11. **Create page tree** — For each site+locale, create all 17 pages in hierarchy order (parents first)
12. **Author components** — For each page, create the component tree as specified in §6
13. **Set page status** — Mark all pages as PUBLISHED

### Phase 6: Validation
14. **Verify content tree** — Query `GET /api/author/content/list?site=tut-gb` and confirm 17+ nodes
15. **Verify PIM** — Query `GET /api/pim/v1/products` and confirm 4 products
16. **Verify XF** — Query `GET /api/author/xf/list?siteId=tut-gb&locale=en` and confirm 2 XFs

---

## 11. Acceptance Criteria

- [ ] 4 sites created with correct locale configurations
- [ ] All 18 `tut/*` component types registered in component_definitions
- [ ] 40+ DAM assets uploaded with correct folder paths
- [ ] PIM schema created with all attribute groups
- [ ] 1 catalog created (TUT 2026 Model Lineup, ACTIVE)
- [ ] 4 products created with full attributes and DAM asset links
- [ ] 12 experience fragment variations (header + footer per site+locale)
- [ ] 85 page nodes created across all sites and locales
- [ ] Every page has header XF reference, breadcrumb, main container, footer XF reference
- [ ] Home page contains hero, card-grid with 4 model cards, text-image, stats, testimonial, CTA
- [ ] Model detail pages contain hero, text-image, gallery, product-specs, feature cards, CTA
- [ ] All pages in PUBLISHED status
- [ ] GB, DE, FR sites have single-locale content; CA has dual-locale (en + fr)
- [ ] Product teasers correctly reference PIM SKUs
- [ ] Navigation XF rootPath points to correct site+locale content root

