You are reviewing completed work and validating the current project state. Execute these steps:

## Step 1: Build Backend

Run the full backend build and report results:
```bash
cd flexcms && mvn clean compile
```

Report: which modules compile successfully, which have errors.

## Step 2: Check Frontend

Check frontend package builds:
```bash
cd frontend && pnpm install && pnpm build
```

Report: which packages build successfully, which have errors.

## Step 3: Verify Work Board Consistency

Read `WORK_BOARD.md` and check:
1. Are there any 🔵 IN PROGRESS items with no agent working? (orphaned tasks)
2. Are there module locks in §2 that don't match any IN PROGRESS item? (stale locks)
3. Are there any items marked ✅ DONE that have incomplete completion notes in §5?
4. Are there any items with blockers that are now resolved (blocker items are DONE)?
   - If so, list them — they can be unblocked (status should change from 🔴 BLOCKED to 🟢 OPEN).

## Step 4: Suggest Next Actions

Based on the current state, suggest:
1. Which PAUSED items need immediate pickup.
2. Which newly-unblocked items should be prioritized.
3. Any stale locks to clean up.
4. Compilation errors that need fixing.

Report all findings clearly.

