Validate the project state. Run every check, even after one fails, and report PASS / FAIL / SKIPPED (with the reason) for each.

**Quality gates** (`docs/process/TESTING.md` §7):
1. `cd flexcms && mvn clean compile`
2. `cd flexcms && mvn verify` (needs Docker; this also runs the unit tests)
3. `cd frontend && pnpm install && pnpm build`
4. `cd frontend && pnpm test`
5. `cd frontend && pnpm test:e2e` (mocked Playwright, chromium)
6. `cd frontend && pnpm test:e2e:live` — only if the stack is up (`flex status`). Otherwise SKIPPED, with the reason.

**Backlog consistency** (`backlog/`):
7. Every board row has a spec, and every spec has exactly one board row.
8. At most one task is In Progress.
9. Every Done task has all its ACs ticked, and every test-case row has **Automated in** filled.
10. Every file named in **Automated in** exists, and contains the TC ID in a test title.
11. Every **Depends on** ID exists, and no Ready task depends on a task in Needs Refinement.

**Code quality**:
12. No `System.out.println` in `flexcms/**/src/main`, no stray `console.log` in `frontend/apps/*/src` or `frontend/packages/*/src`, no commented-out code blocks, and no mock data in production code.
13. No `test.only`, and no new `test.skip` without a linked task ID in its reason.

End with a list of the exact fixes required for every FAIL. Do not fix anything unless the user asks.
