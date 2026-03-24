You are starting an implementation session on FlexCMS. Execute the following steps IN ORDER — do not skip any step.

## Step 1: Read Core Documentation

Read these files completely to understand the project:

1. Read `WORK_BOARD.md` — the entire file. This is the coordination system.
2. Read `README.md` section §9 "AI Agent Onboarding Guide" — architecture, conventions, file map.

## Step 2: Identify Next Task

From `WORK_BOARD.md` §3, find the next task to work on:

1. Look for items with status 🟢 OPEN.
2. Among OPEN items, first check for any 🟠 PAUSED items — these have priority because another agent started them. Read their handoff notes in §5 to continue.
3. If no PAUSED items, pick the highest priority OPEN item (🔴 P0 first) that has NO blockers (check "Blocked By" column — all items listed there must be ✅ DONE).
4. Verify no module conflict: check §2 Module Lock Table — if any module in the item's "Modules Touched" column is locked by another IN PROGRESS item, skip to the next eligible item.

## Step 3: Claim the Task

1. Update the item's status from 🟢 OPEN to 🔵 IN PROGRESS in `WORK_BOARD.md` §3.
2. Update the Module Lock Table in §2: set "Locked By Item" and "Agent" columns for every module this item touches.

## Step 4: Read Context Packet

Look up the item ID in `WORK_BOARD.md` §4 "Context Packets":
- If a context packet exists for this item: read ALL files listed in `read_first`, understand the `understand` section, note the `acceptance_criteria` and `output_files`.
- If no context packet exists: read the item's description and "Modules Touched" column, then read the relevant source files in those modules to understand the current state.

If this task touches the frontend, also read `Design/DesignerPrompt.md` §8 for mandatory style rules.

## Step 5: Implement

Now implement the task. Follow these rules:
- Follow all conventions from `CLAUDE.md`.
- Verify each acceptance criterion as you work.
- If you create new files, follow the existing package/folder structure in the target module.
- If you modify existing files, preserve existing code style.
- Validate with build commands after implementation.

## Step 6: Validate

Run the appropriate build commands:
- Backend changes: `cd flexcms && mvn clean compile` (at minimum). Run `mvn test` if tests exist for the module.
- Frontend changes: check for TypeScript errors.
- Fix any compilation errors before proceeding.

## Step 7: Update Work Board

1. If task is COMPLETE: update status to ✅ DONE in §3. Clear module locks in §2. Add a Completion Note in §5 using the DONE template (list all AC verifications, files changed, build status).
2. If you must STOP before finishing: update status to 🟠 PAUSED in §3. Add a Handoff Note in §5 using the PAUSED template (progress %, what was done, what remains, where you stopped, exact continuation steps).

## Step 8: Continue Automatically

After updating the work board, immediately invoke the `/implement` command again to pick up the next task. Do not wait for the user — keep working through the backlog until the user interrupts the session.

## Begin

Start with Step 1 now. Read `WORK_BOARD.md` completely, then proceed through each step.

