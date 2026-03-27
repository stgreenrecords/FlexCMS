# FlexCMS — QA Test Plan & Acceptance Criteria

> **Document Version:** 2.0
> **Date:** 2026-03-27
> **Audience:** QA Engineers, Test Leads
> **Scope:** Complete functional test coverage for all FlexCMS modules (CMS, DAM, PIM, Admin UI, Frontend SDKs, Infrastructure)
> **Total Test Cases:** 430+ across 42 functional modules

---

## How to Read This Document

### Test Case Table Columns

| Column | Meaning |
|--------|---------|
| **#** | Unique test case ID. Format: `MODULE-NNN` (e.g., `CMS-001`). Use this ID in bug reports and test reports. |
| **Test Case** | Short name describing the scenario under test. |
| **Precondition** | System state required BEFORE executing the test (data, services, prior steps). If blank, only the base environment is needed. |
| **Steps** | Exact actions to perform. For API tests: HTTP method, full URL, headers, and request body. For UI tests: user interactions. |
| **Expected Result** | Observable outcome that constitutes a PASS. Be specific: HTTP status codes, response fields, UI state changes. |
| **Priority** | `Critical` = blocks release; `High` = must fix before GA; `Medium` = should fix; `Low` = nice-to-have. |

### Priority Definitions

| Priority | When to Run | Blocking? |
|----------|-------------|-----------|
| **Critical** | Every build / PR merge | Yes — release blocker |
| **High** | Every sprint / nightly | Yes — GA blocker |
| **Medium** | Every release cycle | No — can ship with known issue |
| **Low** | Opportunistic | No |

### Test Data Strategy

- **Seed data** is loaded automatically by Flyway migrations (V1–V15+) and the `scripts/seed_test_data.py` seeding script.
- **Each test section lists Preconditions** describing required state. If a test creates data, subsequent tests in that section may depend on it — run them in order within a section.
- **Cleanup:** Unless stated otherwise, test data created during a test session can remain. Run `scripts/seed_test_data.py --reset` to restore the baseline.
- **Isolation:** For destructive tests (delete, bulk operations), create disposable nodes with a `qa-test-` prefix in the name so they can be identified and cleaned up.

### Recommended Tooling

| Purpose | Tool |
|---------|------|
| API testing (manual) | Postman, Insomnia, or cURL |
| API testing (automated) | REST Assured (Java), Karate, or Playwright API |
| UI testing (manual) | Chrome DevTools, browser |
| UI testing (automated) | Playwright or Cypress |
| Performance testing | Gatling (existing suite in `flexcms-app`) |
| Database inspection | pgAdmin 4 at `http://localhost:5050` |
| Message queue inspection | RabbitMQ Management at `http://localhost:15672` |
| Object storage inspection | MinIO Console at `http://localhost:9001` |

### Common Headers for API Tests

```
Content-Type: application/json
Accept: application/json
```

