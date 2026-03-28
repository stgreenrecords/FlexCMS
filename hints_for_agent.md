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
