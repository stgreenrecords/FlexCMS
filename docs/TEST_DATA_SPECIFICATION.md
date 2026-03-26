# TUT Luxury Cars — Test Data Specification

> **Purpose**: Define all test data required to populate FlexCMS with a realistic multi-site, multi-language luxury automotive scenario. A developer agent will use this document to seed the database via Flyway migration(s) and/or API calls.

---

## 1. Company Profile

| Field | Value |
|---|---|
| Company | **TUT** (Timeless Ultimate Transport) |
| Industry | Luxury automobiles |
| Markets | Great Britain, Germany, France, Canada |
| Languages | English (en), German (de), French (fr) |
| Brand tagline (en) | "Engineering Perfection" |
| Brand tagline (de) | "Perfektion konstruiert" |
| Brand tagline (fr) | "La perfection façonnée" |

---

## 2. Sites Configuration

Four sites, each with its own content root and supported locales:

| Site ID | Site Name | Content Root | Default Locale | Supported Locales | Domain |
|---|---|---|---|---|---|
| `tut-gb` | TUT Great Britain | `sites.tut-gb` | `en` | `en` | `www.tut.co.uk` |
| `tut-de` | TUT Germany | `sites.tut-de` | `de` | `de` | `www.tut.de` |
| `tut-fr` | TUT France | `sites.tut-fr` | `fr` | `fr` | `www.tut.fr` |
| `tut-ca` | TUT Canada | `sites.tut-ca` | `en` | `en`, `fr` | `www.tut.ca` |

> **Canada** is bilingual — it has two full language trees under `sites.tut-ca.en` and `sites.tut-ca.fr`.

### DAM Roots

| Site ID | DAM Root |
|---|---|
| `tut-gb` | `dam.tut-gb` |
| `tut-de` | `dam.tut-de` |
| `tut-fr` | `dam.tut-fr` |
| `tut-ca` | `dam.tut-ca` |

### Domain Mappings

| Domain | Site ID | Locale | Path Prefix |
|---|---|---|---|
| `www.tut.co.uk` | `tut-gb` | `en` | `/` |
| `www.tut.de` | `tut-de` | `de` | `/` |
| `www.tut.fr` | `tut-fr` | `fr` | `/` |
| `www.tut.ca` | `tut-ca` | `en` | `/en/` |
| `www.tut.ca` | `tut-ca` | `fr` | `/fr/` |

---

## 3. Custom Component Definitions

The following components must be **created** (added to `component_definitions`) in addition to the existing core components (`flexcms/page`, `flexcms/container`, `flexcms/rich-text`, `flexcms/image`, `flexcms/shared-header`, `flexcms/shared-footer`, `flexcms/experience-fragment`, etc.).

### 3.1 Navigation & Layout Components

#### `tut/navigation`
> Main site navigation bar with logo, menu items, language switcher, and CTA button.

| Property | Type | Description |
|---|---|---|
| `logoPath` | string | DAM asset path to logo image |
| `logoAltText` | string | Alt text for logo |
| `menuItems` | array | `[{ label, url, children: [{ label, url }] }]` |
| `ctaLabel` | string | e.g. "Book a Test Drive" |
| `ctaUrl` | string | Link target |
| `showLanguageSwitcher` | boolean | Show locale toggle (Canada only) |
| `theme` | string | `"light"` / `"dark"` / `"transparent"` |

- **Group**: Navigation
- **is_container**: false

#### `tut/footer`
> Multi-column footer with contact info, social links, legal links.

| Property | Type | Description |
|---|---|---|
| `columns` | array | `[{ heading, links: [{ label, url }] }]` |
| `socialLinks` | array | `[{ platform, url, iconPath }]` |
| `copyrightText` | string | e.g. "© 2026 TUT Motors Ltd." |
| `legalLinks` | array | `[{ label, url }]` |
| `newsletterEnabled` | boolean | Show email sign-up |
| `newsletterPlaceholder` | string | e.g. "Enter your email" |

- **Group**: Navigation
- **is_container**: false

---

### 3.2 Hero & Promotional Components

#### `tut/hero-banner`
> Full-width hero section with background image/video, headline, subheadline, and CTA buttons.

| Property | Type | Description |
|---|---|---|
| `backgroundImagePath` | string | DAM path to hero image |
| `backgroundVideoPath` | string | (optional) DAM path to hero video |
| `headline` | string | Main heading |
| `subheadline` | string | Supporting text |
| `primaryCtaLabel` | string | e.g. "Explore Models" |
| `primaryCtaUrl` | string | Link target |
| `secondaryCtaLabel` | string | e.g. "Book a Test Drive" |
| `secondaryCtaUrl` | string | Link target |
| `textAlignment` | string | `"left"` / `"center"` / `"right"` |
| `overlayOpacity` | number | 0–100 |
| `theme` | string | `"light"` / `"dark"` |

- **Group**: Hero
- **is_container**: false

#### `tut/promo-banner`
> Narrow promotional strip (e.g., "New GT-S now available. Configure yours →")

| Property | Type | Description |
|---|---|---|
| `text` | string | Promo message |
| `linkLabel` | string | CTA text |
| `linkUrl` | string | Link target |
| `backgroundColor` | string | CSS token name |
| `dismissible` | boolean | User can close it |

- **Group**: Hero
- **is_container**: false

---

### 3.3 Content Components

#### `tut/model-card`
> Card displaying a single car model with image, name, starting price, and link.

| Property | Type | Description |
|---|---|---|
| `imagePath` | string | DAM path to model image |
| `modelName` | string | e.g. "TUT GT-S" |
| `tagline` | string | e.g. "The Art of Speed" |
| `startingPrice` | string | Formatted price, e.g. "From £89,500" |
| `currency` | string | `GBP` / `EUR` / `CAD` |
| `ctaLabel` | string | e.g. "Discover" |
| `ctaUrl` | string | Link to model detail page |
| `badge` | string | (optional) "New" / "Limited Edition" |

- **Group**: Content
- **is_container**: false

#### `tut/model-lineup`
> Grid/carousel that contains multiple `tut/model-card` children.

| Property | Type | Description |
|---|---|---|
| `heading` | string | Section title, e.g. "Our Models" |
| `subheading` | string | Supporting text |
| `layout` | string | `"grid"` / `"carousel"` |
| `columns` | number | 2, 3, or 4 |

- **Group**: Content
- **is_container**: true (children are `tut/model-card`)

#### `tut/feature-highlight`
> Split-layout section: image on one side, text + bullet points on the other.

| Property | Type | Description |
|---|---|---|
| `imagePath` | string | DAM path |
| `imagePosition` | string | `"left"` / `"right"` |
| `heading` | string | Feature heading |
| `description` | string | Rich text description |
| `bulletPoints` | array | `[{ icon, text }]` |
| `ctaLabel` | string | (optional) |
| `ctaUrl` | string | (optional) |

- **Group**: Content
- **is_container**: false

#### `tut/feature-grid`
> Grid of feature tiles with icon, title, and description.

