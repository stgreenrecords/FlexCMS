# REB-26 — Implement exhaustive per-UI-component sample-site editing Selenium suite

## Summary

- Priority: P0
- Owner role/lane: `devops`
- Parent planning task: `REB-17`
- Requested by: human follow-up on 2026-07-07 local

## Goal

Generate and implement Selenium E2E editing scenarios for **every UI component in the sample TUT-USA site component contracts**, proving that each component can be authored/edited in the admin page editor, saved, verified on authoring APIs/previews, published where applicable, and verified on the publish environment.

## Read first

- `df/artifacts/REB-17/task.md`
- `df/artifacts/REB-19/task.md`
- `df/artifacts/REB-25/task.md`
- `Design/tut-usa/generated/component-contracts.json`
- `Design/tut-usa/generated/template-contracts.json`
- `Design/tut-usa/generated/page-tree.json`
- `Design/tut-usa/generated/qa-traceability-matrix.csv`
- `frontend/apps/selenium-e2e/src/capture/generateTraceabilitySkeletons.ts`
- `frontend/apps/selenium-e2e/src/fixtures/component-manifest.ts`
- `frontend/apps/selenium-e2e/src/pages/EditorPage.ts`
- `frontend/apps/selenium-e2e/src/pages/AuthorApiClient.ts`
- `frontend/apps/admin/src/app/editor/page.tsx`

## Dependencies

- REB-07
- REB-10
- REB-11
- REB-13
- REB-19

## Component inventory baseline

Current generated inventory from `Design/tut-usa/generated/component-contracts.json`:

- Total UI components: 406
- Component groups: 14
- Asset fields: 91
- Rich-text fields: 25
- Reference fields: 30

Group distribution:

| Component group | Component count |
|---|---:|
| Account, Portal & Transactional | 24 |
| Brand, Corporate, Investor & Governance | 19 |
| Calls to Action, Promotions & Campaigns | 43 |
| Commerce, Catalog & Merchandising | 31 |
| Community, Social Proof & Engagement | 31 |
| Editorial & Article Content | 69 |
| Education, Learning & Developer Content | 14 |
| Events, Booking, Travel & Hospitality | 24 |
| Forms, Data Capture & Consent | 42 |
| Layout & Page Structure | 32 |
| Location, Local & Physical Presence | 13 |
| Media, Visual Storytelling & Assets | 33 |
| Navigation, Search & Discovery | 29 |
| Support, Documentation & Knowledge | 2 |

## Functional scope

- One generated or hand-authored E2E editing scenario per active component contract row.
- Component selection by `resourceType`, `name`, `title`, `groupName`, and schema `fields` from `component-contracts.json`.
- Sample site page/template placement using `page-tree.json` and `template-contracts.json`.
- Field-type-aware editing for string, rich text, enum/select, boolean, number, date/time-like, URL/link, list/object, asset, and reference fields.
- Authoring persistence verification through editor UI refresh and author API.
- Headless/GraphQL verification when the edited component appears in content delivery JSON.
- Rendered author/admin preview verification where available.
- Publish-environment verification for each component scenario that publishes or affects a publishable page.
- Per-component evidence matrix that records pass/fail/blocked/unsupported status.

## Required generation strategy

1. Parse `Design/tut-usa/generated/component-contracts.json` as the authoritative component list.
2. For each active component contract, generate a deterministic test case id, for example `CMP-EDIT-{index}-{name}`.
3. Resolve a suitable sample-site page/template placement using:
   - `page-tree.json` for existing seeded pages and `requiredSeedComponents` / `optionalComponentTypes`;
   - `template-contracts.json` for `embeddedComponentTypes` and `allowedComponentTypes`;
   - fallback test-owned page creation from `REB-18` when no seeded placement exists.
