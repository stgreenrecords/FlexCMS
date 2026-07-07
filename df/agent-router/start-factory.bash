#!/usr/bin/env bash
# The Factory - autonomous role-session router.
#
# The human starts the factory once. This router then drives the SDLC loop:
# on each iteration it reads df/runtime/board.md, selects the highest-priority
# actionable task, resolves the responsible role, and launches exactly ONE
# fresh role-session through the selected adapter. After the session returns,
# the router re-reads the board and automatically launches the next role-session
# until the work reaches DONE / NO_TASKS / BLOCKED or a safety limit is hit.
#
# "One role per session" is preserved: each iteration is an isolated single-role
# session. The novelty is that the router chains those sessions automatically so
# the human does not have to re-trigger each role by hand.
#
# Adapters:
#   manual  - prints the next role-session prompt and stops after one role
#             (conservative; a human copies the prompt into a new session).
#   auto    - executes $DF_AGENT_CMD for every role-session and loops
#             automatically until the factory reaches a stop condition.
#
# Compatible with bash 3.2 (macOS default).

set -euo pipefail

DF_ROUTER_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DF_ROOT="$(cd -- "$DF_ROUTER_DIR/../.." && pwd)"
DF_RUNTIME="$DF_ROOT/df/runtime"
DF_BOARD="$DF_RUNTIME/board.md"
DF_ACTIVITY="$DF_RUNTIME/activity-log.md"

# shellcheck source=state-role-map.bash
. "$DF_ROUTER_DIR/state-role-map.bash"
# shellcheck source=board-parser.bash
. "$DF_ROUTER_DIR/board-parser.bash"
# shellcheck source=quality-gate.bash
. "$DF_ROUTER_DIR/quality-gate.bash"
# shellcheck source=render-subboards.bash
. "$DF_ROUTER_DIR/render-subboards.bash"
# shellcheck source=worktree-manager.bash
. "$DF_ROUTER_DIR/worktree-manager.bash"

DF_LOCK_DIR="$DF_RUNTIME/.lock"

# ---- defaults ---------------------------------------------------------------
ADAPTER="${DF_FACTORY_ADAPTER:-auto}"
MAX_ITERATIONS="${DF_FACTORY_MAX_ITERATIONS:-300}"
MAX_PARALLEL="${DF_FACTORY_MAX_PARALLEL:-5}"
# Objective quality gate: build/test/lint command the ROUTER runs before a task
# is allowed to reach QA. Empty disables the gate (with a warning).
GATE_CMD="${DF_GATE_CMD:-}"
# Max rework cycles (RETURNED_TO_DEV / *_FAILED / *_REJECTED / gate-fail) before
# a task is force-BLOCKED so it cannot consume the whole iteration budget.
MAX_REWORK="${DF_MAX_REWORK:-3}"
FILTER_TASK_ID=""
FORCE_ROLE=""
DRY_RUN=0
POLL_SECONDS="${DF_FACTORY_POLL_SECONDS:-3}"

usage() {
  cat <<'EOF'
Usage: start-factory.bash [options]

Options:
  --adapter <manual|auto>   Session driver. Default: auto.
  --max-iterations <n>      Safety cap on chained role-sessions. Default: 300.
  --max-parallel <n>        Max concurrent role-sessions when independent
                              tasks are available. Default: 5. Use 1 for
                              fully serial behaviour.
  --task-id <id>            Restrict the loop to a single task id.
  --role <short-name>       Force the first role-session (sa, qa, po, ...).
  --dry-run                 Plan and print actions without launching sessions.
  -h, --help                Show this help.

Environment:
  DF_AGENT_CMD              Required for the "auto" adapter. Command that runs
                            one role-session. It receives the role prompt on
                            stdin and these arguments:
                              $1 = role short-name
                              $2 = task id
                              $3 = task state
                              $4 = prompt file path
                            The command MUST update df/runtime/board.md to
                            reflect the new state when the role finishes.
  DF_FACTORY_ADAPTER        Default adapter when --adapter is not passed.
                             Default: auto.
  DF_FACTORY_MAX_ITERATIONS Default iteration cap when --max-iterations is not
                             passed. Default: 300.
  DF_FACTORY_MAX_PARALLEL   Default parallelism cap. Default: 5.
  DF_FACTORY_POLL_SECONDS   Polling interval for in-flight session reaping.
                             Default: 3.
  DF_GATE_CMD               Objective quality gate the ROUTER runs (from repo
                             root) when a delivery lane moves a task to
                             READY_FOR_QA. If it exits non-zero the router
                             overrides the agent and routes the task back to
                             RETURNED_TO_DEV with a gate-report.md. Empty
                             disables the gate (a warning is logged). Example:
                             DF_GATE_CMD='npm ci && npm test && npm run lint'.
  DF_MAX_REWORK             Max rework cycles (RETURNED_TO_DEV / QA_FAILED /
                             PO_REJECTED / gate failures) for one task before it
                             is force-BLOCKED for human attention. Default: 3.
  DF_WORKTREES              Isolate each delivery-lane session in its own git
                             worktree (branch df/task/<id>) so parallel sessions
                             cannot clobber each other's code. The router runs
                             the gate in the worktree and integrates only on a
                             pass. Default: on; set 0/off to run in the main
                             tree. Requires the repo to be a git work tree.
  DF_LOCK_STALE_SECONDS     Age after which the router reclaims a stale
                             df/runtime/.lock left by a crashed session.
                             Default: 300.
  DF_FACTORY_ENV_FILE       Optional env file loaded by call-start-factory.bash.
                             Default: ./.df-factory.env

Parallelism:
  The router can launch up to --max-parallel role-sessions concurrently when
  the board contains independent eligible tasks. A task is eligible when its
  state is actionable AND every entry in its task.md "## Dependencies" section
  is in state DONE. Set --max-parallel 1 to force serial behaviour.
EOF
}

