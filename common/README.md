# `common/` — code shared between the server and the clients

This folder holds source that is imported by **both** the Fastify server
(`server/`) and the browser clients (`clients/dashboard`, …). Today that's the
feature-flag contract (`flags.ts`): the flag keys, their default values, and the
`Flags` / `FlagContext` types. The server needs the defaults to build the
`/api/flags` response; the clients need the same shape and defaults to read
flags — so it must live in exactly one place.

## ⚠️ Invariant: this code is bundled into the browser

Everything here ends up in the **frontend bundle**. Therefore:

- Keep it **dependency-free** (or browser-safe deps only).
- **Never** import server-only modules or environment variables here
  (`server/src/env`, secrets, Node built-ins, …). It would leak into the
  browser.

The client imports the neutral top-level `common/` path and **never references
`server/`**, so nothing in `clients/**` has a reason to reach into server code.

## How it works — the symlink

The server ships as a **self-contained `server/dist/`**: the Dockerfile copies
only `./server/` and runs `pnpm install` in isolation, then `node dist/index.js`.
For the shared code to end up inside that `dist/`, the server's `tsc` must
compile it as part of its own source — which means it has to sit under the
server's `rootDir` (`server/src`).

So `common/` is symlinked into the server tree:

```
common/flags.ts                     <- real file (source of truth)
server/src/common  ->  ../../common <- symlink (git mode 120000)

server:  import { flagDefaults } from "./common/flags"
client:  import { flagDefaults, Flags, FlagContext } from ".../common/flags"
```

- **Build:** `tsc` compiles through the symlink and emits a **real**
  `server/dist/common/flags.js`; `dist/app.js` does `require("./common/flags")`.
  The `dist/` output is self-contained — no symlink, no external package.
- **Dev:** the symlink is live, so editing `common/flags.ts` is picked up by
  both `tsx` (server) and Vite (clients) with no copy/sync step.

### Docker note

The image only ever runs the compiled `server/dist/` (the Dockerfile does
`ADD ./server/` then `node dist/index.js`). Nothing reads `server/src` at
runtime, so the whole `server/src` directory is excluded via `.dockerignore`.
That keeps the image lean and, as a side effect, means the
`server/src/common -> ../../common` symlink never reaches the image (where it
would otherwise dangle harmlessly, since top-level `common/` isn't copied).

## Alternatives we considered

| Approach                                                                                           | Why we rejected it                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pnpm workspace package** (`@swan-io/common`, imported as a dependency)                           | The server is deployed standalone: `ADD ./server/` + an isolated `pnpm install`. A `workspace:*` dependency can't resolve there, and a sibling package isn't copied into the image. Breaks the Docker build.                      |
| **Put the shared file under `server/src` and have the client import `../../../../server/src/...`** | Works, but the client's import graph then reaches into `server/`, which _invites_ someone to later import `server/src/env` and leak secrets into the browser bundle. We want the client to have no reason to reference `server/`. |
| **Bundle the server** (esbuild/tsup) so top-level `common/` is inlined into `dist/`                | Cleanest layout, but it replaces the server's plain `tsc` build with a bundler — added risk around the separate `tracing.js` entry point and dependency externalization, for little benefit here.                                 |
| **Copy `common/` into `server/src` at build & dev time** (generated, gitignored)                   | Viable and symlink-free, but adds a `prebuild` + `predev` copy step and can go stale during development. The symlink is always live and needs no scripts.                                                                         |

## Why the symlink

It satisfies every constraint at once with the least machinery:

- **Server stays self-contained** — `common/` compiles into `server/dist/`; the
  Dockerfile and build pipeline are unchanged.
- **Client is decoupled** — it imports the neutral `common/` path, never
  `server/`, which addresses the env-leak risk structurally.
- **Single source of truth** in a framework-neutral location.
- **Live in dev** — no copy step, no build reordering, no extra package.

The trade-off is minor: reliance on git symlinks (fine on macOS/Linux; Windows
contributors would need symlink support enabled). The symlink never reaches the
Docker image, which excludes `server/src` entirely (see the Docker note above).
