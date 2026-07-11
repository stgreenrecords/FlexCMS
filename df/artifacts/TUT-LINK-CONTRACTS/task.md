# Task - TUT-LINK-CONTRACTS

## Summary

Correct TUT-USA component registry schemas so navigable content uses explicit link objects.

## Type

Bug

## Priority

P0

## Current state

DONE

## Business goal

Give seed generation, authoring, and renderers one enforceable `{label,url}` contract instead of incompatible string references and renderer guesses.

## Acceptance criteria

- [x] Add the next sequential CMS migration (`V18`) without modifying historical migrations.
- [x] Navigation primary links, utility links, and account/action entries expose explicit link-object schemas with non-empty label and URL fields.
- [x] Footer groups and their links, legal links, and social links expose link-object schemas consistent with current seeded JSON.
- [x] Any featured-content collection used as navigable cards exposes an explicit item link shape.
- [x] Existing unrelated component-definition fields and resource types are preserved.
- [x] Automated backend coverage verifies the migrated/public registry contract for every changed field.
- [x] `mvn test`, `mvn clean compile`, and the backend Docker image build pass with zero failures/errors.

## Out of scope

- Seed values and public-site renderer implementation.
- Rewriting `V16__tut_usa_component_definitions.sql`.

## Assumptions

- JSON Schema object collections are the canonical representation for authored links.
- A forward migration may update existing `component_definitions.data_schema` rows in place.

## Dependencies

- none

## Risks

- The generic admin property editor currently has limited nested-object editing; preserve registry compatibility and document any authoring limitation rather than weakening the public contract.

## Links

- Issue: n/a
- PR: n/a
- Design: `df/artifacts/TUT-LINK-INTEGRITY/solution-design.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-07-11 17:24 CEST | sa | OPEN → READY_FOR_DEV | Defined backend contract scope and routed to backend-dev. |
| 2026-07-11 17:56 CEST | backend-dev | READY_FOR_DEV → DEV_IN_PROGRESS | Confirmed V18 sequencing and scoped surgical navigation, footer, and featured-content schema corrections with automated registry coverage. |
| 2026-07-11 18:20 CEST | backend-dev | DEV_IN_PROGRESS → BLOCKED | Implementation, 495 tests, clean compile/install, and PostgreSQL 16 execution passed; mandatory Docker image build remains blocked by repeated Docker Hub timeouts. |
| 2026-07-11 21:21 CEST | backend-dev | BLOCKED → DEV_IN_PROGRESS → DONE | Registry access recovered; aligned Docker with Java 26/Spring Boot 4, then passed the exact image build and runtime/package validation. |

