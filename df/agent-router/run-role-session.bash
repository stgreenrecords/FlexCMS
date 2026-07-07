#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DF_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

# The router sets DF_SESSION_ROOT to the directory the agent should operate in:
# an isolated git worktree for delivery sessions, otherwise the repo root. Code
# changes and the per-task board update happen there.
DF_SESSION_ROOT="${DF_SESSION_ROOT:-$DF_ROOT}"

role="${1:-}"
task_id="${2:-}"
state="${3:-}"
prompt_file="${4:-}"

if [ -z "$role" ] || [ -z "$task_id" ] || [ -z "$state" ] || [ -z "$prompt_file" ]; then
  printf '[df-agent-runner][error] expected arguments: <role> <task-id> <state> <prompt-file>\n' >&2
  exit 2
fi

# Portable mktemp wrapper (avoids deprecated `-t` form).
df_mktemp() {
  local prefix="${1:-df-tmp}"
  local tmpdir="${TMPDIR:-/tmp}"
  mktemp "$tmpdir/${prefix}.XXXXXX"
}

# Translate an MSYS / cygwin-style path to a native Windows path if cygpath is
# available; otherwise return the input unchanged. Use this when passing a
# path argument to a Windows-native binary (copilot.exe, claude.exe, ...).
df_native_path() {
  local p="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$p" 2>/dev/null || printf '%s' "$p"
  else
    printf '%s' "$p"
  fi
}

resolve_runner() {
  if [ -n "${DF_AGENT_RUNNER:-}" ]; then
    printf '%s\n' "$DF_AGENT_RUNNER"
    return 0
  fi

  for candidate in copilot gh claude aider cursor code gemini llm openai; do
    if command -v "$candidate" >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

load_copilot_token() {
  local token_file token_value token_line

  case "${DF_AGENT_IGNORE_TOKEN:-}" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
  esac

  if [ -n "${COPILOT_GITHUB_TOKEN:-}" ]; then
    return 0
  fi

  token_file="${DF_AGENT_TOKEN_FILE:-$DF_ROOT/token}"
  [ -f "$token_file" ] || return 0

  token_line="$(tr -d '\r' < "$token_file" | head -n 1 | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  case "$token_line" in
    export\ COPILOT_GITHUB_TOKEN=*) token_value="${token_line#export COPILOT_GITHUB_TOKEN=}" ;;
    COPILOT_GITHUB_TOKEN=*) token_value="${token_line#COPILOT_GITHUB_TOKEN=}" ;;
    export\ GH_TOKEN=*) token_value="${token_line#export GH_TOKEN=}" ;;
    GH_TOKEN=*) token_value="${token_line#GH_TOKEN=}" ;;
    export\ GITHUB_TOKEN=*) token_value="${token_line#export GITHUB_TOKEN=}" ;;
    GITHUB_TOKEN=*) token_value="${token_line#GITHUB_TOKEN=}" ;;
    *) token_value="$token_line" ;;
  esac
  token_value="${token_value#\"}"
  token_value="${token_value%\"}"
  token_value="${token_value#\'}"
  token_value="${token_value%\'}"
  [ -n "$token_value" ] || return 0

  export COPILOT_GITHUB_TOKEN="$token_value"
  export GH_TOKEN="$token_value"
  export GITHUB_TOKEN="$token_value"
}

copilot_prompt() {
  {
    printf 'Repository root: %s\n' "$DF_SESSION_ROOT"
    printf 'Role: %s\n' "$role"
    printf 'Task: %s\n' "$task_id"
    printf 'State: %s\n\n' "$state"
    cat "$prompt_file"
  }
}

