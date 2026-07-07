#!/usr/bin/env bash
# The Factory - git worktree isolation for delivery-lane sessions.
#
# Problem: parallel delivery sessions sharing one working tree can clobber each
# other's code even when their declared dependencies are satisfied (an undeclared
# file overlap silently corrupts). Solution: give each delivery task its own git
# worktree on branch df/task/<id>, created from main HEAD. The agent edits code
# there in isolation; the ROUTER reconciles state and integrates the result.
#
# The df/runtime/ control plane (board.md, activity-log.md) stays SHARED and
# router-owned: branch copies of those files are never merged, so board.md cannot
# conflict across parallel branches. The router reads each task's resulting state
# from its worktree board and writes the authoritative value onto the main board.
#
# Integration brings only the task's code + its own df/artifacts/<task>/ folder
# into main (df/runtime/ is excluded) and commits just those paths, so unrelated
# uncommitted working-tree changes are left untouched.
#
# Pure bash 3.2 + git. Every function fails soft: on any git error the caller is
# expected to fall back to running the session in the main tree.

# df_git_available -> exit 0 if a usable git and repo are present at ROOT ($1).
df_git_available() {
  local root="$1"
  command -v git >/dev/null 2>&1 || return 1
  git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1
}

# df_wt_enabled ROOT -> exit 0 if worktree isolation should be used. Controlled
# by DF_WORKTREES (default on); disabled with 0/off/false/no.
df_wt_enabled() {
  case "${DF_WORKTREES:-1}" in
    0|off|OFF|false|FALSE|no|NO) return 1 ;;
  esac
  df_git_available "$1"
}

# df_role_needs_worktree ROLE -> exit 0 for code-producing delivery lanes.
df_role_needs_worktree() {
  case "$1" in
    backend-dev|frontend-dev|devops|data-engineer) return 0 ;;
    *) return 1 ;;
  esac
}

df_wt_branch() { printf 'df/task/%s' "$1"; }
df_wt_path()   { printf '%s/.df-worktrees/%s' "$1" "$2"; }

# df_wt_ensure ROOT TASK -> ensures a worktree+branch exists for TASK and echoes
# its path. Reuses an existing worktree (so rework resumes its WIP). Returns
# non-zero on any git failure so the caller can fall back to the main tree.
df_wt_ensure() {
  local root="$1" task="$2"
  local wt branch
  wt="$(df_wt_path "$root" "$task")"
  branch="$(df_wt_branch "$task")"

  if [ -d "$wt" ]; then
    printf '%s' "$wt"
    return 0
  fi

  mkdir -p "$root/.df-worktrees" 2>/dev/null || true

  if git -C "$root" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$root" worktree add --quiet "$wt" "$branch" >/dev/null 2>&1 || return 1
  else
    git -C "$root" worktree add --quiet -b "$branch" "$wt" HEAD >/dev/null 2>&1 || return 1
  fi
  printf '%s' "$wt"
}

# df_wt_state ROOT TASK -> echoes TASK's state from its worktree board.md.
# Requires df_board_state (board-parser.bash) to be sourced.
df_wt_state() {
  local wt; wt="$(df_wt_path "$1" "$2")"
  df_board_state "$wt/df/runtime/board.md" "$2" 2>/dev/null
}

# df_wt_integrate ROOT TASK -> commits the worktree's WIP on its branch, then
# brings the task's changed paths (excluding df/runtime/ and .df-worktrees/) into
# the main working tree and commits just those paths. Echoes a warning to stderr
# if a path was also changed on main since the branch point (possible undeclared
# conflict / undeclared dependency). Returns non-zero on git failure.
df_wt_integrate() {
  local root="$1" task="$2"
  local wt branch base changed conflicts
  wt="$(df_wt_path "$root" "$task")"
  branch="$(df_wt_branch "$task")"
  [ -d "$wt" ] || return 1

  # Snapshot the worktree's work on its own branch.
  git -C "$wt" add -A >/dev/null 2>&1 || return 1
  if ! git -C "$wt" diff --cached --quiet 2>/dev/null; then
    git -C "$wt" commit --quiet -m "df: $task delivery session" >/dev/null 2>&1 || true
  fi

  base="$(git -C "$root" merge-base HEAD "$branch" 2>/dev/null)" || return 1
  [ -n "$base" ] || return 1

  # Files the task changed, excluding the shared control plane and worktrees.
  changed="$(git -C "$root" diff --name-only "$base" "$branch" -- . \
    ':(exclude)df/runtime/*' ':(exclude).df-worktrees/*' 2>/dev/null)" || return 1
  [ -n "$changed" ] || return 0  # nothing to integrate

  # Warn on paths also modified on main since base (undeclared conflict risk).
  conflicts="$(git -C "$root" diff --name-only "$base" HEAD -- . \
    ':(exclude)df/runtime/*' ':(exclude).df-worktrees/*' 2>/dev/null)"
  if [ -n "$conflicts" ]; then
    local c
    while IFS= read -r c; do
      [ -n "$c" ] || continue
      if printf '%s\n' "$changed" | grep -Fxq -- "$c"; then
        printf '[df-worktree][warn] %s changed on main and by %s — possible undeclared dependency/conflict (taking %s version)\n' \
          "$c" "$task" "$task" >&2
      fi
    done <<EOF
$conflicts
EOF
  fi

  # Bring the task's versions into main's working tree + index.
  local p
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    git -C "$root" checkout "$branch" -- "$p" >/dev/null 2>&1 || true
  done <<EOF
$changed
EOF

  # Commit only the integrated paths, leaving any unrelated working-tree state.
  # shellcheck disable=SC2086
  ( cd "$root" && printf '%s\n' "$changed" | tr '\n' '\0' | xargs -0 -r git add -- ) >/dev/null 2>&1 || true
  ( cd "$root" && printf '%s\n' "$changed" | tr '\n' '\0' | xargs -0 -r git commit --quiet -m "df: integrate $task" -- ) >/dev/null 2>&1 || true
  return 0
}

# df_wt_remove ROOT TASK -> removes the worktree and deletes its branch. Best
# effort; ignores errors so cleanup never aborts the loop.
df_wt_remove() {
  local root="$1" task="$2" wt branch
  wt="$(df_wt_path "$root" "$task")"
  branch="$(df_wt_branch "$task")"
  [ -d "$wt" ] && git -C "$root" worktree remove --force "$wt" >/dev/null 2>&1 || true
  git -C "$root" branch -D "$branch" >/dev/null 2>&1 || true
  return 0
}
