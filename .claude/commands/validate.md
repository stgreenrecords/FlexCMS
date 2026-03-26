You are reviewing completed work and validating the current project state. Execute ALL steps — this is the full §7 checklist from WORK_BOARD.md.

## Step 1: Build Backend

Run the full backend build and report results:
```bash
cd flexcms && mvn clean compile
```

Report: which modules compile successfully, which have errors.

## Step 2: Test Backend

Run all backend tests:
```bash
cd flexcms && mvn test
```

Report: total tests run, passed, failed, skipped. List any failures with class + method names.

## Step 3: Check Frontend

Check frontend package builds:
```bash
cd frontend && pnpm install && pnpm build
```

Report: which packages build successfully, which have errors.

## Step 4: Code Quality Scan

Check for violations:
1. **Mock data in production code:** Search for hardcoded arrays of fake data outside of test files.
2. **Debug statements:** Search for `System.out.println` in Java production code (not test code).
3. **Commented-out code:** Look for large blocks of commented code in recently changed files.

## Step 5: Verify Work Board Consistency

Read `WORK_BOARD.md` and check:
1. Are there any 🔵 IN PROGRESS items with no agent working? (orphaned tasks)
2. Are there module locks in §2 that don't match any IN PROGRESS item? (stale locks)
3. Are there any items marked ✅ DONE that have incomplete completion notes in §5?
4. Are there any items with blockers that are now resolved (blocker items are DONE)?
   - If so, list them — they can be unblocked (status should change from 🔴 BLOCKED to 🟢 OPEN).

## Step 6: Suggest Next Actions

Based on the current state, suggest:
1. Which PAUSED items need immediate pickup.
2. Which newly-unblocked items should be prioritized.
3. Any stale locks to clean up.
4. Compilation or test failures that need fixing.
5. Code quality issues found in Step 4.

Report all findings clearly with a summary verdict: **HEALTHY** / **NEEDS ATTENTION** / **BROKEN**.