log() { printf '[df-router] %s\n' "$*" >&2; }
die() { printf '[df-router][error] %s\n' "$*" >&2; exit 1; }

task_file_for() {
  printf '%s/df/artifacts/%s/task.md\n' "$DF_ROOT" "$1"
}

board_state_for_task() {
  local wanted_task="$1"
  local prio task state owner
  local rows

  rows="$(df_parse_board "$DF_BOARD")"
  [ -n "$rows" ] || return 1

  while IFS=$'\t' read -r prio task state owner; do
    [ "$task" = "$wanted_task" ] || continue
    printf '%s\n' "$state"
    return 0
  done <<EOF
$rows
EOF

  return 1
}

task_dependencies() {
  local task_file line in_dependencies=0 dep

  task_file="$(task_file_for "$1")"
  [ -f "$task_file" ] || return 1

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      '## Dependencies')
        in_dependencies=1
        continue
        ;;
      '## '*)
        [ "$in_dependencies" -eq 1 ] && break
        ;;
    esac

    [ "$in_dependencies" -eq 1 ] || continue
    case "$line" in
      -\ *)
        dep="${line#- }"
        dep="$(df_trim "$dep")"
        [ -n "$dep" ] && printf '%s\n' "$dep"
        ;;
    esac
  done < "$task_file"
}

blocked_task_is_resumable() {
  local task="$1"
  local deps dep dep_state found_dependency=0

  deps="$(task_dependencies "$task" || true)"
  [ -n "$deps" ] || return 1

  while IFS= read -r dep; do
    [ -n "$dep" ] || continue
    found_dependency=1
    dep_state="$(board_state_for_task "$dep" || true)"
    [ "$dep_state" = "DONE" ] || return 1
  done <<EOF
$deps
EOF

  [ "$found_dependency" -eq 1 ]
}

# ---- argument parsing -------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --adapter) ADAPTER="${2:-}"; shift 2 ;;
    --max-iterations) MAX_ITERATIONS="${2:-}"; shift 2 ;;
    --max-parallel) MAX_PARALLEL="${2:-}"; shift 2 ;;
    --task-id) FILTER_TASK_ID="${2:-}"; shift 2 ;;
    --role) FORCE_ROLE="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

case "$ADAPTER" in
  manual|auto) : ;;
  *) die "unsupported adapter: $ADAPTER (use manual or auto)" ;;
esac

case "$MAX_ITERATIONS" in
  ''|*[!0-9]*) die "--max-iterations must be a positive integer" ;;
esac
[ "$MAX_ITERATIONS" -ge 1 ] || die "--max-iterations must be >= 1"

case "$MAX_PARALLEL" in
  ''|*[!0-9]*) die "--max-parallel must be a positive integer" ;;
esac
[ "$MAX_PARALLEL" -ge 1 ] || die "--max-parallel must be >= 1"

case "$MAX_REWORK" in
  ''|*[!0-9]*) die "DF_MAX_REWORK must be a positive integer" ;;
esac
[ "$MAX_REWORK" -ge 1 ] || die "DF_MAX_REWORK must be >= 1"

case "$POLL_SECONDS" in
  ''|*[!0-9]*) POLL_SECONDS=3 ;;
