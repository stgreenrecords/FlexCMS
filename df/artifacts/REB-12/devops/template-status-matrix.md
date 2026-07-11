# REB-12 Template Status Matrix

Generated from `frontend/apps/selenium-e2e/reports/reb12-template-status.json` after running hardened publish-target checks on 2026-07-09 local.

## Summary

- Total templates: 21
- PASS: 1
- PENDING: 14
- FAIL: 6

## PASS

- `TPL-20` `tut_sovereign` -> `capture-status-skipped-by-design`

## FAIL

- `TPL-01` `accessories_lifestyle_collection_page` -> `main content appears missing on /tut-usa/accessories/accessories-overview (header/footer-only render risk)`
- `TPL-06` `contact_concierge_page` -> `main content appears missing on /tut-usa/contact-and-concierge (header/footer-only render risk)`
- `TPL-08` `global_home_page` -> `main content appears missing on /tut-usa/home (header/footer-only render risk)`
- `TPL-09` `innovation_feature_detail_page` -> `main content appears missing on /tut-usa/innovation/connectivity-and-digital-cabin (header/footer-only render risk)`
- `TPL-10` `innovation_hub_page` -> `main content appears missing on /tut-usa/innovation/innovation-overview (header/footer-only render risk)`
- `TPL-11` `learning_education_hub_page` -> `main content appears missing on /tut-usa/learn/ev-buying-guide (header/footer-only render risk)`

## PENDING

- `TPL-02` `book_a_test_drive_page` -> `no-runtime-page-for-template`
- `TPL-03` `brand_story_about_tut_page` -> `no-runtime-page-for-template`
- `TPL-04` `build_configure_page` -> `no-runtime-page-for-template`
- `TPL-05` `compare_models_page` -> `no-runtime-page-for-template`
- `TPL-07` `dealer_showroom_locator_page` -> `no-runtime-page-for-template`
- `TPL-12` `model_overview_page` -> `no-runtime-page-for-template`
- `TPL-13` `news_press_article_detail_page` -> `no-runtime-page-for-template`
- `TPL-14` `news_updates_landing_page` -> `no-runtime-page-for-template`
- `TPL-15` `offers_financing_leasing_page` -> `no-runtime-page-for-template`
- `TPL-16` `owner_manual_technical_documentation_page` -> `no-runtime-page-for-template`
- `TPL-17` `owners_hub_landing_page` -> `no-runtime-page-for-template`
- `TPL-18` `safety_charging_ownership_how_to_page` -> `no-runtime-page-for-template`
- `TPL-19` `service_maintenance_page` -> `no-runtime-page-for-template`
- `TPL-21` `vehicle_model_detail_page` -> `no-runtime-page-for-template`

## Notes

- Runtime was restarted and `/content/tut-usa` was republished before this run.
- Current failures no longer report publish endpoint `500` or explicit author/publish component-count mismatch in this session.
- Remaining failures now consistently indicate publish pages rendering header/footer-only style outcomes with missing meaningful `<main>` content.
- Runtime probe in this session observed `22` TUT page/site-root nodes from author API list endpoint, below full design seed expectations.

## Routing Plan (by owner lane)

### Lane: `data-engineer` (seed coverage alignment)

Reason key: `no-runtime-page-for-template`

- Template IDs: `TPL-02`, `TPL-03`, `TPL-04`, `TPL-05`, `TPL-07`, `TPL-12`, `TPL-13`, `TPL-14`, `TPL-15`, `TPL-16`, `TPL-17`, `TPL-18`, `TPL-19`, `TPL-21`
- Scope:
  - Ensure runtime seeded pages include at least one routable page per template slug listed above.
  - Reconcile current author API list payload with `Design/tut-usa/generated/page-tree.json` expectations.
  - Re-run/verify seed reset+reseed tooling and provide before/after template coverage counts.
- Acceptance evidence expected back to REB-12:
  - Updated runtime page inventory report (`templateSlug -> available urlPath[]`).
  - Seed job command logs and environment details.
  - Diff against previous `22`-page runtime baseline.

### Lane: `frontend-dev` (publish rendering/content quality)

Reason key: `main content appears missing ... (header/footer-only render risk)`

- Template IDs: `TPL-01`, `TPL-06`, `TPL-08`, `TPL-09`, `TPL-10`, `TPL-11`
- Affected routes:
  - `/tut-usa/accessories/accessories-overview`
  - `/tut-usa/contact-and-concierge`
  - `/tut-usa/home`
  - `/tut-usa/innovation/connectivity-and-digital-cabin`
  - `/tut-usa/innovation/innovation-overview`
  - `/tut-usa/learn/ev-buying-guide`
- Scope:
  - Ensure each affected template route renders meaningful main content on publish (not header/footer-only).
  - Validate route-level CTA/content visibility and responsive checks in `<main>` for each failing path.
  - Preserve parity diagnostics so regressions to publish `500` or component loss remain visible if they reappear.
- Acceptance evidence expected back to REB-12:
  - Route-level screenshot proof and/or payload evidence showing meaningful in-main content for each path.
  - Frontend/build evidence for the applied fixes.
  - Selenium rerun snippets showing these IDs move from `fail` to `pass`.

### Lane: `devops` (REB-12 owner, final verification)

- After upstream lane fixes land:
  - Re-run `pnpm test:templates`.
  - Re-run `pnpm test:templates:ci` and capture JUnit output.
  - Keep publish main-content/CTA failures as hard gates until fixed or formally waived by explicit human decision.
  - Refresh `reports/reb12-template-status.json` and this matrix.
  - Move REB-12 to `DONE` only when remaining pending rows and failing rows are either resolved or explicitly accepted by human decision.

