# syntax=docker/dockerfile:1

# Debian, not Alpine: pnpm-workspace.yaml switches sharp and unrs-resolver off,
# but anything added later that ships glibc prebuilts would compile from source
# on musl/arm64 and fail late with an error naming the wrong package.
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# corepack reads package.json's packageManager field, so the image, CI and
# developers all run pnpm 12.14.0. The prompt variable matters in CI: without it
# corepack can stop to ask before downloading pnpm, which reads as a hung build.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Manifests first so a source-only change does not reinstall. pnpm-workspace.yaml
# carries allowBuilds — without it here, install tries to build sharp and
# unrs-resolver from source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* are inlined into the browser bundle by `next build`, so they are
# build args supplied by the deploy workflows — passing them to `docker run`
# later ships a bundle that calls localhost from the tester's browser and fails
# with nothing in any server log. Any new NEXT_PUBLIC_* also needs adding to
# build-args in deploy-dev.yml and deploy-uk.yml.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_LAWYER_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_LAWYER_APP_URL=$NEXT_PUBLIC_LAWYER_APP_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---------------------------------------------------------------------------
# No `output: "standalone"` in next.config.ts, so the runner needs the real
# node_modules rather than a self-contained server bundle. If standalone is ever
# turned on, this stage shrinks to copying .next/standalone and .next/static.
#
# corepack has to be enabled again: each FROM starts from a clean filesystem.
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3002 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# next.config.ts is read at runtime, not only at build: it carries cacheComponents,
# partialPrefetching and the turbopack CSS rule. Without it the pages still render
# while those quietly stop applying.
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/src ./src

EXPOSE 3002
CMD ["pnpm", "start"]
