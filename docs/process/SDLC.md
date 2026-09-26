# FlexCMS SDLC

How work moves from an idea to shipped, tested code. Every AI agent and every human follows this document. There are no other workflows.

**Roles**
- **Human (product owner):** adds requests, sets priorities, answers questions on **Blocked** tasks, and reviews commits.
- **AI agent (engineer):** refines, implements, and tests. One agent session works on one task at a time and carries it from **Ready** to **Done**, including all tests.

---

## 1. Where things live

| What | Where |
|---|---|
| Task status (the only place) | [`backlog/BOARD.md`](../../backlog/BOARD.md) |
| Task specs: goal, ACs, test cases, design, log | `backlog/tasks/<ID>.md` |
| Long technical designs | `backlog/designs/<ID>.md` |
| Templates | [`backlog/templates/`](../../backlog/templates/) |
| Testing standard (Playwright) | [`docs/process/TESTING.md`](TESTING.md) |
| Known problems and fixes | [`docs/process/HINTS.md`](HINTS.md) |
| Architecture decisions | [`docs/architecture/DECISIONS.md`](../architecture/DECISIONS.md) |
| Product rules | [`docs/product/BUSINESS_CONTEXT.md`](../product/BUSINESS_CONTEXT.md) |
| Code conventions and commands | [`AGENTS.md`](../../AGENTS.md) |

---

## 2. Task lifecycle

```
                ┌────────────────────── Blocked ◄──────────────────────┐
                │   (needs a human answer; back to where it was)       │
                ▼                                                      │
 Needs Refinement ──(DoR met)──► Ready ──(claimed)──► In Progress ──(DoD met)──► Done
```

| Status | Meaning | Who moves it out |
|---|---|---|
| **Needs Refinement** | The idea exists, but it is not specified well enough to build. It might lack a technical design, a UI spec, or final test cases, or it might be too big. | Agent, by refining it (§4) |
| **Ready** | Meets the Definition of Ready. It can be built once every task in **Depends on** is **Done**. | Agent, by claiming it |
| **In Progress** | An agent is building it. The task's **Log** says where it stands. | The same agent, or the next session resuming it |
| **Blocked** | Waiting for a human. The question is in the task's **Questions** section. | Human answers, then the agent moves it back |
| **Done** | Meets the Definition of Done (§6). | — |

**Rules**
- **Status lives in `BOARD.md` only.** To change a status, move the task's row to the table for its new status, and add a line to the task's **Log**.
- **Only one task may be In Progress per agent.** If you run several agents in parallel, give each one an explicit ID (`pick <ID>`) and a separate git worktree.
- **Board order is priority order.** Within each table, rows are sorted P0 → P3. Keep them sorted when you add or move rows.

---

## 3. Picking the next task

This is what `implement` (or "next task") means. Run these steps in order and stop at the first match:

1. **Resume:** if a task is **In Progress**, resume it. Read its **Log**; the last entry is the handoff.
2. **Build:** take the first **Ready** task, top to bottom, whose **Depends on** tasks are all **Done**.
3. **Refine:** take the first **Needs Refinement** task, top to bottom, whose **Depends on** tasks are not themselves in **Needs Refinement**. You cannot design on top of something that has no design yet.
4. **Nothing is eligible:** report this to the user and list what is blocking the top tasks.

`pick <ID>` skips this selection. It still refuses to build a task whose dependencies are not **Done**. In that case, report which dependency is outstanding.

---

## 4. Refinement

The exit criteria of refinement are the **Definition of Ready**.

Refining a task means editing its spec until **every** item below holds, then moving the row to **Ready**.

