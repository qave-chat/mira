# Mira

Mira is a TypeScript monorepo for a full-stack Effect application. It combines a React client, a Bun-powered Effect server, and a small shared client API package for typed HTTP/RPC access.

## Workspace

```txt
apps/
  client-ui/      React 19 + Vite app
  server-core/    Bun + Effect server, RPC, HTTP, auth, database, workflows
packages/
  client-api/     Shared client bindings for server HTTP/RPC contracts
docs/
  effect/         Vendored Effect documentation used by agents and contributors
```

This repo uses `pnpm` workspaces:

```yaml
packages:
  - apps/*
  - packages/*
```

## Tech Stack

- TypeScript, ESM, and `tsgo`
- Effect 4 beta across the server, RPC contracts, client API, and runtime layers
- Bun for the server runtime
- React 19, Vite, TanStack Router, Tailwind CSS 4, Base UI, and Storybook for the client
- Drizzle ORM and Postgres/PGlite for persistence
- Better Auth for authentication
- Remotion for video rendering workflows
- Oxlint and oxfmt for linting and formatting

## Getting Started

Install dependencies:

```sh
pnpm install
```

Prepare local server environment:

```sh
cp apps/server-core/.env.example apps/server-core/.env.local
```

Run the development workspace:

```sh
pnpm dev
```

The root `dev` command runs each package's dev script in parallel. The server listens on `PORT`, defaulting to `38412`.

## Common Commands

From the repository root:

```sh
pnpm dev          # run workspace dev scripts in parallel
pnpm lint         # run type-aware oxlint
pnpm fmt          # format the repo with oxfmt
pnpm fmt:check    # check formatting
pnpm typecheck    # typecheck all packages
```

Client app commands:

```sh
pnpm --filter @mira/client-ui dev
pnpm --filter @mira/client-ui build
pnpm --filter @mira/client-ui test
pnpm --filter @mira/client-ui storybook
```

Server commands:

```sh
pnpm --filter @mira/server-core dev
pnpm --filter @mira/server-core test
pnpm --filter @mira/server-core seed
pnpm --filter @mira/server-core db
```

Shared client API:

```sh
pnpm --filter @mira/client-api typecheck
```

## Applications

### `apps/client-ui`

The client is a Vite React application organized by modules. Current modules include auth, company, health, home, session, and share.

Notable pieces:

- `src/app.route.tsx` and `src/routes.ts` define the routing shell.
- `src/module/*` contains feature routes, atoms, and feature UI.
- `src/shared/*` contains reusable hooks, state, utilities, and base UI components.
- Storybook is available for UI development.

### `apps/server-core`

The server is an Effect application running on Bun. It exposes platform HTTP and RPC contracts, composes module layers, and starts the HTTP server from `src/main.ts`.

Current modules include health, plans, sessions, share, users, and video generation.

Platform services live in `src/platform` and include auth, database/sql, HTTP, RPC, R2, static serving, uploads, ASR, and workflow support.

### `packages/client-api`

This package exports typed client-side accessors for the server contracts:

- `@mira/client-api/http`
- `@mira/client-api/http-atom`
- `@mira/client-api/rpc`
- `@mira/client-api/rpc-atom`

## Environment

Server environment variables are documented in `apps/server-core/.env.example`. Local development uses `apps/server-core/.env.local`, which Bun loads automatically.

Important groups:

- HTTP: `PORT`
- Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, Google OAuth settings
- AI: `OPENAI_API_KEY`
- Database: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL`
- Storage: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`

## Conventions

This codebase is convention-heavy. Before editing files, read the matching `*.skill.md` file next to the area you are changing. `AGENTS.md` contains the full map of file prefixes to skills.

High-level rules:

- Effect code should follow the repo's vendored Effect docs in `docs/effect/LLMS.md`.
- Server modules generally separate schemas, tables, repos, services, RPC contracts, and implementations.
- Client modules generally separate routes, atoms, feature UI, and stories.
- Companion tests and stories are enforced by local lint rules where applicable.
- New entity IDs should be KSUIDs prefixed with a three-character entity code, for example `ses_...` for sessions.

## Quality Checks

Run these before opening a PR:

```sh
pnpm fmt:check
pnpm lint
pnpm typecheck
pnpm --filter @mira/client-ui test
pnpm --filter @mira/server-core test
```

Use targeted checks while iterating, then run the broader workspace checks before handing off larger changes.
