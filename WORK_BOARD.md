# WORK_BOARD.md — FlexCMS Shared Coordination Hub

> **This file is the shared coordination layer for all agents.**
> It contains the module lock table (prevents two agents editing the same module simultaneously)
> and routes agents to their own task boards.
>
> **Kyle's tasks:** `WORK_BOARD_KYLE.md`
> **Erik's tasks:** `WORK_BOARD_ERIK.md`
> **Completed tasks archive:** `docs/WORK_BOARD_ARCHIVE.md`
>
> Updated: 2026-03-28

---

## §1 — Overview & Legend

### Status Icons
| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | OPEN | Available for pickup |
| 🔵 | IN PROGRESS | An agent is actively working on it |
| 🟠 | PAUSED | Partially done — needs handoff (see §5 in agent's board) |
| 🔴 | BLOCKED | Cannot start until blocker items are ✅ DONE |
| ✅ | DONE | Completed and validated |

### Priority Levels
| Label | Meaning |
|-------|---------|
| 🔴 P0 | Critical — blocks production or other tasks |
| 🟠 P1 | High — blocks enterprise deployment |
| 🟡 P2 | Medium — enhances enterprise value |
| 🟢 P3 | Nice-to-have — polish & optimization |
| 🧪 TA | Test automation (Playwright E2E) |

### Agent Roster
| Agent | Work Board | Specialization |
|-------|-----------|----------------|
| **Kyle** | `WORK_BOARD_KYLE.md` | Test automation (current focus) |
| **Erik** | `WORK_BOARD_ERIK.md` | No tasks assigned yet |

### How to Add a Task
Use one of these formats when requesting new work:
- `work for kyle <task description>` — adds task to Kyle's board
- `work for erik <task description>` — adds task to Erik's board

### How to Implement
- `kyle implement` or `kyle /implement` — Kyle picks his next open task
- `erik implement` or `erik /implement` — Erik picks his next open task
- `kyle pick <TASK-ID>` — Kyle implements a specific task
- `erik pick <TASK-ID>` — Erik implements a specific task

> **If an agent or agent name is not specified, the AI assistant MUST ask "Is this for Kyle or Erik?" before doing anything.**

---

## §2 — Module Lock Table (SHARED)

> **CRITICAL:** Both Kyle and Erik MUST check this table before editing any file.
> A lock held by one agent blocks the other. Check before you claim.

### Backend Modules

| Module | Locked By Item | Agent | Since |
|--------|---------------|-------|-------|
| `flexcms-core` | — | — | — |
| `flexcms-plugin-api` | — | — | — |
| `flexcms-author` | — | — | — |
| `flexcms-publish` | — | — | — |
| `flexcms-headless` | — | — | — |
| `flexcms-dam` | — | — | — |
| `flexcms-replication` | — | — | — |
| `flexcms-cache` | — | — | — |
| `flexcms-cdn` | — | — | — |
| `flexcms-i18n` | — | — | — |
| `flexcms-multisite` | — | — | — |
| `flexcms-search` | — | — | — |
| `flexcms-clientlibs` | — | — | — |
| `flexcms-pim` | — | — | — |
| `flexcms-app` | — | — | — |

### Frontend Packages

| Package | Locked By Item | Agent | Since |
|---------|---------------|-------|-------|
| `packages/sdk` | — | — | — |
| `packages/react` | — | — | — |
| `packages/vue` | — | — | — |
| `packages/ui` | — | — | — |
| `apps/admin` | — | — | — |
| `apps/admin-e2e` | — | — | — |
| `apps/site-nextjs` | — | — | — |
| `apps/site-nuxt` | — | — | — |
| `apps/build-worker` | — | — | — |

### Infrastructure & Config

| Area | Locked By Item | Agent | Since |
|------|---------------|-------|-------|
| `infra/local` | — | — | — |
| `infra/cfn` | — | — | — |
| `.github/workflows` | — | — | — |
| `flexcms/docker-compose.yml` | — | — | — |
| Flyway migrations (CMS) | — | — | — |
| Flyway migrations (PIM) | — | — | — |

---

## §7 — Validation Checklist (for `/validate` command)

When running `/validate`, check ALL of the following:

### Build Health
- [ ] `cd flexcms && mvn clean compile` — all backend modules compile
- [ ] `cd flexcms && mvn test` — all unit tests pass
- [ ] `cd frontend && pnpm install && pnpm build` — all frontend packages build
- [ ] No TypeScript errors in frontend
- [ ] If `admin-e2e` exists: `cd frontend/apps/admin-e2e && pnpm exec playwright test --project=chromium` — 0 failing tests

### Work Board Consistency
- [ ] No 🔵 IN PROGRESS items without an active agent (check both Kyle's and Erik's boards)
- [ ] No stale module locks in §2 (locks without matching IN PROGRESS task)
- [ ] Every ✅ DONE item has a completion note in §5 of the relevant agent board
- [ ] All blockers for 🔴 BLOCKED items checked — unblock if blocker is ✅ DONE
- [ ] All `🐛 BUG-INLINE` entries in §4 for completed TA tasks are `✅ FIXED`

### Code Quality
- [ ] No mock/dummy data in production code (only in test classes)
- [ ] No `System.out.println` debugging statements
- [ ] No commented-out code blocks (clean up or remove)
- [ ] All new files follow naming conventions from `CLAUDE.md`

### CI/CD
- [ ] Latest commit pushed to `main`
- [ ] GitHub Actions CI workflow passed
