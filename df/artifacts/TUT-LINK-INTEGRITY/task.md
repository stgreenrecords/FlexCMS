# Task - TUT-LINK-INTEGRITY

## Summary

Plan and coordinate remediation of every non-functional link rendered by the seeded TUT-USA public website.

## Type

Bug

## Priority

P0

## Current state

DONE

## Business goal

Every visible website link must navigate to useful seeded content or a valid external destination instead of `#`, an absent route, or static non-interactive text.

## Acceptance criteria

- [ ] Every internal link emitted by TUT-USA seed data resolves to a published page in the authoritative seed inventory; when a useful destination does not exist, the seed creates and publishes it.
- [ ] Navigation, account/action, hero, card, featured-content, breadcrumb, footer, legal, and CTA link contracts contain explicit accessible labels and destinations rather than relying on renderer hardcoding.
- [ ] The reference site renders every authored link contract as a keyboard-focusable anchor with the authored destination; it does not generate `href="#"` or silently replace authored links with hardcoded placeholders.
- [ ] Fragment links resolve to an element with the matching `id` on the destination page, or are replaced by dedicated seeded legal pages.
- [ ] A deterministic seed-integrity test recursively discovers link-like URL fields and fails on empty, `#`, malformed, or missing internal destinations.
- [ ] Selenium discovers every seeded page, inventories every rendered anchor, clicks or navigates to each unique internal destination, and reports zero missing/error routes, zero empty/hash-only hrefs, and zero missing fragment targets.
- [ ] Valid external links are checked for URI shape and safe new-tab semantics without making completion depend on third-party availability.
- [ ] Reseeding remains idempotent and the full backend/frontend build plus relevant unit and Selenium suites pass with zero failures.

## Out of scope

- Implementing production search indexing or dealer/business backends; seeded destination pages may provide useful demo content and links to existing journeys.
- Requiring live third-party social sites to return HTTP 200 during deterministic tests.
- Redesigning the established TUT-USA visual language.

## Assumptions

- “All links” means all rendered `<a>` elements and all authored data fields intended to become links across every page discovered under `/content/tut-usa`, including global experience fragments.
- Interactive controls that do not navigate, such as filters and form submit buttons, are tested according to their own behavior and are not converted to anchors.
- Existing page routes are preferred; a new seeded page is added only when no semantically correct existing destination exists.

## Dependencies

- none

## Risks

- Component definitions currently type some link collections as string references while seed data supplies objects; changing that contract requires an additive Flyway migration before reseeding.
- Existing reference-site renderers hardcode `#` destinations and ignore authored data, so a data-only fix cannot satisfy the request.
- Current concurrent frontend work touches the shared component registry and must finish before the renderer child begins.

## Links

- Issue: n/a
- PR: n/a
- Design: `df/artifacts/TUT-LINK-INTEGRITY/solution-design.md`

## Child tasks

- `TUT-LINK-CONTRACTS` — backend-dev
- `TUT-LINK-SEED` — data-engineer; depends on `TUT-LINK-CONTRACTS`
- `TUT-LINK-RENDERING` — frontend-dev; depends on `TUT-LINK-SEED` and shared frontend work

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-07-11 17:24 CEST | sa | OPEN → INTAKE → REFINED → ARCHITECTURE_IN_PROGRESS → DONE | Refined the defect, audited seed/schema/render/test boundaries, split delivery by lane, and produced architecture and handoff artifacts. |

