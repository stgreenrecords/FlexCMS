# Hints for Agent — Known Problems & Solutions

> **MANDATORY READ before starting any implementation task.**
> This file records problems that caused repeated failures during implementation sessions,
> along with the exact solution that fixed them. Reading this first saves you from
> repeating the same dead ends.
>
> **How to add a hint:**
> If you spend more than 2 attempts on a failing command or error and eventually find the fix,
> add a hint entry at the TOP of this file immediately after resolving it.
> One entry per distinct problem. Use the template below.

---

## Hint Template

```
### [DATE] — [SHORT PROBLEM TITLE]
**Context:** When does this problem occur? (e.g. "running Playwright tests", "building frontend")
**Symptom:** What error or failure did you see? (exact message or command output)
**What failed:** What approaches did NOT work?
**Solution:** Exact fix — command, config change, or code change that resolved it
**Why it works:** Brief explanation so future agents understand the root cause
```

---

## Hints

### 2026-08-21 — Selenium gate suites must run against **production** frontend builds, not `pnpm dev`
**Context:** Running `node scripts/selenium-gate.cjs --mode full` (or the REB-12 template suite alone) with the
admin/reference-site started via `pnpm dev`
**Symptom:** `test:templates:ci` fails on the very first gate stage while every page looks perfect in a browser.
The failure names all 65 pages at once:
```
/tut-usa | | | 4 browser console error(s) /tut-usa/accessories | | | 4 browser console error(s) ...
  expected [ ... ] to have a length of +0
```
A direct WebDriver console probe shows what those four are, on every page:
```
SEVERE | http://localhost:3001/_next/static/chunks/main-app.js?v=... Uncaught SyntaxError: Unexpected token '<'
SEVERE | http://localhost:3001/_next/static/chunks/webpack.js?v=...  Uncaught SyntaxError: Unexpected token '<'
SEVERE | http://localhost:3001/_next/static/chunks/app-pages-internals.js  Uncaught SyntaxError: ...
SEVERE | http://localhost:3001/_next/static/chunks/app/%5B%5B...slug%5D%5D/page.js  Uncaught SyntaxError: ...
```
**What failed:**
- Reading the reference-site server log — it shows `GET /_next/static/chunks/webpack.js 200`, so the requests
  look healthy. The dev server answers `200` with an **HTML** body, which is why the browser reports a syntax
  error on `<` rather than a 404.
- Assuming the failure came from whatever authoring suite ran last. REB-26 passes fine on dev servers because it
  only *records* console errors as an observation; REB-12's `TUT link integrity` scenario **asserts** there are
  none, so the same environment fails one suite and not the other.
**Solution:** Build once, then serve both frontends from their production output before running any gate:
```bash
cd frontend && pnpm build                       # 9/9 tasks
cd apps/admin        && pnpm start              # :3000
cd apps/site-nextjs  && pnpm exec next start -p 3001   # :3001
```
Note `pnpm start -- -p 3001` does **not** work for the site — pnpm forwards the literal `--` and `next start`
reads it as a project directory (`no such directory: ...\site-nextjs\-p`). Use `pnpm exec next start -p 3001`.
Verify with a console probe on one page: zero `SEVERE` entries.
**Why it works:** The Next.js dev server compiles chunks on demand under names the HTML references before they
exist; a miss falls through to the app shell, so the browser parses HTML as JavaScript. A production build emits
stable pre-compiled chunk files, so every `<script src>` resolves to real JS and the console stays clean. This is
the same root cause as the 2026-03-29 Playwright chunk-404 hint, but it surfaces as a console-error assertion
rather than a hydration timeout.

