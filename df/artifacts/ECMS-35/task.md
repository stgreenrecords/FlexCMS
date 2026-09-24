# ECMS-35 — GraphQL generated from fragment models, with persisted queries

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Front-end and mobile developers self-serve fast, cacheable structured content.

## Current state in FlexCMS

GraphQL is hand-written for pages/nodes/PIM; not model-driven; no persisted queries.

## Acceptance criteria

- [ ] AC1: GraphQL types, list/filter/sort/paginate queries generated from fragment models and regenerated on model change.
- [ ] AC2: Nested fragment-reference traversal with depth limits.
- [ ] AC3: Persisted queries executable by GET with cache headers and CDN purge on content change.
- [ ] AC4: Existing page/PIM GraphQL keeps working.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-34

## Read first

- `flexcms/flexcms-headless/src/main/resources/graphql/schema.graphqls`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
