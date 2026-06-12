# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────
# SIN-Code WebUI v2 — Dockerfile
#
# Multi-stage build:
#   1. deps        — pnpm install with frozen lockfile
#   2. sin-code    — download the sin-code Go binary from the
#                    SIN-Code-Bundle release (single static binary)
#   3. builder     — Next.js standalone build
#   4. runner      — slim runtime: node 22-slim + the standalone bundle
#                    + the sin-code binary on PATH
#
# Build:   docker build -t sin-code-webui-v2 .
# Run:     docker run --rm -p 3000:3000 sin-code-webui-v2
# Env:     See .env.example for AI_GATEWAY_API_KEY etc.
# ──────────────────────────────────────────────────────────────

# ─── 1. deps ────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# pnpm via corepack (ships with Node 22)
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── 2. sin-code binary ────────────────────────────────────────
# We download the official release binary. Override SIN_CODE_VERSION
# at build time with `--build-arg SIN_CODE_VERSION=v2.5.1` etc.
FROM alpine:3.20 AS sin-code
ARG SIN_CODE_VERSION=v2.5.0
ARG SIN_CODE_REPO=OpenSIN-Code/SIN-Code-Bundle
WORKDIR /out
# `sin-code` ships pre-built binaries for linux/amd64 + linux/arm64.
# We let docker buildx pick the right one via TARGETARCH.
ARG TARGETARCH=amd64
RUN apk add --no-cache curl tar \
 && case "$TARGETARCH" in \
      amd64) ARCH=amd64 ;; \
      arm64) ARCH=arm64 ;; \
      *) echo "unsupported arch: $TARGETARCH" && exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/${SIN_CODE_REPO}/releases/download/${SIN_CODE_VERSION}/sin-code_${SIN_CODE_VERSION#v}_linux_${ARCH}.tar.gz" \
      -o /tmp/sin-code.tar.gz \
 || (echo ":: Trying latest release as fallback ::" \
     && curl -fsSL "https://github.com/${SIN_CODE_REPO}/releases/latest/download/sin-code_linux_${ARCH}.tar.gz" \
        -o /tmp/sin-code.tar.gz) \
 && tar -xzf /tmp/sin-code.tar.gz -C /out \
 && chmod +x /out/sin-code \
 && /out/sin-code --version

# ─── 3. builder ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Required at build time so `next build` can inline them; can be empty.
ENV AI_GATEWAY_API_KEY=""
ENV SIN_CODE_BIN=/usr/local/bin/sin-code
ENV SIN_CHAT_MODEL=openai/gpt-5-mini

RUN pnpm run build

# ─── 4. runner ────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV SIN_CODE_BIN=/usr/local/bin/sin-code

# Bring the sin-code binary from the sin-code stage
COPY --from=sin-code /out/sin-code /usr/local/bin/sin-code

# Bring the Next.js standalone bundle
COPY --from=builder /app/.next/standalone ./
# Static assets must be copied manually (Next.js docs: "You should also
# copy the public and .next/static folders")
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Run as non-root
RUN useradd -m -u 1001 nextjs && chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/sin/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
