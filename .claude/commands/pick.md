Work on one specific backlog task: $ARGUMENTS

1. Read `AGENTS.md`, `docs/process/SDLC.md`, and `docs/process/TESTING.md` if they are not already in context this session.
2. Find the task's row in `backlog/BOARD.md` and open `backlog/tasks/<ID>.md`. If either one is missing, report it and stop.
3. Act on the task's current status:
   - **Needs Refinement**: refine it until it meets the Definition of Ready (SDLC §4), then move it to **Ready**. Build it only if the user asked for that too.
   - **Ready** or **In Progress**: check that every **Depends on** task is **Done**. If one is not, name it and stop. Otherwise follow SDLC §5 through to **Done**.
   - **Blocked**: show the open questions from the spec and stop.
   - **Done**: say so and stop.
4. Finish with a short report: what changed, which tests were added, the gate results, and the new board status.
