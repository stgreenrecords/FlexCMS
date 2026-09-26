# Experience Fragments — Business Logic, Requirements & Implementation Guide

> **This document is authoritative for all Experience Fragment implementation in FlexCMS.**
> Any agent implementing XF-related features (navigation, footer, reusable blocks) MUST read
> this document in full before writing a single line of code.

---

## 1. What an Experience Fragment Is

An Experience Fragment is a reusable, managed content block that combines:

- Structure or layout
- Content
- Optional behavior or configuration
- Publishing and governance rules

It is authored **once** and reused across many pages, channels, regions, or sites.

Unlike a simple shared snippet, an Experience Fragment has:

- Its own lifecycle
- Versioning
- Localization
- Variation support
- Permissions
- Publishing workflow
- Optional inheritance or rollout behavior across site hierarchies

**Examples:** global header, footer, newsletter signup block, legal disclaimer, promotional hero banner, regional store locator block, campaign ribbon, reusable product teaser section.

---

## 2. Business Logic — Five Problems Solved

### 2.1 Centralized Reuse
Editors should not rebuild the same navigation, footer, or campaign section on many pages. One managed fragment is reused everywhere.

### 2.2 Brand Consistency
Common experiences stay visually and structurally aligned across many pages and sites.

### 2.3 Faster Content Operations
Marketing teams can update a fragment once and have the change reflected everywhere it is referenced.

### 2.4 Controlled Localization and Regionalization
A base fragment exists globally; regions or brands create localized or overridden versions.

### 2.5 Governance and Risk Reduction
Legal text, compliance blocks, consent-related notices, and other sensitive content are managed in one place with approvals and audit trail.

---

## 3. Core Behavior

### 3.1 Fragment as a First-Class Content Type

A fragment is stored as its own content entity — not embedded JSON inside a page.

**Required fields:**
```
id
name
slug / unique key
fragment type
status (draft, approved, published, archived)
channel scope
locale
market / brand / site scope
variation
version
owner / team
tags
effective date / expiration date
content payload
presentation config
inheritance source (if derived from parent/global)
dependencies / references
```

### 3.2 Referenced, Not Duplicated

Pages store a **reference** to the fragment, not a copy of its full content.

Benefits:
- One source of truth
- Easier updates
- Lower risk of content drift

**Optional exception:** allow "detach from source" for rare cases where a page needs a one-off copy.

### 3.3 Render at Runtime or Delivery Time

Flow:
1. Page contains fragment reference
2. Rendering layer resolves correct variation
3. Rules check locale / site / channel / audience
4. Published fragment content is injected
5. Final output returned to web/app/channel

### 3.4 Variation Resolution

Priority order when determining which fragment variation to serve:

1. Exact site + locale + channel match
2. Site + locale
3. Global locale
4. Global default

This is critical for headers, footers, and regulatory content.

### 3.5 Shared but Governed

A fragment update may affect dozens or hundreds of pages. The system must show this before publishing:
- "Used on 142 pages"
- "Used in 3 locales"
- "Impacts web and mobile app"

---

## 4. Content Model

### 4.1 Fragment Types

Define fragment types up front — each has its own schema:

| Type | Example Use |
|------|-------------|
| `header` | Global site header with navigation |
| `footer` | Global footer with links, legal, social |
| `navigation-menu` | Primary nav or mega-menu group |
| `promo-banner` | Campaign or seasonal hero |
| `newsletter-signup` | Inline or modal email capture block |
| `legal-notice` | Compliance disclaimer, consent text |
| `social-links` | Social follow icons |
| `cta-strip` | Row of conversion CTAs |
| `product-teaser-grid` | Reusable product highlight section |
| `campaign-hero` | Time-limited campaign hero |

### 4.2 Example Generic Schema

