Pick the next task from the FlexCMS backlog and carry it to Done.

1. Read `AGENTS.md`, `docs/process/SDLC.md`, and `docs/process/TESTING.md` if they are not already in context this session.
2. Open `backlog/BOARD.md` and choose the task exactly as described in SDLC §3:
   - A task in **In Progress**: resume it from the last `Handoff:` entry in its Log.
   - Otherwise, the first **Ready** row whose **Depends on** tasks are all **Done**: build it.
   - Otherwise, the first **Needs Refinement** row whose dependencies are not themselves in **Needs Refinement**: refine it (SDLC §4). Stop when it meets the Definition of Ready and is moved to **Ready**.
   - Nothing eligible: report what blocks the top tasks, then stop.
3. Tell the user which task you picked and why, in one line.
4. Building: follow SDLC §5 step by step. Claim the task, understand it, write the tests from the test-case table, implement, make it green, run the quality gates (TESTING.md §7), update the spec and the board, then commit and push.
5. If you cannot finish, leave a `Handoff:` Log entry and keep the task **In Progress**. Move it to **Blocked** only if a human is needed.
6. Finish with a short report: the task, what changed, which tests were added, the gate results, and the new board status. Do not start another task unless the user asked for continuous work ($ARGUMENTS contains "loop" or "continue").

$ARGUMENTS
