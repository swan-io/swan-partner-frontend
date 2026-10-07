# AGENTS.md

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

- **Biome** handles linting and formatting. Covers `clients/*/src/**/*.{ts,tsx}` and `server/src/**/*.ts`. Excludes generated GraphQL files. Config defined in `biome.jsonc`
- Pre-commit hook runs `lint-staged`.

> **Prettier** is installed only for `crawlLicenses.ts` script for formatting markdown file

### Testing

- Unit tests: Vitest + jsdom, colocated in `__tests__/` subdirectories
- Focus unit tests on pure business logic in folders like `utils`, don' test react component

## Localization

Each client has its translation files in `clients/<app>/src/locales/` (`banking`, `onboarding`, `payment`): `en.json` is the source of truth, and every other locale (`de`, `es`, `fi`, `fr`, `it`, `nl`, `pt`) must have the same keys. Translations are synced with Localazy, but are written in this repo together with the code that uses them.

Whenever you add or change a key in an `en.json`, add or update its translation in **every** locale file of the same app in the same change:

- Before translating, read the existing locale file and reuse its terms, its formal/informal register (e.g. _vous_, _Sie_) and its punctuation (e.g. the French space before `:`). Keys sharing a prefix belong to the same screen: keep them consistent.
- Keep ICU syntax exactly: `{arguments}` stay untranslated; in `plural` / `select`, translate only the text inside the branches (keep the argument name, the keyword, the selectors and `#`). Keep rich text tags (`<bold>…</bold>`) and `\n` line breaks.
- Don't translate Swan, product names, IBAN, BIC, SEPA, SWIFT, currency codes or legal identifiers.
- When you change an English value, update every translation of that key, keeping the existing wording where it still fits.
- When you remove a key from `en.json`, remove it from every locale file of the app (`pnpm remove-unused-locales` removes keys no longer used in the code).

### Before committing

When a change touches strings (an `en.json`, a locale file or a `t("…")` call), complete these steps and only commit once they all pass:

1. Every key added or changed in `en.json` is added or updated in **every** locale file (`de`, `es`, `fi`, `fr`, `it`, `nl`, `pt`) of the same app, and every key removed from `en.json` is removed everywhere.
2. `pnpm format-locales`: sorts the keys of every locale file alphabetically and formats them.
3. `pnpm validate-locales`: must pass. It checks, for each app, that every locale has the same keys as `en.json`, no empty value, and valid ICU messages with the same arguments and tags.
4. `pnpm typecheck`: must pass. A `t("…")` key missing from `en.json` fails here (`Argument of type '"<key>"' is not assignable…`).

In your summary, list the keys you added or changed (with their app) and any translation you're unsure about, so it can be reviewed.

## Review

### Guidelines

- Be concise
- Focus on the edited code only, refer to other files for context
- Remove the `✅ Strengths` bloc
- Check for consistency
- Check for repetitive code (advise on DRY and KISS principles if needed)