### 2026-08-21 — Every Selenium suite fails with `401` on author API writes when the backend runs without the `local` profile
**Context:** Bringing the local stack up by hand (`mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author`) and then running any Selenium suite that authors content (REB-13/18/19/26)
**Symptom:** The suite gets through planning and browser start-up, then every batch dies immediately on the first write:
```
Failed to create node content.tut-usa/reb26-component-sweep (401)
    at AuthorApiClient.createNode
```
A full 406-component REB-26 sweep "finished" in under two minutes with `PASS 0, UNSUPPORTED_UI 406, field rows: 0` — no component was ever authored, and the matrix CSV was overwritten with 406 rows of non-evidence.
**What failed:**
- Reading the outcome column: 406 `UNSUPPORTED_UI` rows look like an editor-control gap, not an auth failure. The grading in the `finally` block turns "nothing was authored" into `UNSUPPORTED_UI`, so the CSV hides the cause; only `reports/junit/reb26-suite.xml` (or the spec reporter) carries the `401`.
- Probing `GET /api/author/content/node?path=...` with `curl` first — it also answers `401`, which reads like "the endpoint wants a session" rather than "this backend was started with the wrong profile".
**Solution:** Start **both** backends with the `local` profile added, not just `author`/`publish`:
```bash
export JAVA_HOME="/c/Program Files/Java/jdk-26.0.2.1"
cd flexcms
mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author,local   # :8080
mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=publish,local  # :8081
```
Verify before starting a long suite — an unauthenticated author read must answer `200`, not `401`:
```bash
curl -s -o /dev/null -w "%{http_code}
" "http://localhost:8080/api/author/content/node?path=content.tut-usa.home"
```
**Why it works:** `flexcms.local-dev: true` is set **only** in `flexcms-app/src/main/resources/application-local.yml`, and `SecurityConfiguration` reads it as `@Value("${flexcms.local-dev:false}")` — when false it keeps the authenticated chain, so only `GET /api/content/**`, `/graphql/**`, and a few actuator paths are `permitAll`. Every author write then needs a real session, which no Selenium page object establishes. `flex start local ...` and the Docker `full` profile pass `local` for you; a hand-rolled `mvn spring-boot:run` does not.

