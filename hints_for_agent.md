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