| Property | Type | Description |
|---|---|---|
| `heading` | string | Section heading |
| `subheading` | string | Section description |
| `features` | array | `[{ iconPath, title, description }]` |
| `columns` | number | 2, 3, or 4 |
| `theme` | string | `"light"` / `"dark"` |

- **Group**: Content
- **is_container**: false

#### `tut/specs-table`
> Technical specification table for a car model.

| Property | Type | Description |
|---|---|---|
| `heading` | string | e.g. "Technical Specifications" |
| `categories` | array | `[{ categoryName, specs: [{ label, value }] }]` |

- **Group**: Content
- **is_container**: false

#### `tut/gallery`
> Image gallery with lightbox support.

| Property | Type | Description |
|---|---|---|
| `heading` | string | Section heading |
| `images` | array | `[{ assetPath, caption, altText }]` |
| `layout` | string | `"grid"` / `"masonry"` / `"slider"` |
| `columns` | number | 2, 3, or 4 |

- **Group**: Content
- **is_container**: false

#### `tut/video-player`
> Embedded video component with poster image.

| Property | Type | Description |
|---|---|---|
| `videoPath` | string | DAM path or external URL |
| `posterImagePath` | string | DAM path for poster |
| `heading` | string | (optional) |
| `description` | string | (optional) |
| `autoplay` | boolean | |
| `muted` | boolean | |
| `loop` | boolean | |

- **Group**: Content
- **is_container**: false

#### `tut/testimonial`
> Customer quote with photo, name, and car model.

| Property | Type | Description |
|---|---|---|
| `quote` | string | Customer testimonial text |
| `authorName` | string | Customer name |
| `authorPhotoPath` | string | DAM path |
| `carModel` | string | e.g. "TUT GT-S Owner" |
| `rating` | number | 1–5 stars |

- **Group**: Content
- **is_container**: false

#### `tut/testimonial-carousel`
> Rotating carousel of testimonials.

| Property | Type | Description |
|---|---|---|
| `heading` | string | Section heading |
| `autoRotate` | boolean | |
| `interval` | number | Seconds between rotation |

- **Group**: Content
- **is_container**: true (children are `tut/testimonial`)

#### `tut/cta-section`
> Full-width call-to-action band with heading, text, and button(s).

| Property | Type | Description |
|---|---|---|
| `heading` | string | e.g. "Ready to Experience TUT?" |
| `description` | string | Supporting text |
| `primaryCtaLabel` | string | |
| `primaryCtaUrl` | string | |
| `secondaryCtaLabel` | string | (optional) |
| `secondaryCtaUrl` | string | (optional) |
| `backgroundImagePath` | string | (optional) |
| `theme` | string | `"light"` / `"dark"` / `"brand"` |

- **Group**: Content
- **is_container**: false

#### `tut/accordion`
> Expandable FAQ / content sections.

| Property | Type | Description |
|---|---|---|
| `heading` | string | Section heading |
| `items` | array | `[{ question, answer }]` |
| `allowMultiple` | boolean | Multiple open at once |

- **Group**: Content
- **is_container**: false

#### `tut/product-catalog`
> Integration component that pulls products from PIM and displays them.

| Property | Type | Description |
|---|---|---|
| `heading` | string | e.g. "Explore Our Range" |
| `catalogId` | string | PIM catalog UUID reference |
| `categoryFilter` | string | (optional) Category slug |
| `displayMode` | string | `"grid"` / `"list"` |
| `showPrice` | boolean | |
| `showCompare` | boolean | Enable compare feature |
| `maxItems` | number | Max items to show |
| `ctaLabel` | string | Per-product CTA |

- **Group**: Commerce
- **is_container**: false

#### `tut/product-detail`
> Detailed PIM product view with images, specs, pricing, variants.

| Property | Type | Description |
|---|---|---|
| `productSku` | string | PIM SKU reference |
| `showGallery` | boolean | |
| `showSpecs` | boolean | |
| `showVariants` | boolean | |
| `showRelated` | boolean | Show related models |
| `ctaLabel` | string | e.g. "Configure" |
| `ctaUrl` | string | |

- **Group**: Commerce
- **is_container**: false

#### `tut/contact-form`
> Contact / enquiry form (test drive booking, general enquiry).

| Property | Type | Description |
|---|---|---|
| `heading` | string | Form heading |
| `description` | string | |
| `formType` | string | `"test-drive"` / `"general"` / `"newsletter"` |
| `fields` | array | `[{ name, label, type, required }]` |
| `submitLabel` | string | |
| `successMessage` | string | |
| `recipientEmail` | string | |

- **Group**: Forms
- **is_container**: false

#### `tut/map-embed`
> Google Maps / dealer locator embed.

| Property | Type | Description |
|---|---|---|
| `heading` | string | e.g. "Find a Dealer" |
| `latitude` | number | Center lat |
| `longitude` | number | Center lng |
| `zoom` | number | Map zoom level |
| `markers` | array | `[{ lat, lng, title, address, phone }]` |

- **Group**: Content
- **is_container**: false

#### `tut/breadcrumb`
> Auto-generated breadcrumb from content tree path.

| Property | Type | Description |
|---|---|---|
| `showHome` | boolean | Include home link |
| `separator` | string | e.g. "/" or ">" |

- **Group**: Navigation
- **is_container**: false

#### `tut/section-heading`
> Reusable section divider with heading and optional description.

| Property | Type | Description |
|---|---|---|
| `heading` | string | |
| `subheading` | string | (optional) |
| `alignment` | string | `"left"` / `"center"` |
| `showDivider` | boolean | Decorative line |

- **Group**: Content
- **is_container**: false

---

## 4. Page Hierarchy

All four sites share the **same page structure** (localized content differs). Below is the canonical hierarchy. Each node shows its `resource_type` and key components.

### 4.1 Canonical Page Tree (per site)

```
sites.{site-id}.{locale}                              [flexcms/page]  — Language root
├── home                                               [flexcms/page]  — Homepage
├── models                                             [flexcms/page]  — Model listing
│   ├── gt-s                                           [flexcms/page]  — GT-S detail
│   ├── touring-v                                      [flexcms/page]  — Touring V detail
│   ├── electra-e                                      [flexcms/page]  — Electra-E detail
│   └── suv-x                                          [flexcms/page]  — SUV-X detail
├── innovation                                         [flexcms/page]  — Innovation hub
│   ├── electrification                                [flexcms/page]  — EV technology
│   ├── autonomous-driving                             [flexcms/page]  — AD features
│   └── connected-car                                  [flexcms/page]  — Connected tech
├── safety                                             [flexcms/page]  — Safety overview
│   ├── active-safety                                  [flexcms/page]  — Active systems
│   └── passive-safety                                 [flexcms/page]  — Passive systems
├── about                                              [flexcms/page]  — About TUT
│   ├── heritage                                       [flexcms/page]  — Brand history
│   └── sustainability                                 [flexcms/page]  — Green initiatives
├── contact                                            [flexcms/page]  — Contact us
│   └── book-test-drive                                [flexcms/page]  — Test drive form
└── legal                                              [flexcms/page]  — Legal hub
    ├── privacy-policy                                 [flexcms/page]
    ├── cookie-policy                                  [flexcms/page]
    └── terms-of-use                                   [flexcms/page]
```