esac
[ "$POLL_SECONDS" -ge 1 ] || POLL_SECONDS=1

[ -f "$DF_BOARD" ] || die "board not found: $DF_BOARD (create it from df/templates/board.md)"

if [ "$ADAPTER" = "auto" ] && [ "$DRY_RUN" -eq 0 ]; then
  [ -n "${DF_AGENT_CMD:-}" ] || die "auto adapter requires DF_AGENT_CMD to be set (export it or create .df-factory.env)"
  if [ -z "$GATE_CMD" ]; then
    log "WARNING: DF_GATE_CMD is not set. The objective quality gate is DISABLED;"
    log "         the loop will trust each agent's self-reported READY_FOR_QA."
    log "         Set DF_GATE_CMD (e.g. 'npm ci && npm test') to enforce a green build before QA."
  else
    log "quality gate enabled: '$GATE_CMD' (run by router on entry to READY_FOR_QA)"
  fi
fi

# ---- task selection ---------------------------------------------------------
# is_task_running TASK_ID -> exit 0 if TASK_ID is in the running set.
is_task_running() {
  local needle="$1" i
  for ((i=0; i<RUNNING_COUNT; i++)); do
    [ "${RUNNING_TASKS[$i]}" = "$needle" ] && return 0
  done
  return 1
}

# dependencies_all_done TASK_ID -> exit 0 if every listed dependency is DONE,
# or there are no dependencies. A missing task.md is treated as "no deps".
dependencies_all_done() {
  local task="$1" deps dep dep_state
  deps="$(task_dependencies "$task" 2>/dev/null || true)"
  [ -n "$deps" ] || return 0
  while IFS= read -r dep; do
    [ -n "$dep" ] || continue
    case "$dep" in
      none|None|NONE|n/a|N/A|-) continue ;;
    esac
    dep_state="$(board_state_for_task "$dep" || true)"
    [ "$dep_state" = "DONE" ] || return 1
  done <<EOF
$deps
EOF
  return 0
}

# task_is_stalled TASK_ID -> exit 0 if TASK_ID has been marked stalled.
task_is_stalled() {
  local needle="$1" i
  for ((i=0; i<STALLED_COUNT; i++)); do
    [ "${STALLED_TASKS[$i]}" = "$needle" ] && return 0
  done
  return 1
}

# resolve_role STATE OWNER -> echoes the concrete role short-name.
resolve_role() {
  local state="$1" owner="$2" role
  role="$(df_role_for_state "$state")"
  if [ "$role" = "delivery" ]; then
    case "$owner" in
      backend-dev|frontend-dev|devops|data-engineer) role="$owner" ;;
      *) role="delivery" ;;
    esac
  fi
  printf '%s' "$role"
}

# select_next_eligible -> sets SEL_TASK_ID/SEL_STATE/SEL_OWNER/SEL_ROLE to the
# best eligible task that is NOT already running and NOT stalled. Eligibility:
# state is actionable AND all dependencies are DONE, OR state is BLOCKED but
# all dependencies are now DONE (auto-unblock).
SEL_TASK_ID=""; SEL_STATE=""; SEL_OWNER=""; SEL_ROLE=""
select_next_eligible() {
  SEL_TASK_ID=""; SEL_STATE=""; SEL_OWNER=""; SEL_ROLE=""
  local best_rank=9999
  local prio task state owner rank rows
  rows="$(df_parse_board "$DF_BOARD")"
  [ -n "$rows" ] || return 1

  # Pass 1: actionable states with dependencies satisfied.
  while IFS=$'\t' read -r prio task state owner; do
    [ -n "$task" ] || continue
    [ -n "$FILTER_TASK_ID" ] && [ "$task" != "$FILTER_TASK_ID" ] && continue
    is_task_running "$task" && continue
    task_is_stalled "$task" && continue
    df_state_is_actionable "$state" || continue
    dependencies_all_done "$task" || continue
    rank="$(df_state_rank "$state")"
    if [ "$rank" -lt "$best_rank" ]; then
      best_rank="$rank"
      SEL_TASK_ID="$task"; SEL_STATE="$state"; SEL_OWNER="$owner"
    fi
  done <<EOF
$rows
EOF

  if [ -n "$SEL_TASK_ID" ]; then
    SEL_ROLE="$(resolve_role "$SEL_STATE" "$SEL_OWNER")"
    return 0
  fi

  # Pass 2: BLOCKED tasks whose dependencies are now all DONE.
  while IFS=$'\t' read -r prio task state owner; do
    [ -n "$task" ] || continue
    [ -n "$FILTER_TASK_ID" ] && [ "$task" != "$FILTER_TASK_ID" ] && continue
    is_task_running "$task" && continue
    task_is_stalled "$task" && continue
    [ "$state" = "BLOCKED" ] || continue
    blocked_task_is_resumable "$task" || continue
    SEL_TASK_ID="$task"; SEL_STATE="BLOCKED"; SEL_OWNER="$owner"; SEL_ROLE="sa"
    return 0
  done <<EOF
$rows
EOF

  return 1
}