> **Note:** In local development mode (`flexcms.local-dev=true`), no `Authorization` header is needed. For production/JWT tests, add: `Authorization: Bearer <jwt-token>`.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Module 1: Content Management System (CMS Core)](#3-module-1-content-management-system-cms-core)
4. [Module 2: Author API — Content CRUD](#4-module-2-author-api--content-crud)
5. [Module 3: Headless Delivery API (REST)](#5-module-3-headless-delivery-api-rest)
6. [Module 4: GraphQL API](#6-module-4-graphql-api)
7. [Module 5: Workflow Engine](#7-module-5-workflow-engine)
8. [Module 6: Digital Asset Management (DAM)](#8-module-6-digital-asset-management-dam)
9. [Module 7: Product Information Management (PIM)](#9-module-7-product-information-management-pim)
10. [Module 8: Content Replication (Author → Publish)](#10-module-8-content-replication-author--publish)
11. [Module 9: Search (Elasticsearch)](#11-module-9-search-elasticsearch)
12. [Module 10: Multi-Site Management](#12-module-10-multi-site-management)
13. [Module 11: Multi-Language / i18n](#13-module-11-multi-language--i18n)
14. [Module 12: Caching (Multi-Layer)](#14-module-12-caching-multi-layer)
15. [Module 13: CDN Integration](#15-module-13-cdn-integration)
16. [Module 14: Security & Authentication](#16-module-14-security--authentication)
17. [Module 15: Admin UI — Dashboard](#17-module-15-admin-ui--dashboard)
18. [Module 16: Admin UI — Content Tree Browser](#18-module-16-admin-ui--content-tree-browser)
19. [Module 17: Admin UI — Page Editor](#19-module-17-admin-ui--page-editor)
20. [Module 18: Admin UI — DAM Browser](#20-module-18-admin-ui--dam-browser)
21. [Module 19: Admin UI — PIM Pages](#21-module-19-admin-ui--pim-pages)
22. [Module 20: Admin UI — Workflow Inbox](#22-module-20-admin-ui--workflow-inbox)
23. [Module 21: Admin UI — Site Management](#23-module-21-admin-ui--site-management)
24. [Module 22: Admin UI — Content Preview](#24-module-22-admin-ui--content-preview)
25. [Module 23: Frontend SDK & Reference Sites](#25-module-23-frontend-sdk--reference-sites)
26. [Module 24: Static Site Compilation (Build Worker)](#26-module-24-static-site-compilation-build-worker)
27. [Module 25: Experience Fragments](#27-module-25-experience-fragments)
28. [Module 26: Scheduled Publishing](#28-module-26-scheduled-publishing)
29. [Module 27: Bulk Operations](#29-module-27-bulk-operations)
30. [Module 28: Audit Trail](#30-module-28-audit-trail)
31. [Module 29: Live Copy / Content Sharing](#31-module-29-live-copy--content-sharing)
32. [Module 30: Translation Connectors](#32-module-30-translation-connectors)
33. [Module 31: Sitemap & SEO](#33-module-31-sitemap--seo)
34. [Module 32: Error Handling & Validation](#34-module-32-error-handling--validation)
35. [Module 33: Observability & Monitoring](#35-module-33-observability--monitoring)
36. [Module 34: API Documentation (OpenAPI)](#36-module-34-api-documentation-openapi)
37. [Module 35: Performance & Load Testing](#37-module-35-performance--load-testing)
38. [Module 36: Kubernetes & Deployment](#38-module-36-kubernetes--deployment)
39. [Module 37: Component Model SPI (Plugin System)](#39-module-37-component-model-spi-plugin-system)
40. [Module 38: TUT Sample Website (End-to-End)](#40-module-38-tut-sample-website-end-to-end)
41. [Module 39: Client Libraries (ClientLibs)](#41-module-39-client-libraries-clientlibs)
42. [Module 40: Node ACLs (Access Control)](#42-module-40-node-acls-access-control)
43. [Module 41: Cross-Cutting Concerns (CORS, Rate Limiting, Content-Type)](#43-module-41-cross-cutting-concerns)
44. [Module 42: Admin UI — Accessibility & Compatibility](#44-module-42-admin-ui--accessibility--compatibility)

---

## 1. Platform Overview

FlexCMS is an enterprise headless CMS with three independent pillars:

| Pillar | Description | Database |
|--------|-------------|----------|
| **Content (CMS)** | Pages, components, content tree, workflows | `flexcms_author` / `flexcms_publish` |
| **Digital Assets (DAM)** | Images, videos, documents, renditions | `flexcms_author` (metadata) + S3/MinIO (files) |
| **Products (PIM)** | Catalogs, schemas, products, variants | `flexcms_pim` (separate DB) |

**Architecture:** Author (read-write, port 8080) → RabbitMQ → Publish (read-only, port 8081) → CDN → Browser

**Key Rule:** Backend returns JSON only — it NEVER generates HTML. All rendering is done by the frontend (Next.js / Nuxt).

---

## 2. Test Environment Setup

### Prerequisites

| Component | Version | Port | Health Check |
|-----------|---------|------|-------------|
| PostgreSQL 16 | With ltree + pg_trgm extensions | 5432 | `docker exec flexcms-postgres pg_isready -U flexcms` |
| Redis 7 | — | 6379 | `docker exec flexcms-redis redis-cli ping` → `PONG` |
| RabbitMQ | With management plugin | 5672 / 15672 | `http://localhost:15672` (guest/guest) |
| MinIO (S3) | — | 9000 / 9001 | `http://localhost:9001` (minioadmin/minioadmin) |
| Elasticsearch 8.13 | — | 9200 | `http://localhost:9200` |
| Author API | Spring Boot | 8080 | `http://localhost:8080/actuator/health` |
| Publish API | Spring Boot | 8081 | `http://localhost:8081/actuator/health` |
| Admin UI | Next.js | 3000 | `http://localhost:3000` |
| Sample Site | Next.js | 3001 | `http://localhost:3001` |
| pgAdmin 4 | — | 5050 | `http://localhost:5050` |

### Starting the Environment

```bash
# From project root — start everything
flex start local all

# Verify all services are running
flex status
```

### Test Databases

| Database | Purpose |
|----------|---------|
| `flexcms_author` | Author-side content (read-write) |
| `flexcms_publish` | Publish-side content (read-only, replicated) |
| `flexcms_pim` | Product data (isolated) |

### Auth Notes

- **Local development** runs with auth bypass: `flexcms.local-dev=true` grants `ROLE_ADMIN` to all requests.
- Production mode requires JWT tokens from Keycloak/Auth0 with proper roles.

---

## 3. Module 1: Content Management System (CMS Core)

> **Preconditions for all CMS Core tests:**
> - Author API running at `http://localhost:8080` with profile `author,local`
> - PostgreSQL running with `ltree` and `pg_trgm` extensions enabled
> - Flyway migrations applied (V1–V15+)
> - Seed data loaded (at minimum, `content` root node and TUT sites exist)

### 3.1 Content Tree Structure

The content tree is a PostgreSQL-backed hierarchy using the `ltree` extension. All content is stored as nodes with dot-separated paths.

**Path Convention:**
- Database (ltree): `content.site.locale.page.component` (dot-separated)
- URLs: `/site/locale/page/component` (slash-separated)
- Conversion: `PathUtils.toContentPath("/site/en/home")` → `content.site.en.home`

**⚠ Known quirk:** `GET /api/author/content/children` accepts ltree paths directly — it does NOT call `toContentPath()` internally, so pass `content.site.en`, NOT `/site/en`. This is intentional to prevent double-prefixing (`content.content.site.en`).

#### Test Cases

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| CMS-001 | Content tree root exists | Seed data loaded | `GET http://localhost:8080/api/author/content/children?path=content` | 200 OK; JSON array of child nodes (e.g., `tut-gb`, `tut-de`, etc.) | Critical |
| CMS-002 | Node path uniqueness | Node `content.qa-test.unique` exists | `POST /api/author/content/node` with `{"parentPath":"content.qa-test","name":"unique","resourceType":"flexcms/page","userId":"admin"}` | 409 Conflict; RFC 7807 response with `title: "Conflict"` | Critical |
| CMS-003 | Parent-child relationship | Node `content.qa-test.parent` exists | `POST /api/author/content/node` with `{"parentPath":"content.qa-test.parent","name":"child","resourceType":"flexcms/page","userId":"admin"}`; then `GET /api/author/content/children?path=content.qa-test.parent` | Child node returned with `parentPath = "content.qa-test.parent"` | Critical |
| CMS-004 | Deep nesting (5+ levels) | `content.qa-test` exists | Create chain: `content.qa-test.l1.l2.l3.l4.l5` (one POST per level) | All 5 nodes created successfully; `GET /api/author/content/children?path=content.qa-test.l1.l2.l3.l4` returns `l5` | High |
| CMS-005 | Node ordering | Parent node exists with 3 children | Create 3 siblings with `orderIndex: 2, 0, 1`; then `GET /api/author/content/children?path=<parent>` | Children returned sorted as: orderIndex 0, 1, 2 | High |
| CMS-006 | JSONB properties stored | Parent node exists | `POST /api/author/content/node` with `properties: {"title": "Test", "count": 42, "tags": ["a","b"], "nested": {"key": "val"}}` | GET returns properties with types preserved: string, number, array, nested object | Critical |
| CMS-007 | Version increments on update | Node exists at version 1 | `PUT /api/author/content/node/properties` twice with different properties | `version` field increments: 1 → 2 → 3 | High |
| CMS-008 | Descendant query | Tree exists: A → B → C → D | `GET /api/author/content/children?path=A` (recursive/descendants variant) | Returns B, C, D (not A itself); order respects tree depth | High |
| CMS-009 | Ancestor query | Tree exists: A → B → C → D | Query ancestors of D | Returns C, B, A in bottom-up order | Medium |
| CMS-010a | Path double-prefix prevention | — | `GET /api/author/content/children?path=content.tut-gb.en` | Returns children correctly; path does NOT become `content.content.tut-gb.en` | Critical |
| CMS-010b | Path with special characters | Parent exists | Create node with `name: "my-page_2026"` (hyphens, underscores, numbers) | Node created; path uses sanitized name | Medium |
| CMS-010c | Path with disallowed characters | Parent exists | Create node with `name: "my page!"` (spaces, special chars) | 400 Bad Request OR name sanitized (remove spaces/special chars) | Medium |

### 3.2 NodeStatus Lifecycle

Valid statuses: `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`

> **⚠ Never use `LIVE`** — it does not exist in the `NodeStatus` enum. The correct term is `PUBLISHED`.

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| CMS-011 | Default status is DRAFT | — | `POST /api/author/content/node` without specifying status | Response body: `status = "DRAFT"` | Critical |
| CMS-012 | DRAFT → IN_REVIEW | Node in DRAFT status | `POST /api/author/content/node/status?path=<path>&status=IN_REVIEW&userId=admin` | 200 OK; status = `IN_REVIEW`; `modifiedAt` updated | Critical |
| CMS-013 | IN_REVIEW → APPROVED | Node in IN_REVIEW status | `POST /api/author/content/node/status?path=<path>&status=APPROVED&userId=admin` | 200 OK; status = `APPROVED` | Critical |
| CMS-014 | APPROVED → PUBLISHED | Node in APPROVED status | `POST /api/author/content/node/status?path=<path>&status=PUBLISHED&userId=admin` | 200 OK; status = `PUBLISHED` | Critical |
| CMS-015 | PUBLISHED → ARCHIVED | Node in PUBLISHED status | `POST /api/author/content/node/status?path=<path>&status=ARCHIVED&userId=admin` | 200 OK; status = `ARCHIVED` | High |
| CMS-016 | Invalid status "LIVE" rejected | Node exists | `POST /api/author/content/node/status?path=<path>&status=LIVE&userId=admin` | 400 Bad Request; validation error (caught at Spring/Jackson deserialization layer before reaching DB) | Critical |
| CMS-017 | Invalid status "RANDOM" rejected | Node exists | `POST /api/author/content/node/status?path=<path>&status=RANDOM&userId=admin` | 400 Bad Request | Critical |
| CMS-018 | DB CHECK constraint (defense in depth) | DBA access to DB | Direct SQL: `UPDATE content_nodes SET status='INVALID' WHERE path='content.qa-test.x'` | PostgreSQL CHECK constraint violation error (V13 migration) | Critical |
| CMS-019 | Skip status: DRAFT → PUBLISHED | Node in DRAFT status | Attempt `POST .../status?status=PUBLISHED` directly | Either: 400 (if transition rules enforced) OR 200 (if any-to-any is allowed). Document which is correct. | High |
| CMS-020 | Reverse status: ARCHIVED → DRAFT | Node in ARCHIVED status | Attempt to set status back to DRAFT | Either: 400 (if only forward transitions) OR 200. Document which is correct. | High |

### 3.3 Content Versioning

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| CMS-021 | Version snapshot on update | Node exists with `properties: {"title":"v1"}` | `PUT /api/author/content/node/properties` with `{"title":"v2"}` | New row in `content_node_versions` with `version_number`, `properties` snapshot of v1, correct `created_at` | High |
| CMS-022 | Version history retrievable | Node has been updated 5 times | `GET /api/author/content/node/versions?path=<path>` (or equivalent endpoint) | Returns 5 version records with ascending `version_number` and correct timestamps | High |
| CMS-023 | Version labels | Node exists, version 3 | Set label "v1.0-release" on version 3 | Label persisted; retrievable via version list | Medium |
| CMS-024 | Version comparison | Node has 3+ versions | Compare version 1 vs version 3 | Diff shows changed/added/removed properties between the two snapshots | Medium |
| CMS-025 | Version restore | Node at version 5, want to restore version 2 | `POST /api/author/content/node/restore` with `path` and `versionNumber=2` | Node properties reverted to version 2 snapshot; node version increments to 6 (new version created, not overwrite) | High |
| CMS-026 | Restore non-existent version | Node has 3 versions | Attempt restore to `versionNumber=99` | 404 Not Found — version does not exist | High |

### 3.4 Content Locking

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| CMS-027 | Lock a content node | Unlocked node exists | `POST /api/author/content/node/lock?path=<path>&userId=author1` | 200 OK; response shows `lockedBy = "author1"`, `lockedAt` = current timestamp | High |
| CMS-028 | Locked node rejects other edits | Node locked by `author1` | As `author2`: `PUT /api/author/content/node/properties?path=<path>&userId=author2` | 409 Conflict; response explains node is locked by `author1` | High |
| CMS-029 | Lock owner can still edit | Node locked by `author1` | As `author1`: `PUT /api/author/content/node/properties?path=<path>&userId=author1` | 200 OK; edit succeeds | High |
| CMS-030 | Unlock a content node | Node locked by `author1` | `POST /api/author/content/node/unlock?path=<path>&userId=author1` | 200 OK; `lockedBy = null`, `lockedAt = null` | High |
| CMS-031 | Non-owner cannot unlock | Node locked by `author1` | As `author2`: `POST /api/author/content/node/unlock?path=<path>&userId=author2` | 403 Forbidden or 409 Conflict | High |
| CMS-032 | Admin force-unlock | Node locked by `author1` | As `admin`: `POST /api/author/content/node/unlock?path=<path>&userId=admin&force=true` | Node unlocked successfully | Medium |
| CMS-033 | Lock + workflow interaction | Node locked by `author1` | As `author2`: attempt to start workflow on locked node | 409 Conflict — cannot start workflow on locked node, OR workflow succeeds if design allows | Medium |
| CMS-034 | Concurrent update (optimistic locking) | Two clients read node at version 5 | Client A updates (succeeds, version→6); Client B updates with stale version 5 | Client B gets 409 Conflict (optimistic lock violation via `@Version`) | High |

---

## 4. Module 2: Author API — Content CRUD

**Base URL:** `http://localhost:8080/api/author/content`

> **Preconditions:**
> - Author API running on port 8080 with `author,local` profile
> - At least one site exists (e.g., `tut-gb`) with content under `content.tut-gb.en`
> - For write tests, use a disposable parent path (e.g., `content.qa-test`) to avoid polluting seed data

### 4.1 Create Content Node

**Sample request body:**
```json
POST /api/author/content/node
Content-Type: application/json

{
  "parentPath": "content.qa-test",
  "name": "my-page",
  "resourceType": "flexcms/page",
  "properties": { "jcr:title": "My Test Page" },
  "userId": "admin"
}
```

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| AUTH-001 | Create node (happy path) | `content.qa-test` parent exists | `POST /api/author/content/node` with body above | 201 Created; response includes `id` (UUID), `path: "content.qa-test.my-page"`, `name: "my-page"`, `resourceType: "flexcms/page"`, `status: "DRAFT"`, `version: 1` | Critical |
| AUTH-002 | Create with properties | Parent exists | POST with `properties: {"jcr:title": "Test Page", "showNav": true, "order": 5}` | Properties stored as JSONB; GET returns all 3 properties with correct types | Critical |
| AUTH-003 | Create with invalid parent | — | POST with `parentPath: "content.nonexistent.path"` | 404 Not Found; RFC 7807 JSON with `detail` mentioning the missing parent path | Critical |
| AUTH-004 | Create with blank name | Parent exists | POST with `"name": ""` | 400 Bad Request; `fieldErrors` array includes `{"field": "name", "message": "must not be blank"}` | Critical |
| AUTH-005 | Create with blank resourceType | Parent exists | POST with `"resourceType": ""` | 400 Bad Request; `fieldErrors` array includes `{"field": "resourceType", "message": "must not be blank"}` | Critical |
| AUTH-006 | Create duplicate path | Node already exists at target path | POST same parentPath + name again | 409 Conflict; RFC 7807 response | High |
| AUTH-007 | Create with special characters in name | Parent exists | POST with `name: "hello world & more"` | Either 400 (if validation rejects) or name sanitized (e.g., `hello-world--more`). Verify which behavior is implemented. | Medium |
| AUTH-008 | Create with null userId | Parent exists | POST with `userId` omitted or null | 400 Bad Request (if required) or `createdBy` defaults to anonymous | Medium |

### 4.2 Read Content Node

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| AUTH-009 | Get node by path | TUT seed data loaded | `GET /api/author/content/node?path=content.tut-gb.en.home` | 200 OK; JSON with fields: `id`, `path`, `name`, `resourceType`, `properties`, `status`, `version`, `createdAt`, `modifiedAt` | Critical |
| AUTH-010 | Get non-existent node | — | `GET /api/author/content/node?path=content.does.not.exist` | 404 Not Found; `Content-Type: application/problem+json`; response includes `title`, `status: 404`, `detail` | Critical |
| AUTH-011 | List children | TUT seed data loaded | `GET /api/author/content/children?path=content.tut-gb.en` | 200 OK; returns array of direct children only (pages, not grandchildren); verify each child has `parentPath: "content.tut-gb.en"` | Critical |
| AUTH-012 | List children of leaf node | A leaf node exists (no children) | `GET /api/author/content/children?path=<leaf-path>` | 200 OK; returns empty JSON array `[]` (not 404) | High |
| AUTH-013 | Children pagination | Parent with 25+ children | `GET /api/author/content/children?path=<parent>&page=0&size=10` | Returns exactly 10 items; response includes pagination metadata: `totalElements`, `totalPages`, `page: 0`, `size: 10` | High |
| AUTH-014 | Children pagination — last page | Parent with 25 children | `GET /api/author/content/children?path=<parent>&page=2&size=10` | Returns 5 items; `hasNextPage: false` | High |
| AUTH-015 | Children pagination — out of bounds | Parent with 5 children | `GET /api/author/content/children?path=<parent>&page=99&size=10` | Returns empty list; `totalElements: 5`, `page: 99` | Medium |
| AUTH-016 | List all nodes (admin) | Seed data loaded | `GET /api/author/content/list?site=tut-gb&locale=en&page=0&size=20` | Paginated list of content nodes for that site/locale | High |

### 4.3 Update Content Node

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| AUTH-017 | Update properties | Node exists at known path | `PUT /api/author/content/node/properties` with `{"path":"<path>","properties":{"jcr:title":"Updated Title"},"userId":"admin"}` | 200 OK; properties updated; `version` incremented; `modifiedAt` updated; `modifiedBy: "admin"` | Critical |
| AUTH-018 | Partial property update | Node has `{"title":"A","desc":"B"}` | PUT with `properties: {"title":"A2"}` | `title` updated to `A2`; `desc` preserved as `B` (merge, not replace) | Critical |
| AUTH-019 | Update non-existent node | — | PUT with `path: "content.does.not.exist"` | 404 Not Found | Critical |
| AUTH-020 | Update status | Node in DRAFT | `POST /api/author/content/node/status?path=<path>&status=PUBLISHED&userId=admin` | Status changed to `PUBLISHED`; `modifiedAt` updated | Critical |
| AUTH-021 | XSS sanitization | Node exists | PUT with `properties: {"text": "<script>alert('xss')</script><p>Safe</p>"}` | Script tags removed/escaped; `<p>Safe</p>` preserved | Critical |

### 4.4 Delete Content Node

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| AUTH-022 | Delete leaf node | Disposable leaf node `content.qa-test.to-delete` exists | `DELETE /api/author/content/node?path=content.qa-test.to-delete&userId=admin` | 200 OK (or 204 No Content); node no longer exists; subsequent GET returns 404 | Critical |
| AUTH-023 | Delete subtree | Parent `content.qa-test.parent` has children `child-a`, `child-b` | `DELETE /api/author/content/node?path=content.qa-test.parent&userId=admin` | Parent AND all descendants deleted; none exist in DB | Critical |
| AUTH-024 | Delete non-existent node | — | `DELETE /api/author/content/node?path=content.nonexistent&userId=admin` | 404 Not Found | High |
| AUTH-025 | Delete locked node | Node locked by `author1` | As `author2`: attempt delete | 409 Conflict — cannot delete locked node | High |

### 4.5 Move Content Node

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| AUTH-026 | Move node to new parent | Node `content.qa-test.a.b` exists; target `content.qa-test.c` exists | `POST /api/author/content/node/move` with `{"sourcePath":"content.qa-test.a.b","targetParentPath":"content.qa-test.c","userId":"admin"}` | New path is `content.qa-test.c.b`; old path returns 404 | High |
| AUTH-027 | Move to invalid parent | Node exists | POST with `targetParentPath: "content.nonexistent"` | 404 Not Found — target parent doesn't exist | High |
| AUTH-028 | Move with children | Parent node has 2 children | Move parent to new location | Parent + all descendants get updated paths | High |
| AUTH-029 | Move to same location | Node already under target parent | Attempt move to current parent | 400 Bad Request or 200 (no-op). Document expected behavior. | Medium |

### 4.6 Copy Content Node

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| AUTH-030 | Copy node (shallow) | Source node exists | `POST /api/author/content/node/copy` with source path and target parent | New node created under target with same properties; new UUID; status reset to DRAFT | Medium |
| AUTH-031 | Copy subtree (deep) | Source node has children | Copy with `deep: true` | Source + all descendants duplicated under target | Medium |

> **⚠ Note:** If copy/duplicate endpoint is not yet implemented, mark these tests as BLOCKED and file a feature request.

---

## 5. Module 3: Headless Delivery API (REST)

**Base URL:** `http://localhost:8080/api/content/v1`

> **Preconditions:**
> - Author API running on port 8080
> - TUT seed data loaded (sites, pages, components, DAM assets)
> - At least some pages in `PUBLISHED` status
> - For search tests: Elasticsearch running and indexed

### 5.1 Page Resolution

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| HEAD-001 | Get page by path | TUT home page published | `GET /api/content/v1/pages/content/tut-gb/en/home` | 200 OK; `Content-Type: application/json`; response includes `page` object (path, title, locale) and `components` array | Critical |
| HEAD-002 | Page with nested components | Home page has container → child components | Verify `components` array in HEAD-001 response | Container components have `children` array; child components nested correctly with their own `data` objects | Critical |
| HEAD-003 | Page not found | — | `GET /api/content/v1/pages/content/tut-gb/en/nonexistent` | 404; `Content-Type: application/problem+json`; RFC 7807 body with `status: 404`, `title: "Not Found"`, `detail` contains the path | Critical |
| HEAD-004 | Page children | Home page has sub-pages | `GET /api/content/v1/pages/content/tut-gb/en/home/children` | Returns child pages only (not components); each item has `path`, `title` | High |
| HEAD-005 | Component data resolution | Page has ComponentModel-backed component (e.g., `tut/product-teaser`) | Check `data` field in the component response | `data` field is populated by the ComponentModel (enriched data), not raw JSONB properties | High |
| HEAD-006 | Response Content-Type header | — | Any successful GET to `/api/content/v1/**` | Response header `Content-Type: application/json` (never `text/html`) | Critical |
| HEAD-007 | HATEOAS `_links` in page response | Page exists with alternate locales | `GET /api/content/v1/pages/content/tut-gb/en/home` | Response includes `_links` object with `self`, `children`, and `alternateLanguages` (links to FR/DE versions) | High |
| HEAD-008 | SEO metadata in response | Page has properties with `jcr:title`, `jcr:description` | Verify page response | `page` object includes SEO-relevant fields: `title`, `description`; if SEO object exists: `seo.canonicalUrl`, `seo.ogImage` | High |

### 5.2 Node API

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| HEAD-009 | Get raw node | Node exists | `GET /api/content/v1/nodes/{path}` (where `{path}` uses `/` separators) | Raw content node with `properties` JSONB, `resourceType`, `status` | High |
| HEAD-010 | Get node descendants | Node with children exists | `GET /api/content/v1/nodes/{path}/descendants` | Full subtree returned as flat list or nested tree | High |

### 5.3 Component Registry

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| HEAD-011 | Get component registry | V6 + V14 migrations applied | `GET /api/content/v1/component-registry` | 200 OK; JSON array of all registered component types; each has `resourceType`, `title`, `dataSchema` | Critical |
| HEAD-012 | Registry includes TUT components | V14 migration applied | Check response from HEAD-011 | All 18 `tut/*` resource types present (hero-banner, text-image, card-grid, card, product-teaser, product-specs, gallery, cta-banner, accordion, accordion-item, video-embed, navigation, breadcrumb, footer-links, language-selector, stat-counter, testimonial, model-comparison) | High |
| HEAD-013 | DataSchema is valid JSON Schema | — | Parse each component's `dataSchema` from HEAD-011 | Each is valid JSON Schema: has `type: "object"`, `properties` with field definitions | High |
| HEAD-014 | Core components present | V6 migration applied | Check HEAD-011 response | Must include: `flexcms/page`, `flexcms/container`, `flexcms/rich-text`, `flexcms/image`, `flexcms/shared-header`, `flexcms/shared-footer`, `flexcms/site-root` | Critical |

### 5.4 Navigation API

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| HEAD-015 | Get site navigation | TUT GB site with published pages | `GET /api/content/v1/navigation/tut-gb/en` | 200 OK; navigation tree with `title` and `url` for each item; top-level items match main pages (Home, Models, etc.) | High |
| HEAD-016 | Navigation depth control | TUT site has nested pages | `GET /api/content/v1/navigation/tut-gb/en?depth=1` vs `?depth=3` | `depth=1` returns only top-level items; `depth=3` includes children and grandchildren | High |

### 5.5 Search API

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| HEAD-017 | Full-text search | Elasticsearch running + pages indexed | `GET /api/content/v1/search?q=innovation` | 200 OK; `items` array with matching nodes; each has `path`, `title`, `excerpt` | High |
| HEAD-018 | Search with site filter | Multiple sites indexed | `GET /api/content/v1/search?q=home&site=tut-gb` | Results filtered to `tut-gb` site only; no results from `tut-de` or `tut-fr` | High |
| HEAD-019 | Search empty results | — | `GET /api/content/v1/search?q=xyznonexistentterm123` | 200 OK; `items: []`, `totalCount: 0` (NOT a 404 error) | High |

### 5.6 Pagination

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| HEAD-020 | Default pagination | Endpoint with no page/size params | `GET /api/content/v1/search?q=tut` (no page/size) | Default `size=20` applied; response includes pagination metadata | High |
| HEAD-021 | Custom page size | — | Request with `size=5` | Returns at most 5 items | High |
| HEAD-022 | Max page size enforced | — | Request with `size=500` | Clamped to max (e.g., 100); response shows `size: 100` | High |
| HEAD-023 | Pagination metadata | — | Any paginated response | Contains `totalElements` (or `totalCount`), `totalPages`, `page`, `size`, `hasNextPage` | Critical |
| HEAD-024 | Negative page number | — | `GET /api/content/v1/search?q=tut&page=-1` | 400 Bad Request OR treated as page 0 | Medium |
| HEAD-025 | Zero page size | — | `GET /api/content/v1/search?q=tut&size=0` | 400 Bad Request OR treated as default size | Medium |

---

## 6. Module 4: GraphQL API

**Endpoint:** `POST http://localhost:8080/graphql`
**Playground:** `http://localhost:8080/graphiql`

> **Preconditions:**
> - Author API running on port 8080
> - TUT seed data loaded and pages in PUBLISHED status
> - For PIM queries: PIM products seeded in `flexcms_pim` DB
> - For search queries: Elasticsearch running and indexed

> **Key semantic difference:**
> - `page(path)` — uses `toContentPath()` which **adds** `content.` prefix. Pass URL-style paths like `"/tut-gb/en/home"`.
> - `node(path)` — uses path **verbatim** (no prefix added). Pass ltree paths like `"content.tut-gb.en.home"`.

### 6.1 Content Queries

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| GQL-001 | `page(path)` query | TUT home page published | `POST /graphql` with body: `{"query":"{ page(path: \\"/tut-gb/en/home\\") { title components { name resourceType data } } }"}` | 200 OK; `data.page.title` is set; `components` array contains page components with `resourceType` and `data` | Critical |
| GQL-002 | `page()` adds content prefix | — | Query: `{ page(path: "/tut-gb/en/home") { path } }` | Returned `path` starts with `content.tut-gb.en.home` — confirms `toContentPath()` was applied internally | Critical |
| GQL-003 | `node(path)` query | TUT home page exists | Query: `{ node(path: "content.tut-gb.en.home") { path properties } }` | 200 OK; returns raw node with `path: "content.tut-gb.en.home"` and JSONB `properties` | Critical |
| GQL-004 | `node()` does NOT add prefix | — | Query: `{ node(path: "content.tut-gb.en.home") { path } }` vs `{ node(path: "tut-gb.en.home") { path } }` | First query succeeds; second returns null (because `tut-gb.en.home` doesn't exist without `content.` prefix) | Critical |
| GQL-005 | `pages(site, locale)` query | Multiple pages published | Query: `{ pages(site: "tut-gb", locale: "en") { items { title path } totalCount } }` | `totalCount` > 0; `items` array with page data | High |
| GQL-006 | `search(query)` | Elasticsearch running | Query: `{ search(query: "innovation") { items { path title excerpt } totalCount } }` | Returns search results; `excerpt` contains highlighted text | High |
| GQL-007 | `navigation(site, locale, depth)` | TUT site with pages | Query: `{ navigation(site: "tut-gb", locale: "en", depth: 2) { title url children { title url } } }` | Navigation tree with top-level items and one level of children | High |
| GQL-008 | `asset(id)` | DAM assets uploaded | Query: `{ asset(id: "<asset-uuid>") { path title mimeType renditions { renditionKey url } } }` | Returns asset with rendition URLs | Medium |
| GQL-009 | Nested component children | Page with container → children | Query page with `components { name children { name resourceType data } }` | `children` field resolves recursively for container components | High |
| GQL-010 | GraphiQL playground accessible | — | Navigate browser to `http://localhost:8080/graphiql` | Interactive GraphiQL UI loads; can type and execute queries | High |
| GQL-011 | Non-existent page returns null | — | Query: `{ page(path: "/nonexistent/path") { title } }` | `data.page` is `null`; no errors array (null is valid for nullable types) | High |
| GQL-012 | Malformed query syntax | — | `POST /graphql` with `{"query":"{ page( }"}` | 200 OK (GraphQL HTTP standard); response has `errors` array with syntax error message; no `data` | High |
| GQL-013 | Missing required argument | — | Query: `{ page { title } }` (missing required `path` arg) | Response has `errors` array with validation error | High |

### 6.2 PIM GraphQL Queries

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| GQL-014 | `product(sku)` query | TUT products seeded | Query: `{ product(sku: "TUT-SOVEREIGN-2026") { sku name attributes } }` | Returns product with resolved (merged) attributes including `horsepower`, `engineType`, etc. | High |
| GQL-015 | `products(catalogId)` query | TUT catalog exists | Query: `{ products(catalogId: "<catalog-uuid>") { items { sku name } totalCount } }` | Paginated product list; `totalCount` matches expected count (4 for TUT) | High |
| GQL-016 | `catalogs` query | TUT catalog seeded | Query: `{ catalogs { id name year status } }` | Returns catalogs including "TUT 2026 Model Lineup" with `status: "ACTIVE"` | High |
| GQL-017 | `searchProducts(query)` | Elasticsearch running, products indexed | Query: `{ searchProducts(query: "electric") { items { sku name } } }` | Returns matching products (e.g., Eclipse if it has "electric" in name/attributes) | Medium |
| GQL-018 | No duplicate Query.product mapping | — | Start application; query `{ product(sku: "TUT-SOVEREIGN-2026") { sku } }` | No startup error about duplicate `Query.product` mapping; query returns data | Critical |

---

## 7. Module 5: Workflow Engine

**Base URL:** `http://localhost:8080/api/author/workflow`

> **Preconditions:**
> - Author API running with `author,local` profile
> - Workflow definition `standard-publish` exists (seeded by V6 migration)
> - At least one content node in DRAFT status for testing

### 7.1 Standard Publish Workflow

Flow: `DRAFT → Submit → IN_REVIEW → Approve → APPROVED → Publish → PUBLISHED`

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| WF-001 | Start workflow | Node in DRAFT status | `POST /api/author/workflow/start` with `{"contentPath":"content.qa-test.wf-node","workflowName":"standard-publish","userId":"admin"}` | 201 Created; workflow instance with `status: "ACTIVE"`, `currentStepId` = first step | Critical |
| WF-002 | Submit for review | Active workflow at draft step | `POST /api/author/workflow/advance` with `{"workflowId":"<uuid>","action":"submit","userId":"admin"}` | Step advances to review step; content node status → `IN_REVIEW` | Critical |
| WF-003 | Approve content | Workflow at review step | `POST /api/author/workflow/advance` with `action: "approve"` | Step advances to approved; content status → `APPROVED` | Critical |
| WF-004 | Reject content | Workflow at review step | `POST /api/author/workflow/advance` with `action: "reject"` | Step returns to draft; content status → `DRAFT`; `lastComment` preserved | Critical |
| WF-005 | Publish (final step) | Workflow at approved step | `POST /api/author/workflow/advance` with `action: "publish"` | Workflow `status: "COMPLETED"`; content status → `PUBLISHED`; `ReplicationEvent` sent to RabbitMQ | Critical |
| WF-006 | Invalid action | Workflow at review step | `POST /api/author/workflow/advance` with `action: "invalid_action"` | 400 Bad Request; error explains valid actions for current step | High |
| WF-007 | Workflow with comment | Any active step | `POST /api/author/workflow/advance` with `comment: "Reviewed and approved"` | `lastComment: "Reviewed and approved"` stored on workflow instance | High |
| WF-008 | Cancel workflow | Active workflow | `POST /api/author/workflow/cancel` with workflow ID | Workflow `status: "CANCELLED"`; content status → `DRAFT` | High |
| WF-009 | Get active workflow | Active workflow on a node | `GET /api/author/workflow/active?contentPath=content.qa-test.wf-node` | Returns the active workflow instance with current step and history | High |
| WF-010 | Publish triggers replication | Workflow completed (published) | Check RabbitMQ management console (`http://localhost:15672`) | `ReplicationEvent` message visible in `flexcms.replication` exchange | Critical |
| WF-011 | Start duplicate workflow | Node already has active workflow | `POST /api/author/workflow/start` for same `contentPath` | 409 Conflict — cannot start a second workflow on the same node while one is active | High |
| WF-012 | Workflow on non-existent node | — | Start workflow with `contentPath: "content.nonexistent"` | 404 Not Found — content node does not exist | High |

### 7.2 Workflow Listing

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| WF-011 | List by status | `GET /api/author/workflow/list?status=ACTIVE` | Returns paginated list of active workflows | High |
| WF-012 | List for user | `GET /api/author/workflow/for-user?userId=admin` | Returns workflows involving the user | High |
| WF-013 | Pagination on workflow list | Request with page + size params | Paginated response with metadata | High |

---

## 8. Module 6: Digital Asset Management (DAM)

**Base URL:** `http://localhost:8080/api/author/assets`

> **Preconditions:**
> - Author API running with `author,local` profile
> - MinIO running at `http://localhost:9000` (console at `http://localhost:9001`)
> - For rendition tests: image processing libraries available on classpath

### 8.1 Asset Upload

**Sample upload request:**
```
POST /api/author/assets
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="test-image.jpg"
Content-Type: image/jpeg
<binary data>
--boundary
Content-Disposition: form-data; name="path"
/dam/qa-test/images/test-image.jpg
--boundary
Content-Disposition: form-data; name="siteId"
tut-gb
--boundary
Content-Disposition: form-data; name="userId"
admin
--boundary--
```

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| DAM-001 | Upload JPEG image | MinIO running | `POST /api/author/assets` with multipart form: JPEG file, path, siteId, userId | 201 Created; asset metadata in DB; file stored in MinIO; `mimeType: "image/jpeg"`; `width` and `height` populated | Critical |
| DAM-002 | Upload PNG image | MinIO running | Upload PNG file | `mimeType: "image/png"`; dimensions extracted correctly | Critical |
| DAM-003 | Upload PDF document | MinIO running | Upload PDF file | `mimeType: "application/pdf"`; no width/height (non-image) | High |
| DAM-004 | Upload with metadata | MinIO running | Include title, tags, siteId in request | Metadata stored in `assets` table; queryable via list/search | High |
| DAM-005 | Upload large file | MinIO running | Upload file near 100MB limit | Succeeds without timeout or OOM error | Medium |
| DAM-006 | Duplicate path rejected | Asset already at target path | Upload to existing asset path | 409 Conflict (or overwrite if configured) | High |
| DAM-007 | Zero-byte file rejected | — | Upload a 0-byte file | 400 Bad Request — empty file not allowed | High |
| DAM-008 | Unsupported file type | — | Upload `.exe` or `.bat` file | 400 Bad Request — disallowed MIME type (if whitelist enforced), or upload succeeds but flagged | Medium |
| DAM-009 | Filename with path traversal | — | Upload file with name `../../../etc/passwd.jpg` | Filename sanitized; no directory traversal; stored safely | High |

### 8.2 Auto-Generated Renditions

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| DAM-007 | Thumbnail generated | Upload image; check renditions | `thumbnail` rendition exists (150×150 or 200×200) | Critical |
| DAM-008 | Web renditions generated | Upload image | `web-small` (480px), `web-medium` (960px), `web-large` (1440px) renditions exist | High |
| DAM-009 | Hero renditions generated | Upload image | `hero-desktop` (1920px), `hero-mobile` (768px) renditions exist | High |
| DAM-010 | Rendition format is WebP | Check rendition MIME type | WebP format (or configured format) | Medium |
| DAM-011 | Non-image skips renditions | Upload PDF | No image renditions generated (or PDF thumbnail only) | Medium |

### 8.3 Asset Operations

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| DAM-012 | List assets in folder | `GET /api/author/assets?folder=/dam/tut/shared` | Returns assets in folder with metadata | Critical |
| DAM-013 | Get asset metadata | `GET /api/author/assets/metadata?path=/dam/tut/shared/brand/tut-logo.png` | Returns full metadata including dimensions, MIME type | High |
| DAM-014 | Get asset content (binary) | `GET /api/author/assets/{id}/content` | Returns binary file with correct Content-Type header | Critical |
| DAM-015 | Delete asset | `DELETE /api/author/assets?path=...&userId=admin` | Asset removed; S3 object deleted; renditions removed | High |
| DAM-016 | Search assets by tag | Search with tag filter | Returns only assets matching the tag | Medium |
| DAM-017 | Filter assets by MIME type | Filter for `image/*` | Returns only image assets | Medium |

### 8.4 Asset References

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| DAM-018 | Asset reference tracking | Content node references `/dam/site/image.jpg` | `asset_references` row created linking asset → node | Medium |
| DAM-019 | Usage references retrievable | Query an asset's references | Returns list of content nodes that reference this asset | Medium |

---

## 9. Module 7: Product Information Management (PIM)

**Base URL:** `http://localhost:8080/api/pim/v1`
**Database:** `flexcms_pim` (separate from CMS)

### 9.1 Product Schemas

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-001 | Create schema | `POST /api/pim/v1/schemas` with name, version, attributeSchema | Schema created with valid JSON Schema | Critical |
| PIM-002 | Get schema | `GET /api/pim/v1/schemas/{id}` | Returns schema with resolved inheritance | Critical |
| PIM-003 | List schemas (paginated) | `GET /api/pim/v1/schemas?page=0&size=10` | Paginated list; max 100 enforced | High |
| PIM-004 | Update schema | `PUT /api/pim/v1/schemas/{id}` | Schema updated; version preserved | High |
| PIM-005 | Schema version inheritance | Create schema v2 inheriting from v1 | v2 inherits parent attributes + adds new ones | High |
| PIM-006 | Schema validation on product create | Create product violating schema constraints | Validation error returned | Critical |

### 9.2 Catalogs

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-007 | Create catalog | `POST /api/pim/v1/catalogs` with name, year, season | Catalog created; status=DRAFT or ACTIVE | Critical |
| PIM-008 | List catalogs (paginated) | `GET /api/pim/v1/catalogs?page=0&size=10` | Paginated list with totals | High |
| PIM-009 | Get catalog | `GET /api/pim/v1/catalogs/{id}` | Catalog with product count | High |
| PIM-010 | Update catalog | `PUT /api/pim/v1/catalogs/{id}` | Catalog updated | High |
| PIM-011 | Catalog status lifecycle | Change status: DRAFT → ACTIVE → ARCHIVED | Status transitions work correctly | High |

### 9.3 Products

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-012 | Create product | `POST /api/pim/v1/products` with sku, name, catalogId, schemaId, attributes | Product created; attributes stored as JSONB | Critical |
| PIM-013 | Get product by SKU | `GET /api/pim/v1/products/{sku}` | Product returned with resolved attributes (merged if carryforward) | Critical |
| PIM-014 | Product SKU uniqueness | Create two products with same SKU | 409 Conflict | Critical |
| PIM-015 | List products (paginated) | `GET /api/pim/v1/products?page=0&size=10` | Paginated list with totals | High |
| PIM-016 | Filter by catalog | `GET /api/pim/v1/products?catalogId={uuid}` | Returns only products in that catalog | High |
| PIM-017 | Filter by status | `GET /api/pim/v1/products?status=PUBLISHED` | Returns only PUBLISHED products | High |
| PIM-018 | Update product | `PUT /api/pim/v1/products/{sku}` | Attributes updated; overridden fields tracked | High |
| PIM-019 | Delete (archive) product | `DELETE /api/pim/v1/products/{sku}` | Product archived (status → ARCHIVED) | High |
| PIM-020 | Product version history | `GET /api/pim/v1/products/{sku}/history` | Returns version history with diffs | Medium |

### 9.4 Product Variants

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-021 | Add variant | `POST /api/pim/v1/products/{sku}/variants` | Variant created with variantSku, attributes | High |
| PIM-022 | List variants | `GET /api/pim/v1/products/{sku}/variants` | Returns all variants for product | High |
| PIM-023 | Variant with pricing | Create variant with `pricing: {"GBP": 250000}` | Pricing stored as JSONB | Medium |
| PIM-024 | Variant with inventory | Create variant with `inventory: {"stock": 50}` | Inventory stored as JSONB | Medium |

### 9.5 Year-over-Year Carryforward

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-025 | Carryforward catalog | `POST /api/pim/v1/catalogs/{id}/carryforward` | New catalog created with cloned products | High |
| PIM-026 | Inherited attributes | Query carryforward product without overrides | Source product attributes merged into response | High |
| PIM-027 | Overridden fields tracked | Update one attribute on carryforward product | `overriddenFields` array contains that attribute name | High |
| PIM-028 | Only delta stored | Carryforward product with 1 override | Only 1 attribute stored locally; rest inherited | High |

### 9.6 Product Import

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-029 | CSV import | `POST /api/pim/v1/import` with CSV file | Products created from CSV rows | High |
| PIM-030 | Excel import | Import from XLSX file | Products created from Excel rows | High |
| PIM-031 | JSON import | Import from JSON array | Products created from JSON objects | High |
| PIM-032 | Import with field mapping | Provide mapping profile (sourceField → attribute) | Fields mapped correctly | Medium |
| PIM-033 | Import error tracking | Import with some invalid rows | ImportJob shows total/success/error counts | High |
| PIM-034 | Import idempotency | Import same CSV twice | Existing products updated (upsert by SKU), not duplicated | High |
| PIM-035 | Get import job status | `GET /api/pim/v1/import/jobs/{id}` | Returns job status with progress | High |

### 9.7 PIM ↔ DAM Integration

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-036 | Link asset to product | `POST /api/pim/v1/products/{sku}/assets` with assetPath + role | `ProductAssetRef` created | High |
| PIM-037 | List product assets | `GET /api/pim/v1/products/{sku}/assets` | Returns linked assets with roles (hero, gallery, etc.) | High |
| PIM-038 | Unlink asset | Delete asset reference | Reference removed; asset itself unchanged | High |
| PIM-039 | Product asset roles | Link same product with hero, gallery, thumbnail roles | Each role stored correctly | Medium |

### 9.8 PIM ↔ CMS Integration

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-040 | ProductTeaserModel enrichment | Create page with `tut/product-teaser` component referencing SKU | Headless API returns enriched product data (name, attributes, hero image) | Critical |
| PIM-041 | ProductSpecsModel enrichment | Create page with `tut/product-specs` component | Headless API returns full spec table derived from PIM | High |
| PIM-042 | ModelComparisonModel enrichment | Create page with `tut/model-comparison` referencing 3 SKUs | Comparison grid data resolved from PIM | High |
| PIM-043 | Missing SKU graceful fallback | Reference non-existent SKU in component | `isProductFound()` = false; no crash; empty/fallback data | Critical |

### 9.9 PIM Search (Elasticsearch)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PIM-044 | Search products by name | `GET /api/pim/v1/products/search?q=Sovereign` | Returns matching products | High |
| PIM-045 | Search is case-insensitive | Search for "sovereign" (lowercase) | Still matches "TUT Sovereign" | High |
| PIM-046 | Search by SKU | Search for "TUT-ECLIPSE" | Returns Eclipse product | Medium |
| PIM-047 | Search empty result | Search for "nonexistent" | Returns empty list, not error | High |

---

## 10. Module 8: Content Replication (Author → Publish)

> **Preconditions:**
> - Both Author (port 8080) and Publish (port 8081) APIs running
> - RabbitMQ running at `http://localhost:15672` (verify via management console)
> - PostgreSQL has both `flexcms_author` and `flexcms_publish` databases
> - At least one content node in APPROVED status (ready to publish)

### 10.1 Replication Flow

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| REP-001 | Publish triggers replication event | Node in APPROVED status | Publish node via workflow (`action: "publish"`) or status API | 1. `ReplicationEvent` message appears in RabbitMQ `flexcms.replication` exchange (verify via management console → Queues) | Critical |
| REP-002 | Publish side receives content | REP-001 completed | Wait 2–5 seconds for async processing; then `GET http://localhost:8081/api/content/v1/pages/content/tut-gb/en/home` | 200 OK; published content returned from Publish instance | Critical |
| REP-003 | Content matches on both sides | Page published to Publish side | Compare Author GET vs Publish GET for same path | Content (title, properties, components) matches between Author and Publish | Critical |
| REP-004 | Tree replication | Page with children, all APPROVED | Publish parent with tree activation | All descendants appear on Publish side | High |
| REP-005 | Deactivation | Published page visible on Publish | Deactivate (unpublish) the page on Author side | Page returns 404 on Publish API; page still exists on Author (status → ARCHIVED or DRAFT) | High |
| REP-006 | Replication log entry | Any replication action | Query `replication_log` table in Author DB | Entry with `event_id`, `action` (ACTIVATE/DEACTIVATE), `status` (COMPLETED), `content_path`, `initiated_by`, timestamps | High |
| REP-007 | Replication retry on failure | — | Simulate publish-side failure (e.g., stop Publish DB temporarily, then restart) | Retry mechanism kicks in; `retry_count` increments in replication_log; content eventually appears after recovery | Medium |
| REP-008 | Replication idempotency | — | Replay same replication event (send duplicate message to RabbitMQ) | No duplicate content on Publish side; operation is idempotent | Medium |

### 10.2 Cache Invalidation on Replication

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| REP-008 | Redis cache cleared | Publish page that was cached in Redis | Cached entry invalidated; next request fetches fresh data | High |
| REP-009 | CDN purge triggered | Publish content | CDN purge API called for affected URLs (via `CdnPurgeService`) | High |
| REP-010 | Search index updated | Publish page | Elasticsearch index updated; page searchable on publish | High |

---

## 11. Module 9: Search (Elasticsearch)

### 11.1 Content Indexing

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| ES-001 | Index on publish | Publish a content node | Document appears in Elasticsearch index | Critical |
| ES-002 | Remove on unpublish | Deactivate a node | Document removed from Elasticsearch index | High |
| ES-003 | Re-index on update | Update and re-publish a node | Index updated with new content | High |
| ES-004 | Full rebuild | Trigger `rebuildAll()` or `rebuildSite()` | All published nodes re-indexed | Medium |

### 11.2 Search Queries

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| ES-005 | Full-text search | Search for keyword in page title or content | Matching pages returned with scores | High |
| ES-006 | Site-scoped search | Search within specific site | Results filtered to that site | High |
| ES-007 | Locale-scoped search | Search within specific locale | Results filtered to that locale | High |
| ES-008 | Search with highlights | Search query | Response includes excerpt/highlighted text | Medium |

---

## 12. Module 10: Multi-Site Management

**Base URL:** `http://localhost:8080/api/admin/sites`

### 12.1 Site CRUD

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SITE-001 | Create site | `POST /api/admin/sites` with siteId, title, locales | Site created with content/dam/config roots | Critical |
| SITE-002 | Get site | `GET /api/admin/sites/{siteId}` | Returns site with all configuration | Critical |
| SITE-003 | List sites | `GET /api/admin/sites` | Returns all sites | Critical |
| SITE-004 | Update site | `PUT /api/admin/sites/{siteId}` | Site settings updated | High |
| SITE-005 | Delete site | `DELETE /api/admin/sites/{siteId}` | Site deactivated/removed | Medium |

### 12.2 Site Resolution

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SITE-006 | Resolve by domain | Request with `Host: www.tut.co.uk` | Resolves to `tut-gb` site | High |
| SITE-007 | Resolve by header | Request with `X-FlexCMS-Site: tut-gb` | Resolves to `tut-gb` site | High |
| SITE-008 | Multi-locale site | Site with `supportedLocales: ["en", "fr"]` | Both locale branches accessible | High |

### 12.3 Domain Mappings

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SITE-009 | Map domain to site | Create domain mapping `www.tut.co.uk → tut-gb` | Domain resolution works | Medium |
| SITE-010 | Multiple domains for one site | Map `tut.co.uk` and `www.tut.co.uk` to same site | Both domains resolve correctly | Medium |

---

## 13. Module 11: Multi-Language / i18n

### 13.1 Language Copy

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| I18N-001 | Create language copy | `POST /api/author/i18n/language-copy` from en → fr | French page tree created with English content (ready for translation) | High |
| I18N-002 | Language copy structure | Verify copied tree | Same page hierarchy; same components; locale field updated to target | High |
| I18N-003 | Copy preserves content | Check copied pages | Content properties copied; status set to DRAFT | High |

### 13.2 i18n Dictionary

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| I18N-004 | Get translation by key | `GET /api/i18n?key=button.submit&locale=de` | Returns German translation | High |
| I18N-005 | Set translation | `POST /api/i18n` with key, locale, value | Translation stored | High |
| I18N-006 | Fallback to default locale | Request key in unsupported locale | Falls back to site's default locale value | Medium |

### 13.3 XLIFF Export/Import

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| I18N-007 | Export XLIFF | Export content for translation | Valid XLIFF file with source text | Medium |
| I18N-008 | Import XLIFF | Import translated XLIFF file | Content nodes updated with translations | Medium |

---

## 14. Module 12: Caching (Multi-Layer)

### 14.1 Cache Layers

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| CACHE-001 | Redis cache stores page renders | Request page twice; check Redis | Second request served from Redis cache | High |
| CACHE-002 | Caffeine local cache | Request page; check in-memory cache | Hot-path data cached in Caffeine | High |
| CACHE-003 | Cache-Control headers | Check response headers on headless API | `Cache-Control: public, max-age=60, s-maxage=300` (or configured values) | High |
| CACHE-004 | Author API no-cache | Check response headers on author API | `Cache-Control: no-store, no-cache, must-revalidate` | High |
| CACHE-005 | ETag support | Check ETag header on pages | ETag present; conditional request with `If-None-Match` returns 304 | Medium |

### 14.2 Cache Invalidation

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| CACHE-006 | Invalidate on publish | Publish page → check Redis | Cache entry for that page removed/refreshed | Critical |
| CACHE-007 | Invalidate navigation cache | Change page structure | Navigation cache invalidated | High |
| CACHE-008 | Invalidate asset cache | Update/replace asset | Asset cache cleared; new version served | High |
| CACHE-009 | Site-wide invalidation | Trigger site-level cache clear | All site caches cleared | Medium |

### 14.3 Cache Warming

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| CACHE-010 | Warm on startup | Start publish with warming enabled | Configured paths pre-fetched and cached | High |
| CACHE-011 | Warm after publish | Publish a page | Page URL warmed via HTTP GET to publish | High |
| CACHE-012 | Warm header includes marker | Check warming request | `X-Cache-Warm: true` header present | Medium |

---

## 15. Module 13: CDN Integration

### 15.1 CDN Provider SPI

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| CDN-001 | Surrogate keys on response | Check headless API response headers | `Surrogate-Key` header present with node-specific keys | High |
| CDN-002 | CDN purge after publish | Publish content | `CdnPurgeService.purge()` called with affected URLs | High |
| CDN-003 | Surrogate key generation | For page at path X | Key derived from site + path | Medium |

### 15.2 CDN Providers

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| CDN-004 | CloudFront provider | Configure CloudFront provider | Purge API calls CloudFront invalidation | Medium |
| CDN-005 | Cloudflare provider | Configure Cloudflare provider | Purge API calls Cloudflare zone purge | Medium |

---

## 16. Module 14: Security & Authentication

> **Preconditions:**
> - For §16.1: Author API running with `-Dspring-boot.run.profiles=author,local`
> - For §16.2–16.3: Author API running WITHOUT `local` profile (production mode with Keycloak/Auth0 configured)
> - For §16.4: Node ACL data seeded

### 16.1 Local Development Bypass

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| SEC-001 | Local dev bypass active | App started with `profiles=author,local` | `GET http://localhost:8080/api/author/content/children?path=content` (no Authorization header) | 200 OK; data returned | Critical |
| SEC-002 | Anonymous gets ROLE_ADMIN | Local mode | Check response or Spring Security debug logs | Anonymous user has `ROLE_ADMIN` granted (enables all write operations) | Critical |
| SEC-003 | Author endpoints accessible | Local mode | `POST /api/author/content/node` with valid body, no JWT | 201 Created — write operation succeeds without auth | Critical |

### 16.2 JWT Authentication (Production)

> **Preconditions:** App running in production mode (NOT `local` profile). Keycloak or Auth0 issuer configured via `FLEXCMS_JWT_ISSUER_URI`.

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| SEC-004 | JWT validation | Valid JWT obtained from Keycloak | `GET /api/author/content/children?path=content` with `Authorization: Bearer <valid-jwt>` | 200 OK; request authenticated; user info in security context | High |
| SEC-005 | Expired JWT rejected | JWT with `exp` in the past | Same request with expired token | 401 Unauthorized; `WWW-Authenticate` header present | High |
| SEC-006 | Malformed JWT rejected | Token with invalid signature | Same request with tampered token | 401 Unauthorized | High |
| SEC-007 | Missing token on protected endpoint | Production mode (no `local` profile) | `POST /api/author/content/node` with NO Authorization header | 401 Unauthorized | High |

### 16.3 RBAC Roles

Roles: `ADMIN`, `CONTENT_AUTHOR`, `CONTENT_REVIEWER`, `CONTENT_PUBLISHER`, `VIEWER`

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| SEC-008 | ADMIN full access | JWT with `ADMIN` role | Call any endpoint (read + write) | All endpoints accessible | High |
| SEC-009 | CONTENT_AUTHOR access | JWT with `CONTENT_AUTHOR` role | Create and edit content; attempt to publish | Can create/edit; publish is denied (403 Forbidden) | High |
| SEC-010 | VIEWER read-only | JWT with `VIEWER` role | Attempt to read content; attempt to create/edit/delete | Read succeeds (200); write operations return 403 Forbidden | High |
| SEC-011 | Public headless endpoints | No auth required | `GET /api/content/v1/pages/content/tut-gb/en/home` without token | 200 OK — headless delivery is public | Critical |
| SEC-012 | Public GraphQL | No auth required | `POST /graphql` without token | 200 OK — GraphQL is publicly accessible | Critical |
| SEC-013 | Protected author endpoints | Production mode | `POST /api/author/content/node` without token | 401 Unauthorized | High |

### 16.4 Node-Level ACLs

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| SEC-014 | Set ACL on node | Node exists | `POST /api/author/acl` with `{"nodePath":"content.tut-gb.en.secret","principal":"user:editor1","permissions":["READ","WRITE"]}` | ACL created; stored in `node_acls` table | Medium |
| SEC-015 | ACL inheritance | Parent ACL with `inherit=true` | Set ACL on parent; check child node access | Child nodes inherit parent's permissions | Medium |
| SEC-016 | ACL deny overrides allow | Deny ACL on specific child node | Check child node access | Access denied on child even though parent allows | Medium |

---

## 17. Module 15: Admin UI — Dashboard

**URL:** `http://localhost:3000`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-001 | Dashboard loads | Navigate to `http://localhost:3000` | Dashboard page renders without errors | Critical |
| UI-002 | Real data displayed | Check dashboard statistics | Data fetched from Author API (not hardcoded) | Critical |
| UI-003 | Recent edits shown | Check recent activity section | Displays recently modified content nodes | High |
| UI-004 | Loading skeletons | Slow network / initial load | Skeleton placeholders shown while data loads | High |
| UI-005 | Theme toggle | Switch between light/dark theme | Theme applies via CSS custom properties; no hardcoded colors | High |
| UI-006 | Navigation sidebar | Check sidebar links | Links to Content, DAM, Sites, Workflows, PIM sections | Critical |

---

## 18. Module 16: Admin UI — Content Tree Browser

**URL:** `http://localhost:3000/content`

> **Preconditions:**
> - Admin UI running at `http://localhost:3000`
> - Author API running at `http://localhost:8080`
> - TUT seed data loaded (content tree with multiple levels and statuses)

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| UI-007 | Content tree loads | — | Navigate to `http://localhost:3000/content` | Top-level nodes fetched from `/api/author/content/children?path=content`; displayed in table/list | Critical |
| UI-008 | Folder navigation | Top-level nodes visible | Click a folder row (e.g., `tut-gb`) | Navigates into folder; children loaded lazily from API; URL updates | Critical |
| UI-009 | Breadcrumb trail | Navigate 3 levels deep (Content → tut-gb → en → home) | Check breadcrumb bar | Breadcrumb shows: `Content / tut-gb / en / home` with clickable segments | Critical |
| UI-010 | Breadcrumb click navigation | 3 levels deep | Click `tut-gb` in breadcrumb | Navigates back to tut-gb level; children of tut-gb displayed | Critical |
| UI-011 | Up one level button | Inside a subfolder | Click ↑ (up) button | Returns to parent folder; breadcrumb updates | High |
| UI-012 | Status badges | Nodes with various statuses | Check badge colors | Color-coded badges: **Published (green)**, Draft (gray), In Review (yellow), Archived (red). **Note:** The status is `PUBLISHED`, never `LIVE`. | High |
| UI-013 | Search within folder | Inside a folder with children | Type a search term in search box | Filters current folder's children by name/path; non-matching items hidden | High |
| UI-014 | Empty folder state | Navigate to an empty folder | Check display | "This folder is empty" message with appropriate icon displayed | High |
| UI-015 | Loading skeletons | Slow network or initial load | Observe during API fetch | 5 skeleton rows shown as placeholder while data loads | High |
| UI-016 | Action menu | — | Click ⋮ (three-dot menu) on a content row | Dropdown appears with options: Edit, Preview, Publish, Duplicate, Move, Delete | High |
| UI-017 | Edit action | — | Click Edit in action menu | Navigates to page editor at `/editor?path=<ltree-path>` | High |
| UI-018 | Preview action | — | Click Preview | Navigates to preview page at `/preview?path=<ltree-path>` | High |
| UI-019 | No mock data | — | Open browser DevTools → Network tab; navigate to content page | All data requests go to `/api/author/content/children`; no hardcoded/mocked data | Critical |
| UI-020 | Action menu stays open | — | Click ⋮, then slowly move mouse to a menu item | Menu stays open during mouse movement; closes only when item is clicked or user clicks outside | High |
| UI-021 | Sort by column | Table has sortable columns | Click column header (e.g., Name, Modified) | Rows re-sorted; sort indicator shown on column header | Medium |
| UI-022 | Deep link / direct URL | — | Paste `http://localhost:3000/content?path=content.tut-gb.en` directly in browser | Page loads showing children of `content.tut-gb.en`; breadcrumb shows correct path | High |

---

## 19. Module 17: Admin UI — Page Editor

**URL:** `http://localhost:3000/editor?path=...`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-021 | Editor loads with page data | Navigate with `?path=content.tut-gb.en.home` | Page components loaded from API; displayed on canvas | Critical |
| UI-022 | Component palette | Left sidebar | Shows available component types from component registry | Critical |
| UI-023 | Schema-driven property panel | Select a component on canvas | Right panel shows auto-generated form fields from dataSchema | Critical |
| UI-024 | Text field rendering | String property in schema | Renders as text input | High |
| UI-025 | Select field rendering | Enum property in schema | Renders as select dropdown with options | High |
| UI-026 | Boolean field rendering | Boolean property in schema | Renders as toggle switch | High |
| UI-027 | Number field rendering | Number property in schema | Renders as number input | High |
| UI-028 | Textarea rendering | Long text (description/body) | Renders as textarea | High |
| UI-029 | Required field markers | Required property in schema | Shows asterisk (*) or required indicator | High |
| UI-030 | Save changes | Click Save | `PUT /api/author/content/node/properties` called; success feedback | Critical |
| UI-031 | Publish from editor | Click Publish | Status changed to PUBLISHED via API | High |
| UI-032 | Drag-and-drop reorder | Drag component up/down on canvas | Order updated via dnd-kit; smooth animation | High |
| UI-033 | Add component from palette | Drag from palette to canvas | New component inserted at drop position | High |
| UI-034 | Delete component | Click delete on component | Component removed from canvas | High |
| UI-035 | Drag overlay (ghost) | While dragging | Floating preview shows the dragged component | Medium |
| UI-036 | Insert preview indicator | Drag palette item over canvas | Blue dashed line shows exact insertion point | Medium |
| UI-037 | Viewport toggle | Switch Desktop / Tablet / Mobile | Canvas width changes to match viewport | Medium |

---

## 20. Module 18: Admin UI — DAM Browser

**URL:** `http://localhost:3000/dam`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-038 | DAM page loads | Navigate to DAM | Asset grid loaded from `/api/author/assets` | Critical |
| UI-039 | Grid view thumbnails | Image assets | Thumbnails rendered from asset content endpoint | Critical |
| UI-040 | List view | Toggle to list view | DataTable with columns: Name, Type, Size, Uploaded, Status | High |
| UI-041 | Folder sidebar | Left panel | Shows folder categories: All, Images, Videos, Documents, Archives | High |
| UI-042 | Upload dialog | Click Upload button | Drag-and-drop upload zone; multi-file support | Critical |
| UI-043 | Upload to API | Drop files into upload zone | Files uploaded via `POST /api/author/assets` with FormData | Critical |
| UI-044 | Upload size limit | Display | 100MB limit shown | Medium |
| UI-045 | Search assets | Type in search box | Filters assets by name | High |
| UI-046 | Multi-select | Select multiple assets via checkboxes | Bulk action toolbar appears: Download, Move, Delete | High |
| UI-047 | Asset action menu | Click ⋮ on an asset | View Details, Download, Move, Copy URL, Delete | High |
| UI-048 | View asset details | Click View Details | Navigates to asset detail page (`/dam/{id}`) | High |
| UI-049 | Empty state | No assets uploaded | "No assets found" message with Upload CTA button | High |
| UI-050 | Loading skeletons | During initial fetch | 10 skeleton grid cells shown | High |
| UI-051 | No mock data | Inspect network | All data from `/api/author/assets` | Critical |

---

## 21. Module 19: Admin UI — PIM Pages

### 21.1 PIM Product Grid

**URL:** `http://localhost:3000/pim/{catalogId}`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-052 | Product grid loads | Navigate to PIM catalog | Products loaded from `/api/pim/v1/products` | Critical |
| UI-053 | Product cards/rows | View products | Shows product name, SKU, status, thumbnail | High |
| UI-054 | Search products | Type in search | Filters products by name/SKU | High |
| UI-055 | No mock data | Inspect network | All data from PIM API | Critical |

### 21.2 PIM Product Editor

**URL:** `http://localhost:3000/pim/{catalogId}/{productId}`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-056 | Editor loads product | Navigate to product editor | Product data fetched from API; form populated | Critical |
| UI-057 | Save draft | Click Save Draft | `PUT /api/pim/v1/products/{sku}` called with updated attributes | Critical |
| UI-058 | Publish product | Click Publish | `PUT /api/pim/v1/products/{sku}/status` with `PUBLISHED` | Critical |
| UI-059 | Variants section | Scroll to variants | Variants fetched from `GET /api/pim/v1/products/{sku}/variants` | High |
| UI-060 | Last modified info | Check editor | Shows real `updatedAt` and `updatedBy` from API | High |
| UI-061 | No mock data | Inspect network | No `setTimeout` mocks; all API-driven | Critical |

### 21.3 PIM Import Wizard

**URL:** `http://localhost:3000/pim/import`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-062 | Import wizard loads | Navigate to import page | Multi-step wizard displayed | High |
| UI-063 | Catalog selection | Step 1 | Catalogs loaded from `GET /api/pim/v1/catalogs` | Critical |
| UI-064 | File upload | Step 2 | File upload with CSV/Excel/JSON support | High |
| UI-065 | Schema inference | After upload | Calls `/api/pim/v1/imports/infer-schema` to detect columns | High |
| UI-066 | Field mapping | Step 3 | Shows detected columns; allows mapping to schema attributes | High |
| UI-067 | Execute import | Step 4 | Calls `POST /api/pim/v1/imports` with file and mapping | Critical |
| UI-068 | No mock data | Check for fake constants | No `INITIAL_MAPPINGS`, `VALIDATION_ISSUES`, `PREVIEW_ROWS` | Critical |

### 21.4 PIM Schema Editor

**URL:** `http://localhost:3000/pim/schema`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-069 | Schema list loads | Navigate to schema editor | Schemas loaded from `GET /api/pim/v1/schemas` | Critical |
| UI-070 | Schema picker | Dropdown selector | Switch between schemas | High |
| UI-071 | Attribute groups displayed | Select a schema | Groups with fields rendered | High |
| UI-072 | Drag field from palette | Drag a field type to a group | New field added to group | High |
| UI-073 | Reorder fields (drag) | Drag field within group | Field order updated via dnd-kit | High |
| UI-074 | Reorder groups (drag) | Drag group header | Group order updated | High |
| UI-075 | Field properties panel | Click a field | Right panel: Label, ID, Required, Localized, Validation | High |
| UI-076 | Save schema | Click Save FAB | `PUT /api/pim/v1/schemas/{id}` called | Critical |
| UI-077 | Create new schema | Click "New Schema" | Modal → `POST /api/pim/v1/schemas` | High |
| UI-078 | JSON preview toggle | Switch Builder ↔ JSON | Shows live JSON Schema derived from groups | Medium |
| UI-079 | Inline group rename | Double-click group name | Editable input appears; Enter/blur commits | Medium |

---

## 22. Module 20: Admin UI — Workflow Inbox

**URL:** `http://localhost:3000/workflows`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-080 | Workflow list loads | Navigate to Workflows | Active workflows fetched from API | Critical |
| UI-081 | Workflow status badges | Various workflow states | Color-coded badges (Active, Completed, Cancelled) | High |
| UI-082 | Approve action | Click Approve on a workflow | `POST /api/author/workflow/advance` with `action: "approve"` | Critical |
| UI-083 | Reject action | Click Reject | `POST /api/author/workflow/advance` with `action: "reject"` | Critical |
| UI-084 | Comment on action | Add comment before approve/reject | Comment included in API call | High |
| UI-085 | Workflow detail panel | Click a workflow row | Detail panel shows content path, current step, history | High |
| UI-086 | No mock data | Inspect network | Data from workflow API endpoints | Critical |

---

## 23. Module 21: Admin UI — Site Management

**URL:** `http://localhost:3000/sites`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-087 | Sites page loads | Navigate to Sites | Site grid/list loaded from `/api/admin/sites` | Critical |
| UI-088 | Grid view | Default view | Site cards with status badge, URL, page count, locale tags | High |
| UI-089 | List view toggle | Switch to list | Table view with sortable columns | High |
| UI-090 | Search sites | Type in search | Filters by name or URL | High |
| UI-091 | Status badges | Different site statuses | Color-coded: Published (green), Maintenance (yellow), Draft (gray) | High |
| UI-092 | Create new site | Click Create New Site | CTA button present and functional | High |
| UI-093 | Site action menu | Click ⋮ | Visit, Manage Pages, Publish All, Edit, Duplicate, Archive, Delete | High |
| UI-094 | Grid/List toggle persists | Toggle view mode | Preference maintained during session | Medium |
| UI-095 | No mock data | Inspect network | All data from sites API | Critical |

---

## 24. Module 22: Admin UI — Content Preview

**URL:** `http://localhost:3000/preview?path=...`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UI-096 | Preview loads | Navigate with path parameter | Iframe renders content from site-nextjs | Critical |
| UI-097 | Viewport toggle | Switch Desktop / Tablet / Mobile | Iframe width changes accordingly | High |
| UI-098 | URL bar | Check URL bar | Shows current preview URL | Medium |
| UI-099 | Refresh button | Click refresh | Iframe reloads | Medium |
| UI-100 | Copy URL | Click copy button | Preview URL copied to clipboard | Medium |
| UI-101 | Open in new tab | Click open button | Preview opens in new browser tab | Medium |
| UI-102 | Draft mode toggle | — | Switch Draft / Published | Draft fetches from author API (draft content); Published from publish API (published content only) | High |
| UI-103 | Draft content shown | Draft mode selected | View preview | Shows unpublished/draft content (force-dynamic, no cache) | Critical |
| UI-104 | Edit button | Click Edit | Navigates to page editor | High |
| UI-105 | Status bar | Bottom of preview | Shows loading state, status info | Medium |

---

## 25. Module 23: Frontend SDK & Reference Sites

### 25.1 @flexcms/sdk

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| SDK-001 | FlexCmsClient.getPage() | Author API running, page exists | Call `client.getPage("/tut-gb/en/home")` | Returns `PageResponse` with `page` object and `components` array | Critical |
| SDK-002 | FlexCmsClient.getNavigation() | Site with pages | Call `client.getNavigation("tut-gb", "en")` | Returns navigation tree with `title` and `url` | High |
| SDK-003 | FlexCmsClient.getComponentRegistry() | API running | Call `client.getComponentRegistry()` | Returns array of component definitions with `dataSchema` | High |
| SDK-004 | FlexCmsClient.search() | Elasticsearch running | Call `client.search("innovation")` | Returns search results with `items` and `totalCount` | High |
| SDK-005 | ComponentMapper.register() | — | Call `mapper.register("tut/hero-banner", HeroBanner)` | Component resolvable by type | Critical |
| SDK-006 | ComponentMapper.resolve() | Component registered | Call `mapper.resolve("tut/hero-banner")` | Returns the `HeroBanner` component class/function | Critical |
| SDK-007 | ComponentMapper unregistered type | — | Call `mapper.resolve("unknown/type")` | Returns `undefined` or fallback component (graceful, no crash) | High |
| SDK-008 | SDK error: API unreachable | API not running | Call `client.getPage("/any/path")` | Throws/rejects with meaningful error (connection refused); does not hang indefinitely | High |
| SDK-009 | SDK error: 404 response | — | Call `client.getPage("/nonexistent/path")` | Returns `null` or throws `PageNotFoundError` (not raw HTTP error) | High |

### 25.2 @flexcms/react (Next.js Reference Site)

**URL:** `http://localhost:3001`

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| SDK-010 | Site loads | Site-nextjs running, Author API running | Navigate to `http://localhost:3001` | Home page renders without JS errors (check browser console) | Critical |
| SDK-011 | Catch-all route | Seed data loaded | Navigate to `http://localhost:3001/models/sovereign` | Page resolved from API and rendered with correct components | Critical |
| SDK-012 | FlexCmsPage renders components | — | Check rendered HTML from SDK-010 | Components from API rendered by matching React renderers; each component type has a visual representation | Critical |
| SDK-013 | Component map coverage | — | Check component-map.tsx | Every one of 18 TUT + core types has a registered renderer (no missing mappings) | High |
| SDK-014 | Container components render children | Page has `tut/card-grid` with `tut/card` children | Check rendered output | Grid renders with child cards inside | High |
| SDK-015 | Product components fetch PIM | Page with `tut/product-teaser` | Check rendered product data | Product name, specs, images from PIM displayed correctly | High |
| SDK-016 | Image components | Components with DAM paths | Check rendered images | Images render with correct `src` URLs pointing to MinIO/S3; no broken image icons | High |
| SDK-017 | 404 page | — | Navigate to `http://localhost:3001/nonexistent/page` | 404 page or "Page Not Found" message (not crash or blank page) | High |
| SDK-018 | SSR rendering | — | `curl http://localhost:3001/` and inspect raw HTML | Full HTML with content present in source (not empty `<div id="root"></div>` client-only shell) | High |
| SDK-019 | SSR hydration match | — | Load page; check browser console | No React hydration mismatch warnings in console | Medium |

### 25.3 @flexcms/vue (Nuxt Reference Site)

**URL:** `http://localhost:3002`

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| SDK-020 | Nuxt site loads | Site-nuxt running | Navigate to `http://localhost:3002` | Page renders without errors | High |
| SDK-021 | Catch-all route | Seed data loaded | Navigate to any valid path | Content resolved via `@flexcms/vue` composables and rendered | High |
| SDK-022 | FlexCmsPage composable | — | Check rendered output | Components rendered from API data correctly | High |
| SDK-023 | 404 handling | — | Navigate to nonexistent path | 404 page displayed (not crash) | High |
| SDK-024 | SSR rendering | — | View page source | Full HTML present (not client-only shell) | High |

### 25.4 @flexcms/ui Design System

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SDK-020 | No hardcoded colors | Inspect CSS of any UI component | All colors use `var(--color-*)` tokens | Critical |
| SDK-021 | Theme switching | Toggle light ↔ dark | All components update instantly | High |
| SDK-022 | Button variants | Render default, primary, destructive | Correct styling per variant | High |
| SDK-023 | Input component | Render with label, placeholder | Accessible input with proper attributes | High |
| SDK-024 | Card component | Render with header, content, footer | Correct layout | Medium |
| SDK-025 | Skeleton component | Render during loading | Animated placeholder | Medium |
| SDK-026 | Badge component | Render with different variants | Color-coded badges | Medium |

---

## 26. Module 24: Static Site Compilation (Build Worker)

**Location:** `frontend/apps/build-worker`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SSC-001 | Event consumer connects | Start build worker | Connects to RabbitMQ; listens for replication events | High |
| SSC-002 | Page render on publish | Publish a page; trigger build | Build worker renders page to static HTML | High |
| SSC-003 | S3 upload | After render | HTML + assets uploaded to S3 static bucket | High |
| SSC-004 | Manifest updated | After build | `manifest.json` updated with page hash + build timestamp | High |
| SSC-005 | Incremental build | Publish one page | Only that page recompiled (not entire site) | High |
| SSC-006 | Dependency resolution | Shared component changed | All pages using that component recompiled | Medium |
| SSC-007 | Build concurrency | Multiple pages published simultaneously | Processed in parallel (configurable concurrency) | Medium |

---

## 27. Module 25: Experience Fragments

### 27.1 Experience Fragment CRUD

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| XF-001 | Create XF folder | Create node with `resourceType: flexcms/xf-folder` | XF folder created in content tree | High |
| XF-002 | Create XF variation | Create child with `resourceType: flexcms/xf-page` | XF variation (master) created | High |
| XF-003 | Add components to XF | Add navigation/footer components inside XF | Components stored as children of XF variation | High |
| XF-004 | Reference XF from page | Create `flexcms/experience-fragment` node with `fragmentPath` | XF reference node created | Critical |
| XF-005 | Resolve XF in delivery | Request page via headless API | XF components included in page response (inline) | Critical |

### 27.2 XF Listing

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| XF-006 | List XFs for site | `GET /api/author/xf/list?siteId=tut-gb&locale=en` | Returns all XF folders for the site+locale | High |
| XF-007 | List XFs across locales | Same site, different locales | Each locale has its own XF set | High |

---

## 28. Module 26: Scheduled Publishing

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SCHED-001 | Schedule publish date | `PUT /api/author/content/node/schedule-publish` with future date | `scheduled_publish_at` set on node | High |
| SCHED-002 | Schedule deactivation | `PUT /api/author/content/node/schedule-deactivate` | `scheduled_deactivate_at` set on node | High |
| SCHED-003 | Auto-publish at scheduled time | Wait for scheduled time to pass | Scheduler picks up node; status changes to PUBLISHED; replication triggered | Critical |
| SCHED-004 | Auto-deactivate at scheduled time | Wait for deactivation time | Node deactivated from publish | High |
| SCHED-005 | Cancel scheduled publish | Clear `scheduled_publish_at` before trigger time | Node remains in current status | High |
| SCHED-006 | Scheduler runs every minute | Check `@Scheduled(fixedDelay=60_000)` | Process runs at least once per minute | High |

---

## 29. Module 27: Bulk Operations

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| BULK-001 | Bulk publish | Call bulk publish endpoint with list of paths | All specified nodes published | High |
| BULK-002 | Bulk delete | Call bulk delete with list of paths | All specified nodes deleted (with descendants) | High |
| BULK-003 | Bulk move | Call bulk move with paths + target parent | All nodes moved to new parent; paths updated | High |
| BULK-004 | Content export (JSON/ZIP) | Export content tree as JSON | Valid JSON with full tree structure | Medium |
| BULK-005 | Content import (JSON/ZIP) | Import previously exported content | Content tree recreated correctly | Medium |
| BULK-006 | Partial failure handling | Bulk operation where some paths don't exist | Successful items processed; errors reported per item | High |

---

## 30. Module 28: Audit Trail

**Base URL:** `http://localhost:8080/api/author/audit`

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| AUD-001 | Create action logged | Create a content node | `audit_log` row with action=CREATE, entity_type=content_node | High |
| AUD-002 | Update action logged | Update node properties | Audit entry with action=UPDATE and changes diff | High |
| AUD-003 | Delete action logged | Delete a node | Audit entry with action=DELETE | High |
| AUD-004 | Publish action logged | Publish a node | Audit entry with action=PUBLISH | High |
| AUD-005 | Query audit by entity | `GET /api/author/audit?entityType=content_node&entityId={uuid}` | Returns audit entries for that entity | High |
| AUD-006 | Query audit by user | `GET /api/author/audit?userId=admin` | Returns all actions by that user | High |
| AUD-007 | Query audit by time range | Filter by timestamp range | Returns entries within range | Medium |
| AUD-008 | Changes diff captured | Update properties; check audit changes field | JSONB diff shows before/after | High |

---

## 31. Module 29: Live Copy / Content Sharing

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| LC-001 | Create live copy | Create live copy from source → target path | `live_copies` record created; target content cloned | High |
| LC-002 | Auto-sync enabled | Update source; check target with `autoSync=true` | Target updated automatically | High |
| LC-003 | Override specific properties | Override a property on target | Property added to `overridden_properties` array | High |
| LC-004 | Override survives sync | Sync after override | Overridden properties preserved; others updated from source | High |
| LC-005 | Detach live copy | Detach target from source | Target becomes independent; no more auto-sync | High |
| LC-006 | Rollout changes | Manual rollout from source to target | Target updated with latest source content | Medium |
| LC-007 | List live copies | `GET /api/author/live-copies?sourcePath=...` | Returns all targets for the source | Medium |
| LC-008 | Live copy status | Check sync status | Returns IN_SYNC, OUTDATED, or TRANSLATING | Medium |

---

## 32. Module 30: Translation Connectors

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TRANS-001 | DeepL connector configured | Set DeepL API key in config | `DeepLTranslationConnector` available | Medium |
| TRANS-002 | Machine translation | Request machine translation of a page | Content translated via DeepL API | Medium |
| TRANS-003 | Translation preserves structure | Translate page tree | Tree structure preserved; only text content translated | Medium |
| TRANS-004 | Translatable fields identified | Check which fields get translated | Only text/rich-text fields translated; paths/numbers untouched | Medium |
| TRANS-005 | Translation fallback | DeepL unavailable | Graceful error; original content unchanged | Medium |

---

## 33. Module 31: Sitemap & SEO

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SEO-001 | Sitemap.xml generated | `GET http://localhost:8081/sitemap.xml` | Valid XML sitemap with published page URLs | High |
| SEO-002 | Sitemap index | `GET http://localhost:8081/sitemap-index.xml` | Index referencing per-site sitemaps | High |
| SEO-003 | Robots.txt | `GET http://localhost:8081/robots.txt` | Valid robots.txt with Sitemap reference | High |
| SEO-004 | Only published pages in sitemap | Sitemap generation | Only PUBLISHED nodes included (not DRAFT, ARCHIVED) | High |
| SEO-005 | Sitemap pagination | Site with 1000+ pages | Sitemap split into multiple files (50K URL limit per file) | Medium |

---

## 34. Module 32: Error Handling & Validation

> **Preconditions:**
> - Author API running on port 8080
> - These tests verify that error responses conform to RFC 7807 (`application/problem+json`) format

### 34.1 Global Error Handling

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| ERR-001 | 404 RFC 7807 format | — | `GET /api/author/content/node?path=content.does.not.exist` | `Content-Type: application/problem+json`; body: `{status: 404, title: "Not Found", detail: "Content node not found: ...", instance: "/api/author/content/node"}` | Critical |
| ERR-002 | 400 validation error | — | `POST /api/author/content/node` with `{"name":"","resourceType":"","parentPath":"content","userId":"admin"}` | 400; body includes `fieldErrors` array: `[{field:"name",message:"must not be blank"}, {field:"resourceType",message:"must not be blank"}]` | Critical |
| ERR-003 | 409 conflict | Node exists at path | `POST /api/author/content/node` with same parentPath + name | 409; `title: "Conflict"`; `detail` explains the conflict | High |
| ERR-004 | 500 internal error | Simulate server error | Trigger an unhandled exception (e.g., misconfigured service) | 500; generic message `"Internal Server Error"`; **NO stack trace** in response body | Critical |
| ERR-005 | Correlation ID in errors | — | Any error response (404, 400, 409, 500) | `correlationId` field present in response body (UUID format); matches MDC log entry for tracing | High |
| ERR-006 | Error response Content-Type | — | Any error response | Response header: `Content-Type: application/problem+json` (not `text/html` or `application/json`) | High |

### 34.2 Input Validation

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| ERR-007 | @NotBlank on name | — | POST create node with `"name": ""` | 400; `fieldErrors` contains `{field: "name", message: "must not be blank"}` | Critical |
| ERR-008 | @NotBlank on resourceType | — | POST create node with `"resourceType": ""` | 400; `fieldErrors` contains `{field: "resourceType", message: "must not be blank"}` | Critical |
| ERR-009 | @NotNull on required fields | — | POST create node with `parentPath` and `userId` omitted entirely | 400; `fieldErrors` for each missing required field | Critical |
| ERR-010 | XSS in rich text | — | `PUT /api/author/content/node/properties` with `properties: {"text": "<script>alert('xss')</script><p>Safe text</p>"}` | Script tags sanitized/removed; `<p>Safe text</p>` preserved | Critical |
| ERR-011 | Valid status values only | — | `POST /api/author/content/node/status?path=<path>&status=BOGUS&userId=admin` | 400 validation error with clear message (not 500 DB constraint violation reaching the user) | High |
| ERR-012 | Null body on POST | — | `POST /api/author/content/node` with empty body (no JSON) | 400 Bad Request (not 500 NullPointerException) | High |
| ERR-013 | Malformed JSON body | — | `POST /api/author/content/node` with `Content-Type: application/json` and body `{invalid json` | 400 Bad Request with message about malformed JSON | High |

---

## 35. Module 33: Observability & Monitoring

### 35.1 Metrics

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| OBS-001 | Prometheus endpoint | `GET /actuator/prometheus` | Prometheus-format metrics returned | High |
| OBS-002 | JVM metrics | Check metrics | `jvm_memory_used_bytes`, `jvm_threads_live_threads`, `system_cpu_usage` present | High |
| OBS-003 | Custom content metrics | After content operations | `flexcms_content_node_create_seconds`, `flexcms_content_page_render_seconds` present | High |
| OBS-004 | HTTP request metrics | After API calls | `http_server_requests_seconds_count` with histogram buckets | High |
| OBS-005 | Replication metrics | After replication | `flexcms_replication_replicate_seconds` present | Medium |

### 35.2 Health Checks

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| OBS-006 | Actuator health | All services running | `GET http://localhost:8080/actuator/health` | 200 OK; `{"status": "UP"}` with component details | Critical |
| OBS-007 | DB health check | PostgreSQL running | Check `components.db` in health response | `db: {status: "UP", details: {database: "PostgreSQL"}}` | High |
| OBS-008 | Redis health check | Redis running | Check `components.redis` in health response | `redis: {status: "UP"}` | High |
| OBS-009 | Elasticsearch health check | Elasticsearch running | Check health response | Elasticsearch component status `UP` | High |
| OBS-010 | RabbitMQ health check | RabbitMQ running | Check health response | RabbitMQ component status `UP` | High |
| OBS-011 | Degraded state | Stop Redis (keep others running) | `GET /actuator/health` | Status `DOWN` or `DEGRADED`; Redis component shows `DOWN`; other components still `UP` | Medium |
| OBS-012 | Graceful shutdown | App running with active requests | Send `SIGTERM` or `POST /actuator/shutdown` (if enabled) | App drains in-flight requests; finishes them before shutting down; no 5xx errors during drain | Medium |

### 35.3 Structured Logging

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| OBS-009 | JSON log format (prod) | Run with docker/prod profile | Logs output as structured JSON | High |
| OBS-010 | Trace ID in logs | Make request with tracing enabled | `traceId` and `spanId` present in MDC | High |
| OBS-011 | Colored console (dev) | Run in dev mode | Colored human-readable log output | Medium |

---

## 36. Module 34: API Documentation (OpenAPI)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| API-001 | Swagger UI accessible | Navigate to `http://localhost:8080/swagger-ui.html` | OpenAPI UI loads with all endpoints | High |
| API-002 | Author API group | Select "Author API" group | All `/api/author/**` endpoints listed | High |
| API-003 | Headless API group | Select "Headless Delivery API" group | All `/api/content/**` endpoints listed | High |
| API-004 | PIM API group | Select "PIM API" group | All `/api/pim/**` endpoints listed | High |
| API-005 | All controllers tagged | Check API groups | 23 controllers with `@Tag` annotations | High |
| API-006 | Operation summaries | Click any endpoint | `summary` and `description` present | High |
| API-007 | Try it out | Use "Try it out" on any GET endpoint | Returns real response from running server | Medium |

---

## 37. Module 35: Performance & Load Testing

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| PERF-001 | Page render < 200ms | Request published page | Response time < 200ms (warm cache) | High |
| PERF-002 | No N+1 queries | Check SQL logs during page render | No recursive DB queries; single bulk query for descendants | Critical |
| PERF-003 | Concurrent requests | 100 concurrent page requests | No errors; response times stable | High |
| PERF-004 | Content tree with 1000+ nodes | Large content tree | Operations complete without timeout | Medium |
| PERF-005 | PIM with 10K+ products | Large product catalog | List/search operations respond within 1s | Medium |
| PERF-006 | Gatling load test | Run Gatling test suite | All scenarios pass performance thresholds | Medium |

---

## 38. Module 36: Kubernetes & Deployment

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| K8S-001 | Helm chart validates | `helm lint infra/helm/flexcms` | No errors | High |
| K8S-002 | QA values file | Render with `values-qa.yaml` | 1 author, 2–6 publish replicas | High |
| K8S-003 | Prod values file | Render with `values-prod.yaml` | 2 author, 5–20 publish replicas; HA affinity rules | High |
| K8S-004 | HPA configured | Check publish-hpa.yaml | Autoscaling on CPU/memory with scale-up/down behavior | High |
| K8S-005 | PDB configured | Check publish-pdb.yaml | Pod disruption budget prevents all pods terminating | High |
| K8S-006 | Ingress routing | Check ingress.yaml | Multi-host routing: publish, author, admin paths | High |
| K8S-007 | Secret management | Check secret.yaml | Supports both inline values and `existingSecret` refs | Medium |
| K8S-008 | Health probes | Check deployment yamls | Liveness + readiness probes configured | High |

---

## 39. Module 37: Component Model SPI (Plugin System)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| SPI-001 | @FlexCmsComponent auto-registered | Create ComponentModel with @FlexCmsComponent | Component auto-registered in ComponentRegistry at startup | High |
| SPI-002 | @ValueMapValue injection | Field annotated with @ValueMapValue | Value injected from node's JSONB properties | Critical |
| SPI-003 | @Autowired service injection | @Autowired field in ComponentModel | Spring service injected correctly | High |
| SPI-004 | Derived getters exported | Method `getComputedField()` | Return value included in component's `data` response | High |
| SPI-005 | ComponentModel exception handling | ComponentModel throws exception | Graceful fallback (raw properties returned, not crash) | High |
| SPI-006 | RenderContext available | @Self RenderContext | Context with path, resourceType, properties available | Medium |
| SPI-007 | @ChildResource | @ChildResource annotated field | Child nodes injected | Medium |

---

## 40. Module 38: TUT Sample Website (End-to-End)

This section validates the complete TUT luxury car sample website across all pillars.

### 40.1 TUT Sites

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TUT-001 | 4 sites exist | `GET /api/admin/sites` | tut-gb, tut-de, tut-fr, tut-ca present | Critical |
| TUT-002 | Locale configuration | Check each site | GB: en; DE: de; FR: fr; CA: en+fr | Critical |
| TUT-003 | Domain mappings | Check domain_mappings | www.tut.co.uk → tut-gb, etc. | Medium |

### 40.2 TUT Components

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TUT-004 | 18 TUT component definitions | `GET /api/content/v1/component-registry` | All 18 `tut/*` types present with valid dataSchema | Critical |
| TUT-005 | Hero banner schema | Check `tut/hero-banner` definition | Schema includes: title, subtitle, backgroundImage, ctaLabel, ctaLink, theme, height | High |
| TUT-006 | Product teaser schema | Check `tut/product-teaser` definition | Schema includes: productSku, displayMode, showPrice, ctaLabel, ctaLink | High |

### 40.3 TUT DAM Assets

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TUT-007 | 40+ DAM assets uploaded | `GET /api/author/assets?folder=/dam/tut` | At least 40 assets in DAM | Critical |
| TUT-008 | Brand assets | Check `/dam/tut/shared/brand/` | tut-logo.png present | High |
| TUT-009 | Banner assets | Check `/dam/tut/shared/banners/` | hero-home.png, hero-models.png, etc. present | High |
| TUT-010 | Model assets | Check `/dam/tut/shared/models/` | 12 car model images (3 per model × 4 models) | High |

### 40.4 TUT PIM Products

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TUT-011 | Product schema exists | `GET /api/pim/v1/schemas` | "Luxury Vehicle v2026" schema present | Critical |
| TUT-012 | Catalog exists | `GET /api/pim/v1/catalogs` | "TUT 2026 Model Lineup" catalog, status ACTIVE | Critical |
| TUT-013 | 4 products created | `GET /api/pim/v1/products` | TUT-SOVEREIGN-2026, TUT-VANGUARD-2026, TUT-ECLIPSE-2026, TUT-APEX-2026 | Critical |
| TUT-014 | Product attributes complete | `GET /api/pim/v1/products/TUT-SOVEREIGN-2026` | All attributes: horsepower=600, engineType=V12 Petrol, etc. | High |
| TUT-015 | Product DAM links | `GET /api/pim/v1/products/TUT-SOVEREIGN-2026/assets` | Hero + gallery images linked | High |

### 40.5 TUT Content Pages

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TUT-016 | 85 page nodes exist | Count nodes across all sites | Total ≥ 85 page nodes | Critical |
| TUT-017 | GB site has 17 pages | `GET /api/author/content/children?path=content.tut-gb.en` | 17 pages in hierarchy | Critical |
| TUT-018 | Home page components | `GET /api/content/v1/pages/content/tut-gb/en/home` | Hero, card-grid, text-image, stats, testimonial, CTA | Critical |
| TUT-019 | Model detail page | `GET /api/content/v1/pages/content/tut-gb/en/models/sovereign` | Hero, text-image, gallery, product-specs, features, CTA | High |
| TUT-020 | All pages PUBLISHED | Check status of all TUT pages | All pages have status=PUBLISHED | Critical |

### 40.6 TUT Experience Fragments

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TUT-021 | 12 XF variations | Count XF folders across all site+locales | 12 XFs (6 headers + 6 footers) | High |
| TUT-022 | Header XF has navigation | Check header XF content | Contains `tut/navigation` component | High |
| TUT-023 | Footer XF has links | Check footer XF content | Contains `tut/footer-links` component | High |
| TUT-024 | Pages reference XFs | Check any page's header/footer | `flexcms/experience-fragment` with correct `fragmentPath` | High |

### 40.7 TUT End-to-End Rendering

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| TUT-025 | Home page renders in browser | Visit `http://localhost:3001/` | TUT home page renders with hero, cards, stats, etc. | Critical |
| TUT-026 | Model page renders | Visit `http://localhost:3001/models/sovereign` | Sovereign detail page with images, specs, features | Critical |
| TUT-027 | Navigation works | Click "Models" in header nav | Navigates to models page | High |
| TUT-028 | Multi-language content | Check DE/FR site content | Translated content for German/French sites | High |
| TUT-029 | Product data in components | Product teaser on models page | Product name, specs, images from PIM displayed | High |
| TUT-030 | Images load | Check all image components | Images load from DAM (MinIO) without errors | High |

---

## 41. Module 39: Client Libraries (ClientLibs)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| CL-001 | Register client library | `POST /api/admin/clientlibs` | ClientLibrary created in DB | Low |
| CL-002 | Compile clientlib | Trigger compilation | SCSS → CSS, TS → JS compiled and uploaded to S3 | Low |
| CL-003 | Dependency resolution | Library A depends on B | B loaded before A | Low |
| CL-004 | Cache-busted URLs | Compiled output | Filename includes content hash | Low |

> **Note:** ClientLibs module is lower priority as modern frontend frameworks (Next.js/Nuxt/Vite) handle bundling natively. This module is for legacy SSR scenarios.

---

## 42. Module 40: Node ACLs (Access Control)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| ACL-001 | Create ACL entry | `POST /api/author/acl` with nodePath, principal, permissions | ACL created in `node_acls` table | Medium |
| ACL-002 | Read ACL | `GET /api/author/acl?path=...` | Returns ACL entries for that path | Medium |
| ACL-003 | Delete ACL | `DELETE /api/author/acl/{id}` | ACL removed | Medium |
| ACL-004 | ACL evaluation | Check `NodePermissionEvaluator` | `hasPermission()` respects ACL rules | Medium |

---

## 43. Module 41: Cross-Cutting Concerns

### 43.1 CORS (Cross-Origin Resource Sharing)

> **Preconditions:** Author API running. Tests should be performed from a browser or tool that sends `Origin` headers.

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| CORS-001 | Preflight OPTIONS request | — | Send `OPTIONS /api/content/v1/pages/content/tut-gb/en/home` with headers: `Origin: http://localhost:3000`, `Access-Control-Request-Method: GET` | 200 OK; response includes `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` | High |
| CORS-002 | Cross-origin GET allowed | — | From `http://localhost:3000`, fetch `http://localhost:8080/api/content/v1/pages/content/tut-gb/en/home` | Request succeeds; `Access-Control-Allow-Origin` header present in response | High |
| CORS-003 | Cross-origin POST allowed (author) | Local mode | From `http://localhost:3000`, POST to `http://localhost:8080/api/author/content/node` | Request succeeds; CORS headers present | High |
| CORS-004 | Disallowed origin rejected | Non-local mode with restricted origins | Send request with `Origin: http://evil.com` | Either no `Access-Control-Allow-Origin` header or request blocked (depends on config) | Medium |

### 43.2 Rate Limiting

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| RATE-001 | Normal requests pass | — | Send 10 requests within rate limit window | All return 200 OK | High |
| RATE-002 | Burst exceeds limit | — | Send 200 rapid-fire requests to same endpoint within 1 second | After limit exceeded: 429 Too Many Requests response | High |
| RATE-003 | Rate limit headers | — | Send any request to rate-limited endpoint | Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers | Medium |
| RATE-004 | Rate limit recovery | Limit exceeded | Wait for reset window to pass; send new request | Request succeeds (200 OK); rate limit counter reset | Medium |

### 43.3 Content-Type Enforcement

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| CT-001 | JSON response type | — | `GET /api/content/v1/pages/content/tut-gb/en/home` | Response header: `Content-Type: application/json` (never `text/html`) | Critical |
| CT-002 | Problem+JSON error type | — | `GET /api/content/v1/pages/content/tut-gb/en/nonexistent` | Response header: `Content-Type: application/problem+json` | High |
| CT-003 | Invalid Content-Type on POST | — | `POST /api/author/content/node` with `Content-Type: text/plain` and valid JSON body | 415 Unsupported Media Type | Medium |

### 43.4 Input Sanitization & Injection

| # | Test Case | Precondition | Steps | Expected Result | Priority |
|---|-----------|--------------|-------|-----------------|----------|
| INJ-001 | SQL injection in path | — | `GET /api/author/content/children?path=content'; DROP TABLE content_nodes;--` | 400 Bad Request or 404; no SQL injection executed; DB intact | Critical |
| INJ-002 | Path traversal in path | — | `GET /api/author/content/children?path=content..parent..etc` | 400 Bad Request; ltree validation rejects invalid path | High |
| INJ-003 | XSS in property values | — | Create node with `properties: {"title": "<img src=x onerror=alert(1)>"}` | HTML tags sanitized in rich text fields; stored safely | High |
| INJ-004 | Oversized payload | — | `POST /api/author/content/node` with 10MB JSON body (huge properties) | 413 Payload Too Large OR 400 Bad Request; server does not crash | Medium |

---

## 44. Module 42: Admin UI — Accessibility & Compatibility

### 44.1 Browser Compatibility

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| COMPAT-001 | Chrome (latest) | Open Admin UI in Chrome | All pages render correctly; all interactions work | Critical |
| COMPAT-002 | Firefox (latest) | Open Admin UI in Firefox | All pages render correctly; all interactions work | High |
| COMPAT-003 | Safari (latest) | Open Admin UI in Safari | All pages render correctly; all interactions work | High |
| COMPAT-004 | Edge (latest) | Open Admin UI in Edge | All pages render correctly; all interactions work | High |
| COMPAT-005 | Tablet viewport (768px) | Resize browser to 768px wide | Layout adapts; no horizontal scrolling; all features accessible | Medium |
| COMPAT-006 | Mobile viewport (375px) | Resize browser to 375px wide | Layout adapts; sidebar collapses to hamburger menu; content still usable | Medium |

### 44.2 Accessibility (WCAG 2.1 AA)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| A11Y-001 | Keyboard navigation | Navigate entire Admin UI using only Tab, Shift+Tab, Enter, Escape | All interactive elements reachable and operable via keyboard | High |
| A11Y-002 | Focus indicators | Tab through elements | Every focused element has a visible focus ring/indicator | High |
| A11Y-003 | Screen reader labels | Run VoiceOver/NVDA on Admin UI | All buttons, inputs, and interactive elements have meaningful ARIA labels or visible text | High |
| A11Y-004 | Color contrast | Use browser DevTools accessibility audit (or axe-core) | All text meets WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large text) | High |
| A11Y-005 | No color-only indicators | Check status badges, error states | Information conveyed by color is also conveyed by text/icon (e.g., status badges have text labels, not just color) | Medium |
| A11Y-006 | Form labels | Check all form inputs in editor, settings pages | Every input has an associated `<label>` or `aria-label` | High |
| A11Y-007 | Modal focus trap | Open any dialog/modal | Focus trapped inside modal; Tab cycles within modal; Escape closes it | Medium |
| A11Y-008 | Skip navigation link | Press Tab on page load | "Skip to main content" link appears and works | Medium |

### 44.3 Admin UI Error States

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| UIERR-001 | API unreachable | Stop Author API; navigate to content page | User-friendly error message displayed (not blank page or JS error); retry option available | High |
| UIERR-002 | API returns 500 | Trigger server error (e.g., corrupt data) | Toast notification with error message; page remains usable | High |
| UIERR-003 | Network timeout | Simulate slow network (browser DevTools throttling) | Loading skeleton shown; timeout message after reasonable delay | Medium |
| UIERR-004 | Session expired mid-edit | JWT expires while user is editing a page | Prompt to re-authenticate; unsaved changes NOT lost | High |
| UIERR-005 | Concurrent edit warning | Two users editing same page | Warning shown when another user has edited/locked the content | Medium |

---

## Appendix A: Test Data Requirements

### Pre-Populated Test Data (from Flyway Migrations)

| Data | Source | Validation |
|------|--------|------------|
| Core component definitions (7) | V6 seed migration | `flexcms/page`, `flexcms/container`, `flexcms/rich-text`, `flexcms/image`, `flexcms/shared-header`, `flexcms/shared-footer`, `flexcms/site-root` |
| TUT component definitions (18) | V14 migration | All `tut/*` types (hero-banner, text-image, card-grid, etc.) |
| XF component definitions (3) | V12 migration | `flexcms/xf-folder`, `flexcms/xf-page`, `flexcms/experience-fragment` |
| NodeStatus CHECK constraint | V13 migration | Only `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED` allowed |
| Standard publish workflow | V6 seed migration | `standard-publish` workflow definition |
| TUT sample website | Seeding script (`scripts/seed_test_data.py`) | 4 sites, 85 pages, 40+ assets, 4 products, 12 XFs |

### Flyway Migration Integrity

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| FLY-001 | Migrations run in order | Start app fresh against empty DB | All migrations V1–V15+ apply in sequence without errors | Critical |
| FLY-002 | Migrations are idempotent | Run app startup twice | Second startup detects already-applied migrations; no re-execution | Critical |
| FLY-003 | PIM migrations isolated | Check `flexcms_pim` DB | PIM migrations in `db/pim/` run against separate DB; no cross-DB references | High |
| FLY-004 | CHECK constraint applied | Query: `SELECT conname FROM pg_constraint WHERE conrelid='content_nodes'::regclass AND contype='c'` | CHECK constraint on `status` column exists | High |

### Required External Services

| Service | Required For | Can Be Mocked? | Degraded Behavior |
|---------|-------------|----------------|-------------------|
| PostgreSQL | All CMS/PIM operations | No — required for ltree extension | App fails to start |
| Redis | Caching tests | Yes — can run without for basic tests | Caching disabled; app still functional |
| RabbitMQ | Replication, build worker | Yes — can test without for unit tests | Replication events not sent; publish side not updated |
| MinIO | DAM asset storage | Yes — can mock S3 client | DAM uploads fail; existing metadata still queryable |
| Elasticsearch | Search tests | Yes — optional; search returns empty without it | Search returns empty results; content CRUD still works |

---

## Appendix B: API Response Formats

### Successful Response
```json
{
  "id": "uuid",
  "path": "content.site.en.page",
  "name": "page",
  "resourceType": "flexcms/page",
  "properties": { "jcr:title": "My Page" },
  "status": "PUBLISHED",
  "version": 3,
  "createdAt": "2026-03-27T10:00:00Z",
  "modifiedAt": "2026-03-27T12:30:00Z"
}
```

### Error Response (RFC 7807)
```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Content node not found: content.site.en.nonexistent",
  "instance": "/api/author/content/node",
  "correlationId": "abc-123-def"
}
```

### Validation Error Response
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "fieldErrors": [
    { "field": "name", "message": "must not be blank" },
    { "field": "resourceType", "message": "must not be blank" }
  ]
}
```

### Paginated Response
```json
{
  "items": [ ... ],
  "totalCount": 150,
  "page": 0,
  "size": 20,
  "hasNextPage": true
}
```

---

## Appendix C: Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | `author,local` | Active Spring profiles |
| `FLEXCMS_JWT_ISSUER_URI` | `http://localhost:8180/realms/flexcms` | OAuth2 issuer URI |
| `flexcms.local-dev` | `true` (local profile) | Bypass auth for local development |
| `flexcms.cache.warming.enabled` | `false` (author) / `true` (publish) | Enable cache warming |

---

## Appendix D: Test Execution Priority

### Smoke Test Suite (run first — ~15 minutes)
Execute these to verify basic system health before running any other tests:
- **CMS:** CMS-001 (tree root), CMS-011 (default status)
- **Author API:** AUTH-001 (create node), AUTH-009 (get node)
- **Headless:** HEAD-001 (get page), HEAD-011 (component registry)
- **GraphQL:** GQL-001 (page query), GQL-018 (no duplicate mapping)
- **Workflow:** WF-001 (start workflow)
- **DAM:** DAM-001 (upload image)
- **PIM:** PIM-012 (create product)
- **Security:** SEC-001 (local dev bypass)
- **Admin UI:** UI-001 (dashboard loads), UI-007 (content tree loads)
- **Health:** OBS-006 (actuator health)

### Core Regression Suite (~2 hours)
All **Critical** priority test cases across all modules. Run on every PR merge or sprint boundary.

### Full Test Suite (~8 hours)
All test cases including Medium and Low priority. Run before every release.

### Test Report Template

For each test run, record:
```
Test Run ID:    QA-2026-MM-DD-NNN
Environment:    local / staging / pre-prod
Build Version:  flexcms v1.0.0-SNAPSHOT (commit SHA)
Tester:         <name>
Date:           <date>
Suite:          Smoke / Regression / Full

Results:
  Total:    ___
  Passed:   ___
  Failed:   ___
  Blocked:  ___
  Skipped:  ___

Failed Test IDs: <list>
Blockers:        <list of bug IDs>
Notes:           <any observations>
```

---

## Appendix E: Glossary

| Term | Definition |
|------|-----------|
| **ltree** | PostgreSQL extension for hierarchical label-tree paths (dot-separated) |
| **JSONB** | PostgreSQL binary JSON column type used for flexible key-value properties |
| **RFC 7807** | Standard for HTTP problem detail responses (`application/problem+json`) |
| **ComponentModel** | Server-side Java class that enriches raw JSONB properties with computed data before delivery |
| **Experience Fragment (XF)** | Reusable content block (e.g., header/footer) shared across pages via reference |
| **Carryforward** | PIM feature: cloning products from one catalog year to the next, inheriting unchanged attributes |
| **Rendition** | Auto-generated image variant (e.g., thumbnail, web-large, hero-desktop) from an original DAM asset |
| **Surrogate Key** | Tag sent in HTTP response headers enabling CDN tag-based cache purge |
| **Live Copy** | Content inheritance mechanism where a target page auto-syncs from a source page |
| **Replication** | Async content transfer from Author (read-write) to Publish (read-only) via RabbitMQ |

---

*Document generated: 2026-03-27 | FlexCMS v1.0.0-SNAPSHOT*
*Total test cases: 430+ across 42 functional modules*
*Document version: 2.0 — Updated with preconditions, expanded steps, negative tests, cross-cutting concerns, and accessibility coverage*

