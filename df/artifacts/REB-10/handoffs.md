## 2026-07-11 local - screenshot regression audit

- State: `DONE` (shared renderer hardening recorded)
- Finding: template selection was correct; generic component fallbacks below the template wrappers caused the repeated metadata/debug presentation.
- Evidence: `frontend/apps/site-nextjs/src/components/tutPriorityRenderers.tsx`, `frontend/apps/site-nextjs/src/components/component-map.tsx`, `df/artifacts/REB-10/frontend/summary.md`.
- Validation: site tests `12 passing`, site build PASS, and live `/tut-usa/vehicles` rendered without `Renderer pending` or `data-flexcms-unimplemented` markers after restart.
- Next: continue visual parity work through dedicated renderers for remaining high-priority component contracts.

## 2026-07-08 local - frontend-dev -> next delivery task routing

- Task: `REB-10`
- State: `DONE`
- What was done:
  - Reconciled REB-10 from retired QA state to developer-owned completion flow.
  - Replaced brittle hardcoded template keys with generated-contract-driven template routing.
  - Added compatibility aliases for prior naming variants.
  - Added unit coverage for template registration and wrapper behavior (navigation/footer injection).
  - Added responsive layout wrappers for home/standard templates.
- Evidence:
  - `frontend/apps/site-nextjs/src/components/templates/template-map.tsx`
  - `frontend/apps/site-nextjs/src/components/templates/GlobalHomePageTemplate.tsx`
  - `frontend/apps/site-nextjs/src/components/templates/StandardPageTemplate.tsx`
  - `frontend/apps/site-nextjs/src/components/templates/__tests__/template-map.test.tsx`
  - `df/artifacts/REB-10/frontend/summary.md`
  - commands:
	- `cd frontend && pnpm --filter @flexcms/site-nextjs test` PASS
	- `cd frontend && NUXT_TELEMETRY_DISABLED=1 pnpm build` PASS
- Next steps:
  1. Route to the next actionable delivery task on the board (likely `REB-11` reconciliation or downstream Selenium tasks blocked by `REB-10`).
  2. Use the template-map tests as regression coverage for future template-name contract updates.
- Risks/blockers:
  - Template visual parity still needs seeded-runtime visual checks; this session covered routing logic, wrapper behavior, and compile/test integrity.

## Handoff from `frontend-dev` to `qa`

- **Task:** REB-10: Implement all 21 TUT page templates and page routes
- **From:** `frontend-dev`
- **To:** `qa`
- **State:** `READY_FOR_QA`
- **Date:** 2026-07-07

### Summary of Work

I have implemented a template-based rendering system for the `site-nextjs` application. This includes:
- A `template-map.tsx` that maps template names to React components.
- A `StandardPageTemplate` that ensures the navigation and footer are present on most pages.
- A specific `GlobalHomePageTemplate` for the home page.
- All 21 templates from the spec have been registered to use these template components.

The frontend build is successful.

### Instructions for QA

1.  **Run the application:** Start the FlexCMS stack (`./flex start local all`) and ensure the `site-nextjs` frontend is running.
2.  **Verify with seeded data:** The backend should be seeded with the TUT USA content. Navigate to various pages defined in the `docs/list-ofcomponents-tempaltes-and-page-trees.txt` file.
3.  **Check template rendering:** Verify that pages are rendering without crashing. The new template structure should be active.
4.  **Identify missing components:** The `ContractFallback` component will render a block with a red dashed border for any component that does not have a renderer implemented in `component-map.tsx`. Please log these as defects or new tasks.
5.  **Check for required components:** The templates should render the Navigation and Footer. Verify they are present. For other "embedded components" listed in the template definitions, verify they are being rendered from the page data.
6.  **Responsive testing (AC4):** Check a few key pages (e.g., Home, a Vehicle Detail Page, a standard content page) across desktop, tablet, and mobile viewport sizes to ensure the layout is responsive and not broken.

### Evidence

- `df/artifacts/REB-10/frontend/summary.md`
- Successful `pnpm build` output in the terminal logs.
- Git commit with the changes.