# ---- prompt building --------------------------------------------------------
build_prompt() {
  local role="$1" task="$2" state="$3" file="$4" wt_path="${5:-}"
  {
    echo "# The Factory role-session"
    echo
    echo "You are running as a single role for ONE task, then you must stop."
    echo
    echo "- Role: $role"
    echo "- Task: $task"
    echo "- Current state: $state"
    echo
    if [ -n "$wt_path" ]; then
      echo "## Isolated worktree"
      echo
      echo "You are running inside a dedicated git worktree for this task:"
      echo "  $wt_path"
      echo "Make all code changes here; this is an isolated branch (df/task/$task)."
      echo "Update THIS task's row in df/runtime/board.md to the resulting state"
      echo "(e.g. READY_FOR_QA). The router reads that state, runs the quality gate"
      echo "in this worktree, and integrates your code into the main branch — do not"
      echo "switch branches, merge, or edit other tasks' files."
      echo
    fi
    echo "## Required reading"
    echo
    echo "1. df/00-start-here.md"
    echo "2. df/01-operating-model.md"
    echo "3. df/02-state-machine.md"
    echo "4. df/03-orchestration-rules.md"
    echo "5. df/04-documentation-standards.md"
    echo "6. df/roles/${role}.md (if it exists for this lane)"
    echo "7. df/runtime/ current files"
    echo
    echo "## Mandatory outcomes"
    echo
    echo "- Execute only the $role checklist for task $task."
    echo "- Update df/runtime/board.md with the new task state."
    echo "- Append an entry to df/runtime/activity-log.md."
    echo "- Write a handoff note naming the next role and next action."
    echo "- Do not switch roles or self-approve within this session."
    echo
    echo "## Shared-file lock (parallel sessions may be running)"
    echo
    echo "Other role-sessions may be writing to df/runtime/ at the same time."
    echo "Before editing any file under df/runtime/ acquire the mutex by"
    echo "running: while ! mkdir df/runtime/.lock 2>/dev/null; do sleep 1; done"
    echo "Release with: rmdir df/runtime/.lock"
    echo "Hold the lock only while you are writing. Re-read the file inside"
    echo "the critical section so concurrent edits are not lost."
    echo
    echo "## Dependencies discipline (sa role only)"
    echo
    echo "If you are the sa role: when you create or split tasks, you MUST"
    echo "populate the '## Dependencies' section of each child task.md with"
    echo "either 'none' or the explicit list of TASK-IDs it depends on. The"
    echo "router uses that list to decide which tasks can run in parallel."
  } > "$file"
}

# ---- adapters ---------------------------------------------------------------
run_manual_session() {
  local role="$1" task="$2" state="$3" file="$4"
  log "manual adapter: prepared role-session prompt for role='$role' task='$task' state='$state'"
  echo "----------------------------------------------------------------------"
  cat "$file"
  echo "----------------------------------------------------------------------"
  log "manual adapter is conservative: copy the prompt above into a NEW session."
}

run_auto_session() {
  local role="$1" task="$2" state="$3" file="$4" session_root="${5:-$DF_ROOT}"
  log "auto adapter: launching role-session role='$role' task='$task' state='$state' root='$session_root'"
  # The agent command reads the prompt from stdin and receives context args.
  # It is expected to update the board before returning. DF_SESSION_ROOT tells
  # the runner which directory the agent should operate in (a worktree for
  # isolated delivery sessions, otherwise the repo root).
  DF_SESSION_ROOT="$session_root" \
    bash -c "$DF_AGENT_CMD \"\$@\"" _ "$role" "$task" "$state" "$file" < "$file"
}

# Portable mktemp: works under both BSD mktemp (macOS) and GNU mktemp (Git
# Bash / Linux). Avoids the deprecated `-t prefix` form.
make_tempfile() {
  local prefix="${1:-df-prompt}"
  local tmpdir="${TMPDIR:-/tmp}"
  mktemp "$tmpdir/${prefix}.XXXXXX"
}

