# REB-19 — Implement page editor component/property/asset authoring matrix Selenium suite

## Summary

- Priority: P0
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Expand Selenium coverage from the basic `REB-13` editor smoke into a matrix-driven page editor suite that establishes the field-type-aware authoring framework, verifies property persistence, verifies headless JSON, verifies rendered output, and covers asset-backed fields. This task builds the reusable foundation; exhaustive one-scenario-per-component coverage is tracked separately in `REB-26`.

## Read first

- `df/artifacts/REB-17/task.md`
- `df/artifacts/REB-06/devops/summary.md`
- `df/artifacts/REB-09/frontend/summary.md`
- `df/artifacts/REB-13/task.md`
- `df/artifacts/REB-13/devops/summary.md`
- `Design/tut-usa/generated/qa-traceability-matrix.csv`
- `Design/tut-usa/generated/component-contracts.json`
- `Design/tut-usa/generated/template-contracts.json`
- `df/artifacts/REB-26/task.md`
- `frontend/apps/admin/src/app/editor/page.tsx`
- `frontend/apps/selenium-e2e/src/pages/EditorPage.ts`

## Dependencies

- REB-07
- REB-10
- REB-11
- REB-13

## Functional scope

- Editor controls and tab switching: components, layers, assets, settings, preview.
- Component insertion/removal/reorder if UI supports it.
- Property-panel editing for text, rich text, number, boolean, select, link, list, image/asset fields.
- Template constraints from generated contracts.
- Undo/redo where wired.
- Save, refresh persistence, headless JSON verification, rendered output verification.
- Asset selection/reference from DAM/public imported asset map.
- Reusable data-driven helpers that `REB-26` can apply to every generated sample-site UI component.

## Required E2E scenarios

1. **Contract-driven authoring matrix foundation**: select high-value representatives across layout/page structure, media/assets, navigation/discovery, CTAs/promotions, forms/consent, commerce/merchandising, editorial/article, events/booking, location/presence, account/transactional, education/learning, corporate/investor, community engagement, then expose the same helper model for `REB-26` exhaustive coverage.
2. **Text field round trip**: update unique marker text in a component property, save, refresh, verify UI value, author API properties, headless/GraphQL response, and rendered page text.
3. **Image/asset field round trip**: select or assign a DAM/public imported asset, save, verify author API asset reference, verify rendered image URL resolves and is not broken.
4. **Optional/empty fields**: clear optional fields and verify component renders fallback/empty state without broken markup or console errors.
5. **Long content**: author long title/body/list values and verify editor layout remains usable and public rendering is not truncated unexpectedly.
6. **Template constraints**: try adding a disallowed component to a constrained template if UI supports it; verify validation prevents persistence.
7. **Component order**: reorder components if available, save, verify persisted child order and rendered order.
8. **Undo/redo**: edit a property, undo/redo, save final state, verify final persisted value.
9. **Preview**: preview unsaved vs saved changes according to current product behavior; document observed behavior and assert expected state after save.
10. **Publish after edit**: publish an edited page and verify the changed marker appears on the publish environment.

## Acceptance criteria

- AC1: Suite uses the generated traceability matrix/contracts rather than hardcoded one-off coverage where practical.
- AC2: At least one media-heavy component verifies asset selection/reference through author API and rendered output.
- AC3: Every successful edit verifies UI persistence, author API, headless/GraphQL JSON where available, and rendered output.
- AC4: Every publish path verifies the change on the publish environment.
- AC5: Any missing editor capability/selectors are documented as implementation blockers with exact file/symbol references.
- AC6: Evidence is recorded in `df/artifacts/REB-19/devops/summary.md` with commands, JUnit, screenshots, and matrix coverage rows.
- AC7: Handoff to `REB-26` documents how to enumerate all active components from `component-contracts.json` and reuse the field-type editing helpers for every component.

