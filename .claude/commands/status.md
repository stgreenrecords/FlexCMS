Summarize the FlexCMS backlog from `backlog/BOARD.md`. This is read-only; change nothing.

1. Counts per status: In Progress, Ready, Needs Refinement, Blocked, Done.
2. **In Progress** tasks, each with the last Log entry from its spec.
3. The next 5 **eligible** Ready tasks: rows whose dependencies are all Done. List each by ID, priority, and title.
4. Ready tasks that wait on dependencies, and what each one waits on.
5. **Blocked** tasks, with their open questions.
6. The task `implement` would pick next, and why.
7. Anomalies:
   - A board row without a spec, or a spec without a row.
   - More than one task In Progress.
   - A Done task with unticked ACs, or with test cases whose **Automated in** is `—`.
   - A dependency on an ID that does not exist.
