# ECMS-52 — Users, groups, and role management API

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Admins manage who can do what from inside the product.

## Current state in FlexCMS

Identity is delegated entirely to Keycloak JWT roles; there is no in-product user or group management.

## Acceptance criteria

- [ ] AC1: Solution design: proxy Keycloak's admin API vs. a local group model mapped to Keycloak identities; records the decision.
- [ ] AC2: List/search users, manage groups and group membership, map groups to roles.
- [ ] AC3: Groups usable as ACL principals and workflow participants.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-app/src/main/java/com/flexcms/app/config/SecurityConfig.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/NodeAclController.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
