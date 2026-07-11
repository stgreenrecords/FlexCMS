# Task - TUT-LINK-SEED

## Summary

Rebuild the TUT-USA seed page/link graph so every authored internal destination exists and is published.

## Type

Bug

## Priority

P0

## Current state

READY_FOR_DEV

## Business goal

Ensure seeded content never contains placeholder or missing destinations and creates useful pages when a referenced journey does not yet exist.

## Acceptance criteria

- [ ] Convert all global navigation/account/actions and every page-builder link-like value to explicit accessible link objects matching the corrected registry contract.
- [ ] Every semantically navigable seeded card/list item has a useful destination; decorative/non-navigable content is not falsely represented as a link.
- [ ] Add and publish useful pages for unresolved internal destinations, including search/legal journeys where no existing seeded page is semantically correct.
- [ ] Remove empty, `#`, missing-fragment, and missing-page internal destinations from generated content.
- [ ] Add a pre-write recursive validator covering all page components and global experience fragments; it fails with source field/path diagnostics for malformed or unresolved URLs.
- [ ] Add Python unit tests covering valid routes, missing routes, query/fragment normalization, safe external/special schemes, unsafe schemes, nested collections, and the complete generated graph.
- [ ] Run the seeder twice against the live local Author stack; both runs succeed without duplicates and all new pages/components are published.
- [ ] Record generated page count, link count by type, and zero unresolved internal destinations in `df/artifacts/TUT-LINK-SEED/data/`.

## Out of scope

- Reference-site renderer changes.
- Building a production search engine UI or external social content.

## Assumptions

- Existing pages are reused when semantically correct; otherwise a lightweight page using an existing template/builder is added to `PAGES`.
- Deterministic validation must run before any seed mutation.

## Dependencies

- TUT-LINK-CONTRACTS

## Risks

- The current seeder updates nodes in place because subtree deletion is unavailable; stale child properties must be explicitly overwritten when link shapes change.

## Links

- Issue: n/a
- PR: n/a
- Design: `df/artifacts/TUT-LINK-INTEGRITY/solution-design.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-07-11 17:24 CEST | sa | OPEN → READY_FOR_DEV | Defined data graph, integrity validation, idempotency, and live reseed evidence requirements. |

