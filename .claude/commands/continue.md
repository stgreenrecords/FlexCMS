Continue work on a paused task. Execute these steps:

## Step 1: Find Paused Work

Read `WORK_BOARD.md` §3 and find items with status 🟠 PAUSED. If multiple exist, pick the one with highest priority.

## Step 2: Read Handoff Notes

Go to `WORK_BOARD.md` §5 and read the handoff note for this item. It contains:
- What was already done
- What remains
- Current state of code (does it compile?)
- Exact instructions for where to continue

## Step 3: Read Context

Read the Context Packet in §4 for this item (if one exists). Also read any files mentioned in the handoff note's "Current state of code" section.

## Step 4: Claim and Continue

1. Update the item status to 🔵 IN PROGRESS in §3.
2. Verify module locks in §2 are still set for this item.
3. Follow the "To continue" steps from the handoff note exactly.

## Step 5: Implement

Continue the implementation from where the previous agent stopped. Follow all conventions from `CLAUDE.md`.

## Step 6: Validate and Finish

When done, use the same completion protocol: validate builds, update §3 status, clear module locks in §2, add completion notes in §5.

## Begin

Start by reading `WORK_BOARD.md` now. Find the paused item and its handoff notes.