4. Generate safe edit payloads from `fields` metadata:
   - text/string: unique marker including component name and timestamp/test run id;
   - rich text: valid rich text marker with formatting-safe content;
   - enum/select: choose a valid enum value; if enum is empty, use documented default/fallback behavior;
   - boolean: toggle and verify;
   - number: set deterministic non-boundary value and verify;
   - asset: use `REB-07` imported asset map or `REB-21` uploaded test asset;
   - reference: use a safe existing content/product/asset reference based on `isReference` context;
   - object/list: edit minimal valid nested value or document unsupported editor control blocker.
5. Execute component edit via admin editor using stable selectors/page objects.
6. Save and refresh editor; verify the edited field remains visible or discoverable in editor state.
7. Verify persisted properties through author API for the edited node/component.
8. Verify delivery JSON through headless REST or GraphQL when the component is part of a delivery page.
9. Publish the page/component when applicable and verify the marker or asset/reference output on the publish environment.
10. Record per-component row evidence with component id, resource type, page path, edited fields, verification layers, result, and blocker/defect notes.

## Required E2E scenarios

1. **All-component generation smoke**: generated scenario list count equals the number of active component contracts; no active component is silently omitted.
2. **Per-component edit round trip**: every active component has at least one edit scenario that changes at least one meaningful editable field and verifies persistence.
3. **Asset components**: every component with `isAsset=true` field verifies asset selection/reference and rendered image/media health where the component renders media.
4. **Rich-text components**: every component with `isRichText=true` verifies rich-text edit persistence and safe rendered output.
5. **Reference components**: every component with `isReference=true` verifies reference selection/persistence and delivery output where resolvable.
6. **Container components**: components marked `isContainer=true` verify child insertion or child preservation after save where editor supports containers.
7. **Form components**: form/data-capture components verify authoring fields and frontend form control rendering without submitting real external data.
8. **Navigation/search components**: verify link/reference editing and rendered navigation/search UI health.
9. **Commerce/PIM components**: verify product/reference editing using PIM-safe test data when the schema requires it.
10. **Publish verification**: every scenario that publishes or changes a publishable sample-site page verifies publish-environment visibility; author-only verification is not sufficient.
11. **Unsupported editor controls**: if a component cannot be edited because the admin UI lacks control support, selector, placement, or backend endpoint, record it as `BLOCKED` or `UNSUPPORTED_UI` in the per-component matrix with exact evidence.
12. **No destructive sample-site damage**: tests use test-owned pages or restore original sample-site component values after mutation unless the test data is intentionally retained and documented.

## Required artifacts

- `df/artifacts/REB-26/devops/component-editing-matrix.csv` with one row per component contract.
- `df/artifacts/REB-26/devops/summary.md` with totals: passed, failed, blocked, unsupported, skipped-with-reason.
- Selenium generated specs or data-driven suite under `frontend/apps/selenium-e2e/src/cases/admin/`.
- Supporting generated fixture under `frontend/apps/selenium-e2e/src/fixtures/` if needed.
- JUnit XML report and failure screenshots.

## Acceptance criteria

- AC1: The suite enumerates all 406 active component contracts from `component-contracts.json` or documents the exact current generated count if it changes.
- AC2: No active UI component is omitted without an explicit matrix row and reason.
- AC3: Each component has an E2E editing scenario that verifies editor save/refresh and author API persistence.
- AC4: Components that render on sample-site pages verify headless/GraphQL JSON and rendered author/admin preview where applicable.
- AC5: Every publishable component edit that is published verifies the change on the publish environment.
- AC6: Asset, rich-text, reference, container, form, navigation/search, and commerce/PIM component categories have category-specific assertions, not only generic smoke checks.
- AC7: The per-component matrix and JUnit evidence are recorded under `df/artifacts/REB-26/devops/`.
- AC8: Any missing admin editor controls/selectors or unsupported schema field editors are reported as defects/blockers with exact component resource types and source files.

## Risks and constraints

- This task is intentionally exhaustive and may be large; implementation may need sharding by component group, but the acceptance artifact must still report one row per component.
- Do not mutate shared seeded sample-site content without restoring it or using a test-owned clone/page.
- Do not pass publish checks against author URLs; use explicit publish environment configuration.
- If generated component count changes, update this task evidence with the new count rather than hardcoding stale totals in test logic.

