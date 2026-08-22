# REB-19 — Repository defects found during environment bring-up (devops)

These are defects in the repository itself, not environment gaps. Both were
invisible on machines where earlier sessions ran, because the affected files
already existed locally there.

## DEFECT-1 — `src/reports/hooks.ts` was never committed (Selenium package cannot build)

**Severity:** blocker for every Selenium suite on any fresh clone (REB-12,
REB-13, REB-18, REB-19, and the CI gates from REB-14).

**Symptom:** seven spec files import `../../reports/hooks`, but
`frontend/apps/selenium-e2e/src/reports/` does not exist in the repository.
`pnpm build` (i.e. `tsc -p tsconfig.json`) therefore fails, and because every
`test:*` script is `pnpm build && mocha ...`, no Selenium suite can run at all.

Importers:

```
src/cases/admin/authoring-roundtrip.spec.ts
src/cases/admin/content-tree-lifecycle.spec.ts
src/cases/smoke/framework-foundation.spec.ts
src/cases/templates/tut-usa-link-integrity.spec.ts
src/cases/templates/tut-usa-pages.spec.ts
src/cases/templates/tut-usa-template-coverage.spec.ts
```

`src/driver/screenshots.ts` also documents the module in its header comment.

**Root cause:** `frontend/apps/selenium-e2e/.gitignore` contained an
**unanchored** `reports/` pattern. In gitignore syntax a pattern with no leading
slash matches a directory of that name at *any* depth, so it excluded the build
output directory `reports/` **and** the source directory `src/reports/`. Git
history confirms the file was never tracked — there is no delete commit:

```bash
git log --all --diff-filter=D -- 'frontend/apps/selenium-e2e/src/reports/*'   # empty
git log --all               -- 'frontend/apps/selenium-e2e/src/reports/*'     # empty
```

**Fix:** anchored the ignore patterns to the package root and recreated the
module.

`frontend/apps/selenium-e2e/.gitignore`:

```gitignore
/dist/
/reports/
/test-results/
node_modules/
```

`frontend/apps/selenium-e2e/src/reports/hooks.ts` implements the contract every
caller relies on — `attachFailureScreenshot(() => driver)` registers an
`afterEach` that captures a PNG for failed tests only, echoes the path for CI
log discovery, and never lets evidence capture mask the original assertion
failure.

**Verification:** `pnpm --filter @flexcms/selenium-e2e build` -> exit 0.

`dist/` was also matched by the same unanchored-pattern class; it is now
anchored too, which is behaviour-preserving for the build output while removing
the risk for any future `src/dist` style path.

## DEFECT-2 — JDK does not trust the intercepting corporate TLS CA

**Severity:** blocker for all Maven work on this network.

Covered in `environment-provisioning.md` section 2, and recorded as a hint in
`hints_for_agent.md` so the next agent does not rediscover it.
