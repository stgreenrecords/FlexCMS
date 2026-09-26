# ECMS-00 — FlexCMS vs an Enterprise-Level CMS: Gap Analysis

- Date: 2026-09-24 local
- Reference: the enterprise-level CMS core-features document in the repository root, covering **native** platform capabilities only; third-party integrations (analytics, targeting, project-management, translation vendors, external document stores) are excluded there and here.
- FlexCMS state: code on `main` at `0eb8541`, live stack probed 2026-09-24, `docs/testing/MANUAL_TEST_CASES_AUTHORING.md` §20 Known Gaps Register.

## How to read this

| Status | Meaning |
|---|---|
| ✅ Present | Exists end to end (API and UI where an enterprise CMS has UI). |
| 🟡 Partial | Exists but materially narrower than the enterprise baseline. |
| 🔌 API-only | Backend capability exists; no authoring UI reaches it. |
| ❌ Missing | Nothing equivalent exists. |

Every non-✅ row names the task that closes it. Tasks are `backlog/tasks/ECMS-NN.md`; their status is on `backlog/BOARD.md`.

Architectural constraint carried into every task: **the backend returns JSON only and never renders HTML** (`CLAUDE.md`). Where an enterprise CMS produces HTML server-side (e.g. a plain-HTML fragment export), the FlexCMS equivalent is produced by the frontend render service, not by a Java controller.

---

## 1. Authoring experience

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Page console: browse tree, list view, filter | Content Tree with drill-down, breadcrumb, name/URL filter, multi-select | ✅ | `frontend/apps/admin/src/app/(admin)/content/page.tsx` | — |
| Create / move / delete / lock / publish pages | API exists (`POST/DELETE /node`, `/node/move`, `/node/lock`, `/node/status`, `/bulk/*`); UI buttons **inert** (+ Create New Page, row Publish/Move/Delete, Publish All) | 🔌 | `AuthorContentController`; test doc GAP-030/031 | ECMS-05 |
| Copy and rename pages | No copy endpoint (only live copy, which creates a sync relationship); no rename endpoint | ❌ | `AuthorContentController` endpoint list | ECMS-04 |
| References ("where is this used") | Only component-registry usages; nothing for pages, assets, fragments | ❌ | `ComponentRegistryController` | ECMS-02 |
| Visual editor: drag-drop, reorder, duplicate, delete, undo/redo | Present (palette drag-drop fixed in `EDITOR-PALETTE-DND`; 50-step history) | ✅ | `frontend/apps/admin/src/app/editor/page.tsx` | — |
| Copy/cut/paste components, inline text editing | Absent — properties panel only | ❌ | editor | ECMS-13 |
| Responsive layout mode (size/hide/order per breakpoint) | Viewport toggle only changes canvas width | ❌ | editor | ECMS-14 |
| Preview mode | `/preview` Draft/Live + device frames | ✅ | `preview/page.tsx` | — |
| Historical as-of view (see the page as it was on a date) | Absent | ❌ | — | ECMS-08, ECMS-09 |
| Review annotations on components | Absent | ❌ | — | ECMS-10, ECMS-11 |
| Framework-agnostic visual editing of external frontends | Editor is bound to the bundled renderers | ❌ | — | ECMS-15 |
| Page properties (nav title, description, tags, vanity URL, on/off time, redirect, thumbnail, social) | Free-form JSONB `properties` (`jcr:title`, `template`); on/off time only via `scheduledPublishAt`/`scheduledDeactivateAt` API; **no page-properties UI** | 🟡 | `ContentNode` | ECMS-06, ECMS-07 |
| Versioning: auto versions, compare, restore | Snapshot on every property change + restore API; **no compare, no labels, no UI** | 🔌 | `/node/versions`, `/node/restore` | ECMS-08, ECMS-09 |
| Audit log | Full query API (`/api/author/audit`); **no UI** (Dashboard link inert) | 🔌 | `AuditLogController` | ECMS-17 |
| Scheduled publishing / publish later | API + 60 s scheduler; **no UI** | 🔌 | `ScheduledPublishingService` | ECMS-05, ECMS-07 |
| Bulk actions | Bulk publish/move/delete API; UI multi-select present but actions inert | 🔌 | `/bulk/*` | ECMS-05 |
| Spreadsheet-style bulk property editor | Absent | ❌ | — | ECMS-16 |
| Rich text editor with per-template restrictions and Word paste filtering | **No RTE library** in the admin app — textareas only; server-side `RichTextSanitizer` exists | 🟡 | `frontend/apps/admin/package.json`; `RichTextSanitizer` | ECMS-12 |

