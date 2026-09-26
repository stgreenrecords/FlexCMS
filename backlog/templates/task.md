# <ID> — <Action-oriented title>

| Field | Value |
|---|---|
| Type | Story / Tech / Test / Spike |
| Priority | P0 / P1 / P2 / P3 |
| Area | Backend / Frontend / Full-stack / Site / Infra |
| Parent | — |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

<One or two sentences: who benefits and what they can do afterwards.>

## Current state

<What exists today, with file paths. What is missing or broken.>

## Acceptance criteria

- [ ] AC1: <Observable, testable behaviour, e.g. "POST /api/author/tags returns 201 and the tag is listed by GET">
- [ ] AC2: …

## Test cases

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| <ID>-TC01 | AC1 | api | Given …, when …, then … | — |
| <ID>-TC02 | AC1 | api | Given …, when <invalid input>, then 422 problem+json with field errors | — |
| <ID>-TC03 | AC2 | ui | Given the API returns …, when the user …, then the page shows … | — |
| <ID>-TC04 | AC2 | e2e | Given a real …, when the user … in the admin, then the backend has … and the site shows … | — |

<!-- Levels: unit, integration, api, ui, e2e, a11y, visual — see docs/process/TESTING.md §2.
     Every AC is covered; every behavioural AC has a Playwright case (api/ui/e2e); include negative cases. -->

## Technical design

<Needed when the task touches a schema, a public API contract, replication, or several layers:
data model, endpoints (method, path, request/response, errors), migrations, affected modules, risks.
Move it to backlog/designs/<ID>.md if it runs longer than about 60 lines.>

## UI design

<Needed for visible UI without a reference in Design/UI/: layout, @flexcms/ui components,
loading, empty and error states, breadcrumb, and the nearest existing screen to match.>

## Out of scope

- …

## Questions

<Open product questions for the human. If any exist, the task is Blocked.>

## Read first

- `path/to/relevant/File.java`

## Log

| Date | Note |
|---|---|
| YYYY-MM-DD | Created. |