# ---- parallel scheduler -----------------------------------------------------
# Bash 3.2-compatible (no `wait -n`, no associative arrays). Parallel arrays
# track each in-flight session by index.
RUNNING_PIDS=()
RUNNING_TASKS=()
RUNNING_ROLES=()
RUNNING_STATES=()
RUNNING_PROMPTS=()
RUNNING_LOGS=()
RUNNING_ROOTS=()   # cwd/root the session ran against (worktree or DF_ROOT)
RUNNING_ISWT=()    # 1 if the session ran in an isolated worktree, else 0
RUNNING_COUNT=0

# Tasks that the router stopped trying because a previous session for them
# made no board change. We mark and skip rather than aborting the whole loop,
# so independent tasks keep progressing.
STALLED_TASKS=()
STALLED_COUNT=0

mark_stalled() {
  STALLED_TASKS[$STALLED_COUNT]="$1"
  STALLED_COUNT=$((STALLED_COUNT + 1))
}

# Per-task rework counters (parallel arrays; bash 3.2 has no associative maps).
REWORK_TASKS=()
REWORK_COUNTS=()
REWORK_LEN=0

# rework_count TASK -> echoes the current rework count for TASK (0 if unseen).
rework_count() {
  local needle="$1" i
  for ((i=0; i<REWORK_LEN; i++)); do
    if [ "${REWORK_TASKS[$i]}" = "$needle" ]; then
      printf '%s' "${REWORK_COUNTS[$i]}"
      return 0
    fi
  done
  printf '0'
}

# bump_rework TASK -> increments TASK's rework count and stores the new value in
# the global BUMP_RESULT. Must NOT be called via $(...) command substitution, or
# the array mutation happens in a subshell and is lost.
BUMP_RESULT=0
bump_rework() {
  local needle="$1" i
  for ((i=0; i<REWORK_LEN; i++)); do
    if [ "${REWORK_TASKS[$i]}" = "$needle" ]; then
      REWORK_COUNTS[$i]=$(( REWORK_COUNTS[$i] + 1 ))
      BUMP_RESULT="${REWORK_COUNTS[$i]}"
      return 0
    fi
  done
  REWORK_TASKS[$REWORK_LEN]="$needle"
  REWORK_COUNTS[$REWORK_LEN]=1
  REWORK_LEN=$((REWORK_LEN + 1))
  BUMP_RESULT=1
}

# board_write TASK NEW_STATE [OWNER] [NEXT_ACTION] -> router-side board mutation,
# serialized against agent sessions via the shared df/runtime/.lock convention.
board_write() {
  local task="$1" new_state="$2" owner="${3:-}" next="${4:-}"
  if ! df_lock_acquire "$DF_LOCK_DIR" 60; then
    log "WARNING: proceeding without df/runtime/.lock (timed out / reclaimed stale lock) for task='$task'"
  fi
  df_set_board_state "$DF_BOARD" "$task" "$new_state" "$owner" "$next"
  local rc=$?
  df_lock_release "$DF_LOCK_DIR"
  return $rc
}

# render_subboards_safe -> regenerate the lane sub-boards from board.md, under
# the shared df/runtime/ lock so it does not race agent sessions.
render_subboards_safe() {
  if ! df_lock_acquire "$DF_LOCK_DIR" 60; then
    log "WARNING: rendering sub-boards without df/runtime/.lock (timed out / reclaimed stale)"
  fi
  df_render_subboards "$DF_RUNTIME"
  df_lock_release "$DF_LOCK_DIR"
}

# log_activity TASK FROM TO ROLE REASON NEXT -> append a state-change record to
# the activity log, matching df/02-state-machine.md's required format.
log_activity() {
  local task="$1" from="$2" to="$3" role="$4" reason="$5" next="$6"
  {
    printf '\n## %s - State change (router)\n\n' "$(date '+%Y-%m-%d %H:%M') local"
    printf -- '- Task: %s\n' "$task"
    printf -- '- From: %s\n' "$from"
    printf -- '- To: %s\n' "$to"
    printf -- '- Role: %s\n' "$role"
    printf -- '- Reason: %s\n' "$reason"
    printf -- '- Next: %s\n' "$next"
  } >> "$DF_ACTIVITY"
}

# register_rework TASK FROM ROLE REASON -> increments the task's rework counter
# and, when the cap is reached, force-BLOCKS the task so it stops consuming the
# iteration budget and surfaces for human attention.
register_rework() {
  local task="$1" from="$2" role="$3" reason="$4" n
  bump_rework "$task"
  n="$BUMP_RESULT"
  log "rework cycle $n/$MAX_REWORK for task='$task' ($reason)"
  if [ "$n" -ge "$MAX_REWORK" ]; then
    log "task='$task' hit rework cap ($MAX_REWORK). Forcing BLOCKED for human attention."
    board_write "$task" "BLOCKED" "" "Rework cap ($MAX_REWORK) reached: $reason. Needs human review." || true
    log_activity "$task" "$from" "BLOCKED" "$role" \
      "Rework cap reached ($n/$MAX_REWORK): $reason" "Human review required"
    mark_stalled "$task"
  fi
}