## 2. Components and editable templates

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Component model with edit dialog + JSON export | `component_definitions` with `dataSchema`, `dialog`; schema-driven properties panel | ✅ | `ComponentDefinition`, `/api/content/v1/component-registry` | — |
| Maintained generic core component library (text, title, image, teaser, list, carousel, accordion, tabs, breadcrumb, navigation, search, embed…) | 420 registered, but ~410 are sample-site-specific; the generic set is `flexcms/rich-text`, `image`, `container`, `shared-header/footer` and fragment types | 🟡 | registry probe 2026-09-24 | ECMS-22 |
| Editable templates: structure / initial content / policies | Data model already has `structure`, `initialContent`, `pageProperties`, `allowedSites`; 21 seeded; editor honours template-locked components and "Cancel inheritance". **Read-only API, seed-only, no template editor, no enable/disable, no propagation** | 🟡 | `TemplateDefinition`, `TemplateDefinitionController` | ECMS-18, ECMS-20 |
| Policies (allowed components per container, component settings) | `ComponentDefinition.policies` JSONB column exists; nothing manages or enforces it; palette restriction is client-side | 🟡 | `ComponentDefinition` | ECMS-19, ECMS-20 |
| Component style variants (named style groups mapped to CSS classes) | Absent | ❌ | — | ECMS-19, ECMS-21 |

## 3. Multi-site management

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Blueprint → live copy (deep), rollout, detach, excluded properties | Present in API (`/api/author/livecopy`) | 🔌 | `LiveCopyController`, `LiveCopyService` | ECMS-24 |
| Rollout configurations and triggers (on activation, on modify, scheduled) | Manual rollout only | ❌ | `LiveCopyService` | ECMS-23 |
| Per-page/component cancel + **re-enable** inheritance, suspend/resume | Only full detach | ❌ | — | ECMS-23 |
| Conflict handling, live-copy overview console | Absent; rollout of a nonexistent source answers 200 `updatedNodes=0` | ❌ | REB-22 observation | ECMS-23, ECMS-24 |

## 4. Translation and localisation

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Language roots and language copies | `POST /api/admin/sites/{id}/languages/{locale}` deep-copies a locale subtree (DRAFT); `LanguageCopy.syncStatus` recorded | 🔌 | `SiteAdminController`, `TranslationService` | ECMS-27, ECMS-28 |
| i18n dictionaries | `I18nService` + tables exist; **no REST endpoint**; Translations page fetches nothing | 🔌 | test doc GAP-020/080 | ECMS-25, ECMS-26 |
| Translation projects/jobs, review, delta update of language copies | Absent | ❌ | — | ECMS-27, ECMS-28 |
| Translation rules (which properties are translatable) | Absent | ❌ | — | ECMS-27 |
| Machine-translation connector framework | `TranslationConnector` + DeepL implemented; **no endpoint** | 🔌 | test doc GAP-081 | ECMS-27 |
| Multilingual tags, hreflang | No tags; no hreflang | ❌ | — | ECMS-01, ECMS-59 |

## 5. Replication and publishing

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Author/publish separation, activate/deactivate/delete replication | RabbitMQ replication, tree replication for pages/fragments, delete + deactivate replicated (fixed 2026-08-23) | ✅ | `flexcms-replication` | — |
| Cache invalidation + CDN purge on publish | Redis/Caffeine invalidation, CDN purge SPI (Cloudflare, CloudFront), surrogate keys | ✅ | `flexcms-cache`, `flexcms-cdn` | — |
| **Assets delivered to the public** | **No publish-side asset delivery** — a published page referencing a DAM asset renders a dead image; assets are never replicated | ❌ | `R-REB-21-003` (Open), test doc GAP-084 | **ECMS-03 (P0)** |
| Replication queue health, retry, pause | Log API only; every entry stays `PENDING` forever | 🟡 | test doc GAP-100 | ECMS-29, ECMS-30 |
| Publish with references (include referenced assets/fragments and children, show what goes live) | Absent | ❌ | — | ECMS-29, ECMS-30 |
| Preview tier between author and publish | Absent | ❌ | — | ECMS-31 |

## 6. Staged releases and scheduling

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Staged releases (parallel future version of a subtree, sync from source, promote, nested) | Absent | ❌ | — | ECMS-32, ECMS-33 |
| On/off time, publish later / unpublish later | API only | 🔌 | `/node/schedule-*` | ECMS-05, ECMS-07 |