```json
{
  "id": "footer-global-en",
  "type": "footer",
  "title": "Global Footer - English",
  "locale": "en",
  "siteScope": "global",
  "channelScope": ["web"],
  "status": "published",
  "variation": "default",
  "content": {
    "columns": [
      {
        "heading": "Products",
        "links": [
          {"label": "Pricing", "url": "/pricing"},
          {"label": "Features", "url": "/features"}
        ]
      },
      {
        "heading": "Company",
        "links": [
          {"label": "About", "url": "/about"},
          {"label": "Careers", "url": "/careers"}
        ]
      }
    ],
    "legalText": "© Company Name",
    "socialLinks": [
      {"platform": "LinkedIn", "url": "https://..."}
    ]
  },
  "settings": {
    "theme": "dark",
    "showLanguageSelector": true
  },
  "references": [],
  "inheritsFrom": null,
  "effectiveFrom": "2026-03-01T00:00:00Z",
  "expiresAt": null
}
```

---

## 5. Use Cases

### 5.1 Navigation

**Business need:** Same top navigation across all corporate pages, with different menu items by region.

**Behavior:**
- Global navigation fragment defines the default structure
- Country sites inherit it
- Local teams can override: labels, destination URLs, featured CTA, language switcher visibility

**Delivery:** At render time, `/de` resolves German navigation; `/fr` resolves French; missing → fallback to global default.

### 5.2 Footer

**Business need:** Footer is reused everywhere and contains legal links, social links, contact details, and regional compliance statements.

**Behavior:**
- Global footer exists
- Certain markets override only the legal section
- Footer can include dynamic year, region selector, and policy links

**Why fragment-based:** Without fragments, footer changes require hundreds of page edits. One publish updates all consuming pages.

### 5.3 Newsletter Subscription Block

**Business need:** Reusable signup component appearing in blog, article, and campaign landing pages.

**Fragment separates:**
- Presentation content: title, text, CTA label
- Integration config: form endpoint, list ID, consent policy ID
- Behavior config: modal vs inline, success state, validation rules

### 5.4 Promo Banner / Seasonal Campaign

**Business need:** Short campaign across many pages, activated and deactivated centrally.

**Fragment includes:** campaign image, CTA, text, scheduling dates, audience rules, optional countdown/badge.

### 5.5 Legal Disclaimer

**Business need:** Compliance requires exact wording on product pages in specific countries.

**Behavior:** global base + regional overrides + strict approval workflow + publish only after legal approval + visible impact list before publish. This is the strongest business case for fragments.

---

## 6. Content Authoring Experience

### 6.1 Create Fragment Independently

Authors create fragments from a central library — not only from inside a page.

**Actions:** create new, duplicate, localize, create variation, compare versions, preview, publish.

### 6.2 Insert Fragment into Page

On a page, the author inserts a **fragment reference component**.

**Options:** search existing fragment, filter by type/locale/status/tags, pick variation, optionally override display settings, preview inline.

**Rule:** Page authors cannot edit the fragment's master content directly from the page unless they have explicit permission.

### 6.3 Preview Experience

Authors must preview:
- Fragment alone
- Fragment inside page context
- Different locales
- Different device breakpoints
- Different audience or channel variants

### 6.4 Usage Visibility

When editing a fragment, authors see:
- Where it is used
- Which pages will be affected
- Which locales depend on it
- Whether there are inherited children

### 6.5 Safe Editing Model

- Draft edits do not affect published pages
- Only published fragment versions are resolved in production
- Preview can show draft state to authorized users

### 6.6 Inline vs Structured Editing

**Prefer structured fields over freeform HTML:**

✅ Good: `menuItems[]`, `legalLinks[]`, `cta: object`, `iconReferences[]`

❌ Bad: one giant rich text field for the whole footer

Structured content makes localization, validation, and reuse easier.

---

## 7. Hierarchical Fragment Inheritance (MSM-like)

### 7.1 Concept

A fragment can have:
- A source/master
- One or more derived copies
- Controlled inheritance rules

