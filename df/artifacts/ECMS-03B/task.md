# ECMS-03B — Frontend: reference site and admin use canonical asset URLs

## Summary

- Priority: P0
- Type: Story
- Current state: `DEV_IN_PROGRESS`
- Owner role: `frontend-dev`
- Parent: `ECMS-03` (design: `df/artifacts/ECMS-03/solution-design.md`, `DEC-ECMS-002`)

## Business goal

Visitors see the images on published pages; editors see unpublished images in draft preview.

## Acceptance criteria

- [ ] AC1: `site-nextjs` proxies `/dam/renditions/:path*` to the live route's API base and `/draft-dam/renditions/:path*` to the preview route's API base.
- [ ] AC2: `normalizePageAssetUrls` rewrites legacy and absolute author asset URLs to canonical `/dam/renditions/...`, and to `/draft-dam/renditions/...` in preview mode; unit tests cover each form.
- [ ] AC3: The admin DAM "Copy URL" action copies the canonical `/dam/renditions/{id}` URL.
- [ ] AC4: Selenium: publish a page that references a DAM image, load it on the site rendered from the publish tier, and assert the image loads (`naturalWidth > 0`).
- [ ] AC5: Developer testing bar (`DEC-DF-007`): scenarios recorded in `df/artifacts/ECMS-03B/frontend/`, frontend build and tests green.

## Dependencies

- ECMS-03A

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Split from ECMS-03. |
| 2026-09-24 local | frontend-dev | DEV_IN_PROGRESS | Started (Mode B). No design package needed: no visible layout change, only URL values and the Copy URL notice text. |
