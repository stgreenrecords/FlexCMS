# REB-17 — Prioritize authoring E2E automation backlog

## Summary

- Priority: P0
- Owner role/lane: `sa`
- Session date: 2026-07-07 local
- Type: Planning / backlog refinement

## Goal

Create the prioritized test-automation backlog for current FlexCMS authoring functionality, with detailed Selenium E2E coverage expectations for authoring, publishing, and publish-environment verification.

## Read first

- `df/00-start-here.md`
- `df/01-operating-model.md`
- `df/02-state-machine.md`
- `df/03-orchestration-rules.md`
- `df/04-documentation-standards.md`
- `df/roles/sa.md`
- `df/runtime/board.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `df/artifacts/REB-00/solution-design.md`
- `df/artifacts/REB-13/task.md`
- `df/artifacts/REB-13/devops/summary.md`

## Dependencies

- none

## Current authoring functionality found

| Area | Current source evidence | Authoring capability available now | Current automation status |
|---|---|---|---|
| Content tree / pages | `AuthorContentController`, `frontend/apps/admin/src/app/(admin)/content/page.tsx`, `frontend/apps/admin/src/app/editor/page.tsx` | List/search/navigate content tree; open editor/preview; page node create/update/move/delete; status update; version history/restore; scheduled publishing/deactivation; bulk publish/delete/move | Basic Selenium editor round trip exists in `REB-13`; content-tree creation/bulk/version/schedule coverage is not yet detailed |
| Page editor / component authoring | `frontend/apps/admin/src/app/editor/page.tsx`, `EditorPage.ts`, `AuthorApiClient.ts` | Visual editor controls, layers, components/assets/settings tabs, save, publish, preview, inheritance cancellation, property editing | `REB-13` covers controls, edit persistence, cancel inheritance, publish + author/GraphQL/site checks; template/component matrix-specific authoring coverage still needed |
| Publishing / replication | `AuthorContentController.updateStatus`, `bulkPublish`, `ReplicationAgent`, publish service endpoint context | Publish individual and bulk changes; verify replicated published state and rendered output | `REB-13` verifies author API + GraphQL + rendered site, but must be expanded to publish-environment endpoint verification when publish service is in scope |
| Workflow | `AuthorWorkflowController`, `frontend/apps/admin/src/app/(admin)/workflows/page.tsx` | Start, advance, cancel, list active/completed/cancelled workflows; get active workflow for content path | No dedicated Selenium E2E backlog before this session |
| DAM/assets | `AuthorAssetController`, `frontend/apps/admin/src/app/(admin)/dam/page.tsx`, `frontend/apps/admin/src/app/(admin)/dam/[id]/page.tsx` | Upload, list/search, folder listing, metadata/detail, binary stream, delete | DAM import exists in `REB-07`; admin upload/reference/delete E2E backlog needed |
| Experience fragments | `ExperienceFragmentController`, `frontend/apps/admin/src/app/(admin)/experience-fragments/page.tsx` | Create/list/get/delete experience fragments; add/list/delete variations | No dedicated Selenium E2E backlog before this session |
| Live copy / inheritance | `LiveCopyController`, editor inheritance controls | Create live copy, rollout blueprint changes, detach, status check; editor cancel-inheritance path | `REB-13` covers cancel inheritance only; live-copy creation/rollout/detach backlog needed |
| PIM authoring | `ProductApiController`, `frontend/apps/admin/src/app/(admin)/pim/**/page.tsx` | Catalog/product listing; product create/update/delete/status; carryforward/delta/merge; variants; product asset references; versions/restore; import wizard/schema pages | No dedicated Selenium E2E backlog before this session |
| Sites/translations/component registry | `frontend/apps/admin/src/app/(admin)/sites/page.tsx`, `translations/page.tsx`, `components/page.tsx` | Admin-visible site overview, translation manager, component registry/contract browsing; some routes appear UI-heavy/read-only or static until backend APIs are confirmed | Backlog should classify as smoke/read-only first, then expand after implementation evidence |

## Global E2E automation rules

1. Selenium is the target framework for the rebuild program; Playwright remains legacy until Selenium coverage is accepted.
2. Tests must use stable selectors (`data-testid`) where available; if missing, the delivery task must add them in the owning frontend task or document the blocker.
3. Tests must avoid destructive actions against non-local environments. Any create/update/delete case must use unique test identifiers and clean up or restore where practical.
4. Every authoring mutation must verify all applicable layers:
   - UI success state;
   - author API persisted state;
   - headless/GraphQL JSON state when content is renderable;
   - rendered author/admin preview where applicable;
   - publish environment visibility when the test publishes or activates content.
5. Page creation acceptance rule from the user request: when testing page creation, verify the page was created, published, and available in the authoring environment. If the flow publishes the page, also verify publish-environment visibility.
6. Publishing acceptance rule from the user request: when testing publishing, verify the authored change is visible on the publish environment, not only on author/headless endpoints.
7. Component editing acceptance rule from the user follow-up: every generated sample-site UI component must have an E2E editing scenario or an explicit matrix row explaining why it is blocked/unsupported.
8. Evidence per task must include exact command, environment URLs, JUnit XML, screenshots on failure, and any skipped scenario with blocker reason.

## Sample-site UI component inventory baseline

- Source: `Design/tut-usa/generated/component-contracts.json`
- Current generated active UI component count: 406
- Component groups: 14
- Schema signals available for data-driven editing scenarios: `resourceType`, `name`, `title`, `groupName`, `isContainer`, `fields[].type`, `fields[].format`, `fields[].isAsset`, `fields[].isRichText`, `fields[].isReference`, and `fields[].enum`.
- Existing generated Selenium component group skeleton source: `frontend/apps/selenium-e2e/src/capture/generateTraceabilitySkeletons.ts` and `frontend/apps/selenium-e2e/src/fixtures/component-manifest.ts`.

## Prioritized backlog added

| Priority | Task ID | Title | Lane | Dependencies | Rationale |
|---|---|---|---|---|---|
| P0 | REB-18 | Implement content tree, page creation, and author/publish verification Selenium suite | devops | REB-11, REB-13 | Highest-value author journey: create page, publish, verify authoring and publish visibility |
| P0 | REB-19 | Implement page editor component/property/asset authoring matrix Selenium suite | devops | REB-07, REB-10, REB-11, REB-13 | Covers the core CMS value: author components/templates and prove JSON/rendered round trip |
| P0 | REB-20 | Implement publishing, workflow, scheduling, and bulk operation Selenium/API E2E suite | devops | REB-11, REB-13, REB-18 | Expands publish verification and author workflow control surfaces |
| P1 | REB-21 | Implement DAM authoring and asset-reference Selenium E2E suite | devops | REB-07, REB-11, REB-13 | Covers asset upload/list/detail/delete and use in authored content |
| P1 | REB-22 | Implement experience-fragment and live-copy authoring Selenium E2E suite | devops | REB-11, REB-13, REB-18 | Covers reusable content and multisite inheritance/rollout scenarios |
| P1 | REB-23 | Implement PIM catalog/product authoring Selenium E2E suite | devops | REB-07, REB-13 | Covers product CRUD, status, variants, asset refs, carryforward/version restore |
| P2 | REB-24 | Implement admin sites/translations/component-registry authoring-smoke Selenium suite | devops | REB-13 | Covers secondary admin authoring/read-only surfaces and identifies API blockers |
| P2 | REB-25 | Harden cross-cutting admin E2E quality gates for navigation, errors, accessibility, and cleanup | devops | REB-18, REB-19, REB-20, REB-21, REB-22, REB-23, REB-24 | Stabilizes suites before CI gate expansion |
| P0 | REB-26 | Implement exhaustive per-UI-component sample-site editing Selenium suite | devops | REB-07, REB-10, REB-11, REB-13, REB-19 | Adds one editing scenario/matrix row for every generated sample-site UI component |

## Acceptance criteria

- AC1: Current authoring functionality is mapped to concrete source evidence.
- AC2: Each available authoring area has a prioritized Selenium backlog task with detailed acceptance criteria.
- AC3: Publishing tests explicitly require publish-environment verification.
- AC4: Page-creation tests explicitly require create + publish + authoring-environment availability verification.
- AC5: Exhaustive sample-site component editing coverage requires one scenario or explicit blocker row for every generated UI component.
- AC6: Runtime board and task artifacts are updated with dependencies and next-role handoffs.

## Assumptions

- Local author profile remains the default automation path for bypassing external Keycloak.
- Publish-environment checks should use the configured publish/base URL from Selenium env configuration; if publish service is not running, the test must fail clearly or mark the environment blocker in evidence, not silently pass against author.
- Some admin UI controls visible today are placeholders or partially wired; delivery tasks must distinguish unsupported UI from product defects and document missing selectors/APIs.

