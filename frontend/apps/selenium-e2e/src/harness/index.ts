/**
 * Shared Selenium hardening harness (REB-25).
 *
 * Suites import from here rather than reaching into individual modules, so the set of
 * cross-cutting helpers is discoverable in one place and a new suite has an obvious
 * default for preflight, publish verification, test data, browser health and
 * accessibility.
 */
export {
  assertEnvironmentReady,
  describeEnvironment,
  endpointChecks,
  inspectEnvironment,
  type EndpointCheck,
  type EndpointResult,
} from './preflight';

export {
  PublishVerifier,
  publishVerifier,
  type PublishPageResult,
} from './publishVerification';

export {
  TestDataNamespace,
  describeCleanup,
  type CleanupAudit,
  type EntityKind,
} from './testData';

export {
  CONSOLE_IGNORE,
  brokenMedia,
  describeFindings as describeHealthFindings,
  failedRequests,
  severeConsoleErrors,
  type ConsoleFinding,
  type MediaFinding,
} from './browserHealth';

export {
  accessibilitySmoke,
  describeA11y,
  focusIndicatorFindings,
  keyboardReachesControl,
  landmarkFindings,
  unlabelledControlFindings,
  type A11yFinding,
} from './accessibility';

export {
  FindingLog,
  describeFindings as describeClassifiedFindings,
  type ClassifiedFinding,
  type FailureClass,
} from './failureTaxonomy';