# handle_session_result TASK ROLE PRESTATE POSTSTATE ROOT ISWT
# Applies the deterministic router-side gate and reconciles worktree state onto
# the main board. Called only when a session advanced the task's state.
handle_session_result() {
  local task="$1" role="$2" prestate="$3" post_state="$4" root="$5" iswt="$6"

  # Delivery lane claiming READY_FOR_QA -> run the objective gate in the session
  # root (the worktree for isolated sessions, so broken code never reaches main).
  if df_gate_state_is_qa "$post_state" && df_role_is_delivery "$role"; then
    if [ -n "$GATE_CMD" ]; then
      log "quality gate: running for task='$task' lane='$role' before QA (root=$root)"
      if df_run_quality_gate "$root" "$task" "$GATE_CMD"; then
        log "quality gate PASSED for task='$task'"
        if [ "$iswt" = "1" ]; then
          if df_wt_integrate "$DF_ROOT" "$task"; then
            log "integrated worktree for task='$task' into main"
          else
            log "WARNING: integration failed for task='$task'; worktree left in place"
          fi
          board_write "$task" "READY_FOR_QA" "qa" "Gate passed; code integrated to main. Ready for verification." || true
          log_activity "$task" "$prestate" "READY_FOR_QA" "$role" "Gate passed in worktree; code integrated to main" "qa"
          df_wt_remove "$DF_ROOT" "$task"
        fi
        # Non-worktree: the agent already set the main board to READY_FOR_QA.
      else
        log "quality gate FAILED for task='$task'. Routing back to RETURNED_TO_DEV."
        board_write "$task" "RETURNED_TO_DEV" "$role" \
          "Quality gate failed (DF_GATE_CMD); see gate-report.md. Fix before resubmitting." || true
        log_activity "$task" "$post_state" "RETURNED_TO_DEV" "$role" "Router quality gate failed: $GATE_CMD" "$role to fix and resubmit"
        # Keep the worktree (preserves WIP) but reset its board row so the next
        # attempt's stall detection is meaningful.
        if [ "$iswt" = "1" ]; then
          df_set_board_state "$(df_wt_path "$DF_ROOT" "$task")/df/runtime/board.md" \
            "$task" "RETURNED_TO_DEV" "$role" "Gate failed; fix and resubmit" 2>/dev/null || true
        fi
        register_rework "$task" "RETURNED_TO_DEV" "$role" "quality gate failure"
      fi
    else
      log "quality gate skipped for task='$task' (DF_GATE_CMD not set)."
      if [ "$iswt" = "1" ]; then
        df_wt_integrate "$DF_ROOT" "$task" || log "WARNING: integration failed for task='$task'"
        board_write "$task" "READY_FOR_QA" "qa" "Integrated to main (gate disabled). Ready for verification." || true
        df_wt_remove "$DF_ROOT" "$task"
      fi
    fi
    return 0
  fi

  # Non-QA advancement. For worktree sessions the agent edited the worktree
  # board, not main, so reconcile the main board to the reported state and keep
  # the worktree for continued work.
  if [ "$iswt" = "1" ]; then
    board_write "$task" "$post_state" "$role" "In progress (isolated worktree)." || true
    log_activity "$task" "$prestate" "$post_state" "$role" "Reconciled from worktree" "continue"
  fi

  # Count rework cycles and enforce the cap (both modes).
  case "$post_state" in
    RETURNED_TO_DEV|QA_FAILED|PO_REJECTED)
      register_rework "$task" "$post_state" "$role" "entered $post_state"
      ;;
  esac
}