**Example hierarchy:**
```
Global
├── EMEA
│   ├── Germany
│   └── France
└── Americas
    ├── US
    └── Canada
```

A derived fragment starts from its parent and can inherit updates automatically or selectively.

### 7.2 Inheritance Modes

| Mode | Behavior | Best For |
|------|----------|----------|
| **Full inheritance** | Child always follows parent; no local editing | Legal boilerplate, corporate brand footer, universal consent |
| **Selective inheritance** | Child inherits parent unless specific fields are unlocked | Navigation labels, regional contact details, newsletter list IDs |
| **Detached copy** | Initially copies parent, then becomes independent | One-off campaigns, region-specific redesign |

### 7.3 Field-Level Inheritance

Most powerful model. Example:

```
inherit layout:          locked
inherit social links:    locked
inherit legal links:     locked
localize CTA label:      editable
localize contact phone:  editable
```

### 7.4 Rollout Behavior

Parent fragment update triggers rollout to children.

**Rollout options:**
- Automatic rollout to all inheriting children
- Manual review rollout
- Rollout only to locked fields
- Rollout with conflict detection

**Conflict example:** Parent changes footer column structure, but Germany locally changed one column label → preserve local override where allowed, apply new parent structure where not overridden, flag conflicts for review.

### 7.5 Audit and Comparison

For inherited fragments, authors need:
- Diff against parent
- List of overridden fields
- Last rollout date
- Pending parent changes
- "Reset to inherited value" action

---

## 8. Publishing Model

### 8.1 Independent Publishing

A fragment is publishable on its own. Header change should not require republishing 500 pages.

### 8.2 Dependency Awareness

When publishing a fragment, the system understands:
- Which pages reference it
- Which APIs expose it
- Which locales consume it

Cache invalidation or delivery refresh must happen even if pages are not republished.

### 8.3 Workflow States

```
Draft → In Review → Approved → Scheduled → Published → Expired → Archived
```

**Stricter workflows by type:**
- Newsletter block: marketing approval
- Legal disclaimer: legal approval
- Global header: brand + platform owner approval

### 8.4 Scheduled Publishing

Fragments support activation/deactivation without page edits.

Examples: Black Friday ribbon Nov 20–30, seasonal footer promo, temporary tax notice.

### 8.5 Cache Invalidation

Publishing a fragment must invalidate:
- Page cache
- Edge cache / CDN cache
- API response cache
- SSR render cache

Otherwise authors publish a footer change but users still see stale content.

### 8.6 Rollback

A fragment supports rollback to a previous published version.

Critical for: broken nav, incorrect legal copy, malformed markup in global footer.

---

## 9. Technical Implementation

### 9.1 Server-Side Resolved References

Pages reference fragments; server injects fragment content during rendering.

**Best when:** site is server-rendered, caching is controlled centrally, SEO matters for fragment content.

### 9.2 API-First Resolved References

Page API returns resolved fragment payloads.

**Best when:** frontend is SPA or app, multiple channels consume same content, headless delivery is required.

### 9.3 Hybrid

Page stores fragment references; clients can receive fully resolved content or references and resolve separately.

**FlexCMS uses this model:** Author API stores references, Headless/Publish API resolves them in delivery response.

---

## 10. Governance Rules

| Concern | Rule |
|---------|------|
| Ownership | Define which team owns each fragment type (brand, legal, content ops, regional marketing) |
| Override scope | Define which fields local markets can change per fragment type |
| Fallback | If localized fragment is missing → show default version → log warning → hide slot if nothing valid |
| Publish rights | Global fragments require platform owner approval; local fragments allow regional team publish |
| Usage restrictions | Some fragment types restricted to certain templates/slots |
| Lifecycle | Define when a fragment expires or is auto-archived |
| Dependency policy | Pages fail gracefully if a fragment is missing — never error page |

---

## 11. Behavior Rules Summary

