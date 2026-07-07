#!/usr/bin/env bash
# The Factory - deterministic quality gate and board mutation helpers.
#
# These helpers let the ROUTER (deterministic code) enforce objective truth that
# the loop otherwise trusts an LLM to self-report:
#
#   1. df_run_quality_gate  - runs the project build/test/lint command before a
#      task is allowed to reach QA. If it fails, the router overrides the agent's
#      claim and routes the task back to rework.
#   2. df_set_board_state    - rewrites a single task row in board.md from its
#      known 9 columns (robust against trailing-field word-splitting quirks).
#   3. df_lock_acquire/release - a bounded, stale-reclaiming mutex around the
#      router's own board.md writes, compatible with the agent-side df/runtime/
#      .lock convention. The router never hangs on it: after a timeout it logs a
#      warning and proceeds rather than deadlocking the whole factory.
#
# Pure bash 3.2 + coreutils (date/find/mkdir/rmdir), matching the rest of the
# router. Depends on df_trim from board-parser.bash.

# df_gate_state_is_qa STATE -> exit 0 if STATE is the QA-entry state that the
# objective gate guards.
df_gate_state_is_qa() {
  [ "$1" = "READY_FOR_QA" ]
}

# df_role_is_delivery ROLE -> exit 0 if ROLE is a concrete delivery lane. The
# gate only guards code-producing lanes; docs-only sa work skips it.
df_role_is_delivery() {
  case "$1" in
    backend-dev|frontend-dev|devops|data-engineer) return 0 ;;
    *) return 1 ;;
  esac
}

# df_lock_acquire LOCK_DIR TIMEOUT_SECONDS -> best-effort mutex. Returns 0 once
# the lock is held, or after TIMEOUT_SECONDS proceeds anyway (returns 1 so the
# caller can log that it bypassed a possibly-stale lock). Reclaims a lock older
# than DF_LOCK_STALE_SECONDS (default 300s) so a crashed session cannot deadlock
# the factory forever.
df_lock_acquire() {
  local lock_dir="$1" timeout="${2:-60}" waited=0
  local stale="${DF_LOCK_STALE_SECONDS:-300}"
  local stale_min=$(( (stale + 59) / 60 ))
  [ "$stale_min" -ge 1 ] || stale_min=1

  while ! mkdir "$lock_dir" 2>/dev/null; do
    # Reclaim a stale lock left behind by a crashed session.
    if [ -d "$lock_dir" ] && [ -n "$(find "$lock_dir" -prune -mmin "+$stale_min" 2>/dev/null)" ]; then
      rmdir "$lock_dir" 2>/dev/null || true
      continue
    fi
    sleep 1
    waited=$((waited + 1))
    if [ "$waited" -ge "$timeout" ]; then
      return 1
    fi
  done
  return 0
}

# df_lock_release LOCK_DIR
df_lock_release() {
  rmdir "$1" 2>/dev/null || true
}

# df_set_board_state BOARD TASK NEW_STATE [NEW_OWNER] [NEXT_ACTION]
# Rewrites the matching task row, preserving Priority/Title/Type/Blocked and
# refreshing the Last-updated timestamp. Reconstructs the row from its known 9
# columns so trailing-empty word-splitting cannot corrupt the table. Returns 1
# if the task row was not found (board left untouched).
df_set_board_state() {
  local board="$1" wanted="$2" new_state="$3" new_owner="${4:-}" new_next="${5:-}"
  [ -f "$board" ] || return 1

  local ts; ts="$(date '+%Y-%m-%d %H:%M') local"
  local out="" line found=0

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      \|*\|*) : ;;
      *) out="$out$line"$'\n'; continue ;;
    esac
    case "$line" in
      *---*) out="$out$line"$'\n'; continue ;;
    esac

    local oldIFS="$IFS"
    IFS='|'
    # shellcheck disable=SC2206
    local f=($line)
    IFS="$oldIFS"

    local tid; tid="$(df_trim "${f[2]:-}")"
    if [ "$tid" != "$wanted" ]; then
      out="$out$line"$'\n'
      continue
    fi

    local p title type owner blocked next
    p="$(df_trim "${f[1]:-}")"
    title="$(df_trim "${f[3]:-}")"
    type="$(df_trim "${f[4]:-}")"
    owner="$(df_trim "${f[6]:-}")"
    blocked="$(df_trim "${f[7]:-}")"
    next="$(df_trim "${f[9]:-}")"

    [ -n "$new_owner" ] && owner="$new_owner"
    [ -n "$new_next" ] && next="$new_next"
    if [ "$new_state" = "BLOCKED" ]; then
      blocked="Yes"
    fi

    out="$out| $p | $tid | $title | $type | $new_state | $owner | $blocked | $ts | $next |"$'\n'
    found=1
  done < "$board"

  [ "$found" -eq 1 ] || return 1
  printf '%s' "$out" > "$board"
  return 0
}

# df_run_quality_gate ROOT TASK GATE_CMD -> runs GATE_CMD from ROOT, writes a
# report to df/artifacts/TASK/gate-report.md, and returns the command's exit
# status. If GATE_CMD is empty the gate is disabled: returns 0 and the caller is
# expected to warn that no objective gate is configured.
df_run_quality_gate() {
  local root="$1" task="$2" gate_cmd="$3"
  [ -n "$gate_cmd" ] || return 0

  local artifact_dir="$root/df/artifacts/$task"
  local report="$artifact_dir/gate-report.md"
  mkdir -p "$artifact_dir" 2>/dev/null || true

  local out_file status started ended
  out_file="$(mktemp "${TMPDIR:-/tmp}/df-gate.XXXXXX")"
  started="$(date '+%Y-%m-%d %H:%M:%S') local"

  ( cd "$root" && bash -c "$gate_cmd" ) >"$out_file" 2>&1
  status=$?
  ended="$(date '+%Y-%m-%d %H:%M:%S') local"

  {
    printf '## Quality gate run %s\n\n' "$ended"
    printf -- '- Task: %s\n' "$task"
    printf -- '- Command: `%s`\n' "$gate_cmd"
    printf -- '- Started: %s\n' "$started"
    printf -- '- Finished: %s\n' "$ended"
    if [ "$status" -eq 0 ]; then
      printf -- '- Result: PASS (exit 0)\n\n'
    else
      printf -- '- Result: FAIL (exit %s)\n\n' "$status"
    fi
    printf '### Output (tail)\n\n```\n'
    tail -n 200 "$out_file" 2>/dev/null
    printf '\n```\n\n'
  } >> "$report"

  rm -f "$out_file"
  return "$status"
}