## 7. Structured content fragments and headless delivery

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Fragment models (typed fields, fragment references, validation, locking) | Absent (only page components and PIM schemas) | ❌ | — | ECMS-34, ECMS-36 |
| Fragment editor, variations, versioning, references | Absent | ❌ | — | ECMS-34, ECMS-36 |
| GraphQL generated from models, persisted queries | GraphQL exists for pages/nodes/navigation/search/assets/components/PIM; **not model-driven, no persisted queries** | 🟡 | `schema.graphqls` | ECMS-35 |
| JSON export of pages | Headless REST page/node/navigation/sitemap APIs | ✅ | `flexcms-headless` | — |
| Hybrid: a fragment placed on a page | Absent | ❌ | — | ECMS-37 |

## 8. Experience Fragments

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Reusable fragments with variations, placement on pages, publish | Present (create/list/delete, variations, locked header/footer bands, subtree publish) | ✅ | `ExperienceFragmentController` | — |
| Fragment console completeness (create, channel management, references) | "+ Create Fragment" and "Manage Channels" inert; no references | 🟡 | test doc GAP-037 | ECMS-38 |
| Plain HTML / JSON export, variations as live copies of master | Absent | ❌ | — | ECMS-39 |
| Building blocks | Absent | ❌ | — | ECMS-40 |

## 9. Digital Asset Management

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Upload, MIME sniffing, size cap, auto renditions, dimensions | Present (Tika detection, executable deny-list, 4 auto profiles) | ✅ | `AssetIngestService`, `RenditionPipelineService` | — |
| Metadata editing, move/rename | **No update/move endpoint**; Asset Detail Save/Discard inert | ❌ | test doc GAP-022, DAM-090 | ECMS-41, ECMS-42 |
| Embedded metadata extraction (EXIF/XMP/IPTC), duplicate detection | Absent | ❌ | — | ECMS-41 |
| Metadata schemas, folder metadata/processing profiles | Absent | ❌ | — | ECMS-43 |
| Tagging | No tagging concept at all (AI auto-tagging is out of scope for this pass) | ❌ | — | ECMS-01 |
| Asset versioning, check-in/out, expiry/licence, review | Absent | ❌ | — | ECMS-44 |
| Collections, share links, download with rendition choice, reports | Absent (single-file download only) | ❌ | — | ECMS-45 |
| References ("where is this asset used") | Asset Detail panel always empty | ❌ | test doc GAP-026 | ECMS-02, ECMS-42 |
| In-browser crop, focal-point cropping, on-demand renditions | Profiles `hero-*`/`og-image` unreachable; no crop | ❌ | test doc GAP-082 | ECMS-46 |

## 10. On-demand media delivery

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| URL-based image transforms, named presets, automatic WebP/AVIF, focal-point crop | Absent (fixed pre-generated renditions) | ❌ | — | ECMS-46 |
| Adaptive video, video profiles, image/spin sets, viewers | Absent | ❌ | — | ECMS-47 |

## 11. Workflows, projects and governance

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Workflow engine with models | JSON-defined engine, one seeded `standard-publish`, start/advance/cancel | 🟡 | `WorkflowEngine` | ECMS-48 |
| Visual model editor, participant/group assignment, splits, timeouts/escalation | Absent; step→status mapping hardcoded | ❌ | — | ECMS-48, ECMS-50 |
| Per-user inbox, tasks, delegate, comments | Inbox approve/reject exists; `for-user` ignores the user; UI reports success on API failure | 🟡 | test doc GAP-101, GAP-109 | ECMS-48, ECMS-51 |
| Workflow console (monitor/terminate/retry), completion | Absent; instances never complete | ❌ | test doc GAP-102 | ECMS-48, ECMS-51 |
| Event-triggered workflows and notifications | Absent | ❌ | — | ECMS-49 |
| Project workspaces | Absent | ❌ | — | ECMS-55 |
| Path ACLs with inheritance, allow/deny | Present in API (`/api/author/acl`); **no UI** | 🔌 | `NodeAclController` | ECMS-53 |
| Users/groups management | Delegated to Keycloak JWT roles; no in-product management | ❌ | `SecurityConfig` | ECMS-52, ECMS-53 |
| Closed user groups on published content, permission-sensitive caching | Absent | ❌ | — | ECMS-54 |
| Page locking | Present in API; editor shows no lock state | 🔌 | `/node/lock` | ECMS-05 |
| Version/audit/workflow purge, operations dashboard | Absent; `/settings` is a phantom route | ❌ | test doc GAP-001 | ECMS-56, ECMS-57 |

