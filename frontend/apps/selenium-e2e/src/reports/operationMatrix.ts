/**
 * FlexCMS Selenium E2E — publishing/workflow operation matrix recorder (REB-20).
 *
 * REB-19's `MatrixRecorder` is field-shaped and REB-26's is component-shaped;
 * neither fits REB-20, whose unit of evidence is an *operation* (start a
 * workflow, bulk move, schedule a deactivation) verified across three surfaces:
 * the author API, the admin UI, and the publish environment. One row per
 * operation, with a column per surface, makes it directly readable which
 * surfaces an operation actually proved — and which it could not.
 */
import { writeCsvFile } from './matrix';

/**
 * Outcome of one operation.
 *
 * - `PASS`    — the operation behaved as contracted on every surface it claims.
 * - `FAIL`    — unexpected behaviour; the suite fails on these.
 * - `BLOCKED` — a known, evidenced product gap stopped a surface from verifying.
 * - `SKIPPED` — deliberately not exercised; `notes` must say why.
 */
export type OperationOutcome = 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED';

export interface OperationMatrixRow {
  scenarioId: string;
  /** Human-readable scenario name, matching the Mocha test title. */
  scenario: string;
  /** The operation exercised, e.g. `workflow:advance approve` or `bulk:move`. */
  operation: string;
  /** Content path (or paths) the operation acted on. */
  target: string;
  /** What the author API proved. */
  apiEvidence: string;
  /** What the admin UI proved, or why it could not. */
  uiEvidence: string;
  /** What the publish environment proved, or why it could not. */
  publishEvidence: string;
  outcome: OperationOutcome;
  notes: string;
}

const CSV_HEADER = [
  'scenarioId',
  'scenario',
  'operation',
  'target',
  'apiEvidence',
  'uiEvidence',
  'publishEvidence',
  'outcome',
  'notes',
] as const;

export class OperationMatrixRecorder {
  private readonly rows: OperationMatrixRow[] = [];

  constructor(
    private readonly taskId: string,
    private readonly fileName: string = 'publishing-operation-matrix.csv',
  ) {}

  add(row: OperationMatrixRow): void {
    this.rows.push(row);
  }

  get size(): number {
    return this.rows.length;
  }

  countByOutcome(outcome: OperationOutcome): number {
    return this.rows.filter((row) => row.outcome === outcome).length;
  }

  rowsByOutcome(outcome: OperationOutcome): OperationMatrixRow[] {
    return this.rows.filter((row) => row.outcome === outcome);
  }

  write(): string {
    return writeCsvFile(this.taskId, this.fileName, CSV_HEADER, this.rows);
  }

  totals(): Record<OperationOutcome | 'total', number> {
    return {
      total: this.size,
      PASS: this.countByOutcome('PASS'),
      FAIL: this.countByOutcome('FAIL'),
      BLOCKED: this.countByOutcome('BLOCKED'),
      SKIPPED: this.countByOutcome('SKIPPED'),
    };
  }
}
