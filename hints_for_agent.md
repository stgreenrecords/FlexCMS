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

### 2026-08-23 — Rebuilding the frontends while their servers run invalidates any Selenium run in flight
**Context:** Running `cd frontend && pnpm build` (turbo) to pick up a code change while `pnpm start` / `next start`
are already serving :3000 and :3001, then running or continuing a Selenium suite
**Symptom:** Scenarios fail with results that look like product regressions but are not. A REB-26 sweep reported
`0/20 PASS` for four consecutive batches; the failure screenshot showed the browser on
`ERR_CONNECTION_REFUSED` / "This site can't be reached", and by the time the run ended both servers answered
normally again — so nothing was reproducible afterwards.
**What failed:**
- Reading the batch outcome: `0 PASS, 0 BLOCKED, 0 FAIL of 20` grades as `UNSUPPORTED_UI`, which looks exactly
  like an editor-control gap rather than a dead server.
- Re-running immediately without restarting the servers — the next batch hit the same half-swapped `.next`.
**Solution:** treat a frontend rebuild as a restart. Kill the servers, `pnpm build`, start them again, health-check
both, and only then launch a suite:
```bash
# stop whatever holds 3000/3001, then
cd frontend && pnpm build
cd apps/admin       && pnpm start &
cd apps/site-nextjs && pnpm exec next start -p 3001 &
curl -s -o /dev/null -w "%{http_code}
" http://localhost:3000
curl -s -o /dev/null -w "%{http_code}
" http://localhost:3001/tut-usa/home
```
**Why it works:** `next start` serves the prebuilt `.next` directory and reads its build manifest at request time.
A turbo rebuild replaces those files underneath the running process, so in-flight requests can 500 or the process
can drop the connection entirely until it is restarted against a complete build. Nothing in the suite output
distinguishes that from a broken feature — always confirm both ports answer before believing a UI failure.

### 2026-08-23 — A `@Scheduled` job calling a `@PreAuthorize`d service fails with "Authentication object was not found"
**Context:** Any background job that goes through a secured service method — e.g. `ScheduledPublishingService`
calling `ContentNodeService.updateStatus()`, which is `@PreAuthorize("hasPermission(#path, 'PUBLISH')")`
**Symptom:** The job logs a failure every cycle and never makes progress; the scheduled work is retried forever:
```
ERROR c.f.a.s.ScheduledPublishingService : Scheduled publish failed for 'content.tut-usa.x':
       An Authentication object was not found in the SecurityContext
```
**What failed:**
- Unit tests — they mock the collaborating service, so Spring method security never evaluates and the job looks
  correct. Only a live run (or an integration test through the real bean) shows it.
- Assuming `flexcms.local-dev: true` covers it: that property relaxes the HTTP filter chain, not `@PreAuthorize`
  method security, which applies regardless of runmode.
**Solution:** give the job an identity for the duration of its work, rather than reaching for a non-secured
back door:
```java
SecurityContext previous = SecurityContextHolder.getContext();
try {
    SecurityContext ctx = SecurityContextHolder.createEmptyContext();
    ctx.setAuthentication(new UsernamePasswordAuthenticationToken(
            "system:scheduler", "n/a", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    SecurityContextHolder.setContext(ctx);
    work.run();
} finally {
    SecurityContextHolder.setContext(previous);   // pooled thread — always restore
}
```
`ROLE_ADMIN` is what `NodeAclService.isAllowed()` accepts for unrestricted access, and the audit trail then
attributes the change to `system:scheduler` instead of to nobody.
**Why it works:** `@Scheduled` runs on a pooled thread with an empty `SecurityContext`; Spring's method security
rejects the call before the method body executes. Supplying a principal satisfies the check without weakening the
annotation, and restoring the previous context prevents the identity leaking to the next task on that thread.

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

