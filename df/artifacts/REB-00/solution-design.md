# REB-00 Solution Design — Frontend rebuild, seed reset, and Selenium automation program

## 1. Objective

Replace the current runtime backlog with a structured rebuild program that turns the supplied TUT website templates, grouped components, images, fonts, and page tree into:

1. normalized design/source artifacts;
2. an idempotent seed reset and reseed process;
3. regenerated component/template contracts;
4. reimplemented frontend rendering/admin authoring surfaces;
5. Selenium-based test automation derived from the template/component matrix;
6. QA and PO gates before anything is considered complete.

## 2. Source-of-truth inputs

| Input | Purpose |
|---|---|
| `docs/list-ofcomponents-tempaltes-and-page-trees.txt` | Primary TUT business/site definition: 406 grouped components, 21 templates, page tree. |
| `Design/sample-website-tut/template-libs/{slug}/code.html` | Template reference implementation and remote asset references. |
| `Design/sample-website-tut/template-libs/{slug}/screen.png` | Visual reference for screenshot/visual checks. |
| `Design/sample-website-tut/component-libs/{slug}/code.html` | Component-library reference implementation and remote asset references. |
| `Design/sample-website-tut/component-libs/{slug}/screen.png` | Component visual reference. |
| `Design/assets/` | Existing/local image sources and generated replacements. |
| `docs/TEST_DATA_SPECIFICATION.md` | Existing test-data/component contract context. |

## 3. Folder and artifact storage standard

The existing `Design/sample-website-tut/` remains immutable input. New processed outputs should be created without mutating that source folder.

```text
design/tut-usa/
  README.md
  manifest.json                         # global source -> processed artifact manifest
  templates/{template-slug}/
    source-ref.md                       # references original Design/sample... path
    normalized.html                     # browser-captured, local-reference HTML
    screenshot-reference.png            # copy of approved reference image
    assets-manifest.json                # remote URL -> local asset mapping for this template
    test-cases.md                       # derived template-level cases
  components/{component-group-slug}/
    source-ref.md
    normalized.html
    screenshot-reference.png
    assets-manifest.json
    test-cases.md
  assets/
    images/{hash-or-slugified-name}.{ext}
    fonts/{family}/{file}
    media/{hash-or-slugified-name}.{ext}
  generated/
    component-contracts.json
    template-contracts.json
    page-tree.json
    qa-traceability-matrix.csv
```

Runtime/app copies should be generated from the canonical manifest, not hand-copied:

```text
frontend/apps/site-nextjs/public/tut-usa/        # public static assets for reference site
frontend/apps/admin/public/tut-usa/              # only admin-preview assets that are needed locally
df/artifacts/{task-id}/data/                     # seed/import manifests and evidence
df/artifacts/{task-id}/frontend/                 # frontend implementation evidence
df/artifacts/{task-id}/devops/                   # Selenium framework and CI evidence
```

DAM imports should use the same manifest and produce a mapping:

```text
df/artifacts/{task-id}/data/dam-import-map.json  # local asset -> DAM asset id/content URL
```

## 4. Browser-first remote asset capture process

The template HTML uses remote-loaded images/fonts/assets. Capture must happen through a real browser first so lazy-loaded CSS, font preloads, responsive images, and runtime-loaded URLs are observed.

Recommended approach:

1. DevOps creates a Selenium capture runner that opens every `code.html` file in Chrome/Chromium.
2. The runner enables browser performance logs or Chrome DevTools Protocol access through Selenium.
3. For each template/component page:
   - wait for network idle and fonts ready;
   - scroll the page to trigger lazy-loaded assets;
   - collect all network URLs for image, font, CSS, media, and script resources;
   - download allowed static resources into `design/tut-usa/assets/` using content hash + readable slug;
   - record source URL, content type, checksum, size, and local target in `assets-manifest.json`;
   - rewrite `normalized.html` to point to local relative assets;
   - take a captured screenshot for evidence.
4. If a remote resource cannot be downloaded, record it as a blocker in the manifest with status `missing` and create a generated asset request entry.

Security/quality constraints:

- Do not execute untrusted remote scripts outside the local capture sandbox.
- Do not commit secrets, cookies, or browser profiles.
- Preserve license/source metadata for fonts and images where available.
- Normalize only static assets; live APIs remain mocked only inside capture artifacts and must not become production dependencies.

## 5. Seed reset and reseed architecture

Do not edit old Flyway migration history to “erase” previous seed data. Use a safe, opt-in reset/reseed path.

Required design:

- `data-engineer` creates a reset tool that deletes only known demo/TUT seed content by deterministic identifiers/path prefixes/resource types.
- Reset must require an explicit flag such as `FLEXCMS_RESET_SEED=true` or a CLI argument like `--confirm-reset-tut-usa`.
- Reset must refuse to run against unknown/production environments unless an additional human-only override is present.
- Reseed must be idempotent: repeated runs produce the same content tree, component definitions, templates, asset references, and PIM/DAM sample data without duplicates.
- Seeded content must use valid `NodeStatus` values only: `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`.
- Asset references must be generated from the browser-captured asset manifest or DAM import map, never from stale placeholders.

Expected outputs:

```text
scripts/reset_tut_usa_seed.py             # or equivalent safe reset tool
scripts/seed_tut_usa_website.py           # revised/generated reseed using manifests
df/artifacts/REB-03/data/reset-plan.md
df/artifacts/REB-03/data/reseed-evidence.md
df/artifacts/REB-03/data/dam-import-map.json
```

## 6. Component/template contract generation

Generate contracts from the 406-component inventory and 21-template library before frontend implementation.

Contract outputs:

- `component-contracts.json`: resource type, title, group, fields, field types, validation rules, render priority.
- `template-contracts.json`: template name, embedded required components, allowed optional components, authoring constraints.
- `page-tree.json`: URL path, content path, title, template, required seed components.
- migration/import plan for `component_definitions` and `template_definitions`.

Implementation guardrails:

- Backend remains JSON-only.
- Public APIs return DTOs/projections, not JPA entities.
- Controllers must not call repositories directly.
- PIM data must stay in the PIM datasource.

## 7. Frontend rebuild architecture

Implement from the normalized design contracts in this order:

1. Design tokens, font loading, app shell, and asset pipeline.
2. Shared renderer contract in `@flexcms/sdk` / `@flexcms/react` as needed.
3. Component mapper and grouped component renderers for the TUT public site.
4. Template-level page layouts for all 21 templates.
5. Admin authoring/editor surfaces needed to create/edit/preview those components/templates.
6. Accessibility, loading states, empty states, and responsive behavior.

Frontend rules:

- No hardcoded colors; use design tokens/CSS variables.
- Use `@flexcms/ui` for admin interactive controls.
- Named exports only for components.
- Every admin page needs breadcrumb, loading skeleton, and empty state.
- Public site rendering consumes backend/headless JSON and never relies on backend HTML.

## 8. Selenium automation architecture

Selenium becomes the rebuild automation framework while Playwright remains legacy coverage until replacement is proven.

Recommended package:

```text
frontend/apps/selenium-e2e/
  package.json
  tsconfig.json
  selenium.config.ts
  src/
    driver/
      browser.ts
      env.ts
      waits.ts
      screenshots.ts
    pages/
      AdminLoginPage.ts
      SitePage.ts
      AuthorEditorPage.ts
    cases/
      templates/
      components/
      admin/
    fixtures/
      template-manifest.ts
      component-manifest.ts
    reports/
```

Suggested stack:

- TypeScript in the existing pnpm monorepo.
- `selenium-webdriver` for browser automation.
- Mocha or Vitest as test runner if direct Selenium integration is preferred.
- JUnit XML and screenshot/video-on-failure artifacts for CI.
- Stable `data-testid` selectors added by frontend tasks where needed.

Test-case generation strategy:

- One traceability row per template and high-value component group.
- Each row maps: source template/component slug -> acceptance criteria -> Selenium spec -> screenshot/reference evidence -> covered browsers/viewports.
- Critical template smoke cases run first: page loads, no console errors, no broken images/fonts, required components present, primary CTA works, responsive layout passes core breakpoints.
- Component cases cover field rendering, missing optional fields, long copy, empty lists, image fallback, keyboard behavior for interactive components, and accessibility basics.
- Admin cases cover authoring, edit/save/preview, asset selection, publish/headless/render round trip.

## 9. New backlog

| Priority | Task ID | Title | Lane | Dependencies |
|---|---|---|---|---|
| P0 | REB-01 | Normalize TUT design packages and approve storage map | designer | REB-00 |
| P0 | REB-02 | Build Selenium browser asset-capture pipeline for remote template resources | devops | REB-01 |
| P0 | REB-03 | Reset existing TUT/demo seed data safely and create idempotent reseed plan | data-engineer | REB-01 |
| P0 | REB-04 | Generate component/template/page-tree contracts from inventory | backend-dev | REB-01 |
| P0 | REB-05 | Add Selenium framework foundation and reporting package | devops | REB-00 |
| P1 | REB-06 | Produce Selenium traceability matrix and generated test-case skeletons | devops | REB-02, REB-04, REB-05 |
| P1 | REB-07 | Import captured assets into DAM/public frontend asset pipeline | data-engineer | REB-02, REB-03 |
| P1 | REB-08 | Rebuild frontend tokens, fonts, layout shell, and renderer foundation | frontend-dev | REB-01, REB-04 |
| P1 | REB-09 | Implement TUT grouped component renderers | frontend-dev | REB-08 |
| P1 | REB-10 | Implement all 21 TUT page templates and page routes | frontend-dev | REB-07, REB-09 |
| P1 | REB-11 | Reimplement admin authoring/editor flows for new components/templates | frontend-dev | REB-04, REB-08 |
| P1 | REB-12 | Implement Selenium public-site template/component suites | devops | REB-06, REB-10 |
| P1 | REB-13 | Implement Selenium admin authoring and round-trip suites | devops | REB-06, REB-11 |
| P2 | REB-14 | Wire Selenium gates into CI/local validation and retain artifacts | devops | REB-12, REB-13 |
| P0 | REB-15 | QA verification for full rebuild program | qa | REB-14 |
| P0 | REB-16 | PO acceptance for full rebuild program | po | REB-15 |

## 10. Rollback strategy

- The previous runtime board was archived at `df/artifacts/REB-00/archived-board-before-reset.md`.
- Keep old seed migrations intact; reset/reseed uses explicit tools and new migrations/importers only.
- Keep Playwright tests until Selenium coverage is accepted.
- Frontend rebuild should be feature-branch/worktree isolated per Dark Factory delivery rules.

## 11. Risks

- Scope is large: split tasks must remain one-lane and dependency-labeled.
- Remote template assets may be unavailable, licensed, or volatile.
- Browser-captured assets may include third-party scripts that should not be committed or shipped.
- “Erase seed data” can be destructive if environment gating is weak.
- Reimplementing all frontend before contracts stabilize may cause rework.

## 12. Next role

First, `qa` verifies `REB-00` as a planning/backlog-reset artifact and routes it to PO or defects. After PO accepts `REB-00`, start `REB-01` with the `designer` role. The designer should validate the normalized design package scope and storage convention before DevOps captures remote assets or frontend starts visual implementation.

