# FlexCMS Backlog Board

**The single source of truth for task status.** Specs live in `backlog/tasks/<ID>.md`, and the process is in [`docs/process/SDLC.md`](../docs/process/SDLC.md).

- **Pick the next task:** resume **In Progress**. Otherwise take the first **Ready** row whose *Depends on* tasks are all **Done**. Otherwise refine the first eligible **Needs Refinement** row ([SDLC §3](../docs/process/SDLC.md#3-picking-the-next-task)).
- **Change a status:** move the row to the new table, keep each table sorted P0 → P3 (bugs, then tests, then features within a priority), and add a Log line to the spec.
- **Next free IDs:** `BUG-015` · `FEAT-002` · `TEST-010` · `TECH-002` · `ECMS-67`

| In Progress | Ready | Needs Refinement | Blocked | Done |
|---|---|---|---|---|
| 1 | 36 | 54 | 0 | 3 |

## In Progress

At most one task per agent.

| ID | P | Type | Area | Title | Depends on |
|---|---|---|---|---|---|
| [ECMS-03B](tasks/ECMS-03B.md) | P0 | Story | Frontend | Frontend: reference site and admin use canonical asset URLs | ECMS-03A |

## Ready

Meets the Definition of Ready. Build it once every task in *Depends on* is Done. Tasks migrated on 2026-09-26 carry test-case tables marked **Draft**; finalizing that table is the first step of implementing them ([SDLC §5](../docs/process/SDLC.md#5-implementation-workflow), step 2).

| ID | P | Type | Area | Title | Depends on |
|---|---|---|---|---|---|
| [BUG-001](tasks/BUG-001.md) | P1 | Bug | Admin UI | PIM Import Wizard target-catalog dropdown is always empty | — |
| [BUG-002](tasks/BUG-002.md) | P1 | Bug | Admin UI | Workflow approve/reject shows success when the API call fails | — |
| [BUG-005](tasks/BUG-005.md) | P1 | Bug | Admin UI | Material Symbols icon font never loads; icon buttons show ligature text | — |
| [TEST-001](tasks/TEST-001.md) | P1 | Test | Tests | Live Playwright foundation: data factories, cleanup, and a CI job for the live suite | — |
| [TEST-002](tasks/TEST-002.md) | P1 | Test | Site | Port public-site template and link-integrity suites from Selenium to Playwright | TEST-001 |
| [TEST-004](tasks/TEST-004.md) | P1 | Test | Tests | Port content-tree lifecycle and authoring round-trip suites to Playwright | TEST-001 |
| [TEST-005](tasks/TEST-005.md) | P1 | Test | Tests | Port page-editor suites (authoring matrix, WYSIWYG canvas, component editing sweep) to Playwright | TEST-001 |
| [TEST-006](tasks/TEST-006.md) | P1 | Test | Tests | Port publishing/workflow, reusable-content, and secondary-route suites to Playwright | TEST-001 |
| [TEST-007](tasks/TEST-007.md) | P1 | Test | Tests | Port DAM and PIM authoring suites to Playwright | TEST-001 |
| [TEST-008](tasks/TEST-008.md) | P1 | Test | Tests | Automate the unverified 2026-09-14 exception-handling fixes as Playwright API regression tests | — |
| [ECMS-01](tasks/ECMS-01.md) | P1 | Story | Backend | Taxonomy and tagging service for pages, assets, and fragments | — |
| [ECMS-04](tasks/ECMS-04.md) | P1 | Story | Backend | Page copy and rename API | — |
| [ECMS-05](tasks/ECMS-05.md) | P1 | Story | Frontend | Content Tree page operations wired end to end | ECMS-04 |
| [ECMS-06](tasks/ECMS-06.md) | P1 | Story | Backend | Page properties contract and validation | ECMS-01 |
| [ECMS-08](tasks/ECMS-08.md) | P1 | Story | Backend | Version compare, labels, and historical as-of view API | — |
| [ECMS-25](tasks/ECMS-25.md) | P1 | Story | Backend | i18n dictionary REST API with import/export | — |
| [ECMS-26](tasks/ECMS-26.md) | P1 | Story | Frontend | Translations page wired to the dictionary API | ECMS-25 |
| [ECMS-41](tasks/ECMS-41.md) | P1 | Story | Backend | Asset metadata and lifecycle API | — |
| [ECMS-42](tasks/ECMS-42.md) | P1 | Story | Frontend | Asset Detail page wired end to end | ECMS-41, ECMS-02 |
| [ECMS-51](tasks/ECMS-51.md) | P1 | Story | Frontend | Inbox v2 and workflow administration console | ECMS-48 |
| [BUG-003](tasks/BUG-003.md) | P2 | Bug | Admin UI | Dashboard "Active Sites" undercounts | — |
| [BUG-004](tasks/BUG-004.md) | P2 | Bug | Admin UI | Experience Fragments page is stuck on the first listed site and has no site switcher | — |
| [BUG-006](tasks/BUG-006.md) | P2 | Bug | Admin UI | Component Registry pagination changes the page number but not the rows | — |
| [BUG-007](tasks/BUG-007.md) | P2 | Bug | Admin UI | Preview of a never-published page opens in Live mode and spins forever | — |
| [BUG-008](tasks/BUG-008.md) | P2 | Bug | Backend | Unsupported HTTP methods return 500, and site admin endpoints return JPA entities | — |
| [TEST-003](tasks/TEST-003.md) | P2 | Test | Site | Port component-library suites from Selenium to Playwright | TEST-001 |
| [TEST-009](tasks/TEST-009.md) | P2 | Test | Tests | Remove the legacy Selenium suite | TEST-002, TEST-003, TEST-004, TEST-005, TEST-006, TEST-007 |
| [ECMS-10](tasks/ECMS-10.md) | P2 | Story | Backend | Review annotations API | — |
| [ECMS-13](tasks/ECMS-13.md) | P2 | Story | Frontend | Editor productivity: inline text editing and copy/cut/paste | — |
| [ECMS-53](tasks/ECMS-53.md) | P2 | Story | Frontend | User, group, and permissions management UI | ECMS-52 |
| [ECMS-61](tasks/ECMS-61.md) | P2 | Story | Backend | Content search v2: reindex, facets, suggestions | — |
| [BUG-010](tasks/BUG-010.md) | P3 | Bug | Admin UI | Content Tree breadcrumb shows a hardcoded "Corporate Portal" | — |
| [BUG-011](tasks/BUG-011.md) | P3 | Bug | Backend | Trailing slash on the XF endpoint gives a misleading 404 message | — |
| [BUG-013](tasks/BUG-013.md) | P3 | Bug | Admin UI | DAM browser loads at most 200 assets and never pages | — |
| [ECMS-56](tasks/ECMS-56.md) | P3 | Story | Backend | Maintenance jobs: version, audit, and workflow purge | — |
| [ECMS-57](tasks/ECMS-57.md) | P3 | Story | Frontend | Operations dashboard at /settings | ECMS-56 |

## Needs Refinement

Needs a technical design, a UI spec, final test cases, or a split before it can be built ([SDLC §4](../docs/process/SDLC.md#4-refinement)).

| ID | P | Type | Area | Title | Depends on |
|---|---|---|---|---|---|
| [ECMS-02](tasks/ECMS-02.md) | P1 | Story | Full-stack | Reference index and 'where used' API for pages, assets, and fragments | — |
| [ECMS-07](tasks/ECMS-07.md) | P1 | Story | Frontend | Page properties dialog | ECMS-06 |
| [ECMS-09](tasks/ECMS-09.md) | P1 | Story | Frontend | Version history, compare, and as-of view in the editor | ECMS-08 |
| [ECMS-12](tasks/ECMS-12.md) | P1 | Story | Frontend | Rich text editor with policy-driven formatting | ECMS-19 |
| [ECMS-18](tasks/ECMS-18.md) | P1 | Story | Full-stack | Editable templates: write API, lifecycle, and structure propagation | — |
| [ECMS-19](tasks/ECMS-19.md) | P1 | Story | Full-stack | Content policies and component style variants | ECMS-18 |
| [ECMS-20](tasks/ECMS-20.md) | P1 | Story | Frontend | Template editor UI (structure, initial content, policies, styles) | ECMS-18, ECMS-19 |
| [ECMS-21](tasks/ECMS-21.md) | P1 | Story | Frontend | Style picker in the editor and style classes in renderers | ECMS-19 |
| [ECMS-23](tasks/ECMS-23.md) | P1 | Story | Full-stack | Multi-site management completeness: rollout configs, inheritance control, conflicts | — |
| [ECMS-24](tasks/ECMS-24.md) | P1 | Story | Frontend | Live copy console and inheritance indicators in the editor | ECMS-23 |
| [ECMS-29](tasks/ECMS-29.md) | P1 | Story | Full-stack | Replication hardening and publish-with-references | ECMS-02, ECMS-03 |
| [ECMS-30](tasks/ECMS-30.md) | P1 | Story | Frontend | Publish-with-references wizard and replication queue console | ECMS-29 |
| [ECMS-34](tasks/ECMS-34.md) | P1 | Story | Full-stack | Structured content fragment models and fragments | ECMS-01 |
| [ECMS-35](tasks/ECMS-35.md) | P1 | Story | Full-stack | GraphQL generated from fragment models, with persisted queries | ECMS-34 |
| [ECMS-36](tasks/ECMS-36.md) | P1 | Story | Frontend | Fragment model editor and fragment editor | ECMS-34 |
| [ECMS-38](tasks/ECMS-38.md) | P1 | Story | Frontend | Experience Fragment console completion | ECMS-02 |
| [ECMS-48](tasks/ECMS-48.md) | P1 | Story | Full-stack | Workflow engine v2 | — |
| [ECMS-59](tasks/ECMS-59.md) | P1 | Story | Full-stack | SEO foundation: vanity URLs, redirects, hreflang, canonical, social metadata | ECMS-06 |
| [ECMS-60](tasks/ECMS-60.md) | P1 | Story | Frontend | SEO delivery on the site and redirect manager | ECMS-59 |
| [FEAT-001](tasks/FEAT-001.md) | P1 | Story | Admin UI | Editor DAM asset picker for asset fields | — |
| [BUG-009](tasks/BUG-009.md) | P2 | Bug | Backend | Workflow `for-user` inbox ignores `userId` | — |
| [BUG-014](tasks/BUG-014.md) | P2 | Bug | Site | Reference site drops asset and reference fields of many components | — |
| [ECMS-11](tasks/ECMS-11.md) | P2 | Story | Frontend | Annotate mode in the editor | ECMS-10 |
| [ECMS-14](tasks/ECMS-14.md) | P2 | Story | Full-stack | Responsive layout mode (per-breakpoint size, hide, order) | — |
| [ECMS-17](tasks/ECMS-17.md) | P2 | Story | Frontend | Audit log viewer | — |
| [ECMS-22](tasks/ECMS-22.md) | P2 | Story | Full-stack | Generic core component library | — |
| [ECMS-27](tasks/ECMS-27.md) | P2 | Story | Full-stack | Translation projects, jobs, delta updates, and translation rules | ECMS-25 |
| [ECMS-28](tasks/ECMS-28.md) | P2 | Story | Frontend | Translation projects UI | ECMS-27 |
| [ECMS-32](tasks/ECMS-32.md) | P2 | Story | Full-stack | Staged releases: parallel future versions of a site section | — |
| [ECMS-33](tasks/ECMS-33.md) | P2 | Story | Frontend | Staged releases console | ECMS-32 |
| [ECMS-37](tasks/ECMS-37.md) | P2 | Story | Full-stack | Fragment component for pages (hybrid delivery) | ECMS-34 |
| [ECMS-39](tasks/ECMS-39.md) | P2 | Story | Full-stack | Experience Fragment export and variations inheriting from master | ECMS-23 |
| [ECMS-43](tasks/ECMS-43.md) | P2 | Story | Full-stack | Metadata schemas and folder profiles | ECMS-41 |
| [ECMS-44](tasks/ECMS-44.md) | P2 | Story | Full-stack | Asset versioning, check-out, expiry/licence, and review | ECMS-41 |
| [ECMS-46](tasks/ECMS-46.md) | P2 | Story | Full-stack | On-demand image delivery: URL transforms, presets, focal-point crop | ECMS-03 |
| [ECMS-49](tasks/ECMS-49.md) | P2 | Story | Full-stack | Event-triggered workflows and notifications | ECMS-48 |
| [ECMS-50](tasks/ECMS-50.md) | P2 | Story | Frontend | Visual workflow model editor | ECMS-48 |
| [ECMS-52](tasks/ECMS-52.md) | P2 | Story | Full-stack | Users, groups, and role management API | — |
| [ECMS-62](tasks/ECMS-62.md) | P2 | Story | Frontend | Admin omnisearch and site search component | ECMS-61 |
| [ECMS-66](tasks/ECMS-66.md) | P2 | Story | Full-stack | Outbound webhooks and event subscriptions | — |
| [BUG-012](tasks/BUG-012.md) | P3 | Bug | Backend | Product asset links accept DAM paths that do not exist | — |
| [TECH-001](tasks/TECH-001.md) | P3 | Tech | Backend | Asset cache headers let withdrawn images live in browsers for a day | ECMS-03B |
| [ECMS-15](tasks/ECMS-15.md) | P3 | Spike | Full-stack | Framework-agnostic visual editing of external frontends | — |
| [ECMS-16](tasks/ECMS-16.md) | P3 | Story | Full-stack | Spreadsheet-style bulk property editor | ECMS-06 |
| [ECMS-31](tasks/ECMS-31.md) | P3 | Story | Full-stack | Preview tier for stakeholder review | — |
| [ECMS-40](tasks/ECMS-40.md) | P3 | Story | Frontend | Experience Fragment building blocks | ECMS-38 |
| [ECMS-45](tasks/ECMS-45.md) | P3 | Story | Full-stack | Collections, share links, bulk ingestion, and asset reports | ECMS-41 |
| [ECMS-47](tasks/ECMS-47.md) | P3 | Story | Full-stack | Video and rich media: adaptive streaming, sets, viewers | ECMS-46 |
| [ECMS-54](tasks/ECMS-54.md) | P3 | Story | Full-stack | Closed user groups for published content | ECMS-52 |
| [ECMS-55](tasks/ECMS-55.md) | P3 | Story | Full-stack | Project workspaces | ECMS-48 |
| [ECMS-58](tasks/ECMS-58.md) | P3 | Spike | Full-stack | Forms: builder, rules, submissions, document of record | — |
| [ECMS-63](tasks/ECMS-63.md) | P3 | Spike | Full-stack | Native personalisation: visitor context, segments, targeted experiences, A/B | — |
| [ECMS-64](tasks/ECMS-64.md) | P3 | Story | Full-stack | Real-user monitoring and Core Web Vitals | — |
| [ECMS-65](tasks/ECMS-65.md) | P3 | Story | Frontend | Package manager UI | — |

## Blocked

Waiting for a human answer. The question is in the spec's `## Questions` section.

| ID | P | Type | Area | Title | Depends on |
|---|---|---|---|---|---|
| — | | | | _none_ | |

## Done

Meets the Definition of Done. Work completed before 2026-09-26 under the retired workflow is in git tag `archive/dark-factory` (`git show archive/dark-factory:df/runtime/board.md`).

| ID | P | Type | Area | Title | Depends on |
|---|---|---|---|---|---|
| [ECMS-03](tasks/ECMS-03.md) | P0 | Story | Full-stack | Publish-tier asset delivery and asset replication | — |
| [ECMS-03A](tasks/ECMS-03A.md) | P0 | Story | Backend | Backend: publish-tier asset delivery and asset replication | — |
| [ECMS-00](tasks/ECMS-00.md) | P1 | Task | Full-stack | Enterprise-level CMS parity: gap analysis and backlog | — |