### 2026-08-19 — [RESOLVED 2026-08-22] Testcontainers `*IT` tests fail with "Could not find a valid Docker environment" on Docker 29
**Context:** Running any integration test (`ContentNodeRepositoryIT`, `ProductRepositoryIT`, `ReplicationAgentIT`, `ReplicationReceiverIT`)
**Symptom:** `java.lang.IllegalStateException: Could not find a valid Docker environment` even though `docker ps` works and containers are running. The detail line shows `NpipeSocketClientProviderStrategy: failed with exception BadRequestException (Status 400 ...)`.
**What failed:**
- `DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine` (the active `desktop-linux` context endpoint) — no change.
- `DOCKER_API_VERSION=1.44` — no change.
- Removing the `testcontainers-bom` pin so the Spring Boot 4.1 parent's `testcontainers.version` (2.0.5) applies — the build then cannot resolve `org.testcontainers:junit-jupiter`, `postgresql`, or `rabbitmq`, because Testcontainers 2.x renamed those coordinates. It is a migration, not a version bump.
**Solution (done — `INFRA-TESTCONTAINERS-DOCKER29`, 2026-08-22):** remove the `testcontainers-bom` pin from
`flexcms/pom.xml` entirely and inherit the Spring Boot-managed line (2.0.5 for Boot 4.1.0). The 2.x rename is
mechanical: every module artifactId gains a `testcontainers-` prefix (`junit-jupiter` ->
`testcontainers-junit-jupiter`, `postgresql` -> `testcontainers-postgresql`, `rabbitmq` ->
`testcontainers-rabbitmq`); the base artifact stays `org.testcontainers:testcontainers`. In Java code, 2.x keeps
`org.testcontainers.containers.*` as **deprecated** aliases and adds `org.testcontainers.postgresql` /
`org.testcontainers.rabbitmq`, whose classes drop the `SELF` self-type generic — so `PostgreSQLContainer<?>`
becomes `PostgreSQLContainer`. All four suites now pass on Engine 29.7.2 (47 tests). **They run at `verify`, not
`test`:** surefire's default includes never match `*IT`, so `mvn test` still executes zero integration tests —
use `cd flexcms && mvn verify` (Docker required). See `df/artifacts/INFRA-TESTCONTAINERS-DOCKER29/devops/summary.md`.

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

### 2026-08-23 — A partial `mvn install` can silently strip transitive dependencies
**Context:** Rebuilding a few modules (`mvn -o install -pl flexcms-core,flexcms-dam,flexcms-author`) and restarting `flexcms-app`
**Symptom:** The app fails to start with `ClassNotFoundException` for a third-party class that is plainly declared as a dependency — `org.owasp.html.HtmlPolicyBuilder` — and was on the classpath minutes earlier
**What failed:**
- Checking that the dependency is declared in `flexcms-core/pom.xml` (it is) and that the jar is in `~/.m2` (it is)
- Checking that the *installed* `flexcms-core` pom declares it (it does)
- Assuming the restart itself was at fault and restarting again
**Solution:** Install the parent pom too — `mvn -o install -N` from `flexcms/`, or just install the whole reactor. Then confirm with:
```
cd flexcms/flexcms-app && mvn -o dependency:tree -Dincludes=<group>:*
```
A line reading `The POM for com.flexcms:<module> is invalid, transitive dependencies (if any) will not be available` is the real error; the `ClassNotFoundException` is only its downstream symptom.
**Why it works:** A module installed into `~/.m2` is later resolved through its *installed parent*. Module poms here declare dependencies without versions and rely on the parent's `dependencyManagement`, so if the installed parent is older than the source parent and lacks an entry, the module's effective model cannot be built. Maven then drops **every** transitive dependency of that module — not just the unresolvable one — and reports it as a WARNING, so the build still "succeeds" and only the runtime classpath is wrong.

This became reachable when the Testcontainers migration renamed the managed artifacts (`testcontainers-postgresql`, `testcontainers-junit-jupiter`) in the parent pom: any `.m2` still holding a pre-migration parent breaks this way.

