/**
 * Helpers for tests that create data on the real stack.
 *
 * Rules (see docs/process/TESTING.md §5):
 * - Every record a test creates carries a run-unique name from `uniqueName()`, so parallel
 *   runs and leftovers from a crashed run never collide.
 * - Every test deletes what it created (in `afterEach`/`afterAll`), even when it fails.
 * - Tests never modify or delete seeded data (tut-usa, tut-gb, ...).
 */

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** `e2e-<prefix>-<runId>-<n>` — lowercase, safe for content-path segments and ids. */
let counter = 0;
export function uniqueName(prefix: string): string {
  counter += 1;
  return `e2e-${prefix}-${RUN_ID}-${counter}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