run_copilot() {
  local prompt_text token_source auth_mode out_file err_file status
  local heartbeat_seconds start_ts now_ts elapsed pid hb_pid root_arg

  load_copilot_token
  token_source="${DF_AGENT_TOKEN_FILE:-$DF_ROOT/token}"
  auth_mode="stored-login"
  if [ -n "${COPILOT_GITHUB_TOKEN:-}" ]; then
    auth_mode="token-file"
  fi
  if [ "$auth_mode" = "token-file" ] && [ -z "${COPILOT_GITHUB_TOKEN:-}" ]; then
    printf '[df-agent-runner][error] copilot runner requires COPILOT_GITHUB_TOKEN or a token file at %s\n' "$token_source" >&2
    exit 5
  fi

  prompt_text="$(copilot_prompt)"
  out_file="$(df_mktemp df-copilot-out)"
  err_file="$(df_mktemp df-copilot-err)"
  heartbeat_seconds="${DF_AGENT_HEARTBEAT_SECONDS:-15}"
  case "$heartbeat_seconds" in
    ''|*[!0-9]*) heartbeat_seconds=15 ;;
    *) [ "$heartbeat_seconds" -ge 1 ] || heartbeat_seconds=15 ;;
  esac

  # Windows-native copilot.exe does not understand MSYS paths like /c/Users/...
  # so translate the session root before passing it to the binary.
  root_arg="$(df_native_path "$DF_SESSION_ROOT")"

  set +e
  printf '[df-agent-runner] launching Copilot session model=%s mode=%s task=%s role=%s\n' \
    "${DF_AGENT_MODEL:-gpt-5.4}" "${DF_AGENT_MODE:-autopilot}" "$task_id" "$role" >&2
  printf '[df-agent-runner] waiting for completion; heartbeat every %ss\n' "$heartbeat_seconds" >&2
  printf '[df-agent-runner] streaming child session logs below\n' >&2
  start_ts="$(date +%s)"

  # Redirect copilot stdout/stderr to files. Stream stdout live to this
  # process's stderr (so the router can interleave it) using a background
  # tail. No FIFOs — they do not work on Windows / Git Bash.
  copilot \
    -C "$root_arg" \
    --model "${DF_AGENT_MODEL:-gpt-5.4}" \
    --mode "${DF_AGENT_MODE:-autopilot}" \
    --name "df:${task_id}:${role}" \
    --allow-all \
    --no-ask-user \
    --secret-env-vars=COPILOT_GITHUB_TOKEN,GH_TOKEN,GITHUB_TOKEN \
    -p "$prompt_text" \
    >"$out_file" 2>"$err_file" &
  pid=$!

  ( tail -n +1 -F "$out_file" 2>/dev/null | sed -u 's/^/[df-agent-runner][stdout] /' >&2 ) &
  hb_pid=$!

  while kill -0 "$pid" 2>/dev/null; do
    sleep "$heartbeat_seconds"
    if kill -0 "$pid" 2>/dev/null; then
      now_ts="$(date +%s)"
      elapsed=$((now_ts - start_ts))
      printf '[df-agent-runner] Copilot still running (%ss elapsed) for task=%s role=%s\n' \
        "$elapsed" "$task_id" "$role" >&2
    fi
  done
  wait "$pid"
  status=$?
  # Stop the streaming tail; give it a moment to flush.
  kill "$hb_pid" 2>/dev/null
  wait "$hb_pid" 2>/dev/null
  set -e

  if [ "$status" -eq 0 ]; then
    cat "$out_file"
    cat "$err_file" >&2
    rm -f "$out_file" "$err_file"
    return 0
  fi

  if grep -Eq 'Authentication failed|No authentication information found' "$err_file"; then
    cat "$err_file" >&2
    if [ "$auth_mode" = "token-file" ]; then
      cat >&2 <<EOF
[df-agent-runner][error] Copilot CLI loaded authentication input from the token file but GitHub rejected it.

Checked token source:
  $token_source

Next steps:
  1. run: copilot
  2. inside Copilot CLI, run: /login
  3. set DF_AGENT_IGNORE_TOKEN='true' in .df-factory.env to prefer stored login
  4. then retry: ./start factory

If you prefer token-file auth, replace ./token with a valid fine-grained PAT that
has the 'Copilot Requests' permission and is not expired.
EOF
    else
      cat >&2 <<'EOF'
[df-agent-runner][error] Copilot CLI stored login is not currently usable.

Next steps:
  1. run: copilot
  2. inside Copilot CLI, run: /login
  3. then retry: ./start factory

If you prefer file-based auth instead, set DF_AGENT_TOKEN_FILE in .df-factory.env
and provide a valid fine-grained PAT with the 'Copilot Requests' permission.
EOF
    fi
  else
    cat "$err_file" >&2
  fi

  rm -f "$out_file" "$err_file"
  exit "$status"
}

run_with_runner() {
  local runner="$1"
  shift

  case "$runner" in
    copilot)
      run_copilot
      ;;
    gh)
      printf '[df-agent-runner][error] found gh, but no supported non-interactive GitHub Copilot session command is configured. Set DF_AGENT_RUNNER in .df-factory.env.\n' >&2
      exit 3
      ;;
    claude|aider|cursor|code|gemini|llm|openai)
      exec "$runner" "$@"
      ;;
    *)
      bash -c "$runner \"\$@\"" _ "$@"
      ;;
  esac
}

if ! runner="$(resolve_runner)"; then
  cat >&2 <<'EOF'
[df-agent-runner][error] No supported agent launcher was found.

What to do:
1. install or expose your agent CLI in PATH, or
2. set DF_AGENT_RUNNER in .df-factory.env.

Example .df-factory.env:
  DF_AGENT_CMD='./df/agent-router/run-role-session.bash'
  DF_AGENT_RUNNER='copilot'
  DF_AGENT_MODEL='gpt-5.4'
  DF_AGENT_MODE='autopilot'
  DF_AGENT_IGNORE_TOKEN='true'
  DF_FACTORY_ADAPTER='auto'
  DF_FACTORY_MAX_ITERATIONS='300'
EOF
  exit 4
fi

printf '[df-agent-runner] runner=%s role=%s task=%s state=%s prompt=%s\n' "$runner" "$role" "$task_id" "$state" "$prompt_file" >&2
run_with_runner "$runner" "$role" "$task_id" "$state" "$prompt_file"

