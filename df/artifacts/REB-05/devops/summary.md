# REB-05 — DevOps implementation summary

## Summary

- Priority: P0
- Owner role/lane: `devops`
- Task: Add Selenium framework foundation and reporting package

## What was built

New pnpm workspace package `frontend/apps/selenium-e2e`:

```text
frontend/apps/selenium-e2e/
  package.json            # scripts: test, test:smoke, test:headed, test:debug, test:ci, clean
  tsconfig.json            # path aliases: @driver/*, @pages/*, @cases/*, @fixtures/*
  .mocharc.json            # spec glob over compiled dist/src/cases/**/*.spec.js
  .gitignore               # dist/, reports/, node_modules/
  selenium.config.ts       # re-exports env loader for external consumers
  README.md                # setup, scripts, env vars, conventions, downstream task map
  src/driver/
    env.ts                 # ADMIN_URL/SITE_URL/AUTHOR_*/HEADLESS/SLOWMO/CI/timeouts loader
    browser.ts              # createDriver()/quitDriver() — Chrome, headless by default
    waits.ts                # waitForVisible/Clickable/UrlContains/PageReady/FontsReady
    screenshots.ts          # captureScreenshot(driver, name) -> reports/screenshots/*.png
  src/pages/
    AdminLoginPage.ts       # example page object (open/isLoaded/submitLogin)
  src/cases/smoke/
    framework-foundation.spec.ts   # @smoke spec proving the whole chain works
  src/reports/
    hooks.ts                # attachFailureScreenshot() — auto screenshot on Mocha failure
  src/fixtures/
    index.ts                # placeholder folder/convention for REB-06 generated manifests
```

## Acceptance criteria evidence

- **AC1** (new Selenium package without deleting Playwright): package created at
  `frontend/apps/selenium-e2e`; `frontend/apps/admin-e2e` (Playwright) untouched.
  `frontend/pnpm-workspace.yaml` already globs `apps/*`, so no workspace config
  change was needed; `pnpm install` from `frontend/` picked up the new package
  (see command evidence below).
- **AC2** (typed browser/session setup, env config, waits, screenshots, report
  helpers): `src/driver/{browser,env,waits,screenshots}.ts`, all typed against
  `selenium-webdriver`'s TypeScript types.
- **AC3** (local scripts for smoke/headed/debug/CI runs): `package.json` scripts
  `test`, `test:smoke`, `test:headed`, `test:debug`, `test:ci`.
- **AC4** (JUnit-compatible reports + screenshot artifacts on failure):
  `test:ci` uses `mocha-junit-reporter` (verified output below);
  `src/reports/hooks.ts` `attachFailureScreenshot()` captures a screenshot via
  `src/driver/screenshots.ts` in Mocha's `afterEach` whenever `this.currentTest`
  failed.
- **AC5** (documentation): `README.md` covers prerequisites, all scripts, every
  environment variable, and conventions, including how `REB-06`/`REB-12`/`REB-13`/
  `REB-14` extend this foundation.

## Commands run (evidence)

```text
$ cd frontend && pnpm install
... Packages: +96 -1 ... Done in 4.8s

$ cd frontend/apps/selenium-e2e && pnpm build
> tsc -p tsconfig.json
(no errors, exit 0)

$ npx mocha
  Selenium framework foundation @smoke
    ✔ boots a Chrome session and loads the admin base URL (237ms)
  1 passing (3s)

$ CI=true npx mocha --reporter mocha-junit-reporter \
    --reporter-options mochaFile=./reports/junit/selenium-results.xml
(generated valid JUnit XML: testsuites tests="1" failures="0")
```

`dist/` and `reports/` were removed after verification and are now
`.gitignore`d — they are build/run artifacts, not source.

## Board correction

`REB-05`'s only dependency, `REB-00`, is `DONE`. The `Blocked?` flag on
`df/runtime/board.md` still said `Yes: REB-00` from before `REB-00` was
accepted; it has been corrected to reflect that `REB-05` is actually
unblocked.

## Known risks / follow-ups

- Chrome/`chromedriver` major version pinning (`^124.0.0`) may need bumping
  when the local/CI Chrome version diverges; `chromedriver` resolves the
  matching driver binary automatically but the major version should track it.
- `SLOWMO` is currently only wired through the `test:debug` npm script env var;
  no wait helper reads it yet — documented as a placeholder in the README, not
  implemented as a real step-delay, to avoid overengineering ahead of need.
- The `test`/`test:e2e` Turbo pipeline wiring is intentionally left to `REB-14`
  ("Wire Selenium gates into CI/local validation and retain artifacts") per the
  approved backlog split.
- No target app was running locally during this session, so the smoke spec
  only proves driver-boot/navigation/wait-chain mechanics, not real Admin UI
  content. This is by design for a framework-foundation task; content-level
  assertions belong to `REB-12`/`REB-13`.

## Next role

Per `DEC-REB-005`, automated `qa`/`po` sessions are temporarily disabled. This
task is moved to `READY_FOR_QA` and awaits **manual human review** rather than
an automated QA session.

