# CLAUDE.md

All project rules for AI agents live in `AGENTS.md`, imported below, so every tool follows one rulebook. Do not add rules here. Change `AGENTS.md` or the process docs instead.

@AGENTS.md

## Claude Code specifics

- Slash commands in `.claude/commands/`: `/implement`, `/pick <ID>`, `/new-task <description>`, `/status`, `/validate`. They do exactly what the **Commands** table in `AGENTS.md` describes.
- The Playwright MCP server is available for exploring the running admin UI. It is fine for finding selectors or reproducing a bug, but it is **not** a substitute for committed Playwright tests in `frontend/apps/e2e`.