### 2026-08-24 — A test that builds its own target verifies the destination, not the journey
**Context:** Selenium/E2E coverage of admin authoring flows
**Symptom:** A suite is green, sometimes with "100% coverage", while the feature is visibly broken for a human using it
**What failed:**
- Opening the editor on a path the test assembled itself — `` `${xfPath}.master` ``, or a literal `.../navigation/master`. Both passed while every link in the product pointed at the fragment *folder*, which the editor could not render
- Asserting palette drag-and-drop by way of the click-to-insert path, which kept working while dragging was completely dead
- Trusting a hardcoded href string in a test instead of reading the `href` the app actually rendered
**Solution:** Assert the navigation, not just the destination. Concretely:
1. **Follow the app's own links.** Read `href` from the DOM and `get()` that, rather than composing the URL you believe it should be.
2. **Drive the real interaction.** If the feature is a drag, use a pointer sequence (`actions().move().press().move()…`); if the same outcome is reachable by a click that works, a click-based assertion proves nothing about the drag.
3. **Add an invariant that is entry-point independent.** "No structural node may ever render as a component, whatever the URL" catches the whole class, including entry points nobody enumerated. Path-specific scenarios only catch the paths you thought of.
4. **Check the precondition is real.** `expect(anchors.length).to.be.greaterThan(0)` before asserting what clicking an anchor does — otherwise the scenario passes vacuously.
**Why it works:** Constructing the target encodes the assumption you are trying to test. The application is then free to build a different, wrong URL and every assertion still holds. Both editor bugs found on 2026-08-24 lived in that blind spot, behind suites that were green.

### 2026-08-24 — dnd-kit draggables must share a DndContext with their drop targets
**Context:** The admin page editor: a component palette on the left, a sortable canvas in the centre
**Symptom:** Dragging from the palette does nothing — no drag image, no drop, no error. Reordering items already on the canvas works perfectly
**What failed:**
- Looking for a bug in `handleDragEnd`, which was correct and simply never called
- Assuming the sortable machinery was broken, when it was demonstrably working for canvas reordering
**Solution:** Check where `<DndContext>` opens relative to *every* `useDraggable`/`useSortable` in the flow. Here it opened inside the canvas `<section>`, so the palette's draggables were outside it. Move the context up to enclose both ends of the drag; leave `SortableContext` scoped to the list it sorts.
**Why it works:** `useDraggable` resolves its context from React context. Outside a provider it still returns `listeners` and `attributes` that attach without complaint, so the failure is completely silent — the pointer events fire and no drag ever begins. The working reorder is a misleading signal: those draggables are inside the context, so their success says nothing about the ones outside it.

### 2026-08-24 — A test that appends to a shared fixture degrades until it fails, and only under load

**Context:** Running the full Selenium gate. `REB-13 … edits a page property and persists it after
refresh` failed inside `test:admin:ci`, but the same suite passed 4/4 when run standalone against
the very same build.

**Symptom:** `reb13-admin-suite.xml` was never written; the only evidence was the retained
screenshot, which showed the editor loaded correctly with the SLUG field reading
`home reb13-1787168098340 reb13-17…`.

**What failed:** Suspecting the most recent product change (a `pointer-events: none` rule on
`.flexcms-canvas`) because the failing test edits properties. It was innocent — the properties
panel is outside the canvas, and the suite passed standalone with that rule in place. Re-running
the suite in isolation proves nothing here: isolation is precisely the condition under which the
bug hides.

