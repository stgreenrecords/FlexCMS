You are finishing your current implementation session. Execute these steps:

## Step 1: Identify Your Active Task

Read `WORK_BOARD.md` §3 and find the item with status 🔵 IN PROGRESS assigned to you.

## Step 2: Assess Completion

Check ALL acceptance criteria for your task (from §4 Context Packets or the task description):
- If ALL acceptance criteria are met → proceed to Step 3A (DONE).
- If some work remains → proceed to Step 3B (PAUSE).

## Step 3A: Mark as DONE

1. Run final validation:
   - Backend: `cd flexcms && mvn clean compile`
   - Frontend: verify no TypeScript errors
2. Update `WORK_BOARD.md` §3: change status to ✅ DONE.
3. Update `WORK_BOARD.md` §2: clear ALL module locks for your task.
4. Add a Completion Note in `WORK_BOARD.md` §5 using this format:

```
### [ITEM-ID] — Title
**Status:** ✅ DONE
**Date:** [today's date]
**AC Verification:**
  - [x] AC 1 — verified by [how]
  - [x] AC 2 — verified by [how]
**Files Changed:**
  - path/to/file — [what changed]
**Build Verified:** Yes — [command used]
**Notes:** [anything relevant]
```

## Step 3B: Mark as PAUSED

1. Ensure the code compiles (no half-broken state).
2. Update `WORK_BOARD.md` §3: change status to 🟠 PAUSED.
3. Keep module locks in §2 (the next agent will need them).
4. Add a Handoff Note in `WORK_BOARD.md` §5 using this format:

```
### [ITEM-ID] — Title
**Status:** 🟠 PAUSED
**Date:** [today's date]
**Progress:** [X]% complete
**What was done:**
  - [completed sub-tasks]
**What remains:**
  - [remaining sub-tasks]
**Current state of code:**
  - path/to/file — [state: compiles? complete?]
**Where I stopped:**
  [Exact description of where you stopped and why]
**To continue:**
  1. [Step-by-step instructions for next agent]
  2. [Be very specific — file names, method names, what to implement next]
```

## Step 4: Final Report

Summarize what you accomplished in this session and any issues discovered.