## 12. Forms

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Form builder, rules, submit actions, document of record | Absent — the 42 form components render read-only on the reference site | ❌ | `R-REB-26-004` | ECMS-58 |

## 13. Delivery and performance

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Static/edge delivery | `build-worker` static compilation driven by a page dependency graph | ✅ | `frontend/apps/build-worker`, `BuildDependencyController` | — |
| Multi-layer caching, CDN purge, client libraries | Present | ✅ | `flexcms-cache`, `flexcms-cdn`, `flexcms-clientlibs` | — |
| Real-user monitoring (Core Web Vitals) | Absent | ❌ | — | ECMS-64 |

## 14. Search, SEO, personalisation

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Site/content search | Elasticsearch index maintained on replication; search API + GraphQL | 🟡 | `flexcms-search` | ECMS-61 |
| Facets, suggestions, spellcheck, reindex | Present for PIM only; content has **no reindex endpoint** | ❌ | test doc GAP-083 | ECMS-61 |
| Authoring omnisearch | Top-bar search inert | ❌ | test doc GAP-010 | ECMS-62 |
| Sitemaps | Present | ✅ | `SitemapApiController` | — |
| Vanity URLs, redirects, hreflang, canonical, OG/Twitter, JSON-LD | Absent | ❌ | code probe 2026-09-24 | ECMS-59, ECMS-60 |
| Visitor context, segments, targeted experiences, A/B allocation | Absent | ❌ | — | ECMS-63 |

## 15. Platform and extensibility

| Enterprise capability | FlexCMS today | Status | Evidence | Task |
|---|---|---|---|---|
| Single repository with uniform versions/ACL/search | PostgreSQL ltree + JSONB content tree (PIM deliberately separate) | ✅ | `flexcms-core` | — |
| Modular runtime + extension SPI | Maven modules + `flexcms-plugin-api` (ComponentModel, CdnProvider, WorkflowStep) | ✅ | — | — |
| Content packages export/import | API present; **no package manager UI** | 🔌 | `ContentImportExportController` | ECMS-65 |
| Events / webhooks for integrations | Internal Spring events + RabbitMQ only; no external subscription | ❌ | — | ECMS-66 |
| CI quality gates | `mvn verify` (unit + Testcontainers IT), Selenium smoke/full gates | ✅ | `CLAUDE.md` | — |

---

## Where FlexCMS already exceeds the enterprise baseline

Recorded so no gap task accidentally regresses them:

- **PIM** (catalogs, versioned schemas, variants, year-over-year carryforward, CSV/Excel/JSON import, PIM→CMS republish bridge).
- **Framework-agnostic SDKs** (`@flexcms/react`, `@flexcms/vue`, `@flexcms/sdk`) and a reference site in both Next.js and Nuxt.
- **Static build dependency graph** that rebuilds only pages affected by a change.

## Deliberately out of scope for this gap pass

- AI-dependent features: auto-tagging, visual/similarity search, automated legacy-form conversion, colour-swatch extraction. These need a model/vendor decision first.
- Anything the reference document classes as a third-party integration.
- Managed-cloud operations tooling — FlexCMS's equivalent is its Docker/Maven/Selenium pipeline.
- Pre-existing **defects** that are not capability gaps (frontend findings FINDING-01..10 in `docs/FLEXCMS_AUTHORING_TEST_RUN_2026-09-14.md`, `R-REB-19-003`). The one that sits inside a gap task's surface is folded into it as an acceptance criterion: WF-013 → ECMS-51.

## Task index

66 tasks, `ECMS-01`…`ECMS-66`. Priority reflects the business impact in the reference document's business-function tables plus how many other tasks each one unblocks.

| Priority | Count | Tasks |
|---|---|---|
| P0 | 1 | ECMS-03 |
| P1 | 29 | ECMS-01, 02, 04, 05, 06, 07, 08, 09, 12, 18, 19, 20, 21, 23, 24, 25, 26, 29, 30, 34, 35, 36, 38, 41, 42, 48, 51, 59, 60 |
| P2 | 22 | ECMS-10, 11, 13, 14, 17, 22, 27, 28, 32, 33, 37, 39, 43, 44, 46, 49, 50, 52, 53, 61, 62, 66 |
| P3 | 14 | ECMS-15, 16, 31, 40, 45, 47, 54, 55, 56, 57, 58, 63, 64, 65 |

Suggested first wave (all dependency-free, so they can run in parallel): **ECMS-03, ECMS-01, ECMS-02, ECMS-04, ECMS-08, ECMS-25, ECMS-41, ECMS-18, ECMS-23, ECMS-48**. Together they unblock most of the remaining tasks.
