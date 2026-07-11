# Backend test-gate remediation

## Scope

Resolve the repository-wide Maven test blocker reported while validating the Elasticsearch actuator health remediation.

## Root cause

`ContentNodeServiceTest` used `@InjectMocks` for `ContentNodeService` without providing its required `PlatformTransactionManager`. Every bulk operation failed before reaching the repository because `TransactionTemplate` was constructed with a null manager. Two tests also contained unnecessary stubs that Java 26/Mockito strictness reported.

## Change

- Added a mocked `PlatformTransactionManager` to `ContentNodeServiceTest`.
- Configured a lenient `SimpleTransactionStatus` response for transaction creation.
- Removed the unused repository-save stub from the owner-locked no-op update test.
- Production `ContentNodeService` was not changed.

## Validation scenarios

1. Bulk status update counts successful and missing paths independently.
2. Bulk delete invokes each subtree deletion and isolates per-path failures.
3. Bulk move processes all paths and isolates missing-source failures.
4. Existing content-node create/update/move/lock/unlock/status/version/sanitization tests remain green.
5. Full backend Maven test suite passes.
6. Full backend clean compile passes.
7. Live Author and Publish actuator aggregate/liveness/readiness endpoints remain healthy.

## Evidence

- Focused `ContentNodeServiceTest`: 35 tests, 0 failures, 0 errors.
- `cd flexcms && mvn test`: BUILD SUCCESS, exit 0; all reactor modules passed.
- `cd flexcms && mvn clean compile`: BUILD SUCCESS, exit 0; all 16 modules passed.
- Live health recheck after compile: all six endpoints returned HTTP 200 with status UP.

