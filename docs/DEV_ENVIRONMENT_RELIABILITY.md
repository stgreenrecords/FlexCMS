# Dev Environment Reliability — Root Cause Analysis & Prevention

## Why the environment takes so long to bring up

Every time a new developer (or AI agent) runs FlexCMS locally, they hit a cascade of unrelated errors before the first page loads. This document dissects every failure that occurred during the WKND sample-website bringup, explains why each one happened, and defines the engineering rules that would have prevented them.

---

## Session post-mortem: what broke and why

### 1. Unit tests failed at CI — missing `@Mock` fields

**What happened:** `ProductServiceTest`, `CarryforwardServiceTest`, `ProductVersionServiceTest` all threw `NullPointerException` because `ProductService.productSearchService` was `null` at test time. `@InjectMocks` could not inject the field because no matching `@Mock` existed in the test class.

**Root cause:** `ProductSearchService` was added to `ProductService` after the tests were written. Nobody updated the tests.

**Time lost:** ~1 hour of CI diagnosis.

**Prevention rule:** Any time you add an `@Autowired` field to a service that already has `@InjectMocks` tests, you must add the corresponding `@Mock` in the same commit. Make this a code-review checklist item. CI should fail loudly on this — it did, but the fix should have been in the original PR.

---

### 2. Next.js page exported as named function

**What happened:** `SchemaVisualEditorPage` was `export function SchemaVisualEditorPage()` instead of an anonymous default export. Next.js 14 App Router rejects named page exports.

**Root cause:** Copy-paste from a component file rather than a page template.

**Time lost:** ~20 minutes.

**Prevention rule:** Page files (`page.tsx`) must use `export default`. Components use named exports. Add an ESLint rule: `import/no-named-export` scoped to `**/page.tsx` files.

---

### 3. Spring MVC 6 rejects `{*varName}` followed by path segments

**What happened:** `ExperienceFragmentController` and `ExperienceFragmentApiController` used patterns like `/{*xfPath}/variations/{variationType}`. Spring MVC 6's `PathPatternParser` forbids any path element after a catch-all `{*...}` segment. The application refused to start.

**Root cause:** These patterns were written using Spring MVC 5 semantics and never validated against a running Spring Boot 3 instance.

**Time lost:** ~45 minutes.

**Prevention rule:** Run `mvn spring-boot:run` (even briefly) as part of every PR that touches `@RequestMapping` annotations. A pattern validation error is thrown at startup, not at compile time. If a path must capture a multi-segment variable AND have suffixes, use `@RequestParam` for the variable instead.

---

### 4. `@EnableElasticsearchRepositories` scanned wrong package

**What happened:** `FlexCmsApplication` declared `@EnableElasticsearchRepositories(basePackages = "com.flexcms.search.repository")`. `ProductSearchRepository` lives in `com.flexcms.pim.search`. Spring could not find the bean, so `ProductService` failed to autowire.

**Root cause:** The annotation was written before PIM got its own search repository. The package list was never updated.

**Time lost:** ~30 minutes.

**Prevention rule:** Use `@EnableElasticsearchRepositories(basePackages = "com.flexcms")` to cover the entire namespace, or keep a documented list of scan packages and update it whenever a new module adds a repository. A startup integration test (even a smoke test that loads the `ApplicationContext`) would catch this immediately.

---

### 5. No local dev profile — Keycloak required to start the app

**What happened:** `SecurityConfig` unconditionally required `spring.security.oauth2.resourceserver.jwt.issuer-uri` to resolve at startup. With no Keycloak running locally, the app would not start at all.

**Root cause:** Security was implemented for production without providing a development escape hatch.

**Time lost:** ~1 hour designing and implementing `application-local.yml` + `localDev` flag.

**Prevention rule:** Every production security mechanism needs a named dev bypass from day one. The pattern is: `@Value("${flexcms.local-dev:false}") boolean localDev` in `SecurityConfig`, plus an `application-local.yml` that sets it. Write this when you write the security config, not after someone can't start the app.

---

### 6. SQL seed files used `'LIVE'` status — enum value does not exist

**What happened:** All seven WKND SQL seed files stored `status = 'LIVE'` in `content_nodes`. The `NodeStatus` Java enum contains `PUBLISHED`, not `LIVE`. Every GraphQL query that touched those nodes threw an `IllegalArgumentException` at Hibernate mapping time.

**Root cause:** The SQL was written independently from the Java enum. No validation connected them.

**Time lost:** ~30 minutes of GraphQL error diagnosis.

**Prevention rule:** SQL seed files must only use values that exist in the mapped enum. Add a database constraint (`CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED'))`) to the `content_nodes` table so the database rejects invalid values at insert time. The insert would fail immediately with a clear error instead of silently storing bad data that explodes at read time.

---

### 7. GraphQL `node()` resolver prepended `content.` to every path

**What happened:** `ContentQueryResolver.toContentPath()` always rewrote `wknd.language-masters.en` → `content.wknd.language-masters.en`. The WKND data lives at `wknd.*`, not `content.wknd.*`. Every `node()` query returned null.

