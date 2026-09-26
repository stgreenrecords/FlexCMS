Turn this request into backlog task(s): $ARGUMENTS

Follow `docs/process/SDLC.md` §8:

1. Read `backlog/BOARD.md`, related task specs, and the relevant code, so you know what already exists and which tasks it depends on.
2. Draft each task from `backlog/templates/task.md`, or from `backlog/templates/bug.md` for a defect. A draft includes:
   - The goal, acceptance criteria, and draft test cases (TESTING.md §4). At least one Playwright case covers each behavioural AC.
   - Dependencies, a proposed priority, and the next free ID from the top of `BOARD.md`.
   - A split into separate tasks if the work has more than 8 ACs or touches more than 4 modules.
3. Show the draft(s) and ask: "Does this match what you had in mind? Should I adjust the scope, priority, split, or ACs before I add it to the backlog?"
4. Only after the user confirms:
   - Write `backlog/tasks/<ID>.md`.
   - Add the row to **Ready** if it meets the Definition of Ready; otherwise add it to **Needs Refinement**, in priority order.
   - Bump **Next free IDs**.
5. Do not start implementing.
