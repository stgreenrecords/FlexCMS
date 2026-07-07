# REB-22 — Implement experience-fragment and live-copy authoring Selenium E2E suite

## Summary

- Priority: P1
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Implement Selenium/API E2E coverage for reusable content authoring: experience fragments, variations, live-copy creation, rollout, detach, and inheritance status, including rendered/publish verification when reusable content affects a page.

## Read first

- `df/artifacts/REB-17/task.md`
- `df/artifacts/REB-18/task.md`
- `df/artifacts/REB-13/devops/summary.md`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/ExperienceFragmentController.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/LiveCopyController.java`
- `frontend/apps/admin/src/app/(admin)/experience-fragments/page.tsx`
- `frontend/apps/admin/src/app/editor/page.tsx`

## Dependencies

- REB-11
- REB-13
- REB-18

## Functional scope

- Experience-fragment create/list/get/delete.
- Variation add/list/delete.
- Editor links to global navigation/footer experience fragments.
- Live-copy create/list/status/rollout/detach.
- Editor inheritance cancellation from `REB-13` expanded to live-copy lifecycle.
- Publish verification for pages consuming changed XF/live-copy content.

## Required E2E scenarios

1. **XF browser smoke**: open experience fragments admin route, verify seeded fragments load or empty state is correct.
2. **Create XF**: create a unique test experience fragment through UI if wired, otherwise API helper plus UI verification; verify list/get endpoints.
3. **Add variation**: add master/mobile/email variation, verify variation list and detail payload.
4. **Edit reusable content**: update variation content/properties where editor supports it; verify author API persistence.
5. **XF publish impact**: attach or use the XF from a test page if supported, publish the page, and verify reusable content appears on publish environment.
6. **Delete variation/XF cleanup**: delete test-owned variation and XF; verify no seeded/global fragments are removed.
7. **Create live copy**: create a live copy from a test source page/subtree to a test target, verify relationship status.
8. **Rollout**: edit source, rollout to live copy, verify target received changes in author API/UI and rendered output after publish if target is publishable.
9. **Cancel inheritance/detach**: break inheritance for a field or detach live copy; edit source again, rollout, verify detached/overridden target keeps local value.
10. **Negative checks**: invalid source/target path or duplicate target should produce actionable validation/error evidence.

## Acceptance criteria

- AC1: Experience-fragment CRUD/variation flows and live-copy lifecycle are covered with deterministic test-owned data.
- AC2: Any reusable content publish scenario verifies the publish environment.
- AC3: Tests do not mutate seeded global navigation/footer without restoring them.
- AC4: Missing UI routes/actions are documented as blockers while API-backed E2E coverage validates backend functionality.
- AC5: Evidence is recorded in `df/artifacts/REB-22/devops/summary.md`.

