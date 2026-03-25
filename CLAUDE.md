# CLAUDE.md — FlexCMS Agent Instructions

## Identity

You are an implementation agent working on FlexCMS, an enterprise Content Management System. You work within a structured coordination protocol that enables multiple agents to work in parallel without conflicts.

## Project Overview

FlexCMS has three independent pillars: Content (CMS), Digital Assets (DAM), and Products (PIM). The backend is Spring Boot 3.3 + Java 21 + PostgreSQL 16 (ltree + JSONB). The frontend is a TypeScript pnpm monorepo (Turborepo) with Next.js 14, `@flexcms/ui` design system, and framework adapters for React, Vue, Angular. The backend NEVER generates HTML — it returns JSON only. All rendering is done by the frontend.

## Critical Files (Read Order)

1. `WORK_BOARD.md` — **THE** source of truth. Read §3 for available tasks, §4 for context packets, §2 for module locks.
2. `README.md` §9 — Architecture mental model, file map, conventions, key patterns.
3. `Design/DesignerPrompt.md` §8 — Mandatory style rules (ONLY if your task touches frontend).

## Workflow Protocol

### Before Starting Any Work
1. Read `WORK_BOARD.md` fully.
2. Identify the next task: look for 🟢 OPEN items with no blockers and highest priority (🔴 P0 first, then 🟡 P1).
3. Check §2 Module Lock Table — make sure no other IN PROGRESS item locks the modules you need.
4. Update the work item status to 🔵 IN PROGRESS in `WORK_BOARD.md`.
5. Update the Module Lock Table in §2 with your item ID.
6. Read the Context Packet in §4 for your item — it tells you exactly which files to read.

### During Work
- Follow ALL key patterns from `README.md` §9 "Key Patterns to Follow".
- If touching frontend: follow ALL 27 rules in `Design/DesignerPrompt.md` §8 — no exceptions.
- **UI implementation MANDATORY rule:** Before implementing ANY admin UI page or component, look for its reference design in `Design/UI/stitch_flexcms_admin_ui_requirements_summary/<page-name>/`. Each subfolder contains:
  - `screen.png` — visual screenshot (read this with the image-reading tool)
  - `code.html` — reference HTML implementation
  - **Both files MUST be read before writing any UI code.** Implement based on the provided HTML structure and the visual screenshot. If no matching folder exists for the page/component you are implementing, **STOP and ask the user to provide the design files before proceeding.**
- If creating Flyway migrations: CMS migrations go in `flexcms-app/src/main/resources/db/migration/`. PIM migrations go in `flexcms-pim/src/main/resources/db/pim/`.
- If creating new Java classes: follow existing package structure in the target module.
- If adding dependencies: add to both the module `pom.xml` and the parent `pom.xml` dependency management.
- Validate your work: run `mvn clean compile` for backend, check for TypeScript errors for frontend.

### After Completing Work
1. Validate: run build commands, check for compilation errors.
2. Verify ALL acceptance criteria from the Context Packet.
3. Update `WORK_BOARD.md`:
   - Change item status to ✅ DONE.
   - Clear the Module Lock Table entry in §2.
   - Add a Completion Note entry in §5 with: AC verification, files changed, build status.
4. If you could NOT finish: change status to 🟠 PAUSED, write a detailed handoff note in §5 explaining exactly where you stopped, what remains, and step-by-step instructions for the next agent.

## Build Commands

```bash
# Backend — build all modules
cd flexcms && mvn clean install

# Backend — compile only (faster, no tests)
cd flexcms && mvn clean compile

# Backend — run single module tests
cd flexcms/flexcms-core && mvn test

# Backend — run app (author mode)
cd flexcms/flexcms-app && mvn spring-boot:run -Dspring-boot.run.profiles=author

# Infrastructure (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)
cd flexcms && docker-compose up -d

# Frontend — install all deps
cd frontend && pnpm install

# Frontend — build all packages
cd frontend && pnpm build

# Frontend — dev mode admin UI
cd frontend/apps/admin && pnpm dev

# Frontend — typecheck
cd frontend && pnpm tsc --noEmit
```

## Code Conventions

### Java (Backend)
- Package structure: `com.flexcms.{module}.{layer}` (e.g., `com.flexcms.core.service`)
- JPA entities in `model/`, repositories in `repository/`, business logic in `service/`, REST endpoints in `controller/`
- Use `@Autowired` field injection (existing convention).
- New exceptions must extend the custom hierarchy once P1-04 is done.
- Content paths use `.` as separator (ltree convention). URLs use `/`. Convert in controllers.

### TypeScript (Frontend)
- NEVER hardcode colors — use `var(--color-*)` tokens.
- NEVER use raw HTML elements for interactive UI — use `@flexcms/ui` components.
- Every page must have: breadcrumb, empty state, loading skeleton.
- Named exports only — no default exports for components.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities.

## Important Warnings

- `SecurityConfig.java` currently has `permitAll()` — this is a placeholder, not permanent.
- PIM has its OWN database (`flexcms_pim`) and own DataSource config. Do not use the CMS DataSource for PIM queries.
- The `@flexcms/ui` package uses CSS custom properties and CVA (class-variance-authority) for variants. Study `Button.tsx` before creating new components.
- Flyway migration version numbers must be sequential and never reused. Check existing migrations before adding new ones.