### 4.2 Full Paths Per Site

| Site | Locale | Root Path |
|---|---|---|
| TUT GB | en | `sites.tut-gb.en` |
| TUT DE | de | `sites.tut-de.de` |
| TUT FR | fr | `sites.tut-fr.fr` |
| TUT CA (English) | en | `sites.tut-ca.en` |
| TUT CA (French) | fr | `sites.tut-ca.fr` |

Example full paths:
- `sites.tut-gb.en.home`
- `sites.tut-de.de.models.gt-s`
- `sites.tut-ca.fr.innovation.electrification`

### 4.3 Experience Fragment Hierarchy

Each site has its own experience fragments for navigation and footer, enabling per-country customization while maintaining structural consistency.

```
sites.{site-id}.{locale}.experience-fragments          [flexcms/container]
├── main-navigation                                    [flexcms/xf-folder]
│   ├── master                                         [flexcms/xf-page]  ← contains tut/navigation
│   └── mobile                                         [flexcms/xf-page]  ← contains tut/navigation (simplified)
├── site-footer                                        [flexcms/xf-folder]
│   └── master                                         [flexcms/xf-page]  ← contains tut/footer
└── promo-bar                                          [flexcms/xf-folder]
    └── master                                         [flexcms/xf-page]  ← contains tut/promo-banner
```

---

## 5. Component Composition Per Page

Each page follows the **default-page template** structure: `header → main (container) → footer`. Header and footer are experience fragment references. The components listed below go inside the `main` container.

### 5.1 Homepage (`home`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/promo-banner` | XF reference to promo-bar (if active) |
| 2 | `tut/hero-banner` | Full hero with latest flagship model image, "Discover the new GT-S" |
| 3 | `tut/model-lineup` | Grid of 4 `tut/model-card` children (GT-S, Touring V, Electra-E, SUV-X) |
| 4 | `tut/feature-highlight` | Innovation teaser — image left, "Driving the Future" text right |
| 5 | `tut/feature-grid` | 4-column grid: Performance, Safety, Technology, Sustainability |
| 6 | `tut/video-player` | Brand film / latest commercial |
| 7 | `tut/testimonial-carousel` | 3 testimonials from customers |
| 8 | `tut/cta-section` | "Book a Test Drive" CTA with background image |

### 5.2 Models Listing (`models`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | Home > Models |
| 2 | `tut/hero-banner` | "Our Range" hero, lineup photo |
| 3 | `tut/section-heading` | "Explore Our Models" |
| 4 | `tut/model-lineup` | Grid of 4 `tut/model-card` children |
| 5 | `tut/product-catalog` | PIM-powered catalog with filters |
| 6 | `tut/cta-section` | "Can't Decide? Book a Test Drive" |

### 5.3 Model Detail Page (e.g. `models/gt-s`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | Home > Models > GT-S |
| 2 | `tut/hero-banner` | Model-specific hero with model photo |
| 3 | `tut/gallery` | 6–8 images of the model |
| 4 | `tut/section-heading` | "Performance Redefined" |
| 5 | `tut/feature-highlight` | Engine/powertrain highlight, image right |
| 6 | `tut/feature-highlight` | Interior/luxury highlight, image left |
| 7 | `tut/specs-table` | Full technical specifications |
| 8 | `tut/product-detail` | PIM product reference with variants |
| 9 | `tut/cta-section` | "Configure Your GT-S" |

### 5.4 Innovation Hub (`innovation`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | Home > Innovation |
| 2 | `tut/hero-banner` | "Pioneering the Future" |
| 3 | `tut/section-heading` | "Our Innovations" |
| 4 | `tut/feature-grid` | 3 tiles: Electrification, Autonomous, Connected (link to sub-pages) |
| 5 | `tut/video-player` | Innovation overview video |
| 6 | `tut/cta-section` | "Discover More" |

### 5.5 Innovation Sub-page (e.g. `innovation/electrification`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | Home > Innovation > Electrification |
| 2 | `tut/hero-banner` | Topic-specific hero |
| 3 | `tut/feature-highlight` | Key feature 1 (image left) |
| 4 | `tut/feature-highlight` | Key feature 2 (image right) |
| 5 | `tut/specs-table` | EV range, charging specs, etc. |
| 6 | `tut/gallery` | Technology images |
| 7 | `flexcms/rich-text` | Detailed editorial content |
| 8 | `tut/cta-section` | "Explore the Electra-E" |

### 5.6 Safety Overview (`safety`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | Home > Safety |
| 2 | `tut/hero-banner` | "Safety Without Compromise" |
| 3 | `tut/feature-grid` | 6 safety feature tiles with icons |
| 4 | `tut/feature-highlight` | "5-Star Safety Rating" |
| 5 | `tut/video-player` | Crash test / safety demo video |
| 6 | `tut/cta-section` | "Learn More About Active Safety / Passive Safety" |

### 5.7 Safety Sub-page (e.g. `safety/active-safety`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | |
| 2 | `tut/hero-banner` | Topic-specific |
| 3 | `tut/feature-highlight` | Feature 1 |
| 4 | `tut/feature-highlight` | Feature 2 |
| 5 | `tut/feature-grid` | Individual system tiles |
| 6 | `flexcms/rich-text` | Editorial content |

### 5.8 About TUT (`about`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | |
| 2 | `tut/hero-banner` | "The TUT Story" |
| 3 | `flexcms/rich-text` | Company overview text |
| 4 | `tut/feature-highlight` | Key company fact 1 |
| 5 | `tut/feature-highlight` | Key company fact 2 |
| 6 | `tut/gallery` | Company / factory images |
| 7 | `tut/cta-section` | Link to heritage / sustainability |

### 5.9 Heritage (`about/heritage`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | |
| 2 | `tut/hero-banner` | "A Legacy of Excellence" |
| 3 | `flexcms/rich-text` | Historical narrative |
| 4 | `tut/gallery` | Vintage car images, historical photos |
| 5 | `tut/feature-highlight` | Key milestone |

### 5.10 Sustainability (`about/sustainability`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | |
| 2 | `tut/hero-banner` | "Driving Towards a Greener Future" |
| 3 | `tut/feature-grid` | Sustainability pillars (Carbon Neutral, Recycled Materials, EV Future, Renewable Energy) |
| 4 | `tut/feature-highlight` | Key initiative |
| 5 | `flexcms/rich-text` | Detailed sustainability content |

### 5.11 Contact (`contact`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | |
| 2 | `tut/section-heading` | "Get in Touch" |
| 3 | `tut/contact-form` | `formType: "general"` |
| 4 | `tut/map-embed` | Headquarters + dealer locations |
| 5 | `tut/accordion` | FAQ items |

### 5.12 Book Test Drive (`contact/book-test-drive`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | |
| 2 | `tut/hero-banner` | "Experience TUT First-Hand" |
| 3 | `tut/contact-form` | `formType: "test-drive"`, fields for model selection, preferred date, location |
| 4 | `tut/map-embed` | Nearest dealer locator |

