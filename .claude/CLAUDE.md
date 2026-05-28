# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm typecheck              # TypeScript type checking
pnpm lint                   # Biome linting
pnpm format                 # Prettier formatting
pnpm test                   # Run all unit tests (Vitest)
pnpm graphql-codegen        # Regenerate GraphQL types (also runs on install)
pnpm graphql-update-schemas # Download latest GraphQL schemas
```

## Architecture

This is a **pnpm monorepo** with multiple SPA clients served by a single Fastify backend.

### Top-level layout

```
clients/
  banking/         # web banking ui
  onboarding/      # Onboarding and kyc
  payment/         # Payment page
server/            # Fastify SSR + API proxy
scripts/           # Build, codegen, test setup scripts
```

### Server

Fastify backend that:

- Serves the three SPA bundles
- Proxies GraphQL requests to the Partner API
- Handles OAuth2 authorization callbacks
- Provides session management

### Key patterns

- **GraphQL Request** for data fetching (no Apollo Client)
- **Boxed** (`Option`, `Result`) for functional data handling — prefer these over null checks
- **ts-pattern** for exhaustive pattern matching

### Design system

UI is built on the internal **Lake** design system. Import components from `@swan-io/lake/`. Avoid building custom UI primitives when a Lake component exists.

### Linting & formatting

- **Biome** handles linting (not formatting). Covers `clients/*/src/**/*.{ts,tsx}` and `server/src/**/*.ts`. Excludes generated GraphQL files.
- **Prettier** handles formatting with `prettier-plugin-organize-imports`. Print width 100, trailing commas, no arrow parens.
- Pre-commit hook runs `lint-staged` (both tools).

### Testing

- Unit tests: Vitest + jsdom, colocated in `__tests__/` subdirectories
- Focus unit tests on pure business logic in folders like `utils`, don' test react component

## Review

### Guidelines

- Be concise
- Focus on the edited code only, refer to other files for context
- Be kind and polite
- Add a separate block `👍 Well done buddy !` to point out what was done well
- Remove the `✅ Strengths` bloc
- Check for consistency
- Check for repetitive code (advise on DRY and KISS principles if needed)
- Add a bloc at the end `🧪 How to test it` to explain to a QA how to test this ticket if needed. It should describe the user-facing workflow on the impacted client(s) (banking / onboarding / payment), not implementation details (GraphQL operations, hooks, internal state). Mention which subdomain to open (`banking.swan.local`, `onboarding.swan.local`, `payment.swan.local`) when relevant
- Add another bloc at the end `📋 Actions` to resume all actions you mentioned in a Markdown table with those columns:
  - action title with a link where it was mentioned previously
  - criticality (critical, major, minor)
  - type (type, code organisation, security, bug, a11y, i18n, perf, design-system, graphql, ...)
  - estimated implementation time (in hour or day)
