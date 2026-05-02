# Linux dev image for fast iteration on JS-only / TypeScript / unit-test
# work. Cannot build iOS apps (no Xcode in Linux); pair with a Mac for
# native work. See docs/DOCKER.md for usage.

# ---------------------------------------------------------------
# Stage 1: deps — only invalidated when package-lock.json changes.
# This layer is the bulk of the image size and the slowest to build,
# so cache hits here save minutes per rebuild.
# ---------------------------------------------------------------
FROM node:22-bookworm-slim AS deps

WORKDIR /app

# System packages: git for npm postinstall scripts, curl for any
# expo-cli network operations, jq for the inline JSON tweaks our
# scripts make.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      git curl jq ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

# --legacy-peer-deps is required for the SDK 54 stack — see
# expo-sdk54-rn081-setup skill for the full rationale.
RUN npm install --legacy-peer-deps --include=dev \
 && npm cache clean --force

# ---------------------------------------------------------------
# Stage 2: dev — final image. Source is mounted at runtime, not
# baked into the image, so source edits don't invalidate the cache.
# ---------------------------------------------------------------
FROM node:22-bookworm-slim AS dev

WORKDIR /app

# Same system deps as the dev tier — needed because some npm scripts
# shell out at runtime.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      git curl jq ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Pull in the resolved node_modules from the deps stage. Skipping
# `npm install` here means a docker-compose run is ready in <2s.
COPY --from=deps /app/node_modules /app/node_modules

# Source comes in via a volume mount in docker-compose.yml; we don't
# COPY it here because that would invalidate the layer cache on every
# source edit.
ENV NODE_ENV=development \
    CI=false \
    NODE_OPTIONS=--max-old-space-size=4096

# Default command is an interactive shell; docker-compose overrides
# this to run `npm run test:watch` for the dev service.
CMD ["bash"]
