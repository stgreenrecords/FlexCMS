# REB-20 — Implement publishing, workflow, scheduling, and bulk operation Selenium/API E2E suite

## Summary

- Priority: P0
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Implement E2E automation for publishing-related authoring flows: workflow lifecycle, publish/unpublish/status transitions, scheduled publish/deactivation, and bulk operations, with publish-environment verification whenever content is activated.

## Read first

- `df/artifacts/REB-17/task.md`
- `df/artifacts/REB-18/task.md`
- `df/artifacts/REB-13/devops/summary.md`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorWorkflowController.java`
- `frontend/apps/admin/src/app/(admin)/workflows/page.tsx`
- `frontend/apps/admin/src/app/(admin)/content/page.tsx`

## Dependencies

- REB-11
- REB-13
- REB-18

## Functional scope

- Content status transitions: `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`.
- Workflow start/advance/cancel/list/active lookup.
- Individual publish and bulk publish.
- Scheduled publish/deactivation API coverage with UI smoke where available.
- Bulk delete/move coverage on test-owned nodes.
- Publish service/rendered environment verification.

## Required E2E scenarios

1. **Workflow start**: create or select a test page, start approval workflow, verify active workflow appears via API and workflows UI.
2. **Workflow advance approve**: advance workflow through approval action, verify status/user/comment history according to backend response and UI list.
3. **Workflow reject/cancel**: start a second test workflow, reject or cancel it, verify cancelled/completed list and no active workflow remains.
4. **Individual publish**: edit a unique marker, publish, verify author status `PUBLISHED`, verify publish API/environment shows the marker.
5. **Bulk publish**: create two test pages, bulk publish, verify each path status and publish-environment visibility.
6. **Bulk move**: move test-owned content to a safe test folder, verify old path fails and new path works on author API/UI.
7. **Bulk delete**: delete test-owned nodes only; verify author UI/API no longer lists them.
8. **Scheduled publish**: schedule publish for a near-future or controllable test time if supported by local scheduler; verify schedule fields/state, then verify eventual publish or document scheduler blocker.
9. **Scheduled deactivation**: schedule deactivation for a published test page; verify deactivation state and publish-environment removal/404 or expected non-live state.
10. **Failure handling**: simulate publish target unavailable if safe or detect unavailable publish service; test must report environment blocker clearly rather than passing against author-only data.

## Acceptance criteria

- AC1: Publishing scenarios verify the publish environment, not only author or GraphQL on author.
- AC2: Workflow scenarios validate both API state and admin UI lists where UI is available.
- AC3: Bulk operations only mutate test-owned content and have deterministic cleanup.
- AC4: Scheduled operation tests either pass deterministically with controlled timing or document a precise scheduler/environment blocker.
- AC5: Reports and evidence are recorded in `df/artifacts/REB-20/devops/summary.md`.

