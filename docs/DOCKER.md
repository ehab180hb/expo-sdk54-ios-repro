# Docker / devcontainer

Docker is _not_ a path to building iOS apps — Linux containers can't run
Xcode or boot iPhone simulators. But Docker is excellent for everything
_else_ in the iteration loop:

- TypeScript type checking
- Jest unit tests
- Component tests (testing-library, no native modules needed in tests)
- Metro bundler (serves JS bundle to a sim that runs elsewhere)
- Lint / format / static checks

This doc shows two Docker-shaped setups:

1. **`Dockerfile` + `docker-compose.yml`** — for hermetic Linux iteration on any OS
2. **`.devcontainer/devcontainer.json`** — for VS Code Dev Containers / Codespaces

Both ship pre-warmed with `node_modules` so cold starts are <10s.

## Why Docker in a RN repo

The pain it solves:

- **Windows hosts**: native node-gyp fails on Windows for some RN deps.
  Docker on Windows uses a Linux VM; everything compiles cleanly.
- **Reproducible CI parity**: the Linux unit-tests workflow runs in
  ubuntu-latest. Locally `act` + this Dockerfile hits the same env.
- **Test-only iteration**: when you're working on store logic, you
  don't need a Mac. A Docker container gives you Jest watch in 1s.

## Setup

```bash
# Build the image (one-time, ~2 min cold; ~30s warm via cache)
docker compose build dev

# Open a shell in the container
docker compose run --rm dev bash

# Inside the container:
npm test
npm run test:watch
npm run typecheck
```

The `dev` service mounts your working tree as a volume, so file edits
on the host are immediately visible in the container. Jest watch picks
them up via inotify.

## The image: layered for cache hits

`Dockerfile` is multi-stage:

```dockerfile
# Stage 1: deps — only invalidated when package-lock.json changes
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --include=dev

# Stage 2: dev — final image with deps + source mount point
FROM node:22-bookworm-slim AS dev
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
ENV NODE_ENV=development
CMD ["sh"]
```

When `package-lock.json` doesn't change, layer 1 is a cache hit
(~0s rebuild). Source changes only invalidate layer 2 (~1s).

## What you can do inside the container

| Task                       | Command                                                                      | Time           |
| -------------------------- | ---------------------------------------------------------------------------- | -------------- |
| Type check                 | `npm run typecheck`                                                          | ~3s            |
| Run all unit tests         | `npm test`                                                                   | ~3s            |
| Jest watch                 | `npm run test:watch`                                                         | ~1s per change |
| Coverage report            | `npm run test:coverage`                                                      | ~5s            |
| Lint format                | `npm run format`                                                             | ~1s            |
| Bundle JS for a remote sim | `npx expo export:embed --platform ios --bundle-output /shared/main.jsbundle` | ~30s           |

## What you CAN'T do inside the container

- Build the iOS app (no Xcode in Linux)
- Run the iOS simulator (no Apple frameworks)
- Run Maestro against an iOS sim (Maestro can run against an Android
  emulator inside a Linux container, but that's a different setup)

For iOS-side work, fall through to a real Mac (local or CI runner).

## VS Code Dev Containers / Codespaces

Open this repo in VS Code with the Dev Containers extension installed,
then `Cmd+Shift+P` → `Dev Containers: Reopen in Container`. The same
image as `docker compose build dev` is used, with VS Code attached.

In Codespaces, this works automatically — open the repo in Codespaces
and you get a 4-core Linux box with Node, npm, all deps, ready to test
in <30s.

## Iteration loop with Docker

The intended workflow:

1. **Hour 0 (fresh machine)**: `docker compose build dev` — ~2min cold
2. **Hour 0+5min**: `docker compose run --rm dev npm run test:watch` —
   keep this running in a terminal
3. **Edit code on the host** in your favorite editor
4. **Save** — Jest watch in the container reruns affected tests in 1-2s
5. **Native side change?** Switch to a Mac (local or CI) for the
   xcodebuild

The container handles 90%+ of changes — store, hooks, components,
utils — at near-zero seconds per cycle. The Mac is reserved for the
~10% that genuinely needs native compilation.

## Files in this repo

- `Dockerfile` — image definition
- `docker-compose.yml` — service config
- `.devcontainer/devcontainer.json` — VS Code Dev Containers config
- `.dockerignore` — excludes node_modules, ios/, etc. from build context

## Cost

Local Docker: free (uses your CPU). Codespaces: 60 free hours/month per
GitHub user; $0.18/hour after. For a 5-day work week at 8h/day, that's
40h — still under the free quota for personal use.
