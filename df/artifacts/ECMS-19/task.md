# ECMS-19 — Content policies and component style variants

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Brand and legal guardrails are enforced by reusable policies, and one component can offer several approved looks without new code.

## Current state in FlexCMS

`ComponentDefinition.policies` is an unmanaged JSONB column; palette restriction is client-side only; there is no style-variant mechanism.

## Acceptance criteria

- [ ] AC1: Reusable policy entities: container policy (allowed components) and component policy (enabled RTE features, allowed image ratios, default values, feature toggles).
- [ ] AC2: Style groups on component policies, single-select or multi-select, mapping style names to CSS classes; defaults supported.
- [ ] AC3: Applied styles persist on the component node and are delivered in page JSON.
- [ ] AC4: Policies are shared between templates; changing one propagates to all users of it.
- [ ] AC5: Server-side enforcement of container policies (coordinated with ECMS-18).

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- Editor style picker and renderer class application (ECMS-21).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-18

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ComponentDefinition.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