### 5.13 Legal Pages (`legal/*`)

| Order | Component | Key Properties |
|---|---|---|
| 1 | `tut/breadcrumb` | |
| 2 | `tut/section-heading` | Page-specific heading |
| 3 | `flexcms/rich-text` | Full legal text |

---

## 6. Experience Fragment Content

### 6.1 Navigation (per site)

The `tut/navigation` component inside each site's `main-navigation/master` XF has country-specific menu items:

**Common Menu Structure** (all sites):

```json
{
  "menuItems": [
    { "label": "Models", "url": "/models", "children": [
      { "label": "GT-S", "url": "/models/gt-s" },
      { "label": "Touring V", "url": "/models/touring-v" },
      { "label": "Electra-E", "url": "/models/electra-e" },
      { "label": "SUV-X", "url": "/models/suv-x" }
    ]},
    { "label": "Innovation", "url": "/innovation", "children": [
      { "label": "Electrification", "url": "/innovation/electrification" },
      { "label": "Autonomous Driving", "url": "/innovation/autonomous-driving" },
      { "label": "Connected Car", "url": "/innovation/connected-car" }
    ]},
    { "label": "Safety", "url": "/safety" },
    { "label": "About", "url": "/about" },
    { "label": "Contact", "url": "/contact" }
  ]
}
```

**Per-Country Variations:**

| Site | CTA Label | CTA URL | Language Switcher | Theme |
|---|---|---|---|---|
| GB | "Book a Test Drive" | `/contact/book-test-drive` | false | `"dark"` |
| DE | "Probefahrt buchen" | `/contact/book-test-drive` | false | `"dark"` |
| FR | "Réserver un essai" | `/contact/book-test-drive` | false | `"dark"` |
| CA (en) | "Book a Test Drive" | `/contact/book-test-drive` | true | `"dark"` |
| CA (fr) | "Réserver un essai" | `/contact/book-test-drive` | true | `"dark"` |

### 6.2 Footer (per site)

**Common Footer Structure:**

```json
{
  "columns": [
    {
      "heading": "Models",
      "links": [
        { "label": "GT-S", "url": "/models/gt-s" },
        { "label": "Touring V", "url": "/models/touring-v" },
        { "label": "Electra-E", "url": "/models/electra-e" },
        { "label": "SUV-X", "url": "/models/suv-x" }
      ]
    },
    {
      "heading": "Company",
      "links": [
        { "label": "About TUT", "url": "/about" },
        { "label": "Heritage", "url": "/about/heritage" },
        { "label": "Sustainability", "url": "/about/sustainability" }
      ]
    },
    {
      "heading": "Support",
      "links": [
        { "label": "Contact Us", "url": "/contact" },
        { "label": "Book a Test Drive", "url": "/contact/book-test-drive" },
        { "label": "Find a Dealer", "url": "/contact" }
      ]
    }
  ],
  "socialLinks": [
    { "platform": "instagram", "url": "https://instagram.com/tut_motors" },
    { "platform": "youtube", "url": "https://youtube.com/tutmotors" },
    { "platform": "linkedin", "url": "https://linkedin.com/company/tut-motors" }
  ],
  "legalLinks": [
    { "label": "Privacy Policy", "url": "/legal/privacy-policy" },
    { "label": "Cookie Policy", "url": "/legal/cookie-policy" },
    { "label": "Terms of Use", "url": "/legal/terms-of-use" }
  ],
  "newsletterEnabled": true
}
```

**Per-Country Copyright:**
| Site | Copyright |
|---|---|
| GB | "© 2026 TUT Motors Ltd. All rights reserved." |
| DE | "© 2026 TUT Motors GmbH. Alle Rechte vorbehalten." |
| FR | "© 2026 TUT Motors SAS. Tous droits réservés." |
| CA | "© 2026 TUT Motors Canada Inc. All rights reserved. / Tous droits réservés." |

### 6.3 Promo Bar (per site)

| Site | Text | Link |
|---|---|---|
| GB | "The all-new Electra-E is here. 0% APR available." | "Configure now →" → `/models/electra-e` |
| DE | "Der neue Electra-E ist da. 0% Finanzierung verfügbar." | "Jetzt konfigurieren →" → `/models/electra-e` |
| FR | "Le nouvel Electra-E est arrivé. Financement 0% disponible." | "Configurez maintenant →" → `/models/electra-e` |
| CA (en) | "The all-new Electra-E. Now available in Canada." | "Explore →" → `/models/electra-e` |
| CA (fr) | "Le tout nouveau Electra-E. Maintenant disponible au Canada." | "Explorer →" → `/models/electra-e` |

---

## 7. PIM Test Data — Product Catalog

### 7.1 Product Schema

**Schema Name**: `luxury-vehicle`
**Version**: 1

```json
{
  "type": "object",
  "properties": {
    "modelName": { "type": "string", "title": "Model Name" },
    "modelYear": { "type": "integer", "title": "Model Year" },
    "bodyType": { "type": "string", "enum": ["sedan", "coupe", "suv", "estate", "convertible"], "title": "Body Type" },
    "fuelType": { "type": "string", "enum": ["petrol", "diesel", "hybrid", "electric"], "title": "Fuel Type" },
    "engineDisplacement": { "type": "string", "title": "Engine Displacement" },
    "horsepower": { "type": "integer", "title": "Horsepower (HP)" },
    "torque": { "type": "integer", "title": "Torque (Nm)" },
    "transmission": { "type": "string", "enum": ["manual-6", "auto-8", "auto-9", "dct-7", "single-speed"], "title": "Transmission" },
    "drivetrain": { "type": "string", "enum": ["RWD", "AWD", "FWD"], "title": "Drivetrain" },
    "acceleration0to100": { "type": "number", "title": "0-100 km/h (seconds)" },
    "topSpeed": { "type": "integer", "title": "Top Speed (km/h)" },
    "range": { "type": "integer", "title": "Range (km)" },
    "batteryCapacity": { "type": "string", "title": "Battery Capacity" },
    "chargingTime": { "type": "string", "title": "Charging Time (10-80%)" },
    "fuelConsumption": { "type": "string", "title": "Fuel Consumption (L/100km)" },
    "co2Emissions": { "type": "integer", "title": "CO₂ Emissions (g/km)" },
    "weight": { "type": "integer", "title": "Curb Weight (kg)" },
    "length": { "type": "integer", "title": "Length (mm)" },
    "width": { "type": "integer", "title": "Width (mm)" },
    "height": { "type": "integer", "title": "Height (mm)" },
    "wheelbase": { "type": "integer", "title": "Wheelbase (mm)" },
    "trunkCapacity": { "type": "integer", "title": "Trunk Capacity (litres)" },
    "seatingCapacity": { "type": "integer", "title": "Seating Capacity" },
    "safetyRating": { "type": "string", "title": "Safety Rating" },
    "shortDescription": { "type": "string", "title": "Short Description" },
    "longDescription": { "type": "string", "title": "Full Description" },
    "keyFeatures": { "type": "array", "items": { "type": "string" }, "title": "Key Features" }
  },
  "required": ["modelName", "modelYear", "bodyType", "fuelType"]
}
```

