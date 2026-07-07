#!/usr/bin/env bash
# The Factory - end-to-end tests for git worktree isolation.
#
# Runs the router (auto adapter) inside a throwaway git repo with a fake agent
# that works in DF_SESSION_ROOT (its isolated worktree), verifying that:
#   1. a delivery session's code is built in a worktree and, on a PASSING gate,
#      integrated into the main branch with the board moved to READY_FOR_QA;
#   2. on a FAILING gate, nothing is integrated into main, the worktree is kept
#      (WIP preserved), and the task is routed back to RETURNED_TO_DEV.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

if ! command -v git >/dev/null 2>&1; then
  printf 'SKIP: git not available.\n'; exit 0
fi

TMP_PARENT="$(mktemp -d -t df-wt-test.XXXXXX)"
cleanup() {
  local d
  for d in "$TMP_PARENT"/repo*; do
    [ -d "$d" ] && git -C "$d" worktree prune 2>/dev/null || true
  done
  rm -rf "$TMP_PARENT"
}
trap cleanup EXIT

REPO=""; ROUTER_DIR=""; BOARD=""

new_repo() {
  REPO="$(mktemp -d "$TMP_PARENT/repoXXXXXX")"
  ROUTER_DIR="$REPO/df/agent-router"
  BOARD="$REPO/df/runtime/board.md"
  mkdir -p "$ROUTER_DIR" "$REPO/df/runtime" "$REPO/df/artifacts" "$REPO/src"
  for f in start-factory.bash board-parser.bash state-role-map.bash quality-gate.bash render-subboards.bash worktree-manager.bash; do
    cp "$SOURCE_ROOT/df/agent-router/$f" "$ROUTER_DIR/"
  done

  cat > "$REPO/fake-agent.bash" <<'AGENT'
#!/usr/bin/env bash
set -euo pipefail
role="$1"; task="$2"; state="$3"
root="${DF_SESSION_ROOT:?}"
. "$(dirname "$0")/df/agent-router/board-parser.bash"
. "$(dirname "$0")/df/agent-router/quality-gate.bash"
board="$root/df/runtime/board.md"
case "$state" in
  READY_FOR_DEV|RETURNED_TO_DEV|DEV_IN_PROGRESS)
    printf 'feature for %s\n' "$task" > "$root/src/feature-$task.txt"
    df_set_board_state "$board" "$task" READY_FOR_QA qa "ready for verification"
    ;;
  READY_FOR_QA|QA_IN_PROGRESS) df_set_board_state "$board" "$task" READY_FOR_PO po "qa passed" ;;
  READY_FOR_PO|PO_REVIEW) df_set_board_state "$board" "$task" DONE factory "accepted" ;;
esac
echo "fake-agent: $role advanced $task from $state in $root"
AGENT
  chmod +x "$REPO/fake-agent.bash"

  cat > "$BOARD" <<'EOF'
# The Factory Runtime Board

| Priority | Task ID | Title | Type | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|---|
| P2 | TASK-002 | Add API endpoint | Story | READY_FOR_DEV | backend-dev | No | 2026-05-29 16:00 local | Implement handler |

## Queue notes
- note
EOF
  : > "$REPO/df/runtime/activity-log.md"
  echo ".df-worktrees/" > "$REPO/.gitignore"
  echo "original" > "$REPO/src/app.txt"

  git -C "$REPO" init -q
  git -C "$REPO" config user.email t@t
  git -C "$REPO" config user.name t
  git -C "$REPO" add -A
  git -C "$REPO" commit -qm init
}

final_state() { ( . "$ROUTER_DIR/board-parser.bash"; df_board_state "$BOARD" TASK-002 ); }

run_router() { ( cd "$REPO" && DF_AGENT_CMD="$REPO/fake-agent.bash" DF_FACTORY_MAX_PARALLEL=1 \
  "$@" bash "$ROUTER_DIR/start-factory.bash" --max-iterations 25 2>&1 ); }

fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }

# 1: passing gate -> code built in a worktree, integrated to main, reaches DONE.
new_repo
out="$(DF_GATE_CMD='test -f src/feature-TASK-002.txt' DF_MAX_REWORK=3 run_router)"
printf '%s' "$out" | grep -Fq "isolated worktree for task='TASK-002'" \
  || fail "expected a worktree to be created for the delivery session"
printf '%s' "$out" | grep -Fq "integrated worktree for task='TASK-002' into main" \
  || fail "expected integration into main on gate pass"
[ -f "$REPO/src/feature-TASK-002.txt" ] \
  || fail "expected the worktree's code file to be integrated into the main tree"
[ "$(final_state)" = "DONE" ] || fail "expected final state DONE, got '$(final_state)'"
[ -d "$REPO/.df-worktrees/TASK-002" ] \
  && fail "expected the worktree to be removed after successful integration"

# 2: failing gate -> nothing integrated, worktree kept, routed to RETURNED_TO_DEV.
new_repo
out="$(DF_GATE_CMD='exit 1' DF_MAX_REWORK=99 run_router)"
printf '%s' "$out" | grep -Fq "quality gate FAILED for task='TASK-002'" \
  || fail "expected gate failure"
[ -f "$REPO/src/feature-TASK-002.txt" ] \
  && fail "expected NO integration into main on gate failure"
[ -d "$REPO/.df-worktrees/TASK-002" ] \
  || fail "expected the worktree to be kept (WIP preserved) on gate failure"
case "$(final_state)" in
  RETURNED_TO_DEV) : ;;
  *) fail "expected RETURNED_TO_DEV after gate failure, got '$(final_state)'" ;;
esac

printf 'PASS: worktree isolation, gate-in-worktree, integration-on-pass, and keep-on-fail behave as expected.\n'