### 2026-08-20 — `mvn spring-boot:run` fails with "release version 26 not supported"
**Context:** Starting the author/publish app (or any Maven build) in a new shell on this workstation
**Symptom:**
```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.15.0:testCompile
  (default-testCompile) on project flexcms-app: Fatal error compiling: error: release version 26 not supported
```
**What failed:**
- Trusting `java -version` on `PATH` — it reports 26.0.2.1, which looks correct. Maven does not use it.
- Re-running the build, assuming a transient compiler-plugin problem — it is deterministic.
**Solution:** `JAVA_HOME` on this machine points at **JDK 21** (`C:\Program Files\Java\jdk-21.0.12`) while
`flexcms/pom.xml` sets `<java.version>26</java.version>`. Maven honours `JAVA_HOME`, not `PATH`, so export the
JDK 26 home for the build/run shell:
```bash
export JAVA_HOME="/c/Program Files/Java/jdk-26.0.2.1"   # Git Bash
$env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.2.1" # PowerShell
```
Check with `mvn -v` — the "Java version:" line must read 26, not 21. Both JDKs are installed under
`C:\Program Files\Java\`. Persist it per-shell rather than repo-wide; do not "fix" it by lowering
`<java.version>`, which would change the whole backend's target release.
**Why it works:** `maven-compiler-plugin` passes `--release 26` to the JDK that Maven itself runs on. A JDK 21
javac has no notion of release 26, so it rejects the build before compiling a single file.

### 2026-08-20 — Selenium suites must not look for "404" in a Next.js page source
**Context:** Asserting that a rendered reference-site page is not a not-found shell (REB-26 sweep)
**Symptom:** A page that renders perfectly — correct `<title>`, all authored markers present — is reported as
"fell back to a 404 shell", because `driver.getPageSource()` contains
`404: This page could not be found.`
**What failed:**
- `expect(source).to.not.include('404')` and `bodyText.includes('404')` — both fire on healthy pages.
- Checking the HTTP status instead: the dev server answers `200` for real pages *and* for the not-found
  boundary, so status alone does not separate them either.
**Solution:** Test the document title (or visible body text), never the page source:
`EditorAuthoringPage.isFrameworkNotFoundPage()` checks `getTitle()` for
`this page could not be found` and falls back to body text starting with `404`.
**Why it works:** Next.js dev-mode ships its not-found template inside the RSC flight payload of *every*
response on the route, so the string is always in the HTML. Only the rendered document reflects which page
the browser actually displayed.

### 2026-08-19 — Testcontainers `*IT` tests fail with "Could not find a valid Docker environment" on Docker 29
**Context:** Running any integration test (`ContentNodeRepositoryIT`, `ProductRepositoryIT`, `ReplicationAgentIT`, `ReplicationReceiverIT`)
**Symptom:** `java.lang.IllegalStateException: Could not find a valid Docker environment` even though `docker ps` works and containers are running. The detail line shows `NpipeSocketClientProviderStrategy: failed with exception BadRequestException (Status 400 ...)`.
**What failed:**
- `DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine` (the active `desktop-linux` context endpoint) — no change.
- `DOCKER_API_VERSION=1.44` — no change.
- Removing the `testcontainers-bom` pin so the Spring Boot 4.1 parent's `testcontainers.version` (2.0.5) applies — the build then cannot resolve `org.testcontainers:junit-jupiter`, `postgresql`, or `rabbitmq`, because Testcontainers 2.x renamed those coordinates. It is a migration, not a version bump.
**Solution:** No quick fix — the root cause is that `pom.xml` pins `testcontainers-bom` to `1.19.8`, whose bundled docker-java is rejected by Docker Engine 29 (`docker version` shows server API 1.55, min 1.40). Track/finish the migration under `INFRA-TESTCONTAINERS-DOCKER29`. **Meanwhile, verify repository/native-SQL changes live against the running local PostgreSQL stack instead** — that is stronger evidence than the container tests anyway, and `mvn test` does not run `*IT` classes at all (surefire's default includes do not match the `*IT` suffix, and nothing runs `mvn verify`), so a green `mvn test` never covered them in the first place.
**Why it works:** Docker Engine 29 dropped support for the old API versions that Testcontainers 1.19.x negotiates, so the daemon answers `/info` with HTTP 400 before any container starts. Nothing on the client side short of upgrading the library changes that.

### 2026-08-19 — Fresh clone: Maven/pnpm absent, Maven Central fails TLS, Selenium package cannot compile
**Context:** First session on a new workstation, bringing the stack up to run any build or Selenium suite
**Symptom:** Three distinct failures in a row:
1. `mvn` and `pnpm` are simply not installed (`Get-Command` finds neither; there is no `~/.m2` and the repo has no `mvnw` wrapper).
2. Once Maven is installed, every build dies with `[FATAL] Non-resolvable parent POM ... spring-boot-starter-parent:pom:4.1.0 (absent): (certificate_unknown) PKIX path building failed: unable to find valid certification path to requested target`.
3. `pnpm --filter @flexcms/selenium-e2e build` fails because seven specs import `../../reports/hooks`, which does not exist in the repo.
**What failed:**
- `winget search Apache.Maven` — Apache Maven is not published in the winget default source (only unrelated `Tag: maven` packages).
- Assuming Git Bash's PATH was just incomplete — PowerShell with the real user PATH confirms both tools are genuinely missing.
- Assuming the PKIX error was a transient network/proxy blip and retrying the build — it is deterministic.
**Solution:**
1. **Maven:** download the official Apache binary zip (`https://dlcdn.apache.org/maven/maven-3/<v>/binaries/apache-maven-<v>-bin.zip`), verify the published `.sha512`, extract under `C:/Users/<user>/tools/`, and drop `mvn.cmd` + `mvn` shims into `C:/Users/<user>/bin` (already on PATH). No admin rights needed.
2. **TLS:** set `MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT` — persist it with `[Environment]::SetEnvironmentVariable('MAVEN_OPTS','-Djavax.net.ssl.trustStoreType=Windows-ROOT','User')`.
3. **pnpm:** `npm install -g pnpm@9.0.0` (match the `packageManager` pin in `frontend/package.json`).
4. **Selenium build:** `frontend/apps/selenium-e2e/.gitignore` had an **unanchored** `reports/` pattern, which also matched the *source* folder `src/reports/`, so `src/reports/hooks.ts` was never committed. Anchor the patterns (`/dist/`, `/reports/`) and recreate `src/reports/hooks.ts` exporting `attachFailureScreenshot(getDriver)`.
5. **Python seed scripts** need `psycopg2-binary` *and* `requests`: `python -m pip install --user psycopg2-binary requests`.
**Why it works:** The corporate network MITM-inspects TLS; its root CA is in the Windows store but not in the JDK's bundled `cacerts`, and `Windows-ROOT` makes the JVM read the Windows store directly instead of patching `cacerts`. The gitignore issue is plain gitignore semantics — a pattern without a leading slash matches a directory of that name at any depth, not just at the repo/package root.