**Attribute Groups** (for admin UI layout):
```json
[
  { "name": "General", "fields": ["modelName", "modelYear", "bodyType", "fuelType", "shortDescription", "longDescription"] },
  { "name": "Performance", "fields": ["engineDisplacement", "horsepower", "torque", "transmission", "drivetrain", "acceleration0to100", "topSpeed"] },
  { "name": "Efficiency", "fields": ["range", "batteryCapacity", "chargingTime", "fuelConsumption", "co2Emissions"] },
  { "name": "Dimensions", "fields": ["weight", "length", "width", "height", "wheelbase", "trunkCapacity", "seatingCapacity"] },
  { "name": "Safety & Features", "fields": ["safetyRating", "keyFeatures"] }
]
```

### 7.2 Catalog

| Field | Value |
|---|---|
| Name | TUT 2026 Collection |
| Year | 2026 |
| Season | FULL_YEAR |
| Schema | luxury-vehicle v1 |
| Status | ACTIVE |

### 7.3 Products

#### TUT GT-S (Grand Touring Sport)

| Field | Value |
|---|---|
| **SKU** | `TUT-GTS-2026` |
| **Model Name** | TUT GT-S |
| **Model Year** | 2026 |
| **Body Type** | coupe |
| **Fuel Type** | petrol |
| **Engine** | 4.0L Twin-Turbo V8 |
| **Horsepower** | 620 |
| **Torque** | 800 Nm |
| **Transmission** | auto-9 |
| **Drivetrain** | RWD |
| **0-100 km/h** | 3.2s |
| **Top Speed** | 330 km/h |
| **Fuel Consumption** | 11.8 L/100km |
| **CO₂** | 268 g/km |
| **Weight** | 1,680 kg |
| **Dimensions** | 4,650 × 1,950 × 1,290 mm |
| **Wheelbase** | 2,720 mm |
| **Trunk** | 350 L |
| **Seats** | 2+2 |
| **Safety** | Euro NCAP 5★ |
| **Short Desc** | "The ultimate grand tourer. Raw power meets refined luxury." |
| **Key Features** | Active aerodynamics, Carbon ceramic brakes, Adaptive suspension, Night vision, Head-up display, Handcrafted interior |

**Variants:**

| Variant SKU | Name | Colour | Interior | Price (GBP) | Price (EUR) | Price (CAD) |
|---|---|---|---|---|---|---|
| `TUT-GTS-2026-BLK` | GT-S Obsidian Black | Obsidian Black | Tan Leather | £89,500 | €104,900 | CA$155,000 |
| `TUT-GTS-2026-SLV` | GT-S Sterling Silver | Sterling Silver | Black Leather | £89,500 | €104,900 | CA$155,000 |
| `TUT-GTS-2026-RED` | GT-S Racing Red | Racing Red | Black Alcantara | £92,000 | €107,800 | CA$159,000 |
| `TUT-GTS-2026-BLU` | GT-S Monaco Blue | Monaco Blue | Cream Leather | £91,200 | €106,900 | CA$157,500 |

#### TUT Touring V

| Field | Value |
|---|---|
| **SKU** | `TUT-TV-2026` |
| **Model Name** | TUT Touring V |
| **Model Year** | 2026 |
| **Body Type** | sedan |
| **Fuel Type** | hybrid |
| **Engine** | 3.0L Inline-6 + Electric Motor |
| **Horsepower** | 510 (combined) |
| **Torque** | 700 Nm (combined) |
| **Transmission** | auto-9 |
| **Drivetrain** | AWD |
| **0-100 km/h** | 4.1s |
| **Top Speed** | 280 km/h |
| **Electric Range** | 65 km |
| **Battery** | 18.7 kWh |
| **Fuel Consumption** | 2.4 L/100km (WLTP combined) |
| **CO₂** | 54 g/km |
| **Weight** | 2,050 kg |
| **Dimensions** | 5,080 × 1,920 × 1,480 mm |
| **Wheelbase** | 3,100 mm |
| **Trunk** | 520 L |
| **Seats** | 5 |
| **Safety** | Euro NCAP 5★ |
| **Short Desc** | "Where executive luxury meets electrified performance." |
| **Key Features** | Plug-in hybrid, Air suspension, Rear-seat entertainment, Massaging seats, Ambient lighting, 4-zone climate |

**Variants:**

| Variant SKU | Name | Colour | Interior | Price (GBP) | Price (EUR) | Price (CAD) |
|---|---|---|---|---|---|---|
| `TUT-TV-2026-BLK` | Touring V Obsidian Black | Obsidian Black | Ivory Leather | £72,500 | €84,900 | CA$125,000 |
| `TUT-TV-2026-GRY` | Touring V Graphite Grey | Graphite Grey | Espresso Leather | £72,500 | €84,900 | CA$125,000 |
| `TUT-TV-2026-WHT` | Touring V Pearl White | Pearl White | Saddle Tan Leather | £74,000 | €86,700 | CA$127,500 |

#### TUT Electra-E

| Field | Value |
|---|---|
| **SKU** | `TUT-EE-2026` |
| **Model Name** | TUT Electra-E |
| **Model Year** | 2026 |
| **Body Type** | sedan |
| **Fuel Type** | electric |
| **Engine** | Dual Motor (Front + Rear) |
| **Horsepower** | 680 |
| **Torque** | 900 Nm |
| **Transmission** | single-speed |
| **Drivetrain** | AWD |
| **0-100 km/h** | 2.9s |
| **Top Speed** | 260 km/h |
| **Range** | 620 km (WLTP) |
| **Battery** | 105 kWh |
| **Charging** | 18 min (10-80%, 350kW DC) |
| **CO₂** | 0 g/km |
| **Weight** | 2,280 kg |
| **Dimensions** | 4,980 × 1,960 × 1,440 mm |
| **Wheelbase** | 3,000 mm |
| **Trunk** | 480 L + 60 L frunk |
| **Seats** | 5 |
| **Safety** | Euro NCAP 5★ |
| **Short Desc** | "Zero emissions. Absolute performance. Pure luxury." |
| **Key Features** | 800V architecture, Bi-directional charging, Glass roof, Self-parking, Level 3 autonomous, OTA updates |

**Variants:**

| Variant SKU | Name | Colour | Interior | Price (GBP) | Price (EUR) | Price (CAD) |
|---|---|---|---|---|---|---|
| `TUT-EE-2026-WHT` | Electra-E Pearl White | Pearl White | Vegan White Interior | £95,000 | €111,300 | CA$164,000 |
| `TUT-EE-2026-BLK` | Electra-E Stealth Black | Stealth Black | Black Ultrasuede | £95,000 | €111,300 | CA$164,000 |
| `TUT-EE-2026-GRN` | Electra-E Aurora Green | Aurora Green | Grey Recycled Fabric | £97,500 | €114,200 | CA$168,000 |

