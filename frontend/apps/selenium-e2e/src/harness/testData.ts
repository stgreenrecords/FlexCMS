/**
 * Test-owned data namespace and cleanup registry (REB-25 scenarios 3 and 4, AC3).
 *
 * Every suite in this program invents its own `runId` and its own teardown, and the
 * consequences have been real: a REB-23 probe run left ten catalogs and nine products
 * behind because its teardown deleted in the wrong order, and could not even see the
 * dependents it needed to remove first.
 *
 * Two things fix that, and both are here:
 *
 *  * **One namespace per run**, so anything a suite creates is identifiable as its own
 *    and a stray entity can be traced to the run that made it.
 *  * **A registry that records how to delete each entity as it is created**, and tears
 *    down in reverse order. Registering the deleter at creation time is what makes
 *    cleanup complete: a teardown that re-discovers what to delete can only remove what
 *    it can still find, which is exactly what failed before.
 *
 * Retention is explicit. `retain()` marks an entity as deliberately kept with a reason,
 * so the audit distinguishes "left behind" from "kept on purpose" — AC3 turns on that
 * distinction.
 */

export type EntityKind =
  | 'content'
  | 'asset'
  | 'product'
  | 'catalog'
  | 'fragment'
  | 'variation'
  | 'live-copy';

interface RegisteredEntity {
  kind: EntityKind;
  id: string;
  delete: () => Promise<void>;
  retainedReason?: string;
}

export interface CleanupAudit {
  runId: string;
  deleted: Array<{ kind: EntityKind; id: string }>;
  retained: Array<{ kind: EntityKind; id: string; reason: string }>;
  failed: Array<{ kind: EntityKind; id: string; error: string }>;
  /** True when nothing was left behind unintentionally. */
  clean: boolean;
}

export class TestDataNamespace {
  private readonly entities: RegisteredEntity[] = [];
  private counter = 0;

  /**
   * @param taskId  the task the suite belongs to, so a stray entity names its owner
   * @param clock   injectable for tests; defaults to the wall clock
   */
  constructor(
    readonly taskId: string,
    clock: () => number = () => Date.now(),
  ) {
    this.runId = `${taskId.toLowerCase()}-${clock()}`;
  }

  /** Unique to this run, and prefixed with the task that owns it. */
  readonly runId: string;

  private next(label: string): string {
    this.counter += 1;
    return `${this.runId}-${label}${this.counter > 1 ? `-${this.counter}` : ''}`;
  }

  /** A content-tree node name, safe for an ltree label. */
  contentName(label = 'page'): string {
    return this.next(label).replace(/[^a-zA-Z0-9-]/g, '-');
  }

  /** A DAM asset path under a site's folder. */
  assetPath(siteId: string, filename: string): string {
    return `content/dam/${siteId}/${this.runId}/${filename}`;
  }

  /** A PIM SKU. Upper-cased because SKUs conventionally are. */
  sku(label = 'sku'): string {
    return this.next(label).toUpperCase();
  }

  /** A catalog name. */
  catalogName(label = 'catalog'): string {
    return `${this.next(label)}`;
  }

  /** An experience-fragment name. */
  fragmentName(label = 'fragment'): string {
    return this.next(label).replace(/[^a-zA-Z0-9-]/g, '-');
  }

  /** A live-copy target name. */
  liveCopyName(label = 'copy'): string {
    return this.next(label).replace(/[^a-zA-Z0-9-]/g, '-');
  }

  /**
   * Records an entity and how to remove it.
   *
   * Call this at creation, not at teardown: the deleter closes over whatever identifier
   * the create response returned, which is the only reliable handle on it.
   */
  track(kind: EntityKind, id: string, remove: () => Promise<void>): void {
    this.entities.push({ kind, id, delete: remove });
  }

  /** Marks a tracked entity as deliberately kept, with a reason for the audit. */
  retain(id: string, reason: string): void {
    const entity = this.entities.find((e) => e.id === id);
    if (!entity) {
      throw new Error(`Cannot retain untracked entity "${id}" — track it first.`);
    }
    entity.retainedReason = reason;
  }

  /** Everything tracked so far, for evidence. */
  get tracked(): Array<{ kind: EntityKind; id: string }> {
    return this.entities.map(({ kind, id }) => ({ kind, id }));
  }

  /**
   * Deletes everything tracked, newest first, and reports what happened.
   *
   * Reverse order matters: dependents are created after the things they depend on, so
   * removing them in reverse respects the constraints that blocked earlier teardowns —
   * a carried-forward product before its source, a variation before its fragment.
   *
   * A failed delete is recorded rather than thrown, so one stuck entity cannot hide the
   * rest of the audit or mask the test result that matters.
   */
  async cleanup(): Promise<CleanupAudit> {
    const audit: CleanupAudit = {
      runId: this.runId,
      deleted: [],
      retained: [],
      failed: [],
      clean: true,
    };

    for (const entity of [...this.entities].reverse()) {
      if (entity.retainedReason) {
        audit.retained.push({
          kind: entity.kind,
          id: entity.id,
          reason: entity.retainedReason,
        });
        continue;
      }
      try {
        await entity.delete();
        audit.deleted.push({ kind: entity.kind, id: entity.id });
      } catch (error) {
        audit.failed.push({
          kind: entity.kind,
          id: entity.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    audit.clean = audit.failed.length === 0;
    return audit;
  }
}

/** Renders an audit for stdout and the artifact note (AC3). */
export function describeCleanup(audit: CleanupAudit): string {
  const lines = [
    `cleanup for ${audit.runId}: ${audit.deleted.length} deleted, `
      + `${audit.retained.length} retained, ${audit.failed.length} failed`,
  ];
  for (const r of audit.retained) {
    lines.push(`  retained ${r.kind} ${r.id} — ${r.reason}`);
  }
  for (const f of audit.failed) {
    lines.push(`  FAILED   ${f.kind} ${f.id} — ${f.error}`);
  }
  return lines.join('\n');
}