- [ ] **Goal and ACs are testable.** Each acceptance criterion describes observable behaviour, such as an API response, UI state, or persisted data. Avoid "works well".
- [ ] **Technical design exists** if the task touches a DB schema, a public API contract, replication, or more than one layer. Put it in the spec's `## Technical design` section, or in `backlog/designs/<ID>.md` if it runs longer than about 60 lines. Record any decision future work must respect in [`DECISIONS.md`](../architecture/DECISIONS.md).
- [ ] **UI is specified** if the task has visible UI. Either link the reference in `Design/UI/stitch_flexcms_admin_ui_requirements_summary/<page>/`, or write a `## UI design` section. That section covers layout, the `@flexcms/ui` components used, the loading, empty and error states, the breadcrumb, and the nearest existing screen to match.
- [ ] **Test cases are final.** The `## Test cases` table must meet all of the following ([TESTING.md §4](TESTING.md#4-test-cases-in-the-task-spec)):
  - Every AC is covered by at least one test case.
  - Every AC with observable behaviour has at least one **Playwright** test case (`api`, `ui` or `e2e`).
  - Negative and edge cases are included, such as validation errors, 404/409, permissions, and empty states.
- [ ] **Size is bounded.** The task has at most 8 ACs and touches at most 4 modules or packages. If it is bigger, split it into child tasks. Each child gets a new ID, a `Parent` link, and its own dependencies; the children carry the ACs. The parent keeps the design and moves to **Done** once the split is complete, with its Log listing the children.
- [ ] **Dependencies are listed** in `Depends on`.
- [ ] **No open product questions.** If a decision belongs to the human, such as scope, business rules, or naming, write it under `## Questions` and move the task to **Blocked** instead of guessing. Technical decisions are yours: make them and record them.

---

## 5. Implementation workflow

Every step applies to every task.

| # | Step | Details |
|---|---|---|
| 0 | **Read hints** | Skim [`HINTS.md`](HINTS.md) for your stack. It lists known dead ends and their fixes. |
| 1 | **Claim** | Move the row to **In Progress** and add a Log line: `Started`. |
| 2 | **Understand** | Read the whole spec, every file in `Read first`, and the current source of each module you will touch. Never code from assumptions: another session may have changed the code. For UI work, read the design files (`screen.png` and `code.html`). If the test-case table is still marked **Draft** (tasks migrated on 2026-09-26), finalize it now to the Definition of Ready standard. |
| 3 | **Write the tests first where practical** | Turn the test-case table into Playwright specs, plus unit and integration tests, as described in [TESTING.md](TESTING.md). Watch them fail for the right reason. |
| 4 | **Implement** | Follow the layering and conventions in [`AGENTS.md`](../../AGENTS.md). Check off each AC in the spec as you satisfy it. |
| 5 | **Make it green** | Run the task's tests (`--grep @<ID>`) and fix the code until they pass. If a test is wrong, fix the test. If the product is wrong, fix the product. Never weaken an assertion to get green ([TESTING.md §8](TESTING.md#8-when-a-test-fails)). |
| 6 | **Run the quality gates** | Run every gate that applies ([TESTING.md §7](TESTING.md#7-quality-gates)). All must pass. |
| 7 | **Update the spec** | Tick the ACs, and fill **Automated in** for every test case. Add a Log entry covering what changed, which tests were added, and the gate results. |
| 8 | **Update the board** | Move the row to **Done**. |
| 9 | **Commit and push** | See §9. One task per commit, or a small series of commits for one task. |

**If you have to stop before Done**, leave the build compiling and keep the task **In Progress**. Add a Log entry that starts with `Handoff:`. Say what is finished, what is left, the exact next step, and the current state of any failing test or gate. The next session resumes from that entry.

**If you are stuck after three honest attempts** at the same failure, write down what you tried in the Log. If a human decision or environment fix is needed, move the task to **Blocked** with a clear question. If you found the solution after two or more failed attempts, add it to [`HINTS.md`](HINTS.md).

---

## 6. Definition of Done

A task is **Done** only when **all** of these are true:

- [ ] Every acceptance criterion is ticked in the spec.
- [ ] Every test case is automated, its **Automated in** column names the spec file, and it passes. User-visible behaviour is covered by Playwright; lower levels complement it and never replace it.
- [ ] All applicable quality gates pass locally ([TESTING.md §7](TESTING.md#7-quality-gates)), with zero failures and no skipped or `.only` tests added.
- [ ] No mock or dummy data in production code, no `System.out.println` or `console.log` debugging, and no commented-out code.
- [ ] Architecture rules are respected (see `AGENTS.md`: layering, DTOs, transactions, no `FetchType.EAGER`).
- [ ] Docs are updated where behaviour or contracts changed: API docs, the `component_definitions` schema, and `README`/`docs` sections.
- [ ] The spec **Log** has a completion entry and the board row is under **Done**.

---

## 7. Bugs

- **File a bug** with [`templates/bug.md`](../../backlog/templates/bug.md). It needs steps to reproduce, the expected and actual result, and the evidence: a response body, a screenshot, or a `file:line`.
- **Every bug fix starts with a failing regression test.** Write it at the lowest level that reproduces the bug. Add a Playwright test too whenever the bug is user-visible or API-visible. The test's title carries the bug ID.
- **A bug found during another task** is recorded under that task's Log if it is inside that task's scope. If it is outside the scope, file it as a new `BUG-###` on the board.

---

## 8. Adding new work

When the user asks for new work:

1. Read the board, the related specs, and the code. Find what already exists.
2. Draft the task(s) from [`templates/task.md`](../../backlog/templates/task.md). Include the goal, ACs, draft test cases, dependencies, and a proposed priority. Split any task that exceeds the size limit.
3. **Show the draft to the user and wait for confirmation** before writing it, unless they said to just add it.
4. Write `backlog/tasks/<ID>.md` and add the row to the right table in `BOARD.md`: **Ready** if it meets the DoR, otherwise **Needs Refinement**. Bump **Next free IDs**.
5. Do not start implementing. Adding work and building it are separate requests.

### ID scheme

| Prefix | Use |
|---|---|
| `ECMS-##` | Enterprise-CMS parity program (existing series) |
| `FEAT-###` | New feature or story outside a program |
| `BUG-###` | Defect |
| `TEST-###` | Test automation work that is not part of a feature |
| `TECH-###` | Refactoring, tooling, infrastructure, tech debt |

IDs are never reused. The next free number of each series is at the top of `BOARD.md`.

---

## 9. Commits

- Conventional commits, with the task ID as the scope: `feat(ECMS-01): tag CRUD API`, `fix(BUG-003): dashboard counts active sites`, `test(TEST-002): port template suites`, `chore(TECH-001): …`, `docs(…): …`.
- Include the spec and board changes in the same commit as the code.
- Push only after every quality gate has passed locally. Never force-push. If the push is rejected, run `git pull --rebase` and re-run the gates if anything changed.