#### TUT SUV-X

| Field | Value |
|---|---|
| **SKU** | `TUT-SUVX-2026` |
| **Model Name** | TUT SUV-X |
| **Model Year** | 2026 |
| **Body Type** | suv |
| **Fuel Type** | hybrid |
| **Engine** | 4.0L Twin-Turbo V8 + Electric Motor |
| **Horsepower** | 590 (combined) |
| **Torque** | 850 Nm (combined) |
| **Transmission** | auto-8 |
| **Drivetrain** | AWD |
| **0-100 km/h** | 4.5s |
| **Top Speed** | 270 km/h |
| **Electric Range** | 48 km |
| **Battery** | 15.5 kWh |
| **Fuel Consumption** | 4.2 L/100km (WLTP combined) |
| **CO₂** | 95 g/km |
| **Weight** | 2,450 kg |
| **Dimensions** | 5,150 × 2,030 × 1,770 mm |
| **Wheelbase** | 3,150 mm |
| **Trunk** | 650 L (1,870 L seats folded) |
| **Seats** | 5 (optional 7) |
| **Safety** | Euro NCAP 5★ |
| **Short Desc** | "Commanding presence. Uncompromising luxury. Go anywhere." |
| **Key Features** | Air suspension with off-road mode, Towing 3,500 kg, Panoramic roof, Rear-seat recline, Terrain management, Power-fold 3rd row |

**Variants:**

| Variant SKU | Name | Colour | Interior | Price (GBP) | Price (EUR) | Price (CAD) |
|---|---|---|---|---|---|---|
| `TUT-SUVX-2026-BLK` | SUV-X Obsidian Black | Obsidian Black | Tan Leather | £82,000 | €96,100 | CA$141,500 |
| `TUT-SUVX-2026-GRY` | SUV-X Granite Grey | Granite Grey | Black Leather | £82,000 | €96,100 | CA$141,500 |
| `TUT-SUVX-2026-GRN` | SUV-X British Racing Green | British Racing Green | Cream Leather | £84,500 | €99,000 | CA$145,500 |
| `TUT-SUVX-2026-WHT` | SUV-X Arctic White | Arctic White | Espresso Leather | £83,200 | €97,500 | CA$143,500 |

---

## 8. DAM — Digital Assets

### 8.1 Shared Assets (used by all sites)

All assets are stored at `dam.tut-shared`:

```
dam.tut-shared/
├── brand/
│   ├── tut-logo-dark.svg
│   ├── tut-logo-light.svg
│   ├── tut-logo-mono.svg
│   └── tut-favicon.png
├── models/
│   ├── gt-s/
│   │   ├── gt-s-hero.jpg               (3840×2160, exterior front 3/4)
│   │   ├── gt-s-side.jpg               (2400×1600, profile view)
│   │   ├── gt-s-rear.jpg               (2400×1600, rear 3/4)
│   │   ├── gt-s-interior.jpg           (2400×1600, dashboard)
│   │   ├── gt-s-detail-engine.jpg      (2400×1600, engine bay)
│   │   ├── gt-s-detail-wheel.jpg       (1600×1600, alloy close-up)
│   │   ├── gt-s-night.jpg              (2400×1600, night driving)
│   │   └── gt-s-card.jpg               (800×600, listing thumbnail)
│   ├── touring-v/
│   │   ├── touring-v-hero.jpg
│   │   ├── touring-v-side.jpg
│   │   ├── touring-v-rear.jpg
│   │   ├── touring-v-interior.jpg
│   │   ├── touring-v-detail-seats.jpg
│   │   ├── touring-v-detail-console.jpg
│   │   ├── touring-v-highway.jpg
│   │   └── touring-v-card.jpg
│   ├── electra-e/
│   │   ├── electra-e-hero.jpg
│   │   ├── electra-e-side.jpg
│   │   ├── electra-e-rear.jpg
│   │   ├── electra-e-interior.jpg
│   │   ├── electra-e-charging.jpg
│   │   ├── electra-e-frunk.jpg
│   │   ├── electra-e-night.jpg
│   │   └── electra-e-card.jpg
│   └── suv-x/
│       ├── suv-x-hero.jpg
│       ├── suv-x-side.jpg
│       ├── suv-x-rear.jpg
│       ├── suv-x-interior.jpg
│       ├── suv-x-offroad.jpg
│       ├── suv-x-detail-trunk.jpg
│       ├── suv-x-family.jpg
│       └── suv-x-card.jpg
├── innovation/
│   ├── electrification-hero.jpg
│   ├── autonomous-hero.jpg
│   ├── connected-hero.jpg
│   ├── ev-battery-cutaway.jpg
│   ├── ev-charging-station.jpg
│   ├── autonomous-sensors.jpg
│   ├── autonomous-highway.jpg
│   ├── connected-dashboard.jpg
│   └── connected-app.jpg
├── safety/
│   ├── safety-hero.jpg
│   ├── crash-test.jpg
│   ├── airbag-system.jpg
│   ├── lidar-sensor.jpg
│   ├── night-vision.jpg
│   ├── lane-assist.jpg
│   └── safety-rating-badge.png
├── about/
│   ├── about-hero.jpg
│   ├── heritage-hero.jpg
│   ├── sustainability-hero.jpg
│   ├── factory-exterior.jpg
│   ├── factory-line.jpg
│   ├── founders-portrait.jpg
│   ├── heritage-1960s.jpg
│   ├── heritage-1980s.jpg
│   ├── heritage-2000s.jpg
│   └── sustainability-solar.jpg
├── lifestyle/
│   ├── homepage-hero.jpg               (3840×2160, hero background)
│   ├── test-drive-hero.jpg
│   ├── cta-background.jpg
│   └── brand-film-poster.jpg
├── testimonials/
│   ├── customer-1.jpg                  (400×400, portrait)
│   ├── customer-2.jpg
│   └── customer-3.jpg
├── icons/
│   ├── performance-icon.svg
│   ├── safety-icon.svg
│   ├── technology-icon.svg
│   ├── sustainability-icon.svg
│   ├── ev-icon.svg
│   ├── autonomous-icon.svg
│   ├── connected-icon.svg
│   ├── airbag-icon.svg
│   ├── abs-icon.svg
│   ├── lane-keep-icon.svg
│   ├── blind-spot-icon.svg
│   ├── collision-icon.svg
│   └── night-vision-icon.svg
├── social/
│   ├── instagram-icon.svg
│   ├── youtube-icon.svg
│   └── linkedin-icon.svg
└── video/
    ├── brand-film.mp4                  (2 min brand overview)
    ├── innovation-overview.mp4
    ├── safety-demo.mp4
    └── electra-e-launch.mp4
```

### 8.2 Renditions to Generate

For every `.jpg` image:
| Rendition Key | Dimensions | Format | Use Case |
|---|---|---|---|
| `thumbnail` | 200×200 (crop) | JPEG | Admin listing |
| `card` | 800×600 (fit) | JPEG | Model cards, grids |
| `hero-desktop` | 1920×1080 (fit) | JPEG | Desktop hero |
| `hero-mobile` | 768×1024 (fit) | JPEG | Mobile hero |
| `gallery` | 1200×800 (fit) | JPEG | Gallery lightbox |

