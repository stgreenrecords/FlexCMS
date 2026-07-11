# TUT-LINK-INTEGRITY - Solution design

## Problem evidence

The defect is not seed data alone:

- `scripts/seed_tut_usa_website.py` defines 61 pages and emits many valid CTA objects, but global navigation uses label-only `primaryLinks`, `accountEntry` is a string, `/tut-usa/search` is not seeded, and legal links depend on absent fragment IDs.
- `V16__tut_usa_component_definitions.sql` defines navigation `primaryLinks` and footer `footerLinkGroups` as string references even though navigation/footer need `{label,url}` objects.
- `frontend/apps/site-nextjs/src/components/homepageRenderers.tsx` ignores authored navigation, hero, product-grid, featured-content, and footer destinations and renders several `href="#"` placeholders.
- `frontend/apps/selenium-e2e/src/cases/templates/tut-usa-pages.spec.ts` verifies page shells and image health but does not verify link integrity.

## Architecture decision

Use a dependency-ordered three-task repair. Do not patch renderers with a route lookup table and do not rewrite historical migrations.

### 1. Contract correction (`TUT-LINK-CONTRACTS`, backend-dev)

Add the next sequential CMS Flyway migration (`V18`) that updates only affected component-definition JSON schemas so link collections consistently use reusable objects with required non-empty `label` and `url` properties. At minimum cover navigation primary/utility/account links, footer groups/legal/social links, and featured-content items if they are made navigable. Preserve compatibility where practical, but the canonical contract after migration is an explicit link object.

Add backend migration/registry coverage proving the public component registry exposes the corrected schemas. No API shape beyond component schema JSON changes.

### 2. Seed graph correction (`TUT-LINK-SEED`, data-engineer)

Refactor `scripts/seed_tut_usa_website.py` around an explicit page/link graph:

- represent all user-visible navigation actions with `{label,url}` objects;
- use the existing `PAGES` inventory as the internal route authority;
- update every builder so semantically navigable cards/featured items include a destination;
- add useful seeded destinations for unresolved routes (including search and legal destinations unless an existing page is demonstrably correct);
- remove hash-only placeholders and absent fragment references;
- recursively collect URL-bearing fields from all generated page components and experience fragments before any API mutation;
- reject empty, `#`, malformed internal URLs and internal routes not present in the page inventory;
- allow `http`, `https`, `mailto`, and `tel` as external/special schemes under explicit validation rules;
- keep repeated runs idempotent and publish newly seeded pages.

Create Python unit tests that exercise the graph without requiring a running backend. Seed validation must run before `verify_author_reachable()` or before the first write so invalid datasets fail safely.

### 3. Rendering and browser proof (`TUT-LINK-RENDERING`, frontend-dev)

Update reference-site renderers to consume authored links instead of hardcoded values:

- navigation brand/logo, primary links, utility links, account/test-drive action;
- hero primary/secondary CTAs;
- product-grid/card links;
- featured-content links and “view all” destination;
- footer groups, legal links, and social links;
- any grouped fallback renderer that currently converts missing values to `#`.

A renderer must omit a link when the contract is invalid rather than emit `href="#"`. Preserve accessible labels, visible focus behavior, and safe `target="_blank" rel="noopener noreferrer"` behavior for external links configured to open in a new tab. This is behavior correction using existing design, so no new visual design package is required.

Extend Selenium with a full-site link-integrity scenario. Discover all seeded pages via `AuthorApiClient`, collect anchors from each rendered route, fail on empty/hash/javascript hrefs, deduplicate internal destinations, navigate to each destination, assert no error shell, and verify fragment IDs. External links are syntax/security checked only to avoid flaky third-party dependencies. Record per-source-page diagnostics for failures.

## Route rules

- CMS page path: `content.tut-usa...`.
- Public route: `/tut-usa/...`; never expose `/content/...` in rendered hrefs.
- Internal links must be site-root-relative and correspond to a page in the seed inventory.
- Query strings may be preserved; route existence checks use the path portion.
- Fragments are valid only when the destination page contains the referenced ID.
- A same-page link is valid only with a non-empty fragment that exists.

## Test strategy

1. Backend: migration/registry test for corrected link schemas; `mvn test` and `mvn clean compile`.
2. Data: Python unit tests for recursive link extraction, route normalization, accepted external schemes, fragment handling, missing-route rejection, and complete generated graph; execute seeder against live local Author and repeat once for idempotency.
3. Frontend unit tests: each affected renderer uses authored hrefs and emits no placeholder href.
4. Selenium: all discovered seeded pages plus every unique rendered internal destination and fragment; zero broken links.
5. Full gates: frontend build, Selenium smoke/full, and backend/Docker gates for the backend child.

## Rollback

- Revert renderer and seed changes together if live validation fails.
- Flyway migrations are immutable once applied; rollback is a forward migration restoring prior schemas, not deletion or rewriting of `V18`.
- Existing seeded nodes are updated in place, so reseeding the previous known-good script restores prior authored values without deleting non-demo content.

## Security and privacy

No personal data is introduced. Reject `javascript:`, `data:`, protocol-relative, and control-character URLs in seed validation. External new-tab links require `noopener noreferrer`. Do not make automated tests follow untrusted third-party URLs.

