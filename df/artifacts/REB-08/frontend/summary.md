# REB-08 Frontend Summary

## Session

- Role: `frontend-dev`
- Date: 2026-07-07 local
- Task: `REB-08`
- State: `DEV_IN_PROGRESS`

## Start context captured

- Human requested starting the next implementation task.
- QA/PO automated sessions remain disabled (`DEC-REB-005`), so upstream outputs are used while awaiting manual review.
- Design/package inputs confirmed:
  - `Design/tut-usa/README.md`
  - `df/artifacts/REB-01/design/inventory.md`
  - `df/artifacts/REB-01/design/summary.md`
  - `Design/tut-usa/generated/component-contracts.json`
  - `Design/tut-usa/generated/template-contracts.json`

## Planned frontend scope for REB-08

- Implement tokens and font-loading foundation without hardcoded colors.
- Update public-site shell/layout foundation for TUT rendering.
- Adjust renderer foundation contracts only where required by generated contracts.
- Keep named exports and workspace conventions.
- Produce build/test evidence and lane handoff artifacts before moving to `READY_FOR_QA`.

## Risks at start

- REB-01 and REB-04 are still awaiting manual human acceptance; downstream assumptions may require rework.
- Existing TUT renderer codebase was recently reset/changed; current source must be re-read before each implementation step.

## Implemented in this session

- AC1: Updated `frontend/apps/site-nextjs/src/app/globals.css` to import captured font-face declarations from `public/tut-usa/assets/styles/09f32f8567d38b3a-css2.css` and switched shell font tokens to captured families (`Manrope`, `Newsreader`).
- AC2: Updated `frontend/apps/site-nextjs/src/app/layout.tsx` to provide a neutral TUT shell (`data-shell="tut-usa"`, skip-link, `main` landmark) and removed hardcoded XF fragment injection so template-driven navigation/footer renderers can be supplied by page contracts.
- AC3: Updated React renderer contract in `frontend/packages/react/src/FlexCmsProvider.tsx` and `frontend/packages/react/src/FlexCmsComponent.tsx` to pass optional metadata (`resourceType`, `name`) while preserving existing renderer compatibility.
- AC3/AC4: Rebuilt `frontend/apps/site-nextjs/src/components/component-map.tsx` as a lean foundation map with core renderers and a contract-aware fallback for unimplemented generated TUT resource types.
- AC4: Named exports and workspace conventions were preserved.

## Validation evidence

- Command: `cd frontend && pnpm build` -> FAIL initially due missing deleted `./src/components/tut/*` imports in stale component map.
- Fix applied: replaced stale component-map imports with foundation map + fallback renderer.
- Command: `cd frontend && NUXT_TELEMETRY_DISABLED=1 pnpm build` -> PASS (all turbo build tasks completed successfully).

## Residual risks

- The new fallback renderer intentionally surfaces unimplemented TUT resource types at runtime until REB-09 delivers grouped concrete renderers.
- Build still reports existing non-blocking Next.js lint warnings for `<img>` usage in admin/site apps.