---

## 9. Localized Content Samples

Below is the **homepage hero banner** content for all 5 locale instances to illustrate the localization approach. The developer agent should follow this pattern for ALL pages.

### 9.1 Homepage Hero — All Locales

**GB (en):**
```json
{
  "backgroundImagePath": "dam.tut-shared.lifestyle.homepage-hero",
  "headline": "Engineering Perfection",
  "subheadline": "Discover the 2026 TUT range — where power meets prestige.",
  "primaryCtaLabel": "Explore Models",
  "primaryCtaUrl": "/models",
  "secondaryCtaLabel": "Book a Test Drive",
  "secondaryCtaUrl": "/contact/book-test-drive",
  "textAlignment": "left",
  "overlayOpacity": 40,
  "theme": "dark"
}
```

**DE (de):**
```json
{
  "backgroundImagePath": "dam.tut-shared.lifestyle.homepage-hero",
  "headline": "Perfektion konstruiert",
  "subheadline": "Entdecken Sie die TUT Kollektion 2026 — wo Kraft auf Prestige trifft.",
  "primaryCtaLabel": "Modelle entdecken",
  "primaryCtaUrl": "/models",
  "secondaryCtaLabel": "Probefahrt buchen",
  "secondaryCtaUrl": "/contact/book-test-drive",
  "textAlignment": "left",
  "overlayOpacity": 40,
  "theme": "dark"
}
```

**FR (fr):**
```json
{
  "backgroundImagePath": "dam.tut-shared.lifestyle.homepage-hero",
  "headline": "La perfection façonnée",
  "subheadline": "Découvrez la gamme TUT 2026 — quand la puissance rencontre le prestige.",
  "primaryCtaLabel": "Explorer les modèles",
  "primaryCtaUrl": "/models",
  "secondaryCtaLabel": "Réserver un essai",
  "secondaryCtaUrl": "/contact/book-test-drive",
  "textAlignment": "left",
  "overlayOpacity": 40,
  "theme": "dark"
}
```

**CA English (en):**
```json
{
  "backgroundImagePath": "dam.tut-shared.lifestyle.homepage-hero",
  "headline": "Engineering Perfection",
  "subheadline": "The 2026 TUT range is now available across Canada.",
  "primaryCtaLabel": "Explore Models",
  "primaryCtaUrl": "/models",
  "secondaryCtaLabel": "Book a Test Drive",
  "secondaryCtaUrl": "/contact/book-test-drive",
  "textAlignment": "left",
  "overlayOpacity": 40,
  "theme": "dark"
}
```

**CA French (fr):**
```json
{
  "backgroundImagePath": "dam.tut-shared.lifestyle.homepage-hero",
  "headline": "La perfection façonnée",
  "subheadline": "La gamme TUT 2026 est maintenant disponible partout au Canada.",
  "primaryCtaLabel": "Explorer les modèles",
  "primaryCtaUrl": "/models",
  "secondaryCtaLabel": "Réserver un essai",
  "secondaryCtaUrl": "/contact/book-test-drive",
  "textAlignment": "left",
  "overlayOpacity": 40,
  "theme": "dark"
}
```

---

## 10. i18n Dictionary Entries

Common UI strings for the i18n dictionary (per site + locale):

| Key | en | de | fr |
|---|---|---|---|
| `nav.home` | Home | Startseite | Accueil |
| `nav.models` | Models | Modelle | Modèles |
| `nav.innovation` | Innovation | Innovation | Innovation |
| `nav.safety` | Safety | Sicherheit | Sécurité |
| `nav.about` | About | Über uns | À propos |
| `nav.contact` | Contact | Kontakt | Contact |
| `cta.test-drive` | Book a Test Drive | Probefahrt buchen | Réserver un essai |
| `cta.explore` | Explore | Entdecken | Explorer |
| `cta.discover` | Discover | Mehr erfahren | Découvrir |
| `cta.configure` | Configure | Konfigurieren | Configurer |
| `cta.learn-more` | Learn More | Mehr erfahren | En savoir plus |
| `label.starting-from` | From {price} | Ab {price} | À partir de {price} |
| `label.new` | New | Neu | Nouveau |
| `label.limited-edition` | Limited Edition | Limitierte Edition | Édition Limitée |
| `label.all-models` | All Models | Alle Modelle | Tous les modèles |
| `form.name` | Full Name | Vollständiger Name | Nom complet |
| `form.email` | Email Address | E-Mail-Adresse | Adresse e-mail |
| `form.phone` | Phone Number | Telefonnummer | Numéro de téléphone |
| `form.message` | Message | Nachricht | Message |
| `form.model` | Preferred Model | Bevorzugtes Modell | Modèle préféré |
| `form.date` | Preferred Date | Bevorzugtes Datum | Date souhaitée |
| `form.location` | Preferred Location | Bevorzugter Standort | Lieu souhaité |
| `form.submit` | Submit | Absenden | Envoyer |
| `form.success` | Thank you! We'll be in touch shortly. | Vielen Dank! Wir melden uns in Kürze. | Merci ! Nous vous contacterons bientôt. |
| `footer.newsletter` | Stay informed | Bleiben Sie informiert | Restez informé |
| `footer.newsletter-placeholder` | Enter your email | E-Mail eingeben | Entrez votre e-mail |
| `legal.privacy` | Privacy Policy | Datenschutzrichtlinie | Politique de confidentialité |
| `legal.cookies` | Cookie Policy | Cookie-Richtlinie | Politique de cookies |
| `legal.terms` | Terms of Use | Nutzungsbedingungen | Conditions d'utilisation |
| `breadcrumb.home` | Home | Startseite | Accueil |
| `specs.engine` | Engine | Motor | Moteur |
| `specs.power` | Power | Leistung | Puissance |
| `specs.torque` | Torque | Drehmoment | Couple |
| `specs.acceleration` | 0-100 km/h | 0-100 km/h | 0-100 km/h |
| `specs.topSpeed` | Top Speed | Höchstgeschwindigkeit | Vitesse maximale |
| `specs.range` | Electric Range | Elektrische Reichweite | Autonomie électrique |
| `specs.consumption` | Fuel Consumption | Kraftstoffverbrauch | Consommation |
| `specs.emissions` | CO₂ Emissions | CO₂-Emissionen | Émissions CO₂ |
| `specs.weight` | Weight | Gewicht | Poids |
| `specs.dimensions` | Dimensions | Abmessungen | Dimensions |
| `specs.trunk` | Trunk Capacity | Kofferraumvolumen | Volume du coffre |
| `compare.title` | Compare Models | Modelle vergleichen | Comparer les modèles |
| `lang.en` | English | Englisch | Anglais |
| `lang.de` | Deutsch | Deutsch | Allemand |
| `lang.fr` | Français | Französisch | Français |

---

## 11. Content Reuse Map