| Rule | Statement |
|------|-----------|
| 1 | Fragments are centrally managed reusable entities with their own lifecycle |
| 2 | Pages reference fragments by ID, not by copied content |
| 3 | Only published fragment versions appear to end users |
| 4 | Context resolution (locale/site/channel) decides which variation to render |
| 5 | Inheritance supports global-to-local rollout with optional field-level overrides |
| 6 | Any fragment change shows impact analysis before publish |
| 7 | Publishing a fragment triggers delivery refresh and cache invalidation |
| 8 | All fragment types support version history and rollback |

---

## 12. Minimal Architecture

```
Authoring UI
  └── Fragment Library (central, standalone — not inside page editor)
  └── Page Editor → Fragment Reference Slot (read-only, locked for nav/footer)

CMS Backend
  └── Fragment Content Type (first-class entity, own table)
  └── Versioning
  └── Workflow Engine
  └── Localization
  └── Inheritance / Rollout Engine
  └── Usage Registry

Delivery Layer
  └── Fragment Resolver
  └── Context Resolver (locale / site / channel)
  └── Cache + Invalidation
  └── Rendering / API Output
```

---

## 13. End-to-End Example Flow (Footer)

1. Global team creates `footer-global-en`
2. France creates `footer-fr` inheriting from global
3. France overrides only legal and contact fields
4. Many pages reference the "Footer" slot — not a hardcoded footer copy
5. Global team updates social links in parent
6. Rollout updates all inheriting children except locally overridden fields
7. Author reviews impact ("Used on 89 pages, 3 locales")
8. Fragment is published
9. All pages using the footer reflect updated content after cache refresh

---

## 14. Common Mistakes to Avoid

| Mistake | Why It Matters |
|---------|---------------|
| Treating fragments like plain HTML snippets | Makes localization, governance, preview, and reuse harder |
| No usage visibility | Authors break things without knowing the impact |
| No fallback strategy | Localized content will sometimes be missing |
| Overusing page-level overrides | Defeats the purpose of centralized reuse |
| No field-level inheritance | Local teams either lose flexibility or duplicate everything |
| Coupling fragment to one page template | Fragments must stay reusable across templates |
| No version rollback | A broken global fragment can impact the whole site |

---

## 15. Implementation Requirements Checklist

### Must-Have
- [ ] Fragment as standalone content type
- [ ] Reusable by reference (not copy)
- [ ] Versioning
- [ ] Workflow (draft → approved → published)
- [ ] Localization support
- [ ] Preview (standalone + in-page context)
- [ ] Usage tracking ("used on N pages")
- [ ] Publish / unpublish
- [ ] Cache invalidation on publish
- [ ] Fallback resolution (locale → global → hide)

### Strongly Recommended
- [ ] Inheritance (global → regional → local)
- [ ] Selective field-level overrides
- [ ] Rollout controls
- [ ] Diff / compare versions
- [ ] Scheduled publish / expiry
- [ ] Impact analysis before publish

### Nice to Have
- [ ] Experimentation / A-B variant support
- [ ] Audience targeting per variation
- [ ] Analytics per fragment
- [ ] Omnichannel rendering variants

---

## 16. FlexCMS Implementation Notes

- `V12__experience_fragment_support.sql` created the initial XF table structure.
- XF content nodes live under the path `content/experience-fragments/` in the ltree content tree.
- The Author API exposes XF management at `GET/POST/PUT /api/author/content/experience-fragments`.
- The Headless Delivery API resolves XF references inline when rendering page content.
- **Navigation and Footer** fragments for TUT USA are created under:
  - `/content/experience-fragments/tut-usa/global/navigation`
  - `/content/experience-fragments/tut-usa/global/footer`
- These XF paths are **locked** in the page editor — authors see a read-only reference with an "Edit in Experience Fragments" link; they cannot move, edit, or delete navigation/footer from the page canvas.