### 2026-03-29 - Route 53 change batches from PowerShell can fail on quoting and UTF-8 BOM
**Context:** Updating DNS records with `aws route53 change-resource-record-sets` from PowerShell
**Symptom:** AWS CLI rejects the batch with JSON parse errors like `Invalid JSON` or `Expected: '=', received: 'ď'` even though the payload looks correct
**What failed:**
- Passing a large JSON batch inline as a quoted PowerShell string
- Writing the batch with `Set-Content -Encoding utf8`, which can prepend a BOM that the AWS CLI then rejects
**Solution:** Write the Route 53 batch to a file using UTF-8 without BOM, for example with `[System.IO.File]::WriteAllText(..., (New-Object System.Text.UTF8Encoding($false)))`, then call `aws route53 change-resource-record-sets --change-batch file://...`
**Why it works:** It avoids both PowerShell string-escaping issues and the BOM bytes that break AWS CLI parsing for `file://` batch payloads.

### 2026-03-29 â€” Missing author routes can come from stale Maven module jars
**Context:** Local `author` or `publish` app starts, but some controller routes behave as if they do not exist even though the source code clearly defines them
**Symptom:** Requests like `/api/author/content/children` or `/api/author/assets/{id}/content` return `No static resource ...`; OpenAPI output is also missing those routes; `javap` on workspace `target/classes` shows the methods exist, but `javap` on the installed jar in `.m2` shows an older controller without them
**What failed:**
- Restarting the backend repeatedly
- Assuming `mvn spring-boot:run -pl flexcms-app` would automatically use freshly compiled dependent modules
- Debugging the controller source as if the running process had already loaded it
**Solution:** Start Spring Boot with reactor modules included: `mvn spring-boot:run -pl flexcms-app -am ...` or otherwise install/rebuild dependent modules before running. Update local helper scripts to include `-am`.
**Why it works:** Without `-am`, `flexcms-app` can resolve internal module dependencies from stale artifacts in the local Maven repository instead of the current workspace module outputs. The app then runs old controller code even when the source tree is newer.

### 2026-03-29 â€” Do not loop on killing and restarting local servers
**Context:** Debugging local `author`/`publish`/Next.js issues where content or assets do not appear
**Symptom:** Agent repeatedly asks for approval to stop processes or rerun servers, but the same endpoint failures continue after restart
**What failed:**
- Repeatedly requesting approval to kill the same process and restart it
- Treating a successful restart as evidence that the root cause was fixed
- Asking for more process-control approvals before proving whether the failure is runtime config, stale build output, or actual code behavior
**Solution:** Before asking to kill or restart anything again, first verify whether restart already changed the failing behavior. Check the exact endpoint responses, inspect current logs, and confirm whether the problem persists unchanged. Only request another process stop/restart when there is a specific new reason it will help, and state that reason clearly.
**Why it works:** Restarting is only useful when it changes the runtime state. If the same endpoints fail in the same way after restart, more restart requests only create approval churn and waste time without moving the fix forward.

### 2026-03-29 — Playwright tests fail with 404 on JS chunks in dev server
**Context:** Running `pnpm exec playwright test` against the admin app
**Symptom:** React app fails to hydrate; browser console shows 404 errors for `.js` chunks; tests time out waiting for elements that never appear
**What failed:**
- Running tests against `pnpm dev` (Next.js dev server, port 3000)
- Adding `waitForLoadState('networkidle')` — still failed because chunks were missing
- Increasing Playwright timeouts — no effect, root cause was 404 not timeout
**Solution:** Switch `playwright.config.ts` `webServer.command` to use the production build server:
```ts
webServer: {
  command: 'pnpm build && pnpm start',
  port: 3000,
  reuseExistingServer: !process.env.CI,
}
```
**Why it works:** The Next.js dev server serves hot-module compilation chunks with dynamic names that are not pre-built. The production build (`pnpm build && pnpm start`) serves stable, pre-compiled static files that Playwright can reliably load.