**Root cause:** `toContentPath` was a general-purpose helper designed for the `page()` resolver's URL-to-path conversion. It was reused in `node()` where the path is already absolute and must not be modified.

**Time lost:** ~40 minutes.

**Prevention rule:** The `node(path)` query takes an explicit content path and must use it verbatim. The helper should never have been shared with a resolver that has different semantics. Rule: helpers that encode business assumptions (`content.` prefix = "this is a page in the CMS page tree") must not be used in generic resolvers (`node` = "any path in the entire content tree"). Split helpers when their semantics diverge.

---

### 8. No smoke test for the sample website install

**What happened:** All the above errors were invisible until someone actually ran the app. There is no test that verifies: "after running the install scripts, a GraphQL query for the home page returns a non-null result."

**Root cause:** The sample website was treated as demo content, not as a tested artifact.

**Time lost:** Accumulated across all the above items — total ~4 hours.

**Prevention rule:** Add a minimal `install-smoke-test.sh` to `sample-website/` that:
1. Runs the SQL seed files
2. Runs the backend with the local profile
3. Issues one GraphQL query: `{ node(path: "wknd.language-masters.en") { path } }`
4. Fails if the result is null

This script should run in CI in the `sample-website` job.

---

## The underlying pattern: schema drift between layers

Six of the eight failures above share a single root cause: **a contract defined in one layer was violated in another, and no test caught the gap at the boundary.**

| Boundary | Contract | What drifted |
|---|---|---|
| Java service ↔ test | every `@Autowired` field needs `@Mock` | new field added, test not updated |
| Next.js ↔ page convention | pages use default exports | named export used |
| Spring MVC ↔ path patterns | `{*...}` must be terminal | non-terminal pattern written |
| Spring Boot ↔ ES repos | all repo packages must be declared | new package added, annotation not updated |
| Java app ↔ database | enum values must match DB values | SQL used `LIVE`, enum has `PUBLISHED` |
| GraphQL resolver ↔ path semantics | `node()` takes absolute paths | resolver modified paths |

**The fix is not to be more careful — it is to make violations impossible or immediately visible:**

1. **Database constraints** enforce enum values at the DB layer.
2. **Application context smoke tests** catch missing beans and bad path patterns at startup.
3. **ESLint rules** catch page export violations before commit.
4. **Integration smoke tests** catch GraphQL resolver bugs before anyone opens a browser.

---

## Goal: environment ready in under 1 minute

For a running environment to be achievable in under 60 seconds, the following must all be true simultaneously:

### Infrastructure
- Docker Compose brings up all services (Postgres, Redis, RabbitMQ, MinIO, Elasticsearch) in a single command with health checks.
- `init-db.sql` runs automatically on first container start (already done via Docker entrypoint volume).
- Flyway migrations are idempotent and never leave the schema in a broken state.

### Backend
- `application-local.yml` exists and skips all external dependencies (Keycloak, OTLP).
- A pre-built JAR is available (or Spring Boot DevTools restarts in <10s on code change).
- The app starts cleanly in < 15 seconds after the database is healthy.

### Sample data
- Install is a single command: `./install.sh` or `.\install.ps1`.
- All SQL values conform to DB constraints so installation fails loudly if something is wrong.
- The script is idempotent (`ON CONFLICT DO NOTHING` / `INSERT ... ON CONFLICT DO UPDATE`).

### Frontend
- `pnpm install` is pre-cached; `pnpm dev` starts in < 5 seconds on a warm cache.
- No TypeScript errors block the dev server from starting.
- The first page load hits a real API that returns data (verified by smoke test).

### What to add now

| Item | Owner layer | Effort |
|---|---|---|
| DB `CHECK` constraint on `content_nodes.status` | Flyway migration | 30 min |
| Application context smoke test (`@SpringBootTest`) | flexcms-app tests | 1 hour |
| `install-smoke-test.sh` in `sample-website/` | sample-website | 1 hour |
| ESLint `no-named-export` rule for `page.tsx` | frontend tooling | 15 min |
| `application-local.yml` documented in onboarding README | docs | 15 min |
| CI job: `sample-website` — runs install + smoke test | GitHub Actions | 1 hour |

---

## Quick reference: starting the full local environment

Once all the above preventions are in place, the sequence should be:

```bash
# 1. Infrastructure (one-time or after docker restart)
cd flexcms && docker-compose up -d

# 2. Sample data (one-time or after uninstall)
cd sample-website && ./install.sh   # or .\install.ps1 on Windows

# 3. Backend — Author (port 8080) + Publish (port 8081)
JAR=flexcms/flexcms-app/target/flexcms-app-1.0.0-SNAPSHOT.jar
java -jar $JAR --spring.profiles.active=author,local &
java -jar $JAR --spring.profiles.active=publish,local &

# 4. Admin UI (port 3000)
cd frontend/apps/admin && pnpm dev &

# 5. Sample website (port 3100)
cd sample-website/frontend && pnpm dev &
```

Target: steps 3–5 complete and all health checks green within 60 seconds of the JAR being available.