**Solution:** `EditorPage.updateFirstEditableTextField(suffix)` read the field's current value and
wrote back `${previousValue} ${suffix}` — it *appended*. Nothing ever reset the fixture, so the
stored slug grew by one marker per gate run and had reached 624 characters across 32 runs. Replaced
it with `setFirstEditableTextField(value)`, which overwrites, and reset the stored slug to `home`
via `PUT /api/author/content/node/properties` (sending the node's other properties back unchanged).
The helper now also re-reads the input after `sendKeys` and fails there if the value does not match.

**Why it works:** `sendKeys` types one character at a time into a controlled React input that
re-renders on every keystroke, and the assertion compares the *entire* string for equality. The
longer the value, the likelier one keystroke is lost — so the test got monotonically more fragile
with every run and tipped over first on the loaded machine running the whole gate. Overwriting keeps
the value bounded and constant-length, and it additionally proves the previous value was replaced,
which appending never did. **Generalisation:** any test that mutates shared fixture state
*cumulatively* is a time bomb whose fuse length is the number of times it has run. When a test
fails in the gate but passes alone, look for state the test itself left behind, and read the failure
screenshot before theorising — the accumulated value was visible in it.

### 2026-08-25 — `asChild` on the shared `DropdownMenuItem` crashed the whole page

**Context:** Opening the asset actions menu (the three-dot button on a DAM asset card) at `/dam`.

**Symptom:** The page white-screens to "Application error: a client-side exception has
occurred". Selenium reports it indirectly and confusingly — `stale element reference`, or a
15s timeout waiting for `[data-testid="dam-asset-delete"]`, or attributes that read `null`
on an element that had them a moment earlier. The real error is only in the browser console:
`React.Children.only expected to receive a single React element child.`

**What failed:** Suspecting the `asChild`/`Slot` contract in `Button` (it is correct — it
uses `forwardRef` and spreads props), and suspecting hydration (also fine — folder clicks in
the same page work). Reading `outerHTML.slice(0,180)` in a probe was actively misleading: the
Tailwind class string is longer than that, so `aria-haspopup`/`data-state` looked absent when
they were merely truncated.

**Solution:** `packages/ui/src/components/DropdownMenu.tsx` — `DropdownMenuItem` wrapped its
children as `{icon && …}<span>{children}</span>{shortcut && …}` while forwarding `asChild`
through `{...props}`. With `icon`/`shortcut` unset those two expressions evaluate to `false`,
and `false` still counts as a child, so Radix's `asChild` path called `React.Children.only`
on **three** children and threw. Now `asChild` renders `children` straight through and only
the non-`asChild` path wraps.

**Why it works:** `asChild` means the caller owns the rendered element, so a component that
also decorates its children cannot forward the flag unchanged. **Generalisation:** any
wrapper that both accepts `asChild` and renders extra children has this bug latent; the
crash only appears when a caller actually passes `asChild`, which is why one usage in the
whole repo (`dam/page.tsx`) was enough to break that page while every other dropdown worked.

### 2026-08-25 — Playwright specs that mock the API describe a different tree than the live one

**Context:** Repairing `admin-e2e/tests/phase1-critical/content-tree.spec.ts` after installing
the missing Chromium (`CONTENT-PUBLISH-DOUBLECLICK`).

**Symptom:** Six tests fail at `expect(rowByName(page,'home')).toBeVisible()` after clicking a
row named `en`. Probing the live author API shows `content.tut-usa` has twelve children and
none of them is `en`, which makes the locale level look invented.

**What failed:** Concluding from that probe that the `en` hop was fictional and rewriting the
spec to walk `tut-usa → home` — 34 lines of edits that broke two tests which had been
passing, because this spec installs its own `page.route('**/api/**')` mocks in
`test.beforeEach` and the mocked tree genuinely *is* `tut-usa → en → home`. Also burned two
attempts on regex escaping (`\s` inside a JS template literal collapses to `s` before the
`RegExp` sees it, so `/^\s*home\s*$/` silently became `/^s*homes*$/`).

**Solution:** Reverted the spec (`git checkout --`) and fixed the fixture instead:
`src/fixtures/data/content-children-tut-usa.json` typed `content.tut-usa.en` as
`flexcms/page`, but the content tree only descends into **non**-page nodes
(`handleClick` returns early for `flexcms/page`), so clicking it never loaded its children.
Changing that one `resourceType` to `flexcms/container` took the file from 9 passed / 6 failed
to **15/15**. The fixture had contradicted itself all along — a "page" that a sibling fixture
gives nine children.

**Why it works:** The mocks are the system under test here, not the database. **Two lessons:**
(1) before probing a running service to explain a Playwright failure, check whether the spec
intercepts `**/api/**` — otherwise you are debugging the wrong world; (2) when a whole family
of tests fails identically, prefer the one-line data fix over rewriting the tests — the tests
encoded the intended behaviour correctly and the fixture was wrong. Note also that
`--workers` parallelism produced 14 phantom `TIMEDOUT` results on this suite; `--workers=1`
showed the true 6.