# launch_session ROLE TASK STATE -> backgrounds run_auto_session, registers
# bookkeeping. Caller must have ensured the slot is available.
launch_session() {
  local role="$1" task="$2" state="$3"
  local prompt_file log_file
  local session_root="$DF_ROOT" iswt=0 wt_note=""

  # Code-producing delivery lanes run in an isolated per-task git worktree so
  # parallel sessions cannot clobber each other's code. Falls back to the main
  # tree if worktrees are disabled or git provisioning fails.
  if df_wt_enabled "$DF_ROOT" && df_role_needs_worktree "$role"; then
    local wt
    wt="$(df_wt_ensure "$DF_ROOT" "$task")"
    if [ -n "$wt" ] && [ -d "$wt" ]; then
      session_root="$wt"; iswt=1; wt_note="$wt"
      log "isolated worktree for task='$task': $wt"
    else
      log "WARNING: could not create worktree for task='$task'; running in main tree"
    fi
  fi

  prompt_file="$(make_tempfile df-prompt)"
  log_file="$(make_tempfile df-session-${task})"
  build_prompt "$role" "$task" "$state" "$prompt_file" "$wt_note"

  run_auto_session "$role" "$task" "$state" "$prompt_file" "$session_root" \
    >"$log_file" 2>&1 &
  local pid=$!

  RUNNING_PIDS[$RUNNING_COUNT]=$pid
  RUNNING_TASKS[$RUNNING_COUNT]="$task"
  RUNNING_ROLES[$RUNNING_COUNT]="$role"
  RUNNING_STATES[$RUNNING_COUNT]="$state"
  RUNNING_PROMPTS[$RUNNING_COUNT]="$prompt_file"
  RUNNING_LOGS[$RUNNING_COUNT]="$log_file"
  RUNNING_ROOTS[$RUNNING_COUNT]="$session_root"
  RUNNING_ISWT[$RUNNING_COUNT]="$iswt"
  RUNNING_COUNT=$((RUNNING_COUNT + 1))

  log "launched [pid=$pid] role='$role' task='$task' state='$state' (slots used: $RUNNING_COUNT/$MAX_PARALLEL)"
}

# reap_finished -> blocking; sleeps in POLL_SECONDS increments until at least
# one tracked PID has exited, then drains all finished entries and does
# per-task stall detection.
reap_finished() {
  [ "$RUNNING_COUNT" -gt 0 ] || return 0

  local progressed=0
  while [ "$progressed" -eq 0 ]; do
    local i any_alive=0
    for ((i=0; i<RUNNING_COUNT; i++)); do
      if kill -0 "${RUNNING_PIDS[$i]}" 2>/dev/null; then
        any_alive=1
      else
        progressed=1
      fi
    done
    [ "$progressed" -eq 1 ] && break
    [ "$any_alive" -eq 0 ] && break
    sleep "$POLL_SECONDS"
  done

  local new_pids=() new_tasks=() new_roles=() new_states=() new_prompts=() new_logs=() new_roots=() new_iswt=()
  local new_count=0 i pid task role state prompt_file log_file status post_state root iswt
  for ((i=0; i<RUNNING_COUNT; i++)); do
    pid="${RUNNING_PIDS[$i]}"
    task="${RUNNING_TASKS[$i]}"
    role="${RUNNING_ROLES[$i]}"
    state="${RUNNING_STATES[$i]}"
    prompt_file="${RUNNING_PROMPTS[$i]}"
    log_file="${RUNNING_LOGS[$i]}"
    root="${RUNNING_ROOTS[$i]}"
    iswt="${RUNNING_ISWT[$i]}"

    if kill -0 "$pid" 2>/dev/null; then
      new_pids[$new_count]=$pid
      new_tasks[$new_count]="$task"
      new_roles[$new_count]="$role"
      new_states[$new_count]="$state"
      new_prompts[$new_count]="$prompt_file"
      new_logs[$new_count]="$log_file"
      new_roots[$new_count]="$root"
      new_iswt[$new_count]="$iswt"
      new_count=$((new_count + 1))
      continue
    fi

    set +e
    wait "$pid" 2>/dev/null
    status=$?
    set -e
    log "completed [pid=$pid] role='$role' task='$task' state='$state' exit=$status"
    if [ -s "$log_file" ]; then
      printf '%s\n' "----- session log: task=$task role=$role -----" >&2
      cat "$log_file" >&2
      printf '%s\n' "----- end session log: task=$task -----" >&2
    fi
    rm -f "$prompt_file" "$log_file"

    # Worktree sessions update the worktree's board; everyone else updates main.
    if [ "$iswt" = "1" ]; then
      post_state="$(df_wt_state "$DF_ROOT" "$task" 2>/dev/null || true)"
    else
      post_state="$(board_state_for_task "$task" 2>/dev/null || true)"
    fi

    if [ "$status" -ne 0 ]; then
      log "session failed for task='$task' (exit=$status). Marking task stalled; other tasks continue."
      mark_stalled "$task"
    elif [ -n "$post_state" ] && [ "$post_state" = "$state" ]; then
      log "no state change for task='$task' (still '$state'). Marking stalled to avoid a loop."
      mark_stalled "$task"
    else
      handle_session_result "$task" "$role" "$state" "$post_state" "$root" "$iswt"
    fi
  done

  if [ "$new_count" -eq 0 ]; then
    RUNNING_PIDS=(); RUNNING_TASKS=(); RUNNING_ROLES=(); RUNNING_STATES=()
    RUNNING_PROMPTS=(); RUNNING_LOGS=(); RUNNING_ROOTS=(); RUNNING_ISWT=()
  else
    RUNNING_PIDS=("${new_pids[@]}")
    RUNNING_TASKS=("${new_tasks[@]}")
    RUNNING_ROLES=("${new_roles[@]}")
    RUNNING_STATES=("${new_states[@]}")
    RUNNING_PROMPTS=("${new_prompts[@]}")
    RUNNING_LOGS=("${new_logs[@]}")
    RUNNING_ROOTS=("${new_roots[@]}")
    RUNNING_ISWT=("${new_iswt[@]}")
  fi
  RUNNING_COUNT=$new_count

  # Sessions may have changed the board; re-derive the lane sub-boards.
  render_subboards_safe
}

