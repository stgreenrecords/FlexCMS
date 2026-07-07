# agents/ — FlexCMS Agent Factory

Automated, factory-style delivery line for AI coding agents. Replaces the old
manual `kyle implement` / `erik implement` routing.

| File | Purpose |
|---|---|
| `FACTORY.md` | The process spec — stations, roles, leases, worker loop |
| `queue.json` | **Single source of truth** — the machine-readable task queue |
| `factory.py` | The dispatcher CLI (zero dependencies, Python 3) |
| `config.json` | Autonomous-mode config — model, `gh` command, worker pool, loop + autonomy flags |

## Quick start

```bash
python3 agents/factory.py status              # see the board
python3 agents/factory.py next --agent w1     # dispatch next ready task
python3 agents/factory.py validate            # run the quality gate
python3 agents/factory.py pass <ID>           # advance a task down the line
python3 agents/factory.py lint                # queue consistency check
python3 agents/factory.py run --dry-run       # autonomous loop plan (safe default)
python3 agents/factory.py run --live --once   # force one live iteration
python3 agents/factory.py run --live --model openai/gpt-5 --review-model openai/gpt-5-mini
```

`run` accepts either a GitHub model id (`openai/gpt-5`) or friendly aliases like
`GPT-5.3-Codex`; aliases resolve through `config.json`.

To avoid provider payload limits, tune prompt budget in `config.json`:

- `prompt.max_file_bytes`
- `prompt.max_read_first_files`
- `prompt.max_prompt_bytes`

If a model call returns HTTP 413, the task is moved to `blocked` with a reason instead
of retrying in a hot loop. Rate-limit errors trigger a short backoff.

Read `FACTORY.md` before doing anything else.

## `flex` shortcut

The `flex` CLI forwards to the dispatcher, so these are equivalent:

```bash
flex agent status
flex agent next --agent w1
flex agent validate
```

## CI

`.github/workflows/agent-queue.yml` runs `factory.py lint` on every change under
`agents/**` and fails the build if the queue is inconsistent (orphan deps, stale or
misplaced leases, dependency cycles).

