/**
 * Failure classification (REB-25 scenario 10, AC4).
 *
 * A red suite answers "something is wrong" and nothing more useful. These four
 * categories exist because each one goes to a different person and demands a different
 * response, and this program has produced all four:
 *
 *  * `product-defect` — the system is wrong. Publishing an experience fragment shipped
 *    it without its components; every PIM product update collided on its version
 *    snapshot.
 *  * `environment-blocker` — the system is fine, the environment is not. An
 *    Elasticsearch client two majors ahead of the server; a service that was not
 *    started.
 *  * `unsupported-ui` — the product has no such capability yet, so there is nothing to
 *    assert. The component registry has no route into the editor; the translations
 *    matrix has no read endpoint.
 *  * `test-bug` — the suite is wrong. Reading a list before its fetch resolved; matching
 *    the string "404" against a component named "Error Page 404".
 *
 * Recording the class next to the evidence is what stops a test bug being filed as a
 * product defect, and — worse — a product defect being written off as a test bug.
 */

export type FailureClass =
  | 'product-defect'
  | 'environment-blocker'
  | 'unsupported-ui'
  | 'test-bug';

export interface ClassifiedFinding {
  classification: FailureClass;
  /** What was observed, in one line. */
  summary: string;
  /** Where it lives: a file, an endpoint, a route. */
  reference: string;
  /** What the observer should do about it. */
  action: string;
}

const OWNER: Record<FailureClass, string> = {
  'product-defect': 'fix the product',
  'environment-blocker': 'fix or configure the environment; the product is not implicated',
  'unsupported-ui': 'build the capability, or accept the gap; there is nothing to assert until then',
  'test-bug': 'fix the suite; the product behaved correctly',
};

/** One line per finding, grouped by class, for a summary artifact. */
export function describeFindings(findings: ClassifiedFinding[]): string {
  if (findings.length === 0) return 'No findings.';

  const order: FailureClass[] = [
    'product-defect',
    'environment-blocker',
    'unsupported-ui',
    'test-bug',
  ];

  const sections: string[] = [];
  for (const classification of order) {
    const group = findings.filter((f) => f.classification === classification);
    if (group.length === 0) continue;

    sections.push(`${classification} (${group.length}) — ${OWNER[classification]}`);
    for (const finding of group) {
      sections.push(`  - ${finding.summary}`);
      sections.push(`    where:  ${finding.reference}`);
      sections.push(`    action: ${finding.action}`);
    }
  }
  return sections.join('\n');
}

/**
 * Collects classified findings for one suite.
 *
 * A suite reports through this rather than `console.log` so its evidence has the same
 * shape everywhere, and so a run's findings can be counted by class.
 */
export class FindingLog {
  private readonly findings: ClassifiedFinding[] = [];

  constructor(private readonly taskId: string) {}

  add(finding: ClassifiedFinding): void {
    this.findings.push(finding);
  }

  productDefect(summary: string, reference: string, action: string): void {
    this.add({ classification: 'product-defect', summary, reference, action });
  }

  environmentBlocker(summary: string, reference: string, action: string): void {
    this.add({ classification: 'environment-blocker', summary, reference, action });
  }

  unsupportedUi(summary: string, reference: string, action: string): void {
    this.add({ classification: 'unsupported-ui', summary, reference, action });
  }

  testBug(summary: string, reference: string, action: string): void {
    this.add({ classification: 'test-bug', summary, reference, action });
  }

  get all(): ClassifiedFinding[] {
    return [...this.findings];
  }

  count(classification: FailureClass): number {
    return this.findings.filter((f) => f.classification === classification).length;
  }

  /** Prints the log, or says plainly that there was nothing to report. */
  report(): void {
    if (this.findings.length === 0) {
      console.log(`[${this.taskId}] no classified findings`);
      return;
    }
    console.log(`[${this.taskId}] classified findings:`);
    console.log(describeFindings(this.findings));
  }
}