cleanup_on_exit() {
  local i
  for ((i=0; i<RUNNING_COUNT; i++)); do
    [ -n "${RUNNING_PROMPTS[$i]:-}" ] && rm -f "${RUNNING_PROMPTS[$i]}"
    [ -n "${RUNNING_LOGS[$i]:-}" ] && rm -f "${RUNNING_LOGS[$i]}"
  done
}
trap cleanup_on_exit EXIT

# ---- main loop --------------------------------------------------------------
log "starting factory: adapter=$ADAPTER max-iterations=$MAX_ITERATIONS max-parallel=$MAX_PARALLEL dry-run=$DRY_RUN"
[ -n "$FILTER_TASK_ID" ] && log "restricted to task: $FILTER_TASK_ID"

# Manual and dry-run adapters keep the original one-shot semantics: they
# preview the next single session and stop. Parallelism only applies to the
# auto adapter against real role-sessions.
if [ "$DRY_RUN" -eq 1 ] || [ "$ADAPTER" = "manual" ]; then
  if ! select_next_eligible; then
    log "no actionable tasks remain. Stopping."
    exit 0
  fi
  role="$SEL_ROLE"
  if [ -n "$FORCE_ROLE" ]; then
    log "forcing role-session to '$FORCE_ROLE' (board suggested '$SEL_ROLE')"
    role="$FORCE_ROLE"
  fi
  prompt_file="$(make_tempfile df-prompt)"
  build_prompt "$role" "$SEL_TASK_ID" "$SEL_STATE" "$prompt_file"
  if [ "$DRY_RUN" -eq 1 ]; then
    log "dry-run: would launch role-session role='$role' task='$SEL_TASK_ID' state='$SEL_STATE'"
    cat "$prompt_file"
  else
    run_manual_session "$role" "$SEL_TASK_ID" "$SEL_STATE" "$prompt_file"
    log "manual adapter runs one role per invocation. Stopping after one session."
  fi
  rm -f "$prompt_file"
  exit 0
fi

iteration=0
first_session=1

# Derive the lane sub-boards from the board before the first session, so they
# reflect current state even if nothing changes this run.
render_subboards_safe

while [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
  # Top up the in-flight pool with eligible tasks.
  while [ "$RUNNING_COUNT" -lt "$MAX_PARALLEL" ]; do
    if ! select_next_eligible; then
      break
    fi
    role="$SEL_ROLE"
    if [ "$first_session" -eq 1 ] && [ -n "$FORCE_ROLE" ]; then
      log "forcing first role-session to '$FORCE_ROLE' (board suggested '$SEL_ROLE')"
      role="$FORCE_ROLE"
    fi
    first_session=0
    iteration=$((iteration + 1))
    if [ "$iteration" -gt "$MAX_ITERATIONS" ]; then
      log "reached max-iterations ($MAX_ITERATIONS) while launching. Stopping new launches."
      break
    fi
    launch_session "$role" "$SEL_TASK_ID" "$SEL_STATE"
  done

  if [ "$RUNNING_COUNT" -eq 0 ]; then
    log "no actionable tasks and no in-flight sessions. Stopping."
    exit 0
  fi

  # Wait for at least one in-flight session to finish, then re-evaluate.
  reap_finished
done

log "reached max-iterations ($MAX_ITERATIONS). Waiting for in-flight sessions to drain."
while [ "$RUNNING_COUNT" -gt 0 ]; do
  reap_finished
done
log "done."
