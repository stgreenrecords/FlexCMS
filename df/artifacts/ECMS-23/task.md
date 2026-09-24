# ECMS-23 — Multi-site management completeness: rollout configs, inheritance control, conflicts

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Corporate changes reach every derived site automatically, while local teams keep the local changes they need.

## Current state in FlexCMS

Live copy create (deep, excluded properties), manual rollout, detach, list, and status exist in API. No rollout triggers, no per-component cancel/re-enable, no suspend/resume, no conflict rules; rollout of a nonexistent source answers 200 with 0 updates.

## Acceptance criteria

- [ ] AC1: Rollout configurations: trigger (manual, on source activation, on source modification) and actions (update content, add/remove pages, reorder, activate on rollout).
- [ ] AC2: Cancel and re-enable inheritance per page and per component; re-enable restores source content.
- [ ] AC3: Suspend/resume a whole live copy.
- [ ] AC4: Conflict rules for name collisions (source wins / local wins / rename local).
- [ ] AC5: Live-copy overview API with per-node status (inherited, cancelled, suspended, not rolled out).
- [ ] AC6: Rollout of a nonexistent source returns 404.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- UI (ECMS-24).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-multisite/src/main/java/com/flexcms/multisite/service/LiveCopyService.java`
- `df/artifacts/REB-22/devops/summary.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
