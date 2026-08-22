/**
 * FlexCMS Selenium E2E — per-component editing matrix recorder (REB-26).
 *
 * REB-19's `MatrixRecorder` records one row per *field*, which is the right
 * granularity for field-type evidence but cannot answer REB-26's acceptance
 * question: "is every one of the active component contracts accounted for?".
 * This recorder keeps exactly one row per component contract, aggregating the
 * verification layers and the outcome the sweep reached for that component, so
 * the CSV row count is directly comparable to the contract count (AC1/AC2).
 *
 * Rows are keyed by `resourceType`; recording the same component twice replaces
 * the earlier row, so a re-run of a batch cannot silently double-count.
 */
import { writeCsvFile } from './matrix';

/**
 * Component-level outcome.
 *
 * - `PASS`           — the component was edited and verified as contracted.
 * - `FAIL`           — an unexpected error; the suite fails on these.
 * - `BLOCKED`        — a known, evidenced product gap stopped verification.
 * - `UNSUPPORTED_UI` — the admin editor offers no control able to author the
 *                      component's fields (task requirement 11).
 * - `SKIPPED`        — deliberately not exercised; `notes` must say why.
 */
export type ComponentOutcome = 'PASS' | 'FAIL' | 'BLOCKED' | 'UNSUPPORTED_UI' | 'SKIPPED';

export interface ComponentMatrixRow {
  scenarioId: string;
  /** Contract index in `component-contracts.json`, for traceability. */
  contractIndex: number;
  groupName: string;
  resourceType: string;
  componentName: string;
  componentTitle: string;
  /** Fixture page the component was authored on. */
  pagePath: string;
  /** Fields actually edited, comma-free so the CSV stays one column. */
  editedFields: string;
  /** Field count the editor rendered a control for, over the contract total. */
  controlsRendered: string;
  /** Which layers were proven: `ui`, `author-api`, `headless`, `rendered`, `publish`. */
  verifiedLayers: string;
  outcome: ComponentOutcome;
  notes: string;
}

const CSV_HEADER = [
  'scenarioId',
  'contractIndex',
  'groupName',
  'resourceType',
  'componentName',
  'componentTitle',
  'pagePath',
  'editedFields',
  'controlsRendered',
  'verifiedLayers',
  'outcome',
  'notes',
] as const;

export class ComponentMatrixRecorder {
  /** Keyed by resourceType so a component can never appear twice. */
  private readonly rows = new Map<string, ComponentMatrixRow>();

  constructor(
    private readonly taskId: string,
    private readonly fileName: string = 'component-editing-matrix.csv',
  ) {}

  add(row: ComponentMatrixRow): void {
    this.rows.set(row.resourceType, row);
  }

  has(resourceType: string): boolean {
    return this.rows.has(resourceType);
  }

  get size(): number {
    return this.rows.size;
  }

  countByOutcome(outcome: ComponentOutcome): number {
    return [...this.rows.values()].filter((row) => row.outcome === outcome).length;
  }

  resourceTypes(): string[] {
    return [...this.rows.keys()];
  }

  rowsByOutcome(outcome: ComponentOutcome): ComponentMatrixRow[] {
    return [...this.rows.values()].filter((row) => row.outcome === outcome);
  }

  /** Rows ordered by contract index, so the CSV mirrors the contract file. */
  ordered(): ComponentMatrixRow[] {
    return [...this.rows.values()].sort((a, b) => a.contractIndex - b.contractIndex);
  }

  write(): string {
    return writeCsvFile(this.taskId, this.fileName, CSV_HEADER, this.ordered());
  }

  /** Outcome totals, for the run summary the role artifact records. */
  totals(): Record<ComponentOutcome | 'total', number> {
    return {
      total: this.size,
      PASS: this.countByOutcome('PASS'),
      FAIL: this.countByOutcome('FAIL'),
      BLOCKED: this.countByOutcome('BLOCKED'),
      UNSUPPORTED_UI: this.countByOutcome('UNSUPPORTED_UI'),
      SKIPPED: this.countByOutcome('SKIPPED'),
    };
  }
}