This table shows which components are **authored once and reused** across pages via experience fragments or content references.

| Component | Authored In | Reused In |
|---|---|---|
| Main Navigation (XF) | `experience-fragments/main-navigation/master` | Every page (header slot) |
| Mobile Navigation (XF) | `experience-fragments/main-navigation/mobile` | Every page (responsive header) |
| Footer (XF) | `experience-fragments/site-footer/master` | Every page (footer slot) |
| Promo Bar (XF) | `experience-fragments/promo-bar/master` | Homepage, Models listing |
| Model Cards | `models/` page children | Homepage model-lineup, Models listing |
| CTA "Test Drive" | Authored per-page but with same i18n keys | Homepage, Model detail pages, Models listing |
| Breadcrumb | Per-page (auto-generated from path) | All pages except homepage |

---

## 12. Country-Specific Variations

| Aspect | GB | DE | FR | CA |
|---|---|---|---|---|
| Currency | GBP (£) | EUR (€) | EUR (€) | CAD (CA$) |
| Price Format | £89,500 | 104.900 € | 104 900 € | 155 000 CA$ |
| Phone Format | +44 20 7946 0958 | +49 89 123 4567 | +33 1 23 45 67 89 | +1 416 555 0199 |
| Legal Entity | TUT Motors Ltd. | TUT Motors GmbH | TUT Motors SAS | TUT Motors Canada Inc. |
| HQ Address | 1 TUT Way, Mayfair, London W1K 1AA | TUT-Straße 1, 80331 München | 1 Avenue TUT, 75008 Paris | 100 TUT Drive, Toronto, ON M5V 1A1 |
| Dealer Count | 12 | 8 | 6 | 5 |
| Measurement | Metric + MPH mix | Metric | Metric | Metric |
| Language Switcher | No | No | No | Yes (en/fr) |
| Date Format | DD/MM/YYYY | DD.MM.YYYY | DD/MM/YYYY | YYYY-MM-DD |

### Dealer Locations (for map component)

**GB Dealers:**
| Name | Lat | Lng | Address | Phone |
|---|---|---|---|---|
| TUT London Mayfair | 51.5074 | -0.1478 | 1 TUT Way, London W1K 1AA | +44 20 7946 0958 |
| TUT Manchester | 53.4808 | -2.2426 | 100 Deansgate, Manchester M3 2GP | +44 161 555 0100 |
| TUT Edinburgh | 55.9533 | -3.1883 | 50 George St, Edinburgh EH2 2LR | +44 131 555 0200 |

**DE Dealers:**
| Name | Lat | Lng | Address | Phone |
|---|---|---|---|---|
| TUT München | 48.1351 | 11.5820 | TUT-Straße 1, 80331 München | +49 89 123 4567 |
| TUT Berlin | 52.5200 | 13.4050 | Kurfürstendamm 50, 10707 Berlin | +49 30 123 4567 |

**FR Dealers:**
| Name | Lat | Lng | Address | Phone |
|---|---|---|---|---|
| TUT Paris | 48.8698 | 2.3078 | 1 Avenue TUT, 75008 Paris | +33 1 23 45 67 89 |
| TUT Lyon | 45.7640 | 4.8357 | 20 Rue de la République, 69002 Lyon | +33 4 72 12 34 56 |

**CA Dealers:**
| Name | Lat | Lng | Address | Phone |
|---|---|---|---|---|
| TUT Toronto | 43.6532 | -79.3832 | 100 TUT Drive, Toronto, ON M5V 1A1 | +1 416 555 0199 |
| TUT Montréal | 45.5017 | -73.5673 | 500 Rue Sherbrooke O, Montréal, QC H3A 1B6 | +1 514 555 0199 |
| TUT Vancouver | 49.2827 | -123.1207 | 888 West Georgia St, Vancouver, BC V6C 3P6 | +1 604 555 0199 |

---

## 13. Page Count Summary

| Category | Pages per Locale | Locales | Total Pages |
|---|---|---|---|
| Homepage | 1 | 5 | 5 |
| Models (listing + 4 detail) | 5 | 5 | 25 |
| Innovation (hub + 3 sub) | 4 | 5 | 20 |
| Safety (hub + 2 sub) | 3 | 5 | 15 |
| About (hub + 2 sub) | 3 | 5 | 15 |
| Contact (hub + test drive) | 2 | 5 | 10 |
| Legal (hub + 3 sub) | 4 | 5 | 20 |
| **Total** | **22** | **5** | **110** |

| Category | Count |
|---|---|
| Experience Fragments (3 per locale × 5 locales) | 15 XF folders, 20 XF variations |
| Component Definitions (new) | 20 |
| PIM Products | 4 |
| PIM Variants | 14 |
| DAM Assets | ~75 files |
| i18n Dictionary Entries | ~45 keys × 5 locale instances = ~225 |

---

## 14. Implementation Order for Developer Agent

The developer agent should implement in this order to respect dependencies:

1. **Component Definitions** — Insert all 20 new `tut/*` component definitions into `component_definitions` table (Flyway migration).
2. **Sites** — Insert 4 sites into `sites` table + domain mappings.
3. **DAM Assets** — Create asset records in `assets` table with placeholder storage keys (actual files can be placeholder images).
4. **PIM Schema + Catalog** — Create `luxury-vehicle` schema, `TUT 2026 Collection` catalog.
5. **PIM Products + Variants** — Insert 4 products with 14 variants.
6. **Content Tree — GB (en)** — Create full page hierarchy for `sites.tut-gb.en` with all components. This is the **master content** that others derive from.
7. **Experience Fragments — GB** — Create navigation, footer, promo bar XFs.
8. **Content Tree — DE (de)** — Language copy from GB, translate all text properties.
9. **Experience Fragments — DE** — Localized navigation, footer, promo bar.
10. **Content Tree — FR (fr)** — Language copy, translate.
11. **Experience Fragments — FR** — Localized.
12. **Content Tree — CA (en)** — Copy from GB with Canada-specific pricing, addresses, and bilingual nav.
13. **Content Tree — CA (fr)** — Language copy from CA(en), translate.
14. **Experience Fragments — CA** — Both en and fr, with language switcher enabled.
15. **i18n Dictionary** — Insert all dictionary entries for all site/locale combinations.
16. **Publish all pages** — Set status to PUBLISHED for all content nodes.

---

## 15. Validation Checklist

After seeding, the following must be verifiable:

- [ ] All 4 sites accessible via API
- [ ] Each site has complete page tree (22 pages per locale)
- [ ] Navigation XF resolves correctly for each site
- [ ] Footer XF resolves correctly for each site
- [ ] Homepage renders with hero, model lineup, features, testimonials, CTA
- [ ] Model detail pages show PIM product data
- [ ] Canada site has working language switcher in navigation
- [ ] All i18n dictionary keys return correct translations
- [ ] DAM assets referenced from components exist in asset table
- [ ] PIM products have correct variants with per-market pricing
- [ ] Breadcrumb component generates correct paths
- [ ] Content tree depth matches specification (max 4 levels)
- [ ] All pages have status = PUBLISHED
