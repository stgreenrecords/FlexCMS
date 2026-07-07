#!/usr/bin/env bash
# The Factory - deterministic sub-dashboard renderer.
#
# The five lane sub-boards (design / backend-dev / frontend-dev / devops /
# data-engineer) used to be hand-mirrored from board.md by agents, which drifts.
# This renderer DERIVES them from board.md instead: each lane board lists exactly
# the board rows whose Owner-role column matches that lane. It is idempotent and
# safe to run after every board change.
#
# Pure bash 3.2 + coreutils, matching the rest of the router. Depends on df_trim
# from board-parser.bash (source it before calling df_render_subboards).

# Internal: emit the 8-column sub-board rows (Priority|Task|Title|State|Owner|
# Blocked?|Last updated|Next action) for the lane $2, parsed from board $1.
# Echoes nothing if the lane has no rows.
_df_lane_rows() {
  local board="$1" lane="$2" line
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      \|*\|*) : ;;
      *) continue ;;
    esac
    case "$line" in
      *---*) continue ;;
    esac

    local oldIFS="$IFS"
    IFS='|'
    # shellcheck disable=SC2206
    local f=($line)
    IFS="$oldIFS"

    local prio task title owner blocked updated next
    prio="$(df_trim "${f[1]:-}")"
    task="$(df_trim "${f[2]:-}")"
    title="$(df_trim "${f[3]:-}")"
    # f[4]=Type is intentionally dropped (sub-boards have no Type column).
    local state; state="$(df_trim "${f[5]:-}")"
    owner="$(df_trim "${f[6]:-}")"
    blocked="$(df_trim "${f[7]:-}")"
    updated="$(df_trim "${f[8]:-}")"
    next="$(df_trim "${f[9]:-}")"

    [ "$prio" = "Priority" ] && continue
    [ -z "$task" ] && continue
    [ "$task" = "-" ] && continue
    [ "$owner" = "$lane" ] || continue

    printf '| %s | %s | %s | %s | %s | %s | %s | %s |\n' \
      "$prio" "$task" "$title" "$state" "$owner" "$blocked" "$updated" "$next"
  done < "$board"
}

# _df_write_subboard BOARD RUNTIME_DIR LANE FILE TITLE TRIGGER
_df_write_subboard() {
  local board="$1" runtime="$2" lane="$3" file="$4" title="$5" trigger="$6"
  local out rows ts
  ts="$(date '+%Y-%m-%d %H:%M') local"
  rows="$(_df_lane_rows "$board" "$lane")"

  out="# The Factory ${title}"$'\n\n'
  out="${out}Auto-generated from \`df/runtime/board.md\` by the router. Do not edit by hand;"$'\n'
  out="${out}update the task's State/Owner on the main board and this view re-renders."$'\n\n'
  out="${out}Lists rows whose Owner role is \`${lane}\` (${trigger})."$'\n\n'
  out="${out}| Priority | Task ID | Title | State | Owner role | Blocked? | Last updated | Next action |"$'\n'
  out="${out}|---|---|---|---|---|---|---|---|"$'\n'
  if [ -n "$rows" ]; then
    out="${out}${rows}"$'\n'
  else
    out="${out}| - | - | No ${lane} tasks | NO_TASKS | ${lane} | No | ${ts} | Await routing from SA |"$'\n'
  fi
  printf '%s' "$out" > "$runtime/$file"
}

# df_render_subboards RUNTIME_DIR -> regenerates all five lane sub-boards from
# RUNTIME_DIR/board.md. No-op (returns 0) if the board is missing.
df_render_subboards() {
  local runtime="$1" board="$1/board.md"
  [ -f "$board" ] || return 0
  _df_write_subboard "$board" "$runtime" designer      design-board.md        "Design Subdashboard"          "READY_FOR_DESIGN / DESIGN_IN_PROGRESS"
  _df_write_subboard "$board" "$runtime" backend-dev    backend-dev-board.md   "Backend Delivery Subdashboard"  "READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV"
  _df_write_subboard "$board" "$runtime" frontend-dev   frontend-dev-board.md  "Frontend Delivery Subdashboard" "READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV"
  _df_write_subboard "$board" "$runtime" devops         devops-board.md        "DevOps Delivery Subdashboard"   "READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV"
  _df_write_subboard "$board" "$runtime" data-engineer  data-engineer-board.md "Data Delivery Subdashboard"     "READY_FOR_DEV / DEV_IN_PROGRESS / RETURNED_TO_DEV"
}

# Allow running this file directly: render against df/runtime relative to repo.
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  _RSDIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  # shellcheck source=board-parser.bash
  . "$_RSDIR/board-parser.bash"
  df_render_subboards "$(cd -- "$_RSDIR/../runtime" && pwd)"
fi
