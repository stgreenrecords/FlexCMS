Implement a specific work item. The user will provide the item ID (e.g., P1-04, P3-01, BUG-02).

Item to implement: $ARGUMENTS

## Step 1: Read Work Board

Read `WORK_BOARD.md`. Find the item with the specified ID in §3.

- If the item doesn't exist, report the error and list available OPEN items.
- If the item is not OPEN or PAUSED, report its current status and suggest alternatives.
- If the item has unresolved blockers, report which blockers must be completed first.

## Step 2: Claim

1. Update the item status to 🔵 IN PROGRESS in §3.
2. Lock the modules in §2.

## Step 3: Load Context

Read the Context Packet in §4 for this item. If none exists, read the source files in the modules listed in "Modules Touched".

If the task is frontend-related, also read `Design/DesignerPrompt.md` §8.

## Step 4: Implement

Implement the task following all acceptance criteria. Follow `CLAUDE.md` conventions.

## Step 5: Validate and Complete

Run builds, verify AC, update WORK_BOARD.md (status, module locks, completion notes in §5).

