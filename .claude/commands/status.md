Show the current state of the work board. Read `WORK_BOARD.md` and provide:

1. **Summary counts**: How many items are OPEN, IN PROGRESS, PAUSED, BLOCKED, DONE.
2. **Currently in progress**: List any 🔵 IN PROGRESS items with their agent and modules locked.
3. **Paused items needing pickup**: List any 🟠 PAUSED items — these need immediate attention.
4. **Next available tasks**: List the top 5 highest-priority 🟢 OPEN items that have no blockers (all items in "Blocked By" must be ✅ DONE). Show their ID, title, priority, effort, and modules.
5. **Module lock conflicts**: Check if any modules are locked that would prevent parallel work.

