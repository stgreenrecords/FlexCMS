# REB-22 — experience fragment and live-copy authoring E2E

Suite: `frontend/apps/selenium-e2e/src/cases/admin/reusable-content-suite.spec.ts`
Commands: `pnpm test:reb22` / `pnpm test:reb22:ci` (added to the gate's `full` mode)
Matrix: `df/artifacts/REB-22/devops/reusable-content-matrix.csv`

**Result: 10 scenarios, 10 PASS, 0 BLOCKED.**

## Coverage against the required scenarios

| Spec scenario | Suite | Evidence |
|---|---|---|
| 1 XF browser smoke | `S1` | `/experience-fragments` lists both seeded fragments, no error banner |
| 2 Create XF | `S2` | `POST /author/xf` 200; list **and** get resolve the created path |
| 3 Add variation | `S3` | `master` + `mobile` added and listed, each a `flexcms/xf-page` |
| 4 Edit reusable content | `S4` | component added under the variation, property edited, read back; editor opens on the variation and renders it on the canvas |
| 5 XF publish impact | `S5` | variation published, then read back from **`:8081`** with its components |
| 6 Delete variation/XF | `S6` | test-owned variation and fragment removed; seeded `navigation`/`footer` asserted still present (AC3) |
| 7 Create live copy | `S7` | relationship status reports the blueprint; deep copy carried the component |
| 8 Rollout | `S8` | blueprint edit rolled out, `updatedNodes > 0`, copy carries the new value |
| 9 Detach | `S9` | status flips to `isLiveCopy: false`; a later rollout updates 0 nodes and the copy keeps its own value |
| 10 Negative checks | `S10` | missing source **404**, duplicate target **409**, unreadable body **400**, each naming the cause |

## Behaviour was probed before it was asserted

Every scenario was written against the live API rather than the controller signature.
That mattered: `excludedProps` on `POST /livecopy` is a comma-separated **String**, and
sending the array a reader would assume produced a 500. Probing first is also what
surfaced the four defects below — writing assertions from the source alone would have
codified them as correct.

## Four defects found and fixed

**1. Publishing an experience fragment shipped an empty shell.**
`ContentPublishReplicationListener.isTreeReplicationCandidate` treated only
`flexcms/page` and `flexcms/site-root` as owning a subtree. An XF variation
(`flexcms/xf-page`) owns component children in exactly the same way, so publishing one
replicated the variation and left its components on the author instance — the publish
headless API served the fragment with `components: []`. The equivalent page operation
worked, which is why the gap was invisible. Publishing each component individually was
the only way to get reusable content live.

Verified before: `components on publish: 0`. After: `1`.

**2. `IllegalArgumentException` for a missing live-copy source → HTTP 500.**
Now `NotFoundException` → **404**, naming the path.

**3. `IllegalStateException` for a duplicate target → HTTP 500.**
Now `ConflictException` → **409**, naming the collision. This is the treatment the
Experience Fragment service already gave the same situation.

**4. `HttpMessageNotReadableException` had no handler at all → HTTP 500.**
Every malformed body on **every** endpoint that accepts one answered 500 with nothing
but a correlation ID. Now **400**, with the parser's own message naming the offending
field:

```
The request body could not be read: Cannot deserialize value of type
`java.lang.String` from Array value ... (through reference chain:
CreateLiveCopyRequest["excludedProps"])
```

## Two existing tests were encoding defects 2 and 3

`LiveCopyServiceTest` asserted `IllegalArgumentException` and `IllegalStateException` —
i.e. it pinned the exception types that produce a 500. They now assert the types that
produce 404 and 409, with the reason stated, so the HTTP contract is what is protected
rather than the Java type.

## Backend tests

| Module | Tests | Notes |
|---|---|---|
| `flexcms-multisite` | 18, 0 failures | 3 corrected exception-type assertions |
| `flexcms-replication` | 15, 0 failures | +2: an XF variation replicates deep, an XF *folder* does not |
| `flexcms-app` | 47, 0 failures | +1: malformed body → 400 naming the cause |

## Documented behaviour, not fixed

Rollout for a source path that does not exist answers **200** with `updatedNodes: 0`
rather than 404. Truthful about the copies it found, but it cannot distinguish "this
blueprint has no live copies" from "you named a path that isn't there", so a typo looks
like a successful no-op. Recorded as an observation by `S10` rather than changed:
`RolloutResult` is a summary type and altering its contract is a design call, not a bug
fix. It is the same family as `R20-5` (bulk delete counting a nonexistent path as
succeeded), which was a defect — so this is worth a decision rather than silence.

## One mistake in the suite itself

`S1` initially waited for the page heading and then read the fragment list. The heading
renders before the list is fetched, so the first run sampled an empty list and reported
a product failure that was really a race in the test. It now waits for the load to
settle into one of its three outcomes — fragments, error banner, or empty state — which
is also why the assertion is not vacuous: it failed before the wait was added.

## Acceptance criteria

- **AC1** — XF CRUD/variation flows (`S1`–`S6`) and live-copy lifecycle (`S7`–`S9`) are
  covered with run-unique, test-owned data.
- **AC2** — `S5` verifies the publish instance itself, and required a replication fix to
  pass.
- **AC3** — `S6` asserts the seeded `navigation` and `footer` fragments are still listed
  after the run; the suite never mutates them.
- **AC4** — no UI route or action needed documenting as a blocker: the fragments route
  and its actions were repaired immediately before this task (see
  `df/artifacts/EXPERIENCE-FRAGMENTS-2026-08-23/summary.md`). The one imperfect
  behaviour left standing is recorded as an observation above.
- **AC5** — this file, plus the matrix CSV.
